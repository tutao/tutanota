import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { AppType, NOTHING_INDEXED_TIMESTAMP } from "../../../platform-kit/app-env"
import { sql } from "../Sql"
import { assertNotNull } from "../../../platform-kit/utils"
import { untagSqlValue } from "../SqlValue"
import { OfflineMigration } from "../OfflineMigration"

const VERSION = 7
/**
 * Empties search index since it could have been inconsistent.
 */
export class offline7 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}
	async migrate(_: OfflineStorage): Promise<void> {
		if (APP_TYPE === AppType.Mail || APP_TYPE === AppType.Integrated) {
			console.log("Droping search indices...")

			// Copied from OfflineStorage
			const tableExists = async (tableName: string): Promise<boolean> => {
				// Read the schema for the table https://sqlite.org/schematab.html
				const { query, params } = sql`SELECT COUNT(*) as metadata_exists
                                            FROM sqlite_schema
                                            WHERE name = ${tableName}`
				const result = assertNotNull(await this.sqlCipherFacade.get(query, params))
				return untagSqlValue(result["metadata_exists"]) === 1
			}

			if (await tableExists("content_mail_index")) {
				const { query, params } = sql`DELETE
                                            FROM content_mail_index`
				await this.sqlCipherFacade.run(query, params)
			}
			if (await tableExists("mail_index")) {
				const { query, params } = sql`DELETE
                                            FROM mail_index`
				await this.sqlCipherFacade.run(query, params)
			}
			if (await tableExists("search_metadata")) {
				const { query, params } = sql`DELETE
                                            FROM search_metadata
                                            WHERE key = 'contactsIndexed'`
				await this.sqlCipherFacade.run(query, params)
			}
			if (await tableExists("contact_index")) {
				const { query, params } = sql`DELETE
                                            FROM contact_index`
				await this.sqlCipherFacade.run(query, params)
			}
			if (await tableExists("search_group_data")) {
				const { query, params } = sql`UPDATE search_group_data
                                              SET indexedTimestamp = ${NOTHING_INDEXED_TIMESTAMP}`
				await this.sqlCipherFacade.run(query, params)
			}
		}
	}
}
