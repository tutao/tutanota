import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"

export const sys98: OfflineMigration = {
	app: "sys",
	version: 98,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		//nothing to do because we only created a new type
	},
}
