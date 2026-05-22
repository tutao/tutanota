import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { OfflineMigration } from "../OfflineMigration"

const VERSION = 9
export class offline9 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}
	async migrate(storage: OfflineStorage) {
		console.log("dropping spam_classification_training_data and spam_classification_model, due to new fields")
		await this.sqlCipherFacade.run(`DROP TABLE IF EXISTS spam_classification_training_data`, [])
		await this.sqlCipherFacade.run(`DROP TABLE IF EXISTS spam_classification_model`, [])
	}
}
