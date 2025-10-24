import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"
import { CustomerPropertiesTypeRef } from "../../../entities/sys/TypeRefs"

export const offline9: OfflineMigration = {
	version: 9,
	async migrate(storage: OfflineStorage, _: SqlCipherFacade) {
		await storage.setAllOnType(CustomerPropertiesTypeRef, "requireTwoFactor", (properties) => properties.requireTwoFactor ?? false)
	},
}
