//@flow
import {DbTransaction, ElementDataOS, GroupDataOS, MetaDataOS, SearchIndexMetaDataOS, SearchIndexOS} from "./DbFacade"
import {firstBiggerThanSecond} from "../../common/EntityFunctions"
import {tokenize} from "./Tokenizer"
import {mergeMaps} from "../../common/utils/MapUtils"
import {neverNull} from "../../common/utils/Utils"
import {base64ToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString} from "../../common/utils/Encoding"
import {aes256Decrypt, aes256Encrypt, IV_BYTE_LENGTH} from "../crypto/Aes"
import {random} from "../crypto/Randomizer"
import {byteLength, encryptIndexKeyBase64, encryptIndexKeyUint8Array, encryptSearchIndexEntry, getAppId, getPerformanceTimestamp} from "./IndexUtils"
import type {
	AttributeHandler,
	B64EncIndexKey,
	B64EncInstanceId,
	Db,
	EncryptedSearchIndexEntry,
	GroupData,
	IndexUpdate,
	SearchIndexEntry,
	SearchIndexMetadataEntry
} from "./SearchTypes"
import type {QueuedBatch} from "./EventQueue"
import {EventQueue} from "./EventQueue"
import {CancelledError} from "../../common/error/CancelledError"
import {mapInCallContext} from "../../common/utils/PromiseUtils"

const SEARCH_INDEX_ROW_LENGTH = 10000

/**
 * Class which executes operation on the indexing tables.
 *
 * Some functions return null instead of Promise because
 * IndexedDB transaction usually lives only till the end
 * of the event loop iteration and promise scheduling
 * somehow manages to break that and commit transaction
 * too early.
 */
export class IndexerCore {
	indexingSupported: boolean;
	queue: EventQueue;
	db: Db;
	_isStopped: boolean;

	_stats: {
		indexingTime: number,
		storageTime: number,
		downloadingTime: number,
		mailcount: number,
		storedBytes: number,
		encryptionTime: number,
		writeRequests: number,
		largestColumn: number,
		words: number,
		indexedBytes: number,
	}

	constructor(db: Db, queue: EventQueue) {
		this.indexingSupported = true
		this.queue = queue
		this.db = db
		this._isStopped = false;

		this._stats = {
			indexingTime: 0,
			storageTime: 0,
			downloadingTime: 0,
			mailcount: 0,
			storedBytes: 0,
			encryptionTime: 0,
			writeRequests: 0,
			largestColumn: 0,
			words: 0,
			indexedBytes: 0,
		}
	}

	/**
	 * Converts an instances into a map from words to a list of SearchIndexEntries.
	 */
	createIndexEntriesForAttributes(model: TypeModel, instance: Object, attributes: AttributeHandler[]): Map<string, SearchIndexEntry[]> {
		let indexEntries: Map<string, SearchIndexEntry>[] = attributes.map(attributeHandler => {
			let value = attributeHandler.value()
			let tokens = tokenize(value)
			this._stats.indexedBytes += byteLength(value)
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
		let encryptedInstanceId = encryptIndexKeyUint8Array(this.db.key, id[1], this.db.iv)
		let b64InstanceId = uint8ArrayToBase64(encryptedInstanceId)

		let encryptionTimeStart = getPerformanceTimestamp()
		let words = []
		keyToIndexEntries.forEach((value, indexKey) => {
			let encIndexKey = encryptIndexKeyBase64(this.db.key, indexKey, this.db.iv)
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

		this._stats.encryptionTime += getPerformanceTimestamp() - encryptionTimeStart
	}

	_processDeleted(event: EntityUpdate, indexUpdate: IndexUpdate): Promise<void> {
		let encInstanceId = encryptIndexKeyBase64(this.db.key, event.instanceId, this.db.iv)
		return this.db.dbFacade.createTransaction(true, [ElementDataOS]).then(transaction => {
			return transaction.get(ElementDataOS, encInstanceId).then(elementData => {
				if (!elementData) {
					return
				}
				let words = utf8Uint8ArrayToString(aes256Decrypt(this.db.key, elementData[1], true, false)).split(" ")
				let encWords = words.map(word => encryptIndexKeyBase64(this.db.key, word, this.db.iv))
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

	_cancelIfNeeded() {
		if (this._isStopped) {
			throw new CancelledError("indexing cancelled")
		}
	}

	writeIndexUpdate(indexUpdate: IndexUpdate): Promise<void> {

		let startTimeStorage = getPerformanceTimestamp()

		if (this._isStopped) {
			return Promise.reject(new CancelledError("mail indexing cancelled"))
		}
		return this.db.dbFacade.createTransaction(false, [
			SearchIndexOS, SearchIndexMetaDataOS, ElementDataOS, MetaDataOS, GroupDataOS
		])
		           .then(transaction => {
			           return Promise.resolve()
			                         .then(() => this._moveIndexedInstance(indexUpdate, transaction))
			                         .then(() => this._deleteIndexedInstance(indexUpdate, transaction))
			                         .then(() => this._insertNewElementData(indexUpdate, transaction))
			                         .then(keysToUpdate => keysToUpdate != null
				                         ? this._insertNewIndexEntries(indexUpdate, keysToUpdate, transaction)
				                         : null)
			                         .then(() => this._updateGroupData(indexUpdate, transaction))
			                         .then(() => {
				                         return transaction.wait().then(() => {
					                         this._stats.storageTime += (getPerformanceTimestamp() - startTimeStorage)
				                         })
			                         })
		           })
	}

	stopProcessing() {
		this._isStopped = true;
		this.queue.clear()
	}

	isStoppedProcessing(): boolean {
		return this._isStopped
	}

	startProcessing() {
		this._isStopped = false;
	}

	addBatchesToQueue(batches: QueuedBatch[]): void {
		if (!this._isStopped) {
			this.queue.addBatches(batches)
		}
	}

	_moveIndexedInstance(indexUpdate: IndexUpdate, transaction: DbTransaction): ?Promise<void> {
		this._cancelIfNeeded()
		if (indexUpdate.move.length === 0) return null // keep transaction context open (only for Safari)

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
		this._cancelIfNeeded()
		if (indexUpdate.delete.encWordToEncInstanceIds.size === 0) return null // keep transaction context open (only in Safari)
		let deleteElementDataPromise = indexUpdate.delete.encInstanceIds.map(encInstanceId => transaction.delete(ElementDataOS, encInstanceId))
		return Promise.all(Array.from(indexUpdate.delete.encWordToEncInstanceIds).map(([encWord, encInstanceIds]) => {
			return transaction.getAsList(SearchIndexMetaDataOS, encWord).then(metaDataEntries => {
				let deleteSearchIndexPromise = Promise.resolve()
				if (metaDataEntries.length > 0) {
					deleteSearchIndexPromise = this._deleteSearchIndexEntries(transaction, metaDataEntries, encInstanceIds)
					                               .then(updatedMetaDataEntries => {
						                               const nonEmptyEntries = updatedMetaDataEntries
							                               .filter(e => e.size > 0)
						                               if (nonEmptyEntries.length === 0) {
							                               return transaction.delete(SearchIndexMetaDataOS, encWord)
						                               } else {
							                               return transaction.put(SearchIndexMetaDataOS, encWord,
								                               nonEmptyEntries)
						                               }
					                               })
				}
				return deleteSearchIndexPromise
			})
		})).then(() => deleteElementDataPromise).return()
	}

	_deleteSearchIndexEntries(transaction: DbTransaction, metaDataEntries: SearchIndexMetadataEntry[], encInstanceIds: B64EncInstanceId[]): Promise<SearchIndexMetadataEntry[]> {
		this._cancelIfNeeded()
		return Promise.map(metaDataEntries, metaData => {
			return transaction.getAsList(SearchIndexOS, metaData.key).then(encryptedSearchIndexEntries => {
				let remainingEntries = encryptedSearchIndexEntries.filter(e =>
					!encInstanceIds.find(encInstanceId => uint8ArrayToBase64(e[0]) === encInstanceId))
				metaData.size = remainingEntries.length
				if (remainingEntries.length > 0) {
					return transaction.put(SearchIndexOS, metaData.key, remainingEntries).return(metaData)
				} else {
					return transaction.delete(SearchIndexOS, metaData.key).return(metaData)
				}
			})
		})
	}

	/**
	 * @return a map that contains all new encrypted instance ids
	 */
	_insertNewElementData(indexUpdate: IndexUpdate, transaction: DbTransaction): ?Promise<{[B64EncInstanceId]: boolean}> {
		this._cancelIfNeeded()
		if (indexUpdate.create.encInstanceIdToElementData.size === 0) return null // keep transaction context open (only in Safari)
		performance.mark("insertNewElementData-start")
		let keysToUpdate: {[B64EncInstanceId]: boolean} = {}
		let promises = []
		indexUpdate.create.encInstanceIdToElementData.forEach((elementData, b64EncInstanceId) => {
			let encInstanceId = base64ToUint8Array(b64EncInstanceId)
			performance.mark("insertNewElementData_get-start")
			promises.push(transaction.get(ElementDataOS, b64EncInstanceId).then(result => {
				performance.mark("insertNewElementData_get-end")
				if (!result) { // only add the element to the index if it has not been indexed before
					this._stats.writeRequests += 1
					this._stats.storedBytes += encInstanceId.length + elementData[0].length + elementData[1].length
					keysToUpdate[b64EncInstanceId] = true

					performance.mark("insertNewElementData_put-start")
					return transaction.put(ElementDataOS, b64EncInstanceId, elementData).finally(() => {
						performance.mark("insertNewElementData_put-end")
						performance.measure("insertNewElementData_put", "insertNewElementData_put-start", "insertNewElementData_put-end")
					})
				}
			}))
		})
		return Promise.all(promises).return(keysToUpdate).finally(() => {
			performance.mark("insertNewElementData-end")
			performance.measure("insertNewElementData", "insertNewElementData-start", "insertNewElementData-end")
		})
	}

	_insertNewIndexEntries(indexUpdate: IndexUpdate, keysToUpdate: {[B64EncInstanceId]: boolean}, transaction: DbTransaction): ?Promise<void> {
		this._cancelIfNeeded()
		performance.mark("insertNewIndexEntries-start")
		let keys = [...indexUpdate.create.indexMap.keys()]
		const result = mapInCallContext(keys, (key: B64EncIndexKey) => {
			//for (let key of items) {
			const encryptedEntries = neverNull(indexUpdate.create.indexMap.get(key))
			return this._putEncryptedEntity(indexUpdate.groupId, transaction, keysToUpdate, key, encryptedEntries)
			//}
		})
		if (result instanceof Promise) {
			return result.return()
		} else {
			null
		}
	}


	_putEncryptedEntity(groupId: Id, transaction: DbTransaction, keysToUpdate: {[B64EncInstanceId]: boolean}, b64EncIndexKey: B64EncIndexKey, encryptedEntries: EncryptedSearchIndexEntry[]): ?Promise<void> {
		this._cancelIfNeeded()
		let filteredEncryptedEntries = encryptedEntries.filter(entry => keysToUpdate[uint8ArrayToBase64(entry[0])])
		let encIndexKey = base64ToUint8Array(b64EncIndexKey)
		if (filteredEncryptedEntries.length > 0) {
			performance.mark("insertNewIndexEntries_getMeta-start")
			return transaction.get(SearchIndexMetaDataOS, b64EncIndexKey)
			                  .then((metadata: ?SearchIndexMetadataEntry[]) => {
				                  performance.mark("insertNewIndexEntries_getMeta-end")
				                  performance.measure("insertNewIndexEntries_getMeta", "insertNewIndexEntries_getMeta-start", "insertNewIndexEntries_getMeta-end")
				                  if (!metadata) { // no meta data entry for enc word create new search index row and meta data entry
					                  this._stats.storedBytes += encIndexKey.length
					                  this._stats.words += 1
					                  return transaction.put(SearchIndexOS, null, filteredEncryptedEntries)
					                                    .then(newId => [
						                                    {
							                                    key: newId,
							                                    size: filteredEncryptedEntries.length
						                                    }
					                                    ])
				                  } else {
					                  const safeMetaData = neverNull(metadata)
					                  const maxSize = SEARCH_INDEX_ROW_LENGTH - filteredEncryptedEntries.length
					                  const vacantRow = metadata.find(entry => entry.size < maxSize)
					                  performance.mark("insertNewIndexEntries_putIndexNew-start")
					                  if (!vacantRow) { // new entries do not fit into existing search index row, create new row
						                  return transaction.put(SearchIndexOS, null, filteredEncryptedEntries)
						                                    .then(newId => {
							                                    safeMetaData.push({
								                                    key: newId,
								                                    size: filteredEncryptedEntries.length
							                                    })
							                                    return safeMetaData
						                                    })
						                                    .finally(() => {
							                                    performance.mark("insertNewIndexEntries_putIndexNew-end")
							                                    performance.measure("insertNewIndexEntries_putIndexNew", "insertNewIndexEntries_putIndexNew-start", "insertNewIndexEntries_putIndexNew-end")
						                                    })
					                  } else {
						                  // add new entries to existing search index row

						                  performance.mark("insertNewIndexEntries_getRow-start")
						                  return transaction.get(SearchIndexOS, vacantRow.key)
						                                    .then((row) => {
							                                    performance.mark("insertNewIndexEntries_getRow-end")
							                                    performance.measure("insertNewIndexEntries_getRow", "insertNewIndexEntries_getRow-start", "insertNewIndexEntries_getRow-end")
							                                    performance.mark("insertNewIndexEntries_putIndex-start")
							                                    let safeRow = row || []
							                                    safeRow.push(...filteredEncryptedEntries)
							                                    return transaction.put(SearchIndexOS, vacantRow.key, row)
							                                                      .then(() => {
								                                                      vacantRow.size = safeRow.length
								                                                      return safeMetaData
							                                                      })
						                                    })
						                                    .finally(() => {
							                                    performance.mark("insertNewIndexEntries_putIndex-end")
							                                    performance.measure("insertNewIndexEntries_putIndex", "insertNewIndexEntries_putIndex-start", "insertNewIndexEntries_putIndex-end")
						                                    })
					                  }
				                  }
			                  })
			                  .then((metaData) => {
				                  const columnSize = metaData.reduce((result, metaDataEntry) => result
					                  + metaDataEntry.size, 0)
				                  this._stats.writeRequests += 1
				                  this._stats.largestColumn = columnSize > this._stats.largestColumn
					                  ? columnSize : this._stats.largestColumn
				                  this._stats.storedBytes += filteredEncryptedEntries.reduce((sum, e) =>
					                  sum + e[0].length + e[1].length, 0)
				                  performance.mark("insertNewIndexEntries_putMeta-start")
				                  return transaction.put(SearchIndexMetaDataOS, b64EncIndexKey, metaData)
				                                    .finally(() => {
					                                    performance.mark("insertNewIndexEntries_putMeta-end")
					                                    performance.measure("insertNewIndexEntries_putMeta", "insertNewIndexEntries_putMeta-start", "insertNewIndexEntries_putMeta-end")
				                                    })
			                  })
		}
	}


	_updateGroupData(indexUpdate: IndexUpdate, transaction: DbTransaction): ?Promise<void> {
		this._cancelIfNeeded()
		if (indexUpdate.batchId || indexUpdate.indexTimestamp != null) { // check timestamp for != null here because "0" is a valid value to write
			// update group data
			return transaction.get(GroupDataOS, indexUpdate.groupId).then((groupData: ?GroupData) => {
				if (!groupData) {
					throw new Error("GroupData not available for group " + indexUpdate.groupId)
				}
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
					return transaction.put(GroupDataOS, indexUpdate.groupId, groupData)
				}
			})
		} else {
			return null
		}
	}

	printStatus() {
		const totalTime = this._stats.indexingTime + this._stats.storageTime + this._stats.downloadingTime + this._stats.encryptionTime
		console.log(JSON.stringify(this._stats), "total time: ", totalTime)
	}
}

export function measure(names: string[]) {
	const measures = {}
	for (let name of names) {
		try {
			measures[name] = performance.getEntriesByName(name, "measure").reduce((acc, entry) => acc + entry.duration, 0)
		} catch (e) {
		}
	}
	performance.clearMeasures()
	console.log(JSON.stringify(measures))
}