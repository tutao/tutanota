// @flow
import o from "ospec"
import type {CredentialsEncryption, CredentialsStorage} from "../../../../src/misc/credentials/CredentialsProvider"
import {CredentialsProvider} from "../../../../src/misc/credentials/CredentialsProvider"

class CredentialsStorageStub implements CredentialsStorage {
	values = new Map<Id, Base64>()

	store(userId: Id, encryptedCredentials: Base64) {
		this.values.set(userId, encryptedCredentials)
	}

	loadByUserId(userId: Id): [Id, Base64] | null {
		const value = this.values.get(userId);
		if (value) {
			return [userId, value]
		} else {
			return null
		}
	}

	loadAll(): Array<[Id, Base64]> {
		return Array.from(this.values.entries());
	}

	deleteByUserId(userId: Id) {
		this.values.delete(userId)
	}
}

class CredentialsEncryptionStub implements CredentialsEncryption {
	async encrypt(credentials: Credentials): Promise<Base64> {
		return JSON.stringify(credentials)
	}

	async decrypt(encryptedCredentials: Base64): Promise<Credentials> {
		return JSON.parse(encryptedCredentials)
	}
}


o.spec("CredentialsProvider", function () {
	let encryption
	let storage
	let credentialsProvider
	let internalCredentials: Credentials
	let externalCredentials: Credentials
	o.beforeEach(function () {
		internalCredentials = {
			mailAddress: "test@example.com",
			encryptedPassword: "123",
			accessToken: "456",
			userId: "789",
			type: "internal",
		}
		externalCredentials = {
			mailAddress: "test2@example.com",
			encryptedPassword: "1232",
			accessToken: "4562",
			userId: "7892",
			type: "external",
		}
		encryption = new CredentialsEncryptionStub()
		storage = new CredentialsStorageStub()
		credentialsProvider = new CredentialsProvider(encryption, storage)

	})

	o.spec("Storing credentials", function () {
		o("Should store credentials", async function () {
			await credentialsProvider.store(internalCredentials)

			const expectedEncrypted = await encryption.encrypt(internalCredentials)
			o(storage.loadByUserId(internalCredentials.userId)).deepEquals([internalCredentials.userId, expectedEncrypted])
		})
	})

	o.spec("Reading Credentials", function () {
		o.beforeEach(async function () {
			await storage.store(internalCredentials.userId, JSON.stringify(internalCredentials))
			await storage.store(externalCredentials.userId, JSON.stringify(externalCredentials))
		})
		o("Should return Credentials", async function () {
			const retrievedCredentials = await credentialsProvider.getCredentialsByUserId(internalCredentials.userId)

			o(retrievedCredentials).deepEquals(internalCredentials)
		})

		o("Should return all Credentials", async function () {
			const retrievedCredentials = await credentialsProvider.getAllCredentials()

			o(retrievedCredentials).deepEquals([internalCredentials, externalCredentials])
		})

		o("Should return credentials for internal users", async function () {
			const retrievedCredentials = await credentialsProvider.getAllInternal()

			o(retrievedCredentials).deepEquals([internalCredentials])
		})
	})

	o.spec("Deleting credentials", function () {
		o("Should delete credentials when they are there", async function () {
			await storage.store(internalCredentials.userId, JSON.stringify(internalCredentials))

			await credentialsProvider.deleteByUserId(internalCredentials.userId)
			o(storage.loadByUserId(internalCredentials.userId)).equals(null)
		})

		o("Should no-op when credentials are not there", async function () {
			await credentialsProvider.deleteByUserId(internalCredentials.userId)
			o(storage.loadByUserId(internalCredentials.userId)).equals(null)
		})
	})
})

