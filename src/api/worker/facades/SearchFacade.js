//@flow
import {MailTypeRef, _TypeModel as MailModel} from "../../entities/tutanota/Mail"
import {_TypeModel as ContactModel, ContactTypeRef} from "../../entities/tutanota/Contact"
import {DbFacade, SearchIndexOS, ElementIdToListIdOS, MetaDataOS, GroupIdToBatchIdsOS} from "./DbFacade"
import {
	isSameTypeRef,
	TypeRef,
	GENERATED_MAX_ID,
	_loadEntityRange,
	_loadEntity,
	firstBiggerThanSecond
} from "../../common/EntityFunctions"
import {tokenize} from "./Tokenizer"
import {arrayEquals, concat} from "../../common/utils/ArrayUtils"
import {neverNull} from "../../common/utils/Utils"
import {hash} from "../crypto/Sha256"
import {
	uint8ArrayToBase64,
	stringToUtf8Uint8Array,
	utf8Uint8ArrayToString,
	base64ToUint8Array
} from "../../common/utils/Encoding"
import {aes256Decrypt, IV_BYTE_LENGTH, aes256Encrypt, aes256RandomKey} from "../crypto/Aes"
import {encrypt256Key, decrypt256Key, fixedIv} from "../crypto/CryptoFacade"
import {random} from "../crypto/Randomizer"
import {OperationType} from "../../common/TutanotaConstants"
import {load, loadAll, loadRoot, loadRange} from "../EntityWorker"
import {MailBodyTypeRef} from "../../entities/tutanota/MailBody"
import {ContactListTypeRef} from "../../entities/tutanota/ContactList"
import {NotFoundError} from "../../common/error/RestError"
import {EntityEventBatchTypeRef} from "../../entities/sys/EntityEventBatch"
import {MailboxGroupRootTypeRef} from "../../entities/tutanota/MailboxGroupRoot"
import {MailBoxTypeRef} from "../../entities/tutanota/MailBox"
import {MailFolderTypeRef} from "../../entities/tutanota/MailFolder"
import {EntityRestClient} from "../rest/EntityRestClient"

type AttributeHandler ={
	attribute: ModelValue|ModelAssociation;
	value: lazy<string>;
}

type KeyToIndexEntries = {
	key: string;
	indexEntries: SearchIndexEntry[];
}

type EncryptedKeyToIndexEntries = {
	key: Uint8Array;
	indexEntries: EncryptedSearchIndexEntry[];
}

type SearchResult = {
	mails: IdTuple[];
	contacts: IdTuple[];
}

export type EncryptedSearchIndexEntry =[Uint8Array, Uint8Array] // first entry encrypted element id, second entry encrypted app, attribute, type and positions

export type SearchIndexEntry = {
	id:Id;
	app:number;
	type:number;
	attribute: number;
	positions:number[];
}

type IndexUpdate = {
	encInstanceIdToListIdAndEncWords: Map<B64EncInstanceId,[Id, Uint8Array]>; // first element of value is listId, second is encrypted words of instance seperated by whitespace
	indexMap: Map<B64EncIndexKey, EncryptedSearchIndexEntry[]>;
	batchId: ?IdTuple;
	contactListId:?Id;
}

function _createNewIndexUpdate(): IndexUpdate {
	return {
		encInstanceIdToListIdAndEncWords: new Map(),
		indexMap: new Map(),
		batchId: null,
		contactListId: null
	}
}

type B64EncIndexKey = Base64;
type EncIndexKey = Uint8Array
type EncInstanceId = Uint8Array;
type B64EncInstanceId = Base64;


export function encryptIndexKey(key: Aes256Key, indexKey: string): Uint8Array {
	return aes256Encrypt(key, stringToUtf8Uint8Array(indexKey), fixedIv, true, false).slice(fixedIv.length)
}

export function decryptIndexKey(key: Aes256Key, indexKey: Uint8Array): string {
	return utf8Uint8ArrayToString(aes256Decrypt(key, concat(fixedIv, indexKey), false))
}

export function encryptSearchIndexEntry(key: Aes256Key, entry: SearchIndexEntry, encryptedInstanceId: Uint8Array): EncryptedSearchIndexEntry {
	let data = JSON.stringify([entry.app, entry.type, entry.attribute, entry.positions])
	return [
		encryptedInstanceId,
		aes256Encrypt(key, stringToUtf8Uint8Array(data), random.generateRandomData(IV_BYTE_LENGTH), true, false)
	]
}

export function decryptSearchIndexEntry(key: Aes256Key, entry: EncryptedSearchIndexEntry): SearchIndexEntry {
	let id = utf8Uint8ArrayToString(aes256Decrypt(key, concat(fixedIv, entry[0]), true))
	let data = JSON.parse(utf8Uint8ArrayToString(aes256Decrypt(key, entry[1], true)))
	return {
		id: id,
		app: data[0],
		type: data[1],
		attribute: data[2],
		positions: data[3],
	}
}

const entityRestClient = new EntityRestClient()


const Metadata = {
	userEncDbKey: "userEncDbKey",
	oldestIndexedMailId: "oldestIndexedMailId",
	indexedContactLists: "indexedContactLists"
}

class SearchFacade {

	_dbKey: Aes256Key;
	_dbFacade: DbFacade;
	_mailGroupIds: Id[];
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

	/**
	 * FIXME Write noop ENTITY_EVENT_BATCH on the server every twenty days (not once a month because of months with 31 days) to prevent
	 * OutOfSync errors one of the groups of a user has not received a single update (e.g. contacts not updated within last month).
	 * The noop ENTITY_EVENT_BATCH must be written for each area group.
	 *
	 * FIXME user added to group / removed from group
	 *
	 */
	init(userId: Id, groupKey: Aes128Key, userGroupId: Id, mailGroupIds: Id[], contactGroupIds: Id[]): Promise<void> {
		this._mailGroupIds = mailGroupIds
		return new DbFacade().open(uint8ArrayToBase64(hash(stringToUtf8Uint8Array(userId)))).then(facade => {
			this._dbFacade = facade
			let dbInit = (): Promise<void> => {
				let t = this._dbFacade.createTransaction(true, [MetaDataOS])
				return t.get(MetaDataOS, Metadata.userEncDbKey).then(value => {
					if (!value) {
						return this._loadLastBatchIds(mailGroupIds.concat(contactGroupIds)).then((groupBatches: {groupId: Id, lastBatchIds: Id[]}[]) => {
							let t2 = this._dbFacade.createTransaction(false, [MetaDataOS, GroupIdToBatchIdsOS])
							this._dbKey = aes256RandomKey()
							t2.put(MetaDataOS, Metadata.userEncDbKey, encrypt256Key(groupKey, this._dbKey))
							t2.put(MetaDataOS, Metadata.oldestIndexedMailId, {}) // mailGroup:ID
							t2.put(MetaDataOS, Metadata.indexedContactLists, []) // contact list ids
							groupBatches.forEach(groupIdToLastBatchId => {
								t2.put(GroupIdToBatchIdsOS, groupIdToLastBatchId.groupId, groupIdToLastBatchId.lastBatchIds)
							})
							return t2.await()
						})
					} else {
						this._dbKey = decrypt256Key(groupKey, value)
						return t.await()
					}
				})
			}
			return dbInit().then(() => {
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
		let t = this._dbFacade.createTransaction(true, [GroupIdToBatchIdsOS])
		let groupIdToEventBatch = new Map()
		groupIds.forEach(groupId => {
			t.get(GroupIdToBatchIdsOS, groupId).then(lastEventBatchIds => {
				groupIdToEventBatch.set(groupId, lastEventBatchIds.sort((e1, e2) => { // sort batch ids in ascending order
					if (e1 == e2) {
						return 0
					} else {
						return firstBiggerThanSecond(e1, e2) ? 1 : -1
					}
				}))
			})
		})
		return t.await().then(() => {
			let promises = []
			groupIdToEventBatch.forEach((lastEventBatchIds, groupId) => {
				if (lastEventBatchIds.length > 0) {
					let startId = lastEventBatchIds[0] // start from lowest id
					promises.push(loadAll(EntityEventBatchTypeRef, groupId, startId).then(eventBatches => {
						return Promise.each(eventBatches, batch => {
							if (lastEventBatchIds.indexOf(batch._id[1]) == -1) {
								return this.processEntityEvents(batch.events, groupId, batch._id[1])
							}
						})
					}))
				}
			})
			return Promise.all(promises).return()
		})
	}

	search(searchString: string, type: ?TypeRef<any>, attributes: string[]): Promise<SearchResult> {
		let searchTokens = tokenize(searchString)
		let encryptedIndexEntries = null
		let transaction = this._dbFacade.createTransaction(true, [SearchIndexOS, ElementIdToListIdOS])
		return Promise.each(searchTokens, (token) => {
			let indexKey = encryptIndexKey(this._dbKey, token)
			if (encryptedIndexEntries && encryptedIndexEntries.length === 0) { // return in case a previous search word returned an empty result
				return []
			}
			return transaction.getAsList(SearchIndexOS, indexKey).then((result: EncryptedSearchIndexEntry[]) => {
				if (encryptedIndexEntries == null) {
					encryptedIndexEntries = result
				} else {
					// filter results which include all tokens
					encryptedIndexEntries = encryptedIndexEntries.filter(entry => result.find(r => arrayEquals(r[0], entry[0])))
				}
			})
		}).then(() => {
			// decrypt results
			return encryptedIndexEntries ? encryptedIndexEntries.map((entry: EncryptedSearchIndexEntry) => decryptSearchIndexEntry(this._dbKey, entry)) : []
		}).reduce((searchResult, entry: SearchIndexEntry, index) => {
			let encryptedListElementId = (encryptedIndexEntries:any)[index][0]
			return transaction.get(ElementIdToListIdOS, encryptedListElementId).then(listId => {
				if (entry.type == MailModel.id) {
					neverNull(searchResult).mails.push([listId, entry.id])
				} else if (entry.type == ContactModel.id) {
					neverNull(searchResult).contacts.push([listId, entry.id])
				}
				return searchResult
			})
		}, {mails: [], contacts: []})
		// ranking ->all tokens are in correct order in the same attribute
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

		return Promise.each(this._mailGroupIds, (mailGroupId) => {
			return load(MailboxGroupRootTypeRef, mailGroupId).then(mailGroupRoot => load(MailBoxTypeRef, mailGroupRoot.mailbox)).then(mbox => {
				return this._loadFolders(neverNull(mbox.systemFolders).folders).each(mailListId => {
					return this._indexMailList(mailListId, GENERATED_MAX_ID)
				})
			})
		}).then(() => {
			this._printStatus()
			console.log("finished indexing")
		}).return()
	}

	_printStatus() {
		console.log("mail count", this._mailcount, "indexing time", this._indexingTime, "storageTime", this._storageTime, "downloading time", this._downloadingTime, "encryption time", this._encryptionTime, "total time", this._indexingTime + this._storageTime + this._downloadingTime + this._encryptionTime, "stored bytes", this._storedBytes, "writeRequests", this._writeRequests, "largestColumn", this._largestColumn, "words", this._words, "indexedBytes", this._indexedBytes)
	}

	_indexMailList(mailListId: Id, startId: Id): Promise <void> {
		let startTimeLoad = performance.now()
		return _loadEntityRange(MailTypeRef, mailListId, startId, 500, true, entityRestClient).then(mails => {
			return Promise.map(mails, mail => {
				return _loadEntity(MailBodyTypeRef, mail.body, null, entityRestClient).then(body => {
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


	_loadFolders(folderListId: Id): Promise < Id[] > {
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
			let t = this._dbFacade.createTransaction(true, [MetaDataOS])
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


	_createContactIndexEntries(contact: Contact, indexUpdate: IndexUpdate): void {
		let encryptedInstanceId = encryptIndexKey(this._dbKey, contact._id[1])

		let keyToIndexEntries = this.createIndexEntriesForAttributes(ContactModel, contact, [
			{
				attribute: ContactModel.values["firstName"],
				value: () => contact.firstName
			}, {
				attribute: ContactModel.values["lastName"],
				value: () => contact.lastName,
			}, {
				attribute: ContactModel.values["nickname"],
				value: () => contact.nickname ? contact.nickname : "",
			}, {
				attribute: ContactModel.values["role"],
				value: () => contact.role,
			}, {
				attribute: ContactModel.values["title"],
				value: () => contact.title ? contact.title : "",
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
		let encryptedInstanceId = encryptIndexKey(this._dbKey, mail._id[1])
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
				value: () => mail.sender.name + " <" + mail.sender.address + ">"
			}, {
				attribute: MailModel.associations["body"],
				value: () => htmlToText(mailBody.text)
			}])
		this._indexingTime += (performance.now() - startTimeIndex)

		this.encryptSearchIndexEntries(encryptedInstanceId, keyToIndexEntries, indexUpdate, mail._id[0])
	}

	encryptSearchIndexEntries(encryptedInstanceId: Uint8Array, keyToIndexEntries: Map<string, SearchIndexEntry[]>, indexUpdate: IndexUpdate, listId: Id): void {
		let b64InstanceId = uint8ArrayToBase64(encryptedInstanceId)

		let encryptionTimeStart = performance.now()
		let words = []
		keyToIndexEntries.forEach((value, indexKey) => {
			let encIndexKey = encryptIndexKey(this._dbKey, indexKey)
			let b64IndexKey = uint8ArrayToBase64(encIndexKey)
			let indexEntries = indexUpdate.indexMap.get(b64IndexKey)
			words.push(indexKey)
			if (!indexEntries) {
				indexEntries = []
			}
			indexUpdate.indexMap.set(b64IndexKey, indexEntries.concat(value.map(indexEntry => encryptSearchIndexEntry(this._dbKey, indexEntry, encryptedInstanceId))))
		})

		indexUpdate.encInstanceIdToListIdAndEncWords.set(b64InstanceId, [
			listId,
			aes256Encrypt(this._dbKey, stringToUtf8Uint8Array(words.join(" ")), random.generateRandomData(IV_BYTE_LENGTH), true, false)
		])

		this._encryptionTime += performance.now() - encryptionTimeStart
	}

	byteLength(str: string) {
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


	createIndexEntriesForAttributes(model: TypeModel, instance: Object, attributes: AttributeHandler[]): Map<string, SearchIndexEntry[]> {
		let indexEntries: Map<string, SearchIndexEntry>[] = attributes.map(attributeHandler => {
			let value = attributeHandler.value()
			let tokens = tokenize(value)
			this._indexedBytes += this.byteLength(value)
			let attributeKeyToIndexMap: Map<string, SearchIndexEntry> = new Map()
			for (let index = 0; index < tokens.length; index++) {
				let token = tokens[index]
				if (!attributeKeyToIndexMap.has(token)) {
					attributeKeyToIndexMap.set(token, {
						id: instance._id instanceof Array ? instance._id[1] : instance._id,
						app: this.getAppId(instance),
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


	_writeIndexUpdate(indexUpdate: IndexUpdate): Promise<void> {
		let startTimeStorage = performance.now()
		let keysToUpdate: {[B64EncInstanceId]:boolean} = {}
		let transaction = this._dbFacade.createTransaction(false, [SearchIndexOS, ElementIdToListIdOS, MetaDataOS, GroupIdToBatchIdsOS])
		let promises = []
		indexUpdate.encInstanceIdToListIdAndEncWords.forEach((instanceData, b64EncInstanceId) => {
			promises.push(transaction.get(ElementIdToListIdOS, b64EncInstanceId).then(result => {
				if (!result) { // only add the element to the index if it has not been indexed before
					this._writeRequests += 1
					let encInstanceId = base64ToUint8Array(b64EncInstanceId)
					this._storedBytes += encInstanceId.length + instanceData[0].length + instanceData[1].length
					keysToUpdate[b64EncInstanceId] = true
					transaction.put(ElementIdToListIdOS, encInstanceId, instanceData)
				}
			}))
		})

		return Promise.all(promises).then(() => {
			indexUpdate.indexMap.forEach((encryptedEntries, b64EncIndexKey) => {
				let filteredEncryptedEntries = encryptedEntries.filter(entry => keysToUpdate[uint8ArrayToBase64((entry:any)[0])])
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
				transaction.get(GroupIdToBatchIdsOS, batchId[0]).then(lastEntityEvents => {
					lastEntityEvents.push(batchId[1])
					if (lastEntityEvents.size > 1000) {
						lastEntityEvents.shift()
					}
					transaction.put(GroupIdToBatchIdsOS, batchId[0], lastEntityEvents)
				})
			}
			if (indexUpdate.contactListId) {
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

	getAppId(instance: Object): number {
		if (instance._type.app == "sys") {
			return 0
		} else if (instance._type.app == "tutanota") {
			return 1
		}
		throw new Error("non indexed application " + instance._type.app)
	}


	processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id): Promise<void> {
		// FIXME delete mails and contacts
		let indexUpdate = _createNewIndexUpdate()
		indexUpdate.batchId = [groupId, batchId]
		Promise.each(events, (event, index) => {
			if (event.operation == OperationType.CREATE && isSameTypeRef(new TypeRef(event.application, event.type), MailTypeRef)) {
				if (containsEventOfType(events, OperationType.DELETE, event.instanceId)) {
					// FIXME move mails
				} else {
					return load(MailTypeRef, [event.instanceListId, event.instanceId]).then(mail => {
						return load(MailBodyTypeRef, mail.body).then(body => {
							this._createMailIndexEntries(mail, body, indexUpdate)
						})
					}).catch(NotFoundError, () => {
						console.log("tried to index non existing mail")
					})
				}
			} else if (event.operation == OperationType.CREATE && isSameTypeRef(new TypeRef(event.application, event.type), ContactTypeRef)) {
				// FIXME update for contacts
				return load(ContactTypeRef, [event.instanceListId, event.instanceId]).then(contact => {
					this._createContactIndexEntries(contact, indexUpdate)
				}).catch(NotFoundError, () => {
					console.log("tried to index non existing contact")
				})
			}
		}).then(() => {
			return this._writeIndexUpdate(indexUpdate)
		})
		return Promise.resolve()
	}
}

function containsEventOfType(events: EntityUpdate[], type: OperationTypeEnum, elementId: Id): boolean {
	return events.filter(event => event.operation == type && event.instanceId == elementId) ? true : false
}

export const searchFacade = new SearchFacade()


self.search = searchFacade

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


export function htmlToText(html: string): string {
	return html.replace(/<[^>]*>?/gm, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
}

