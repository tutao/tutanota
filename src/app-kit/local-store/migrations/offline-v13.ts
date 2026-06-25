import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { sql } from "../Sql"
import { getTypeString } from "@tutao/meta"
import { ContactTypeRef } from "@tutao/entities/tutanota"
import { OfflineMigration } from "../OfflineMigration"
import { assertNotNull } from "@tutao/utils"
import { untagSqlValue } from "../SqlValue"

const VERSION = 13
/**
 * Delete contact index entries for non-existing contacts
 */
export class offline13 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}
	async migrate(_: OfflineStorage) {
		// Copied from OfflineStorage
		const tableExists = async (tableName: string): Promise<boolean> => {
			// Read the schema for the table https://sqlite.org/schematab.html
			const { query, params } = sql`SELECT COUNT(*) as metadata_exists
                                            FROM sqlite_schema
                                            WHERE name = ${tableName}`
			const result = assertNotNull(await this.sqlCipherFacade.get(query, params))
			return untagSqlValue(result["metadata_exists"]) === 1
		}

		if (await tableExists("contact_index")) {
			console.log("Deleting contact index entries of non-existing contacts...")

			const { query, params } = sql`DELETE
									FROM contact_index
									WHERE rowid IN (SELECT contact_index.rowid
													FROM contact_index
															 LEFT JOIN list_entities
																	   ON contact_index.rowid = list_entities.rowid
																		   AND list_entities.type =
																			   ${getTypeString(ContactTypeRef)}
													WHERE list_entities.ROWID IS NULL)`

			await this.sqlCipherFacade.run(query, params)
		}
	}
}
