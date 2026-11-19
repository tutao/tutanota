import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { OfflineMigration } from "../OfflineMigration"
import { sql } from "../Sql"
import { assertNotNull } from "@tutao/utils"
import { untagSqlValue } from "../SqlValue"

const VERSION = 20

/**
 * Set contacts as not indexed since contact index was dropped in offline migration 19
 */
export class offline20 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}

	async migrate() {
		// Copied from OfflineStorage
		const tableExists = async (tableName: string): Promise<boolean> => {
			// Read the schema for the table https://sqlite.org/schematab.html
			const { query, params } = sql`SELECT COUNT(*) as metadata_exists
                                            FROM sqlite_schema
                                            WHERE name = ${tableName}`
			const result = assertNotNull(await this.sqlCipherFacade.get(query, params))
			return untagSqlValue(result["metadata_exists"]) === 1
		}

		if (await tableExists("search_metadata")) {
			console.log("setting contacts as not indexed")
			await this.sqlCipherFacade.run(`INSERT OR REPLACE INTO search_metadata (key, value) VALUES ('contactsIndexed', 0)`, [])
		}
	}
}
