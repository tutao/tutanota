import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"
import { assertNotNull, getTypeString, isEmpty } from "@tutao/utils"
import { sql } from "../Sql"
import { CUSTOM_MIN_ID, tutanotaTypeRefs } from "@tutao/typerefs"
import { untagSqlObject } from "../SqlValue"

/**
 * Delete MailSetEntry ranges that might have been made inconsistent by offline cleaner
 */
export const offline12: OfflineMigration = {
	version: 12,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		const { query, params } = sql`SELECT listId
									  FROM ranges
									  WHERE type = ${getTypeString(tutanotaTypeRefs.MailSetEntryTypeRef)}
										AND lower = ${CUSTOM_MIN_ID}`

		const rows = await sqlCipherFacade.all(query, params)
		if (isEmpty(rows)) {
			// either no ranges exist yet, or all existing ranges are consistent
			return
		}

		await Promise.all(
			rows.map((row) => {
				const listId = assertNotNull(untagSqlObject(row)["listId"] as Id, "null listId when deleting range")
				console.log("will delete range for list: ", listId)
				storage.deleteRange(tutanotaTypeRefs.MailSetEntryTypeRef, listId)
			}),
		)
	},
}
