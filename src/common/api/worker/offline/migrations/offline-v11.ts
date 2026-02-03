import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { AppType } from "../../../../misc/ClientConstants"
import { NOTHING_INDEXED_TIMESTAMP } from "../../../common/TutanotaConstants"
import { sql } from "../Sql"
import { assertNotNull } from "@tutao/tutanota-utils"
import { untagSqlValue } from "../SqlValue"

/**
 * Adds sender and recipient columns to content_mail_index for proper field filtering.
 * FTS5 contentless tables ignore column filters, so we need to store these fields
 * separately to filter by them using regular SQL WHERE clauses.
 *
 * Since we're adding new required columns, we need to recreate the table and
 * reset the search index to be rebuilt.
 */
export const offline11: OfflineMigration = {
	version: 11,
	async migrate(_: OfflineStorage, sqlCipherFacade: SqlCipherFacade): Promise<void> {
		if (APP_TYPE === AppType.Mail || APP_TYPE === AppType.Integrated) {
			console.log("Migrating content_mail_index to add sender/recipient columns for field filtering...")

			const tableExists = async (tableName: string): Promise<boolean> => {
				const { query, params } = sql`SELECT COUNT(*) as metadata_exists
                                            FROM sqlite_schema
                                            WHERE name = ${tableName}`
				const result = assertNotNull(await sqlCipherFacade.get(query, params))
				return untagSqlValue(result["metadata_exists"]) === 1
			}

			// Drop and recreate content_mail_index with new columns
			if (await tableExists("content_mail_index")) {
				await sqlCipherFacade.run(`DROP TABLE content_mail_index`, [])
			}

			// Create the table with the new schema including sender/recipient columns
			await sqlCipherFacade.run(
				`CREATE TABLE IF NOT EXISTS content_mail_index (receivedDate NUMBER NOT NULL, sets STRING NOT NULL, sender STRING NOT NULL DEFAULT '', toRecipients STRING NOT NULL DEFAULT '', ccRecipients STRING NOT NULL DEFAULT '', bccRecipients STRING NOT NULL DEFAULT '')`,
				[],
			)

			// Also clear the FTS5 mail_index since it needs to be rebuilt along with content_mail_index
			if (await tableExists("mail_index")) {
				const { query, params } = sql`DELETE
                                            FROM mail_index`
				await sqlCipherFacade.run(query, params)
			}

			// Reset search group data to trigger re-indexing
			if (await tableExists("search_group_data")) {
				const { query, params } = sql`UPDATE search_group_data
                                              SET indexedTimestamp = ${NOTHING_INDEXED_TIMESTAMP}`
				await sqlCipherFacade.run(query, params)
			}

			console.log("content_mail_index migration completed, search index will be rebuilt")
		}
	},
}
