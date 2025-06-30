import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage, TableDefinitions } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"

export const offline7: OfflineMigration = {
	version: 7,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		console.log("migrating to offline v7")
		await sqlCipherFacade.run(`DROP TABLE IF EXISTS trusted_identities`, [])
		await sqlCipherFacade.run(TableDefinitions.identity_store.definition, [])
	},
}
