import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage, TableDefinitions } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"
import { KeyVerificationTableDefinitions } from "../../facades/IdentityKeyTrustDatabase"

export const offline8: OfflineMigration = {
	version: 8,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		console.log("migrating from trusted_identities to identity_store")
		await sqlCipherFacade.run(`DROP TABLE IF EXISTS trusted_identities`, [])
		await sqlCipherFacade.run(KeyVerificationTableDefinitions.identity_store.definition, [])
	},
}
