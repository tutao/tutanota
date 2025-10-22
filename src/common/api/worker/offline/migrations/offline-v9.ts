import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"

export const offline9: OfflineMigration = {
	version: 9,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		console.log("dropping spam_classification_training_data and spam_classification_model, due to new fields")
		await sqlCipherFacade.run(`DROP TABLE IF EXISTS spam_classification_training_data`, [])
		await sqlCipherFacade.run(`DROP TABLE IF EXISTS spam_classification_model`, [])
	},
}
