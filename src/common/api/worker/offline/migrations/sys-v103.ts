import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { GroupTypeRef, UserGroupRootTypeRef, UserTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys103: OfflineMigration = {
	app: "sys",
	version: 103,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		//Appstore
	},
}
