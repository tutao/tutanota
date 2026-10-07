//@bundleInto:common

import type { DeviceEncryptionFacade } from "./DeviceEncryptionFacade"
import { isNotNull, Nullable } from "@tutao/lang-api"

/**
 * Factory for generating an offline storage database key
 * Will return null whenever offline storage is not available
 */
export class DatabaseKeyFactory {
	constructor(private crypto: Nullable<DeviceEncryptionFacade>) {}

	async generateKey(): Promise<Uint8Array<ArrayBuffer> | null> {
		return isNotNull(this.crypto) ? this.crypto.generateKey() : null
	}
}
