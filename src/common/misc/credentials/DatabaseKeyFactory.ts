//@bundleInto:common

import type { DeviceEncryptionFacade } from "../../api/worker/facades/DeviceEncryptionFacade"
import { isOfflineStorageAvailable } from "../../api/common/Env"

/**
 * Factory for generating an offline storage database key
 * Will return null whenever offline storage is not available
 */
export class DatabaseKeyFactory {
	constructor(private crypto: DeviceEncryptionFacade) {}

	async generateKey(): Promise<Uint8Array | null> {
		return isOfflineStorageAvailable() ? this.crypto.generateKey() : null
	}
}
