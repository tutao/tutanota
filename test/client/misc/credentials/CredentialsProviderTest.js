// @flow
import o from "ospec"
import type {CredentialsEncryption, CredentialsStorage, EncryptedCredentials} from "../../../../src/misc/credentials/CredentialsProvider"
import {CredentialsProvider} from "../../../../src/misc/credentials/CredentialsProvider"
import {assertNotNull} from "../../../../src/api/common/utils/Utils"

class CredentialsStorageStub implements CredentialsStorage {
	values = new Map<Id, EncryptedCredentials>()

	store(encryptedCredentials: EncryptedCredentials) {
		this.values.set(encryptedCredentials.userId, encryptedCredentials)
	}

	loadByUserId(userId: Id): EncryptedCredentials | null {
		return this.values.get(userId) ?? null
	}

	loadAll(): Array<EncryptedCredentials> {
		return Array.from(this.values.values())
	}

	deleteByUserId(userId: Id) {
		this.values.delete(userId)
	}
}

class CredentialsEncryptionStub implements CredentialsEncryption {
	async encrypt(credentials: Credentials): Promise<EncryptedCredentials> {
		const {encryptedPassword} = credentials
		if (encryptedPassword == null) {
			throw new Error("Trying to encrypt non-persistent credentials")
		}
		return {
			login: credentials.login,
			encryptedPassword,
			encryptedAccessToken: credentials.accessToken,
			userId: credentials.userId,
			type: credentials.type,
		}
	}

	async decrypt(encryptedCredentials: EncryptedCredentials): Promise<Credentials> {
		return {
			login: encryptedCredentials.login,
			encryptedPassword: encryptedCredentials.encryptedPassword,
			accessToken: encryptedCredentials.encryptedAccessToken,
			userId: encryptedCredentials.userId,
			type: encryptedCredentials.type,
		}
	}
}

o.spec("CredentialsProvider", function () {
	let encryption
	let storage
	let credentialsProvider
	let internalCredentials: Credentials
	let externalCredentials: Credentials
	let encryptedInternalCredentials: EncryptedCredentials
	let encryptedExternalCredentials: EncryptedCredentials
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
			login: internalCredentials.login,
			encryptedPassword: assertNotNull(internalCredentials.encryptedPassword),
			encryptedAccessToken: internalCredentials.accessToken,
			userId: internalCredentials.userId,
			type: internalCredentials.type
		}
		encryptedExternalCredentials = {
			login: externalCredentials.login,
			encryptedPassword: assertNotNull(externalCredentials.encryptedPassword),
			encryptedAccessToken: externalCredentials.accessToken,
			userId: externalCredentials.userId,
			type: externalCredentials.type
		}
		encryption = new CredentialsEncryptionStub()
		storage = new CredentialsStorageStub()
		credentialsProvider = new CredentialsProvider(encryption, storage)

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
			const retrievedCredentials = await credentialsProvider.getAllEncryptedCredentials()

			o(retrievedCredentials).deepEquals([encryptedInternalCredentials, encryptedExternalCredentials])
		})

		o("Should return credentials for internal users", async function () {
			const retrievedCredentials = await credentialsProvider.getAllInternalEncryptedCredentials()

			o(retrievedCredentials).deepEquals([encryptedInternalCredentials])
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
})

