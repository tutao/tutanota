//@bundleInto:common

import type { DeviceEncryptionFacade } from "./DeviceEncryptionFacade"
import { EnvProvider } from "@tutao/app-env"

/**
 * Factory for generating an offline storage database key
 * Will return null whenever offline storage is not available
 */
export class DatabaseKeyFactory {
	constructor(private crypto: DeviceEncryptionFacade) {}

	async generateKey(): Promise<Uint8Array<ArrayBuffer> | null> {
		return !EnvProvider.get().isBrowser() && !EnvProvider.get().isAdminClient() ? this.crypto.generateKey() : null
	}
}
