import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"

export const offline4: OfflineMigration = {
	app: "offline",
	version: 4,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		// This used to create a "trusted_identities" table which has now been replaced by "identity_store".
	},
}
