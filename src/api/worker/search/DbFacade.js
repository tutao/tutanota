//@flow
import {DbError} from "../../common/error/DbError"
import {LazyLoaded} from "../../common/utils/LazyLoaded"
import {IndexingNotSupportedError} from "../../common/error/IndexingNotSupportedError"


export type ObjectStoreName = string
export const SearchIndexOS: ObjectStoreName = "SearchIndex"
export const SearchIndexMetaDataOS: ObjectStoreName = "SearchIndexMeta"
export const ElementDataOS: ObjectStoreName = "ElementData"
export const MetaDataOS: ObjectStoreName = "MetaData"
export const GroupDataOS: ObjectStoreName = "GroupMetaData"
export const SearchTermSuggestionsOS: ObjectStoreName = "SearchTermSuggestions"

export const osName = (objectStoreName: ObjectStoreName): string => objectStoreName

export type IndexName = string
export const SearchIndexWordsIndex: IndexName = "SearchIndexWords"
export const indexName = (indexName: IndexName): string => indexName

const DB_VERSION = 3


export interface DbTransaction {
	getAll(objectStore: ObjectStoreName): Promise<{key: string | number, value: any}[]>;

	get<T>(objectStore: ObjectStoreName, key: (string | number), indexName?: IndexName): Promise<?T>;

	getAsList<T>(objectStore: ObjectStoreName, key: string | number, indexName?: IndexName): Promise<T[]>;

	put(objectStore: ObjectStoreName, key: ?(string | number), value: any): Promise<any>;


	delete(objectStore: ObjectStoreName, key: string | number): Promise<void>;

	abort(): void;

	wait(): Promise<void>;

	aborted: boolean
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
	indexingSupported: boolean;

	constructor(supported: boolean, onupgrade?: () => void) {
		this._activeTransactions = 0
		this.indexingSupported = supported
		this._db = new LazyLoaded(() => {
			// If indexedDB is disabled in Firefox, the browser crashes when accessing indexedDB in worker process
			// ask the main thread if indexedDB is supported.
			if (!this.indexingSupported) {
				return Promise.reject(new IndexingNotSupportedError("indexedDB not supported"))
			} else {
				return Promise.fromCallback(callback => {
					let DBOpenRequest
					try {

						DBOpenRequest = indexedDB.open(this._id, DB_VERSION)
						DBOpenRequest.onerror = (event) => {
							// Copy all the keys from the error, including inheritent ones so we can get some info

							const requestErrorEntries = extractErrorProperties(DBOpenRequest.error)
							const eventProperties = extractErrorProperties(event)
							this.indexingSupported = false
							callback(new IndexingNotSupportedError("DbFacade.open.onerror: " + this._id +
								"\nrequest.error: " + requestErrorEntries +
								"\nevent: " + eventProperties +
								"\nevent.target.error" + (event.target ? event.target.error : "[none]"), DBOpenRequest.error))
						}

						DBOpenRequest.onupgradeneeded = (event) => {
							//console.log("upgrade db", event)
							let db = event.target.result
							if (event.oldVersion !== DB_VERSION && event.oldVersion !== 0) {
								if (onupgrade) onupgrade()

								this._deleteObjectStores(db,
									SearchIndexOS,
									ElementDataOS,
									MetaDataOS,
									GroupDataOS,
									SearchTermSuggestionsOS,
									SearchIndexMetaDataOS
								)
							}

							try {
								db.createObjectStore(SearchIndexOS, {autoIncrement: true})
								const metaOS = db.createObjectStore(SearchIndexMetaDataOS, {autoIncrement: true, keyPath: "id"})
								db.createObjectStore(ElementDataOS)
								db.createObjectStore(MetaDataOS)
								db.createObjectStore(GroupDataOS)
								db.createObjectStore(SearchTermSuggestionsOS)
								metaOS.createIndex(SearchIndexWordsIndex, "word", {unique: true})
							} catch (e) {
								callback(new DbError("could not create object store searchindex", e))
							}
						}

						DBOpenRequest.onsuccess = (event) => {
							//console.log("opened db", event)
							DBOpenRequest.result.onabort = (event) => console.log("db aborted", event)
							DBOpenRequest.result.onclose = (event) => {
								console.log("db closed", event)
								this._db.reset()
							}
							DBOpenRequest.result.onerror = (event) => console.log("db error", event)
							callback(null, DBOpenRequest.result)
						}
					} catch (e) {
						this.indexingSupported = false
						callback(new IndexingNotSupportedError(`exception when accessing indexeddb ${this._id}`, e))
					}
				})
			}
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
					let deleteRequest = indexedDB.deleteDatabase(this._db.getLoaded().name)
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
					this.indexingSupported = false
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

	getAll(objectStore: ObjectStoreName): Promise<{key: string | number, value: any}[]> {
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

	get<T>(objectStore: ObjectStoreName, key: (string | number), indexName?: IndexName): Promise<?T> {
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

	getAsList<T>(objectStore: ObjectStoreName, key: string | number, indexName?: IndexName): Promise<T[]> {
		return this.get(objectStore, key, indexName)
		           .then(result => result || [])
	}

	put(objectStore: ObjectStoreName, key: ?(string | number), value: any): Promise<any> {
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


	delete(objectStore: ObjectStoreName, key: string | number): Promise<void> {
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
			callback(new DbError(msg, this._transaction.error))
		}
	}
}
