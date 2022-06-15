import {CredentialEncryptionMode} from "../../misc/credentials/CredentialEncryptionMode"
import {DesktopKeyStoreFacade} from "../KeyStoreFacadeImpl"
import {DesktopNativeCryptoFacade} from "../DesktopNativeCryptoFacade"
import {assert} from "@tutao/tutanota-utils"
import {NativeCredentialsFacade} from "../../native/common/generatedipc/NativeCredentialsFacade.js"


export class DesktopNativeCredentialsFacade implements NativeCredentialsFacade {

	private readonly _desktopKeyStoreFacade: DesktopKeyStoreFacade
	private readonly _crypto: DesktopNativeCryptoFacade

	constructor(keyStoreFacade: DesktopKeyStoreFacade, crypto: DesktopNativeCryptoFacade) {
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

export class NativeCredentialsFacadeStub implements NativeCredentialsFacade {
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