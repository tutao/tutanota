import o from "ospec"
import {CredentialsKeyProvider} from "../../../../src/misc/credentials/CredentialsKeyProvider"
import n from "../../nodemocker"
import {CredentialEncryptionMode} from "../../../../src/misc/credentials/CredentialEncryptionMode"
import type {DeviceEncryptionFacade} from "../../../../src/api/worker/facades/DeviceEncryptionFacade"
import {uint8ArrayToBase64} from "@tutao/tutanota-utils"
import type {CredentialsStorage} from "../../../../src/misc/credentials/CredentialsProvider"
import type {NativeInterface} from "../../../../src/native/common/NativeInterface"

o.spec("CredentialsKeyProviderTest", function () {
	let credentialEncryptionMode: CredentialEncryptionMode
	let encryptedCredentialsKey: Uint8Array | null
	const generatedKey = new Uint8Array([1, 2, 3])

	let credentialsProvider: CredentialsKeyProvider
	let nativeWrapper: NativeInterface
	let credentialsStorage: CredentialsStorage
	let deviceEncryptionFacade: DeviceEncryptionFacade

	o.beforeEach(function () {
		credentialEncryptionMode = CredentialEncryptionMode.DEVICE_LOCK
		encryptedCredentialsKey = null

		nativeWrapper = n.mock<NativeInterface>("aaaaa", {
			async invokeNative(request) {
				if (request.requestType === "decryptUsingKeychain") {
					const credentialsKey = request.args[1]
					return credentialsKey
				} else if (request.requestType === "encryptUsingKeychain") {
					const credentialsKey = request.args[1]
					return credentialsKey
				} else {
					throw new Error("stub!")
				}
			}
		}).set()
		credentialsStorage = n.mock<CredentialsStorage>("baloons", {
			getCredentialsEncryptionKey() {
				return encryptedCredentialsKey
			},
			setCredentialsEncryptionKey() {

			},
			getCredentialEncryptionMode() {
				return credentialEncryptionMode
			}
		}).set()
		deviceEncryptionFacade = n.mock<DeviceEncryptionFacade>("grob", {
			async generateKey() {
				return generatedKey
			}
		}).set()
		credentialsProvider = new CredentialsKeyProvider(nativeWrapper, credentialsStorage, deviceEncryptionFacade)
	})

	o.spec("getCredentialsKey", function () {
		o("if key does exist it shall be decrypted", async function () {
			encryptedCredentialsKey = new Uint8Array([1, 2, 6, 9])
			const key = encryptedCredentialsKey

			const returnedKey = await credentialsProvider.getCredentialsKey()

			o(Array.from(returnedKey)).deepEquals(Array.from(key))

			const request = nativeWrapper.invokeNative.args[0]
			o(request.requestType).equals("decryptUsingKeychain")
			o(request.args).deepEquals([credentialEncryptionMode, uint8ArrayToBase64(key)])
		})

		o("if key does not exist it shall be generated and saved", async function () {
			encryptedCredentialsKey = null

			const returnedKey = await credentialsProvider.getCredentialsKey()

			o(Array.from(returnedKey)).deepEquals(Array.from(generatedKey))

			const request = nativeWrapper.invokeNative.args[0]
			o(request.requestType).equals("encryptUsingKeychain")
			o(request.args).deepEquals([credentialEncryptionMode, uint8ArrayToBase64(generatedKey)])
			o(Array.from(credentialsStorage.setCredentialsEncryptionKey.args[0])).deepEquals(Array.from(generatedKey))
		})
	})
})