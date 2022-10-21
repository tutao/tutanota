import {OfflineMigration} from "../OfflineStorageMigrator.js"
import {OfflineStorage, sql} from "../OfflineStorage.js"
import {SqlCipherFacade} from "../../../../native/common/generatedipc/SqlCipherFacade.js"

/**
 * Migration to add ownerGroup
 */
export const offline1: OfflineMigration = {
	app: "offline",
	version: 1,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		await addOwnerToElementEntities(sqlCipherFacade)
		await addOwnerToListEntities(sqlCipherFacade)

		await sqlCipherFacade.run("DELETE FROM ranges", [])
		console.log("nuked ranges")
		await sqlCipherFacade.run("DELETE FROM list_entities", [])
		console.log("nuked list_entities")
		await sqlCipherFacade.run("DELETE FROM element_entities", [])
		console.log("nuked element_entities")
		await sqlCipherFacade.run("DELETE FROM metadata WHERE KEY = 'lastUpdateTime'", [])
		console.log("nuked lastUpdateTime")
		await sqlCipherFacade.run("DELETE FROM lastUpdateBatchIdPerGroupId", [])
		console.log("nuked lastUpdateBatchIdPerGroupId")
	}
}

async function addOwnerToElementEntities(sqlCipherFacade: SqlCipherFacade) {
	const {query, params} = sql`ALTER TABLE element_entities add column ownerGroup TEXT`
	await sqlCipherFacade.run(query, params)
}

async function addOwnerToListEntities(sqlCipherFacade: SqlCipherFacade) {
	const {query, params} = sql`ALTER TABLE list_entities add column ownerGroup TEXT`
	await sqlCipherFacade.run(query, params)
}