import { isAdminClient, isBrowser } from "../../../platform-kit/app-env"
import { OfflineStorage } from "../OfflineStorage"
import { OfflineMigration } from "../OfflineMigration"

/**
 * indexedDB index is no longer needed once migrated to offline storage index
 */
const VERSION = 6
export class offline6 extends OfflineMigration {
	constructor() {
		super(VERSION)
	}
	async migrate(storage: OfflineStorage): Promise<void> {
		if (!isBrowser() && !isAdminClient()) {
			const { uint8ArrayToBase64, stringToUtf8Uint8Array } = await import("../../../platform-kit/utils")
			const { sha256Hash } = await import("../../../platform-kit/crypto")
			const userId = storage.getUserId()
			const userIdAsDbName = uint8ArrayToBase64(sha256Hash(stringToUtf8Uint8Array(userId)))
			indexedDB.deleteDatabase(userIdAsDbName)
		}
	}
}
