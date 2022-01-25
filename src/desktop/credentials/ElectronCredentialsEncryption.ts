import {CredentialEncryptionMode} from "../../misc/credentials/CredentialEncryptionMode"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"
import {DesktopDeviceKeyProvider} from "../DeviceKeyProviderImpl"
import {DesktopCryptoFacade} from "../DesktopCryptoFacade"

export interface ElectronCredentialsEncryption {
	/**
	 * Decrypts arbitrary data using keychain keys, prompting for authentication if needed.
	 */
	decryptUsingKeychain(base64EncodedEncryptedData: string, encryptionMode: CredentialEncryptionMode): Promise<string>

	/**
	 * Encrypts arbitrary data using keychain keys, prompting for authentication if needed.
	 */
	encryptUsingKeychain(base64EncodedData: string, encryptionMode: CredentialEncryptionMode): Promise<string>

	getSupportedEncryptionModes(): Promise<Array<CredentialEncryptionMode>>

}

export class ElectronCredentialsEncryptionImpl implements ElectronCredentialsEncryption {

	private readonly _desktopDeviceKeyProvider: DesktopDeviceKeyProvider
	private readonly _crypto: DesktopCryptoFacade

	constructor(deviceKeyProvider: DesktopDeviceKeyProvider, crypto: DesktopCryptoFacade) {
		this._desktopDeviceKeyProvider = deviceKeyProvider
		this._crypto = crypto
	}

	async decryptUsingKeychain(base64EncodedEncryptedData: string, encryptionMode: CredentialEncryptionMode): Promise<string> {
		if (encryptionMode !== CredentialEncryptionMode.DEVICE_LOCK) {
			throw new ProgrammingError("should not use unsupported encryption mode")
		}
		const key = await this._desktopDeviceKeyProvider.getCredentialsKey()
		const decryptedData = this._crypto.aes256DecryptKeyToB64(key, base64EncodedEncryptedData)
		return Promise.resolve(decryptedData)
	}

	async encryptUsingKeychain(base64EncodedData: string, encryptionMode: CredentialEncryptionMode): Promise<string> {
		if (encryptionMode !== CredentialEncryptionMode.DEVICE_LOCK) {
			throw new ProgrammingError("should not use unsupported encryption mode")
		}
		const key = await this._desktopDeviceKeyProvider.getCredentialsKey()
		const encryptedData = this._crypto.aes256EncryptKeyToB64(key, base64EncodedData)
		return Promise.resolve(encryptedData)
	}

	getSupportedEncryptionModes(): Promise<Array<CredentialEncryptionMode>> {
		return Promise.resolve([CredentialEncryptionMode.DEVICE_LOCK])
	}

}

export class ElectronCredentialsEncryptionStub implements ElectronCredentialsEncryption {
	decryptUsingKeychain(base64EncodedEncryptedData: string, encryptionMode: CredentialEncryptionMode): Promise<string> {
		return Promise.resolve(base64EncodedEncryptedData)
	}

	encryptUsingKeychain(base64EncodedData: string, encryptionMode: CredentialEncryptionMode): Promise<string> {
		return Promise.resolve(base64EncodedData)
	}

	getSupportedEncryptionModes(): Promise<Array<CredentialEncryptionMode>> {
		return Promise.resolve([CredentialEncryptionMode.DEVICE_LOCK])
	}
}