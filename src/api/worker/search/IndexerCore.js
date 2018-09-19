//@flow
import {DbTransaction, ElementDataOS, GroupDataOS, MetaDataOS, SearchIndexOS} from "./DbFacade"
import {firstBiggerThanSecond} from "../../common/EntityFunctions"
import {tokenize} from "./Tokenizer"
import {mergeMaps} from "../../common/utils/MapUtils"
import {neverNull} from "../../common/utils/Utils"
import {
	base64ToUint8Array,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString
} from "../../common/utils/Encoding"
import {aes256Decrypt, aes256Encrypt, IV_BYTE_LENGTH} from "../crypto/Aes"
import {random} from "../crypto/Randomizer"
import {
	byteLength,
	encryptIndexKeyBase64,
	encryptIndexKeyUint8Array,
	encryptSearchIndexEntry,
	getAppId,
	getPerformanceTimestamp
} from "./IndexUtils"
import type {AttributeHandler, B64EncInstanceId, Db, GroupData, IndexUpdate, SearchIndexEntry} from "./SearchTypes"
import {EventQueue} from "./EventQueue"

export class IndexerCore {
	indexingSupported: boolean;
	queue: EventQueue;
	db: Db;
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

	constructor(db: Db, queue: EventQueue) {
		this.indexingSupported = true
		this.queue = queue
		this.db = db

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
	}

	/**
	 * Converts an instances into a map from words to a list of SearchIndexEntries.
	 */
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
		let encryptedInstanceId = encryptIndexKeyUint8Array(this.db.key, id[1])
		let b64InstanceId = uint8ArrayToBase64(encryptedInstanceId)

		let encryptionTimeStart = getPerformanceTimestamp()
		let words = []
		keyToIndexEntries.forEach((value, indexKey) => {
			let encIndexKey = encryptIndexKeyBase64(this.db.key, indexKey)
			let indexEntries = indexUpdate.create.indexMap.get(encIndexKey)
			words.push(indexKey)
			if (!indexEntries) {
				indexEntries = []
			}
			indexUpdate.create.indexMap.set(encIndexKey, indexEntries.concat(value.map(indexEntry => encryptSearchIndexEntry(this.db.key, indexEntry, encryptedInstanceId))))
		})

		indexUpdate.create.encInstanceIdToElementData.set(b64InstanceId, [
			listId,
			aes256Encrypt(this.db.key, stringToUtf8Uint8Array(words.join(" ")), random.generateRandomData(IV_BYTE_LENGTH), true, false),
			ownerGroup
		])

		this._encryptionTime += getPerformanceTimestamp() - encryptionTimeStart
	}

	_processDeleted(event: EntityUpdate, indexUpdate: IndexUpdate): Promise<void> {
		let encInstanceId = encryptIndexKeyBase64(this.db.key, event.instanceId)
		return this.db.dbFacade.createTransaction(true, [ElementDataOS]).then(transaction => {
			return transaction.get(ElementDataOS, encInstanceId).then(elementData => {
				if (!elementData) {
					console.log("index data not available (instance is not indexed)", encInstanceId, event.instanceId)
					return
				}
				let words = utf8Uint8ArrayToString(aes256Decrypt(this.db.key, elementData[1], true, false)).split(" ")
				let encWords = words.map(word => encryptIndexKeyBase64(this.db.key, word))
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
		})
	}

	/*********************************************** Write index update ***********************************************/

	writeIndexUpdate(indexUpdate: IndexUpdate): Promise<void> {
		let startTimeStorage = getPerformanceTimestamp()
		return this.db.dbFacade.createTransaction(false, [SearchIndexOS, ElementDataOS, MetaDataOS, GroupDataOS])
		           .then(transaction => {
			           return Promise.resolve()
			                         .then(() => this._moveIndexedInstance(indexUpdate, transaction))
			                         .then(() => this._deleteIndexedInstance(indexUpdate, transaction))
			                         .then(() => this._insertNewElementData(indexUpdate, transaction))
			                         .then(keysToUpdate => keysToUpdate
			                         != null ? this._insertNewIndexEntries(indexUpdate, keysToUpdate, transaction) : null)
			                         .then(() => this._updateGroupData(indexUpdate, transaction))
			                         .then(() => {
				                         return transaction.wait().then(() => {
					                         this._storageTime += (getPerformanceTimestamp() - startTimeStorage)
				                         })
			                         })
		           })
	}

	_moveIndexedInstance(indexUpdate: IndexUpdate, transaction: DbTransaction): ?Promise<void> {
		if (indexUpdate.move.length === 0) return null // keep transaction context open (only for FF)

		return Promise.all(indexUpdate.move.map(moveInstance => {
			return transaction.get(ElementDataOS, moveInstance.encInstanceId).then(elementData => {
				if (elementData) {
					elementData[0] = moveInstance.newListId
					transaction.put(ElementDataOS, moveInstance.encInstanceId, elementData)
				}
			})
		})).return()
	}

	_deleteIndexedInstance(indexUpdate: IndexUpdate, transaction: DbTransaction): ?Promise<void> {
		if (indexUpdate.delete.encWordToEncInstanceIds.size === 0) return null // keep transaction context open (only for FF)

		return Promise.all(Array.from(indexUpdate.delete.encWordToEncInstanceIds).map(([encWord, encInstanceIds]) => {
			return transaction.getAsList(SearchIndexOS, encWord).then(encryptedSearchIndexEntries => {
				if (encryptedSearchIndexEntries.length > 0) {
					let promises = indexUpdate.delete.encInstanceIds.map(encInstanceId => transaction.delete(ElementDataOS, encInstanceId))
					let newEntries = encryptedSearchIndexEntries.filter(e => encInstanceIds.find(encInstanceId => uint8ArrayToBase64(e[0])
						=== encInstanceId) == null)
					if (newEntries.length > 0) {
						promises.push(transaction.put(SearchIndexOS, encWord, newEntries))
					} else {
						promises.push(transaction.delete(SearchIndexOS, encWord))
					}
					return promises
				}
			})
		})).return()
	}

	/**
	 * @return a map that contains all new encrypted instance ids
	 */
	_insertNewElementData(indexUpdate: IndexUpdate, transaction: DbTransaction): ?Promise<{[B64EncInstanceId]: boolean}> {
		if (indexUpdate.create.encInstanceIdToElementData.size === 0) return null // keep transaction context open (only for FF)

		let keysToUpdate: {[B64EncInstanceId]: boolean} = {}
		let promises = []
		indexUpdate.create.encInstanceIdToElementData.forEach((elementData, b64EncInstanceId) => {
			let encInstanceId = base64ToUint8Array(b64EncInstanceId)
			promises.push(transaction.get(ElementDataOS, b64EncInstanceId).then(result => {
				if (!result) { // only add the element to the index if it has not been indexed before
					this._writeRequests += 1
					this._storedBytes += encInstanceId.length + elementData[0].length + elementData[1].length
					keysToUpdate[b64EncInstanceId] = true
					transaction.put(ElementDataOS, b64EncInstanceId, elementData)
				}
			}))
		}, {concurrency: 1})
		return Promise.all(promises).return(keysToUpdate)
	}


	/*_insertNewIndexEntries(indexUpdate: IndexUpdate, keysToUpdate: {[B64EncInstanceId]: boolean}, transaction: DbTransaction): ?Promise<void> {
		let promises = []
		indexUpdate.create.indexMap.forEach((encryptedEntries, b64EncIndexKey) => {
			let filteredEncryptedEntries = encryptedEntries.filter(entry => keysToUpdate[uint8ArrayToBase64((entry: any)[0])]
				=== true)
			let encIndexKey = base64ToUint8Array(b64EncIndexKey)
			if (filteredEncryptedEntries.length > 0) {
				console.log("get index entries for key: " + b64EncIndexKey)
				promises.push(transaction.get(SearchIndexOS, b64EncIndexKey).then((result) => {
					console.log("index entries for key: " + b64EncIndexKey + " size:" + result.length)
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
					this._storedBytes += filteredEncryptedEntries.reduce((sum, e) => (sum + (e: any)[0].length
						+ (e: any)[1].length), 0)
					return transaction.put(SearchIndexOS, b64EncIndexKey, value)
				}))
			}
		})
		if (promises.length === 0) {
			return null
		} else {
			return Promise.all(promises).return()
		}
	}*/

	_insertNewIndexEntries(indexUpdate: IndexUpdate, keysToUpdate: {[B64EncInstanceId]: boolean}, transaction: DbTransaction): ?Promise<void> {
		return Promise.map(indexUpdate.create.indexMap.keys(), (b64EncIndexKey) => {
			const encryptedEntries = neverNull(indexUpdate.create.indexMap.get(b64EncIndexKey))
			let filteredEncryptedEntries = encryptedEntries.filter(entry => keysToUpdate[uint8ArrayToBase64(entry[0])])
			let encIndexKey = base64ToUint8Array(b64EncIndexKey)
			if (filteredEncryptedEntries.length > 0) {
				self.largestColumnIndexKey === b64EncIndexKey &&
				console.time("insertNewIndexEntries" + self.largestColumnIndexKey)

				return transaction.get(SearchIndexOS, b64EncIndexKey).then((result) => {
					this._writeRequests += 1
					let value
					if (result && result.length > 0) {
						value = result
					} else {
						this._storedBytes += encIndexKey.length
						value = []
						this._words += 1
					}
					value.push(...filteredEncryptedEntries)
					this._largestColumn = value.length > this._largestColumn ? value.length : this._largestColumn
					this._storedBytes += filteredEncryptedEntries.reduce((sum, e) => sum + e[0].length + e[1].length, 0)
					return transaction.put(SearchIndexOS, b64EncIndexKey, value).then(result => {
						self.largestColumnIndexKey === b64EncIndexKey &&
						console.timeEnd("insertNewIndexEntries" + self.largestColumnIndexKey)
						// console.log("length", value.length)
						return result
					})
				})
			}
		}, {concurrency: 2}).return()
	}

	_updateGroupData(indexUpdate: IndexUpdate, transaction: DbTransaction): ?Promise<void> {
		if (indexUpdate.batchId || indexUpdate.indexTimestamp != null) { // check timestamp for != null here because "0" is a valid value to write
			// update group data
			return transaction.get(GroupDataOS, indexUpdate.groupId).then((groupData: GroupData) => {

				if (indexUpdate.indexTimestamp != null) {
					groupData.indexTimestamp = indexUpdate.indexTimestamp
				}

				if (indexUpdate.batchId) {
					let batchId = indexUpdate.batchId
					if (!groupData) {
						throw new Error("GroupData not available for group " + indexUpdate.groupId)
					}
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
					return transaction.put(GroupDataOS, indexUpdate.groupId, groupData)
				}
			})
		} else {
			return null
		}
	}

	printStatus() {
		console.log("mail count", this._mailcount, "indexing time", this._indexingTime, "storageTime", this._storageTime, "downloading time", this._downloadingTime, "encryption time", this._encryptionTime, "total time", this._indexingTime
			+ this._storageTime + this._downloadingTime
			+ this._encryptionTime, "stored bytes", this._storedBytes, "writeRequests", this._writeRequests, "largestColumn", this._largestColumn, "words", this._words, "indexedBytes", this._indexedBytes)
	}
}