import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { deleteInstancesOfType } from "../StandardMigrations.js"
import { PushIdentifierTypeRef } from "../../../entities/sys/TypeRefs.js"

export const sys105: OfflineMigration = {
	app: "sys",
	version: 105,
	async migrate(storage: OfflineStorage, _: SqlCipherFacade) {
		await deleteInstancesOfType(storage, PushIdentifierTypeRef)
	},
}
