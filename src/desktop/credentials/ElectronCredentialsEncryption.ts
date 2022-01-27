import {CredentialEncryptionMode} from "../../misc/credentials/CredentialEncryptionMode"
import {DesktopKeyStoreFacade} from "../KeyStoreFacadeImpl"
import {DesktopCryptoFacade} from "../DesktopCryptoFacade"
import {assert} from "@tutao/tutanota-utils"

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

	private readonly _desktopKeyStoreFacade: DesktopKeyStoreFacade
	private readonly _crypto: DesktopCryptoFacade

	constructor(keyStoreFacade: DesktopKeyStoreFacade, crypto: DesktopCryptoFacade) {
		this._desktopKeyStoreFacade = keyStoreFacade
		this._crypto = crypto
	}

	async decryptUsingKeychain(base64EncodedEncryptedData: string, encryptionMode: CredentialEncryptionMode.DEVICE_LOCK): Promise<string> {
		// making extra sure that the mode is the right one since this comes over IPC
		assert(encryptionMode === CredentialEncryptionMode.DEVICE_LOCK, "should not use unsupported encryption mode")
		const key = await this._desktopKeyStoreFacade.getCredentialsKey()
		const decryptedData = this._crypto.aes256DecryptKeyToB64(key, base64EncodedEncryptedData)
		return Promise.resolve(decryptedData)
	}

	async encryptUsingKeychain(base64EncodedData: string, encryptionMode: CredentialEncryptionMode.DEVICE_LOCK): Promise<string> {
		// making extra sure that the mode is the right one since this comes over IPC
		assert(encryptionMode === CredentialEncryptionMode.DEVICE_LOCK, "should not use unsupported encryption mode")
		const key = await this._desktopKeyStoreFacade.getCredentialsKey()
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