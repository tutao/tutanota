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

	async decryptUsingKeychain(data: Uint8Array, encryptionMode: CredentialEncryptionMode.DEVICE_LOCK): Promise<Uint8Array> {
		// making extra sure that the mode is the right one since this comes over IPC
		assert(encryptionMode === CredentialEncryptionMode.DEVICE_LOCK, "should not use unsupported encryption mode")
		const key = await this._desktopKeyStoreFacade.getCredentialsKey()
		const decryptedData = this._crypto.aes256DecryptKey(key, data)
		return Promise.resolve(decryptedData)
	}

	async encryptUsingKeychain(data: Uint8Array, encryptionMode: CredentialEncryptionMode.DEVICE_LOCK): Promise<Uint8Array> {
		// making extra sure that the mode is the right one since this comes over IPC
		assert(encryptionMode === CredentialEncryptionMode.DEVICE_LOCK, "should not use unsupported encryption mode")
		const key = await this._desktopKeyStoreFacade.getCredentialsKey()
		const encryptedData = this._crypto.aes256EncryptKey(key, data)
		return Promise.resolve(encryptedData)
	}

	getSupportedEncryptionModes(): Promise<Array<CredentialEncryptionMode>> {
		return Promise.resolve([CredentialEncryptionMode.DEVICE_LOCK])
	}

}