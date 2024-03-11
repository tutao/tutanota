import type { CredentialsEncryption } from "./CredentialsProvider.js"
import { CredentialsAndDatabaseKey } from "./CredentialsProvider.js"
import type { DeviceEncryptionFacade } from "../../api/worker/facades/DeviceEncryptionFacade"
import { base64ToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import type { CredentialEncryptionMode } from "./CredentialEncryptionMode"
import { KeyPermanentlyInvalidatedError } from "../../api/common/error/KeyPermanentlyInvalidatedError.js"
import { CredentialsKeyProvider } from "./CredentialsKeyProvider.js"
import { NativeCredentialsFacade } from "../../native/common/generatedipc/NativeCredentialsFacade.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { PersistedCredentials } from "../../native/common/generatedipc/PersistedCredentials.js"

/**
 * Credentials encryption implementation that uses the native (platform-specific) keychain implementation. It uses an intermediate key to
 * encrypt the credentials stored on the device. The intermediate key in turn is encrypted using the native keychain.
 */
export class NativeCredentialsEncryption implements CredentialsEncryption {
	constructor(
		private readonly credentialsKeyProvider: CredentialsKeyProvider,
		private readonly deviceEncryptionFacade: DeviceEncryptionFacade,
		private readonly nativeCredentials: NativeCredentialsFacade,
	) {}

	async encrypt({ credentials, databaseKey }: CredentialsAndDatabaseKey): Promise<PersistedCredentials> {
		const { encryptedPassword } = credentials

		if (encryptedPassword == null) {
			throw new Error("Trying to encrypt non-persistent credentials")
		}

		let credentialsKey
		try {
			credentialsKey = await this.credentialsKeyProvider.getCredentialsKey()
		} catch (e) {
			if (e instanceof CryptoError) {
				throw new KeyPermanentlyInvalidatedError(`Could not get credentials key to encrypt credentials ${e.stack || e.message}`)
			} else {
				throw e
			}
		}

		const base64accessToken = stringToUtf8Uint8Array(credentials.accessToken)
		const encryptedAccessToken = await this.deviceEncryptionFacade.encrypt(credentialsKey, base64accessToken)
		const encryptedAccessTokenBase64 = uint8ArrayToBase64(encryptedAccessToken)

		let encryptedDatabaseKeyBase64: string | null = null
		if (databaseKey) {
			const encryptedDatabaseKey = await this.deviceEncryptionFacade.encrypt(credentialsKey, databaseKey)
			encryptedDatabaseKeyBase64 = uint8ArrayToBase64(encryptedDatabaseKey)
		}

		return {
			credentialsInfo: {
				login: credentials.login,
				userId: credentials.userId,
				type: credentials.type,
			},
			encryptedPassword,
			accessToken: encryptedAccessTokenBase64,
			databaseKey: encryptedDatabaseKeyBase64,
		}
	}

	async decrypt(encryptedCredentials: PersistedCredentials): Promise<CredentialsAndDatabaseKey> {
		try {
			const credentialsKey = await this.credentialsKeyProvider.getCredentialsKey()

			const accessToken = utf8Uint8ArrayToString(
				await this.deviceEncryptionFacade.decrypt(credentialsKey, base64ToUint8Array(encryptedCredentials.accessToken)),
			)

			const databaseKey = encryptedCredentials.databaseKey
				? await this.deviceEncryptionFacade.decrypt(credentialsKey, base64ToUint8Array(encryptedCredentials.databaseKey))
				: null

			return {
				credentials: {
					login: encryptedCredentials.credentialsInfo.login,
					userId: encryptedCredentials.credentialsInfo.userId,
					type: encryptedCredentials.credentialsInfo.type,
					encryptedPassword: encryptedCredentials.encryptedPassword,
					accessToken,
				},
				databaseKey,
			}
		} catch (e) {
			if (e instanceof CryptoError) {
				// If the key could not be decrypted it means that something went very wrong. We will probably not be able to do anything about it so just
				// delete everything.
				throw new KeyPermanentlyInvalidatedError(`Could not decrypt credentials: ${e.stack ?? e.message}`)
			} else {
				throw e
			}
		}
	}

	async getSupportedEncryptionModes(): Promise<ReadonlyArray<CredentialEncryptionMode>> {
		return this.nativeCredentials.getSupportedEncryptionModes()
	}
}
