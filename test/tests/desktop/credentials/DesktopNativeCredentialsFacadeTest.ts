import o from "@tutao/otest"
import { DesktopNativeCredentialsFacade } from "../../../../src/common/desktop/credentials/DesktopNativeCredentialsFacade.js"
import { DesktopNativeCryptoFacade } from "../../../../src/common/desktop/DesktopNativeCryptoFacade.js"
import { object, verify, when } from "testdouble"
import { DesktopCredentialsStorage } from "../../../../src/common/desktop/db/DesktopCredentialsStorage.js"
import { KeychainEncryption } from "../../../../src/common/desktop/credentials/KeychainEncryption.js"
import { CredentialEncryptionMode } from "../../../../src/common/misc/credentials/CredentialEncryptionMode.js"
import { PersistedCredentials } from "../../../../src/common/native/common/generatedipc/PersistedCredentials.js"
import { CredentialType } from "../../../../src/common/misc/credentials/CredentialType.js"
import { uint8ArrayToBitArray } from "@tutao/tutanota-crypto"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { UnencryptedCredentials } from "../../../../src/common/native/common/generatedipc/UnencryptedCredentials.js"

o.spec("DesktopNativeCredentialsFacade", () => {
	const crypto: DesktopNativeCryptoFacade = object()
	const credentialsDb: DesktopCredentialsStorage = object()
	const keychainEncryption: KeychainEncryption = object()
	let facade: DesktopNativeCredentialsFacade

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

	const decryptedCredentials1: UnencryptedCredentials = {
		credentialInfo: {
			login: "login1@test.com",
			type: CredentialType.Internal,
			userId: "user1",
		},
		encryptedPassword: "pw1",
		encryptedPassphraseKey: null,
		databaseKey: new Uint8Array([0x01, 0x0d, 0x0d]),
		accessToken: "decAccessToken1",
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

	const decryptedCredentials2: UnencryptedCredentials = {
		credentialInfo: {
			login: "login2@test.com",
			type: CredentialType.Internal,
			userId: "user2",
		},
		encryptedPassword: "pw2",
		encryptedPassphraseKey: new Uint8Array([0x02, 0x0b, 0x0e]),
		databaseKey: new Uint8Array([0x02, 0x0d, 0x0d]),
		accessToken: "decAccessToken2",
	}

	const encCredentialsKey = new Uint8Array([0x0e])
	const decCredentialsKey = new Uint8Array([0x0d])

	o.beforeEach(() => {
		facade = new DesktopNativeCredentialsFacade(crypto, credentialsDb, keychainEncryption)
	})

	o.test("deleteByUserId deletes it from the db", async () => {
		const userId = "user1"
		await facade.deleteByUserId(userId)
		verify(credentialsDb.deleteByUserId(userId))
	})

	o.test("getCredentialEncryptionMode returns null from the db", async () => {
		when(credentialsDb.getCredentialEncryptionMode()).thenReturn(null)
		o(await facade.getCredentialEncryptionMode()).equals(null)
	})

	o.test("getCredentialEncryptionMode returns mode from the db", async () => {
		when(credentialsDb.getCredentialEncryptionMode()).thenReturn(CredentialEncryptionMode.APP_PASSWORD)
		o(await facade.getCredentialEncryptionMode()).equals(CredentialEncryptionMode.APP_PASSWORD)
	})

	o.test("loadAll returns credentials from the db", async () => {
		const credentials: PersistedCredentials[] = [encryptedCredentials1, encryptedCredentials2]
		when(credentialsDb.getAllCredentials()).thenReturn(credentials)
		o(await facade.loadAll()).deepEquals(credentials)
	})

	o.spec("loadByUserId", () => {
		o.test("when there is a key it is used to decrypt credentials w/o passphrase key", async () => {
			when(credentialsDb.getCredentialEncryptionKey()).thenReturn(encCredentialsKey)
			when(credentialsDb.getCredentialEncryptionMode()).thenReturn(CredentialEncryptionMode.DEVICE_LOCK)
			when(credentialsDb.getCredentialsByUserId("user1")).thenReturn(encryptedCredentials1)
			when(keychainEncryption.decryptUsingKeychain(encCredentialsKey, CredentialEncryptionMode.DEVICE_LOCK)).thenResolve(decCredentialsKey)
			when(crypto.aesDecryptBytes(uint8ArrayToBitArray(decCredentialsKey), encryptedCredentials1.databaseKey!)).thenReturn(
				decryptedCredentials1.databaseKey!,
			)
			when(crypto.aesDecryptBytes(uint8ArrayToBitArray(decCredentialsKey), encryptedCredentials1.accessToken)).thenReturn(
				stringToUtf8Uint8Array(decryptedCredentials1.accessToken),
			)

			const decryptedCredentials = await facade.loadByUserId("user1")
			o(decryptedCredentials).deepEquals(decryptedCredentials1)
		})

		o.test("when there is a key it is used to decrypt credentials w/ passphrase key", async () => {
			when(credentialsDb.getCredentialEncryptionKey()).thenReturn(encCredentialsKey)
			when(credentialsDb.getCredentialEncryptionMode()).thenReturn(CredentialEncryptionMode.DEVICE_LOCK)
			when(credentialsDb.getCredentialsByUserId("user2")).thenReturn(encryptedCredentials2)
			when(keychainEncryption.decryptUsingKeychain(encCredentialsKey, CredentialEncryptionMode.DEVICE_LOCK)).thenResolve(decCredentialsKey)
			when(crypto.aesDecryptBytes(uint8ArrayToBitArray(decCredentialsKey), encryptedCredentials2.databaseKey!)).thenReturn(
				decryptedCredentials2.databaseKey!,
			)
			when(crypto.aesDecryptBytes(uint8ArrayToBitArray(decCredentialsKey), encryptedCredentials2.accessToken)).thenReturn(
				stringToUtf8Uint8Array(decryptedCredentials2.accessToken),
			)

			const decryptedCredentials = await facade.loadByUserId("user2")
			o(decryptedCredentials).deepEquals(decryptedCredentials2)
		})

		o.test("when another mode is selected it is used", async () => {
			when(credentialsDb.getCredentialEncryptionKey()).thenReturn(encCredentialsKey)
			when(credentialsDb.getCredentialEncryptionMode()).thenReturn(CredentialEncryptionMode.APP_PASSWORD)
			when(credentialsDb.getCredentialsByUserId("user1")).thenReturn(encryptedCredentials1)
			when(keychainEncryption.decryptUsingKeychain(encCredentialsKey, CredentialEncryptionMode.APP_PASSWORD)).thenResolve(decCredentialsKey)
			when(crypto.aesDecryptBytes(uint8ArrayToBitArray(decCredentialsKey), encryptedCredentials1.databaseKey!)).thenReturn(
				decryptedCredentials1.databaseKey!,
			)
			when(crypto.aesDecryptBytes(uint8ArrayToBitArray(decCredentialsKey), encryptedCredentials1.accessToken)).thenReturn(
				stringToUtf8Uint8Array(decryptedCredentials1.accessToken),
			)

			const decryptedCredentials = await facade.loadByUserId("user1")
			o(decryptedCredentials).deepEquals(decryptedCredentials1)
		})

		o.spec("store", () => {
			o.test("when there is a key, it is used", async () => {
				when(credentialsDb.getCredentialEncryptionKey()).thenReturn(encCredentialsKey)
				when(credentialsDb.getCredentialEncryptionMode()).thenReturn(CredentialEncryptionMode.DEVICE_LOCK)
				when(credentialsDb.getCredentialsByUserId("user1")).thenReturn(encryptedCredentials1)
				when(keychainEncryption.decryptUsingKeychain(encCredentialsKey, CredentialEncryptionMode.DEVICE_LOCK)).thenResolve(decCredentialsKey)
				when(crypto.aesEncryptBytes(uint8ArrayToBitArray(decCredentialsKey), decryptedCredentials1.databaseKey!)).thenReturn(
					encryptedCredentials1.databaseKey!,
				)
				when(crypto.aesEncryptBytes(uint8ArrayToBitArray(decCredentialsKey), stringToUtf8Uint8Array(decryptedCredentials1.accessToken))).thenReturn(
					encryptedCredentials1.accessToken,
				)

				await facade.store(decryptedCredentials1)
				verify(credentialsDb.store(encryptedCredentials1))
			})

			o.test("when there is no key, it generates and stores one", async () => {
				when(credentialsDb.getCredentialEncryptionKey()).thenReturn(null)
				when(crypto.generateDeviceKey()).thenReturn(uint8ArrayToBitArray(decCredentialsKey))
				when(credentialsDb.getCredentialEncryptionMode()).thenReturn(CredentialEncryptionMode.DEVICE_LOCK)
				when(credentialsDb.getCredentialsByUserId("user1")).thenReturn(encryptedCredentials1)
				when(crypto.aesEncryptBytes(uint8ArrayToBitArray(decCredentialsKey), decryptedCredentials1.databaseKey!)).thenReturn(
					encryptedCredentials1.databaseKey!,
				)
				when(crypto.aesEncryptBytes(uint8ArrayToBitArray(decCredentialsKey), stringToUtf8Uint8Array(decryptedCredentials1.accessToken))).thenReturn(
					encryptedCredentials1.accessToken,
				)
				when(keychainEncryption.encryptUsingKeychain(decCredentialsKey, CredentialEncryptionMode.DEVICE_LOCK)).thenResolve(encCredentialsKey)

				await facade.store(decryptedCredentials1)
				verify(credentialsDb.store(encryptedCredentials1))
				verify(credentialsDb.setCredentialEncryptionKey(encCredentialsKey))
			})
		})

		o.test("migrate stores everything", async () => {
			await facade.migrateToNativeCredentials([encryptedCredentials1, encryptedCredentials2], CredentialEncryptionMode.APP_PASSWORD, encCredentialsKey)
			verify(credentialsDb.setCredentialEncryptionMode(CredentialEncryptionMode.APP_PASSWORD))
			verify(credentialsDb.setCredentialEncryptionKey(encCredentialsKey))
			verify(credentialsDb.store(encryptedCredentials1))
			verify(credentialsDb.store(encryptedCredentials2))
		})
	})
})
