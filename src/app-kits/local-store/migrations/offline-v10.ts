import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../native-bridge/common/generatedipc/types"
import { OfflineMigration } from "../OfflineMigration"

const VERSION = 10
export class offline10 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}

	async migrate(storage: OfflineStorage): Promise<void> {
		console.log("dropping spam_classification_model, due to refactoring")
		await this.sqlCipherFacade.run(`DROP TABLE IF EXISTS spam_classification_model`, [])
	}
}
