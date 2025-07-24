import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { AppType } from "../../../../misc/ClientConstants"
import { NOTHING_INDEXED_TIMESTAMP } from "../../../common/TutanotaConstants"
import { sql } from "../Sql"

/**
 * Empties search index since it could have been inconsistent.
 */
export const offline7: OfflineMigration = {
	version: 7,
	async migrate(_: OfflineStorage, sqlCipherFacade: SqlCipherFacade): Promise<void> {
		if (APP_TYPE === AppType.Mail || APP_TYPE === AppType.Integrated) {
			console.log("Droping search indices...")
			{
				const { query, params } = sql`DELETE
                                            FROM content_mail_index`
				await sqlCipherFacade.run(query, params)
			}
			{
				const { query, params } = sql`DELETE
                                            FROM mail_index`
				await sqlCipherFacade.run(query, params)
			}
			{
				const { query, params } = sql`DELETE
											  FROM search_metadata
											  WHERE key = 'contactsIndexed'`
				await sqlCipherFacade.run(query, params)
			}
			{
				const { query, params } = sql`DELETE
                                            FROM contact_index`
				await sqlCipherFacade.run(query, params)
			}
			{
				const { query, params } = sql`UPDATE search_group_data
                                            SET indexedTimestamp = ${NOTHING_INDEXED_TIMESTAMP}`
				await sqlCipherFacade.run(query, params)
			}
		}
	},
}
