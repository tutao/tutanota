//@flow
import type {DbTransaction} from "./DbFacade"
import {ElementDataOS, GroupDataOS, MetaDataOS, SearchIndexMetaDataOS, SearchIndexOS, SearchIndexWordsIndex} from "./DbFacade"
import {elementIdPart, firstBiggerThanSecond, listIdPart, TypeRef} from "../../common/EntityFunctions"
import {tokenize} from "./Tokenizer"
import {getFromMap, mergeMaps} from "../../common/utils/MapUtils"
import {neverNull} from "../../common/utils/Utils"
import {generatedIdToTimestamp, uint8ArrayToBase64} from "../../common/utils/Encoding"
import {aes256Decrypt, aes256Encrypt, IV_BYTE_LENGTH} from "../crypto/Aes"
import {
	byteLength,
	decryptIndexKey,
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
	EncryptedSearchIndexEntry,
	EncSearchIndexEntryWithTimestamp,
	EncWordToMetaRow,
	GroupData,
	IndexUpdate,
	SearchIndexDbRow,
	SearchIndexEntry,
	SearchIndexMetaDataDbRow,
	SearchIndexMetadataEntry,
	SearchIndexMetaDataRow
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

	/****************************************** Preparing the update ***********************************************/

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

	/**
	 * Encrypt search index entries created by {@link createIndexEntriesForAttributes} and put them into the {@param indexUpdate}.
	 * @param id of the instance
	 * @param ownerGroup of the instance
	 * @param keyToIndexEntries map from search index keys (words which you can search for) to index entries
	 * @param indexUpdate IndexUpdate for which {@code create} fields will be populated
	 */
	encryptSearchIndexEntries(id: IdTuple, ownerGroup: Id, keyToIndexEntries: Map<string, SearchIndexEntry[]>, indexUpdate: IndexUpdate): void {
		const listId = listIdPart(id)
		const encInstanceId = encryptIndexKeyUint8Array(this.db.key, elementIdPart(id), this.db.iv)
		const encInstanceIdB64 = uint8ArrayToBase64(encInstanceId)
		const elementIdTimestamp = generatedIdToTimestamp(elementIdPart(id))

		const encryptionTimeStart = getPerformanceTimestamp()
		const encWordsB64 = []
		keyToIndexEntries.forEach((value, indexKey) => {
			const encWordB64 = encryptIndexKeyBase64(this.db.key, indexKey, this.db.iv)
			encWordsB64.push(encWordB64)
			const encIndexEntries = getFromMap(indexUpdate.create.indexMap, encWordB64, () => [])
			value.forEach(indexEntry => encIndexEntries.push({
				entry: encryptSearchIndexEntry(this.db.key, indexEntry, encInstanceId),
				timestamp: elementIdTimestamp
			}))
		})

		indexUpdate.create.encInstanceIdToElementData.set(encInstanceIdB64, {
				listId,
				encWordsB64,
				ownerGroup
			}
		)

		this._stats.encryptionTime += getPerformanceTimestamp() - encryptionTimeStart
	}

	/**
	 * Process delete event before applying to the index.
	 */
	_processDeleted(event: EntityUpdate, indexUpdate: IndexUpdate): Promise<void> {
		const encInstanceIdPlain = encryptIndexKeyUint8Array(this.db.key, event.instanceId, this.db.iv)
		const encInstanceIdB64 = uint8ArrayToBase64(encInstanceIdPlain)
		const {appId, typeId} = typeRefToTypeInfo(new TypeRef(event.application, event.type))
		return this.db.dbFacade.createTransaction(true, [ElementDataOS]).then(transaction => {
			return transaction.get(ElementDataOS, encInstanceIdB64).then(elementData => {
				if (!elementData) {
					return
				}
				// We need to find SearchIndex rows which we want to update. In the ElementData we have references to the metadata and we can find
				// corresponding SearchIndex row in it.
				const metaDataRowKeysBinary = aes256Decrypt(this.db.key, elementData[1], true, false)
				// For every word we have a metadata reference and we want to update them all.
				const metaDataRowKeys = decodeNumbers(metaDataRowKeysBinary)
				metaDataRowKeys.forEach(metaDataRowKey => {
					// We add current instance into list of instances to delete for each word
					const ids = getFromMap(indexUpdate.delete.searchMetaRowToEncInstanceIds, metaDataRowKey, () => [])
					ids.push({encInstanceId: encInstanceIdPlain, appId, typeId, timestamp: generatedIdToTimestamp(event.instanceId)})
				})
				indexUpdate.delete.encInstanceIds.push(encInstanceIdB64)
			})
		})
	}

	/********************************************* Manipulating the state ***********************************************/

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

	/*********************************************** Writing index update ***********************************************/

	/**
	 * Apply populated {@param indexUpdate} to the database.
	 */
	writeIndexUpdate(indexUpdate: IndexUpdate): Promise<void> {
		let startTimeStorage = getPerformanceTimestamp()
		if (this._isStopped) {
			return Promise.reject(new CancelledError("mail indexing cancelled"))
		}
		return this
			.db.dbFacade.createTransaction(false, [SearchIndexOS, SearchIndexMetaDataOS, ElementDataOS, MetaDataOS, GroupDataOS])
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

	/**
	 * Apply "delete" updates to the database
	 * @private
	 */
	_deleteIndexedInstance(indexUpdate: IndexUpdate, transaction: DbTransaction): ?Promise<void> {
		this._cancelIfNeeded()

		if (indexUpdate.delete.searchMetaRowToEncInstanceIds.size === 0) return null // keep transaction context open
		let deleteElementDataPromise = Promise.all(indexUpdate.delete.encInstanceIds.map(encInstanceId => transaction.delete(ElementDataOS, encInstanceId)))
		// For each word we have list of instances we want to remove
		return Promise.all(Array.from(indexUpdate.delete.searchMetaRowToEncInstanceIds)
		                        .map(([metaRowKey, encInstanceIds]) => this._deleteSearchIndexEntries(transaction, metaRowKey, encInstanceIds)))
		              .then(() => deleteElementDataPromise)
		              .return()
	}

	/**
	 * Remove all {@param instanceInfos} from the SearchIndex entries and metadata entreis specified by the {@param metaRowKey}.
	 * @private
	 */
	_deleteSearchIndexEntries(transaction: DbTransaction, metaRowKey: number, instanceInfos: EncInstanceIdWithTimestamp[]): Promise<*> {
		this._cancelIfNeeded()
		// Collect hashes of all instances we want to delete to check it faster later
		const encInstanceIdSet = new Set(instanceInfos.map((e) => arrayHash(e.encInstanceId)))
		return transaction
			.get(SearchIndexMetaDataOS, metaRowKey)
			.then((encMetaDataRow) => {
				if (!encMetaDataRow) { // already deleted
					return
				}
				const metaDataRow = decryptMetaData(this.db.key, encMetaDataRow)
				// add meta data to set to only update meta data once when deleting multiple instances
				const metaDataEntriesSet = new Set()
				instanceInfos.forEach((info) => {
					// For each instance we find SearchIndex row it belongs to by timestamp
					const entryIndex = this._findMetaDataEntryByTimestamp(metaDataRow, info.timestamp, info.appId, info.typeId)
					if (entryIndex === -1) {
						console.warn("could not find MetaDataEntry, info:", info, "rows: ", metaDataRow.rows.map(r => JSON.stringify(r)),)
					} else {
						metaDataEntriesSet.add(metaDataRow.rows[entryIndex])
					}
				})
				// For each SearchIndex row we need to update...
				const updateSearchIndex = this._promiseMapCompat(Array.from(metaDataEntriesSet), metaEntry => {
					return transaction
						.get(SearchIndexOS, metaEntry.key)
						.then((indexEntriesRow) => {
							if (!indexEntriesRow) return
							// Find all entries we need to remove by hash of the encrypted ID
							const rangesToRemove = []
							iterateBinaryBlocks(indexEntriesRow, ((block, start, end) => {
								if (encInstanceIdSet.has(arrayHash(getIdFromEncSearchIndexEntry(block)))) {
									rangesToRemove.push([start, end])
								}
							}))
							if (rangesToRemove.length === 0) {
								return
							} else if (metaEntry.size === rangesToRemove.length) {
								metaEntry.size = 0
								return transaction.delete(SearchIndexOS, metaEntry.key)
							} else {
								const trimmed = removeBinaryBlockRanges(indexEntriesRow, rangesToRemove)
								metaEntry.size -= rangesToRemove.length
								return transaction.put(SearchIndexOS, metaEntry.key, trimmed)
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

	/**
	 * Insert {@param entries} into the database for the corresponding {@param metaData}.
	 * Metadata entries for each type are sorted from oldest to newest. Each metadata entry has oldest element timestamp. Timestamps of newer entries make a
	 * time border for the newest. Timestamp for entry is considered fixed (unless it's the first entry).
	 * The strategy is following:
	 * First, try to find matching row by the oldest id of the entries we want to insert.
	 * If we've found one, put everything that matches time frame of this row into it (it's bounded by the next row, if present). Put the rest into newer
	 * rows.
	 * If we didn't find one, we may try to extend the oldest row, because it's not bounded by the other row.
	 * When we append something to the row, we check if its size would exceed {@link SEARCH_INDEX_ROW_LENGTH}. If it is, we do splitting,
	 * {@see _appendIndexEntriesToRow}.
	 * @private
	 */
	_writeEntries(transaction: DbTransaction, entries: Array<EncSearchIndexEntryWithTimestamp>, metaData: SearchIndexMetaDataRow, appId: number,
	              typeId: number): Promise<*> {
		if (entries.length === 0) {
			return Promise.resolve()
		}
		const oldestTimestamp = entries[0].timestamp
		const indexOfMetaEntry = this._findMetaDataEntryByTimestamp(metaData, oldestTimestamp, appId, typeId)
		if (indexOfMetaEntry !== -1) {
			const nextEntry = this._nextEntryOfType(metaData, indexOfMetaEntry + 1, appId, typeId)
			if (!nextEntry) {
				return this._appendIndexEntriesToRow(transaction, metaData, indexOfMetaEntry, entries)
			} else {
				const [toCurrentOne, toNextOnes] = this._splitByTimestamp(entries, nextEntry.oldestElementTimestamp)
				return this._appendIndexEntriesToRow(transaction, metaData, indexOfMetaEntry, toCurrentOne)
				           .then(() => this._writeEntries(transaction, toNextOnes, metaData, appId, typeId))
			}
		} else {
			// we have not found any entry which oldest id is lower than oldest id to add but there can be other entries
			const firstEntry = this._nextEntryOfType(metaData, 0, appId, typeId)
			// 1. We have a first entry.
			//   i: We have a second entry. Check how much fits into the first block
			//     a. It's not oversized. Write to it.
			//     b. It is oversized. Create a new block.
			//   ii: We don't have a second entry. Check if we can fit everything into the first block
			//     a. It's not eversized. Write to it.
			//     b. It's oversized. Create a new one.
			// 2. We don't have a first entry. Just create a new row with everything.
			if (firstEntry) {
				const indexOfFirstEntry = metaData.rows.indexOf(firstEntry)
				const secondEntry = this._nextEntryOfType(metaData, indexOfFirstEntry + 1, appId, typeId)
				const [toFirstOne, toNextOnes] = secondEntry
					? this._splitByTimestamp(entries, secondEntry.oldestElementTimestamp)
					: [entries, []]
				if (firstEntry.size + toFirstOne.length < SEARCH_INDEX_ROW_LENGTH) {
					return this._appendIndexEntriesToRow(transaction, metaData, indexOfFirstEntry, toFirstOne)
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

	_nextEntryOfType(metaData: SearchIndexMetaDataRow, startIndex: number, appId: number, typeId: number): ?SearchIndexMetadataEntry {
		for (let i = startIndex; i < metaData.rows.length; i++) {
			if (metaData.rows[i].app === appId && metaData.rows[i].type === typeId) {
				return metaData.rows[i]
			}
		}
		return null
	}

	/**
	 * Split {@param entries} (must be sorted!) into two arrays: before and after the timestamp.
	 * @private
	 */
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


	/**
	 * Append {@param entries} to the row specified by the {@param metaEntryIndex}. If the row size exceeds {@link SEARCH_INDEX_ROW_LENGTH}, then
	 * split it into two rows.
	 * @private
	 */
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
			return transaction.get(SearchIndexOS, metaEntry.key).then((binaryBlock: ?SearchIndexDbRow) => {
				if (!binaryBlock) {
					throw new InvalidDatabaseStateError("non existing index row")
				}

				const timestampToEntries: Map<number, Array<Uint8Array>> = new Map()
				const existingIds = new Set()
				// Iterate all entries in a block, decrypt id of each and put it into the map
				iterateBinaryBlocks(binaryBlock, (encSearchIndexEntry) => {
					const encId = getIdFromEncSearchIndexEntry(encSearchIndexEntry)
					existingIds.add(arrayHash(encId))
					const decId = decryptIndexKey(this.db.key, encId, this.db.iv)
					const timeStamp = generatedIdToTimestamp(decId)
					getFromMap(timestampToEntries, timeStamp, () => []).push(encSearchIndexEntry)
				})
				// Also add new entries
				entries.forEach(({entry, timestamp}) => {
					getFromMap(timestampToEntries, timestamp, () => []).push(entry)
				})

				// Prefer to put entries into the first row if it's not initial indexing (we are likely to grow second row in the future)
				// Prefer to put entries into the second row if it's initial indexing (we are likely to grow the first row because we move back in time)
				const isLastEntry = this._nextEntryOfType(metaData, metaEntryIndex + 1, metaEntry.app, metaEntry.type) == null
				const {firstRow, secondRow, firstRowOldestTimestamp, secondRowOldestTimestamp} = this._distributeEntities(timestampToEntries, isLastEntry)

				const firstRowBinary = appendBinaryBlocks(firstRow)
				const secondRowBinary = appendBinaryBlocks(secondRow)
				return Promise.all([
						transaction.put(SearchIndexOS, metaEntry.key, firstRowBinary)
						           .then(() => {
							           metaEntry.size = firstRow.length
							           metaEntry.oldestElementTimestamp = firstRowOldestTimestamp
							           return metaEntry.key
						           }),
						transaction.put(SearchIndexOS, null, secondRowBinary)
						           .then((newSearchIndexRowId) => {
							           // Insert new entry into correct position
							           metaData.rows.splice(metaEntryIndex + 1, 0, {
								           key: newSearchIndexRowId,
								           size: secondRow.length,
								           app: metaEntry.app,
								           type: metaEntry.type,
								           oldestElementTimestamp: secondRowOldestTimestamp
							           })
							           return newSearchIndexRowId
						           })
					]
				)
			})
		} else {
			return transaction
				.get(SearchIndexOS, metaEntry.key)
				.then((indexEntriesRow) => {
					let safeRow = indexEntriesRow || new Uint8Array(0)
					const resultRow = appendBinaryBlocks(entries.map((e) => e.entry), safeRow)
					return transaction.put(SearchIndexOS, metaEntry.key, resultRow)
					                  .then(() => {
						                  metaEntry.size += entries.length
						                  // when adding entries to an existing row it is guaranteed that all added elements are newer.
						                  // We don't have to update oldestTimestamp of the meta data.
						                  // ...except when we're growing the first row, then we should do that
						                  metaEntry.oldestElementTimestamp = Math.min(entries[0].timestamp, metaEntry.oldestElementTimestamp)
						                  return [metaEntry.key]
					                  })
				})
		}
	}

	_distributeEntities(timestampToEntries: Map<number, Array<EncryptedSearchIndexEntry>>, preferFirst: boolean
	): {firstRow: Array<Uint8Array>, secondRow: Array<Uint8Array>, firstRowOldestTimestamp: number, secondRowOldestTimestamp: number} {
		const sortedTimestamps = Array.from(timestampToEntries.keys()).sort((l, r) => l - r)
		// If we append to the newest IDs, then try to saturate older rows
		const firstRow = []
		const secondRow = []
		const firstRowOldestTimestamp = sortedTimestamps[0]
		let secondRowOldestTimestamp = Number.MAX_SAFE_INTEGER
		let switchedRow = false
		if (preferFirst) {
			sortedTimestamps.forEach((id) => {
				const encryptedEntries = neverNull(timestampToEntries.get(id))
				switchedRow = switchedRow || firstRow.length + encryptedEntries.length > SEARCH_INDEX_ROW_LENGTH
				if (switchedRow) {
					secondRow.push(...encryptedEntries)
					secondRowOldestTimestamp = Math.min(secondRowOldestTimestamp, id)
				} else {
					firstRow.push(...encryptedEntries)
				}
			})
		} else { // If we append in the middle, then try to saturate new row
			const reveresId = sortedTimestamps.slice().reverse()
			secondRowOldestTimestamp = Number.MAX_SAFE_INTEGER
			reveresId.forEach((id) => {
				const encryptedEntries = neverNull(timestampToEntries.get(id))
				switchedRow = switchedRow || secondRow.length + encryptedEntries.length > SEARCH_INDEX_ROW_LENGTH
				if (switchedRow) {
					firstRow.unshift(...encryptedEntries)
				} else {
					secondRow.unshift(...encryptedEntries)
					secondRowOldestTimestamp = Math.min(secondRowOldestTimestamp, id)
				}
			})
		}
		return {firstRow, secondRow, firstRowOldestTimestamp, secondRowOldestTimestamp}
	}

	_createNewRow(transaction: DbTransaction, metaData: SearchIndexMetaDataRow, encryptedSearchIndexEntries: Array<EncSearchIndexEntryWithTimestamp>,
	              oldestTimestamp: number, appId: number, typeId: number): Promise<SearchIndexMetadataEntry> {
		const binaryRow = appendBinaryBlocks(encryptedSearchIndexEntries.map(e => e.entry))
		return transaction
			.put(SearchIndexOS, null, binaryRow)
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
			.then((metaData: ?SearchIndexMetaDataDbRow) => {
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

	_cancelIfNeeded() {
		if (this._isStopped) {
			throw new CancelledError("indexing cancelled")
		}
	}

	printStatus() {
		const totalTime = this._stats.indexingTime + this._stats.storageTime + this._stats.downloadingTime
			+ this._stats.encryptionTime
		console.log(JSON.stringify(this._stats), "total time: ", totalTime)
	}
}
