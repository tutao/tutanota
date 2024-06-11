import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { GroupTypeRef, UserGroupRootTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys102: OfflineMigration = {
	app: "sys",
	version: 102,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		await deleteInstancesOfType(storage, UserGroupRootTypeRef) // to ensure keyRotations is populated
		await deleteInstancesOfType(storage, GroupTypeRef) // to ensure formerGroupKeys is populated
	},
}
