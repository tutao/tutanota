import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage, TableDefinitions } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"

export const offline3: OfflineMigration = {
	app: "offline",
	version: 3,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		console.log("migrating to offline v3")
		await sqlCipherFacade.run(`CREATE TABLE IF NOT EXISTS verification_pool (${TableDefinitions.verification_pool})`, [])
	},
}
