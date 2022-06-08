import type {CredentialEncryptionMode} from "./CredentialEncryptionMode"
import {base64ToUint8Array, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import type {NativeInterface} from "../../native/common/NativeInterface"

/**
 * Interface for credentials key migration. Migration becomes necessary when the encryption mode for a device is changed,
 * which requires re-encrypting the intermediate key used for credential encryption.
 */
export interface ICredentialsKeyMigrator {
	/**
	 * Migrates a credentials key, i.e. decrypts it using {@param oldMode} and re-encrypts it using {@param newMode}.
	 * @param oldKeyEncrypted Key to be migrated (encrypted using {@param oldMode}.
	 * @param oldMode Encryption mode that has been used to encrypt {@param oldKeyEncrypted}.
	 * @param newMode Mode with which the decrypted {@param oldKeyEncrypted} will be re-encrypted.
	 * @returns Migrated (re-encrypted) credentials key.
	 */
	migrateCredentialsKey(oldKeyEncrypted: Uint8Array, oldMode: CredentialEncryptionMode, newMode: CredentialEncryptionMode): Promise<Uint8Array>
}

/**
 * Platform-independent implementation for of ICredentialsKeyMigrator.
 */
export class CredentialsKeyMigrator implements ICredentialsKeyMigrator {
	readonly _nativeApp: NativeInterface

	constructor(nativeApp: NativeInterface) {
		this._nativeApp = nativeApp
	}

	async migrateCredentialsKey(
		oldKeyEncrypted: Uint8Array,
		oldMode: CredentialEncryptionMode,
		newMode: CredentialEncryptionMode,
	): Promise<Uint8Array> {
		const oldKeyDecryptedKeyBase64 = await this._nativeApp.invokeNative("decryptUsingKeychain", [oldMode, uint8ArrayToBase64(oldKeyEncrypted)])
		const newlyEncryptedKeyBase64 = await this._nativeApp.invokeNative("encryptUsingKeychain", [newMode, oldKeyDecryptedKeyBase64])
		return base64ToUint8Array(newlyEncryptedKeyBase64)
	}
}

/**
 * Stub to be used on platforms for which we have not implemented credentials encryption with an intermediate key yet.
 * It will throw an error when called, since no key migration should ever be triggered on platforms that don't support the feature.
 */
export class CredentialsKeyMigratorStub implements ICredentialsKeyMigrator {
	migrateCredentialsKey(oldKeyEncrypted: Uint8Array, oldMode: CredentialEncryptionMode, newMode: CredentialEncryptionMode): Promise<Uint8Array> {
		throw new Error("Should not be used")
	}
}