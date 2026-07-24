import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { OfflineMigration } from "../OfflineMigration"
import { untagSqlObject } from "../SqlValue"
import { isEmpty } from "@tutao/utils"

import { MailImportType } from "../../../entities/tutanota/Utils"
import { OfflineStorage } from "../OfflineStorage"
import { sql } from "../Sql"

const VERSION = 17

/**
 * drops the import_mail_queue table.
 * This is needed, because we change the elementId from the elementId of the mail
 * to the elementId of the ImportedFileMail or ImportedImapMail,
 * and add another mailImportType column to differentiate between File and IMAP import.
 */
export class offline17 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}

	async migrate() {
		console.log("dropping import_mail_queue, due to refactoring")
		await this.sqlCipherFacade.run(`DROP TABLE IF EXISTS import_mail_queue`, [])
	}
}
