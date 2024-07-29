import { CredentialEncryptionMode } from "../../misc/credentials/CredentialEncryptionMode.js"
import { DesktopConfigKey } from "../config/ConfigKeys.js"
import { Aes256Key, Argon2IDExports, generateKeyFromPassphraseArgon2id, KEY_LENGTH_BYTES_AES_256 } from "@tutao/tutanota-crypto"
import { base64ToUint8Array, Thunk, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { KeyPermanentlyInvalidatedError } from "../../api/common/error/KeyPermanentlyInvalidatedError.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { CancelledError } from "../../api/common/error/CancelledError.js"
import { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade.js"
import { DesktopConfig } from "../config/DesktopConfig.js"
import { CommonNativeFacade } from "../../native/common/generatedipc/CommonNativeFacade.js"
import { LanguageViewModel } from "../../misc/LanguageViewModel.js"
import { DesktopCredentialsMode } from "./CredentialCommons.js"

export class AppPassHandler {
	constructor(
		private readonly crypto: DesktopNativeCryptoFacade,
		private readonly conf: DesktopConfig,
		private readonly argon2idFacade: Promise<Argon2IDExports>,
		private readonly lang: LanguageViewModel,
		private readonly getCurrentCommonNativeFacade: () => Promise<CommonNativeFacade>,
	) {}

	async addAppPassWrapper(dataWithoutAppPassWrapper: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
		if (encryptionMode === CredentialEncryptionMode.APP_PASSWORD) {
			const appPassKey = (await this.deriveKeyFromAppPass()) ?? (await this.enrollForAppPass())
			return this.crypto.aesEncryptBytes(appPassKey, dataWithoutAppPassWrapper)
		} else {
			// our mode is not app Pass, so the app Pass salt should not be set
			await this.conf.setVar(DesktopConfigKey.appPassSalt, null)
			return dataWithoutAppPassWrapper
		}
	}

	async removeAppPassWrapper(dataWithAppPassWrapper: Uint8Array, encryptionMode: DesktopCredentialsMode): Promise<Uint8Array> {
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

	/**
	 * if there is a salt stored, use it and a password prompt to derive the app Pass key.
	 * if there isn't, ask for a new password, generate a salt & store it, then derive the key.
	 * @return the derived 256-bit key or null if none is found
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
