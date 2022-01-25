import o from "ospec"
import n from "../../nodemocker"

import {ElectronCredentialsEncryptionImpl} from "../../../../src/desktop/credentials/ElectronCredentialsEncryption"
import {DesktopDeviceKeyProvider} from "../../../../src/desktop/DeviceKeyProviderImpl"
import {DesktopCryptoFacade} from "../../../../src/desktop/DesktopCryptoFacade"
import {CredentialEncryptionMode} from "../../../../src/misc/credentials/CredentialEncryptionMode"
import {makeDeviceKeyProvider} from "../../../api/TestUtils"
import {assertThrows} from "@tutao/tutanota-test-utils"
import {ProgrammingError} from "../../../../src/api/common/error/ProgrammingError"

o.spec("ElectronCredentialsEncryption Test", () => {
	const crypto = {
		aes256DecryptKeyToB64: (key, b64keyToEncrypt) => "decryptedB64Key",
		aes256EncryptKeyToB64: (key, b64KeyToDecrypt) => "encryptedB64Key",
	}
	const key = new Uint8Array([1, 2, 3])
	const deviceKeyProvider = makeDeviceKeyProvider(key)

	const getSubject = (): ElectronCredentialsEncryptionImpl => new ElectronCredentialsEncryptionImpl(
		n.mock<DesktopDeviceKeyProvider>("__deviceKeyProvider", deviceKeyProvider).set(),
		n.mock<DesktopCryptoFacade>("__crypto", crypto).set()
	)

	o("throws when using wrong encryption mode", async function () {
		const ece = getSubject()
		await assertThrows(ProgrammingError, () => ece.decryptUsingKeychain("base64", CredentialEncryptionMode.BIOMETRICS))
		await assertThrows(ProgrammingError, () => ece.decryptUsingKeychain("base64", CredentialEncryptionMode.SYSTEM_PASSWORD))
		await assertThrows(ProgrammingError, () => ece.encryptUsingKeychain("base64", CredentialEncryptionMode.BIOMETRICS))
		await assertThrows(ProgrammingError, () => ece.encryptUsingKeychain("base64", CredentialEncryptionMode.SYSTEM_PASSWORD))
	})
})