import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage, TableDefinitions } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"
import { SpamClassificationDefinitions } from "../../../../../mail-app/workerUtils/index/OfflineStoragePersistence"

export const offline9: OfflineMigration = {
	version: 9,
	// TODO: Is it okay to always retrain from scratch when we update the model tables / offline migration?
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		console.log("migrating spam_classification_training_data, adding new fields")
		await sqlCipherFacade.run(`DROP TABLE IF EXISTS spam_classification_training_data`, [])
		await sqlCipherFacade.run(`DROP TABLE IF EXISTS spam_classification_model`, [])
		await sqlCipherFacade.run(SpamClassificationDefinitions.spam_classification_training_data.definition, [])
		await sqlCipherFacade.run(SpamClassificationDefinitions.spam_classification_model.definition, [])
	},
}
