//@flow
import {DbTransaction, ElementDataOS, GroupDataOS, MetaDataOS, SearchIndexMetaDataOS, SearchIndexOS, SearchIndexWordsOS} from "./DbFacade"
import {firstBiggerThanSecond} from "../../common/EntityFunctions"
import {tokenize} from "./Tokenizer"
import {mergeMaps} from "../../common/utils/MapUtils"
import {downcast, neverNull} from "../../common/utils/Utils"
import {base64ToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString} from "../../common/utils/Encoding"
import {aes256Decrypt, aes256Encrypt, IV_BYTE_LENGTH} from "../crypto/Aes"
import {
	byteLength,
	encryptIndexKeyBase64,
	encryptIndexKeyUint8Array,
	encryptSearchIndexEntry,
	getAppId,
	getIdFromEncSearchIndexEntry,
	getPerformanceTimestamp
} from "./IndexUtils"
import type {
	AttributeHandler,
	B64EncIndexKey,
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
import {ProgrammingError} from "../../common/error/ProgrammingError"
import type {PromiseMapFn} from "../../common/utils/PromiseUtils"
import {promiseMapCompat, thenOrApply} from "../../common/utils/PromiseUtils"
import type {BrowserData} from "../../../misc/ClientConstants"
import {BrowserType} from "../../../misc/ClientConstants"
import {InvalidDatabaseStateError} from "../../common/error/InvalidDatabaseStateError"
import {arrayHash} from "../../common/utils/ArrayUtils"
import {
	appendEntities,
	calculateNeededSpaceForNumber,
	decodeNumbers,
	encodeNumberBlock,
	iterateSearchIndexBlocks,
	removeSearchIndexRanges
} from "./SearchIndexEncoding"
import {isTest} from "../../Env"
import {random} from "../crypto/Randomizer"


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
	_promiseMapCompat: PromiseMapFn;

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

	constructor(db: Db, queue: EventQueue, browserData: BrowserData) {
		this.indexingSupported = true
		this.queue = queue
		this.db = db
		this._isStopped = false;
		this._promiseMapCompat = promiseMapCompat(this._needsMicrotaskHack(browserData))

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
			if (typeof attributeHandler.value !== "function") {
				throw new ProgrammingError("Value for attributeHandler is not a function: " + JSON.stringify(attributeHandler.attribute))
			}
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
		let encInstanceId = encryptIndexKeyUint8Array(this.db.key, id[1], this.db.iv)
		let encInstanceIdB64 = uint8ArrayToBase64(encInstanceId)

		let encryptionTimeStart = getPerformanceTimestamp()
		let encWordsB64 = []
		keyToIndexEntries.forEach((value, indexKey) => {
			let encWordB64 = encryptIndexKeyBase64(this.db.key, indexKey, this.db.iv)
			let indexEntries = indexUpdate.create.indexMap.get(encWordB64)
			encWordsB64.push(encWordB64)
			if (!indexEntries) {
				indexEntries = []
			}
			indexUpdate.create.indexMap.set(encWordB64, indexEntries.concat(value.map(indexEntry => encryptSearchIndexEntry(this.db.key, indexEntry, encInstanceId))))
		})

		indexUpdate.create.encInstanceIdToElementData.set(encInstanceIdB64, {
				listId,
				encWordsB64,
				ownerGroup
			}
		)

		this._stats.encryptionTime += getPerformanceTimestamp() - encryptionTimeStart
	}

	_processDeleted(event: EntityUpdate, indexUpdate: IndexUpdate): Promise<void> {
		const encInstanceIdB64 = encryptIndexKeyBase64(this.db.key, event.instanceId, this.db.iv)
		const encInstanceIdPlain = base64ToUint8Array(encInstanceIdB64)
		encryptIndexKeyBase64(this.db.key, event.instanceId, this.db.iv)
		return this.db.dbFacade.createTransaction(true, [ElementDataOS]).then(transaction => {
			return transaction.get(ElementDataOS, encInstanceIdB64).then(elementData => {
				if (!elementData) {
					return
				}
				let rowKeysBinary = aes256Decrypt(this.db.key, elementData[1], true, false)
				const rowKeys = decodeNumbers(rowKeysBinary)
				rowKeys.map(rowKey => {
					let ids = indexUpdate.delete.searchIndexRowToEncInstanceIds.get(rowKey)
					if (ids == null) {
						ids = []
					}
					ids.push(encInstanceIdPlain)
					indexUpdate.delete.searchIndexRowToEncInstanceIds.set(rowKey, ids)
				})
				indexUpdate.delete.encInstanceIds.push(encInstanceIdB64)
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
			SearchIndexWordsOS, SearchIndexOS, SearchIndexMetaDataOS, ElementDataOS, MetaDataOS, GroupDataOS
		])
		           .then(transaction => {
			           return Promise.resolve()
			                         .then(() => this._moveIndexedInstance(indexUpdate, transaction))
			                         .then(() => this._deleteIndexedInstance(indexUpdate, transaction))
			                         .then(() => this._insertNewIndexEntries(indexUpdate, transaction))
			                         .then((rowKeys: ?{[B64EncIndexKey]: number}) =>
				                         rowKeys && this._insertNewElementData(indexUpdate, transaction, rowKeys))
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
		performance.mark("deleteIndexEntryTotal-start")
		if (indexUpdate.delete.searchIndexRowToEncInstanceIds.size === 0) return null // keep transaction context open (only in Safari)
		performance.mark("deleteElementData-start")
		let deleteElementDataPromise = Promise.all(indexUpdate.delete.encInstanceIds.map(encInstanceId => transaction.delete(ElementDataOS, encInstanceId)))
		                                      .tap(() => {
			                                      performance.mark("deleteElementData-end")
		                                      })
		return Promise.all(Array.from(indexUpdate.delete.searchIndexRowToEncInstanceIds)
		                        .map(([row, encInstanceIds]) => this._deleteSearchIndexEntries(transaction, row, encInstanceIds)))
		              .then(() => deleteElementDataPromise)
		              .return()
		              .tap(() => {
			              performance.mark("deleteIndexEntryTotal-end")
			              performance.measure("deleteIndexEntryTotal", "deleteIndexEntryTotal-start", "deleteIndexEntryTotal-end")
			              performance.measure("deleteElementData", "deleteElementData-start", "deleteElementData-end")
			              // if (!isTest()) {
			              //     self.printMeasures()
			              // }
		              })
	}

	_deleteSearchIndexEntries(transaction: DbTransaction, searchIndexRowKey: number, encInstanceIds: Uint8Array[]): $Promisable<void> {
		this._cancelIfNeeded()

		const encInstanceIdSet = new Set(encInstanceIds.map((e) => arrayHash(e)))
		return transaction.get(SearchIndexOS, searchIndexRowKey).then((indexEntriesRow) => {
			if (!indexEntriesRow) return

			const [metaDataRowId, indexEntriesBinary] = indexEntriesRow
			performance.mark("findIndexEntriesInRows-start")
			const rangesToRemove = []

			const totalRowLength = iterateSearchIndexBlocks(indexEntriesBinary, ((block, start, end) => {
				if (encInstanceIdSet.has(arrayHash(getIdFromEncSearchIndexEntry(block)))) {
					rangesToRemove.push([start, end])
				}
			}))

			const newMetaDataSize = totalRowLength - rangesToRemove.length
			if (rangesToRemove.length === 0) {
				performance.mark("findIndexEntriesInRows-end")
				performance.measure("findIndexEntriesInRows", "findIndexEntriesInRows-start", "findIndexEntriesInRows-end")
				return
			} else if (totalRowLength === rangesToRemove.length) {
				performance.mark("findIndexEntriesInRows-end")
				performance.measure("findIndexEntriesInRows", "findIndexEntriesInRows-start", "findIndexEntriesInRows-end")
				return transaction.delete(SearchIndexOS, searchIndexRowKey)
				                  .then(() => this._updateMetaData(transaction, metaDataRowId, searchIndexRowKey, newMetaDataSize))
			} else {
				const trimmed = removeSearchIndexRanges(indexEntriesBinary, rangesToRemove)
				performance.mark("findIndexEntriesInRows-end")
				performance.measure("findIndexEntriesInRows", "findIndexEntriesInRows-start", "findIndexEntriesInRows-end")
				return transaction.put(SearchIndexOS, searchIndexRowKey, [metaDataRowId, trimmed])
				                  .then(() => this._updateMetaData(transaction, metaDataRowId, searchIndexRowKey, newMetaDataSize))
			}
		})
	}

	_updateMetaData(transaction: DbTransaction, metaDataId: number, searchIndexRowId: number, rowSize: number): Promise<void> {
		return transaction.getAsList(SearchIndexMetaDataOS, metaDataId).then((metaDataEntries: SearchIndexMetadataEntry[]) => {
			const metaDataIndex = metaDataEntries.findIndex((metaData) => metaData.key === searchIndexRowId)
			if (metaDataIndex !== -1) {
				if (rowSize > 0) {
					metaDataEntries[metaDataIndex].size = rowSize
				} else if (rowSize === 0) {
					metaDataEntries.splice(metaDataIndex, 1)
				}
			} else if (rowSize > 0) {
				metaDataEntries.push({
					size: rowSize,
					key: searchIndexRowId
				})
			}
			if (metaDataEntries.length !== 0) {
				return transaction.put(SearchIndexMetaDataOS, metaDataId, metaDataEntries)
			} else {
				return transaction.delete(SearchIndexMetaDataOS, metaDataId)
			}
		})
	}

	/**
	 * @return a map that contains all new encrypted instance ids
	 */
	_insertNewElementData(indexUpdate: IndexUpdate, transaction: DbTransaction, encWordToIndexRow: {[B64EncIndexKey]: number}): ?Promise<void> {
		this._cancelIfNeeded()
		if (indexUpdate.create.encInstanceIdToElementData.size === 0) return null // keep transaction context open (only in Safari)
		performance.mark("insertNewElementData-start")
		let promises = []
		indexUpdate.create.encInstanceIdToElementData.forEach((elementDataSurrogate, b64EncInstanceId) => {
			let encInstanceId = base64ToUint8Array(b64EncInstanceId)
			performance.mark("insertNewElementData_put-start")
			const encWords: Array<B64EncIndexKey> = elementDataSurrogate.encWordsB64
			const rowKeys = encWords.map((encWord) => encWordToIndexRow[encWord])
			const sizeBinary = rowKeys.reduce((acc, key) => acc + calculateNeededSpaceForNumber(key), 0)
			const rowKeysBinary = new Uint8Array(sizeBinary)
			let offset = 0
			rowKeys.forEach((rowKey) => {
				offset += encodeNumberBlock(rowKey, rowKeysBinary, offset)
			})
			const encRowKeys = aes256Encrypt(this.db.key, rowKeysBinary, random.generateRandomData(IV_BYTE_LENGTH), true, false)
			return transaction.put(ElementDataOS, b64EncInstanceId, [elementDataSurrogate.listId, encRowKeys, elementDataSurrogate.ownerGroup]).finally(() => {
				performance.mark("insertNewElementData_put-end")
				performance.measure("insertNewElementData_put", "insertNewElementData_put-start", "insertNewElementData_put-end")
			})
		})
		return Promise.all(promises).finally(() => {
			performance.mark("insertNewElementData-end")
			performance.measure("insertNewElementData", "insertNewElementData-start", "insertNewElementData-end")
		})
	}

	_insertNewIndexEntries(indexUpdate: IndexUpdate, transaction: DbTransaction): ?Promise<{[B64EncIndexKey]: number}> {
		this._cancelIfNeeded()
		performance.mark("insertNewIndexEntries-start")
		let keys = [...indexUpdate.create.indexMap.keys()]
		const keyToIndexEntryKey: {[B64EncIndexKey]: number} = {}
		const result = this._promiseMapCompat(keys, (encWordB64) => {
			const encryptedEntries = neverNull(indexUpdate.create.indexMap.get(encWordB64))
			return thenOrApply(this._putEncryptedEntity(indexUpdate.groupId, transaction, encWordB64, encryptedEntries), (rowId) => {
				keyToIndexEntryKey[encWordB64] = rowId
			})
		}, {concurrency: 1})

		return result instanceof Promise
			? result.return(keyToIndexEntryKey).tap(() => {
				performance.mark("insertNewIndexEntries-end")
				performance.measure("insertNewIndexEntries", "insertNewIndexEntries-start", "insertNewIndexEntries-end")
			})
			: null
	}


	_putEncryptedEntity(groupId: Id, transaction: DbTransaction, encWordB64: B64EncIndexKey, encryptedEntries: EncryptedSearchIndexEntry[]): ?Promise<number> {
		this._cancelIfNeeded()
		if (encryptedEntries.length > 0) {
			performance.mark("insertNewIndexEntries_getMeta-start")
			return transaction
				.get(SearchIndexWordsOS, encWordB64)
				.then((metaDataRowId: ?number) => this._getOrCreateSearchIndexMeta(transaction, encWordB64, metaDataRowId))
				.then(({rowId: metaRowId, entries: metadata}) => {
					performance.mark("insertNewIndexEntries_getMeta-end")
					performance.measure("insertNewIndexEntries_getMeta", "insertNewIndexEntries_getMeta-start", "insertNewIndexEntries_getMeta-end")
					const safeMetaData = neverNull(metadata)
					const maxSize = SEARCH_INDEX_ROW_LENGTH - encryptedEntries.length
					const vacantRow = metadata.find(entry => entry.size < maxSize)
					performance.mark("insertNewIndexEntries_putIndexNew-start")
					if (!vacantRow) { // new entries do not fit into existing search index row, create new row
						const binaryRow = appendEntities(encryptedEntries)
						return transaction.put(SearchIndexOS, null, [metaRowId, binaryRow])
						                  .then(newId => {
							                  safeMetaData.push({
								                  key: newId,
								                  size: encryptedEntries.length
							                  })
							                  return [metaRowId, safeMetaData, newId]
						                  })
						                  .finally(() => {
							                  performance.mark("insertNewIndexEntries_putIndexNew-end")
							                  performance.measure("insertNewIndexEntries_putIndexNew", "insertNewIndexEntries_putIndexNew-start", "insertNewIndexEntries_putIndexNew-end")
						                  })
					} else {
						// add new entries to existing search index row
						performance.mark("insertNewIndexEntries_getRow-start")
						return transaction.get(SearchIndexOS, vacantRow.key)
						                  .then((indexEntriesRow) => {
							                  performance.mark("insertNewIndexEntries_getRow-end")
							                  performance.measure("insertNewIndexEntries_getRow", "insertNewIndexEntries_getRow-start", "insertNewIndexEntries_getRow-end")
							                  performance.mark("insertNewIndexEntries_putIndex-start")
							                  let safeRow = indexEntriesRow && indexEntriesRow[1] || new Uint8Array(0)
							                  const resultRow = appendEntities(encryptedEntries, safeRow)
							                  return transaction.put(SearchIndexOS, vacantRow.key, [metaRowId, resultRow])
							                                    .then(() => {
								                                    vacantRow.size += encryptedEntries.length
								                                    return [metaRowId, safeMetaData, vacantRow.key]
							                                    })
						                  })
						                  .finally(() => {
							                  performance.mark("insertNewIndexEntries_putIndex-end")
							                  performance.measure("insertNewIndexEntries_putIndex", "insertNewIndexEntries_putIndex-start", "insertNewIndexEntries_putIndex-end")
						                  })
					}
				})
				.then(([metaDataRowId, metaData, rowId]) => {
					const columnSize = metaData.reduce((result, metaDataEntry) => result
						+ metaDataEntry.size, 0)
					this._stats.writeRequests += 1
					this._stats.largestColumn = columnSize > this._stats.largestColumn
						? columnSize : this._stats.largestColumn
					this._stats.storedBytes += encryptedEntries.reduce((sum, e) =>
						sum + e.length, 0)
					performance.mark("insertNewIndexEntries_putMeta-start")
					return transaction.put(SearchIndexMetaDataOS, metaDataRowId, metaData)
					                  .return(rowId)
					                  .finally(() => {
						                  performance.mark("insertNewIndexEntries_putMeta-end")
						                  performance.measure("insertNewIndexEntries_putMeta", "insertNewIndexEntries_putMeta-start", "insertNewIndexEntries_putMeta-end")
					                  })
				})

		}
	}

	_getOrCreateSearchIndexMeta(transaction: DbTransaction, encWordBase64: B64EncIndexKey, metaDataRowId: ?number): Promise<{rowId: number, entries: SearchIndexMetadataEntry[]}> {
		const rowId = metaDataRowId
		if (rowId) {
			return transaction.getAsList(SearchIndexMetaDataOS, rowId).then(entries => ({rowId, entries}))
		} else {
			return transaction.put(SearchIndexMetaDataOS, null, []).then(newMetaDataRowId => {
				this._stats.words += 1
				return transaction.put(SearchIndexWordsOS, encWordBase64, newMetaDataRowId).then(() => ({rowId: newMetaDataRowId, entries: []}))
			})
		}
	}

	_updateGroupData(indexUpdate: IndexUpdate, transaction: DbTransaction): ?Promise<void> {
		this._cancelIfNeeded()
		if (indexUpdate.batchId || indexUpdate.indexTimestamp != null) { // check timestamp for != null here because "0" is a valid value to write
			// update group data
			return transaction.get(GroupDataOS, indexUpdate.groupId).then((groupData: ?GroupData) => {
				if (!groupData) {
					throw new InvalidDatabaseStateError("GroupData not available for group " + indexUpdate.groupId)
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


	_needsMicrotaskHack(browserData: BrowserData): boolean {
		return browserData.browserType === BrowserType.SAFARI
			|| browserData.browserType === BrowserType.PALEMOON
			|| browserData.browserType === BrowserType.WATERFOX
			|| browserData.browserType === BrowserType.FIREFOX && browserData.browserVersion < 60
			|| browserData.browserType === BrowserType.CHROME && browserData.browserVersion < 59;
	}

	printStatus() {
		const totalTime = this._stats.indexingTime + this._stats.storageTime + this._stats.downloadingTime
			+ this._stats.encryptionTime
		console.log(JSON.stringify(this._stats), "total time: ", totalTime)
	}
}

export function measure(names: string[]) {
	const measures = {}
	for (let name of names) {
		try {
			measures[name] = performance.getEntriesByName(name, "measure")
			                            .reduce((acc, entry) => acc + entry.duration, 0)
		} catch (e) {
		}
	}
	performance.clearMeasures()
	console.log(JSON.stringify(measures))
}

if (!isTest()) {
	self.printMeasures = () => {
		measure([
			"insertNewIndexEntries",
			"deleteIndexEntryTotal",
			"deleteElementData",
			"findIndexEntriesInRows"
		])
	}
}
