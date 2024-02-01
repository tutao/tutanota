import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { deleteInstancesOfType, migrateAllListElements } from "../StandardMigrations.js"
import { MailBodyTypeRef, MailTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { createCustomerInfo, CustomerInfoTypeRef, UserGroupRootTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys94: OfflineMigration = {
	app: "sys",
	version: 94,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		// these are due to the mailbody migration
		await deleteInstancesOfType(storage, MailTypeRef)
		await deleteInstancesOfType(storage, MailBodyTypeRef)
		await deleteInstancesOfType(storage, UserGroupRootTypeRef)
		// this is to add the customerInfo.supportInfo field (sys94)
		await migrateAllListElements(CustomerInfoTypeRef, storage, [createCustomerInfo])
	},
}
