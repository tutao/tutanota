import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "@tutao/native-bridge"

export const offline8: OfflineMigration = {
	version: 8,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		const { KeyVerificationTableDefinitions } = await import("../../facades/IdentityKeyTrustDatabase.js")

		console.log("migrating from trusted_identities to identity_store")
		await sqlCipherFacade.run(`DROP TABLE IF EXISTS trusted_identities`, [])
		await sqlCipherFacade.run(KeyVerificationTableDefinitions.identity_store.definition, [])
	},
}
