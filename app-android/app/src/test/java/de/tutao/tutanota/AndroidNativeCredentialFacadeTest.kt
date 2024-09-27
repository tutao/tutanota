package de.tutao.tutanota

import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.CredentialType
import de.tutao.tutashared.credentials.AndroidNativeCredentialsFacade
import de.tutao.tutashared.credentials.CredentialEncryptionMode
import de.tutao.tutashared.credentials.CredentialsDao
import de.tutao.tutashared.credentials.KeychainEncryption
import de.tutao.tutashared.credentials.PersistedCredentialsEntity
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.data.KeyBinaryDao
import de.tutao.tutashared.data.KeyValueDao
import de.tutao.tutashared.ipc.CredentialsInfo
import de.tutao.tutashared.ipc.PersistedCredentials
import de.tutao.tutashared.ipc.UnencryptedCredentials
import de.tutao.tutashared.ipc.wrap
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.stub
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.ConscryptMode

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
@ConscryptMode(ConscryptMode.Mode.OFF)
class AndroidNativeCredentialFacadeTest {
	var crypto: AndroidNativeCryptoFacade = mock() {
		on { generateIv() } doReturn byteArrayOf(0x0, 0x0, 0x03)
	}
	var keychainEncryption: KeychainEncryption = mock()
	var keyValueDao: KeyValueDao = mock()
	val keyBinaryDao: KeyBinaryDao = mock()
	var credentialsDao: CredentialsDao = mock()
	var db: AppDatabase = mock() {
		on { credentialsDao() } doReturn credentialsDao
		on { keyValueDao() } doReturn keyValueDao
		on { keyBinaryDao() } doReturn keyBinaryDao
	}
	lateinit var facade: AndroidNativeCredentialsFacade

	val encryptedCredentials1 = PersistedCredentials(
		credentialInfo = CredentialsInfo(
			login = "login1@test.com",
			type = CredentialType.INTERNAL,
			userId = "user1"
		),
		encryptedPassword = "pw1",
		databaseKey = byteArrayOf(0x01, 0x0d, 0x0e).wrap(),
		accessToken = byteArrayOf(0x01, 0x0a, 0x0e).wrap(),
		encryptedPassphraseKey = null,
	)

	val decryptedCredentials1 = UnencryptedCredentials(
		credentialInfo = CredentialsInfo(
			login = "login1@test.com",
			type = CredentialType.INTERNAL,
			userId = "user1"
		),
		encryptedPassword = "pw1",
		databaseKey = byteArrayOf(0x01, 0x0d, 0x0d).wrap(),
		accessToken = "decAccessToken1",
		encryptedPassphraseKey = null,
	)

	val credentialsEntity1 = PersistedCredentialsEntity(
		login = encryptedCredentials1.credentialInfo.login,
		type = encryptedCredentials1.credentialInfo.type,
		userId = encryptedCredentials1.credentialInfo.userId,
		encryptedPassword = encryptedCredentials1.encryptedPassword,
		databaseKey = encryptedCredentials1.databaseKey?.data,
		accessToken = encryptedCredentials1.accessToken.data,
		encryptedPassphraseKey = null,
	)

	val encryptedCredentials2 = PersistedCredentials(
		credentialInfo = CredentialsInfo(
			login = "login2@test.com",
			type = CredentialType.INTERNAL,
			userId = "user2"
		),
		encryptedPassword = "pw2",
		databaseKey = byteArrayOf(0x02, 0x0d, 0x0e).wrap(),
		accessToken = byteArrayOf(0x02, 0x0a, 0x0e).wrap(),
		encryptedPassphraseKey = byteArrayOf(0x02, 0x0b, 0x0e).wrap(),
	)

	val decryptedCredentials2 = UnencryptedCredentials(
		credentialInfo = CredentialsInfo(
			login = "login2@test.com",
			type = CredentialType.INTERNAL,
			userId = "user2"
		),
		encryptedPassword = "pw2",
		databaseKey = byteArrayOf(0x02, 0x0d, 0x0d).wrap(),
		accessToken = "decAccessToken2",
		encryptedPassphraseKey = byteArrayOf(0x02, 0x0b, 0x0e).wrap(),
	)

	val credentialsEntity2 = PersistedCredentialsEntity(
		login = encryptedCredentials2.credentialInfo.login,
		type = encryptedCredentials2.credentialInfo.type,
		userId = encryptedCredentials2.credentialInfo.userId,
		encryptedPassword = encryptedCredentials2.encryptedPassword,
		databaseKey = encryptedCredentials2.databaseKey?.data,
		accessToken = encryptedCredentials2.accessToken.data,
		encryptedPassphraseKey = byteArrayOf(0x02, 0x0b, 0x0e),
	)

	val encCredentialsKey = byteArrayOf(0x0e)
	val decCredentialsKey = byteArrayOf(0x0d)

	@Before
	fun setup() {
		facade = AndroidNativeCredentialsFacade(
			crypto,
			keychainEncryption,
			db,
		)
	}

	@Test
	fun `deleteByUserId deletes is from the db`(): Unit = runTest {
		val userId = "user1"
		facade.deleteByUserId(userId)
		verify(credentialsDao).deletePersistedCredentials(userId)
	}

	@Test
	fun `getCredentialEncryptionMode returns null from the db`() = runTest {
		keyValueDao.stub {
			on { getString(AndroidNativeCredentialsFacade.CREDENTIALS_ENCRYPTION_MODE_KEY) } doReturn null
		}
		assertEquals(null, facade.getCredentialEncryptionMode())
	}

	@Test
	fun `getCredentialEncryptionMode returns mode from the db`() = runTest {
		sayHadStoredEncryptionMode(CredentialEncryptionMode.SYSTEM_PASSWORD)
		assertEquals(CredentialEncryptionMode.SYSTEM_PASSWORD, facade.getCredentialEncryptionMode())
	}

	@Test
	fun `loadAll returns credentials from the db`() = runTest {
		sayHadCredentials(listOf(credentialsEntity1, credentialsEntity2))
		assertEquals(listOf(encryptedCredentials1, encryptedCredentials2), facade.loadAll())
	}

	@Test
	fun `loadByUserId $ when there is a key it is used to decrypt credentials, wo passphraseKey`() = runTest {
		sayHadStoredEncryptionKey(encCredentialsKey)
		sayHadStoredEncryptionMode(CredentialEncryptionMode.DEVICE_LOCK)
		sayHadCredentials(listOf(credentialsEntity1, credentialsEntity2))
		sayCredentialKeyCanBeDecrypted(CredentialEncryptionMode.DEVICE_LOCK)
		sayCanDecrypt(
			decCredentialsKey,
			encryptedCredentials1.databaseKey!!.data,
			decryptedCredentials1.databaseKey!!.data
		)
		sayCanDecrypt(
			decCredentialsKey,
			encryptedCredentials1.accessToken.data,
			decryptedCredentials1.accessToken.toByteArray()
		)
		assertEquals(decryptedCredentials1, facade.loadByUserId("user1"))
	}

	@Test
	fun `loadByUserId $ when there is a key it is used to decrypt credentials, w passphraseKey`() = runTest {
		sayHadStoredEncryptionKey(encCredentialsKey)
		sayHadStoredEncryptionMode(CredentialEncryptionMode.DEVICE_LOCK)
		sayHadCredentials(listOf(credentialsEntity1, credentialsEntity2))
		sayCredentialKeyCanBeDecrypted(CredentialEncryptionMode.DEVICE_LOCK)
		sayCanDecrypt(
			decCredentialsKey,
			encryptedCredentials2.databaseKey!!.data,
			decryptedCredentials2.databaseKey!!.data
		)
		sayCanDecrypt(
			decCredentialsKey,
			encryptedCredentials2.accessToken.data,
			decryptedCredentials2.accessToken.toByteArray()
		)
		assertEquals(decryptedCredentials2, facade.loadByUserId("user2"))
	}

	@Test
	fun `loadByUserId $ when another mode is selected it is used`() = runTest {
		sayHadStoredEncryptionKey(encCredentialsKey)
		sayHadStoredEncryptionMode(CredentialEncryptionMode.SYSTEM_PASSWORD)
		sayHadCredentials(listOf(credentialsEntity1, credentialsEntity2))
		sayCredentialKeyCanBeDecrypted(CredentialEncryptionMode.SYSTEM_PASSWORD)
		sayCanDecrypt(
			decCredentialsKey,
			encryptedCredentials1.databaseKey!!.data,
			decryptedCredentials1.databaseKey!!.data
		)
		sayCanDecrypt(
			decCredentialsKey,
			encryptedCredentials1.accessToken.data,
			decryptedCredentials1.accessToken.toByteArray()
		)
		assertEquals(decryptedCredentials1, facade.loadByUserId("user1"))
	}

	@Test
	fun `store $ when there's a key, it is used`() = runTest {
		sayHadStoredEncryptionKey(encCredentialsKey)
		sayHadStoredEncryptionMode(CredentialEncryptionMode.DEVICE_LOCK)
		sayHadCredentials(listOf())
		sayCredentialKeyCanBeDecrypted(CredentialEncryptionMode.DEVICE_LOCK)

		sayCanEncrypt(
			decCredentialsKey,
			decryptedCredentials1.databaseKey!!.data,
			encryptedCredentials1.databaseKey!!.data
		)
		sayCanEncrypt(
			decCredentialsKey,
			decryptedCredentials1.accessToken.toByteArray(),
			encryptedCredentials1.accessToken.data
		)
		facade.store(decryptedCredentials1)
		verify(credentialsDao).insertPersistedCredentials(credentialsEntity1)
	}

	@Test
	fun `store $ when there is no key, it generates and stores one`() = runTest {
		sayHadStoredEncryptionKey(null)
		sayGeneratesAesKey(decCredentialsKey)
		sayHadStoredEncryptionMode(CredentialEncryptionMode.DEVICE_LOCK)
		sayHadCredentials(listOf())
		sayCredentialKeyCanBeEncrypted(CredentialEncryptionMode.DEVICE_LOCK)
		sayCanEncrypt(
			decCredentialsKey,
			decryptedCredentials1.databaseKey!!.data,
			encryptedCredentials1.databaseKey!!.data
		)
		sayCanEncrypt(
			decCredentialsKey,
			decryptedCredentials1.accessToken.toByteArray(),
			encryptedCredentials1.accessToken.data
		)
		facade.store(decryptedCredentials1)
		verify(credentialsDao).insertPersistedCredentials(credentialsEntity1)
		verify(keyBinaryDao).put(AndroidNativeCredentialsFacade.CREDENTIALS_ENCRYPTION_KEY_KEY, encCredentialsKey)
	}

	@Test
	fun `migrate stores everything`() = runTest {
		facade.migrateToNativeCredentials(
			listOf(encryptedCredentials1, encryptedCredentials2),
			CredentialEncryptionMode.SYSTEM_PASSWORD,
			encCredentialsKey.wrap()
		)
		verify(keyValueDao).putString(
			AndroidNativeCredentialsFacade.CREDENTIALS_ENCRYPTION_MODE_KEY,
			CredentialEncryptionMode.SYSTEM_PASSWORD.name
		)
		verify(keyBinaryDao).put(AndroidNativeCredentialsFacade.CREDENTIALS_ENCRYPTION_KEY_KEY, encCredentialsKey)
		verify(credentialsDao).insertPersistedCredentials(credentialsEntity1)
		verify(credentialsDao).insertPersistedCredentials(credentialsEntity2)
	}

	private fun sayGeneratesAesKey(key: ByteArray) {
		crypto.stub {
			on { generateAes256Key() } doReturn key
		}
	}

	private fun sayCanDecrypt(key: ByteArray, encrypted: ByteArray, result: ByteArray) {
		crypto.stub {
			on {
				aesDecryptData(
					key,
					encrypted
				)
			} doReturn result
		}
	}

	private fun sayCanEncrypt(key: ByteArray, plaintext: ByteArray, result: ByteArray) {
		crypto.stub {
			on {
				aesEncryptData(
					eq(key),
					eq(plaintext),
					any()
				)
			} doReturn result
		}
	}

	private fun sayCredentialKeyCanBeEncrypted(mode: CredentialEncryptionMode) {
		keychainEncryption.stub {
			onBlocking {
				encryptUsingKeychain(
					decCredentialsKey,
					mode
				)
			} doReturn encCredentialsKey
		}
	}

	private fun sayCredentialKeyCanBeDecrypted(mode: CredentialEncryptionMode) {
		keychainEncryption.stub {
			onBlocking {
				decryptUsingKeychain(
					encCredentialsKey,
					mode
				)
			} doReturn decCredentialsKey
		}
	}

	private fun sayHadStoredEncryptionMode(mode: CredentialEncryptionMode) {
		keyValueDao.stub {
			on { getString(AndroidNativeCredentialsFacade.CREDENTIALS_ENCRYPTION_MODE_KEY) } doReturn mode.name
		}
	}

	private fun sayHadStoredEncryptionKey(key: ByteArray?) {
		keyBinaryDao.stub {
			on { get(AndroidNativeCredentialsFacade.CREDENTIALS_ENCRYPTION_KEY_KEY) } doReturn key
		}
	}

	private fun sayHadCredentials(credentials: List<PersistedCredentialsEntity>) {
		credentialsDao.stub {
			on { allPersistedCredentials() } doReturn credentials
		}
	}
}