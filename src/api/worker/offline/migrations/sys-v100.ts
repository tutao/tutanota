import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"

export const sys100: OfflineMigration = {
	app: "sys",
	version: 100,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		// no cached types have been modified
	},
}
