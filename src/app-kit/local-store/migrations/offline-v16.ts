import { OfflineMigration } from "../OfflineMigration"
import { OfflineStorage } from "../OfflineStorage"
import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"

const VERSION = 16

/**
 * removes offline ranges for MailSetEntries because of cache inconsistencies
 */
export class offline16 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}

	async migrate(storage: OfflineStorage) {
		console.log("dropping encrypted_mail_details_blobs, due to refactoring")
		await this.sqlCipherFacade.run(`DROP TABLE IF EXISTS encrypted_mail_details_blobs`, [])
	}
}
