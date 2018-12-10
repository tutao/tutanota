//@flow
import {DbError} from "../../common/error/DbError"
import {LazyLoaded} from "../../common/utils/LazyLoaded"

export const SearchIndexOS = "SearchIndex"
export const SearchIndexMetaDataOS = "SearchIndexMeta"
export const ElementDataOS = "ElementData"
export const MetaDataOS = "MetaData"
export const GroupDataOS = "GroupMetaData"
export const SearchTermSuggestionsOS = "SearchTermSuggestions"

const DB_VERSION = 2

export class DbFacade {
	_id: string;
	_db: LazyLoaded<IDBDatabase>;
	_activeTransactions: number;

	constructor(supported: boolean) {
		this._activeTransactions = 0
		this._db = new LazyLoaded(() => {
			// If indexedDB is disabled in Firefox, the browser crashes when accessing indexedDB in worker process
			// ask the main thread if indexedDB is supported.
			if (!supported) {
				return Promise.reject(new DbError("indexedDB not supported"))
			} else {
				return new Promise.fromCallback(callback => {
					let DBOpenRequest
					try {

						DBOpenRequest = indexedDB.open(this._id, DB_VERSION)
						DBOpenRequest.onerror = (error) => {
							callback(new DbError(`could not open indexeddb ${this._id}`, error))
						}

						DBOpenRequest.onupgradeneeded = (event) => {
							//console.log("upgrade db", event)
							let db = event.target.result
							if (event.oldVersion !== DB_VERSION && event.oldVersion !== 0) {
								this._deleteObjectStores(db,
									SearchIndexOS,
									ElementDataOS,
									MetaDataOS,
									GroupDataOS,
									SearchTermSuggestionsOS,
									SearchIndexMetaDataOS)
							}

							try {
								db.createObjectStore(SearchIndexOS, {autoIncrement: true})
								db.createObjectStore(SearchIndexMetaDataOS)
								db.createObjectStore(ElementDataOS)
								db.createObjectStore(MetaDataOS)
								db.createObjectStore(GroupDataOS)
								db.createObjectStore(SearchTermSuggestionsOS)

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
						callback(new DbError(`exception when accessing indexeddb ${this._id}`, e))
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
	createTransaction(readOnly: boolean, objectStores: string[]): Promise<DbTransaction> {
		return this._db.getAsync().then(db => {
			try {
				const transaction = new DbTransaction(db.transaction(objectStores, readOnly ? "readonly" : "readwrite"))
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
export class DbTransaction {
	_transaction: IDBTransaction;
	_promise: Promise<void>;
	aborted: boolean;

	constructor(transaction: IDBTransaction) {
		this._transaction = transaction
		this._promise = Promise.fromCallback((callback) => {
			transaction.onerror = (event) => {
				callback(new DbError("IDB transaction error!", event))
			}
			transaction.oncomplete = (event) => {
				callback()
			}
			transaction.onabort = (event) => {
				callback()
			}
		})
	}

	getAll(objectStore: string): Promise<{key: string, value: any}[]> {
		return Promise.fromCallback((callback) => {
			try {
				let keys = []
				let request = (this._transaction.objectStore(objectStore): any).openCursor()
				request.onerror = (event) => {
					callback(new DbError("IDB Unable to retrieve data from database!", event))
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
				callback(new DbError("IDB could not get data os:" + objectStore, e))
			}
		})
	}

	get<T>(objectStore: string, key: (string | number)): Promise<?T> {
		return Promise.fromCallback((callback) => {
			try {
				let request = this._transaction.objectStore(objectStore).get(key)
				request.onerror = (event) => {
					callback(new DbError("IDB Unable to retrieve data from database!", event))
				}
				request.onsuccess = (event) => {
					callback(null, event.target.result)
				}
			} catch (e) {
				callback(new DbError("IDB could not get data os:" + objectStore + " key:" + key, e))
			}
		})
	}

	getAsList<T>(objectStore: string, key: string | number): Promise<T[]> {
		return this.get(objectStore, key).then(result => {
			if (!result) {
				return []
			}
			return result
		})
	}

	put(objectStore: string, key: ?(string | number), value: any): Promise<any> {
		return Promise.fromCallback((callback) => {
			try {
				let request = key
					? this._transaction.objectStore(objectStore).put(value, key)
					: this._transaction.objectStore(objectStore).put(value)
				request.onerror = (event) => {
					callback(new DbError("IDB Unable to write data to database!", event))
				}
				request.onsuccess = (event) => {
					callback(null, event.target.result)
				}
			} catch (e) {
				callback(new DbError("IDB could not write data", e))
			}
		})
	}


	delete(objectStore: string, key: string | number): Promise<void> {
		return Promise.fromCallback((callback) => {
			try {
				let request = this._transaction.objectStore(objectStore).delete(key)
				request.onerror = (event) => {
					callback(new DbError("IDB Unable to delete key from database!", event))
				}
				request.onsuccess = (event) => {
					callback()
				}
			} catch (e) {
				callback(new DbError("IDB could not delete key", e))
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
}