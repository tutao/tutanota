import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { OfflineMigration } from "../OfflineMigration"

const VERSION = 8
export class offline8 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}

	async migrate(storage: OfflineStorage) {
		const { KeyVerificationTableDefinitions } = await import("../IdentityKeyTrustDatabase.js")

		console.log("migrating from trusted_identities to identity_store")
		await this.sqlCipherFacade.run(`DROP TABLE IF EXISTS trusted_identities`, [])
		await this.sqlCipherFacade.run(KeyVerificationTableDefinitions.identity_store.definition, [])
	}
}
