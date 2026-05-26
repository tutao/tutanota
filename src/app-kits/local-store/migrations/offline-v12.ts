import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../native-bridge/common/generatedipc/types"
import { assertNotNull, isEmpty } from "../../../platform-kits/utils"
import { sql } from "../Sql"
import { CUSTOM_MIN_ID, getTypeString } from "../../../platform-kits/meta"
import { untagSqlObject } from "../SqlValue"
import { MailSetEntryTypeRef } from "@tutao/entities/tutanota"
import { OfflineMigration } from "../OfflineMigration"

const VERSION = 12
/**
 * Delete MailSetEntry ranges that might have been made inconsistent by offline cleaner
 */
export class offline12 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}
	async migrate(storage: OfflineStorage) {
		const { query, params } = sql`SELECT listId
									  FROM ranges
									  WHERE type = ${getTypeString(MailSetEntryTypeRef)}
										AND lower = ${CUSTOM_MIN_ID}`

		const rows = await this.sqlCipherFacade.all(query, params)
		if (isEmpty(rows)) {
			// either no ranges exist yet, or all existing ranges are consistent
			return
		}

		await Promise.all(
			rows.map((row) => {
				const listId = assertNotNull(untagSqlObject(row)["listId"] as Id, "null listId when deleting range")
				console.log("will delete range for list: ", listId)
				storage.deleteRange(MailSetEntryTypeRef, listId)
			}),
		)
	}
}
