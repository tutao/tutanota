import o from "ospec"
import {CredentialsKeySpec, DeviceKeySpec, KeyStoreFacadeImpl} from "../../../src/desktop/KeyStoreFacadeImpl"
import {DesktopCryptoFacade} from "../../../src/desktop/DesktopCryptoFacade"
import type {SecretStorage} from "../../../src/desktop/sse/SecretStorage"
import {spyify} from "../nodemocker"
import {downcast} from "@tutao/tutanota-utils"
import {keyToBase64, uint8ArrayToKey} from "@tutao/tutanota-crypto"
import {CancelledError} from "../../../src/api/common/error/CancelledError"
import {assertThrows} from "../../../packages/tutanota-test-utils/lib"

function initKeyStoreFacade(secretStorage: SecretStorage, crypto: DesktopCryptoFacade): KeyStoreFacadeImpl {
	return new KeyStoreFacadeImpl(secretStorage, crypto)
}

o.spec("KeyStoreFacade test", function () {
	const aes256Key = uint8ArrayToKey(new Uint8Array([1, 2]))
	let cryptoFacadeSpy: DesktopCryptoFacade

	o.beforeEach(function () {
		cryptoFacadeSpy = spyify(downcast({}))
	})

	o.spec("getDeviceKey", function ()  {
		o("should return stored key", async function () {
			const secretStorageSpy = spyify<SecretStorage>({
				async getPassword(service: string, account: string): Promise<string | null> {
					return keyToBase64(aes256Key)
				},

				async setPassword(service: string, account: string, password: string): Promise<void> {
				},
			})
			const keyStoreFacade = initKeyStoreFacade(secretStorageSpy, cryptoFacadeSpy)
			const actualKey = await keyStoreFacade.getDeviceKey()
			o(actualKey).deepEquals(aes256Key)
			o(secretStorageSpy.getPassword.callCount).equals(1)
			o(secretStorageSpy.getPassword.calls[0].args).deepEquals([DeviceKeySpec.serviceName,  DeviceKeySpec.accountName])
		})

		o("should store the key", async function () {
			const secretStorageSpy = spyify<SecretStorage>({
				async getPassword(service: string, account: string): Promise<string | null> {
					return null
				},

				async setPassword(service: string, account: string, password: string): Promise<void> {
				},
			})
			cryptoFacadeSpy = downcast<DesktopCryptoFacade>({
				generateDeviceKey() {
					return aes256Key
				},
			})
			const keyStoreFacade = initKeyStoreFacade(secretStorageSpy, cryptoFacadeSpy)
			await keyStoreFacade.getDeviceKey()
			o(secretStorageSpy.setPassword.args).deepEquals([DeviceKeySpec.serviceName, DeviceKeySpec.accountName, keyToBase64(aes256Key)])
		})

		o("should cache successful key fetch", async function () {
			const secretStorageSpy= spyify<SecretStorage>({
				async getPassword(service: string, account: string): Promise<string | null> {
					return keyToBase64(aes256Key)
				},

				async setPassword(service: string, account: string, password: string): Promise<void> {
				},
			})
			const keyStoreFacade = initKeyStoreFacade(secretStorageSpy, cryptoFacadeSpy)
			const actualKey = await keyStoreFacade.getDeviceKey()
			o(actualKey).deepEquals(aes256Key)

			const actualKey2 = await keyStoreFacade.getDeviceKey()
			o(actualKey2).deepEquals(aes256Key)

			o(secretStorageSpy.getPassword.callCount).equals(1)
			o(secretStorageSpy.getPassword.calls[0].args).deepEquals([DeviceKeySpec.serviceName,  DeviceKeySpec.accountName])
		})

		o("should not cache failures", async function () {
			let calls = 0
			const secretStorageSpy= spyify<SecretStorage>({
				async getPassword(service: string, account: string): Promise<string | null> {
					if (calls == 0) {
						calls++
						throw new CancelledError("Test")
					} else {
						calls++
						return keyToBase64(aes256Key)
					}
				},

				async setPassword(service: string, account: string, password: string): Promise<void> {
				},
			})

			const keyStoreFacade = initKeyStoreFacade(secretStorageSpy, cryptoFacadeSpy)
			await assertThrows(CancelledError, () => keyStoreFacade.getDeviceKey())

			const actualKey = await keyStoreFacade.getDeviceKey()
			o(actualKey).deepEquals(aes256Key)

			o(secretStorageSpy.getPassword.callCount).equals(2)
			o(secretStorageSpy.getPassword.calls[1].args).deepEquals([DeviceKeySpec.serviceName,  DeviceKeySpec.accountName])
		})
	})

	o.spec("getCredentialsKey", function () {
		o("should return stored key", async function () {
			const secretStorageSpy = spyify<SecretStorage>({
				async getPassword(service: string, account: string): Promise<string | null> {
					return keyToBase64(aes256Key)
				},

				async setPassword(service: string, account: string, password: string): Promise<void> {
				},
			})
			const keyStoreFacade = initKeyStoreFacade(secretStorageSpy, cryptoFacadeSpy)
			const actualKey = await keyStoreFacade.getCredentialsKey()
			o(actualKey).deepEquals(aes256Key)
			o(secretStorageSpy.getPassword.callCount).equals(1)
			o(secretStorageSpy.getPassword.calls[0].args).deepEquals([CredentialsKeySpec.serviceName,  CredentialsKeySpec.accountName])
		})

		o("should store the key", async function () {
			const secretStorageSpy = spyify<SecretStorage>({
				async getPassword(service: string, account: string): Promise<string | null> {
					return null
				},

				async setPassword(service: string, account: string, password: string): Promise<void> {
				},
			})
			cryptoFacadeSpy = downcast<DesktopCryptoFacade>({
				generateDeviceKey() {
					return aes256Key
				},
			})
			const keyStoreFacade = initKeyStoreFacade(secretStorageSpy, cryptoFacadeSpy)
			await keyStoreFacade.getCredentialsKey()
			o(secretStorageSpy.setPassword.args).deepEquals([CredentialsKeySpec.serviceName, CredentialsKeySpec.accountName, keyToBase64(aes256Key)])
		})

		o("should NOT cache successful key fetch", async function () {
			const secretStorageSpy= spyify<SecretStorage>({
				async getPassword(service: string, account: string): Promise<string | null> {
					return keyToBase64(aes256Key)
				},

				async setPassword(service: string, account: string, password: string): Promise<void> {
				},
			})
			const keyStoreFacade = initKeyStoreFacade(secretStorageSpy, cryptoFacadeSpy)
			const actualKey = await keyStoreFacade.getCredentialsKey()
			o(actualKey).deepEquals(aes256Key)

			const actualKey2 = await keyStoreFacade.getCredentialsKey()
			o(actualKey2).deepEquals(aes256Key)

			o(secretStorageSpy.getPassword.callCount).equals(2)
			o(secretStorageSpy.getPassword.calls[1].args).deepEquals([CredentialsKeySpec.serviceName,  CredentialsKeySpec.accountName])
		})

		o("should not cache failures", async function () {
			let calls = 0
			const secretStorageSpy= spyify<SecretStorage>({
				async getPassword(service: string, account: string): Promise<string | null> {
					if (calls == 0) {
						calls++
						throw new CancelledError("Test")
					} else {
						calls++
						return keyToBase64(aes256Key)
					}
				},

				async setPassword(service: string, account: string, password: string): Promise<void> {
				},
			})

			const keyStoreFacade = initKeyStoreFacade(secretStorageSpy, cryptoFacadeSpy)
			await assertThrows(CancelledError, () => keyStoreFacade.getCredentialsKey())

			const actualKey = await keyStoreFacade.getCredentialsKey()
			o(actualKey).deepEquals(aes256Key)

			o(secretStorageSpy.getPassword.callCount).equals(2)
			o(secretStorageSpy.getPassword.calls[1].args).deepEquals([CredentialsKeySpec.serviceName,  CredentialsKeySpec.accountName])
		})
	})
})