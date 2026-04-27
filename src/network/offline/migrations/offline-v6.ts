import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "@tutao/native-bridge/common"
import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { isBrowser, Mode } from "@tutao/app-env"

/**
 * indexedDB index is no longer needed once migrated to offline storage index
 */
export const offline6: OfflineMigration = {
	version: 6,
	async migrate(storage: OfflineStorage, _: SqlCipherFacade): Promise<void> {
		if (!isBrowser() && !(env.mode === Mode.Admin)) {
			const { uint8ArrayToBase64, stringToUtf8Uint8Array } = await import("@tutao/utils")
			const { sha256Hash } = await import("@tutao/crypto")
			const userId = storage.getUserId()
			const userIdAsDbName = uint8ArrayToBase64(sha256Hash(stringToUtf8Uint8Array(userId)))
			indexedDB.deleteDatabase(userIdAsDbName)
		}
	},
}
