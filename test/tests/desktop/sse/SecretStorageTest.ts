import o from "@tutao/otest"
import { SafeStorageSecretStorage } from "../../../../src/common/desktop/sse/SecretStorage.js"
import type { ElectronExports, FsExports } from "../../../../src/common/desktop/ElectronExportTypes.js"
import path from "node:path"
import { matchers, object, when } from "testdouble"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { DeviceStorageUnavailableError } from "../../../../src/common/api/common/error/DeviceStorageUnavailableError.js"

o.spec("SecretStorage", function () {
	o.spec("SafeStorageSecretStorage", function () {
		let electron: ElectronExports
		let fs: FsExports
		let subject: SafeStorageSecretStorage
		o.beforeEach(() => {
			electron = object()
			fs = object()
			subject = new SafeStorageSecretStorage(electron, fs, path)
		})

		o("will throw an error if there is no safeStorage available", async function () {
			when(electron.safeStorage.isEncryptionAvailable()).thenReturn(false)
			when(electron.app.getPath(matchers.anything())).thenReturn("/any/path")
			await assertThrows(DeviceStorageUnavailableError, () => subject.getPassword("service", "account"))
			await assertThrows(DeviceStorageUnavailableError, () => subject.setPassword("service", "account", "password"))
		})
	})
})
