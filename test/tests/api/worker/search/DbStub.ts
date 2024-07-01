import type { DbKey } from "../../../../../src/common/api/worker/search/DbFacade.js"
import { DbTransaction, osName } from "../../../../../src/common/api/worker/search/DbFacade.js"
import { downcast, neverNull } from "@tutao/tutanota-utils"
import {
	ElementDataOS,
	GroupDataOS,
	IndexName,
	ObjectStoreName,
	SearchIndexMetaDataOS,
	SearchIndexOS,
	SearchIndexWordsIndex,
} from "../../../../../src/common/api/worker/search/IndexTables.js"

export type Index = { [indexName: string]: string }

export type TableStub = {
	// @ts-ignore[TS2538]
	content: Record<DbKey, any>
	autoIncrement: boolean
	indexes: Index
	keyPath?: string | null
	lastId?: number | null
}

export class DbStub {
	_objectStores: { [name: string]: TableStub }
	indexingSupported: boolean

	constructor() {
		this._objectStores = {}
		this.indexingSupported = true
	}

	addObjectStore(name: ObjectStoreName, autoIncrement: boolean, keyPath?: string, index?: Index) {
		this._objectStores[osName(name)] = {
			content: {},
			autoIncrement,
			indexes: index || {},
			keyPath,
			lastId: null,
		}
	}

	getObjectStore(name: ObjectStoreName): TableStub {
		return this._objectStores[osName(name)]
	}

	createTransaction(): DbStubTransaction {
		return new DbStubTransaction(this)
	}
}

export function createSearchIndexDbStub(): DbStub {
	const dbStub = new DbStub()
	dbStub.addObjectStore(SearchIndexOS, true)
	dbStub.addObjectStore(SearchIndexMetaDataOS, true, "id", { [SearchIndexWordsIndex]: "word" })
	dbStub.addObjectStore(ElementDataOS, false)
	dbStub.addObjectStore(GroupDataOS, false)
	return dbStub
}

export class DbStubTransaction implements DbTransaction {
	_dbStub: DbStub
	aborted: boolean

	constructor(stub: DbStub) {
		this._dbStub = stub
		this.aborted = false
	}

	getAll(objectStore: ObjectStoreName): Promise<{ key: DbKey; value: any }[]> {
		const entries = Object.entries(this._dbStub.getObjectStore(objectStore).content).map(([key, value]) => {
			return { key, value }
		})
		return Promise.resolve(entries)
	}

	async get<T>(objectStore: ObjectStoreName, key: DbKey, indexName?: IndexName): Promise<T | null> {
		return this.getSync(objectStore, key, indexName)
	}

	getSync<T>(objectStore: ObjectStoreName, key: DbKey, indexName?: IndexName): T {
		if (indexName) {
			const table = this._dbStub.getObjectStore(objectStore)
			const indexField = table.indexes[indexName]
			if (!indexField) throw new Error("No such index: " + indexName)
			const value = Object.values(table.content)
				.map(downcast)
				.find((value) => value[indexField] === key)
			return neverNull(value)
		} else {
			// @ts-ignore[TS2538]
			return this._dbStub.getObjectStore(objectStore).content[key]
		}
	}

	async getAsList<T>(objectStore: ObjectStoreName, key: DbKey, indexName?: IndexName): Promise<T[]> {
		const result = await this.get<T[]>(objectStore, key, indexName)
		return result ?? []
	}

	put(objectStore: ObjectStoreName, key: DbKey | null, value: any): Promise<any> {
		const table = this._dbStub.getObjectStore(objectStore)
		if (table.keyPath) {
			key = value[table.keyPath]
		}
		if (key == null && table.autoIncrement) {
			const lastId = (table.lastId || 0) + 1
			table.lastId = lastId
			table.content[lastId] = value
			if (table.keyPath) {
				value[table.keyPath] = lastId
			}
			return Promise.resolve(lastId)
		} else if (key != null) {
			if (table.keyPath && table.autoIncrement) {
				table.lastId = Math.max(table.lastId || 0, Number(key))
			}
			// @ts-ignore[TS2538]
			table.content[key] = value
			return Promise.resolve(key)
		} else {
			return Promise.reject("Cannot put: no key provided, os: " + osName(objectStore) + ", value: " + JSON.stringify(value))
		}
	}

	delete(objectStore: ObjectStoreName, key: DbKey): Promise<void> {
		// @ts-ignore[TS2538]
		delete this._dbStub.getObjectStore(objectStore).content[key]
		return Promise.resolve()
	}

	abort() {
		// not supported yet
	}

	wait(): Promise<void> {
		return Promise.resolve()
	}
}
