import {OfflineStorage} from "./OfflineStorage.js"
import {modelInfos} from "../../common/EntityFunctions.js"
import {typedKeys, TypeRef} from "@tutao/tutanota-utils"
import {ListElementEntity, SomeEntity, TypeModel} from "../../common/EntityTypes.js"

export async function migrateAllListElements<T extends ListElementEntity>(typeRef: TypeRef<T>, storage: OfflineStorage, migrations: Array<Migration<T>>) {
	let entities = await storage.getListElementsOfType(typeRef)

	for (const migration of migrations) {
		entities = entities.map(migration)
	}

	for (const entity of entities) {
		await storage.put(entity)
	}
}

type Migration<T extends SomeEntity> = (entity: any) => T

export function renameAttribute<T extends SomeEntity>(oldName: string, newName: keyof T): Migration<T> {
	return function(entity) {
		entity[newName] = entity[oldName as keyof T]
		delete entity[oldName as keyof T]
		return entity
	}
}

export function booleanToNumberValue<T extends SomeEntity>(attribute: string): Migration<T> {
	return function(entity) {
		// same default value mapping as in the tutadb migration
		entity[attribute] = (entity[attribute] ? "1" : "0") as unknown as T[keyof T]
		return entity
	}
}

export async function clearDatabase(storage: OfflineStorage) {
	await storage.purgeStorage()
	await writeModelVersions(storage)
}

async function writeModelVersions(storage: OfflineStorage) {
	for (const app of typedKeys(modelInfos)) {
		const key = `${app}-version` as const
		let version = modelInfos[app].version
		await storage.setStoredModelVersion(app, version)
	}
}