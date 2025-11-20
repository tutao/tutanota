import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"

export const offline10: OfflineMigration = {
	version: 10,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		console.log("dropping spam_classification_model, due to refactoring")
		await sqlCipherFacade.run(`DROP TABLE IF EXISTS spam_classification_model`, [])
	},
}
