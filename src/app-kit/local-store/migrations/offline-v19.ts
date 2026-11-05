import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { OfflineMigration } from "../OfflineMigration"

const VERSION = 19

/**
 * Drops contact_index since new fields were added this version.
 * Will just re-index contacts.
 */
export class offline19 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}

	async migrate() {
		console.log("dropping contact_index")
		await this.sqlCipherFacade.run(`DROP TABLE IF EXISTS contact_index`, [])
	}
}
