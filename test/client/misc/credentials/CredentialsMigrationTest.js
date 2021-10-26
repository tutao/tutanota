// @flow
import o from "ospec"
import {CredentialsMigration} from "../../../../src/misc/credentials/CredentialsMigration"
import {DeviceConfig} from "../../../../src/misc/DeviceConfig"
import type {DeviceEncryptionFacade} from "../../../../src/api/worker/facades/DeviceEncryptionFacade"
import n from "../../nodemocker"
import type {PersistentCredentials} from "../../../../src/misc/credentials/CredentialsProvider"
import {CredentialEncryptionMode} from "../../../../src/misc/credentials/CredentialEncryptionMode"
import {stringToUtf8Uint8Array, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {NativeWrapper} from "../../../../src/native/common/NativeWrapper"

o.spec("CredentialsMigrationTest", function () {
	let encryptionKey: Uint8Array
	const encryptedKey = new Uint8Array([8, 5, 1, 2])
	let storedCredentials: Array<PersistentCredentials>
	let deviceConfig: DeviceConfig
	let deviceEncryptionFacade: DeviceEncryptionFacade
	let credentialsMigration: CredentialsMigration
	let nativeApp: NativeWrapper
	let storedCredentialsEncryptionKey

	o.beforeEach(function () {
		deviceConfig = n.mock("", {
			loadAll() {
				return storedCredentials
			},
			setCredentialsEncryptionKey() {

			},
			store() {

			},
			getCredentialsEncryptionKey() {
				return storedCredentialsEncryptionKey
			},
			setCredentialEncryptionMode() {

			}
		}).set()
		deviceEncryptionFacade = n.mock("", {
			async generateKey(): Promise<Uint8Array> {
				return encryptionKey
			},
			async encrypt(key: Uint8Array, data: Uint8Array) {
				return data.slice().reverse()
			},
		}).set()
		nativeApp = n.mock("", {
			async invokeNative(request) {
				return uint8ArrayToBase64(encryptedKey)
			}
		}).set()

		credentialsMigration = new CredentialsMigration(deviceConfig, deviceEncryptionFacade, nativeApp)
	})

	o("Should not crash if no credentials are stored", async function () {
		storedCredentials = []

		await credentialsMigration.migrateCredentials()
	})

	o("Should not do anything, if encryption key exists", async function () {
		storedCredentialsEncryptionKey = "something"

		await credentialsMigration.migrateCredentials()

		o(deviceEncryptionFacade.generateKey.callCount).equals(0)
		o(deviceEncryptionFacade.encrypt.callCount).equals(0)
		o(nativeApp.invokeNative.callCount).equals(0)
		o(deviceConfig.setCredentialsEncryptionKey.callCount).equals(0)
		o(deviceConfig.store.callCount).equals(0)
	})

	o("Should migrate credentials", async function () {
		const internalCredentials = {
			credentialInfo: {
				login: "internal@example.org",
				userId: "internalId",
				type: "internal"
			},
			accessToken: "asarashfasdfkala",
			encryptedPassword: "jwqeopirsafldx"
		}
		const externalCredentials = {
			credentialInfo: {
				login: "external@example.org",
				userId: "externalId",
				type: "external"
			},
			accessToken: "dGVzdFRoaXNCc09tZw==",
			encryptedPassword: "as;elkr32jr-jfje"
		}

		storedCredentialsEncryptionKey = null
		encryptionKey = new Uint8Array([1, 2, 5, 8])
		storedCredentials = [internalCredentials, externalCredentials]

		await credentialsMigration.migrateCredentials()

		o(deviceEncryptionFacade.encrypt.callCount).equals(2)
		o(Array.from(deviceEncryptionFacade.encrypt.calls[0].args[0])).deepEquals(Array.from(encryptionKey))
		o(Array.from(deviceEncryptionFacade.encrypt.calls[0].args[1])).deepEquals(Array.from(stringToUtf8Uint8Array(internalCredentials.accessToken)))

		o(Array.from(deviceEncryptionFacade.encrypt.calls[1].args[0])).deepEquals(Array.from(encryptionKey))
		o(Array.from(deviceEncryptionFacade.encrypt.calls[1].args[1])).deepEquals(Array.from(stringToUtf8Uint8Array(externalCredentials.accessToken)))

		const request = nativeApp.invokeNative.args[0]
		o(request.args).deepEquals([
			CredentialEncryptionMode.DEVICE_LOCK,
			uint8ArrayToBase64(encryptionKey),
		])

		o(Array.from(deviceConfig.setCredentialsEncryptionKey.args[0])).deepEquals(Array.from(encryptedKey))
		o(deviceConfig.setCredentialEncryptionMode.args[0]).equals(CredentialEncryptionMode.DEVICE_LOCK)

		o(deviceConfig.store.callCount).equals(2)
		o(deviceConfig.store.calls[0].args[0]).deepEquals({
			credentialInfo: internalCredentials.credentialInfo,
			accessToken: uint8ArrayToBase64(stringToUtf8Uint8Array(internalCredentials.accessToken).reverse()),
			encryptedPassword: internalCredentials.encryptedPassword
		})

		o(deviceConfig.store.calls[1].args[0]).deepEquals({
			credentialInfo: externalCredentials.credentialInfo,
			accessToken: uint8ArrayToBase64(stringToUtf8Uint8Array(externalCredentials.accessToken).reverse()),
			encryptedPassword: externalCredentials.encryptedPassword
		})
	})
})