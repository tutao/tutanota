import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"
import { TableDefinitions } from "../../../common/OfflineStorageConstants"

export const offline5: OfflineMigration = {
	app: "offline",
	version: 5,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		console.log("migrating to offline v5")
		await sqlCipherFacade.run(`DROP TABLE IF EXISTS trusted_identities`, [])
		await sqlCipherFacade.run(`CREATE TABLE IF NOT EXISTS identity_store (${TableDefinitions.identity_store})`, [])
	},
}
