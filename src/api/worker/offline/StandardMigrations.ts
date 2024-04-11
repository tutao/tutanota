import { OfflineStorage } from "./OfflineStorage.js"
import { modelInfos } from "../../common/EntityFunctions.js"
import { typedKeys, TypeRef } from "@tutao/tutanota-utils"
import { ElementEntity, ListElementEntity, SomeEntity } from "../../common/EntityTypes.js"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"

export async function migrateAllListElements<T extends ListElementEntity>(typeRef: TypeRef<T>, storage: OfflineStorage, migrations: Array<Migration<T>>) {
	let entities = await storage.getListElementsOfType(typeRef)

	for (const migration of migrations) {
		entities = entities.map(migration)
	}

	for (const entity of entities) {
		await storage.put(entity)
	}
}

export async function migrateAllElements<T extends ElementEntity>(typeRef: TypeRef<T>, storage: OfflineStorage, migrations: Array<Migration<T>>) {
	let entities = await storage.getElementsOfType(typeRef)

	for (const migration of migrations) {
		entities = entities.map(migration)
	}

	for (const entity of entities) {
		await storage.put(entity)
	}
}

export type Migration<T extends SomeEntity> = (entity: any) => T

export function renameAttribute<T extends SomeEntity>(oldName: string, newName: keyof T): Migration<T> {
	return function (entity) {
		entity[newName] = entity[oldName as keyof T]
		delete entity[oldName as keyof T]
		return entity
	}
}

export function addOwnerKeyVersion<T extends SomeEntity>(): Migration<T> {
	return function (entity) {
		entity["_ownerKeyVersion"] = entity["_ownerEncSessionKey"] == null ? null : "0"
		return entity
	}
}

export function removeValue<T extends SomeEntity>(valueName: string): Migration<T> {
	return function (entity) {
		delete entity[valueName as keyof T]
		return entity
	}
}

export function addValue<T extends SomeEntity>(valueName: string, value: any): Migration<T> {
	return function (entity) {
		entity[valueName] = value
		return entity
	}
}

export function booleanToNumberValue<T extends SomeEntity>(attribute: string): Migration<T> {
	return function (entity) {
		// same default value mapping as in the tutadb migration
		entity[attribute] = (entity[attribute] ? "1" : "0") as unknown as T[keyof T]
		return entity
	}
}

export function changeCardinalityFromAnyToZeroOrOne<T extends SomeEntity>(attribute: string): Migration<T> {
	return function (entity) {
		const value: Array<unknown> = entity[attribute]
		const length = value.length
		if (length === 0) {
			entity[attribute] = null
		} else if (length === 1) {
			entity[attribute] = value[0]
		} else {
			throw new ProgrammingError(`not possible to migrate ANY to ZERO_OR_ONE with array length > 1. actual length: ${length}`)
		}
		return entity
	}
}

export async function clearDatabase(storage: OfflineStorage) {
	await storage.purgeStorage()
	await writeModelVersions(storage)
}

export function deleteInstancesOfType<T extends SomeEntity>(storage: OfflineStorage, type: TypeRef<T>): Promise<void> {
	return storage.deleteAllOfType(type)
}

async function writeModelVersions(storage: OfflineStorage) {
	for (const app of typedKeys(modelInfos)) {
		const key = `${app}-version` as const
		let version = modelInfos[app].version
		await storage.setStoredModelVersion(app, version)
	}
}
