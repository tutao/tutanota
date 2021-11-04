// @flow

import o from 'ospec'
import {ACCOUNT_NAME, DeviceKeyProviderImpl, SERVICE_NAME} from "../../../src/desktop/DeviceKeyProviderImpl"
import {DesktopCryptoFacade} from "../../../src/desktop/DesktopCryptoFacade"
import type {SecretStorage} from "../../../src/desktop/sse/SecretStorage"
import {spyify} from "../nodemocker"
import {downcast} from "@tutao/tutanota-utils"
import {keyToBase64, uint8ArrayToKey} from "../../../src/api/worker/crypto/CryptoUtils"

function initDeviceKeyProvider(secretStorage: SecretStorage, crypto: DesktopCryptoFacade): DeviceKeyProviderImpl {
	return new DeviceKeyProviderImpl(secretStorage, crypto)
}

o.spec('DeviceKeyProvider test', function () {
	const aes256Key = uint8ArrayToKey(new Uint8Array([1, 2]))

	o('getDeviceKey should return stored key', async function () {
		const secretStorageSpy: SecretStorage = spyify({
			async getPassword(service: string, account: string): Promise<?string> {return keyToBase64(aes256Key)},

			async setPassword(service: string, account: string, password: string): Promise<void> {}
		})
		const cryptoFacadeSpy: DesktopCryptoFacade = spyify(downcast({}))
		const deviceKeyProvider = initDeviceKeyProvider(secretStorageSpy, cryptoFacadeSpy)

		const actualKey = await deviceKeyProvider.getDeviceKey()

		o(actualKey).deepEquals(aes256Key)
		o(secretStorageSpy.getPassword.callCount).equals(1)
		o(secretStorageSpy.getPassword.calls[0].args).deepEquals([SERVICE_NAME, ACCOUNT_NAME])

	})


	o('getDeviceKey should store the key', async function () {
		const secretStorageSpy: SecretStorage = spyify({
			async getPassword(service: string, account: string): Promise<?string> {return null},

			async setPassword(service: string, account: string, password: string): Promise<void> {}
		})

		const cryptoFacadeSpy: DesktopCryptoFacade = downcast({
			generateDeviceKey() {
				return aes256Key
			}
		})

		const deviceKeyProvider = initDeviceKeyProvider(secretStorageSpy, cryptoFacadeSpy)
		await deviceKeyProvider.getDeviceKey()

		o(secretStorageSpy.setPassword.args).deepEquals([SERVICE_NAME, ACCOUNT_NAME, keyToBase64(aes256Key)])

	})
})