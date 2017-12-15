//@flow
import {DbError} from "../../common/error/DbError"
import {neverNull} from "../../common/utils/Utils"

export const SearchIndexOS = "SearchIndex"
export const ElementDataOS = "ElementData"
export const MetaDataOS = "MetaData"
export const GroupDataOS = "GroupMetaData"
export const SearchTermSuggestionsOS = "SearchTermSuggestions"


export class DbFacade {
	db: ?IDBDatabase;

	constructor() {
	}

	open(id: string): Promise<void> {
		if (this.db != null) return Promise.resolve()
		return new Promise.fromCallback((callback) => {
			let DBOpenRequest = indexedDB.open(id, 1);
			DBOpenRequest.onerror = (event) => {
				callback(new DbError(`could not open indexeddb ${id}`, event), null)
			}

			DBOpenRequest.onupgradeneeded = (event) => {
				//console.log("upgrade db", event)
				let db = event.target.result
				try {
					db.createObjectStore(SearchIndexOS)
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
				this.db = DBOpenRequest.result;
				this.db.onabort = (event) => console.log("db aborted", event)
				this.db.onclose = (event) => console.log("db closed", event)
				this.db.onerror = (event) => console.log("db error", event)
				callback()
			}
		})
	}


	deleteDatabase(): Promise<void> {
		if (this.db) {
			this.db.close()
			return Promise.fromCallback(cb => {
				let deleteRequest = indexedDB.deleteDatabase(neverNull(this.db).name)
				deleteRequest.onerror = (event) => {
					cb(new DbError(`could not delete database ${neverNull(this.db).name}`, event), null)
				}
				deleteRequest.onsuccess = (event) => {
					this.db = null
					cb()
				}
			})
		} else {
			return Promise.resolve()
		}
	}


	createTransaction(readOnly: boolean, objectStores: string[]): DbTransaction {
		return new DbTransaction(neverNull(this.db).transaction(objectStores, readOnly ? "readonly" : "readwrite"))
	}

}

type DbRequest = {
	action: Function;
	objectStore:string;
}

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

	getAll(objectStore: string): Promise<{key:string, value: any}[]> {
		return Promise.fromCallback((callback) => {
			try {
				let keys = []
				let request = (this._transaction.objectStore(objectStore):any).openCursor()
				request.onerror = (event) => {
					callback(new DbError("IDB Unable to retrieve data from database!", event))
				}
				request.onsuccess = (event) => {
					let cursor = event.target.result
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

	get(objectStore: string, key: string): Promise<any> {
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

	getAsList(objectStore: string, key: string): Promise<any[]> {
		return this.get(objectStore, key).then(result => {
			if (!result) {
				return []
			}
			return result
		})
	}

	put(objectStore: string, key: string, value: any): Promise<void> {
		return Promise.fromCallback((callback) => {
			try {
				let request = this._transaction.objectStore(objectStore).put(value, key)
				request.onerror = (event) => {
					callback(new DbError("IDB Unable to write data to database!", event))
				}
				request.onsuccess = (event) => {
					callback()
				}
			} catch (e) {
				callback(new DbError("IDB could not write data", e))
			}
		})
	}


	delete(objectStore: string, key: string): Promise<void> {
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

	await(): Promise<void> {
		return this._promise
	}
}