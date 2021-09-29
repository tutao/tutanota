// @flow
import o from "ospec"
import type {CredentialsEncryption, CredentialsStorage, EncryptedCredentials} from "../../../../src/misc/credentials/CredentialsProvider"
import {CredentialsProvider} from "../../../../src/misc/credentials/CredentialsProvider"

class CredentialsStorageStub implements CredentialsStorage {
	values = new Map<Id, Base64>()

	store(encryptedCredentials: EncryptedCredentials) {
		this.values.set(encryptedCredentials.userId, encryptedCredentials.encryptedCredentials)
	}

	loadByUserId(userId: Id): EncryptedCredentials | null {
		const value = this.values.get(userId);
		if (value) {
			return {userId, encryptedCredentials: value}
		} else {
			return null
		}
	}

	loadAll(): Array<EncryptedCredentials> {
		return Array.from(this.values.entries()).map(([userId, encryptedCredentials]) => {
			return {userId, encryptedCredentials}
		})
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
		encryption = new CredentialsEncryptionStub()
		storage = new CredentialsStorageStub()
		credentialsProvider = new CredentialsProvider(encryption, storage)

	})

	o.spec("Storing credentials", function () {
		o("Should store credentials", async function () {
			await credentialsProvider.store(internalCredentials)

			const expectedEncrypted = await encryption.encrypt(internalCredentials)
			o(storage.loadByUserId(internalCredentials.userId)).deepEquals({
				userId: internalCredentials.userId,
				encryptedCredentials: expectedEncrypted
			})
		})
	})

	o.spec("Reading Credentials", function () {
		o.beforeEach(async function () {
			await storage.store({userId: internalCredentials.userId, encryptedCredentials: JSON.stringify(internalCredentials)})
			await storage.store({userId: externalCredentials.userId, encryptedCredentials: JSON.stringify(externalCredentials)})
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
			await storage.store({userId: internalCredentials.userId, encryptedCredentials: JSON.stringify(internalCredentials)})

			await credentialsProvider.deleteByUserId(internalCredentials.userId)
			o(storage.loadByUserId(internalCredentials.userId)).equals(null)
		})

		o("Should no-op when credentials are not there", async function () {
			await credentialsProvider.deleteByUserId(internalCredentials.userId)
			o(storage.loadByUserId(internalCredentials.userId)).equals(null)
		})
	})
})

