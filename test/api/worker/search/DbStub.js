//@flow

import type {IndexName, ObjectStoreName} from "../../../../src/api/worker/search/DbFacade"
import {
	DbTransaction,
	ElementDataOS,
	GroupDataOS,
	indexName,
	osName,
	SearchIndexMetaDataOS,
	SearchIndexOS,
	SearchIndexWordsIndex
} from "../../../../src/api/worker/search/DbFacade"
import {downcast, neverNull} from "../../../../src/api/common/utils/Utils"

export type Index = {[indexName: string]: string}

export type TableStub = {
	content: {[key: string | number]: any},
	autoIncrement: boolean,
	indexes: Index,
	keyPath: ?string,
	lastId: ?number
}

export class DbStub {
	_objectStores: {[name: string]: TableStub}

	constructor() {
		this._objectStores = {}
	}

	addObjectStore(name: ObjectStoreName, autoIncrement: boolean, keyPath: ?string, index: ?Index) {
		this._objectStores[osName(name)] = {
			content: {},
			autoIncrement,
			indexes: index || {},
			keyPath,
			lastId: null
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
	dbStub.addObjectStore(SearchIndexMetaDataOS, true, "id", {[indexName(SearchIndexWordsIndex)]: "word"})
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

	getAll(objectStore: ObjectStoreName): Promise<{key: string | number, value: any}[]> {
		const entries = Object.entries(this._dbStub.getObjectStore(objectStore).content)
		                      .map(([key, value]) => {
			                      return {key, value}
		                      })
		return Promise.resolve(entries)
	}

	get<T>(objectStore: ObjectStoreName, key: (string | number), indexName?: IndexName): Promise<?T> {
		return Promise.try(() => this.getSync(objectStore, key, indexName))
	}

	getSync<T>(objectStore: ObjectStoreName, key: (string | number), indexName?: IndexName): T {
		if (indexName) {
			const table = this._dbStub.getObjectStore(objectStore)
			const indexField = table.indexes[indexName]
			if (!indexField) throw new Error("No such index: " + indexName)
			const value = Object.values(table.content)
			                    .map(downcast)
			                    .find((value) => value[indexField] === key)
			return neverNull(value)
		} else {
			return this._dbStub.getObjectStore(objectStore).content[key]
		}
	}

	getAsList<T>(objectStore: ObjectStoreName, key: string | number, indexName?: IndexName): Promise<T[]> {
		return this.get(objectStore, key, indexName)
		           .then(result => result || [])
	}

	put(objectStore: ObjectStoreName, key: ?(string | number), value: any): Promise<any> {
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
			table.content[key] = value
			return Promise.resolve(key)
		} else {
			return Promise.reject("Cannot put: no key provided, os: " + osName(objectStore) + ", value: " + JSON.stringify(value))
		}
	}


	delete(objectStore: ObjectStoreName, key: string | number): Promise<void> {
		delete this._dbStub.getObjectStore(objectStore)[key]
		return Promise.resolve()
	}

	abort() {
		// not supported yet
	}

	wait(): Promise<void> {
		return Promise.resolve()
	}
}


