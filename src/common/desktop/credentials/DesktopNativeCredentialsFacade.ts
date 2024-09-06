import { CredentialEncryptionMode } from "../../misc/credentials/CredentialEncryptionMode.js"
import { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade"
import { stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { NativeCredentialsFacade } from "../../native/common/generatedipc/NativeCredentialsFacade.js"
import { bitArrayToUint8Array, uint8ArrayToBitArray } from "@tutao/tutanota-crypto"
import { KeyPermanentlyInvalidatedError } from "../../api/common/error/KeyPermanentlyInvalidatedError.js"
import { PersistedCredentials } from "../../native/common/generatedipc/PersistedCredentials.js"
import { DesktopCredentialsStorage } from "../db/DesktopCredentialsStorage.js"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { assertDesktopEncryptionMode, assertSupportedEncryptionMode, DesktopCredentialsMode, SUPPORTED_MODES } from "./CredentialCommons.js"
import { KeychainEncryption } from "./KeychainEncryption.js"
import { BitArray } from "@tutao/tutanota-crypto"

/**
 * Native storage will transparently encrypt and decrypt database key and access token during load and store calls.
 */
export class DesktopNativeCredentialsFacade implements NativeCredentialsFacade {
	constructor(
		private readonly crypto: DesktopNativeCryptoFacade,
		private readonly credentialDb: DesktopCredentialsStorage,
		private readonly keychainEncryption: KeychainEncryption,
	) {}

	async getSupportedEncryptionModes(): Promise<ReadonlyArray<DesktopCredentialsMode>> {
		return SUPPORTED_MODES
	}

	async deleteByUserId(id: string): Promise<void> {
		this.credentialDb.deleteByUserId(id)
	}

	async getCredentialEncryptionMode(): Promise<CredentialEncryptionMode | null> {
		return this.credentialDb.getCredentialEncryptionMode()
	}

	private getDesktopCredentialEncryptionMode(): DesktopCredentialsMode | null {
		const retVal = this.credentialDb.getCredentialEncryptionMode()
		return retVal ? CredentialEncryptionMode[retVal as DesktopCredentialsMode] : null
	}

	async loadAll(): Promise<ReadonlyArray<PersistedCredentials>> {
		return this.credentialDb.getAllCredentials()
	}

	async loadByUserId(id: string): Promise<UnencryptedCredentials | null> {
		const credentialsKey = await this.getCredentialsEncryptionKey()
		if (credentialsKey == null) {
			throw new KeyPermanentlyInvalidatedError("Credentials key is missing, cannot decrypt credentials")
		}
		const encryptedCredentials = this.credentialDb.getCredentialsByUserId(id)
		return encryptedCredentials ? this.decryptCredentials(encryptedCredentials, credentialsKey) : null
	}

	private decryptCredentials(persistedCredentials: PersistedCredentials, credentialsKey: BitArray): UnencryptedCredentials {
		try {
			return {
				credentialInfo: persistedCredentials.credentialInfo,
				encryptedPassword: persistedCredentials.encryptedPassword,
				accessToken: utf8Uint8ArrayToString(this.crypto.aesDecryptBytes(credentialsKey, persistedCredentials.accessToken)),
				databaseKey: persistedCredentials.databaseKey ? this.crypto.aesDecryptBytes(credentialsKey, persistedCredentials.databaseKey) : null,
				encryptedPassphraseKey: persistedCredentials.encryptedPassphraseKey,
			}
		} catch (e) {
			throw new KeyPermanentlyInvalidatedError("Failed AES decrypt: " + e)
		}
	}

	private encryptCredentials(unencryptedCredentials: UnencryptedCredentials, credentialsEncryptionKey: BitArray): PersistedCredentials {
		return {
			credentialInfo: unencryptedCredentials.credentialInfo,
			accessToken: this.crypto.aesEncryptBytes(credentialsEncryptionKey, stringToUtf8Uint8Array(unencryptedCredentials.accessToken)),
			databaseKey: unencryptedCredentials.databaseKey ? this.crypto.aesEncryptBytes(credentialsEncryptionKey, unencryptedCredentials.databaseKey) : null,
			encryptedPassphraseKey: unencryptedCredentials.encryptedPassphraseKey,
			encryptedPassword: unencryptedCredentials.encryptedPassword,
		}
	}

	async setCredentialEncryptionMode(encryptionMode: CredentialEncryptionMode): Promise<void> {
		assertDesktopEncryptionMode(encryptionMode)
		const decryptedKey = await this.getOrCreateCredentialEncryptionKey()
		const encryptedKey = await this.keychainEncryption.encryptUsingKeychain(bitArrayToUint8Array(decryptedKey), encryptionMode)
		this.credentialDb.setCredentialEncryptionMode(encryptionMode)
		this.credentialDb.setCredentialEncryptionKey(encryptedKey)
	}

	async store(credentials: UnencryptedCredentials): Promise<void> {
		const credentialsEncryptionKey = await this.getOrCreateCredentialEncryptionKey()
		const encryptedCredentials: PersistedCredentials = this.encryptCredentials(credentials, credentialsEncryptionKey)
		return this.storeEncrypted(encryptedCredentials)
	}

	async clear(): Promise<void> {
		this.credentialDb.deleteAllCredentials()
		this.credentialDb.setCredentialEncryptionKey(null)
		this.credentialDb.setCredentialEncryptionMode(null)
	}

	async migrateToNativeCredentials(credentials: ReadonlyArray<PersistedCredentials>, encryptionMode: CredentialEncryptionMode, credentialsKey: Uint8Array) {
		// store persistedCredentials, key & mode
		assertSupportedEncryptionMode(encryptionMode as DesktopCredentialsMode)
		this.credentialDb.setCredentialEncryptionMode(encryptionMode)
		this.credentialDb.setCredentialEncryptionKey(credentialsKey)
		for (const credential of credentials) {
			await this.storeEncrypted(credential)
		}
	}

	async storeEncrypted(credentials: PersistedCredentials): Promise<void> {
		this.credentialDb.store(credentials)
	}

	private async getOrCreateCredentialEncryptionKey(): Promise<BitArray> {
		const existingKey = await this.getCredentialsEncryptionKey()
		if (existingKey != null) {
			return existingKey
		} else {
			const encryptionMode = this.getDesktopCredentialEncryptionMode() ?? CredentialEncryptionMode.DEVICE_LOCK
			const newKey = bitArrayToUint8Array(this.crypto.generateDeviceKey())
			const encryptedKey = await this.keychainEncryption.encryptUsingKeychain(newKey, encryptionMode)
			this.credentialDb.setCredentialEncryptionKey(encryptedKey)
			return uint8ArrayToBitArray(newKey)
		}
	}

	private async getCredentialsEncryptionKey(): Promise<BitArray | null> {
		const encryptionMode = this.getDesktopCredentialEncryptionMode() ?? CredentialEncryptionMode.DEVICE_LOCK
		const keyChainEncCredentialsKey = this.credentialDb.getCredentialEncryptionKey()
		if (keyChainEncCredentialsKey != null) {
			const credentialsKey = await this.keychainEncryption.decryptUsingKeychain(keyChainEncCredentialsKey, encryptionMode)
			return uint8ArrayToBitArray(credentialsKey)
		} else {
			return null
		}
	}
}
