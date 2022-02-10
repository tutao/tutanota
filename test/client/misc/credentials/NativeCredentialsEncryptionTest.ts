import o from "ospec"
import {NativeCredentialsEncryption} from "../../../../src/misc/credentials/NativeCredentialsEncryption.js"
import {ICredentialsKeyProvider} from "../../../../src/misc/credentials/CredentialsKeyProvider.js"
import type {DeviceEncryptionFacade} from "../../../../src/api/worker/facades/DeviceEncryptionFacade.js"
import n from "../../nodemocker.js"
import {stringToUtf8Uint8Array, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import type {CredentialsAndDatabaseKey, PersistentCredentials} from "../../../../src/misc/credentials/CredentialsProvider.js"
import type {NativeInterface} from "../../../../src/native/common/NativeInterface.js"
import {assertThrows} from "@tutao/tutanota-test-utils"
import {KeyPermanentlyInvalidatedError} from "../../../../src/api/common/error/KeyPermanentlyInvalidatedError.js"
import {CryptoError} from "../../../../src/api/common/error/CryptoError.js"

//TODO test databasekey encryption
o.spec("NativeCredentialsEncryptionTest", function () {
	const credentialsKey = new Uint8Array([1, 2, 3])
	let credentialsKeyProvider: ICredentialsKeyProvider
	let deviceEncryptionFacade: DeviceEncryptionFacade
	let encryption: NativeCredentialsEncryption
	let nativeApp: NativeInterface
	o.beforeEach(function () {
		credentialsKeyProvider = n.mock<ICredentialsKeyProvider>("omg delete me", {
			async getCredentialsKey() {
				return credentialsKey
			}
		}).set()
		deviceEncryptionFacade = n.mock<DeviceEncryptionFacade>("and me too!", {
			async encrypt(deviceKey, data) {
				return data
			},
			async decrypt(deviceKey, encryptedData) {
				return encryptedData
			},
		}).set()
		nativeApp = n.mock<NativeInterface>("calabunga!", {
			async invokeNative() {
				return []
			}
		}).set()
		encryption = new NativeCredentialsEncryption(credentialsKeyProvider, deviceEncryptionFacade, nativeApp)
	})

	o.spec("encrypt", function () {
		o("produces encrypted credentials", async function () {
			const credentials: CredentialsAndDatabaseKey = {
				credentials: {
					login: "test@example.com",
					userId: "myUserId1",
					type: "internal",
					encryptedPassword: "123456789",
					accessToken: "someAccessToken",
				},
				databaseKey: null
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
				databaseKey: null
			})
			o(Array.from(deviceEncryptionFacade.encrypt.args[0])).deepEquals(Array.from(credentialsKey))
			o(Array.from(deviceEncryptionFacade.encrypt.args[1])).deepEquals(Array.from(stringToUtf8Uint8Array("someAccessToken")))
		})
	})

	o.spec("decrypt", function () {
		o("produced decrypted credentials", async function () {
			const encryptedCredentials: PersistentCredentials = {
				credentialInfo: {
					login: "test@example.com",
					userId: "myUserId1",
					type: "internal",
				},
				encryptedPassword: "123456789",
				accessToken: uint8ArrayToBase64(stringToUtf8Uint8Array("someAccessToken")),
				databaseKey: null
			}
			const decryptedCredentials = await encryption.decrypt(encryptedCredentials)
			o(decryptedCredentials).deepEquals({
				credentials: {
					login: "test@example.com",
					userId: "myUserId1",
					type: "internal",
					encryptedPassword: "123456789",
					accessToken: "someAccessToken",
				},
				databaseKey: null
			})
			o(Array.from(deviceEncryptionFacade.decrypt.args[0])).deepEquals(Array.from(credentialsKey))
			o(Array.from(deviceEncryptionFacade.decrypt.args[1])).deepEquals(Array.from(stringToUtf8Uint8Array("someAccessToken")))
		})

		o("crypto error is treated as invalid key", async function () {
			const encryptedCredentials: PersistentCredentials = {
				credentialInfo: {
					login: "test@example.com",
					userId: "myUserId1",
					type: "internal",
				},
				encryptedPassword: "123456789",
				accessToken: uint8ArrayToBase64(stringToUtf8Uint8Array("someAccessToken")),
				databaseKey: null
			}
			deviceEncryptionFacade.decrypt = () => {
				return Promise.reject(new CryptoError("TEST"))
			}

			await assertThrows(KeyPermanentlyInvalidatedError, () => encryption.decrypt(encryptedCredentials))
		})
	})
})