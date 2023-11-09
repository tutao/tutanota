import { DbError } from "../../common/error/DbError"
import { delay, downcast, LazyLoaded, stringToUtf8Uint8Array, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { IndexingNotSupportedError } from "../../common/error/IndexingNotSupportedError"
import { QuotaExceededError } from "../../common/error/QuotaExceededError"
import { sha256Hash } from "@tutao/tutanota-crypto"
import { IndexName, ObjectStoreName } from "./IndexTables.js"

export const osName = (objectStoreName: ObjectStoreName): string => objectStoreName
export type DbKey = string | number | Uint8Array
export type DatabaseEntry = {
	key: DbKey
	value: any
}

export interface DbTransaction {
	getAll(objectStore: ObjectStoreName): Promise<Array<DatabaseEntry>>

	get<T = any>(objectStore: ObjectStoreName, key: DbKey, indexName?: IndexName): Promise<T | null>

	getAsList<T = any>(objectStore: ObjectStoreName, key: DbKey, indexName?: IndexName): Promise<T[]>

	put(objectStore: ObjectStoreName, key: DbKey | null, value: any): Promise<any>

	delete(objectStore: ObjectStoreName, key: DbKey): Promise<void>

	abort(): void

	wait(): Promise<void>

	aborted: boolean
}

function extractErrorProperties(e: any): string {
	const requestErrorEntries: Record<string, any> = {}

	for (let key in e) {
		requestErrorEntries[key] = e[key]
	}

	return JSON.stringify(requestErrorEntries)
}

/** facade to manage a single named indexedDb */
export class DbFacade {
	private _id!: string
	private _db: LazyLoaded<IDBDatabase>
	private _activeTransactions: number
	indexingSupported: boolean = true

	constructor(version: number, onupgrade: (event: any, db: IDBDatabase, dbFacade: DbFacade) => void) {
		this._activeTransactions = 0
		this._db = new LazyLoaded(() => {
			if (!this.indexingSupported) {
				return Promise.reject(new IndexingNotSupportedError("indexedDB not supported"))
			} else {
				return new Promise((resolve, reject) => {
					let DBOpenRequest: IDBOpenDBRequest

					try {
						DBOpenRequest = self.indexedDB.open(this._id, version)

						DBOpenRequest.onerror = (event) => {
							const target = event.target
							// @ts-ignore
							const error = event.target?.error

							// Copy all the keys from the error, including inheritent ones so we can get some info
							const requestErrorEntries = extractErrorProperties(DBOpenRequest.error)
							const eventProperties = extractErrorProperties(event)
							this.indexingSupported = false
							const message =
								"DbFacade.open.onerror: " +
								this._id +
								"\nrequest.error: " +
								requestErrorEntries +
								"\nevent: " +
								eventProperties +
								"\nevent.target.error: " +
								(error ?? "[none]")

							if (error?.name === "QuotaExceededError") {
								console.log("Storage Quota is exceeded")
								reject(new QuotaExceededError(message, DBOpenRequest.error || error))
							} else {
								reject(new IndexingNotSupportedError(message, DBOpenRequest.error || error))
							}
						}

						DBOpenRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
							//console.log("upgrade db", event)
							try {
								// @ts-ignore
								onupgrade(event, event.target.result, this)
							} catch (e) {
								reject(new DbError("could not create object store for DB " + this._id, e))
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

							resolve(DBOpenRequest.result)
						}
					} catch (e) {
						this.indexingSupported = false
						reject(new IndexingNotSupportedError(`exception when accessing indexeddb ${this._id}`, e))
					}
				})
			}
		})
	}

	async open(id: string): Promise<void> {
		this._id = id
		await this._db.getAsync()
	}

	isSameDbId(dbId: string): boolean {
		return this._id === dbId
	}

	/**
	 * Closes the db if it's open and deletes it.
	 */
	deleteDatabase(id: string): Promise<void> {
		const ensureDbIsClosed = (): Promise<void> => {
			if (this._db.isLoaded()) {
				if (this._activeTransactions > 0) {
					return delay(150).then(ensureDbIsClosed)
				} else {
					this._db.getLoaded().close()
					return Promise.resolve()
				}
			} else {
				return Promise.resolve()
			}
		}

		return ensureDbIsClosed()
			.then(() => DbFacade.deleteDb(id))
			.then(() => this._db.reset())
	}

	static deleteDb(id: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const deleteRequest = self.indexedDB.deleteDatabase(id)
			deleteRequest.onerror = (event: ErrorEvent) => reject(new DbError(`could not delete database ${id}`, downcast<Error>(event)))
			deleteRequest.onsuccess = () => resolve()
		})
	}

	/**
	 * @pre open() must have been called before, but the promise does not need to have returned.
	 */
	createTransaction(readOnly: boolean, objectStores: ObjectStoreName[]): Promise<DbTransaction> {
		// WARNING
		// Do not make this method async because Safari likes to close the transaction if it's not used right away and async somehow influences that.
		// Would be great if we couldn't even call `createTransaction` without having a database beforehand, then this method could be sync.
		return this._db.getAsync().then((db) => {
			try {
				const idbTransaction = db.transaction(objectStores as string[], readOnly ? "readonly" : "readwrite")
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

/**
 * A transaction is usually committed after all requests placed against the transaction have been executed and their
 * returned results handled, and no new requests have been placed against the transaction.
 * @see https://w3c.github.io/IndexedDB/#ref-for-transaction-finish
 */
export class IndexedDbTransaction implements DbTransaction {
	private readonly _transaction: IDBTransaction
	private readonly _promise: Promise<void>
	private readonly _onUnknownError: (e: any) => unknown
	aborted: boolean = false

	constructor(transaction: IDBTransaction, onUnknownError: (e: any) => unknown) {
		this._transaction = transaction
		this._onUnknownError = onUnknownError
		this._promise = new Promise((resolve, reject) => {
			let done = false

			transaction.onerror = (event) => {
				if (!done) {
					this._handleDbError(event, this._transaction, "transaction.onerror", (e) => {
						reject(e)
					})
				} else {
					console.log("ignore error of aborted/fulfilled transaction", event)
				}
			}

			transaction.oncomplete = () => {
				done = true
				resolve()
			}

			transaction.onabort = (event) => {
				event.stopPropagation()
				done = true
				resolve()
			}
		})
	}

	getAll(objectStore: ObjectStoreName): Promise<Array<DatabaseEntry>> {
		return new Promise((resolve, reject) => {
			try {
				let keys: DatabaseEntry[] = []
				let request = this._transaction.objectStore(objectStore).openCursor()

				request.onerror = (event) => {
					this._handleDbError(event, request, "getAll().onError " + objectStore, reject)
				}

				request.onsuccess = (event) => {
					let cursor = request.result

					if (cursor) {
						keys.push({
							// @ts-ignore Key can be something crazy like Date or array of keys
							key: cursor.key,
							value: cursor.value,
						})
						cursor.continue() // onsuccess is called again
					} else {
						resolve(keys) // cursor has reached the end
					}
				}
			} catch (e) {
				this._handleDbError(e, null, "getAll().catch", reject)
			}
		})
	}

	get<T>(objectStore: ObjectStoreName, key: DbKey, indexName?: IndexName): Promise<T | null> {
		return new Promise((resolve, reject) => {
			try {
				const os = this._transaction.objectStore(objectStore)

				let request: IDBRequest<any>

				if (indexName) {
					request = os.index(indexName).get(key)
				} else {
					request = os.get(key)
				}

				request.onerror = (event) => {
					this._handleDbError(event, request, "get().onerror " + objectStore, reject)
				}

				request.onsuccess = (event) => {
					// @ts-ignore
					resolve(event.target.result)
				}
			} catch (e) {
				this._handleDbError(e, null, "get().catch", reject)
			}
		})
	}

	async getAsList<T>(objectStore: ObjectStoreName, key: DbKey, indexName?: IndexName): Promise<T[]> {
		const result = await this.get<T>(objectStore, key, indexName)
		return result ? [result] : []
	}

	put(objectStore: ObjectStoreName, key: DbKey | null, value: any): Promise<any> {
		return new Promise((resolve, reject) => {
			try {
				let request = key ? this._transaction.objectStore(objectStore).put(value, key) : this._transaction.objectStore(objectStore).put(value)

				request.onerror = (event) => {
					this._handleDbError(event, request, "put().onerror " + objectStore, reject)
				}

				request.onsuccess = (event) => {
					// event.target.result isn't known by typescript definitions
					// see: https://github.com/Microsoft/TypeScript/issues/30669
					resolve((event.target as any).result)
				}
			} catch (e) {
				this._handleDbError(e, null, "put().catch", reject)
			}
		})
	}

	delete(objectStore: ObjectStoreName, key: DbKey): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				let request = this._transaction.objectStore(objectStore).delete(key)

				request.onerror = (event) => {
					this._handleDbError(event, request, "delete().onerror " + objectStore, reject)
				}

				request.onsuccess = (event) => {
					resolve()
				}
			} catch (e) {
				this._handleDbError(e, null, ".delete().catch " + objectStore, reject)
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

	_handleDbError(event: any, customTarget: any | null, prefix: string, callback: (e: any) => unknown) {
		const errorEntries = extractErrorProperties(event)
		const eventTargetEntries = event.target ? extractErrorProperties(event.target) : "<null>"
		const eventTargetErrorEntries = event.target && event.target.error ? extractErrorProperties(event.target.error) : "<null>"
		const customTargetEntries = customTarget ? extractErrorProperties(customTarget) : "<null>"
		const customTargetErrorEntries = customTarget && customTarget.error ? extractErrorProperties(customTarget.error) : "<null>"
		const msg =
			"IndexedDbTransaction " +
			prefix +
			"\nOSes: " +
			JSON.stringify((this._transaction as any).objectStoreNames) +
			"\nevent:" +
			errorEntries +
			"\ntransaction.error: " +
			(this._transaction.error ? this._transaction.error.message : "<null>") +
			"\nevent.target: " +
			eventTargetEntries +
			"\nevent.target.error: " +
			eventTargetErrorEntries +
			"\ncustom.target: " +
			customTargetEntries +
			"\ncustom.target.error: " +
			customTargetErrorEntries
		// In some cases it's not available on Firefox 70
		if (typeof event.stopPropagation === "function") event.stopPropagation()

		if (
			customTarget &&
			customTarget.error &&
			(customTarget.error.name === "UnknownError" ||
				(typeof customTarget.error.message === "string" && customTarget.error.message.includes("UnknownError")))
		) {
			this._onUnknownError(customTarget.error)

			callback(new IndexingNotSupportedError(msg, this._transaction.error ?? undefined))
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

export function b64UserIdHash(userId: Id): string {
	return uint8ArrayToBase64(sha256Hash(stringToUtf8Uint8Array(userId)))
}
