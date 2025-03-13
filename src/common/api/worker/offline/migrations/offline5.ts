import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { isOfflineStorageAvailable } from "../../../common/Env"

/**
 * indexedDB index is no longer needed once migrated to offline storage index
 */
export const offline5: OfflineMigration = {
	app: "offline",
	version: 5,
	async migrate(storage: OfflineStorage, _: SqlCipherFacade): Promise<void> {
		if (isOfflineStorageAvailable()) {
			const { b64UserIdHash } = await import("../../search/DbFacade.js")
			const userId = storage.getUserId()
			indexedDB.deleteDatabase(b64UserIdHash(userId))
		}
	},
}
