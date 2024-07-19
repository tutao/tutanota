import o from "@tutao/otest"
import { DesktopCredentialsStorage } from "../../../../src/common/desktop/db/DesktopCredentialsStorage.js"
import { object } from "testdouble"
import { CredentialEncryptionMode } from "../../../../src/common/misc/credentials/CredentialEncryptionMode.js"
import { CredentialType } from "../../../../src/common/misc/credentials/CredentialType.js"
import { PersistedCredentials } from "../../../../src/common/native/common/generatedipc/PersistedCredentials.js"

const encryptedCredentials1: PersistedCredentials = {
	credentialInfo: {
		login: "login1@test.com",
		type: CredentialType.Internal,
		userId: "user1",
	},
	encryptedPassword: "pw1",
	encryptedPassphraseKey: null,
	databaseKey: new Uint8Array([0x01, 0x0d, 0x0e]),
	accessToken: new Uint8Array([0x01, 0x0a, 0x0e]),
}

const encryptedCredentials2: PersistedCredentials = {
	credentialInfo: {
		login: "login2@test.com",
		type: CredentialType.Internal,
		userId: "user2",
	},
	encryptedPassword: "pw2",
	encryptedPassphraseKey: new Uint8Array([0x02, 0x0b, 0x0e]),
	databaseKey: new Uint8Array([0x02, 0x0d, 0x0e]),
	accessToken: new Uint8Array([0x02, 0x0a, 0x0e]),
}

o.spec("DesktopCredentialsStorage", () => {
	let storage: DesktopCredentialsStorage

	o.beforeEach(() => {
		storage = new DesktopCredentialsStorage(buildOptions.sqliteNativePath, ":memory:", object())
	})
	o.afterEach(async () => {
		await storage.closeDb()
	})
	o.spec("credentialEncryptionKey", () => {
		o.test("when there is none it returns null", () => {
			o(storage.getCredentialEncryptionKey()).equals(null)
		})

		o.test("it returns one after writing", () => {
			const key = new Uint8Array([0x04, 0x0e, 0x04])
			storage.setCredentialEncryptionKey(key)
			o(storage.getCredentialEncryptionKey()).deepEquals(key)
		})

		o.test("it returns one after overwriting", () => {
			const key1 = new Uint8Array([0x04, 0x0e, 0x04, 0x01])
			const key2 = new Uint8Array([0x04, 0x0e, 0x04, 0x02])
			storage.setCredentialEncryptionKey(key1)
			storage.setCredentialEncryptionKey(key2)
			o(storage.getCredentialEncryptionKey()).deepEquals(key2)
		})

		o.test("it returns null after writing null", () => {
			const key = new Uint8Array([0x04, 0x0e, 0x04])
			storage.setCredentialEncryptionKey(key)
			storage.setCredentialEncryptionKey(null)
			o(storage.getCredentialEncryptionKey()).deepEquals(null)
		})
	})

	o.spec("credentialEncryptionMode", () => {
		o.test("when there is none it returns null", () => {
			o(storage.getCredentialEncryptionMode()).equals(null)
		})

		o.test("it returns one after writing", () => {
			storage.setCredentialEncryptionMode(CredentialEncryptionMode.APP_PASSWORD)
			o(storage.getCredentialEncryptionMode()).deepEquals(CredentialEncryptionMode.APP_PASSWORD)
		})

		o.test("it returns one after overwriting", () => {
			storage.setCredentialEncryptionMode(CredentialEncryptionMode.APP_PASSWORD)
			storage.setCredentialEncryptionMode(CredentialEncryptionMode.DEVICE_LOCK)
			o(storage.getCredentialEncryptionMode()).deepEquals(CredentialEncryptionMode.DEVICE_LOCK)
		})

		o.test("it returns null after writing null", () => {
			storage.setCredentialEncryptionMode(CredentialEncryptionMode.DEVICE_LOCK)
			storage.setCredentialEncryptionMode(null)
			o(storage.getCredentialEncryptionMode()).deepEquals(null)
		})
	})

	o.spec("credentials", () => {
		o.beforeEach(() => {
			storage.store(encryptedCredentials1)
			storage.store(encryptedCredentials2)
		})
		o.test("getCredentialsByUserId() returns credentials after storing", () => {
			o(storage.getCredentialsByUserId(encryptedCredentials1.credentialInfo.userId)).deepEquals(encryptedCredentials1)
		})

		o.test("getAllCredentials() returns all after storing", () => {
			o(storage.getAllCredentials()).deepEquals([encryptedCredentials1, encryptedCredentials2])
		})

		o.test("doesn't return after deleteByUserId", () => {
			storage.deleteByUserId(encryptedCredentials1.credentialInfo.userId)
			o(storage.getAllCredentials()).deepEquals([encryptedCredentials2])
		})

		o.test("doesn't return after deleteAll()", () => {
			storage.deleteAllCredentials()
			o(storage.getAllCredentials()).deepEquals([])
		})
	})
})
