import o from "ospec"
import {CredentialsKeyProvider} from "../../../../src/misc/credentials/CredentialsKeyProvider.js"
import {CredentialEncryptionMode} from "../../../../src/misc/credentials/CredentialEncryptionMode.js"
import type {DeviceEncryptionFacade} from "../../../../src/api/worker/facades/DeviceEncryptionFacade.js"
import {concat} from "@tutao/tutanota-utils"
import type {CredentialsStorage} from "../../../../src/misc/credentials/CredentialsProvider.js"
import {NativeCredentialsFacade} from "../../../../src/native/common/generatedipc/NativeCredentialsFacade.js"
import {object, when} from "testdouble"
import {verify} from "@tutao/tutanota-test-utils"

o.spec("CredentialsKeyProviderTest", function () {
	let credentialEncryptionMode: CredentialEncryptionMode
	const generatedKey = new Uint8Array([1, 2, 3])

	let credentialsProvider: CredentialsKeyProvider
	let credentialsStorage: CredentialsStorage
	let deviceEncryptionFacade: DeviceEncryptionFacade
	let nativeCredentialsFacade: NativeCredentialsFacade

	o.beforeEach(function () {
		credentialEncryptionMode = CredentialEncryptionMode.DEVICE_LOCK

		nativeCredentialsFacade = object()

		credentialsStorage = object()
		when(credentialsStorage.getCredentialEncryptionMode()).thenReturn(credentialEncryptionMode)

		deviceEncryptionFacade = object()
		when(deviceEncryptionFacade.generateKey()).thenResolve(generatedKey)

		credentialsProvider = new CredentialsKeyProvider(nativeCredentialsFacade, credentialsStorage, deviceEncryptionFacade)
	})

	o.spec("getCredentialsKey", function () {
		o("if key does exist it shall be decrypted", async function () {
			const encryptedCredentialsKey = new Uint8Array([1, 2, 6, 9])
			when(credentialsStorage.getCredentialsEncryptionKey()).thenReturn(encryptedCredentialsKey)
			const decryptedKey = concat(encryptedCredentialsKey, new Uint8Array([1]))
			when(nativeCredentialsFacade.decryptUsingKeychain(encryptedCredentialsKey, credentialEncryptionMode))
				.thenResolve(decryptedKey)

			const returnedKey = await credentialsProvider.getCredentialsKey()

			o(Array.from(returnedKey)).deepEquals(Array.from(decryptedKey))
		})

		o("if key does not exist it shall be generated, encrypted and saved", async function () {
			when(credentialsStorage.getCredentialsEncryptionKey()).thenReturn(null)
			const encryptedGeneratedKey = concat(generatedKey, new Uint8Array([2]))
			when(nativeCredentialsFacade.encryptUsingKeychain(generatedKey, credentialEncryptionMode))
				.thenResolve(encryptedGeneratedKey)

			const returnedKey = await credentialsProvider.getCredentialsKey()

			o(Array.from(returnedKey))
				.deepEquals(Array.from(generatedKey))("Returns unencrypted generated key")

			verify(credentialsStorage.setCredentialsEncryptionKey(encryptedGeneratedKey))
		})
	})
})