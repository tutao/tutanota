import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { migrateAllElements, removeValue } from "../StandardMigrations.js"
import { UserTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys104: OfflineMigration = {
	app: "sys",
	version: 104,
	async migrate(storage: OfflineStorage, _: SqlCipherFacade) {
		// SystemModelV104 removes phoneNumbers from the USER_TYPE
		await migrateAllElements(UserTypeRef, storage, [removeValue("phoneNumbers")])
	},
}
