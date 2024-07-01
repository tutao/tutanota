import o from "@tutao/otest"
import { KeychainEncryption } from "../../../../src/common/desktop/credentials/KeychainEncryption.js"
import { object, when } from "testdouble"
import { AppPassHandler } from "../../../../src/common/desktop/credentials/AppPassHandler.js"
import { DesktopNativeCryptoFacade } from "../../../../src/common/desktop/DesktopNativeCryptoFacade.js"
import { DesktopKeyStoreFacade } from "../../../../src/common/desktop/DesktopKeyStoreFacade.js"
import { CredentialEncryptionMode } from "../../../../src/common/misc/credentials/CredentialEncryptionMode.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { KeyPermanentlyInvalidatedError } from "../../../../src/common/api/common/error/KeyPermanentlyInvalidatedError.js"

o.spec("KeychainEncryption", () => {
	let encryption: KeychainEncryption
	const appPassHandler: AppPassHandler = object()
	const crypto: DesktopNativeCryptoFacade = object()
	const keystore: DesktopKeyStoreFacade = object()
	const unencryptedData = new Uint8Array([0x0d, 0x0a, 0x07, 0x0a])
	const encryptedData = new Uint8Array([0x0e, 0x04, 0x0c, 0x01, 0x03])
	const wrappedData = new Uint8Array([0x03, 0x01, 0x03, 0x0a, 0x07, 0x07, 0x0e, 0x0d])
	const keychainKey = [0x02, 0x0e, 0x04, 0x0c, 0x04, 0x0a, 0x01, 0x04]

	o.beforeEach(() => {
		encryption = new KeychainEncryption(appPassHandler, crypto, keystore)
	})

	o.test("encryptUsingKeychain", async () => {
		when(keystore.getKeyChainKey()).thenResolve(keychainKey)
		when(crypto.aes256EncryptKey(keychainKey, unencryptedData)).thenReturn(encryptedData)
		when(appPassHandler.addAppPassWrapper(encryptedData, CredentialEncryptionMode.DEVICE_LOCK)).thenResolve(wrappedData)
		const result = await encryption.encryptUsingKeychain(unencryptedData, CredentialEncryptionMode.DEVICE_LOCK)
		o(result).deepEquals(wrappedData)
	})

	o.test("decryptUsingKeychain", async () => {
		when(appPassHandler.removeAppPassWrapper(wrappedData, CredentialEncryptionMode.DEVICE_LOCK)).thenResolve(encryptedData)
		when(keystore.getKeyChainKey()).thenResolve(keychainKey)
		when(crypto.unauthenticatedAes256DecryptKey(keychainKey, encryptedData)).thenReturn(unencryptedData)

		const result = await encryption.decryptUsingKeychain(wrappedData, CredentialEncryptionMode.DEVICE_LOCK)
		o(result).deepEquals(unencryptedData)
	})

	o.test("when decrypt fails it throws correct error", async () => {
		when(keystore.getKeyChainKey()).thenResolve(keychainKey)
		when(appPassHandler.removeAppPassWrapper(wrappedData, CredentialEncryptionMode.DEVICE_LOCK)).thenResolve(encryptedData)
		when(crypto.unauthenticatedAes256DecryptKey(keychainKey, encryptedData)).thenThrow(new CryptoError("test"))

		await o(() => encryption.decryptUsingKeychain(wrappedData, CredentialEncryptionMode.DEVICE_LOCK)).asyncThrows(KeyPermanentlyInvalidatedError)
	})
})
