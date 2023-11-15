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
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"

/** the single source of truth for this configuration */
const SUPPORTED_MODES = [CredentialEncryptionMode.DEVICE_LOCK, CredentialEncryptionMode.APP_PIN] as const
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

	async decryptUsingKeychain(data: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		// making extra sure that the mode is the right one since this comes over IPC
		this.assertSupportedEncryptionMode(encryptionMode)
		data = await this.maybeDecryptUsingAppPin(data, encryptionMode)
		const credentialsKey = await this.desktopKeyStoreFacade.getCredentialsKey()
		data = this.crypto.aes256DecryptKey(credentialsKey, data)
		return data
	}

	async encryptUsingKeychain(data: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		// making extra sure that the mode is the right one since this comes over IPC
		this.assertSupportedEncryptionMode(encryptionMode)
		const credentialsKey = await this.desktopKeyStoreFacade.getCredentialsKey()
		data = this.crypto.aes256EncryptKey(credentialsKey, data)
		data = await this.maybeEncryptUsingAppPin(data, encryptionMode)
		return data
	}

	private async maybeDecryptUsingAppPin(data: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		if (encryptionMode === CredentialEncryptionMode.APP_PIN) {
			const appPinKey = await this.resolveKeyFromAppPin(false)
			if (appPinKey == null) {
				// there is no salt, so someone might have turned off app pin in the meantime.
				// if we actually have pin-encrypted credentials and just lost the salt, we
				// will get a decryption failure and delete the credentials further up the stack.
				return data
			}
			try {
				data = this.crypto.aesDecryptBytes(appPinKey, data)
			} catch (e) {
				if (e instanceof CryptoError) {
					const nativeFacade = await this.getCurrentCommonNativeFacade()
					nativeFacade.showAlertDialog("invalidPassword_msg")
					throw new CancelledError("app pin verification failed")
				} else {
					throw e
				}
			}
			return data
		} else {
			// our mode is not app pin, so the app pin should not be set.
			// this is technically not required because we're deleting it when
			// encrypting with another mode, but things might have gone wrong.
			await this.conf.setVar(DesktopConfigKey.appPinSalt, null)
			return data
		}
	}

	private async maybeEncryptUsingAppPin(data: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		if (encryptionMode === CredentialEncryptionMode.APP_PIN) {
			const appPinKey = await this.resolveKeyFromAppPin(true)
			if (appPinKey == null) {
				throw new ProgrammingError("we should have generated a new key or thrown a CancelledErrorq")
			}
			data = this.crypto.aesEncryptBytes(appPinKey, data)
			return data
		} else {
			// our mode is not app pin, so the app pin salt should not be set
			await this.conf.setVar(DesktopConfigKey.appPinSalt, null)
			return data
		}
	}

	/**
	 * if there is a salt stored, use it and a password prompt to derive the app pin key.
	 * if there isn't, ask for a new password, generate a salt & store it, then derive the key.
	 * @param generate whether to generate a new key if no salt is found
	 * @return the derived 256 bit key or null if none is found and generate is false
	 */
	private async resolveKeyFromAppPin(generate: boolean): Promise<Aes256Key | null> {
		const storedAppPinSaltB64 = await this.conf.getVar(DesktopConfigKey.appPinSalt)
		const commonNativeFacade = await this.getCurrentCommonNativeFacade()
		if (storedAppPinSaltB64 == null) {
			if (!generate) {
				return null
			}
			const newSalt = this.crypto.randomBytes(KEY_LENGTH_BYTES_AES_256)
			const newPw = await commonNativeFacade.promptForNewPassword(this.lang.get("credentialsEncryptionModeAppPin_label"), null)
			const newAppPinSaltB64 = uint8ArrayToBase64(newSalt)
			await this.conf.setVar(DesktopConfigKey.appPinSalt, newAppPinSaltB64)
			return generateKeyFromPassphraseArgon2id(await this.argon2idFacade, newPw, newSalt)
		} else {
			const pw = await commonNativeFacade.promptForPassword(this.lang.get("credentialsEncryptionModeAppPin_label"))
			const salt = base64ToUint8Array(storedAppPinSaltB64)
			return generateKeyFromPassphraseArgon2id(await this.argon2idFacade, pw, salt)
		}
	}

	async getSupportedEncryptionModes(): Promise<Array<DesktopCredentialsMode>> {
		return SUPPORTED_MODES.slice()
	}

	private assertSupportedEncryptionMode(encryptionMode: DesktopCredentialsMode) {
		assert(SUPPORTED_MODES.includes(encryptionMode), `should not use unsupported encryption mode ${encryptionMode}`)
	}
}
