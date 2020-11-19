//@flow
import {DbError} from "../../common/error/DbError"
import {LazyLoaded} from "../../common/utils/LazyLoaded"
import {IndexingNotSupportedError} from "../../common/error/IndexingNotSupportedError"
import {QuotaExceededError} from "../../common/error/QuotaExceededError"
import {downcast} from "../../common/utils/Utils"


export type ObjectStoreName = string
export const osName = (objectStoreName: ObjectStoreName): string => objectStoreName

export type IndexName = string
export const indexName = (indexName: IndexName): string => indexName

export type DbKey = string | number | Array<string | number | null>

export interface DbTransaction {
	getAll(objectStore: ObjectStoreName): Promise<{key: DbKey, value: any}[]>;

	get<T>(objectStore: ObjectStoreName, key: DbKey, indexName?: IndexName): Promise<?T>;

	getAsList<T>(objectStore: ObjectStoreName, key: DbKey, indexName?: IndexName): Promise<T[]>;

	put(objectStore: ObjectStoreName, key: ?DbKey, value: any): Promise<any>;

	delete(objectStore: ObjectStoreName, key: DbKey): Promise<void>;

	abort(): void;

	wait(): Promise<void>;

	aborted: boolean;

	getRange<T>(objectStore: ObjectStoreName, fixedKey: Array<*>, start: DbKey, count: number, reverse: boolean, index: ?IndexName): Promise<Array<T>>;
}


function extractErrorProperties(e: any): string {
	const requestErrorEntries = {}
	for (let key in e) {
		requestErrorEntries[key] = e[key]
	}
	return JSON.stringify(requestErrorEntries)
}

export class DbFacade {
	_id: string;
	_db: LazyLoaded<IDBDatabase>;
	_activeTransactions: number;
	/** stub for now */
	indexingSupported: boolean = true

	constructor(version: number, onupgrade: (event: any, db: IDBDatabase) => void) {
		this._activeTransactions = 0
		this._db = new LazyLoaded(() => {
			// If indexedDB is disabled in Firefox, the browser crashes when accessing indexedDB in worker process
			// ask the main thread if indexedDB is supported.
			return Promise.fromCallback(callback => {
				try {
					const openRequest: IDBOpenDBRequest = self.indexedDB.open(this._id, version)
					openRequest.onerror = (event) => {
						// Copy all the keys from the error, including inheritent ones so we can get some info

						const requestErrorEntries = extractErrorProperties(openRequest.error)
						const eventProperties = extractErrorProperties(event)
						const message = "DbFacade.open.onerror: " + this._id +
							"\nrequest.error: " + requestErrorEntries +
							"\nevent: " + eventProperties +
							"\nevent.target.error: " + (event.target ? event.target.error : "[none]")

						if (event.target && event.target.error && event.target.error.name === "QuotaExceededError") {
							console.log("Storage Quota is exceeded")
							callback(new QuotaExceededError(message, openRequest.error || event.target.error))
						} else {
							callback(new IndexingNotSupportedError(message, openRequest.error || event.target.error))
						}
					}

					openRequest.onupgradeneeded = (event) => {
						//console.log("upgrade db", event)
						let db = event.target.result
						onupgrade(event, event.target.result)
					}

					openRequest.onsuccess = (event) => {
						//console.log("opened db", event)
						const db: IDBDatabase = downcast(openRequest.result)
						db.onabort = (event) => console.log("db aborted", event)
						db.onclose = (event) => {
							console.log("db closed", event)
							this._db.reset()
						}
						db.onerror = (event) => console.log("db error", event)
						callback(null, db)
					}
				} catch (e) {
					callback(new IndexingNotSupportedError(`exception when accessing indexeddb ${this._id}`, e))
				}
			})
		})
	}

	_deleteObjectStores(db: IDBDatabase, ...oss: string[]) {
		for (let os of oss) {
			try {
				db.deleteObjectStore(os)
			} catch (e) {
				console.log("Error while deleting old os", os, "ignoring", e)
			}
		}
	}

	open(id: string): Promise<void> {
		this._id = id
		return this._db.getAsync().return()
	}

	/**
	 * Deletes the database if it has been opened.
	 */
	deleteDatabase(): Promise<void> {
		if (this._db.isLoaded()) {
			if (this._activeTransactions > 0) {
				return Promise.delay(150).then(() => this.deleteDatabase())
			} else {
				this._db.getLoaded().close()
				return Promise.fromCallback(cb => {
					let deleteRequest = self.indexedDB.deleteDatabase(this._db.getLoaded().name)
					deleteRequest.onerror = (event) => {
						cb(new DbError(`could not delete database ${this._db.getLoaded().name}`, event))
					}
					deleteRequest.onsuccess = (event) => {
						this._db.reset()
						cb()
					}
				})
			}
		} else {
			return Promise.resolve()
		}
	}

	/**
	 * @pre open() must have been called before, but the promise does not need to have returned.
	 */
	createTransaction(readOnly: boolean, objectStores: ObjectStoreName[]): Promise<DbTransaction> {
		return this._db.getAsync().then((db) => {
			try {
				const idbTransaction = db.transaction((objectStores: string[]), readOnly ? "readonly" : "readwrite")
				const transaction = new IndexedDbTransaction(idbTransaction, () => {
					this._db.reset()
				})
				this._activeTransactions++
				transaction.wait().finally(() => {
					this._activeTransactions--
				})
				return transaction
			} catch (e) {
				throw new DbError("could not create transaction", e)
			}
		})
	}
}

type DbRequest = {
	action: Function;
	objectStore: string;
}

/**
 * A transaction is usually committed after all requests placed against the transaction have been executed and their
 * returned results handled, and no new requests have been placed against the transaction.
 * @see https://w3c.github.io/IndexedDB/#ref-for-transaction-finish
 */
export class IndexedDbTransaction implements DbTransaction {
	_transaction: IDBTransaction;
	_promise: Promise<void>;
	_onUnknownError: (e: any) => mixed
	aborted: boolean;

	constructor(transaction: IDBTransaction, onUnknownError: (e: any) => mixed) {
		this._transaction = transaction
		this._onUnknownError = onUnknownError
		this._promise = Promise.fromCallback((callback) => {

			transaction.onerror = (event) => {
				if (this._promise.isPending()) {
					this._handleDbError(event, this._transaction, "transaction.onerror", (e) => {
						callback(e)
					})
				} else {
					console.log("ignore error of aborted/fullfilled transaction", event)
				}
			}
			transaction.oncomplete = (event) => {
				callback()
			}
			transaction.onabort = (event) => {
				event.stopPropagation()
				callback()
			}
		})
	}

	getAll(objectStore: ObjectStoreName): Promise<{key: DbKey, value: any}[]> {
		return Promise.fromCallback((callback) => {
			try {
				let keys = []
				let request = (this._transaction.objectStore(objectStore): any).openCursor()
				request.onerror = (event) => {
					this._handleDbError(event, request, "getAll().onError " + objectStore, callback)
				}
				request.onsuccess = (event) => {
					let cursor = request.result
					if (cursor) {
						keys.push({key: cursor.key, value: cursor.value})
						cursor.continue() // onsuccess is called again
					} else {
						callback(null, keys) // cursor has reached the end
					}
				}
			} catch (e) {
				this._handleDbError(e, null, "getAll().catch", callback)
			}
		})
	}

	get<T>(objectStore: ObjectStoreName, key: DbKey, indexName?: IndexName): Promise<?T> {
		return Promise.fromCallback((callback) => {
			try {
				const os = this._transaction.objectStore(objectStore)
				let request
				if (indexName) {
					request = os.index(indexName).get(key)
				} else {
					request = os.get(key)
				}
				request.onerror = (event) => {
					this._handleDbError(event, request, "get().onerror " + objectStore, callback)
				}
				request.onsuccess = (event) => {
					callback(null, event.target.result)
				}
			} catch (e) {
				this._handleDbError(e, null, "get().catch", callback)
			}
		})
	}

	getAsList<T>(objectStore: ObjectStoreName, key: DbKey, indexName?: IndexName): Promise<T[]> {
		return this.get(objectStore, key, indexName)
		           .then(result => result || [])
	}

	put(objectStore: ObjectStoreName, key: ?DbKey, value: any): Promise<any> {
		return Promise.fromCallback((callback) => {
			try {
				let request = key
					? this._transaction.objectStore(objectStore).put(value, key)
					: this._transaction.objectStore(objectStore).put(value)
				request.onerror = (event) => {
					this._handleDbError(event, request, "put().onerror " + objectStore, callback)
				}
				request.onsuccess = (event) => {
					callback(null, event.target.result)
				}
			} catch (e) {
				this._handleDbError(e, null, "put().catch", callback)
			}
		})
	}


	delete(objectStore: ObjectStoreName, key: DbKey): Promise<void> {
		return Promise.fromCallback((callback) => {
			try {
				let request = this._transaction.objectStore(objectStore).delete(key)
				request.onerror = (event) => {
					this._handleDbError(event, request, "delete().onerror " + objectStore, callback)
				}
				request.onsuccess = (event) => {
					callback()
				}
			} catch (e) {
				this._handleDbError(e, null, ".delete().catch " + objectStore, callback)
			}
		})
	}

	getRange<T>(objectStore: ObjectStoreName, fixedKey: Array<*>, start: DbKey, count: number, reverse: boolean, index: ?IndexName): Promise<Array<T>> {
		return Promise.fromCallback((callback) => {
			const result = []
			const os = this._transaction.objectStore(objectStore)
			let range: IDBKeyRange
			let direction: IDBDirection
			if (reverse) {
				// $FlowIssue[prop-missing]
				range = IDBKeyRange.upperBound(fixedKey.concat(start), /*open*/true) // <
				direction = 'prev'
			} else {
				// $FlowIssue[prop-missing]
				range = IDBKeyRange.lowerBound(fixedKey.concat(start), /*open*/true) // >
				direction = 'next'
			}
			const request = index ? os.index(index).openCursor(range, direction) : os.openCursor(range, direction)
			request.onerror = (event) => this._handleDbError(event, request, "getRange.onerror " + objectStore, callback)
			request.onsuccess = (event) => {
				const cursor: ?IDBCursorWithValue = event.target.result
				if (cursor) {
					for (let i = 0; i < fixedKey.length; i++) {
						if (cursor.key[i] !== fixedKey[i]) {
							callback(null, result)
							return
						}
					}
					result.push(cursor.value)
					if (result.length < count) {
						cursor.continue()
					} else {
						callback(null, result)
					}
				} else {
					callback(null, result)
				}
			}
		})
	}

	abort() {
		this.aborted = true
		this._transaction.abort()
	}

	wait(): Promise<void> {
		return this._promise
	}

	_handleDbError(event: any, customTarget: ?any, prefix: string, callback: (e: any) => mixed) {
		const errorEntries = extractErrorProperties(event)

		const eventTargetEntries = event.target ? extractErrorProperties(event.target) : '<null>'
		const eventTargetErrorEntries = event.target && event.target.error ? extractErrorProperties(event.target.error) : '<null>'
		const customTargetEntries = customTarget ? extractErrorProperties(customTarget) : '<null>'
		const customTargetErrorEntries = customTarget && customTarget.error ? extractErrorProperties(customTarget.error) : '<null>'

		const msg = "IndexedDbTransaction " + prefix
			+ "\nOSes: " + JSON.stringify((this._transaction: any).objectStoreNames) +
			"\nevent:" + errorEntries +
			"\ntransaction.error: " + (this._transaction.error ? this._transaction.error.message : '<null>') +
			"\nevent.target: " + eventTargetEntries +
			"\nevent.target.error: " + eventTargetErrorEntries +
			"\ncustom.target: " + customTargetEntries +
			"\ncustom.target.error: " + customTargetErrorEntries

		// In some cases it's not available on Firefox 70
		if (typeof event.stopPropagation === "function") event.stopPropagation()
		if (customTarget && customTarget.error
			&& (customTarget.error.name === "UnknownError"
				|| (typeof customTarget.error.message === "string" && customTarget.error.message.includes("UnknownError")))) {
			this._onUnknownError(customTarget.error)
			callback(new IndexingNotSupportedError(msg, this._transaction.error))
		} else {
			const e = this._transaction.error || (customTarget ? customTarget.error : null)
			if (e && e.name && e.name === "QuotaExceededError") {
				console.warn("Storage Quota exceeded")
				callback(new QuotaExceededError(msg, e))
			} else {
				callback(new DbError(msg, e))
			}
		}
	}
}
