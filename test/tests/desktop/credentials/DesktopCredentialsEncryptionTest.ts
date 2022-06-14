import o from "ospec"
import n from "../../nodemocker.js"

import {DesktopCredentialsEncryptionImpl} from "../../../../src/desktop/credentials/DektopCredentialsEncryption.js"
import {DesktopKeyStoreFacade} from "../../../../src/desktop/KeyStoreFacadeImpl.js"
import {DesktopNativeCryptoFacade} from "../../../../src/desktop/DesktopNativeCryptoFacade.js"
import {CredentialEncryptionMode} from "../../../../src/misc/credentials/CredentialEncryptionMode.js"
import {makeKeyStoreFacade} from "../../TestUtils.js"
import {assertThrows} from "@tutao/tutanota-test-utils"

o.spec("DesktopCredentialsEncryption Test", () => {
	const crypto = {
		aes256DecryptKeyToB64: (key, b64keyToEncrypt) => "decryptedB64Key",
		aes256EncryptKeyToB64: (key, b64KeyToDecrypt) => "encryptedB64Key",
	}
	const key = new Uint8Array([1, 2, 3])
	const keyStoreFacade = makeKeyStoreFacade(key)

	const getSubject = (): DesktopCredentialsEncryptionImpl => new DesktopCredentialsEncryptionImpl(
		n.mock<DesktopKeyStoreFacade>("__keyStoreFacade", keyStoreFacade).set(),
		n.mock<DesktopNativeCryptoFacade>("__crypto", crypto).set()
	)

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