// @flow
import o from "ospec"
import {NativeCredentialsEncryption} from "../../../../src/misc/credentials/NativeCredentialsEncryption"
import {ICredentialsKeyProvider} from "../../../../src/misc/credentials/CredentialsKeyProvider"
import type {DeviceEncryptionFacade} from "../../../../src/api/worker/facades/DeviceEncryptionFacade"
import n from "../../nodemocker"
import {stringToUtf8Uint8Array, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import type {PersistentCredentials} from "../../../../src/misc/credentials/CredentialsProvider"
import {NativeWrapper} from "../../../../src/native/common/NativeWrapper"
import type {Credentials} from "../../../../src/misc/credentials/Credentials"

o.spec("NativeCredentialsEncryptionTest", function () {
	const credentialsKey = new Uint8Array([1, 2, 3])
	let credentialsKeyProvider: ICredentialsKeyProvider
	let deviceEncryptionFacade: DeviceEncryptionFacade
	let encryption: NativeCredentialsEncryption
	let nativeApp: NativeWrapper
	o.beforeEach(function () {
		credentialsKeyProvider = n.mock("omg delete me", {
			async getCredentialsKey() {
				return credentialsKey
			}
		}).set()
		deviceEncryptionFacade = n.mock("and me too!", {
			encrypt(deviceKey, data) {
				return data
			},
			decrypt(deviceKey, encryptedData) {
				return encryptedData
			},
		}).set()
		nativeApp = n.mock("calabunga!", {
			async invokeNative() {
				return []
			}
		}).set()
		encryption = new NativeCredentialsEncryption(credentialsKeyProvider, deviceEncryptionFacade, nativeApp)
	})

	o.spec("encrypt", function () {
		o("produces encrypted credentials", async function () {
			const credentials: Credentials = {
				login: "test@example.com",
				userId: "myUserId1",
				type: "internal",
				encryptedPassword: "123456789",
				accessToken: "someAccessToken",
			}
			const encryptedCredentials = await encryption.encrypt(credentials)
			o(encryptedCredentials).deepEquals({
				credentialInfo: {
					login: "test@example.com",
					userId: "myUserId1",
					type: "internal",
				},
				encryptedPassword: "123456789",
				accessToken: uint8ArrayToBase64(stringToUtf8Uint8Array("someAccessToken")),
			})
			o(Array.from(deviceEncryptionFacade.encrypt.args[0])).deepEquals(Array.from(credentialsKey))
			o(Array.from(deviceEncryptionFacade.encrypt.args[1])).deepEquals(Array.from(stringToUtf8Uint8Array("someAccessToken")))
		})
	})

	o.spec("decrypt", function() {
		o("produced decrypted credentials", async function() {
			const encryptedCredentials: PersistentCredentials = {
				credentialInfo: {
					login: "test@example.com",
					userId: "myUserId1",
					type: "internal",
				},
				encryptedPassword: "123456789",
				accessToken: uint8ArrayToBase64(stringToUtf8Uint8Array("someAccessToken")),
			}
			const decryptedCredentials = await encryption.decrypt(encryptedCredentials)
			o(decryptedCredentials).deepEquals({
				login: "test@example.com",
				userId: "myUserId1",
				type: "internal",
				encryptedPassword: "123456789",
				accessToken: "someAccessToken",
			})
			o(Array.from(deviceEncryptionFacade.decrypt.args[0])).deepEquals(Array.from(credentialsKey))
			o(Array.from(deviceEncryptionFacade.decrypt.args[1])).deepEquals(Array.from(stringToUtf8Uint8Array("someAccessToken")))
		})
	})
})