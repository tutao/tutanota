// @flow
import o from "ospec"
import type {CredentialsEncryption, CredentialsStorage, PersistentCredentials} from "../../../../src/misc/credentials/CredentialsProvider"
import {CredentialsProvider} from "../../../../src/misc/credentials/CredentialsProvider"
import {assertNotNull} from "../../../../src/api/common/utils/Utils"

class CredentialsStorageStub implements CredentialsStorage {
	values = new Map<Id, PersistentCredentials>()

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
}

o.spec("CredentialsProvider", function () {
	let encryption
	let storage
	let credentialsProvider
	let internalCredentials: Credentials
	let externalCredentials: Credentials
	let encryptedInternalCredentials: PersistentCredentials
	let encryptedExternalCredentials: PersistentCredentials
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
})

