import type { DbTransaction } from "../../../common/api/worker/search/DbFacade.js"
import type { $Promisable, DeferredObject, PromiseMapFn } from "@tutao/tutanota-utils"
import {
	arrayHash,
	byteLength,
	defer,
	findLastIndex,
	getFromMap,
	groupByAndMap,
	lastThrow,
	mergeMaps,
	neverNull,
	noOp,
	PromisableWrapper,
	promiseMapCompat,
	tokenize,
	TypeRef,
	uint8ArrayToBase64,
} from "@tutao/tutanota-utils"
import { elementIdPart, firstBiggerThanSecond, generatedIdToTimestamp, listIdPart } from "../../../common/api/common/utils/EntityUtils.js"
import {
	compareMetaEntriesOldest,
	decryptIndexKey,
	decryptMetaData,
	encryptIndexKeyBase64,
	encryptIndexKeyUint8Array,
	encryptMetaData,
	encryptSearchIndexEntry,
	getIdFromEncSearchIndexEntry,
	getPerformanceTimestamp,
	typeRefToTypeInfo,
} from "../../../common/api/worker/search/IndexUtils.js"
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
	SearchIndexMetaDataRow,
} from "../../../common/api/worker/search/SearchTypes.js"
import type { QueuedBatch } from "../../../common/api/worker/EventQueue.js"
import { EventQueue } from "../../../common/api/worker/EventQueue.js"
import { CancelledError } from "../../../common/api/common/error/CancelledError.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import type { BrowserData } from "../../../common/misc/ClientConstants.js"
import { InvalidDatabaseStateError } from "../../../common/api/common/error/InvalidDatabaseStateError.js"
import {
	appendBinaryBlocks,
	calculateNeededSpaceForNumbers,
	decodeNumbers,
	encodeNumbers,
	iterateBinaryBlocks,
	removeBinaryBlockRanges,
} from "../../../common/api/worker/search/SearchIndexEncoding.js"
import type { EntityUpdate } from "../../../common/api/entities/sys/TypeRefs.js"
import { aes256EncryptSearchIndexEntry, aesDecrypt, unauthenticatedAesDecrypt } from "@tutao/tutanota-crypto"
import {
	ElementDataOS,
	GroupDataOS,
	MetaDataOS,
	SearchIndexMetaDataOS,
	SearchIndexOS,
	SearchIndexWordsIndex,
} from "../../../common/api/worker/search/IndexTables.js"

const SEARCH_INDEX_ROW_LENGTH = 1000

/**
 * Object to store the current indexedDb write operation. In case of background mode on iOS we have to abort the current write
 * and restart the write after app goes to foreground again.
 */
type WriteOperation = {
	transaction: DbTransaction | null
	operation: (transaction: DbTransaction) => Promise<void>
	transactionFactory: () => Promise<DbTransaction>
	deferred: DeferredObject<void>
	isAbortedForBackgroundMode: boolean
}

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
	queue: EventQueue
	db: Db
	private _isStopped: boolean
	private _promiseMapCompat: PromiseMapFn
	private _needsExplicitIds: boolean
	private _explicitIdStart: number
	private _currentWriteOperation: WriteOperation | null = null
	_stats!: {
		indexingTime: number
		storageTime: number
		preparingTime: number
		mailcount: number
		storedBytes: number
		encryptionTime: number
		writeRequests: number
		largestColumn: number
		words: number
		indexedBytes: number
	}

	constructor(db: Db, queue: EventQueue, browserData: BrowserData) {
		this.queue = queue
		this.db = db
		this._isStopped = false
		this._promiseMapCompat = promiseMapCompat(browserData.needsMicrotaskHack)
		this._needsExplicitIds = browserData.needsExplicitIDBIds
		this._explicitIdStart = Date.now()
		this.resetStats()
	}

	/****************************************** Preparing the update ***********************************************/

	/**
	 * Converts an instances into a map from words to a list of SearchIndexEntries.
	 */
	createIndexEntriesForAttributes(instance: Record<string, any>, attributes: AttributeHandler[]): Map<string, SearchIndexEntry[]> {
		let indexEntries: Map<string, SearchIndexEntry>[] = attributes.map((attributeHandler) => {
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
						positions: [index],
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
		const encryptionTimeStart = getPerformanceTimestamp()
		const listId = listIdPart(id)
		const encInstanceId = encryptIndexKeyUint8Array(this.db.key, elementIdPart(id), this.db.iv)
		const encInstanceIdB64 = uint8ArrayToBase64(encInstanceId)
		const elementIdTimestamp = generatedIdToTimestamp(elementIdPart(id))
		const encWordsB64: string[] = []
		for (const [indexKey, value] of keyToIndexEntries.entries()) {
			const encWordB64 = encryptIndexKeyBase64(this.db.key, indexKey, this.db.iv)
			encWordsB64.push(encWordB64)
			const encIndexEntries = getFromMap(indexUpdate.create.indexMap, encWordB64, () => [])
			for (const indexEntry of value)
				encIndexEntries.push({
					entry: encryptSearchIndexEntry(this.db.key, indexEntry, encInstanceId),
					timestamp: elementIdTimestamp,
				})
		}
		indexUpdate.create.encInstanceIdToElementData.set(encInstanceIdB64, {
			listId,
			encWordsB64,
			ownerGroup,
		})
		this._stats.encryptionTime += getPerformanceTimestamp() - encryptionTimeStart
	}

	/**
	 * Process delete event before applying to the index.
	 */
	async _processDeleted(event: EntityUpdate, indexUpdate: IndexUpdate): Promise<void> {
		const encInstanceIdPlain = encryptIndexKeyUint8Array(this.db.key, event.instanceId, this.db.iv)
		const encInstanceIdB64 = uint8ArrayToBase64(encInstanceIdPlain)
		const { appId, typeId } = typeRefToTypeInfo(new TypeRef(event.application, event.type))
		const transaction = await this.db.dbFacade.createTransaction(true, [ElementDataOS])
		const elementData = await transaction.get(ElementDataOS, encInstanceIdB64)
		if (!elementData) {
			return
		}

		// We need to find SearchIndex rows which we want to update. In the ElementData we have references to the metadata and we can find
		// corresponding SearchIndex row in it.
		const metaDataRowKeysBinary = unauthenticatedAesDecrypt(this.db.key, elementData[1], true)
		// For every word we have a metadata reference and we want to update them all.
		const metaDataRowKeys = decodeNumbers(metaDataRowKeysBinary)
		for (const metaDataRowKey of metaDataRowKeys) {
			// We add current instance into list of instances to delete for each word
			const ids = getFromMap(indexUpdate.delete.searchMetaRowToEncInstanceIds, metaDataRowKey, () => [])
			ids.push({
				encInstanceId: encInstanceIdPlain,
				appId,
				typeId,
				timestamp: generatedIdToTimestamp(event.instanceId),
			})
		}
		indexUpdate.delete.encInstanceIds.push(encInstanceIdB64)
	}

	/********************************************* Manipulating the state ***********************************************/
	stopProcessing() {
		this._isStopped = true
		this.queue.clear()
	}

	isStoppedProcessing(): boolean {
		return this._isStopped
	}

	startProcessing() {
		this._isStopped = false
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
	writeIndexUpdate(
		dataPerGroup: Array<{
			groupId: Id
			indexTimestamp: number
		}>,
		indexUpdate: IndexUpdate,
	): Promise<void> {
		return this._writeIndexUpdate(indexUpdate, (t) => this._updateGroupDataIndexTimestamp(dataPerGroup, t))
	}

	writeIndexUpdateWithBatchId(groupId: Id, batchId: Id, indexUpdate: IndexUpdate): Promise<void> {
		return this._writeIndexUpdate(indexUpdate, (t) => this._updateGroupDataBatchId(groupId, batchId, t))
	}

	_writeIndexUpdate(indexUpdate: IndexUpdate, updateGroupData: (t: DbTransaction) => $Promisable<void>): Promise<void> {
		return this._executeOperation({
			transaction: null,
			transactionFactory: () => this.db.dbFacade.createTransaction(false, [SearchIndexOS, SearchIndexMetaDataOS, ElementDataOS, MetaDataOS, GroupDataOS]),
			operation: (transaction) => {
				let startTimeStorage = getPerformanceTimestamp()

				if (this._isStopped) {
					return Promise.reject(new CancelledError("mail indexing cancelled"))
				}

				return (
					this._moveIndexedInstance(indexUpdate, transaction)
						.thenOrApply(() => this._deleteIndexedInstance(indexUpdate, transaction))
						.thenOrApply(() => this._insertNewIndexEntries(indexUpdate, transaction))
						.thenOrApply((rowKeys: EncWordToMetaRow | null) => rowKeys && this._insertNewElementData(indexUpdate, transaction, rowKeys))
						.thenOrApply(() => updateGroupData(transaction))
						.thenOrApply(() => {
							return transaction.wait().then(() => {
								this._stats.storageTime += getPerformanceTimestamp() - startTimeStorage
							})
						}) // a la catch(). Must be done in the next step because didReject is not invoked for the current Promise, only for the previous one.
						// It's probably a bad idea to convert to the Promise first and then catch because it may do Promise.resolve() and this will schedule to
						// the next event loop iteration and the context will be closed and it will be too late to abort(). Even worse, it will be commited to
						// IndexedDB already and it will be inconsistent (oops).
						.thenOrApply(noOp, (e) => {
							try {
								!transaction.aborted && transaction.abort()
							} catch (e) {
								console.warn("abort has failed: ", e) // Ignore if abort has failed
							}

							throw e
						})
						.toPromise()
				)
			},
			deferred: defer(),
			isAbortedForBackgroundMode: false,
		})
	}

	_executeOperation(operation: WriteOperation): Promise<void> {
		this._currentWriteOperation = operation
		return operation.transactionFactory().then((transaction) => {
			operation.transaction = transaction
			operation
				.operation(transaction)
				.then((it) => {
					this._currentWriteOperation = null
					operation.deferred.resolve()
					return it
				})
				.catch((e) => {
					if (operation.isAbortedForBackgroundMode) {
						console.log("transaction has been aborted because of background mode")
					} else {
						if (env.mode !== "Test") {
							console.log("rejecting operation with error", e)
						}

						operation.deferred.reject(e)
					}
				})
			return operation.deferred.promise
		})
	}

	onVisibilityChanged(visible: boolean) {
		const operation = this._currentWriteOperation

		if (!visible && operation && operation.transaction) {
			console.log("abort indexedDb transaction operation because background mode")

			try {
				neverNull(operation.transaction).abort()
			} catch (e) {
				console.log("Error when aborting on visibility change", e)
			}

			operation.isAbortedForBackgroundMode = true
		}

		if (visible && operation) {
			console.log("restart indexedDb transaction operation after background mode")
			operation.isAbortedForBackgroundMode = false

			this._executeOperation(operation)
		}
	}

	_moveIndexedInstance(indexUpdate: IndexUpdate, transaction: DbTransaction): PromisableWrapper<void> {
		this._cancelIfNeeded()

		if (indexUpdate.move.length === 0) return PromisableWrapper.from(undefined) // keep transaction context open (only for Safari)

		const promise = Promise.all(
			indexUpdate.move.map((moveInstance) => {
				return transaction.get(ElementDataOS, moveInstance.encInstanceId).then((elementData) => {
					if (elementData) {
						elementData[0] = moveInstance.newListId
						transaction.put(ElementDataOS, moveInstance.encInstanceId, elementData)
					}
				})
			}),
		).then(noOp)
		return PromisableWrapper.from(promise)
	}

	/**
	 * Apply "delete" updates to the database
	 * @private
	 */
	_deleteIndexedInstance(indexUpdate: IndexUpdate, transaction: DbTransaction): Promise<void> | null {
		this._cancelIfNeeded()

		if (indexUpdate.delete.searchMetaRowToEncInstanceIds.size === 0) return null // keep transaction context open

		let deleteElementDataPromise = Promise.all(indexUpdate.delete.encInstanceIds.map((encInstanceId) => transaction.delete(ElementDataOS, encInstanceId)))
		// For each word we have list of instances we want to remove
		return Promise.all(
			Array.from(indexUpdate.delete.searchMetaRowToEncInstanceIds).map(([metaRowKey, encInstanceIds]) =>
				this._deleteSearchIndexEntries(transaction, metaRowKey, encInstanceIds),
			),
		)
			.then(() => deleteElementDataPromise)
			.then(noOp)
	}

	/**
	 * Remove all {@param instanceInfos} from the SearchIndex entries and metadata entreis specified by the {@param metaRowKey}.
	 * @private
	 */
	_deleteSearchIndexEntries(transaction: DbTransaction, metaRowKey: number, instanceInfos: EncInstanceIdWithTimestamp[]): Promise<any> {
		this._cancelIfNeeded()

		// Collect hashes of all instances we want to delete to check it faster later
		const encInstanceIdSet = new Set(instanceInfos.map((e) => arrayHash(e.encInstanceId)))
		return transaction.get(SearchIndexMetaDataOS, metaRowKey).then((encMetaDataRow) => {
			if (!encMetaDataRow) {
				// already deleted
				return
			}

			const metaDataRow = decryptMetaData(this.db.key, encMetaDataRow)
			// add meta data to set to only update meta data once when deleting multiple instances
			const metaDataEntriesSet = new Set() as Set<SearchIndexMetadataEntry>
			for (const info of instanceInfos) {
				// For each instance we find SearchIndex row it belongs to by timestamp
				const entryIndex = this._findMetaDataEntryByTimestamp(metaDataRow, info.timestamp, info.appId, info.typeId)

				if (entryIndex === -1) {
					console.warn(
						"could not find MetaDataEntry, info:",
						info,
						"rows: ",
						metaDataRow.rows.map((r) => JSON.stringify(r)),
					)
				} else {
					metaDataEntriesSet.add(metaDataRow.rows[entryIndex])
				}
			}

			// For each SearchIndex row we need to update...
			const updateSearchIndex = this._promiseMapCompat(Array.from(metaDataEntriesSet), (metaEntry) => {
				return transaction.get(SearchIndexOS, metaEntry.key).then((indexEntriesRow) => {
					if (!indexEntriesRow) return
					// Find all entries we need to remove by hash of the encrypted ID
					const rangesToRemove: Array<[number, number]> = []
					iterateBinaryBlocks(indexEntriesRow, (block, start, end) => {
						if (encInstanceIdSet.has(arrayHash(getIdFromEncSearchIndexEntry(block)))) {
							rangesToRemove.push([start, end])
						}
					})

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

			return updateSearchIndex.thenOrApply(() => {
				metaDataRow.rows = metaDataRow.rows.filter((r) => r.size > 0)

				if (metaDataRow.rows.length === 0) {
					return transaction.delete(SearchIndexMetaDataOS, metaDataRow.id)
				} else {
					return transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(this.db.key, metaDataRow))
				}
			}).value
		})
	}

	_insertNewElementData(indexUpdate: IndexUpdate, transaction: DbTransaction, encWordToMetaRow: EncWordToMetaRow): Promise<unknown> | null {
		this._cancelIfNeeded()

		if (indexUpdate.create.encInstanceIdToElementData.size === 0) return null // keep transaction context open (only in Safari)

		let promises: Promise<unknown>[] = []
		for (const [b64EncInstanceId, elementDataSurrogate] of indexUpdate.create.encInstanceIdToElementData.entries()) {
			const metaRows = elementDataSurrogate.encWordsB64.map((w) => encWordToMetaRow[w])
			const rowKeysBinary = new Uint8Array(calculateNeededSpaceForNumbers(metaRows))
			encodeNumbers(metaRows, rowKeysBinary)
			const encMetaRowKeys = aes256EncryptSearchIndexEntry(this.db.key, rowKeysBinary)
			promises.push(transaction.put(ElementDataOS, b64EncInstanceId, [elementDataSurrogate.listId, encMetaRowKeys, elementDataSurrogate.ownerGroup]))
		}
		return Promise.all(promises)
	}

	_insertNewIndexEntries(indexUpdate: IndexUpdate, transaction: DbTransaction): Promise<EncWordToMetaRow> | null {
		this._cancelIfNeeded()

		let keys = [...indexUpdate.create.indexMap.keys()]
		const encWordToMetaRow: EncWordToMetaRow = {}

		const result = this._promiseMapCompat(
			keys,
			(encWordB64) => {
				const encryptedEntries = neverNull(indexUpdate.create.indexMap.get(encWordB64))
				return this._putEncryptedEntity(
					indexUpdate.typeInfo.appId,
					indexUpdate.typeInfo.typeId,
					transaction,
					encWordB64,
					encWordToMetaRow,
					encryptedEntries,
				)
			},
			{
				concurrency: 2,
			},
		).value

		return result instanceof Promise ? result.then(() => encWordToMetaRow) : null
	}

	_putEncryptedEntity(
		appId: number,
		typeId: number,
		transaction: DbTransaction,
		encWordB64: B64EncIndexKey,
		encWordToMetaRow: EncWordToMetaRow,
		encryptedEntries: Array<EncSearchIndexEntryWithTimestamp>,
	): Promise<unknown> | null {
		this._cancelIfNeeded()

		if (encryptedEntries.length <= 0) {
			return null
		}

		return this._getOrCreateSearchIndexMeta(transaction, encWordB64)
			.then((metaData: SearchIndexMetaDataRow) => {
				encryptedEntries.sort((a, b) => a.timestamp - b.timestamp)

				const writeResult = this._writeEntries(transaction, encryptedEntries, metaData, appId, typeId)

				return writeResult.thenOrApply(() => metaData).value
			})
			.then((metaData) => {
				const columnSize = metaData.rows.reduce((result, metaDataEntry) => result + metaDataEntry.size, 0)
				this._stats.writeRequests += 1
				this._stats.largestColumn = columnSize > this._stats.largestColumn ? columnSize : this._stats.largestColumn
				this._stats.storedBytes += encryptedEntries.reduce((sum, e) => sum + e.entry.length, 0)
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
	_writeEntries(
		transaction: DbTransaction,
		entries: Array<EncSearchIndexEntryWithTimestamp>,
		metaData: SearchIndexMetaDataRow,
		appId: number,
		typeId: number,
	): PromisableWrapper<void> {
		if (entries.length === 0) {
			// Prevent IDB timeouts in Safari casued by Promise.resolve()
			return PromisableWrapper.from(undefined)
		}

		const oldestTimestamp = entries[0].timestamp

		const indexOfMetaEntry = this._findMetaDataEntryByTimestamp(metaData, oldestTimestamp, appId, typeId)

		if (indexOfMetaEntry !== -1) {
			const nextEntry = this._nextEntryOfType(metaData, indexOfMetaEntry + 1, appId, typeId)

			if (!nextEntry) {
				return this._appendIndexEntriesToRow(transaction, metaData, indexOfMetaEntry, entries)
			} else {
				const [toCurrentOne, toNextOnes] = this._splitByTimestamp(entries, nextEntry.oldestElementTimestamp)

				return this._appendIndexEntriesToRow(transaction, metaData, indexOfMetaEntry, toCurrentOne).thenOrApply(() =>
					this._writeEntries(transaction, toNextOnes, metaData, appId, typeId),
				)
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

				const [toFirstOne, toNextOnes] = secondEntry ? this._splitByTimestamp(entries, secondEntry.oldestElementTimestamp) : [entries, []]

				if (firstEntry.size + toFirstOne.length < SEARCH_INDEX_ROW_LENGTH) {
					return this._appendIndexEntriesToRow(transaction, metaData, indexOfFirstEntry, toFirstOne).thenOrApply(() =>
						this._writeEntries(transaction, toNextOnes, metaData, appId, typeId),
					)
				} else {
					const [toNewOne, toCurrentOne] = this._splitByTimestamp(toFirstOne, firstEntry.oldestElementTimestamp)

					return PromisableWrapper.from(this._createNewRow(transaction, metaData, toNewOne, oldestTimestamp, appId, typeId)).thenOrApply(() =>
						this._writeEntries(transaction, toCurrentOne.concat(toNextOnes), metaData, appId, typeId),
					)
				}
			} else {
				return this._createNewRow(transaction, metaData, entries, oldestTimestamp, appId, typeId)
			}
		}
	}

	_nextEntryOfType(metaData: SearchIndexMetaDataRow, startIndex: number, appId: number, typeId: number): SearchIndexMetadataEntry | null {
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
	_splitByTimestamp(
		entries: Array<EncSearchIndexEntryWithTimestamp>,
		timestamp: number,
	): [Array<EncSearchIndexEntryWithTimestamp>, Array<EncSearchIndexEntryWithTimestamp>] {
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
	_appendIndexEntriesToRow(
		transaction: DbTransaction,
		metaData: SearchIndexMetaDataRow,
		metaEntryIndex: number,
		entries: Array<EncSearchIndexEntryWithTimestamp>,
	): PromisableWrapper<void> {
		if (entries.length === 0) {
			return new PromisableWrapper(undefined)
		}

		const metaEntry = metaData.rows[metaEntryIndex]

		if (metaEntry.size + entries.length > SEARCH_INDEX_ROW_LENGTH) {
			// load existing row
			// decrypt ids
			// sort by id
			// split
			return PromisableWrapper.from(
				transaction.get(SearchIndexOS, metaEntry.key).then((binaryBlock: SearchIndexDbRow | null) => {
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
					for (const { entry, timestamp } of entries) {
						getFromMap(timestampToEntries, timestamp, () => []).push(entry)
					}
					// Prefer to put entries into the first row if it's not initial indexing (we are likely to grow second row in the future)
					// Prefer to put entries into the second row if it's initial indexing (we are likely to grow the first row because we move back in time)
					const isLastEntry = this._nextEntryOfType(metaData, metaEntryIndex + 1, metaEntry.app, metaEntry.type) == null

					const rows = this._distributeEntities(timestampToEntries, isLastEntry)

					// keep the oldest timestamp in the existing meta data entry to ensure that when continuing search we don't get the same meta data entry twice.
					const [appendRow, newRows] = [rows[0], rows.slice(1)]
					const firstRowBinary = appendBinaryBlocks(appendRow.row)
					const requestPromises = [
						transaction.put(SearchIndexOS, metaEntry.key, firstRowBinary).then(() => {
							metaEntry.size = appendRow.row.length
							metaEntry.oldestElementTimestamp = appendRow.oldestElementTimestamp
							return metaEntry.key
						}),
						this._promiseMapCompat(
							newRows,
							(row) => {
								const binaryRow = appendBinaryBlocks(row.row)
								return transaction.put(SearchIndexOS, null, binaryRow).then((newSearchIndexRowId) => {
									metaData.rows.push({
										key: newSearchIndexRowId,
										size: row.row.length,
										app: metaEntry.app,
										type: metaEntry.type,
										oldestElementTimestamp: row.oldestElementTimestamp,
									})
								})
							},
							{
								concurrency: 2,
							},
						).value,
					]
					return Promise.all(requestPromises).then(() => {
						metaData.rows.sort(compareMetaEntriesOldest)
					})
				}),
			)
		} else {
			return PromisableWrapper.from(
				transaction.get(SearchIndexOS, metaEntry.key).then((indexEntriesRow) => {
					let safeRow = indexEntriesRow || new Uint8Array(0)
					const resultRow = appendBinaryBlocks(
						entries.map((e) => e.entry),
						safeRow,
					)
					return transaction.put(SearchIndexOS, metaEntry.key, resultRow).then(() => {
						metaEntry.size += entries.length
						// when adding entries to an existing row it is guaranteed that all added elements are newer.
						// We don't have to update oldestTimestamp of the meta data.
						// ...except when we're growing the first row, then we should do that
						metaEntry.oldestElementTimestamp = Math.min(entries[0].timestamp, metaEntry.oldestElementTimestamp)
					})
				}),
			)
		}
	}

	_distributeEntities(
		timestampToEntries: Map<number, Array<EncryptedSearchIndexEntry>>,
		preferFirst: boolean,
	): Array<{
		row: Array<Uint8Array>
		oldestElementTimestamp: number
	}> {
		const sortedTimestamps = Array.from(timestampToEntries.keys()).sort((l, r) => l - r)

		// If we append to the newest IDs, then try to saturate older rows
		if (preferFirst) {
			const rows = [
				{
					row: [] as Array<EncryptedSearchIndexEntry>,
					oldestElementTimestamp: sortedTimestamps[0],
				},
			]
			for (const id of sortedTimestamps) {
				const encryptedEntries = neverNull(timestampToEntries.get(id))

				if (lastThrow(rows).row.length + encryptedEntries.length > SEARCH_INDEX_ROW_LENGTH) {
					rows.push({
						row: [],
						oldestElementTimestamp: id,
					})
				}

				lastThrow(rows).row.push(...encryptedEntries)
			}
			return rows
		} else {
			// If we append in the middle, then try to saturate new row
			const rows = [
				{
					row: [] as EncryptedSearchIndexEntry[],
					oldestElementTimestamp: Number.MAX_SAFE_INTEGER,
				},
			]
			const reveresId = sortedTimestamps.slice().reverse()
			for (const id of reveresId) {
				const encryptedEntries = neverNull(timestampToEntries.get(id))

				if (rows[0].row.length + encryptedEntries.length > SEARCH_INDEX_ROW_LENGTH) {
					rows.unshift({
						row: [],
						oldestElementTimestamp: id,
					})
				}

				rows[0].row.unshift(...encryptedEntries)
				rows[0].oldestElementTimestamp = Math.min(rows[0].oldestElementTimestamp, id)
			}
			return rows
		}
	}

	_createNewRow(
		transaction: DbTransaction,
		metaData: SearchIndexMetaDataRow,
		encryptedSearchIndexEntries: Array<EncSearchIndexEntryWithTimestamp>,
		oldestTimestamp: number,
		appId: number,
		typeId: number,
	): PromisableWrapper<void> {
		const byTimestamp = groupByAndMap(
			encryptedSearchIndexEntries,
			(e) => e.timestamp,
			(e) => e.entry,
		)

		const distributed = this._distributeEntities(byTimestamp, false)

		return this._promiseMapCompat(
			distributed,
			({ row, oldestElementTimestamp }) => {
				const binaryRow = appendBinaryBlocks(row)
				return transaction.put(SearchIndexOS, null, binaryRow).then((newRowId) => {
					// Oldest entries come in front
					metaData.rows.push({
						key: newRowId,
						size: row.length,
						app: appId,
						type: typeId,
						oldestElementTimestamp,
					})
				})
			},
			{
				concurrency: 2,
			},
		).thenOrApply(() => {
			metaData.rows.sort(compareMetaEntriesOldest)
		})
	}

	_findMetaDataEntryByTimestamp(metaData: SearchIndexMetaDataRow, oldestTimestamp: number, appId: number, typeId: number): number {
		return findLastIndex(metaData.rows, (r) => r.app === appId && r.type === typeId && r.oldestElementTimestamp <= oldestTimestamp)
	}

	_getOrCreateSearchIndexMeta(transaction: DbTransaction, encWordBase64: B64EncIndexKey): Promise<SearchIndexMetaDataRow> {
		return transaction.get(SearchIndexMetaDataOS, encWordBase64, SearchIndexWordsIndex).then((metaData: SearchIndexMetaDataDbRow | null) => {
			if (metaData) {
				return decryptMetaData(this.db.key, metaData)
			} else {
				const metaTemplate: Partial<SearchIndexMetaDataDbRow> = {
					word: encWordBase64,
					rows: new Uint8Array(0),
				}

				if (this._needsExplicitIds) {
					metaTemplate.id = this._explicitIdStart++
				}

				return transaction.put(SearchIndexMetaDataOS, null, metaTemplate).then((rowId) => {
					this._stats.words += 1
					return {
						id: rowId,
						word: encWordBase64,
						rows: [],
					}
				})
			}
		})
	}

	_updateGroupDataIndexTimestamp(
		dataPerGroup: Array<{
			groupId: Id
			indexTimestamp: number
		}>,
		transaction: DbTransaction,
	): $Promisable<void> {
		return this._promiseMapCompat(dataPerGroup, (data) => {
			const { groupId, indexTimestamp } = data
			return transaction.get(GroupDataOS, groupId).then((groupData: GroupData | null) => {
				if (!groupData) {
					throw new InvalidDatabaseStateError("GroupData not available for group " + groupId)
				}

				groupData.indexTimestamp = indexTimestamp
				return transaction.put(GroupDataOS, groupId, groupData)
			})
		}).thenOrApply(() => {}).value
	}

	_updateGroupDataBatchId(groupId: Id, batchId: Id, transaction: DbTransaction): Promise<void> {
		return transaction.get(GroupDataOS, groupId).then((groupData: GroupData | null) => {
			if (!groupData) {
				throw new InvalidDatabaseStateError("GroupData not available for group " + groupId)
			}

			if (groupData.lastBatchIds.length > 0 && groupData.lastBatchIds.indexOf(batchId) !== -1) {
				// concurrent indexing (multiple tabs)
				console.warn("Abort transaction on updating group data: concurrent access", groupId, batchId)
				transaction.abort()
			} else {
				let newIndex = groupData.lastBatchIds.findIndex((indexedBatchId) => firstBiggerThanSecond(batchId, indexedBatchId))

				if (newIndex !== -1) {
					groupData.lastBatchIds.splice(newIndex, 0, batchId)
				} else {
					groupData.lastBatchIds.push(batchId) // new batch is oldest of all stored batches
				}

				if (groupData.lastBatchIds.length > 1000) {
					groupData.lastBatchIds = groupData.lastBatchIds.slice(0, 1000)
				}

				return transaction.put(GroupDataOS, groupId, groupData)
			}
		})
	}

	_cancelIfNeeded() {
		if (this._isStopped) {
			throw new CancelledError("indexing cancelled")
		}
	}

	resetStats() {
		this._stats = {
			indexingTime: 0,
			storageTime: 0,
			preparingTime: 0,
			mailcount: 0,
			storedBytes: 0,
			encryptionTime: 0,
			writeRequests: 0,
			largestColumn: 0,
			words: 0,
			indexedBytes: 0,
		}
	}

	printStatus() {
		const totalTime = this._stats.storageTime + this._stats.preparingTime
		const statsWithDownloading = Object.assign({}, this._stats, {
			downloadingTime: this._stats.preparingTime - this._stats.indexingTime - this._stats.encryptionTime,
		})
		console.log(JSON.stringify(statsWithDownloading), "total time: ", totalTime)
	}
}
