import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"

export const sys96: OfflineMigration = {
	app: "sys",
	version: 96,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {},
}
