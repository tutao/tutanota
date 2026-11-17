import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { OfflineMigration } from "../OfflineMigration"

const VERSION = 20

/**
 * Set contacts as not indexed since contact index was dropped in offline migration 19
 */
export class offline20 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}

	async migrate() {
		console.log("setting contacts as not indexed")
		await this.sqlCipherFacade.run(`INSERT OR REPLACE INTO search_metadata (key, value) VALUES ('contactsIndexed', 0)`, [])
	}
}
