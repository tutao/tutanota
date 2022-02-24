import type {SecretStorage} from "./sse/SecretStorage"
import {DesktopCryptoFacade} from "./DesktopCryptoFacade"
import {log} from "./DesktopLog"
import {getFromMap} from "@tutao/tutanota-utils"
import {base64ToKey, keyToBase64} from "@tutao/tutanota-crypto"
import {DeviceStorageUnavailableError} from "../api/common/error/DeviceStorageUnavailableError.js"
import {CancelledError} from "../api/common/error/CancelledError"

interface NativeKeySpec {
	/**
	 * This is supposed to be internet service but this is what is usually presented to the user (at least mac os does this).
	 * One would thing that this would group all the things but in reality permissions are set per-account anyway.
	 */
	readonly serviceName: string
	/** This is supposed to be account name but this is usually not shown. */
	readonly accountName: string
	/** Whether we want to cache the key in memory */
	readonly cached: boolean
}

export const DeviceKeySpec: NativeKeySpec = Object.freeze({
	serviceName: "tutanota-vault",
	accountName: "tuta",
	cached: true,
})

export const CredentialsKeySpec: NativeKeySpec = Object.freeze({
	serviceName: "tutanota-credentials",
	accountName: "tutanota-credentials",
	// Credentials key should not be cached, we should ask it every time we operate on credentials (there's already intermediate in web to avoid asking
	// too many times)
	cached: false
})

/** Interface for accessing/generating/caching keys. */
export interface DesktopKeyStoreFacade {
	/**
	 * get the key used to encrypt alarms and settings
	 */
	getDeviceKey(): Promise<Aes256Key>

	/**
	 * get the key used to encrypt saved credentials
	 */
	getCredentialsKey(): Promise<Aes256Key>
}

export class KeyStoreFacadeImpl implements DesktopKeyStoreFacade {
	private readonly resolvedKeys: Map<NativeKeySpec, Promise<Aes256Key>> = new Map()

	constructor(
		private readonly secretStorage: SecretStorage,
		private readonly crypto: DesktopCryptoFacade
	) {
	}

	/** @inheritDoc */
	async getDeviceKey(): Promise<Aes256Key> {
		// Device key can be cached
		return this.resolveKey(DeviceKeySpec)
	}

	/** @inheritDoc */
	async getCredentialsKey(): Promise<Aes256Key> {
		return this.resolveKey(CredentialsKeySpec)
	}

	private resolveKey(spec: NativeKeySpec): Promise<Aes256Key> {
		// Asking for the same key in parallel easily breaks keytar/gnome-keyring so we cache the promise.
		const entry = getFromMap(this.resolvedKeys, spec, () => this.fetchOrGenerateKey(spec))

		if (spec.cached) {
			// We only want to cache *successful* promises, otherwise we have no chance to retry.
			return entry.catch((e) => {
				this.resolvedKeys.delete(spec)
				throw e
			})
		} else {
			// If we don't want to cache the key we remove it in any case.
			return entry.finally(() => {
				this.resolvedKeys.delete(spec)
			})
		}
	}

	private async fetchOrGenerateKey(spec: NativeKeySpec): Promise<Aes256Key> {
		log.debug("resolving key...", spec.serviceName)
		try {
			return (await this.fetchKey(spec)) ?? (await this.generateAndStoreKey(spec))
		} catch (e) {
			log.warn("Failed to resolve/generate key: ", spec.serviceName, e)
			if (e instanceof CancelledError) {
				throw e
			}
			throw new DeviceStorageUnavailableError("failed to resolve/generate key", e)
		}
	}

	private async fetchKey(spec: NativeKeySpec): Promise<Aes256Key | null> {
		const base64 = await this.secretStorage.getPassword(spec.serviceName, spec.accountName)
		return base64 == null ? null : base64ToKey(base64)
	}

	private async generateAndStoreKey(spec: NativeKeySpec): Promise<Aes256Key> {
		log.warn(`key ${spec.serviceName} not found, generating a new one`)

		const key: Aes256Key = this.crypto.generateDeviceKey()

		await this.secretStorage.setPassword(spec.serviceName, spec.accountName, keyToBase64(key))
		return key
	}
}