import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { OfflineMigration } from "../OfflineMigration"

const VERSION = 18

/**
 * Drops encrypted_mail_details_blobs and cached_mail_details_archives tables as they are replaced by encrypted_blobs
 * and encrypted_blobs_metadata respectively.
 */
export class offline18 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}

	async migrate() {
		console.log("dropping encrypted_mail_details_blobs and cached_mail_details_archives")
		await this.sqlCipherFacade.run(`DROP TABLE IF EXISTS encrypted_mail_details_blobs`, [])
		await this.sqlCipherFacade.run(`DROP TABLE IF EXISTS cached_mail_details_archives`, [])
	}
}
