// @flow
import o from "ospec"
import type {CredentialsEncryption, CredentialsStorage, PersistentCredentials} from "../../../../src/misc/credentials/CredentialsProvider"
import {CredentialsProvider} from "../../../../src/misc/credentials/CredentialsProvider"
import {assertNotNull} from "@tutao/tutanota-utils"
import type {CredentialEncryptionModeEnum} from "../../../../src/misc/credentials/CredentialEncryptionMode"
import {CredentialEncryptionMode} from "../../../../src/misc/credentials/CredentialEncryptionMode"
import type {ICredentialsKeyMigrator} from "../../../../src/misc/credentials/CredentialsKeyMigrator"
import {spyify} from "../../nodemocker"
import type {Credentials} from "../../../../src/misc/credentials/Credentials"


const encryptionKey = new Uint8Array([1, 2, 5, 8])
const migratedKey = new Uint8Array([8, 3, 5, 8])

class CredentialsStorageStub implements CredentialsStorage {
	values = new Map<Id, PersistentCredentials>()
	_credentialsEncryptionMode: ?CredentialEncryptionModeEnum
	_credentialsEncryptionKey: ?Uint8Array

	store(encryptedCredentials: PersistentCredentials) {
		this.values.set(encryptedCredentials.credentialInfo.userId, encryptedCredentials)
	}

	loadByUserId(userId: Id): PersistentCredentials | null {
		return this.values.get(userId) ?? null
	}

	loadAll(): Array<PersistentCredentials> {
		return Array.from(this.values.values())
	}

	deleteByUserId(userId: Id) {
		this.values.delete(userId)
	}

	getCredentialEncryptionMode(): ?CredentialEncryptionModeEnum {
		return this._credentialsEncryptionMode
	}

	setCredentialEncryptionMode(encryptionMode: CredentialEncryptionModeEnum | null): void {
		this._credentialsEncryptionMode = encryptionMode
	}

	getCredentialsEncryptionKey(): ?Uint8Array {
		return this._credentialsEncryptionKey;
	}

	setCredentialsEncryptionKey(credentialsEncryptionKey: Uint8Array | null) : void {
		this._credentialsEncryptionKey = credentialsEncryptionKey
	}
}

class CredentialsEncryptionStub implements CredentialsEncryption {

	async encrypt(credentials: Credentials): Promise<PersistentCredentials> {
		const {encryptedPassword} = credentials
		if (encryptedPassword == null) {
			throw new Error("Trying to encrypt non-persistent credentials")
		}
		return {
			credentialInfo: {
				login: credentials.login,
				userId: credentials.userId,
				type: credentials.type,
			},
			encryptedPassword,
			accessToken: credentials.accessToken,
		}
	}

	async decrypt(encryptedCredentials: PersistentCredentials): Promise<Credentials> {
		return {
			login: encryptedCredentials.credentialInfo.login,
			userId: encryptedCredentials.credentialInfo.userId,
			type: encryptedCredentials.credentialInfo.type,
			encryptedPassword: encryptedCredentials.encryptedPassword,
			accessToken: encryptedCredentials.accessToken,
		}
	}

	async getSupportedEncryptionModes() {
		return []
	}
}

class CredentialsKeyMigratorStub implements ICredentialsKeyMigrator {
	async migrateCredentialsKey(oldKeyEncrypted, oldMode, newMode) {
		return migratedKey
	}
}

o.spec("CredentialsProvider", function () {
	let encryption
	let storage
	let credentialsProvider
	let internalCredentials: Credentials
	let externalCredentials: Credentials
	let encryptedInternalCredentials: PersistentCredentials
	let encryptedExternalCredentials: PersistentCredentials
	let keyMigrator: ICredentialsKeyMigrator
	o.beforeEach(function () {
		internalCredentials = {
			login: "test@example.com",
			encryptedPassword: "123",
			accessToken: "456",
			userId: "789",
			type: "internal",
		}
		externalCredentials = {
			login: "test2@example.com",
			encryptedPassword: "1232",
			accessToken: "4562",
			userId: "7892",
			type: "external",
		}
		encryptedInternalCredentials = {
			credentialInfo: {
				login: internalCredentials.login,
				userId: internalCredentials.userId,
				type: internalCredentials.type,
			},
			encryptedPassword: assertNotNull(internalCredentials.encryptedPassword),
			accessToken: internalCredentials.accessToken,
		}
		encryptedExternalCredentials = {
			credentialInfo: {
				login: externalCredentials.login,
				userId: externalCredentials.userId,
				type: externalCredentials.type,
			},
			encryptedPassword: assertNotNull(externalCredentials.encryptedPassword),
			accessToken: externalCredentials.accessToken,
		}
		encryption = new CredentialsEncryptionStub()
		storage = new CredentialsStorageStub()
		keyMigrator = spyify(new CredentialsKeyMigratorStub())
		credentialsProvider = new CredentialsProvider(encryption, storage, keyMigrator)
	})

	o.spec("Storing credentials", function () {
		o("Should store credentials", async function () {
			await credentialsProvider.store(internalCredentials)

			const expectedEncrypted = await encryption.encrypt(internalCredentials)
			o(storage.loadByUserId(internalCredentials.userId)).deepEquals(expectedEncrypted)
		})
	})

	o.spec("Reading Credentials", function () {
		o.beforeEach(async function () {
			await storage.store(encryptedInternalCredentials)
			await storage.store(encryptedExternalCredentials)
		})
		o("Should return internal Credentials", async function () {
			const retrievedCredentials = await credentialsProvider.getCredentialsByUserId(internalCredentials.userId)

			o(retrievedCredentials).deepEquals(internalCredentials)
		})

		o("Should return all Credentials", async function () {
			const retrievedCredentials = await credentialsProvider.getCredentialsInfos()

			o(retrievedCredentials).deepEquals([encryptedInternalCredentials.credentialInfo, encryptedExternalCredentials.credentialInfo])
		})

		o("Should return credentials for internal users", async function () {
			const retrievedCredentials = await credentialsProvider.getInternalCredentialsInfos()

			o(retrievedCredentials).deepEquals([encryptedInternalCredentials.credentialInfo])
		})
	})

	o.spec("Deleting credentials", function () {
		o("Should delete credentials when they are there", async function () {
			await storage.store(encryptedInternalCredentials)

			await credentialsProvider.deleteByUserId(internalCredentials.userId)
			o(storage.loadByUserId(internalCredentials.userId)).equals(null)
		})

		o("Should no-op when credentials are not there", async function () {
			await credentialsProvider.deleteByUserId(internalCredentials.userId)
			o(storage.loadByUserId(internalCredentials.userId)).equals(null)
		})
	})

	o.spec("Setting credentials encryption mode", function () {
		o("Enrolling", async function () {
			storage._credentialsEncryptionMode = null
			const newEncryptionMode = CredentialEncryptionMode.DEVICE_LOCK

			await credentialsProvider.setCredentialsEncryptionMode(newEncryptionMode)

			o(storage.getCredentialEncryptionMode()).equals(newEncryptionMode)
		})
	})

	o.spec("Changing credentials encryption mode", function () {
		o("Changing encryption mode", async function () {
			const oldEncryptionMode = CredentialEncryptionMode.SYSTEM_PASSWORD
			storage._credentialsEncryptionMode = oldEncryptionMode
			storage._credentialsEncryptionKey = encryptionKey

			const newEncryptionMode = CredentialEncryptionMode.DEVICE_LOCK
			await credentialsProvider.setCredentialsEncryptionMode(newEncryptionMode)

			o(storage.getCredentialEncryptionMode()).equals(newEncryptionMode)
			o(Array.from(keyMigrator.migrateCredentialsKey.args[0])).deepEquals(Array.from(encryptionKey))
			o(keyMigrator.migrateCredentialsKey.args[1]).equals(oldEncryptionMode)
			o(keyMigrator.migrateCredentialsKey.args[2]).equals(newEncryptionMode)
			o(Array.from(storage.getCredentialsEncryptionKey() ?? [])).deepEquals(Array.from(migratedKey))
		})
	})

	o.spec("clearCredentials", function() {
		o("deleted credentials, key and mode", async function() {
			await storage.store(encryptedInternalCredentials)
			await storage.store(encryptedExternalCredentials)

			await credentialsProvider.clearCredentials()

			o(storage.loadAll()).deepEquals([])
			o(storage.getCredentialsEncryptionKey()).equals(null)
			o(storage.getCredentialEncryptionMode()).equals(null)
		})
	})
})

