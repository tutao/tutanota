import o from "@tutao/otest"
import { KeytarSecretStorage, SafeStorageSecretStorage } from "../../../../src/desktop/sse/SecretStorage.js"
import type { ElectronExports, FsExports } from "../../../../src/desktop/ElectronExportTypes.js"
import path from "node:path"
import { matchers, object, verify, when } from "testdouble"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { DeviceStorageUnavailableError } from "../../../../src/api/common/error/DeviceStorageUnavailableError.js"

o.spec("SecretStorage", function () {
	o.spec("SafeStorageSecretStorage", function () {
		let electron: ElectronExports
		let fs: FsExports
		let keytarSecretStorage: KeytarSecretStorage
		let subject: SafeStorageSecretStorage
		o.beforeEach(() => {
			electron = object()
			fs = object()
			keytarSecretStorage = object()
			subject = new SafeStorageSecretStorage(electron, fs, path, keytarSecretStorage)
		})

		o("will not ask keytar if there is a password file", async function () {
			when(fs.promises.readFile(matchers.anything())).thenResolve(Buffer.from([1, 2, 3, 4, 5]))
			when(electron.safeStorage.isEncryptionAvailable()).thenReturn(true)
			when(electron.app.getPath(matchers.anything())).thenReturn("/any/path")
			when(fs.promises.mkdir(matchers.anything(), matchers.anything())).thenResolve("some/path")
			await subject.getPassword("service", "account")
			verify(keytarSecretStorage.getPassword(matchers.anything(), matchers.anything()), { times: 0 })
			verify(fs.promises.writeFile(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o("will ask keytar if there is no password file", async function () {
			when(fs.promises.readFile(matchers.anything())).thenReject({ code: "ENOENT" })

			when(electron.safeStorage.isEncryptionAvailable()).thenReturn(true)
			when(electron.app.getPath(matchers.anything())).thenReturn("/any/path")
			when(fs.promises.mkdir(matchers.anything(), matchers.anything())).thenResolve("some/path")
			when(keytarSecretStorage.getPassword(matchers.anything(), matchers.anything())).thenResolve(null)
			const pw = await subject.getPassword("service", "account")
			o(pw).equals(null)
			verify(fs.promises.writeFile(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o("will write the keytar password if found", async function () {
			when(fs.promises.readFile(matchers.anything())).thenReject({ code: "ENOENT" })

			when(electron.safeStorage.isEncryptionAvailable()).thenReturn(true)
			when(electron.app.getPath(matchers.anything())).thenReturn("/any/path")
			when(fs.promises.mkdir(matchers.anything(), matchers.anything())).thenResolve("some/path")
			when(keytarSecretStorage.getPassword(matchers.anything(), matchers.anything())).thenResolve("hellopassword")
			await subject.getPassword("service", "account")
			verify(fs.promises.writeFile(matchers.anything(), matchers.anything()), { times: 1 })
		})

		o("will throw an error if there is no safeStorage available", async function () {
			when(electron.safeStorage.isEncryptionAvailable()).thenReturn(false)
			when(electron.app.getPath(matchers.anything())).thenReturn("/any/path")
			await assertThrows(DeviceStorageUnavailableError, () => subject.getPassword("service", "account"))
			await assertThrows(DeviceStorageUnavailableError, () => subject.setPassword("service", "account", "password"))
		})
	})
})
