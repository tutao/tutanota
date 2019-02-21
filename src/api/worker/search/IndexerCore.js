//@flow
import {DbTransaction, ElementDataOS, GroupDataOS, MetaDataOS, SearchIndexMetaDataOS, SearchIndexOS, SearchIndexWordsIndex} from "./DbFacade"
import {elementIdPart, firstBiggerThanSecond, listIdPart, TypeRef} from "../../common/EntityFunctions"
import {tokenize} from "./Tokenizer"
import {getOrInsert, mergeMaps} from "../../common/utils/MapUtils"
import {neverNull, noOp} from "../../common/utils/Utils"
import {base64ToUint8Array, generatedIdToTimestamp, uint8ArrayToBase64} from "../../common/utils/Encoding"
import {aes256Decrypt, aes256Encrypt, IV_BYTE_LENGTH} from "../crypto/Aes"
import {
	byteLength,
	decryptIndexKeyBase64,
	decryptMetaData,
	encryptIndexKeyBase64,
	encryptIndexKeyUint8Array,
	encryptMetaData,
	encryptSearchIndexEntry,
	getIdFromEncSearchIndexEntry,
	getPerformanceTimestamp,
	typeRefToTypeInfo
} from "./IndexUtils"
import type {
	AttributeHandler,
	B64EncIndexKey,
	Db,
	EncInstanceIdWithTimestamp,
	EncryptedSearchIndexMetaDataRow,
	EncSearchIndexEntryWithTimestamp,
	EncWordToMetaRow,
	GroupData,
	IndexUpdate,
	SearchIndexEntry,
	SearchIndexMetadataEntry,
	SearchIndexMetaDataRow,
	SearchIndexRow
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
import {arrayHash, findLastIndex} from "../../common/utils/ArrayUtils"
import {
	appendBinaryBlocks,
	calculateNeededSpaceForNumbers,
	decodeNumbers,
	encodeNumbers,
	iterateBinaryBlocks,
	removeBinaryBlockRanges
} from "./SearchIndexEncoding"
import {random} from "../crypto/Randomizer"


const SEARCH_INDEX_ROW_LENGTH = 1000

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
		const listId = listIdPart(id)
		const encInstanceId = encryptIndexKeyUint8Array(this.db.key, elementIdPart(id), this.db.iv)
		const encInstanceIdB64 = uint8ArrayToBase64(encInstanceId)
		const elementIdTimestamp = generatedIdToTimestamp(elementIdPart(id))

		const encryptionTimeStart = getPerformanceTimestamp()
		const encWordsB64 = []
		keyToIndexEntries.forEach((value, indexKey) => {
			let encWordB64 = encryptIndexKeyBase64(this.db.key, indexKey, this.db.iv)
			let indexEntries = indexUpdate.create.indexMap.get(encWordB64)
			encWordsB64.push(encWordB64)
			if (!indexEntries) {
				indexEntries = []
			}
			indexUpdate.create.indexMap.set(encWordB64, indexEntries.concat(value.map(indexEntry => ({
				entry: encryptSearchIndexEntry(this.db.key, indexEntry, encInstanceId),
				timestamp: elementIdTimestamp,
				encodedId: encInstanceIdB64
			}))))
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
		const {appId, typeId} = typeRefToTypeInfo(new TypeRef(event.application, event.type))
		return this.db.dbFacade.createTransaction(true, [ElementDataOS]).then(transaction => {
			return transaction.get(ElementDataOS, encInstanceIdB64).then(elementData => {
				if (!elementData) {
					return
				}
				let rowKeysBinary = aes256Decrypt(this.db.key, elementData[1], true, false)
				const rowKeys = decodeNumbers(rowKeysBinary)
				rowKeys.map(rowKey => {
					let ids = indexUpdate.delete.searchMetaRowToEncInstanceIds.get(rowKey)
					if (ids == null) {
						ids = []
					}
					ids.push({encInstanceId: encInstanceIdPlain, timestamp: generatedIdToTimestamp(event.instanceId), appId, typeId})
					indexUpdate.delete.searchMetaRowToEncInstanceIds.set(rowKey, ids)
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
			SearchIndexOS, SearchIndexMetaDataOS, ElementDataOS, MetaDataOS, GroupDataOS
		])
		           .then(transaction => {
			           return Promise.resolve()
			                         .then(() => this._moveIndexedInstance(indexUpdate, transaction))
			                         .then(() => this._deleteIndexedInstance(indexUpdate, transaction))
			                         .then(() => this._insertNewIndexEntries(indexUpdate, transaction))
			                         .then((rowKeys: ?EncWordToMetaRow) =>
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

		if (indexUpdate.delete.searchMetaRowToEncInstanceIds.size === 0) return null // keep transaction context open (only in Safari)
		let deleteElementDataPromise = Promise.all(indexUpdate.delete.encInstanceIds.map(encInstanceId => transaction.delete(ElementDataOS, encInstanceId)))
		return Promise.all(Array.from(indexUpdate.delete.searchMetaRowToEncInstanceIds)
		                        .map(([row, encInstanceIds]) => this._deleteSearchIndexEntries(transaction, row, encInstanceIds)))
		              .then(() => deleteElementDataPromise)
		              .return()
	}

	_deleteSearchIndexEntries(transaction: DbTransaction, searchIndexRowKey: number, instanceInfos: EncInstanceIdWithTimestamp[]): Promise<*> {
		this._cancelIfNeeded()
		const encInstanceIdSet = new Set(instanceInfos.map((e) => arrayHash(e.encInstanceId)))
		return transaction
			.get(SearchIndexMetaDataOS, searchIndexRowKey)
			.then((encMetaDataRow) => {
				if (!encMetaDataRow) { // already deleted
					return
				}
				const metaDataRow = decryptMetaData(this.db.key, encMetaDataRow)
				const metaEntriesForInstances = instanceInfos.map((info) => {
					const entryIndex = this._findMetaDataEntryByTimestamp(metaDataRow, info.timestamp, info.appId, info.typeId)
					if (entryIndex === -1) {
						console.error("metaRow, info", metaDataRow.rows.map(r => JSON.stringify(r)), info)
						throw new Error("Couldn't find meta entry?")
					}
					return [info, metaDataRow.rows[entryIndex]]
				})
				const updateSearchIndex = this._promiseMapCompat(metaEntriesForInstances, ([info, metaEntry]) => {
					transaction
						.get(SearchIndexOS, metaEntry.key)
						.then((indexEntriesRow) => {
							if (!indexEntriesRow) return
							const [metaDataRowId, indexEntriesBinary] = indexEntriesRow
							const rangesToRemove = []
							iterateBinaryBlocks(indexEntriesBinary, ((block, start, end) => {
								if (encInstanceIdSet.has(arrayHash(getIdFromEncSearchIndexEntry(block)))) {
									rangesToRemove.push([start, end])
								}
							}))
							if (rangesToRemove.length === 0) {
								return
							} else if (metaEntry.size === rangesToRemove.length) {
								metaEntry.size = 0
								return transaction.delete(SearchIndexOS, searchIndexRowKey)
							} else {
								const trimmed = removeBinaryBlockRanges(indexEntriesBinary, rangesToRemove)
								metaEntry.size -= rangesToRemove.length
								return transaction.put(SearchIndexOS, searchIndexRowKey, [metaDataRowId, trimmed])
							}
						})
				})
				return thenOrApply(updateSearchIndex, () => {
					metaDataRow.rows = metaDataRow.rows.filter((r) => r.size > 0)
					if (metaDataRow.rows.length === 0) {
						return transaction.delete(SearchIndexMetaDataOS, metaDataRow.id)
					} else {
						return transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(this.db.key, metaDataRow))
					}
				})
			})
	}

	_insertNewElementData(indexUpdate: IndexUpdate, transaction: DbTransaction, encWordToMetaRow: EncWordToMetaRow): ?Promise<*> {
		this._cancelIfNeeded()
		if (indexUpdate.create.encInstanceIdToElementData.size === 0) return null // keep transaction context open (only in Safari)
		let promises = []
		indexUpdate.create.encInstanceIdToElementData.forEach((elementDataSurrogate, b64EncInstanceId) => {
			const metaRows = elementDataSurrogate.encWordsB64.map((w) => encWordToMetaRow[w])
			const rowKeysBinary = new Uint8Array(calculateNeededSpaceForNumbers(metaRows))
			encodeNumbers(metaRows, rowKeysBinary)
			const encMetaRowKeys = aes256Encrypt(this.db.key, rowKeysBinary, random.generateRandomData(IV_BYTE_LENGTH), true, false)
			return transaction.put(ElementDataOS, b64EncInstanceId, [elementDataSurrogate.listId, encMetaRowKeys, elementDataSurrogate.ownerGroup])
		})
		return Promise.all(promises)
	}

	_insertNewIndexEntries(indexUpdate: IndexUpdate, transaction: DbTransaction): ?Promise<EncWordToMetaRow> {
		this._cancelIfNeeded()
		let keys = [...indexUpdate.create.indexMap.keys()]
		const encWordToMetaRow: EncWordToMetaRow = {}
		const result = this._promiseMapCompat(keys, (encWordB64) => {
			const encryptedEntries = neverNull(indexUpdate.create.indexMap.get(encWordB64))
			return this._putEncryptedEntity(indexUpdate.groupId, indexUpdate.appId, indexUpdate.typeId, transaction, encWordB64,
				encWordToMetaRow, encryptedEntries)
		}, {concurrency: 2})

		return result instanceof Promise
			? result.return(encWordToMetaRow)
			: null
	}

	_putEncryptedEntity(groupId: Id, appId: number, typeId: number, transaction: DbTransaction, encWordB64: B64EncIndexKey, encWordToMetaRow: EncWordToMetaRow,
	                    encryptedEntries: Array<EncSearchIndexEntryWithTimestamp>): ?Promise<*> {
		this._cancelIfNeeded()
		if (encryptedEntries.length <= 0) {
			return
		}

		return this
			._getOrCreateSearchIndexMeta(transaction, encWordB64)
			.then((metaData: SearchIndexMetaDataRow) => {
				encryptedEntries.sort((a, b) => a.timestamp - b.timestamp)
				return this._writeEntries(transaction, encryptedEntries, metaData, appId, typeId)
				           .return(metaData)
			})
			.then((metaData) => {
				const columnSize = metaData.rows.reduce((result, metaDataEntry) => result
					+ metaDataEntry.size, 0)
				this._stats.writeRequests += 1
				this._stats.largestColumn = columnSize > this._stats.largestColumn
					? columnSize : this._stats.largestColumn
				this._stats.storedBytes += encryptedEntries.reduce((sum, e) =>
					sum + e.entry.length, 0)
				encWordToMetaRow[encWordB64] = metaData.id
				return transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(this.db.key, metaData))
			})
	}

	_writeEntries(transaction: DbTransaction, entries: Array<EncSearchIndexEntryWithTimestamp>, metaData: SearchIndexMetaDataRow, appId: number,
	              typeId: number): Promise<*> {
		if (entries.length === 0) {
			return Promise.resolve()
		} else if (entries.length === 1) {
			// console.log("one entry", entries[0].encodedId)
		} else {
			// console.log("entries.length", entries.length)
		}
		const ifOne: (...any) => void = entries.length === 1 ? console.log.bind(console) : noOp
		const oldestTimestamp = entries[0].timestamp
		const indexOfMetaEntry = this._findMetaDataEntryByTimestamp(metaData, oldestTimestamp, appId, typeId)
		if (indexOfMetaEntry !== -1) {
			const nextEntry = this._nextEntryOfType(metaData, indexOfMetaEntry, appId, typeId)
			if (!nextEntry) {
				return this._appendIndexEntriesToRow(transaction, metaData, indexOfMetaEntry, entries)
			} else {
				const [toCurrentOne, toNextOnes] = this._splitByTimestamp(entries, nextEntry.oldestElementTimestamp)
				return this._appendIndexEntriesToRow(transaction, metaData, indexOfMetaEntry, toCurrentOne)
				           .then(() => this._writeEntries(transaction, toNextOnes, metaData, appId, typeId))
			}
		} else {
			// we have not found any entry which oldest id is lower than oldest id to add but there can be other entries
			const firstEntry = this._nextEntryOfType(metaData, -1, appId, typeId)
			// 1. We have a first entry.
			//   i: We have a second entry. Check how much fits into the first block
			//     a. It's not oversized. Write to it.
			//     b. It is oversized. Create a new block.
			//   ii: We don't have a second entry. Check if we can fit everything into the first block
			//     a. It's not eversized. Write to it.
			//     b. It's oversized. Create a new one.
			// 2. We don't have a first entry. Just create a new row with everything.
			if (firstEntry) {
				const secondEntry = this._nextEntryOfType(metaData, 0, appId, typeId)
				const [toFirstOne, toNextOnes] = secondEntry
					? this._splitByTimestamp(entries, secondEntry.oldestElementTimestamp)
					: [entries, []]
				if (firstEntry.size + toFirstOne.length < SEARCH_INDEX_ROW_LENGTH) {
					return this._appendIndexEntriesToRow(transaction, metaData, 0, toFirstOne)
					           .then(() => this._writeEntries(transaction, toNextOnes, metaData, appId, typeId))
				} else {
					const [toNewOne, toCurrentOne] = this._splitByTimestamp(toFirstOne, firstEntry.oldestElementTimestamp)
					return this
						._createNewRow(transaction, metaData, toNewOne, oldestTimestamp, appId, typeId)
						.then((newMetaEntry) => {
							metaData.rows.unshift(newMetaEntry)
						})
						.then(() => this._writeEntries(transaction, toCurrentOne.concat(toNextOnes), metaData, appId, typeId))
				}
			} else {
				return this
					._createNewRow(transaction, metaData, entries, oldestTimestamp, appId, typeId)
					.then(metaDataEntry => {
						metaData.rows.unshift(metaDataEntry)
					})
			}
		}
	}

	_nextEntryOfType(metaData: SearchIndexMetaDataRow, currentIndex: number, appId: number, typeId: number): ?SearchIndexMetadataEntry {
		for (let i = currentIndex + 1; i < metaData.rows.length; i++) {
			if (metaData.rows[i].app === appId && metaData.rows[i].type === typeId) {
				return metaData.rows[i]
			}
		}
		return null
	}


	_splitByTimestamp(entries: Array<EncSearchIndexEntryWithTimestamp>,
	                  timestamp: number): [Array<EncSearchIndexEntryWithTimestamp>, Array<EncSearchIndexEntryWithTimestamp>] {
		const indexOfSplit = entries.findIndex((entry) => entry.timestamp >= timestamp)
		if (indexOfSplit === -1) {
			return [entries, []]
		}
		const below = entries.slice(0, indexOfSplit)
		const above = entries.slice(indexOfSplit)
		return [below, above]
	}


	_appendIndexEntriesToRow(transaction: DbTransaction, metaData: SearchIndexMetaDataRow, metaEntryIndex: number,
	                         entries: Array<EncSearchIndexEntryWithTimestamp>): Promise<Array<number>> {
		if (entries.length === 0) {
			return Promise.resolve([])
		}
		const metaEntry = metaData.rows[metaEntryIndex]
		if (metaEntry.size + entries.length > SEARCH_INDEX_ROW_LENGTH) {
			// load existing row
			// decrypt ids
			// sort by id
			// split
			return transaction.get(SearchIndexOS, metaEntry.key).then((row: ?SearchIndexRow) => {
				if (!row) {
					throw new InvalidDatabaseStateError("non existing index row")
				}
				const [metaReference, binaryBlock] = row;
				const timestampToEntries: Map<number, Array<Uint8Array>> = new Map()
				const existingIds = new Set()
				iterateBinaryBlocks(binaryBlock, (encSearchIndexEntry, start, end, iteration) => {
					const encId = getIdFromEncSearchIndexEntry(encSearchIndexEntry)
					existingIds.add(arrayHash(encId))
					const decId = decryptIndexKeyBase64(this.db.key, encId, this.db.iv)
					const timeStamp = generatedIdToTimestamp(decId)
					getOrInsert(timestampToEntries, timeStamp, () => []).push(encSearchIndexEntry)
				})
				entries.forEach(({entry, timestamp}) => {
					getOrInsert(timestampToEntries, timestamp, () => []).push(entry)
				})

				const sortedIds = Array.from(timestampToEntries.keys()).sort((l, r) => l - r)
				console.log("order of ids", sortedIds)
				let firstRow = []
				let secondRow = []
				let firstRowOldestId = sortedIds[0]
				let secondRowOldestId = Number.MAX_SAFE_INTEGER
				sortedIds.forEach((id) => {
					const encryptedEntries = neverNull(timestampToEntries.get(id))
					if (firstRow.length + encryptedEntries.length > SEARCH_INDEX_ROW_LENGTH / 2) {
						secondRowOldestId = Math.min(secondRowOldestId, id)
						secondRow.push(...encryptedEntries)
					} else {
						firstRow.push(...encryptedEntries)
					}
				})
				const firstRowBinary = appendBinaryBlocks(firstRow)
				const secondRowBinary = appendBinaryBlocks(secondRow)
				return Promise.all([
						transaction.put(SearchIndexOS, metaEntry.key, [metaData.id, firstRowBinary])
						           .then(() => {
							           metaEntry.size = firstRow.length
							           metaEntry.oldestElementTimestamp = firstRowOldestId
							           if (new Date(metaEntry.oldestElementTimestamp).getFullYear() > 2019) {
								           console.error("sorted ids: ", sortedIds)
								           throw new Error("Bogus timestmap: " + metaEntry.oldestElementTimestamp)
							           }
							           return metaEntry.key
						           }),
						transaction.put(SearchIndexOS, null, [metaData.id, secondRowBinary])
						           .then((newSearchIndexRowId) => {
							           metaData.rows.splice(metaEntryIndex + 1, 0, {
								           key: newSearchIndexRowId,
								           size: secondRow.length,
								           app: metaEntry.app,
								           type: metaEntry.type,
								           oldestElementTimestamp: secondRowOldestId
							           })
							           if (new Date(metaEntry.oldestElementTimestamp).getFullYear() > 2019) {
								           console.error("sorted ids: ", sortedIds)
								           throw new Error("Bogus timestmap: " + metaEntry.oldestElementTimestamp)
							           }
							           return newSearchIndexRowId
						           })
					]
				)
			})
		} else {
			return transaction
				.get(SearchIndexOS, metaEntry.key)
				.then((indexEntriesRow) => {
					let safeRow = indexEntriesRow && indexEntriesRow[1] || new Uint8Array(0)
					const resultRow = appendBinaryBlocks(entries.map((e) => e.entry), safeRow)
					return transaction.put(SearchIndexOS, metaEntry.key, [metaData.id, resultRow])
					                  .then(() => {
						                  metaEntry.size += entries.length
						                  metaEntry.oldestElementTimestamp = entries.reduce((acc, e) => Math.min(acc, e.timestamp), metaEntry.oldestElementTimestamp)
						                  return [metaEntry.key]
					                  })
				})
		}
	}

	_createNewRow(transaction: DbTransaction, metaData: SearchIndexMetaDataRow, encryptedSearchIndexEntries: Array<EncSearchIndexEntryWithTimestamp>,
	              oldestTimestamp: number, appId: number, typeId: number): Promise<SearchIndexMetadataEntry> {
		const binaryRow = appendBinaryBlocks(encryptedSearchIndexEntries.map(e => e.entry))
		return transaction
			.put(SearchIndexOS, null, [metaData.id, binaryRow])
			.then(newRowId => {
				// Oldest entries come in front
				return {
					key: newRowId,
					size: encryptedSearchIndexEntries.length,
					app: appId,
					type: typeId,
					oldestElementTimestamp: oldestTimestamp
				}
			})

	}

	_findMetaDataEntryByTimestamp(metaData: SearchIndexMetaDataRow, oldestTimestamp: number, appId: number, typeId: number): number {
		return findLastIndex(metaData.rows,
			(r) => r.app === appId
				&& r.type === typeId
				&& r.oldestElementTimestamp <= oldestTimestamp)
	}


	_getOrCreateSearchIndexMeta(transaction: DbTransaction, encWordBase64: B64EncIndexKey): Promise<SearchIndexMetaDataRow> {
		return transaction
			.get(SearchIndexMetaDataOS, encWordBase64, SearchIndexWordsIndex)
			.then((metaData: ?EncryptedSearchIndexMetaDataRow) => {
				if (metaData) {
					return decryptMetaData(this.db.key, metaData)
				} else {
					return transaction
						.put(SearchIndexMetaDataOS, null, {word: encWordBase64, rows: new Uint8Array(0)})
						.then((rowId) => {
							this._stats.words += 1
							return {id: rowId, word: encWordBase64, rows: []}
						})

				}
			})
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
