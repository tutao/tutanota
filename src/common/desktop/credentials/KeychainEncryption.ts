import { KeyPermanentlyInvalidatedError } from "../../api/common/error/KeyPermanentlyInvalidatedError.js"
import { assertSupportedEncryptionMode, DesktopCredentialsMode } from "./CredentialCommons.js"
import { DesktopKeyStoreFacade } from "../DesktopKeyStoreFacade.js"
import { AppPassHandler } from "./AppPassHandler.js"
import { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"

export class KeychainEncryption {
	constructor(
		private readonly appPassHandler: AppPassHandler,
		private readonly crypto: DesktopNativeCryptoFacade,
		private readonly desktopKeyStoreFacade: DesktopKeyStoreFacade,
	) {}

	async decryptUsingKeychain(encryptedDataWithAppPassWrapper: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		try {
			assertSupportedEncryptionMode(encryptionMode)
			const encryptedData = await this.appPassHandler.removeAppPassWrapper(encryptedDataWithAppPassWrapper, encryptionMode)
			const keyChainKey = await this.desktopKeyStoreFacade.getKeyChainKey()
			return this.crypto.unauthenticatedAes256DecryptKey(keyChainKey, encryptedData)
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

	async encryptUsingKeychain(data: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		try {
			assertSupportedEncryptionMode(encryptionMode)
			const keyChainKey = await this.desktopKeyStoreFacade.getKeyChainKey()
			const encryptedData = this.crypto.aes256EncryptKey(keyChainKey, data)
			return this.appPassHandler.addAppPassWrapper(encryptedData, encryptionMode)
		} catch (e) {
			if (e instanceof CryptoError) {
				// If the key could not be decrypted it means that something went very wrong. We will probably not be able to do anything about it so just
				// delete everything.
				throw new KeyPermanentlyInvalidatedError(`Could not encrypt credentials: ${e.stack ?? e.message}`)
			} else {
				throw e
			}
		}
	}
}
