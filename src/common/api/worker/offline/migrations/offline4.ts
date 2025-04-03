import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { b64UserIdHash } from "../../search/DbFacade"
import { isOfflineStorageAvailable } from "../../../common/Env"

/**
 * indexedDB index is no longer needed once migrated to offline storage index
 */
export const offline4: OfflineMigration = {
	app: "offline",
	version: 4,
	async migrate(storage: OfflineStorage, _: SqlCipherFacade): Promise<void> {
		if (isOfflineStorageAvailable()) {
			const userId = await storage.getUserId()
			indexedDB.deleteDatabase(b64UserIdHash(userId))
		}
	},
}
