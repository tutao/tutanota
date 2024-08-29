import o from "@tutao/otest"
import { CredentialsProvider } from "../../../../src/common/misc/credentials/CredentialsProvider.js"
import { assertNotNull, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { CredentialEncryptionMode } from "../../../../src/common/misc/credentials/CredentialEncryptionMode.js"
import { object, when } from "testdouble"
import { verify } from "@tutao/tutanota-test-utils"
import { InterWindowEventFacadeSendDispatcher } from "../../../../src/common/native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { SqlCipherFacade } from "../../../../src/common/native/common/generatedipc/SqlCipherFacade.js"
import { PersistedCredentials } from "../../../../src/common/native/common/generatedipc/PersistedCredentials.js"
import { UnencryptedCredentials } from "../../../../src/common/native/common/generatedipc/UnencryptedCredentials.js"
import { CredentialType } from "../../../../src/common/misc/credentials/CredentialType.js"
import { NativeCredentialsFacade } from "../../../../src/common/native/common/generatedipc/NativeCredentialsFacade.js"
import { CredentialsInfo } from "../../../../src/common/native/common/generatedipc/CredentialsInfo.js"

o.spec("CredentialsProvider", function () {
	let credentialsProvider: CredentialsProvider
	let internalCredentials: UnencryptedCredentials
	let internalCredentials2: UnencryptedCredentials
	let internalCredentialsBob: UnencryptedCredentials
	let internalCredentialsAlice: UnencryptedCredentials
	let externalCredentials: UnencryptedCredentials
	let encryptedInternalCredentials: PersistedCredentials
	let encryptedInternalCredentialsBob: PersistedCredentials
	let encryptedInternalCredentialsAlice: PersistedCredentials
	let encryptedExternalCredentials: PersistedCredentials
	let encryptedInternalCredentialsWithoutDatabaseKey: Omit<PersistedCredentials, "databaseKey">
	let sqlCipherFacadeMock: SqlCipherFacade
	let interWindowEventSenderMock: InterWindowEventFacadeSendDispatcher
	let nativeCredentialFacadeMock: NativeCredentialsFacade
	o.beforeEach(function () {
		internalCredentials = {
			credentialInfo: {
				login: "test@example.com",
				userId: "789",
				type: CredentialType.Internal,
			},
			encryptedPassword: "123",
			encryptedPassphraseKey: null,
			accessToken: "456",
			databaseKey: null,
		}
		internalCredentials2 = {
			credentialInfo: {
				login: "test@example.com",
				userId: "789012",
				type: CredentialType.Internal,
			},
			encryptedPassword: "123456",
			encryptedPassphraseKey: null,
			accessToken: "456789",
			databaseKey: null,
		}
		internalCredentialsAlice = {
			credentialInfo: {
				login: "alice@example.com",
				userId: "789012",
				type: CredentialType.Internal,
			},
			encryptedPassword: "123456",
			encryptedPassphraseKey: null,
			accessToken: "456789",
			databaseKey: null,
		}
		internalCredentialsBob = {
			credentialInfo: {
				login: "bob@example.com",
				userId: "789012",
				type: CredentialType.Internal,
			},
			encryptedPassword: "123456",
			encryptedPassphraseKey: null,
			accessToken: "456789",
			databaseKey: null,
		}
		externalCredentials = {
			credentialInfo: {
				login: "test2@example.com",
				userId: "7892",
				type: CredentialType.External,
			},
			encryptedPassword: "1232",
			encryptedPassphraseKey: null,
			accessToken: "4562",
			databaseKey: null,
		}
		encryptedInternalCredentials = {
			credentialInfo: {
				login: internalCredentials.credentialInfo.login,
				userId: internalCredentials.credentialInfo.userId,
				type: internalCredentials.credentialInfo.type,
			},
			encryptedPassword: assertNotNull(internalCredentials.encryptedPassword),
			encryptedPassphraseKey: null,
			accessToken: stringToUtf8Uint8Array(internalCredentials.accessToken),
			databaseKey: new Uint8Array([1, 2, 3]),
		}
		encryptedInternalCredentialsAlice = {
			credentialInfo: {
				login: internalCredentialsAlice.credentialInfo.login,
				userId: internalCredentialsAlice.credentialInfo.userId,
				type: internalCredentialsAlice.credentialInfo.type,
			},
			encryptedPassword: assertNotNull(internalCredentialsAlice.encryptedPassword),
			encryptedPassphraseKey: null,
			accessToken: stringToUtf8Uint8Array(internalCredentialsAlice.accessToken),
			databaseKey: new Uint8Array([1, 2, 3]),
		}
		encryptedInternalCredentialsBob = {
			credentialInfo: {
				login: internalCredentialsBob.credentialInfo.login,
				userId: internalCredentialsBob.credentialInfo.userId,
				type: internalCredentialsBob.credentialInfo.type,
			},
			encryptedPassword: assertNotNull(internalCredentialsBob.encryptedPassword),
			encryptedPassphraseKey: null,
			accessToken: stringToUtf8Uint8Array(internalCredentialsBob.accessToken),
			databaseKey: new Uint8Array([1, 2, 3]),
		}
		encryptedExternalCredentials = {
			credentialInfo: {
				login: externalCredentials.credentialInfo.login,
				userId: externalCredentials.credentialInfo.userId,
				type: externalCredentials.credentialInfo.type,
			},
			encryptedPassword: assertNotNull(externalCredentials.encryptedPassword),
			encryptedPassphraseKey: null,
			accessToken: stringToUtf8Uint8Array(externalCredentials.accessToken),
			databaseKey: new Uint8Array([1, 2, 3]),
		}
		encryptedInternalCredentialsWithoutDatabaseKey = {
			credentialInfo: {
				login: internalCredentials.credentialInfo.login,
				userId: internalCredentials.credentialInfo.userId,
				type: internalCredentials.credentialInfo.type,
			},
			encryptedPassword: assertNotNull(internalCredentials2.encryptedPassword),
			encryptedPassphraseKey: null,
			accessToken: stringToUtf8Uint8Array(internalCredentials2.accessToken),
		}
		sqlCipherFacadeMock = object()
		interWindowEventSenderMock = object()
		nativeCredentialFacadeMock = object()
		credentialsProvider = new CredentialsProvider(nativeCredentialFacadeMock, sqlCipherFacadeMock, interWindowEventSenderMock)
	})

	o.spec("Storing credentials", function () {
		o("Should store credentials", async function () {
			await credentialsProvider.store(internalCredentials)
			verify(nativeCredentialFacadeMock.store(internalCredentials))
		})
	})

	o.spec("Reading Credentials", function () {
		o.beforeEach(async function () {
			when(nativeCredentialFacadeMock.loadByUserId(internalCredentials.credentialInfo.userId)).thenResolve(internalCredentials)
			when(nativeCredentialFacadeMock.loadByUserId(externalCredentials.credentialInfo.userId)).thenResolve(externalCredentials)
			when(nativeCredentialFacadeMock.loadAll()).thenResolve([encryptedInternalCredentials, encryptedExternalCredentials])
		})
		o("Should return internal Credentials", async function () {
			const retrievedCredentials = await credentialsProvider.getDecryptedCredentialsByUserId(internalCredentials.credentialInfo.userId)

			o(retrievedCredentials).deepEquals(internalCredentials)
		})

		o("Should return credential infos for internal users", async function () {
			const retrievedCredentials = await credentialsProvider.getInternalCredentialsInfos()

			o(retrievedCredentials).deepEquals([encryptedInternalCredentials.credentialInfo])
		})

		o("Should return sorted internal credentials regardless of internal ordering", async function () {
			const alice = encryptedInternalCredentialsAlice
			const bob = encryptedInternalCredentialsBob
			const test = encryptedInternalCredentials
			const sorted = [alice.credentialInfo, bob.credentialInfo, test.credentialInfo]

			async function testSorted(list: readonly PersistedCredentials[]) {
				when(nativeCredentialFacadeMock.loadAll()).thenResolve(list)
				const retrieved = await credentialsProvider.getInternalCredentialsInfos()
				o(retrieved).deepEquals(sorted)
			}

			await testSorted([alice, bob, test])
			await testSorted([alice, test, bob])
			await testSorted([bob, alice, test])
			await testSorted([bob, test, alice])
			await testSorted([test, alice, bob])
			await testSorted([test, bob, alice])
		})
	})

	o.spec("Deleting credentials", function () {
		o("Should delete credentials from storage", async function () {
			await credentialsProvider.deleteByUserId(internalCredentials.credentialInfo.userId)
			verify(nativeCredentialFacadeMock.deleteByUserId(internalCredentials.credentialInfo.userId), { times: 1 })
		})
		o("Deletes offline database", async function () {
			await credentialsProvider.deleteByUserId(internalCredentials.credentialInfo.userId)
			verify(sqlCipherFacadeMock.deleteDb(internalCredentials.credentialInfo.userId))
		})
		o("Sends event over EventBus", async function () {
			await credentialsProvider.deleteByUserId(internalCredentials.credentialInfo.userId)
			verify(interWindowEventSenderMock.localUserDataInvalidated(internalCredentials.credentialInfo.userId))
		})
	})

	o.spec("Setting credentials encryption mode", function () {
		o("Enrolling", async function () {
			const newEncryptionMode = CredentialEncryptionMode.DEVICE_LOCK
			await credentialsProvider.setCredentialEncryptionMode(newEncryptionMode)
			verify(nativeCredentialFacadeMock.setCredentialEncryptionMode(newEncryptionMode), { times: 1 })
		})
	})

	o.spec("Changing credentials encryption mode", function () {
		o("Changing encryption mode", async function () {
			const oldEncryptionMode = CredentialEncryptionMode.SYSTEM_PASSWORD
			const newEncryptionMode = CredentialEncryptionMode.DEVICE_LOCK

			when(nativeCredentialFacadeMock.getCredentialEncryptionMode()).thenResolve(oldEncryptionMode)

			await credentialsProvider.setCredentialEncryptionMode(newEncryptionMode)

			verify(nativeCredentialFacadeMock.setCredentialEncryptionMode(newEncryptionMode))
		})
	})

	o.spec("clearCredentials", function () {
		o.beforeEach(function () {
			when(nativeCredentialFacadeMock.loadAll()).thenResolve([encryptedInternalCredentials, encryptedExternalCredentials])
		})
		o("deleted credentials, key and mode", async function () {
			await credentialsProvider.clearCredentials("testing")

			verify(nativeCredentialFacadeMock.clear())
		})
	})

	o.spec("replace the stored password", function () {
		const userId = "userId"
		const credentials: CredentialsInfo = {
			login: "login",
			userId: userId,
			type: CredentialType.Internal,
		}
		const persistentCredentials: PersistedCredentials = {
			credentialInfo: credentials,
			accessToken: stringToUtf8Uint8Array("accessToken"),
			databaseKey: new Uint8Array([1, 2, 3]),
			encryptedPassword: "old encrypted password",
			encryptedPassphraseKey: null,
		}
		const newEncryptedPassword = "uhagre2"
		const newEncryptedPassphraseKey = new Uint8Array([0x0, 0x0e, 0x9])
		o.beforeEach(function () {
			when(nativeCredentialFacadeMock.loadAll()).thenResolve([persistentCredentials])
		})

		o("replace only", async function () {
			await credentialsProvider.replacePassword(credentials, newEncryptedPassword, newEncryptedPassphraseKey)

			verify(
				nativeCredentialFacadeMock.storeEncrypted({
					credentialInfo: credentials,
					accessToken: stringToUtf8Uint8Array("accessToken"),
					databaseKey: new Uint8Array([1, 2, 3]),
					encryptedPassword: newEncryptedPassword,
					encryptedPassphraseKey: newEncryptedPassphraseKey,
				}),
			)
		})
	})
})
