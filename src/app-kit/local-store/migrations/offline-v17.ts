import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { OfflineMigration } from "../OfflineMigration"
import { untagSqlObject } from "../SqlValue"
import { isEmpty } from "@tutao/utils"

import { MailImportType } from "../../../entities/tutanota/Utils"

const VERSION = 17

/**
 * Adds mailImportType column to import_mail_queue table
 */
export class offline17 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}

	async migrate() {
		console.log("running migration to add mailImportType")
		const tableInfo = await this.sqlCipherFacade.all(`PRAGMA table_info(import_mail_queue)`, [])
		if (isEmpty(tableInfo)) {
			// the whole table doesn't exist; that's fine, we'll add it when we initialize offline storage
			return
		}

		const existingColumns: Set<string> = new Set(tableInfo.map((t) => untagSqlObject(t).name as string))
		const defaultValueForExistingImportMailQueue = MailImportType.FileImport
		async function addColumnIfNotExists(column: string, sqlCipherFacade: SqlCipherFacade) {
			if (!existingColumns.has(column)) {
				// 🦀 ⚠️ this is not a prepared statement (we can't do it here); ye be warned of the consequences ⚠️ 🦀
				await sqlCipherFacade.run(
					`ALTER TABLE import_mail_queue
						ADD COLUMN ${column} TEXT NOT NULL DEFAULT '${defaultValueForExistingImportMailQueue}'`,
					[],
				)
			}
		}

		// the column may or may not already exist
		//
		// it *shouldn't*, but the migration might have been partially completed, as the version is not written until
		// completion
		await addColumnIfNotExists("mailImportType", this.sqlCipherFacade)
	}
}
