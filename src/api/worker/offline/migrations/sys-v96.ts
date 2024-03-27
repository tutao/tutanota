import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { deleteInstancesOfType, migrateAllListElements } from "../StandardMigrations.js"
import { MailBodyTypeRef, MailTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { createCustomerInfo, CustomerInfoTypeRef, UserTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys96: OfflineMigration = {
	app: "sys",
	version: 96,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		// FIXME v96 migrations
	},
}
