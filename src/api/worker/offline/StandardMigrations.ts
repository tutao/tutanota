import {OfflineStorage} from "./OfflineStorage.js"
import {modelInfos} from "../../common/EntityFunctions.js"
import {typedKeys} from "@tutao/tutanota-utils"

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