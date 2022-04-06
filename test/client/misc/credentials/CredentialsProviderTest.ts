import o from "ospec"
import type {
	CredentialsAndDatabaseKey,
	CredentialsEncryption,
	CredentialsStorage,
	PersistentCredentials
} from "../../../../src/misc/credentials/CredentialsProvider"
import {CREDENTIALS_DELETED_EVENT, CredentialsProvider} from "../../../../src/misc/credentials/CredentialsProvider"
import {assertNotNull, base64ToUint8Array, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {CredentialEncryptionMode} from "../../../../src/misc/credentials/CredentialEncryptionMode"
import type {ICredentialsKeyMigrator} from "../../../../src/misc/credentials/CredentialsKeyMigrator"
import type {Credentials} from "../../../../src/misc/credentials/Credentials"
import {instance, object, when} from "testdouble"
import {DatabaseKeyFactory} from "../../../../src/misc/credentials/DatabaseKeyFactory"
import {keyToBase64} from "@tutao/tutanota-crypto"
import {OfflineDbFacade} from "../../../../src/desktop/db/OfflineDbFacade"
import {InterWindowEventBus} from "../../../../src/native/common/InterWindowEventBus"
import {verify} from "@tutao/tutanota-test-utils"

const encryptionKey = new Uint8Array([1, 2, 5, 8])


class CredentialsEncryptionStub implements CredentialsEncryption {

	async encrypt({credentials, databaseKey}: CredentialsAndDatabaseKey): Promise<PersistentCredentials> {
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
			databaseKey: databaseKey ? uint8ArrayToBase64(databaseKey) : null
		}
	}

	async decrypt(encryptedCredentials: PersistentCredentials): Promise<CredentialsAndDatabaseKey> {
		let databaseKey: Uint8Array | null = null
		if (encryptedCredentials.databaseKey) {
			databaseKey = base64ToUint8Array(encryptedCredentials.databaseKey)
		}
		return {
			credentials: {
				login: encryptedCredentials.credentialInfo.login,
				userId: encryptedCredentials.credentialInfo.userId,
				type: encryptedCredentials.credentialInfo.type,
				encryptedPassword: encryptedCredentials.encryptedPassword,
				accessToken: encryptedCredentials.accessToken,
			},
			databaseKey
		}

	}

	async getSupportedEncryptionModes() {
		return []
	}
}

o.spec("CredentialsProvider", function () {
	let encryption
	let storageMock
	let credentialsProvider: CredentialsProvider
	let internalCredentials: Credentials
	let internalCredentials2: Credentials
	let externalCredentials: Credentials
	let encryptedInternalCredentials: PersistentCredentials
	let encryptedExternalCredentials: PersistentCredentials
	let encryptedInternalCredentialsWithoutDatabaseKey: Omit<PersistentCredentials, "databaseKey">
	let keyMigratorMock: ICredentialsKeyMigrator
	let databaseKeyFactoryMock: DatabaseKeyFactory
	let offlineDbFacadeMock: OfflineDbFacade
	let interWindowEventBusMock: InterWindowEventBus
	o.beforeEach(function () {
		internalCredentials = {
			login: "test@example.com",
			encryptedPassword: "123",
			accessToken: "456",
			userId: "789",
			type: "internal",
		}
		internalCredentials2 = {
			login: "test@example.com",
			encryptedPassword: "123456",
			accessToken: "456789",
			userId: "789012",
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
			databaseKey: "SSBhbSBhIGtleQo="
		}
		encryptedExternalCredentials = {
			credentialInfo: {
				login: externalCredentials.login,
				userId: externalCredentials.userId,
				type: externalCredentials.type,
			},
			encryptedPassword: assertNotNull(externalCredentials.encryptedPassword),
			accessToken: externalCredentials.accessToken,
			databaseKey: "SSBhbSBhIGtleQo="
		}
		encryptedInternalCredentialsWithoutDatabaseKey = {
			credentialInfo: {
				login: internalCredentials2.login,
				userId: internalCredentials2.userId,
				type: internalCredentials2.type,
			},
			encryptedPassword: assertNotNull(internalCredentials2.encryptedPassword),
			accessToken: internalCredentials2.accessToken,
		}
		encryption = new CredentialsEncryptionStub()
		storageMock = object<CredentialsStorage>()

		keyMigratorMock = object<ICredentialsKeyMigrator>()
		databaseKeyFactoryMock = instance(DatabaseKeyFactory)
		offlineDbFacadeMock = object()
		interWindowEventBusMock = object()
		credentialsProvider = new CredentialsProvider(encryption, storageMock, keyMigratorMock, databaseKeyFactoryMock,
			offlineDbFacadeMock, interWindowEventBusMock)
	})

	o.spec("Storing credentials", function () {
		o("Should store credentials", async function () {
			await credentialsProvider.store({credentials: internalCredentials, databaseKey: null})

			const expectedEncrypted = await encryption.encrypt({credentials: internalCredentials, databaseKey: null})
			verify(storageMock.store(expectedEncrypted))
		})
	})

	o.spec("Reading Credentials", function () {
		o.beforeEach(async function () {
			when(storageMock.loadByUserId(internalCredentials.userId)).thenReturn(encryptedInternalCredentials)
			when(storageMock.loadByUserId(externalCredentials.userId)).thenReturn(encryptedExternalCredentials)
			when(storageMock.loadAll()).thenReturn([encryptedInternalCredentials, encryptedExternalCredentials])
		})
		o("Should return internal Credentials", async function () {
			const retrievedCredentials = await credentialsProvider.getCredentialsByUserId(internalCredentials.userId)

			o(retrievedCredentials?.credentials ?? {}).deepEquals(internalCredentials)
		})

		o("Should return credential infos for internal users", async function () {
			const retrievedCredentials = await credentialsProvider.getInternalCredentialsInfos()

			o(retrievedCredentials).deepEquals([encryptedInternalCredentials.credentialInfo])
		})

		o("Should generate a database key if one doesn't exist on the stored credentials", async function () {
			const newDatabaseKey = base64ToUint8Array(keyToBase64([3957386659, 354339016, 3786337319, 3366334248]))

			when(databaseKeyFactoryMock.generateKey()).thenResolve(newDatabaseKey)
			when(storageMock.loadByUserId(internalCredentials2.userId)).thenReturn(encryptedInternalCredentialsWithoutDatabaseKey)

			const retrievedCredentials = await credentialsProvider.getCredentialsByUserId(internalCredentials2.userId)

			o(retrievedCredentials?.databaseKey).equals(newDatabaseKey)

			const expectedEncrypted = await encryption.encrypt({credentials: internalCredentials2, databaseKey: newDatabaseKey})
			verify(storageMock.store(expectedEncrypted), {times: 1})
		})
	})

	o.spec("Deleting credentials", function () {
		o("Should delete credentials from storage", async function () {
			await credentialsProvider.deleteByUserId(internalCredentials.userId)
			verify(storageMock.deleteByUserId(internalCredentials.userId), {times: 1})
		})
		o("Deletes offline database", async function () {
			await credentialsProvider.deleteByUserId(internalCredentials.userId)
			verify(offlineDbFacadeMock.deleteDatabaseForUser(internalCredentials.userId))
		})
		o("Sends event over EventBus", async function () {
			await credentialsProvider.deleteByUserId(internalCredentials.userId)
			verify(interWindowEventBusMock.send({name: CREDENTIALS_DELETED_EVENT, userId: internalCredentials.userId}))
		})
	})

	o.spec("Setting credentials encryption mode", function () {
		o("Enrolling", async function () {
			when(storageMock.getCredentialEncryptionMode()).thenReturn(null)
			const newEncryptionMode = CredentialEncryptionMode.DEVICE_LOCK
			await credentialsProvider.setCredentialsEncryptionMode(newEncryptionMode)
			verify(storageMock.setCredentialEncryptionMode(newEncryptionMode), {times: 1})
		})
	})

	o.spec("Changing credentials encryption mode", function () {
		o("Changing encryption mode", async function () {
			const oldEncryptionMode = CredentialEncryptionMode.SYSTEM_PASSWORD
			const newEncryptionMode = CredentialEncryptionMode.DEVICE_LOCK
			const migratedKey = new Uint8Array([8, 3, 5, 8])

			when(storageMock.getCredentialEncryptionMode()).thenReturn(oldEncryptionMode)
			when(storageMock.getCredentialsEncryptionKey()).thenReturn(encryptionKey)
			when(keyMigratorMock.migrateCredentialsKey(encryptionKey, oldEncryptionMode, newEncryptionMode)).thenResolve(migratedKey)

			await credentialsProvider.setCredentialsEncryptionMode(newEncryptionMode)

			verify(storageMock.setCredentialEncryptionMode(newEncryptionMode))
			verify(storageMock.setCredentialsEncryptionKey(migratedKey))
		})
	})

	o.spec("clearCredentials", function () {
		o.beforeEach(function () {
			when(storageMock.loadAll()).thenReturn([encryptedInternalCredentials, encryptedExternalCredentials])
		})
		o("deleted credentials, key and mode", async function () {
			await credentialsProvider.clearCredentials("testing")

			verify(storageMock.deleteByUserId(internalCredentials.userId))
			verify(storageMock.deleteByUserId(externalCredentials.userId))
		})
		o("Clears offline databases", async function () {
			await credentialsProvider.clearCredentials("testing")
			verify(offlineDbFacadeMock.deleteDatabaseForUser(internalCredentials.userId))
			verify(offlineDbFacadeMock.deleteDatabaseForUser(externalCredentials.userId))
		})
		o("Sends event over EventBus", async function () {
			await credentialsProvider.clearCredentials("testing")
			verify(interWindowEventBusMock.send({name: CREDENTIALS_DELETED_EVENT, userId: internalCredentials.userId}))
			verify(interWindowEventBusMock.send({name: CREDENTIALS_DELETED_EVENT, userId: externalCredentials.userId}))
		})
	})
})

