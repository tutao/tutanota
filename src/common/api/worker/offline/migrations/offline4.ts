import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage, TableDefinitions } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"

export const offline4: OfflineMigration = {
	app: "offline",
	version: 4,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		console.log("migrating to offline v4")
		await sqlCipherFacade.run(`CREATE TABLE IF NOT EXISTS trusted_identities (${TableDefinitions.trusted_identities})`, [])
	},
}
