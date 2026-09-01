import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { OfflineMigration } from "../OfflineMigration"

const VERSION = 18

export class offline18 extends OfflineMigration {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {
		super(VERSION)
	}

	async migrate() {
		//	FIXME migrate to new full-archive indexing
	}
}
