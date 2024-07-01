import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"

export const sys101: OfflineMigration = {
	app: "sys",
	version: 101,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		// no cached types have been modified
	},
}
