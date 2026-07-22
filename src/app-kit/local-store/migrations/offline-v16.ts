import { OfflineMigration } from "../OfflineMigration"
import { OfflineStorage } from "../OfflineStorage"
import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { sql } from "../Sql"

const VERSION = 16

/**
 * removes offline ranges for MailSetEntries because of cache inconsistencies
 */
export class offline16 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}

	async migrate(storage: OfflineStorage) {
		const { query, params } = sql`DELETE
									  FROM encrypted_mail_details_blobs;`
		await this.sqlCipherFacade.run(query, params)
	}
}
