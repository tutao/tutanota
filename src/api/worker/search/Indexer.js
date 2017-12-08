//@flow
import {
	MailFolderType,
	NOTHING_INDEXED_TIMESTAMP,
	FULL_INDEXED_TIMESTAMP,
	GroupType
} from "../../common/TutanotaConstants"
import {load, loadAll, loadRange, EntityWorker} from "../EntityWorker"
import {NotAuthorizedError} from "../../common/error/RestError"
import {EntityEventBatchTypeRef} from "../../entities/sys/EntityEventBatch"
import {MailboxGroupRootTypeRef} from "../../entities/tutanota/MailboxGroupRoot"
import {MailBoxTypeRef} from "../../entities/tutanota/MailBox"
import {MailFolderTypeRef} from "../../entities/tutanota/MailFolder"
import type {DbTransaction} from "./DbFacade"
import {DbFacade, SearchIndexOS, ElementDataOS, MetaDataOS, GroupDataOS} from "./DbFacade"
import {GENERATED_MAX_ID, firstBiggerThanSecond} from "../../common/EntityFunctions"
import {tokenize} from "./Tokenizer"
import {arrayEquals} from "../../common/utils/ArrayUtils"
import {mergeMaps} from "../../common/utils/MapUtils"
import {neverNull, string} from "../../common/utils/Utils"
import {hash} from "../crypto/Sha256"
import {
	uint8ArrayToBase64,
	stringToUtf8Uint8Array,
	utf8Uint8ArrayToString,
	base64ToUint8Array
} from "../../common/utils/Encoding"
import {aes256Decrypt, IV_BYTE_LENGTH, aes256Encrypt, aes256RandomKey} from "../crypto/Aes"
import {encrypt256Key, decrypt256Key} from "../crypto/CryptoFacade"
import {random} from "../crypto/Randomizer"
import type {EntityRestClient} from "../rest/EntityRestClient"
import {encryptIndexKey, encryptSearchIndexEntry, byteLength, getAppId} from "./IndexUtils"
import type {B64EncInstanceId, SearchIndexEntry, AttributeHandler, IndexUpdate, Db, GroupData} from "./SearchTypes"
import type {WorkerImpl} from "../WorkerImpl"
import {ContactIndexer} from "./ContactIndexer"

export const Metadata = {
	userEncDbKey: "userEncDbKey",
	mailIndexingEnabled: "mailIndexingEnabled",
	excludedListIds: "excludedListIds"
}

export type InitParams = {
	user: User;
	groupKey: Aes128Key;
	userGroupId: Id;
	mailGroupIds: Id[];
	contactGroupIds: Id[];
	customerGroupId:Id;
}

const INITIAL_MAIL_INDEX_INTERVAL = 1

export class Indexer {
	db: Db;
	_entityRestClient: EntityRestClient;
	_worker: WorkerImpl;

	_initParams: InitParams;

	_indexingTime: number;
	_storageTime: number;
	_downloadingTime: number;
	_mailcount: number;
	_storedBytes: number;
	_encryptionTime: number;
	_writeRequests: number;
	_largestColumn: number;
	_words: number;
	_indexedBytes: number;

	// Metadata
	_mailIndexingEnabled: boolean;
	_excludedListIds: Id[];


	mailboxIndexingPromise: Promise<void>;
	currentIndexTimestamp: number;
	_indexingCancelled: boolean;

	_contactIndexer: ContactIndexer;


	constructor(entityRestClient: EntityRestClient, worker: WorkerImpl) {
		this.db = ({}:any) // correctly initialized during init()
		this._entityRestClient = entityRestClient
		this._excludedListIds = []
		this._mailIndexingEnabled = false
		this._worker = worker
		this.mailboxIndexingPromise = Promise.resolve()
		this.currentIndexTimestamp = NOTHING_INDEXED_TIMESTAMP
		this._indexingCancelled = false
		this._contactIndexer = new ContactIndexer(this, this.db, new EntityWorker())
	}


	open(user: User) {
		return new DbFacade().open(uint8ArrayToBase64(hash(stringToUtf8Uint8Array(user._id)))).then(facade => {
			this.db.dbFacade = facade
			let dbInit = (): Promise<void> => {
				let t = this.db.dbFacade.createTransaction(true, [MetaDataOS])
				return t.get(MetaDataOS, Metadata.userEncDbKey).then(userEncDbKey => {
					if (!userEncDbKey) {
						return this._loadGroupData(mailGroupIds, contactGroupIds, customerGroupId).then((groupBatches: {groupId: Id, groupData: GroupData}[]) => {
							let t2 = this.db.dbFacade.createTransaction(false, [MetaDataOS, GroupDataOS])
							this.db.key = aes256RandomKey()
							t2.put(MetaDataOS, Metadata.userEncDbKey, encrypt256Key(groupKey, this.db.key))
							t2.put(MetaDataOS, Metadata.mailIndexingEnabled, this._mailIndexingEnabled)
							return this._initGroupData(groupBatches, t2)
								.then(() => this._contactIndexer.indexFullContactList(userGroupId))
								.then(() => this._groupInfo.indexAllUserAndTeamGroupInfosForAdmin())
						})
					} else {
						this.db.key = decrypt256Key(groupKey, userEncDbKey)
						return Promise.all([
							t.get(MetaDataOS, Metadata.mailIndexingEnabled).then(mailIndexingEnabled => {
								this._mailIndexingEnabled = mailIndexingEnabled
							}),
							t.get(MetaDataOS, Metadata.excludedListIds).then(mailIndexingEnabled => {
								this._excludedListIds = mailIndexingEnabled
							}),
							this._updateGroups(mailGroupIds, contactGroupIds, customerGroupId).then(() => this.updateCurrentIndexTimestamp()),
						]).return()
					}
				})
			}
			return dbInit().then(() => {
				this._worker.sendIndexState({
					mailIndexEnabled: this._mailIndexingEnabled,
					progress: 0,
					currentIndexTimestamp: this.currentIndexTimestamp
				})
				return this._loadNewEntities(mailGroupIds.concat(contactGroupIds))
			})
		})
	}


	/**
	 * creates the initial group data for all provided group ids
	 */
	_initGroupData(groupBatches: {groupId: Id, groupData: GroupData}[], t2: DbTransaction): Promise<void> {
		groupBatches.forEach(groupIdToLastBatchId => {
			t2.put(GroupDataOS, groupIdToLastBatchId.groupId, groupIdToLastBatchId.groupData)
		})
		return t2.await()
	}

	_groupDiff(memberships: GroupMembership[]): Promise<{groupsToDelete: Id[], newGroups: Id[]}> {
		let groupIds = memberships.filter(m => m.groupType == GroupType.Mail || m.groupType == GroupType.Contact || m.groupType == GroupType.Customer).map(m => m.group)
		let t = this.db.dbFacade.createTransaction(true, [GroupDataOS])
		return t.getAllKeys(GroupDataOS).then(oldGroupIds => {
			let deletedGroupIds = oldGroupIds.filter(groupId => groupIds.indexOf(string(groupId)) === -1)
			let newGroupIds = groupIds.filter(groupId => oldGroupIds.indexOf(groupId) === -1)
			return Promise.filter(deletedGroupIds, groupId => t.get(GroupDataOS, groupId).then((groupData: GroupData) => {
				return groupData.groupType === GroupType.Mail || groupData.groupType === GroupType.Contact
			})).then(groupsToDelete => {
				return {newGroupIds, groupsToDelete}
			})
		})
	}

	_updateGroups(groupDiff: {groupsToDelete: Id[], newGroups: Id[]}) {
		if (groupDiff.groupsToDelete.length > 0) {
			return this.disableMailIndexing()
		} else if (groupDiff.newGroups.length > 0) {
			return this._loadGroupData(mailGroupIds, contactGroupIds, customerGroupId).then((groupBatches: {groupId: Id, groupData: GroupData}[]) => {
				let t = this.db.dbFacade.createTransaction(false, [GroupDataOS])
				return this._initGroupData(groupBatches, t).then(() => {
					let newMailGroupIds = groupDiff.newGroups.filter(groupId => mailGroupIds.indexOf(groupId) !== -1)
					if (newMailGroupIds && this._mailIndexingEnabled) {
						this.mailboxIndexingPromise.then(() => this.indexMailbox(this.currentIndexTimestamp))
					}
				})
			})
		}

	}

	updateCurrentIndexTimestamp(): Promise<void> {
		let t = this.db.dbFacade.createTransaction(true, [GroupDataOS])
		this.currentIndexTimestamp = FULL_INDEXED_TIMESTAMP
		return Promise.map(this._initParams.mailGroupIds, (mailGroupId) => {
			return t.get(GroupDataOS, mailGroupId).then((groupData: GroupData) => {
				if (groupData.indexTimestamp > this.currentIndexTimestamp) { // find the newest timestamp
					this.currentIndexTimestamp = groupData.indexTimestamp
				}
			})
		}).return()
	}

	_loadGroupData(mailGroupIds: Id[], contactGroupIds: Id[], customerGroupId: Id): Promise<{groupId: Id, groupData: GroupData}[]> {
		let groupIds = mailGroupIds.concat(contactGroupIds).concat([customerGroupId])
		return Promise.map(groupIds, groupId => {
			let groupType = GroupType.Customer
			if (mailGroupIds.indexOf(groupId) !== -1) {
				groupType = GroupType.Mail
			} else if (contactGroupIds.indexOf(groupId) !== -1) {
				groupType = GroupType.Contact
			}
			return loadRange(EntityEventBatchTypeRef, groupId, GENERATED_MAX_ID, 100, true).then(eventBatches => {
				return {
					groupId,
					groupData: {
						lastBatchIds: eventBatches.map(eventBatch => eventBatch._id[1]),
						indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
						excludedListIds: [],
						groupType: groupType
					}
				}
			})
		}).catch(NotAuthorizedError, e => {
			console.log("could not download entity updates => lost permission on list")
			return []
		})
	}

	_loadNewEntities(groupIds: Id[]): Promise<void> {
		let t = this.db.dbFacade.createTransaction(true, [GroupDataOS])
		let groupIdToEventBatches: {groupId:Id, eventBatchIds:Id[]}[] = []
		groupIds.forEach(groupId => {
			return t.get(GroupDataOS, groupId).then(groupData => {
				groupIdToEventBatches.push({
					groupId,
					eventBatchIds: groupData.lastBatchIds
				})
			})
		})
		return t.await().then(() => {
			return Promise.map(groupIdToEventBatches, (groupIdToEventBatch) => {
				if (groupIdToEventBatch.eventBatchIds.length > 0) {
					let startId = groupIdToEventBatch.eventBatchIds[groupIdToEventBatch.eventBatchIds.length - 1] // start from lowest id
					return loadAll(EntityEventBatchTypeRef, groupIdToEventBatch.groupId, startId).then(eventBatches => {
						return Promise.map(eventBatches, batch => {
							if (groupIdToEventBatch.eventBatchIds.indexOf(batch._id[1]) == -1) {
								return this.processEntityEvents(batch.events, groupIdToEventBatch.groupId, batch._id[1])
							}
						}, {concurrency: 5})
					}).catch(NotAuthorizedError, e => {
						console.log("could not download entity updates => lost permission on list")
					})
				}
			}, {concurrency: 1})
		}).return()
	}


	createIndexEntriesForAttributes(model: TypeModel, instance: Object, attributes: AttributeHandler[]): Map<string, SearchIndexEntry[]> {
		let indexEntries: Map<string, SearchIndexEntry>[] = attributes.map(attributeHandler => {
			let value = attributeHandler.value()
			let tokens = tokenize(value)
			this._indexedBytes += byteLength(value)
			let attributeKeyToIndexMap: Map<string, SearchIndexEntry> = new Map()
			for (let index = 0; index < tokens.length; index++) {
				let token = tokens[index]
				if (!attributeKeyToIndexMap.has(token)) {
					attributeKeyToIndexMap.set(token, {
						id: instance._id instanceof Array ? instance._id[1] : instance._id,
						app: getAppId(instance._type),
						type: model.id,
						attribute: attributeHandler.attribute.id,
						positions: [index]
					})
				} else {
					neverNull(attributeKeyToIndexMap.get(token)).positions.push(index)
				}
			}
			return attributeKeyToIndexMap
		})
		return mergeMaps(indexEntries)
	}

	encryptSearchIndexEntries(id: IdTuple, ownerGroup: Id, keyToIndexEntries: Map<string, SearchIndexEntry[]>, indexUpdate: IndexUpdate): void {
		let listId = id[0]
		let encryptedInstanceId = encryptIndexKey(this.db.key, id[1])
		let b64InstanceId = uint8ArrayToBase64(encryptedInstanceId)

		let encryptionTimeStart = performance.now()
		let words = []
		keyToIndexEntries.forEach((value, indexKey) => {
			let encIndexKey = encryptIndexKey(this.db.key, indexKey)
			let b64IndexKey = uint8ArrayToBase64(encIndexKey)
			let indexEntries = indexUpdate.create.indexMap.get(b64IndexKey)
			words.push(indexKey)
			if (!indexEntries) {
				indexEntries = []
			}
			indexUpdate.create.indexMap.set(b64IndexKey, indexEntries.concat(value.map(indexEntry => encryptSearchIndexEntry(this.db.key, indexEntry, encryptedInstanceId))))
		})

		indexUpdate.create.encInstanceIdToElementData.set(b64InstanceId, [
			listId,
			aes256Encrypt(this.db.key, stringToUtf8Uint8Array(words.join(" ")), random.generateRandomData(IV_BYTE_LENGTH), true, false),
			ownerGroup
		])

		this._encryptionTime += performance.now() - encryptionTimeStart
	}

	_printStatus() {
		console.log("mail count", this._mailcount, "indexing time", this._indexingTime, "storageTime", this._storageTime, "downloading time", this._downloadingTime, "encryption time", this._encryptionTime, "total time", this._indexingTime + this._storageTime + this._downloadingTime + this._encryptionTime, "stored bytes", this._storedBytes, "writeRequests", this._writeRequests, "largestColumn", this._largestColumn, "words", this._words, "indexedBytes", this._indexedBytes)
	}

	_writeIndexUpdate(indexUpdate: IndexUpdate): Promise<void> {
		let startTimeStorage = performance.now()
		let keysToUpdate: {[B64EncInstanceId]:boolean} = {}
		let transaction = this.db.dbFacade.createTransaction(false, [SearchIndexOS, ElementDataOS, MetaDataOS, GroupDataOS])

		// move instances
		let promises = indexUpdate.move.map(moveInstance => {
			return transaction.get(ElementDataOS, moveInstance.encInstanceId).then(elementData => {
				elementData[0] = moveInstance.newListId
				transaction.put(ElementDataOS, moveInstance.encInstanceId, elementData)
			})
		})

		// delete
		promises = promises.concat(Promise.all(Array.from(indexUpdate.delete.encWordToEncInstanceIds).map(([encWord, encInstanceIds]) => {
			return transaction.getAsList(SearchIndexOS, encWord).then(encryptedSearchIndexEntries => {
				let newEntries = encryptedSearchIndexEntries.filter(e => encInstanceIds.find(encInstanceId => arrayEquals(e[0], encInstanceId)) == null)
				if (newEntries.length > 0) {
					return transaction.put(SearchIndexOS, encWord, newEntries)
				} else {
					transaction.delete(SearchIndexOS, encWord)
				}
			})
		}))).concat(indexUpdate.delete.encInstanceIds.map(encInstanceId => transaction.delete(ElementDataOS, encInstanceId)))

		// insert element data for new elements
		indexUpdate.create.encInstanceIdToElementData.forEach((elementData, b64EncInstanceId) => {
			promises.push(transaction.get(ElementDataOS, b64EncInstanceId).then(result => {
				if (!result) { // only add the element to the index if it has not been indexed before
					this._writeRequests += 1
					let encInstanceId = base64ToUint8Array(b64EncInstanceId)
					this._storedBytes += encInstanceId.length + elementData[0].length + elementData[1].length
					keysToUpdate[b64EncInstanceId] = true
					transaction.put(ElementDataOS, encInstanceId, elementData)
				}
			}))
		})

		return Promise.all(promises).then(() => {
			// insert index entries for new elements
			indexUpdate.create.indexMap.forEach((encryptedEntries, b64EncIndexKey) => {
				let filteredEncryptedEntries = encryptedEntries.filter(entry => keysToUpdate[uint8ArrayToBase64((entry:any)[0])] == true)
				let encIndexKey = base64ToUint8Array(b64EncIndexKey)
				if (filteredEncryptedEntries.length > 0) {
					transaction.get(SearchIndexOS, encIndexKey).then((result) => {
						this._writeRequests += 1
						let value
						if (result && result.length > 0) {
							value = result
						} else {
							this._storedBytes += encIndexKey.length
							value = []
							this._words += 1
						}
						value = value.concat(filteredEncryptedEntries)
						this._largestColumn = value.length > this._largestColumn ? value.length : this._largestColumn
						this._storedBytes += filteredEncryptedEntries.reduce((sum, e) => (sum + (e:any)[0].length + (e:any)[1].length), 0)
						return transaction.put(SearchIndexOS, encIndexKey, value)
					})
				}
			})
			if (indexUpdate.batchId || indexUpdate.indexTimestamp) {
				// update group data
				transaction.get(GroupDataOS, indexUpdate.groupId).then((groupData: GroupData) => {

					if (indexUpdate.indexTimestamp != null) {
						groupData.indexTimestamp = indexUpdate.indexTimestamp
					}

					if (indexUpdate.batchId) {
						let batchId = indexUpdate.batchId
						if (groupData.lastBatchIds.length > 0 && groupData.lastBatchIds.indexOf(batchId[1]) !== -1) { // concurrent indexing (multiple tabs)
							transaction.abort()
						} else {
							let newIndex = groupData.lastBatchIds.findIndex(indexedBatchId => firstBiggerThanSecond(batchId[1], indexedBatchId))
							if (newIndex !== -1) {
								groupData.lastBatchIds.splice(newIndex, 0, batchId[1])
							} else {
								groupData.lastBatchIds.push(batchId[1]) // new batch is oldest of all stored batches
							}
							if (groupData.lastBatchIds.length > 1000) {
								groupData.lastBatchIds = groupData.lastBatchIds.slice(0, 1000)
							}
						}
					}

					if (!transaction.aborted) {
						transaction.put(GroupDataOS, indexUpdate.groupId, groupData)
					}

				})
			}

			return transaction.await().then(() => {
				this._storageTime += (performance.now() - startTimeStorage)
			})
		})
	}


	_processDeleted(event: EntityUpdate, indexUpdate: IndexUpdate) {
		let encInstanceId = encryptIndexKey(this.db.key, event.instanceId)
		let transaction = this.db.dbFacade.createTransaction(true, [ElementDataOS])
		return transaction.get(ElementDataOS, encInstanceId).then(elementData => {
			if (!elementData) {
				console.log("index data not available (instance is not indexed)", encInstanceId, event.instanceId)
				return
			}
			let words = utf8Uint8ArrayToString(aes256Decrypt(this.db.key, elementData[1], true)).split(" ")
			let encWords = words.map(word => encryptIndexKey(this.db.key, word))
			encWords.map(encWord => {
				let ids = indexUpdate.delete.encWordToEncInstanceIds.get(encWord)
				if (ids == null) {
					ids = []
				}
				ids.push(encInstanceId)
				indexUpdate.delete.encWordToEncInstanceIds.set(encWord, ids)
			})
			indexUpdate.delete.encInstanceIds.push(encInstanceId)
		})
	}

	_isExcluded(event: EntityUpdate) {
		return this._excludedListIds.indexOf(event.instanceListId) !== -1
	}


}

function containsEventOfType(events: EntityUpdate[], type: OperationTypeEnum, elementId: Id): boolean {
	return events.filter(event => event.operation == type && event.instanceId == elementId).length > 0 ? true : false
}


function getSpamFolder(mailGroupId: Id): Promise<MailFolder> {
	return load(MailboxGroupRootTypeRef, mailGroupId).then(mailGroupRoot => load(MailBoxTypeRef, mailGroupRoot.mailbox)).then(mbox => {
		return loadAll(MailFolderTypeRef, neverNull(mbox.systemFolders).folders).then(folders => neverNull(folders.find(folder => folder.folderType === MailFolderType.SPAM)))
	})
}