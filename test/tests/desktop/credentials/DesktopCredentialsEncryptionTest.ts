import o from "@tutao/otest"

import { DesktopNativeCredentialsFacade } from "../../../../src/desktop/credentials/DesktopNativeCredentialsFacade.js"
import { DesktopNativeCryptoFacade } from "../../../../src/desktop/DesktopNativeCryptoFacade.js"
import { CredentialEncryptionMode } from "../../../../src/misc/credentials/CredentialEncryptionMode.js"
import { makeKeyStoreFacade } from "../../TestUtils.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { NativeCredentialsFacade } from "../../../../src/native/common/generatedipc/NativeCredentialsFacade.js"
import { object } from "testdouble"
import { Argon2idFacade } from "../../../../src/api/worker/facades/Argon2idFacade.js"
import { LanguageViewModel } from "../../../../src/misc/LanguageViewModel.js"
import { DesktopConfig } from "../../../../src/desktop/config/DesktopConfig.js"

o.spec("DesktopCredentialsEncryption Test", () => {
	const key = new Uint8Array([1, 2, 3])
	const keyStoreFacade = makeKeyStoreFacade(key)

	const getSubject = (): NativeCredentialsFacade => {
		const crypto: DesktopNativeCryptoFacade = object()
		const argon2: Argon2idFacade = object()
		const lang: LanguageViewModel = object()
		const conf: DesktopConfig = object()

		return new DesktopNativeCredentialsFacade(keyStoreFacade, crypto, argon2, lang, conf, () => object())
	}
	o("throws when using wrong encryption mode", async function () {
		const ece = getSubject()
		// @ts-ignore
		await assertThrows(Error, () => ece.decryptUsingKeychain("base64", CredentialEncryptionMode.BIOMETRICS))
		// @ts-ignore
		await assertThrows(Error, () => ece.decryptUsingKeychain("base64", CredentialEncryptionMode.SYSTEM_PASSWORD))
		// @ts-ignore
		await assertThrows(Error, () => ece.encryptUsingKeychain("base64", CredentialEncryptionMode.BIOMETRICS))
		// @ts-ignore
		await assertThrows(Error, () => ece.encryptUsingKeychain("base64", CredentialEncryptionMode.SYSTEM_PASSWORD))
	})
})
