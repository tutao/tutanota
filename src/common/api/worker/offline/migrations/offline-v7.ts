import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { AppType } from "../../../../misc/ClientConstants"
import { NOTHING_INDEXED_TIMESTAMP } from "../../../common/TutanotaConstants"
import { sql } from "../Sql"
import { assertNotNull } from "@tutao/tutanota-utils"
import { untagSqlValue } from "../SqlValue"

/**
 * Empties search index since it could have been inconsistent.
 */
export const offline7: OfflineMigration = {
	version: 7,
	async migrate(_: OfflineStorage, sqlCipherFacade: SqlCipherFacade): Promise<void> {
		if (APP_TYPE === AppType.Mail || APP_TYPE === AppType.Integrated) {
			console.log("Droping search indices...")

			// Copied from OfflineStorage
			const tableExists = async (tableName: string): Promise<boolean> => {
				// Read the schema for the table https://sqlite.org/schematab.html
				const { query, params } = sql`SELECT COUNT(*) as metadata_exists
                                            FROM sqlite_schema
                                            WHERE name = ${tableName}`
				const result = assertNotNull(await sqlCipherFacade.get(query, params))
				return untagSqlValue(result["metadata_exists"]) === 1
			}

			if (await tableExists("content_mail_index")) {
				const { query, params } = sql`DELETE
                                            FROM content_mail_index`
				await sqlCipherFacade.run(query, params)
			}
			if (await tableExists("mail_index")) {
				const { query, params } = sql`DELETE
                                            FROM mail_index`
				await sqlCipherFacade.run(query, params)
			}
			if (await tableExists("search_metadata")) {
				const { query, params } = sql`DELETE
                                            FROM search_metadata
                                            WHERE key = 'contactsIndexed'`
				await sqlCipherFacade.run(query, params)
			}
			if (await tableExists("contact_index")) {
				const { query, params } = sql`DELETE
                                            FROM contact_index`
				await sqlCipherFacade.run(query, params)
			}
			if (await tableExists("search_group_data")) {
				const { query, params } = sql`UPDATE search_group_data
                                              SET indexedTimestamp = ${NOTHING_INDEXED_TIMESTAMP}`
				await sqlCipherFacade.run(query, params)
			}
		}
	},
}
