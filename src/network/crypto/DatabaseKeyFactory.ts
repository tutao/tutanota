//@bundleInto:common

import type { DeviceEncryptionFacade } from "./facades/DeviceEncryptionFacade"
import { isAdminClient, isBrowser, Mode } from "@tutao/app-env"

/**
 * Factory for generating an offline storage database key
 * Will return null whenever offline storage is not available
 */
export class DatabaseKeyFactory {
	constructor(private crypto: DeviceEncryptionFacade) {}

	async generateKey(): Promise<Uint8Array | null> {
		return !isBrowser() && !isAdminClient() ? this.crypto.generateKey() : null
	}
}
