import o from "@tutao/otest"
import { KeychainEncryption } from "../../../../src/applications/common/desktop/credentials/KeychainEncryption.js"
import { object, when } from "testdouble"
import { AppPassHandler } from "../../../../src/applications/common/desktop/credentials/AppPassHandler.js"
import { DesktopNativeCryptoFacade } from "../../../../src/applications/common/desktop/DesktopNativeCryptoFacade.js"
import { DesktopKeyStoreFacade } from "../../../../src/applications/common/desktop/DesktopKeyStoreFacade.js"
import { CryptoError } from "../../../../src/platform-kit/crypto/error"
import { KeyPermanentlyInvalidatedError } from "../../../../src/applications/common/api/common/error/KeyPermanentlyInvalidatedError.js"
import { aes256RandomKey } from "../../../../src/platform-kit/crypto"
import { CredentialEncryptionMode } from "../../../../src/platform-kit/app-env"

o.spec("KeychainEncryption", () => {
	let encryption: KeychainEncryption
	const appPassHandler: AppPassHandler = object()
	const crypto: DesktopNativeCryptoFacade = object()
	const keystore: DesktopKeyStoreFacade = object()
	const unencryptedKey = aes256RandomKey()
	const encryptedData = new Uint8Array([0x0e, 0x04, 0x0c, 0x01, 0x03])
	const wrappedData = new Uint8Array([0x03, 0x01, 0x03, 0x0a, 0x07, 0x07, 0x0e, 0x0d])
	const keychainKey = [0x02, 0x0e, 0x04, 0x0c, 0x04, 0x0a, 0x01, 0x04]

	o.beforeEach(() => {
		encryption = new KeychainEncryption(appPassHandler, crypto, keystore)
	})

	o.test("encryptKeyUsingKeychain", async () => {
		when(keystore.getKeyChainKey()).thenResolve(keychainKey)
		when(crypto.aes256EncryptKey(keychainKey, unencryptedKey)).thenReturn(encryptedData)
		when(appPassHandler.addAppPassWrapper(encryptedData, CredentialEncryptionMode.DEVICE_LOCK)).thenResolve(wrappedData)
		const result = await encryption.encrypKeyUsingKeychain(unencryptedKey, CredentialEncryptionMode.DEVICE_LOCK)
		o(result).deepEquals(wrappedData)
	})

	o.test("decryptKeyUsingKeychain", async () => {
		when(appPassHandler.removeAppPassWrapper(wrappedData, CredentialEncryptionMode.DEVICE_LOCK)).thenResolve(encryptedData)
		when(keystore.getKeyChainKey()).thenResolve(keychainKey)
		when(crypto.decryptKeyUnauthenticatedWithDeviceKeyChain(keychainKey, encryptedData)).thenReturn(unencryptedKey)

		const result = await encryption.decryptUsingKeychain(wrappedData, CredentialEncryptionMode.DEVICE_LOCK)
		o(result).deepEquals(unencryptedKey)
	})

	o.test("when decrypt fails it throws correct error", async () => {
		when(keystore.getKeyChainKey()).thenResolve(keychainKey)
		when(appPassHandler.removeAppPassWrapper(wrappedData, CredentialEncryptionMode.DEVICE_LOCK)).thenResolve(encryptedData)
		when(crypto.decryptKeyUnauthenticatedWithDeviceKeyChain(keychainKey, encryptedData)).thenThrow(new CryptoError("test"))

		await o(() => encryption.decryptUsingKeychain(wrappedData, CredentialEncryptionMode.DEVICE_LOCK)).asyncThrows(KeyPermanentlyInvalidatedError)
	})
})
