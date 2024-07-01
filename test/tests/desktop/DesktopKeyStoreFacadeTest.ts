import o from "@tutao/otest"
import { CredentialsKeySpec, DesktopKeyStoreFacade, DeviceKeySpec } from "../../../src/common/desktop/DesktopKeyStoreFacade.js"
import { DesktopNativeCryptoFacade } from "../../../src/common/desktop/DesktopNativeCryptoFacade.js"
import type { SecretStorage } from "../../../src/common/desktop/sse/SecretStorage.js"
import { spyify } from "../nodemocker.js"
import { keyToBase64, uint8ArrayToKey } from "@tutao/tutanota-crypto"
import { CancelledError } from "../../../src/common/api/common/error/CancelledError.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { DeviceStorageUnavailableError } from "../../../src/common/api/common/error/DeviceStorageUnavailableError.js"

function initKeyStoreFacade(secretStorage: SecretStorage, crypto: DesktopNativeCryptoFacade): DesktopKeyStoreFacade {
	return new DesktopKeyStoreFacade(secretStorage, crypto)
}

o.spec("DesktopKeyStoreFacade", function () {
	const aes256Key = uint8ArrayToKey(new Uint8Array([1, 2]))
	let cryptoFacadeSpy: DesktopNativeCryptoFacade

	o.beforeEach(function () {
		const stub = { generateDeviceKey: () => uint8ArrayToKey(new Uint8Array([0, 0])) } as DesktopNativeCryptoFacade
		cryptoFacadeSpy = spyify(stub)
	})

	const toSpec = {
		getDeviceKey: DeviceKeySpec,
		getKeyChainKey: CredentialsKeySpec,
	}

	for (const [opName, spec] of Object.entries(toSpec)) {
		o.spec(opName, function () {
			o(opName + " should return stored key", async function () {
				const secretStorageSpy = spyify<SecretStorage>({
					async getPassword(service: string, account: string): Promise<string | null> {
						return keyToBase64(aes256Key)
					},

					async setPassword(service: string, account: string, password: string): Promise<void> {},
				})
				const keyStoreFacade = initKeyStoreFacade(secretStorageSpy, cryptoFacadeSpy)
				const actualKey = await keyStoreFacade[opName]()
				o(actualKey).deepEquals(aes256Key)
				o(secretStorageSpy.getPassword.callCount).equals(1)
				o(secretStorageSpy.getPassword.calls[0]).deepEquals([spec.serviceName, spec.accountName])
			})

			o("should store the key", async function () {
				const secretStorageSpy = spyify<SecretStorage>({
					async getPassword(service: string, account: string): Promise<string | null> {
						return null
					},

					async setPassword(service: string, account: string, password: string): Promise<void> {},
				})
				cryptoFacadeSpy = {
					generateDeviceKey() {
						return aes256Key
					},
				} as DesktopNativeCryptoFacade
				const keyStoreFacade = initKeyStoreFacade(secretStorageSpy, cryptoFacadeSpy)
				await keyStoreFacade[opName]()
				o(secretStorageSpy.setPassword.args).deepEquals([spec.serviceName, spec.accountName, keyToBase64(aes256Key)])
			})

			o(spec.cached ? opName + " should cache successful key fetch" : opName + " should NOT cache successful key fetch", async function () {
				const secretStorageSpy = spyify<SecretStorage>({
					async getPassword(service: string, account: string): Promise<string | null> {
						return keyToBase64(aes256Key)
					},

					async setPassword(service: string, account: string, password: string): Promise<void> {},
				})
				const keyStoreFacade = initKeyStoreFacade(secretStorageSpy, cryptoFacadeSpy)
				const actualKey = await keyStoreFacade[opName]()
				o(actualKey).deepEquals(aes256Key)

				const actualKey2 = await keyStoreFacade[opName]()
				o(actualKey2).deepEquals(aes256Key)
				if (spec.cached) {
					o(secretStorageSpy.getPassword.callCount).equals(1)
					o(secretStorageSpy.getPassword.calls[0]).deepEquals([spec.serviceName, spec.accountName])
				} else {
					o(secretStorageSpy.getPassword.callCount).equals(2)
					o(secretStorageSpy.getPassword.calls[1]).deepEquals([spec.serviceName, spec.accountName])
				}
			})

			o(opName + " should not cache failures", async function () {
				let calls = 0
				const secretStorageSpy = spyify<SecretStorage>({
					async getPassword(service: string, account: string): Promise<string | null> {
						if (calls == 0) {
							calls++
							throw new CancelledError("Test")
						} else {
							calls++
							return keyToBase64(aes256Key)
						}
					},

					async setPassword(service: string, account: string, password: string): Promise<void> {},
				})

				const keyStoreFacade = initKeyStoreFacade(secretStorageSpy, cryptoFacadeSpy)
				await assertThrows(CancelledError, () => keyStoreFacade[opName]())

				const actualKey = await keyStoreFacade[opName]()
				o(actualKey).deepEquals(aes256Key)

				o(secretStorageSpy.getPassword.callCount).equals(2)
				o(secretStorageSpy.getPassword.calls[1]).deepEquals([spec.serviceName, spec.accountName])
			})
		})
	}

	o.spec("key storage errors get propagated properly", function () {
		async function testErrorWrapping({ onget, onset, expectError }) {
			const secretStorageSpy = spyify<SecretStorage>({
				async getPassword(service: string, account: string): Promise<string | null> {
					return onget()
				},
				async setPassword(service: string, account: string, password: string): Promise<void> {
					return onset()
				},
			})

			const keyStoreFacade = initKeyStoreFacade(secretStorageSpy, cryptoFacadeSpy)
			await assertThrows(expectError, () => keyStoreFacade.getDeviceKey())
		}

		o("CancelledError passes through for getPassword", async function () {
			await testErrorWrapping({
				onget: () => {
					throw new CancelledError("getting")
				},
				onset: () => {},
				expectError: CancelledError,
			})
		})

		o("CancelledError passes through for setPassword", async function () {
			await testErrorWrapping({
				onget: () => null,
				onset: () => {
					throw new CancelledError("setting")
				},
				expectError: CancelledError,
			})
		})

		o("other errors get wrapped for getPassword", async function () {
			await testErrorWrapping({
				onget: () => {
					throw new Error("random get failure")
				},
				onset: () => {},
				expectError: DeviceStorageUnavailableError,
			})
		})

		o("other errors get wrapped for setPassword", async function () {
			await testErrorWrapping({
				onget: () => null,
				onset: () => {
					throw new Error("random set failure")
				},
				expectError: DeviceStorageUnavailableError,
			})
		})
	})
})
