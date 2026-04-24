import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "@tutao/native-bridge"
import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { isBrowser, Mode } from "@tutao/app-env"

/**
 * indexedDB index is no longer needed once migrated to offline storage index
 */
export const offline6: OfflineMigration = {
	version: 6,
	async migrate(storage: OfflineStorage, _: SqlCipherFacade): Promise<void> {
		if (!isBrowser() && !(env.mode === Mode.Admin)) {
			const { b64UserIdHash } = await import("../../search/DbFacade.js")
			const userId = storage.getUserId()
			indexedDB.deleteDatabase(b64UserIdHash(userId))
		}
	},
}
