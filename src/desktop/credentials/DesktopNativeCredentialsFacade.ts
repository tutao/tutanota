import { CredentialEncryptionMode } from "../../misc/credentials/CredentialEncryptionMode"
import { DesktopKeyStoreFacade } from "../DesktopKeyStoreFacade.js"
import { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade"
import { assert, base64ToUint8Array, Thunk, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { NativeCredentialsFacade } from "../../native/common/generatedipc/NativeCredentialsFacade.js"
import { CommonNativeFacade } from "../../native/common/generatedipc/CommonNativeFacade.js"
import { LanguageViewModel } from "../../misc/LanguageViewModel.js"
import { DesktopConfig } from "../config/DesktopConfig.js"
import { DesktopConfigKey } from "../config/ConfigKeys.js"
import { KEY_LENGTH_BYTES_AES_256 } from "@tutao/tutanota-crypto/dist/encryption/Aes.js"
import { CryptoError, generateKeyFromPassphraseArgon2id } from "@tutao/tutanota-crypto"
import { CancelledError } from "../../api/common/error/CancelledError.js"
import { KeyPermanentlyInvalidatedError } from "../../api/common/error/KeyPermanentlyInvalidatedError.js"

/** the single source of truth for this configuration */
const SUPPORTED_MODES = Object.freeze([CredentialEncryptionMode.DEVICE_LOCK, CredentialEncryptionMode.APP_PASSWORD] as const)
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

	async decryptUsingKeychain(encryptedDataWithAppPassWrapper: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		// making extra sure that the mode is the right one since this comes over IPC
		this.assertSupportedEncryptionMode(encryptionMode)
		const encryptedData = await this.removeAppPassWrapper(encryptedDataWithAppPassWrapper, encryptionMode)
		const credentialsKey = await this.desktopKeyStoreFacade.getCredentialsKey()
		return this.crypto.aes256DecryptKey(credentialsKey, encryptedData)
	}

	async encryptUsingKeychain(data: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		// making extra sure that the mode is the right one since this comes over IPC
		this.assertSupportedEncryptionMode(encryptionMode)
		const credentialsKey = await this.desktopKeyStoreFacade.getCredentialsKey()
		const encryptedData = this.crypto.aes256EncryptKey(credentialsKey, data)
		return this.addAppPassWrapper(encryptedData, encryptionMode)
	}

	private async removeAppPassWrapper(dataWithAppPassWrapper: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		// our mode is not app Pass, so there is no wrapper to remove
		if (encryptionMode !== CredentialEncryptionMode.APP_PASSWORD) return dataWithAppPassWrapper
		const appPassKey = await this.deriveKeyFromAppPass()
		if (appPassKey == null) throw new KeyPermanentlyInvalidatedError("can't remove app pass wrapper without salt")

		try {
			return this.crypto.aesDecryptBytes(appPassKey, dataWithAppPassWrapper)
		} catch (e) {
			if (e instanceof CryptoError) {
				const nativeFacade = await this.getCurrentCommonNativeFacade()
				//noinspection ES6MissingAwait
				nativeFacade.showAlertDialog("invalidPassword_msg")
				throw new CancelledError("app Pass verification failed")
			} else {
				throw e
			}
		}
	}

	private async addAppPassWrapper(dataWithoutAppPassWrapper: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		if (encryptionMode === CredentialEncryptionMode.APP_PASSWORD) {
			const appPassKey = (await this.deriveKeyFromAppPass()) ?? (await this.enrollForAppPass())
			return this.crypto.aesEncryptBytes(appPassKey, dataWithoutAppPassWrapper)
		} else {
			// our mode is not app Pass, so the app Pass salt should not be set
			await this.conf.setVar(DesktopConfigKey.appPassSalt, null)
			return dataWithoutAppPassWrapper
		}
	}

	/**
	 * if there is a salt stored, use it and a password prompt to derive the app Pass key.
	 * if there isn't, ask for a new password, generate a salt & store it, then derive the key.
	 * @return the derived 256 bit key or null if none is found
	 */
	private async deriveKeyFromAppPass(): Promise<Aes256Key | null> {
		const storedAppPassSaltB64 = await this.conf.getVar(DesktopConfigKey.appPassSalt)
		if (storedAppPassSaltB64 == null) return null
		const commonNativeFacade = await this.getCurrentCommonNativeFacade()
		const pw = await this.tryWhileSaltNotChanged(commonNativeFacade.promptForPassword(this.lang.get("credentialsEncryptionModeAppPassword_label")))
		const salt = base64ToUint8Array(storedAppPassSaltB64)
		return generateKeyFromPassphraseArgon2id(await this.argon2idFacade, pw, salt)
	}

	private async enrollForAppPass(): Promise<Aes256Key> {
		const newSalt = this.crypto.randomBytes(KEY_LENGTH_BYTES_AES_256)
		const commonNativeFacade = await this.getCurrentCommonNativeFacade()
		const newPw = await this.tryWhileSaltNotChanged(
			commonNativeFacade.promptForNewPassword(this.lang.get("credentialsEncryptionModeAppPassword_label"), null),
		)
		const newAppPassSaltB64 = uint8ArrayToBase64(newSalt)
		await this.conf.setVar(DesktopConfigKey.appPassSalt, newAppPassSaltB64)
		return generateKeyFromPassphraseArgon2id(await this.argon2idFacade, newPw, newSalt)
	}

	private async tryWhileSaltNotChanged(pwPromise: Promise<string>): Promise<string> {
		const commonNativeFacade = await this.getCurrentCommonNativeFacade()
		return resolveChecked<string>(
			pwPromise,
			new Promise((_, reject) =>
				this.conf.once(DesktopConfigKey.appPassSalt, () => {
					reject(new CancelledError("salt changed during pw prompt"))
				}),
			),
			() => commonNativeFacade.showAlertDialog("retry_action"),
		)
	}

	async getSupportedEncryptionModes(): Promise<ReadonlyArray<DesktopCredentialsMode>> {
		return SUPPORTED_MODES
	}

	private assertSupportedEncryptionMode(encryptionMode: DesktopCredentialsMode) {
		assert(SUPPORTED_MODES.includes(encryptionMode), `should not use unsupported encryption mode ${encryptionMode}`)
	}
}

/**
 * resolve a promise, but inject another action if whileNot did reject in the meantime.
 * if whileNot did reject, the returned promise will reject as well.
 */
export async function resolveChecked<R>(promise: Promise<R>, whileNotRejected: Promise<never>, otherWiseAlso: Thunk): Promise<R> {
	let cancelled = false
	return await Promise.race<R>([
		promise.then((value) => {
			if (cancelled) otherWiseAlso()
			return value
		}),
		whileNotRejected.catch((e) => {
			cancelled = true
			throw e
		}),
	])
}
