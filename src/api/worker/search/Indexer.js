//@flow
import {OperationType, MailState, MailFolderType} from "../../common/TutanotaConstants"
import {load, loadAll, loadRoot, loadRange} from "../EntityWorker"
import {MailBodyTypeRef} from "../../entities/tutanota/MailBody"
import {ContactListTypeRef} from "../../entities/tutanota/ContactList"
import {NotFoundError} from "../../common/error/RestError"
import {EntityEventBatchTypeRef} from "../../entities/sys/EntityEventBatch"
import {MailboxGroupRootTypeRef} from "../../entities/tutanota/MailboxGroupRoot"
import {MailBoxTypeRef} from "../../entities/tutanota/MailBox"
import {MailFolderTypeRef} from "../../entities/tutanota/MailFolder"
import {MailTypeRef, _TypeModel as MailModel} from "../../entities/tutanota/Mail"
import {_TypeModel as ContactModel, ContactTypeRef} from "../../entities/tutanota/Contact"
import {_TypeModel as GroupInfoModel, GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import {DbFacade, SearchIndexOS, ElementIdToIndexDataOS, MetaDataOS, GroupIdToBatchIdsOS} from "./DbFacade"
import {
	isSameTypeRef,
	TypeRef,
	GENERATED_MAX_ID,
	_loadEntityRange,
	_loadEntity,
	firstBiggerThanSecond,
	isSameId
} from "../../common/EntityFunctions"
import {tokenize} from "./Tokenizer"
import {arrayEquals} from "../../common/utils/ArrayUtils"
import {neverNull} from "../../common/utils/Utils"
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
import {encryptIndexKey, encryptSearchIndexEntry} from "./IndexUtils"
import type {B64EncInstanceId, SearchIndexEntry, AttributeHandler, IndexUpdate, Db} from "./SearchTypes"
import {_createNewIndexUpdate} from "./SearchTypes"
import type {WorkerImpl} from "../WorkerImpl"
import {CustomerTypeRef} from "../../entities/sys/Customer"
import {UserTypeRef} from "../../entities/sys/User"

const Metadata = {
	userEncDbKey: "userEncDbKey",
	oldestIndexedMailId: "oldestIndexedMailId",
	mailIndexingEnabled: "mailIndexingEnabled",
	indexedContactLists: "indexedContactLists",
	excludedListIds: "excludedListIds"
}

type InitParams = {
	user: User;
	groupKey: Aes128Key;
	userGroupId: Id;
	mailGroupIds: Id[];
	contactGroupIds: Id[];
}

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
	//
	mailboxIndexingPromise: Promise<void>;

	constructor(entityRestClient: EntityRestClient, worker: WorkerImpl) {
		this.db = ({}:any) // correctly initialized during init()
		this._entityRestClient = entityRestClient
		this._excludedListIds = []
		this._mailIndexingEnabled = false
		this._worker = worker
		this.mailboxIndexingPromise = Promise.resolve()
	}

	/**
	 * FIXME Write noop ENTITY_EVENT_BATCH on the server every twenty days (not once a month because of months with 31 days) to prevent
	 * OutOfSync errors one of the groups of a user has not received a single update (e.g. contacts not updated within last month).
	 * The noop ENTITY_EVENT_BATCH must be written for each area group.
	 *
	 * FIXME user added to group / removed from group
	 */
	init(user: User, groupKey: Aes128Key, userGroupId: Id, mailGroupIds: Id[], contactGroupIds: Id[]): Promise<void> {
		this._initParams = {
			user,
			groupKey,
			userGroupId,
			mailGroupIds,
			contactGroupIds
		}
		return new DbFacade().open(uint8ArrayToBase64(hash(stringToUtf8Uint8Array(user._id)))).then(facade => {
			this.db.dbFacade = facade
			let dbInit = (): Promise<void> => {
				let t = this.db.dbFacade.createTransaction(true, [MetaDataOS])
				return t.get(MetaDataOS, Metadata.userEncDbKey).then(value => {
					if (!value) {
						return this._loadLastBatchIds(mailGroupIds.concat(contactGroupIds)).then((groupBatches: {groupId: Id, lastBatchIds: Id[]}[]) => {
							let t2 = this.db.dbFacade.createTransaction(false, [MetaDataOS, GroupIdToBatchIdsOS])
							this.db.key = aes256RandomKey()
							t2.put(MetaDataOS, Metadata.userEncDbKey, encrypt256Key(groupKey, this.db.key))
							t2.put(MetaDataOS, Metadata.oldestIndexedMailId, {}) // mailGroup:ID
							t2.put(MetaDataOS, Metadata.indexedContactLists, []) // contact list ids
							t2.put(MetaDataOS, Metadata.mailIndexingEnabled, this._mailIndexingEnabled)
							t2.put(MetaDataOS, Metadata.excludedListIds, this._excludedListIds)
							groupBatches.forEach(groupIdToLastBatchId => {
								t2.put(GroupIdToBatchIdsOS, groupIdToLastBatchId.groupId, groupIdToLastBatchId.lastBatchIds)
							})
							return t2.await().then(() => this.indexFullContactList(userGroupId))
						})
					} else {
						this.db.key = decrypt256Key(groupKey, value)
						t.get(MetaDataOS, Metadata.mailIndexingEnabled).then(mailIndexingEnabled => {
							this._mailIndexingEnabled = mailIndexingEnabled
						})
						t.get(MetaDataOS, Metadata.excludedListIds).then(mailIndexingEnabled => {
							this._excludedListIds = mailIndexingEnabled
						})
						return t.await()
					}
				})
			}
			return dbInit().then(() => {
				this._worker.sendIndexState({
					mailIndexEnabled: this._mailIndexingEnabled,
					progress: 0
				})
				return this._loadNewEntities(mailGroupIds.concat(contactGroupIds))
			})
		})
	}

	_loadLastBatchIds(groupIds: Id[]): Promise< {groupId: Id, lastBatchIds: Id[]}[]> {
		return Promise.map(groupIds, groupId => {
			return loadRange(EntityEventBatchTypeRef, groupId, GENERATED_MAX_ID, 100, true).then(eventBatches => {
				return {groupId, lastBatchIds: eventBatches.map(eventBatch => eventBatch._id[1])}
			})
		})
	}

	_loadNewEntities(groupIds: Id[]): Promise<void> {
		let t = this.db.dbFacade.createTransaction(true, [GroupIdToBatchIdsOS])
		let groupIdToEventBatches: {groupId:Id, eventBatchIds:Id[]}[] = []
		groupIds.forEach(groupId => {
			t.get(GroupIdToBatchIdsOS, groupId).then(lastEventBatchIds => {
				groupIdToEventBatches.push({
					groupId,
					eventBatchIds: lastEventBatchIds
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
					})
				}
			}, {concurrency: 1})
		}).return()
	}


	_createContactIndexEntries(contact: Contact, indexUpdate: IndexUpdate): void {
		let encryptedInstanceId = encryptIndexKey(this.db.key, contact._id[1])

		let keyToIndexEntries = this.createIndexEntriesForAttributes(ContactModel, contact, [
			{
				attribute: ContactModel.values["firstName"],
				value: () => contact.firstName
			}, {
				attribute: ContactModel.values["lastName"],
				value: () => contact.lastName,
			}, {
				attribute: ContactModel.values["nickname"],
				value: () => contact.nickname,
			}, {
				attribute: ContactModel.values["role"],
				value: () => contact.role,
			}, {
				attribute: ContactModel.values["title"],
				value: () => contact.title,
			}, {
				attribute: ContactModel.values["comment"],
				value: () => contact.comment,
			}, {
				attribute: ContactModel.values["company"],
				value: () => contact.company,
			}, {
				attribute: ContactModel.associations["addresses"],
				value: () => contact.addresses.map((a) => a.address).join(","),
			}, {
				attribute: ContactModel.associations["mailAddresses"],
				value: () => contact.mailAddresses.map(cma => cma.address).join(","),
			}, {
				attribute: ContactModel.associations["phoneNumbers"],
				value: () => contact.phoneNumbers.map(pn => pn.number).join(","),
			}, {
				attribute: ContactModel.associations["socialIds"],
				value: () => contact.socialIds.map(s => s.socialId).join(","),
			}])


		this.encryptSearchIndexEntries(encryptedInstanceId, keyToIndexEntries, indexUpdate, contact._id[0])
	}

	_createMailIndexEntries(mail: Mail, mailBody: MailBody, indexUpdate: IndexUpdate): void {
		let encryptedInstanceId = encryptIndexKey(this.db.key, mail._id[1])
		let startTimeIndex = performance.now()
		let keyToIndexEntries = this.createIndexEntriesForAttributes(MailModel, mail, [
			{
				attribute: MailModel.values["subject"],
				value: () => mail.subject
			}, {
				attribute: MailModel.associations["toRecipients"],
				value: () => mail.toRecipients.map(r => r.name + " <" + r.address + ">").join(","),
			}, {
				attribute: MailModel.associations["ccRecipients"],
				value: () => mail.ccRecipients.map(r => r.name + " <" + r.address + ">").join(","),
			}, {
				attribute: MailModel.associations["bccRecipients"],
				value: () => mail.bccRecipients.map(r => r.name + " <" + r.address + ">").join(","),
			}, {
				attribute: MailModel.associations["sender"],
				value: () => mail.sender ? (mail.sender.name + " <" + mail.sender.address + ">") : "",
			}, {
				attribute: MailModel.associations["body"],
				value: () => htmlToText(mailBody.text)
			}])
		this._indexingTime += (performance.now() - startTimeIndex)

		this.encryptSearchIndexEntries(encryptedInstanceId, keyToIndexEntries, indexUpdate, mail._id[0])
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

	encryptSearchIndexEntries(encryptedInstanceId: Uint8Array, keyToIndexEntries: Map<string, SearchIndexEntry[]>, indexUpdate: IndexUpdate, listId: Id): void {
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

		indexUpdate.create.encInstanceIdToIndexData.set(b64InstanceId, [
			listId,
			aes256Encrypt(this.db.key, stringToUtf8Uint8Array(words.join(" ")), random.generateRandomData(IV_BYTE_LENGTH), true, false)
		])

		this._encryptionTime += performance.now() - encryptionTimeStart
	}

	getSpamFolder(mailGroupId: Id): Promise<MailFolder> {
		return load(MailboxGroupRootTypeRef, mailGroupId).then(mailGroupRoot => load(MailBoxTypeRef, mailGroupRoot.mailbox)).then(mbox => {
			return loadAll(MailFolderTypeRef, neverNull(mbox.systemFolders).folders).then(folders => neverNull(folders.find(folder => folder.folderType === MailFolderType.SPAM)))
		})
	}

	enableMailIndexing(): Promise<void> {
		let t = this.db.dbFacade.createTransaction(true, [MetaDataOS])
		return t.get(MetaDataOS, Metadata.mailIndexingEnabled).then(enabled => {
			if (!enabled) {
				return Promise.map(this._initParams.mailGroupIds, (mailGroup) => this.getSpamFolder(mailGroup)).then(spamFolders => {
					this._excludedListIds = spamFolders.map(folder => folder.mails)
					this._mailIndexingEnabled = true
					let t2 = this.db.dbFacade.createTransaction(false, [MetaDataOS])
					t2.put(MetaDataOS, Metadata.mailIndexingEnabled, true)
					t2.put(MetaDataOS, Metadata.excludedListIds, this._excludedListIds)
					this.indexFullMailbox() // create index in background
					return t2.await().then(() => {
						return this._worker.sendIndexState({
							mailIndexEnabled: this._mailIndexingEnabled,
							progress: 0
						})
					})
				})
			} else {
				return t.get(MetaDataOS, Metadata.excludedListIds).then(excludedListIds => {
					this._mailIndexingEnabled = true
					this._excludedListIds = excludedListIds

					return this._worker.sendIndexState({
						mailIndexEnabled: this._mailIndexingEnabled,
						progress: 0
					})
				})
			}
		})
	}


	disableMailIndexing(): Promise<void> {
		this._mailIndexingEnabled = false
		this._excludedListIds = []
		this.db.dbFacade.deleteDatabase()
		return this.init(this._initParams.user, this._initParams.groupKey, this._initParams.userGroupId, this._initParams.mailGroupIds, this._initParams.contactGroupIds)
	}

	indexFullMailbox(): Promise<void> {
		this._indexingTime = 0
		this._storageTime = 0
		this._downloadingTime = 0
		this._mailcount = 0
		this._storedBytes = 0
		this._encryptionTime = 0
		this._writeRequests = 0
		this._largestColumn = 0
		this._words = 0
		this._indexedBytes = 0
		this.mailboxIndexingPromise = Promise.each(this._initParams.mailGroupIds, (mailGroupId) => {
			//return Promise.delay(10000).then(() => {
			return load(MailboxGroupRootTypeRef, mailGroupId).then(mailGroupRoot => load(MailBoxTypeRef, mailGroupRoot.mailbox)).then(mbox => {
				return this._loadMailListIds(neverNull(mbox.systemFolders).folders).each(mailListId => {
					return this._indexMailList(mailListId, GENERATED_MAX_ID)
				})
			})
			//})
		}).then(() => {
			this._printStatus()
			console.log("finished indexing")
		})
		return this.mailboxIndexingPromise.return()
	}

	_printStatus() {
		console.log("mail count", this._mailcount, "indexing time", this._indexingTime, "storageTime", this._storageTime, "downloading time", this._downloadingTime, "encryption time", this._encryptionTime, "total time", this._indexingTime + this._storageTime + this._downloadingTime + this._encryptionTime, "stored bytes", this._storedBytes, "writeRequests", this._writeRequests, "largestColumn", this._largestColumn, "words", this._words, "indexedBytes", this._indexedBytes)
	}

	_indexMailList(mailListId: Id, startId: Id): Promise <void> {
		let startTimeLoad = performance.now()
		return _loadEntityRange(MailTypeRef, mailListId, startId, 500, true, this._entityRestClient).then(mails => {
			return Promise.map(mails, mail => {
				return _loadEntity(MailBodyTypeRef, mail.body, null, this._entityRestClient).then(body => {
					return {mail, body}
				})
			}, {concurrency: 5}).then((mailAndBodies: {mail:Mail, body:MailBody}[]) => {
				let indexUpdate = _createNewIndexUpdate()
				this._downloadingTime += (performance.now() - startTimeLoad)
				this._mailcount += mailAndBodies.length
				return Promise.each(mailAndBodies, element => {
					this._createMailIndexEntries(element.mail, element.body, indexUpdate)
				}).then(() => this._writeIndexUpdate(indexUpdate))
			}).return(mails)
		}).then((mails) => {
			if (mails.length === 500) {
				console.log("completed indexing range from", startId, "of mail list id", mailListId)
				this._printStatus()
				return this._indexMailList(mailListId, mails[mails.length - 1]._id[1])
			} else {
				console.log("completed indexing of mail list id", mailListId)
				this._printStatus()
			}
		})
	}

	_loadMailListIds(folderListId: Id): Promise < Id[] > {
		let mailListIds = []
		return loadAll(MailFolderTypeRef, folderListId).map(folder => {
			mailListIds.push(folder.mails)
			return loadAll(MailFolderTypeRef, folder.subFolders).map(folder => {
				mailListIds.push(folder.mails)
			})
		}).then(() => mailListIds)
	}

	indexFullContactList(userGroupId: Id): Promise < void > {
		return loadRoot(ContactListTypeRef, userGroupId).then((contactList: ContactList) => {
			let t = this.db.dbFacade.createTransaction(true, [MetaDataOS])
			let indexUpdate = _createNewIndexUpdate()
			return t.get(MetaDataOS, Metadata.indexedContactLists).then(indexedContactLists => {
				if (indexedContactLists.indexOf(contactList.contacts) === -1) {
					return loadAll(ContactTypeRef, contactList.contacts).then(contacts => {
						contacts.forEach((contact) => this._createContactIndexEntries(contact, indexUpdate))
						indexUpdate.contactListId = contactList.contacts
						return this._writeIndexUpdate(indexUpdate)
					})
				}
			})
		}).catch(NotFoundError, e => {
			// external users have no contact list.
			return Promise.resolve()
		})
	}

	_writeIndexUpdate(indexUpdate: IndexUpdate): Promise<void> {
		let startTimeStorage = performance.now()
		let keysToUpdate: {[B64EncInstanceId]:boolean} = {}
		let transaction = this.db.dbFacade.createTransaction(false, [SearchIndexOS, ElementIdToIndexDataOS, MetaDataOS, GroupIdToBatchIdsOS])

		let promises = indexUpdate.move.map(moveInstance => {
			return transaction.get(ElementIdToIndexDataOS, moveInstance.encInstanceId).then(indexData => {
				indexData[0] = moveInstance.newListId
				transaction.put(ElementIdToIndexDataOS, moveInstance.encInstanceId, indexData)
			});
		})

		promises = promises.concat(Promise.all(Array.from(indexUpdate.delete.encWordToEncInstanceIds).map(([encWord, encInstanceIds]) => {
			return transaction.getAsList(SearchIndexOS, encWord).then(encryptedSearchIndexEntries => {
				let newEntries = encryptedSearchIndexEntries.filter(e => encInstanceIds.find(encInstanceId => arrayEquals(e[0], encInstanceId)) == null)
				if (newEntries.length > 0) {
					return transaction.put(SearchIndexOS, encWord, newEntries)
				} else {
					transaction.delete(SearchIndexOS, encWord)
				}
			})
		}))).concat(indexUpdate.delete.encInstanceIds.map(encInstanceId => transaction.delete(ElementIdToIndexDataOS, encInstanceId)))


		indexUpdate.create.encInstanceIdToIndexData.forEach((indexData, b64EncInstanceId) => {
			promises.push(transaction.get(ElementIdToIndexDataOS, b64EncInstanceId).then(result => {
				if (!result) { // only add the element to the index if it has not been indexed before
					this._writeRequests += 1
					let encInstanceId = base64ToUint8Array(b64EncInstanceId)
					this._storedBytes += encInstanceId.length + indexData[0].length + indexData[1].length
					keysToUpdate[b64EncInstanceId] = true
					transaction.put(ElementIdToIndexDataOS, encInstanceId, indexData)
				}
			}))
		})

		return Promise.all(promises).then(() => {
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
			if (indexUpdate.batchId) {
				let batchId = indexUpdate.batchId
				transaction.getAsList(GroupIdToBatchIdsOS, batchId[0]).then(lastEntityBatchIds => {
					if (lastEntityBatchIds.length > 0 && lastEntityBatchIds.indexOf(batchId[1]) !== -1) { // concurrent indexing (multiple tabs)
						transaction.abort()
					} else {
						let newIndex = lastEntityBatchIds.findIndex(indexedBatchId => firstBiggerThanSecond(batchId[1], indexedBatchId))
						if (newIndex !== -1) {
							lastEntityBatchIds.splice(newIndex, 0, batchId[1])
						} else {
							lastEntityBatchIds.push(batchId[1]) // new batch is oldest of all stored batches
						}
						if (lastEntityBatchIds.length > 1000) {
							lastEntityBatchIds = lastEntityBatchIds.slice(0, 1000)
						}
						transaction.put(GroupIdToBatchIdsOS, batchId[0], lastEntityBatchIds)
					}
				})
			}
			if (indexUpdate.contactListId && !transaction.aborted) {
				transaction.get(MetaDataOS, Metadata.indexedContactLists).then(contactLists => {
					contactLists.push(indexUpdate.contactListId)
					transaction.put(MetaDataOS, Metadata.indexedContactLists, contactLists)
				})
			}
			return transaction.await().then(() => {
				this._storageTime += (performance.now() - startTimeStorage)
			})
		})
	}

	processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id): Promise<void> {
		let indexUpdate = _createNewIndexUpdate()
		indexUpdate.batchId = [groupId, batchId]
		return Promise.each(events, (event, index) => {
			if (isSameTypeRef(new TypeRef(event.application, event.type), MailTypeRef) && this._mailIndexingEnabled) {
				if (event.operation == OperationType.CREATE) {
					if (containsEventOfType(events, OperationType.DELETE, event.instanceId)) {
						// move mail
						return this._processMovedMail(event, indexUpdate)
					} else {
						// new mail
						// FIXME ignore mails in trash folder and SPAM folder
						return this._processNewMail(event, indexUpdate)
					}
				} else if (event.operation == OperationType.UPDATE) {
					return load(MailTypeRef, [event.instanceListId, event.instanceId]).then(mail => {
						if (mail.state == MailState.DRAFT) {
							return Promise.all([
								this._processDeleted(event, indexUpdate),
								this._processNewMail(event, indexUpdate)
							])
						}
					}).catch(NotFoundError, () => console.log("tried to index update event for non existing mail"))
				} else if (event.operation == OperationType.DELETE) {
					if (!containsEventOfType(events, OperationType.CREATE, event.instanceId)) { // move events are handled separately
						return this._processDeleted(event, indexUpdate)
					}
				}
			} else if (isSameTypeRef(new TypeRef(event.application, event.type), ContactTypeRef)) {
				if (event.operation == OperationType.CREATE) {
					return this._processNewContact(event, indexUpdate)
				} else if (event.operation == OperationType.UPDATE) {
					return Promise.all([
						this._processDeleted(event, indexUpdate),
						this._processNewContact(event, indexUpdate)
					])
				} else if (event.operation == OperationType.DELETE) {
					return this._processDeleted(event, indexUpdate)
				}
			} else if (isSameTypeRef(new TypeRef(event.application, event.type), GroupInfoTypeRef) && this._userIsAdmin()) {
				if (event.operation == OperationType.CREATE) {
					return this._processNewGroupInfo(event, indexUpdate)
				} else if (event.operation == OperationType.UPDATE) {
					return Promise.all([
						this._processDeleted(event, indexUpdate),
						this._processNewGroupInfo(event, indexUpdate)
					])
				} else if (event.operation == OperationType.DELETE) {
					return this._processDeleted(event, indexUpdate)
				}
			} else if (event.operation == OperationType.UPDATE && isSameTypeRef(new TypeRef(event.application, event.type), UserTypeRef) && isSameId(this._initParams.user._id, event.instanceId)) {
				return load(UserTypeRef, event.instanceId).then(updatedUser => {
					let updatedUserIsAdmin = updatedUser.memberships.find(m => m.admin) != null
					if (this._userIsAdmin() && !updatedUserIsAdmin) {
						this._initParams.user = updatedUser
						return this._deleteGroupInfoIndex()
					} else if (!this._userIsAdmin() && updatedUserIsAdmin) {
						this._initParams.user = updatedUser
						return this.indexAllUserAndTeamGroupInfosForAdmin()
					} else {
						this._initParams.user = updatedUser
					}
				})
			}
		}).then(() => {
			//	if (indexUpdate.create.encInstanceIdToIndexData.size > 0 || indexUpdate.delete.encInstanceIds.length > 0 || indexUpdate.move.length > 0) {
			return this._writeIndexUpdate(indexUpdate)
			//	}
		})
	}

	_processNewContact(event: EntityUpdate, indexUpdate: IndexUpdate) {
		return load(ContactTypeRef, [event.instanceListId, event.instanceId]).then(contact => {
			this._createContactIndexEntries(contact, indexUpdate)
		}).catch(NotFoundError, () => {
			console.log("tried to index non existing contact")
		})
	}

	_processNewGroupInfo(event: EntityUpdate, indexUpdate: IndexUpdate) {
		return load(GroupInfoTypeRef, [event.instanceListId, event.instanceId]).then(groupInfo => {
			this._createGroupInfoIndexEntries(groupInfo, indexUpdate)
		}).catch(NotFoundError, () => {
			console.log("tried to index non existing group info")
		})
	}

	_processDeleted(event: EntityUpdate, indexUpdate: IndexUpdate) {
		let encInstanceId = encryptIndexKey(this.db.key, event.instanceId)
		let transaction = this.db.dbFacade.createTransaction(true, [ElementIdToIndexDataOS])
		return transaction.get(ElementIdToIndexDataOS, encInstanceId).then(indexData => {
			if (!indexData) {
				console.log("index data not available (instance is not indexed)", encInstanceId)
				return
			}
			let words = utf8Uint8ArrayToString(aes256Decrypt(this.db.key, indexData[1], true)).split(" ")
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

	_processMovedMail(event: EntityUpdate, indexUpdate: IndexUpdate) {
		// FIXME handle moves to trash folder and SPAM folder as deletes
		let encInstanceId = encryptIndexKey(this.db.key, event.instanceId)
		let transaction = this.db.dbFacade.createTransaction(true, [ElementIdToIndexDataOS])
		return transaction.get(ElementIdToIndexDataOS, encInstanceId).then(indexData => {
			if (indexData) {
				indexUpdate.move.push({
					encInstanceId,
					newListId: event.instanceListId
				})
			} else {
				// instance is moved but not yet indexed: handle as new
				return this._processNewMail(event, indexUpdate)
			}
		})
	}

	_processNewMail(event: EntityUpdate, indexUpdate: IndexUpdate) {
		return load(MailTypeRef, [event.instanceListId, event.instanceId]).then(mail => {
			return load(MailBodyTypeRef, mail.body).then(body => {
				this._createMailIndexEntries(mail, body, indexUpdate)
			})
		}).catch(NotFoundError, () => {
			console.log("tried to index non existing mail")
		})
	}

	_userIsAdmin(): boolean {
		return this._initParams.user.memberships.find(m => m.admin) != null
	}

	indexAllUserAndTeamGroupInfosForAdmin(): Promise<void> {
		if (this._userIsAdmin()) {
			return load(CustomerTypeRef, neverNull(this._initParams.user.customer)).then(customer => {
				return loadAll(GroupInfoTypeRef, customer.userGroups).then(allUserGroupInfos => {
					return loadAll(GroupInfoTypeRef, customer.teamGroups).then(allTeamGroupInfos => {
						let indexUpdate = _createNewIndexUpdate()
						allUserGroupInfos.concat(allTeamGroupInfos).forEach(groupInfo => this._createGroupInfoIndexEntries(groupInfo, indexUpdate))
						return this._writeIndexUpdate(indexUpdate)
					})
				})
			})
		} else {
			return Promise.resolve()
		}
	}

	_deleteGroupInfoIndex(): Promise<void> {
		//FIXME
		return Promise.resolve()
	}

	_createGroupInfoIndexEntries(groupInfo: GroupInfo, indexUpdate: IndexUpdate): void {
		let encryptedInstanceId = encryptIndexKey(this.db.key, groupInfo._id[1])

		let keyToIndexEntries = this.createIndexEntriesForAttributes(GroupInfoModel, groupInfo, [
			{
				attribute: GroupInfoModel.values["name"],
				value: () => groupInfo.name
			}, {
				attribute: GroupInfoModel.values["mailAddress"],
				value: () => groupInfo.mailAddress,
			}, {
				attribute: GroupInfoModel.associations["mailAddressAliases"],
				value: () => groupInfo.mailAddressAliases.map(maa => maa.mailAddress).join(","),
			}])
		this.encryptSearchIndexEntries(encryptedInstanceId, keyToIndexEntries, indexUpdate, groupInfo._id[0])
	}
}

function containsEventOfType(events: EntityUpdate[], type: OperationTypeEnum, elementId: Id): boolean {
	return events.filter(event => event.operation == type && event.instanceId == elementId).length > 0 ? true : false
}

function getAppId(typeRef: TypeRef<any>): number {
	if (typeRef.app == "sys") {
		return 0
	} else if (typeRef.app == "tutanota") {
		return 1
	}
	throw new Error("non indexed application " + typeRef.app)
}

function byteLength(str: ?string) {
	if (str == null) return 0
	// returns the byte length of an utf8 string
	var s = str.length;
	for (var i = str.length - 1; i >= 0; i--) {
		var code = str.charCodeAt(i);
		if (code > 0x7f && code <= 0x7ff) s++;
		else if (code > 0x7ff && code <= 0xffff) s += 2;
		if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
	}
	return s;
}

const HTML_ENTITIES = {
	"&nbsp;": " ",
	"&amp;": "&",
	"&lt;": '<',
	"&gt;": '>',
	"&Agrave;": "À",
	"&Aacute;": "Á",
	"&Acirc;": "Â",
	"&Atilde;": "Ã",
	"&Auml;": "Ä",
	"&Aring;": "Å",
	"&AElig;": "Æ",
	"&Ccedil;": "Ç",
	"&Egrave;": "È",
	"&Eacute;": "É",
	"&Ecirc;": "Ê",
	"&Euml;": "Ë",
	"&Igrave;": "Ì",
	"&Iacute;": "Í",
	"&Icirc;": "Î",
	"&Iuml;": "Ï",
	"&ETH;": "Ð",
	"&Ntilde;": "Ñ",
	"&Ograve;": "Ò",
	"&Oacute;": "Ó",
	"&Ocirc;": "Ô",
	"&Otilde;": "Õ",
	"&Ouml;": "Ö",
	"&Oslash;": "Ø",
	"&Ugrave;": "Ù",
	"&Uacute;": "Ú",
	"&Ucirc;": "Û",
	"&Uuml;": "Ü",
	"&Yacute;": "Ý",
	"&THORN;": "Þ",
	"&szlig;": "ß",
	"&agrave;": "à",
	"&aacute;": "á",
	"&acirc;": "â",
	"&atilde;": "ã",
	"&auml;": "ä",
	"&aring;": "å",
	"&aelig;": "æ",
	"&ccedil;": "ç",
	"&egrave;": "è",
	"&eacute;": "é",
	"&ecirc;": "ê",
	"&euml;": "ë",
	"&igrave;": "ì",
	"&iacute;": "í",
	"&icirc;": "î",
	"&iuml;": "ï",
	"&eth;": "ð",
	"&ntilde;": "ñ",
	"&ograve;": "ò",
	"&oacute;": "ó",
	"&ocirc;": "ô",
	"&otilde;": "õ",
	"&ouml;": "ö",
	"&oslash;": "ø",
	"&ugrave;": "ù",
	"&uacute;": "ú",
	"&ucirc;": "û",
	"&uuml;": "ü",
	"&yacute;": "ý",
	"&thorn;": "þ",
	"&yuml;": "ÿ",
	"&Alpha;": "Α",
	"&Beta;": "Β",
	"&Gamma;": "Γ",
	"&Delta;": "Δ",
	"&Epsilon;": "Ε",
	"&Zeta;": "Ζ",
	"&Eta;": "Η",
	"&Theta;": "Θ",
	"&Iota;": "Ι",
	"&Kappa;": "Κ",
	"&Lambda;": "Λ",
	"&Mu;": "Μ",
	"&Nu;": "Ν",
	"&Xi;": "Ξ",
	"&Omicron;": "Ο",
	"&Pi;": "Π",
	"&Rho;": "Ρ",
	"&Sigma;": "Σ",
	"&Tau;": "Τ",
	"&Upsilon;": "Υ",
	"&Phi;": "Φ",
	"&Chi;": "Χ",
	"&Psi;": "Ψ",
	"&Omega;": "Ω",
	"&alpha;": "α",
	"&beta;": "β",
	"&gamma;": "γ",
	"&delta;": "δ",
	"&epsilon;": "ε",
	"&zeta;": "ζ",
	"&eta;": "η",
	"&theta;": "θ",
	"&iota;": "ι",
	"&kappa;": "κ",
	"&lambda;": "λ",
	"&mu;": "μ",
	"&nu;": "ν",
	"&xi;": "ξ",
	"&omicron;": "ο",
	"&pi;": "π",
	"&rho;": "ρ",
	"&sigmaf;": "ς",
	"&sigma;": "σ",
	"&tau;": "τ",
	"&upsilon;": "υ",
	"&phi;": "φ",
	"&chi;": "χ",
	"&psi;": "ψ",
	"&omega;": "ω",
	"&thetasym;": "ϑ",
	"&upsih;": "ϒ",
	"&piv;": "ϖ",
}

export function htmlToText(html: ?string): string {
	if (html == null) return ""
	let text = html.replace(/<[^>]*>?/gm, " ")
	return text.replace(/&[#,0-9,a-z,A-Z]{1,5};/g, (match) => {
		let replacement
		if (match.startsWith("&#")) {
			let charCode = match.substring(2, match.length - 1) // remove &# and ;
			if (!isNaN(charCode)) {
				replacement = String.fromCharCode(Number(charCode))
			}
		} else {
			replacement = HTML_ENTITIES[match]
		}
		return replacement ? replacement : match;
	})
}

/**
 * Merges multiple maps into a single map with lists of values.
 * @param maps
 */
function mergeMaps<T>(maps: Map<string, T>[]): Map<string, T[]> {
	return maps.reduce((mergedMap: Map<string, T[]>, map: Map<string, T>) => { // merge same key of multiple attributes
		map.forEach((value: T, key: string) => {
			if (mergedMap.has(key)) {
				neverNull(mergedMap.get(key)).push(value)
			} else {
				mergedMap.set(key, [value])
			}
		})
		return mergedMap
	}, new Map())
}


export function getSpamFolder(folders: MailFolder[]): MailFolder {
	return (folders.find(f => f.folderType === Mail):any)
}
