import { CredentialEncryptionMode } from "../../misc/credentials/CredentialEncryptionMode"
import { KeyStoreFacade } from "../DesktopKeyStoreFacade.js"
import { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade"
import { assert } from "@tutao/tutanota-utils"
import { NativeCredentialsFacade } from "../../native/common/generatedipc/NativeCredentialsFacade.js"

export class DesktopNativeCredentialsFacade implements NativeCredentialsFacade {
	constructor(private readonly desktopKeyStoreFacade: KeyStoreFacade, private readonly crypto: DesktopNativeCryptoFacade) {}

	async decryptUsingKeychain(data: Uint8Array, encryptionMode: CredentialEncryptionMode.DEVICE_LOCK): Promise<Uint8Array> {
		// making extra sure that the mode is the right one since this comes over IPC
		assert(encryptionMode === CredentialEncryptionMode.DEVICE_LOCK, "should not use unsupported encryption mode")
		const key = await this.desktopKeyStoreFacade.getCredentialsKey()
		return this.crypto.aes256DecryptKey(key, data)
	}

	async encryptUsingKeychain(data: Uint8Array, encryptionMode: CredentialEncryptionMode.DEVICE_LOCK): Promise<Uint8Array> {
		// making extra sure that the mode is the right one since this comes over IPC
		assert(encryptionMode === CredentialEncryptionMode.DEVICE_LOCK, "should not use unsupported encryption mode")
		const key = await this.desktopKeyStoreFacade.getCredentialsKey()
		return this.crypto.aes256EncryptKey(key, data)
	}

	async getSupportedEncryptionModes(): Promise<Array<CredentialEncryptionMode>> {
		return [CredentialEncryptionMode.DEVICE_LOCK]
	}
}
