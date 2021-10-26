// @flow
import type {CredentialsEncryption, PersistentCredentials} from "./CredentialsProvider"
import type {ICredentialsKeyProvider} from "./CredentialsKeyProvider"
import type {DeviceEncryptionFacade} from "../../api/worker/facades/DeviceEncryptionFacade"
import type {NativeWrapper} from "../../native/common/NativeWrapper"
import {base64ToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString} from "@tutao/tutanota-utils"
import type {CredentialEncryptionModeEnum} from "./CredentialEncryptionMode"
import {Request} from "../../api/common/WorkerProtocol"
import type {Credentials} from "./Credentials"

/**
 * Credentials encryption implementation that uses the native (platform-specific) keychain implementation. It uses an intermediate key to
 * encrypt the credentials stored on the device. The intermediate key in turn is encrypted using the native keychain.
 */
export class NativeCredentialsEncryption implements CredentialsEncryption {
	+_credentialsKeyProvider: ICredentialsKeyProvider
	+_deviceEncryptionFacade: DeviceEncryptionFacade
	+_nativeApp: NativeWrapper;

	constructor(credentialsKeyProvider: ICredentialsKeyProvider, deviceEncryptionFacade: DeviceEncryptionFacade, nativeApp: NativeWrapper) {
		this._credentialsKeyProvider = credentialsKeyProvider
		this._deviceEncryptionFacade = deviceEncryptionFacade
		this._nativeApp = nativeApp
	}

	async encrypt(credentials: Credentials): Promise<PersistentCredentials> {
		const {encryptedPassword} = credentials
		if (encryptedPassword == null) {
			throw new Error("Trying to encrypt non-persistent credentials")
		}
		const credentialsKey = await this._credentialsKeyProvider.getCredentialsKey()
		const base64accessToken = stringToUtf8Uint8Array(credentials.accessToken)
		const encryptedAccessToken = await this._deviceEncryptionFacade.encrypt(credentialsKey, base64accessToken)
		const encryptedAccessTokenBase64 = uint8ArrayToBase64(encryptedAccessToken)
		return {
			credentialInfo: {
				login: credentials.login,
				userId: credentials.userId,
				type: credentials.type,
			},
			encryptedPassword,
			accessToken: encryptedAccessTokenBase64,
		}
	}

	async decrypt(encryptedCredentials: PersistentCredentials): Promise<Credentials> {
		const credentialsKey = await this._credentialsKeyProvider.getCredentialsKey()
		const decryptedAccessToken = await this._deviceEncryptionFacade.decrypt(credentialsKey, base64ToUint8Array(encryptedCredentials.accessToken))
		const accessToken = utf8Uint8ArrayToString(decryptedAccessToken)
		return {
			login: encryptedCredentials.credentialInfo.login,
			userId: encryptedCredentials.credentialInfo.userId,
			type: encryptedCredentials.credentialInfo.type,
			encryptedPassword: encryptedCredentials.encryptedPassword,
			accessToken,
		}
	}

	async getSupportedEncryptionModes(): Promise<Array<CredentialEncryptionModeEnum>> {
		return this._nativeApp.invokeNative(new Request("getSupportedEncryptionModes", []))
	}
}

