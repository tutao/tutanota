import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { OfflineMigration } from "../OfflineMigration"
import { untagSqlObject } from "../SqlValue"
import { GENERATED_MAX_ID } from "@tutao/meta"
import { isEmpty } from "@tutao/utils"

const VERSION = 14

/**
 * Adds lastIndexedEntityListId and lastIndexedEntityElementId to search_group_data
 */
export class offline14 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}

	async migrate() {
		const tableInfo = await this.sqlCipherFacade.all(`PRAGMA table_info(search_group_data)`, [])
		if (isEmpty(tableInfo)) {
			// the whole table doesn't exist; that's fine, we'll add it when we initialize offline storage
			return
		}

		const existingColumns: Set<string> = new Set(tableInfo.map((t) => untagSqlObject(t).name as string))

		async function addColumnIfNotExists(column: string, sqlCipherFacade: SqlCipherFacade) {
			if (!existingColumns.has(column)) {
				// 🦀 ⚠️ this is not a prepared statement (we can't do it here); ye be warned of the consequences ⚠️ 🦀
				await sqlCipherFacade.run(
					`ALTER TABLE search_group_data
						ADD COLUMN ${column} TEXT NOT NULL DEFAULT '${GENERATED_MAX_ID}'`,
					[],
				)
			}
		}

		// the columns may or may not already exist
		//
		// they *shouldn't*, but the migration might have been partially completed, as the version is not written until
		// completion
		await addColumnIfNotExists("lastIndexedEntityElementId", this.sqlCipherFacade)
		await addColumnIfNotExists("lastIndexedEntityListId", this.sqlCipherFacade)
	}
}
