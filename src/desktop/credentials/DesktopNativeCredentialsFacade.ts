import { CredentialEncryptionMode } from "../../misc/credentials/CredentialEncryptionMode"
import { DesktopKeyStoreFacade } from "../DesktopKeyStoreFacade.js"
import { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade"
import { assert, base64ToUint8Array, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { NativeCredentialsFacade } from "../../native/common/generatedipc/NativeCredentialsFacade.js"
import { CommonNativeFacade } from "../../native/common/generatedipc/CommonNativeFacade.js"
import { LanguageViewModel } from "../../misc/LanguageViewModel.js"
import { DesktopConfig } from "../config/DesktopConfig.js"
import { DesktopConfigKey } from "../config/ConfigKeys.js"
import { KEY_LENGTH_BYTES_AES_256 } from "@tutao/tutanota-crypto/dist/encryption/Aes.js"
import { CryptoError, generateKeyFromPassphraseArgon2id } from "@tutao/tutanota-crypto"
import { CancelledError } from "../../api/common/error/CancelledError.js"

/** the single source of truth for this configuration */
const SUPPORTED_MODES = Object.freeze([CredentialEncryptionMode.DEVICE_LOCK, CredentialEncryptionMode.APP_PIN] as const)
export type DesktopCredentialsMode = typeof SUPPORTED_MODES[number]

/**
 *
 */
export class DesktopNativeCredentialsFacade implements NativeCredentialsFacade {
	/**
	 * @param desktopKeyStoreFacade
	 * @param crypto
	 * @param argon2idFacade
	 * @param lang
	 * @param conf
	 * @param getCurrentCommonNativeFacade a "factory" that returns the commonNativeFacade for the window that would be most suited to serve a given request
	 */
	constructor(
		private readonly desktopKeyStoreFacade: DesktopKeyStoreFacade,
		private readonly crypto: DesktopNativeCryptoFacade,
		private readonly argon2idFacade: Promise<WebAssembly.Exports>,
		private readonly lang: LanguageViewModel,
		private readonly conf: DesktopConfig,
		private readonly getCurrentCommonNativeFacade: () => Promise<CommonNativeFacade>,
	) {}

	async decryptUsingKeychain(encryptedDataWithAppPinWrapper: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		// making extra sure that the mode is the right one since this comes over IPC
		this.assertSupportedEncryptionMode(encryptionMode)
		const encryptedData = await this.removeAppPinWrapper(encryptedDataWithAppPinWrapper, encryptionMode)
		const credentialsKey = await this.desktopKeyStoreFacade.getCredentialsKey()
		return this.crypto.aes256DecryptKey(credentialsKey, encryptedData)
	}

	async encryptUsingKeychain(data: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		// making extra sure that the mode is the right one since this comes over IPC
		this.assertSupportedEncryptionMode(encryptionMode)
		const credentialsKey = await this.desktopKeyStoreFacade.getCredentialsKey()
		const encryptedData = this.crypto.aes256EncryptKey(credentialsKey, data)
		return this.addAppPinWrapper(encryptedData, encryptionMode)
	}

	private async removeAppPinWrapper(dataWithAppPinWrapper: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		// our mode is not app pin, so there is no wrapper to remove
		if (encryptionMode !== CredentialEncryptionMode.APP_PIN) return dataWithAppPinWrapper
		const appPinKey = await this.deriveKeyFromAppPin()
		// if there is no salt, some other window might have turned off app pin
		// between us entering this function and the user entering their pin.
		// if we actually have pin-encrypted credentials and just lost the salt, we
		// will get a decryption failure and delete the credentials further up the stack.
		if (appPinKey == null) return dataWithAppPinWrapper

		try {
			return this.crypto.aesDecryptBytes(appPinKey, dataWithAppPinWrapper)
		} catch (e) {
			if (e instanceof CryptoError) {
				const nativeFacade = await this.getCurrentCommonNativeFacade()
				//noinspection ES6MissingAwait
				nativeFacade.showAlertDialog("invalidPassword_msg")
				throw new CancelledError("app pin verification failed")
			} else {
				throw e
			}
		}
	}

	private async addAppPinWrapper(dataWithoutAppPinWrapper: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		if (encryptionMode === CredentialEncryptionMode.APP_PIN) {
			const appPinKey = (await this.deriveKeyFromAppPin()) ?? (await this.enrollForAppPin())
			return this.crypto.aesEncryptBytes(appPinKey, dataWithoutAppPinWrapper)
		} else {
			// our mode is not app pin, so the app pin salt should not be set
			await this.conf.setVar(DesktopConfigKey.appPinSalt, null)
			return dataWithoutAppPinWrapper
		}
	}

	/**
	 * if there is a salt stored, use it and a password prompt to derive the app pin key.
	 * if there isn't, ask for a new password, generate a salt & store it, then derive the key.
	 * @return the derived 256 bit key or null if none is found
	 */
	private async deriveKeyFromAppPin(): Promise<Aes256Key | null> {
		const storedAppPinSaltB64 = await this.conf.getVar(DesktopConfigKey.appPinSalt)
		if (storedAppPinSaltB64 == null) return null
		const commonNativeFacade = await this.getCurrentCommonNativeFacade()
		const pw = await commonNativeFacade.promptForPassword(this.lang.get("credentialsEncryptionModeAppPin_label"))
		const salt = base64ToUint8Array(storedAppPinSaltB64)
		return generateKeyFromPassphraseArgon2id(await this.argon2idFacade, pw, salt)
	}

	private async enrollForAppPin(): Promise<Aes256Key> {
		const newSalt = this.crypto.randomBytes(KEY_LENGTH_BYTES_AES_256)
		const commonNativeFacade = await this.getCurrentCommonNativeFacade()
		const newPw = await commonNativeFacade.promptForNewPassword(this.lang.get("credentialsEncryptionModeAppPin_label"), null)
		const newAppPinSaltB64 = uint8ArrayToBase64(newSalt)
		await this.conf.setVar(DesktopConfigKey.appPinSalt, newAppPinSaltB64)
		return generateKeyFromPassphraseArgon2id(await this.argon2idFacade, newPw, newSalt)
	}

	async getSupportedEncryptionModes(): Promise<ReadonlyArray<DesktopCredentialsMode>> {
		return SUPPORTED_MODES
	}

	private assertSupportedEncryptionMode(encryptionMode: DesktopCredentialsMode) {
		assert(SUPPORTED_MODES.includes(encryptionMode), `should not use unsupported encryption mode ${encryptionMode}`)
	}
}
