package de.tutao.tutanota

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.security.keystore.KeyProperties
import android.util.Log
import de.tutao.tutanota.CryptoError
import de.tutao.tutanota.credentials.CredentialEncryptionMode
import de.tutao.tutanota.credentials.DataKeyGenerator
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.security.*
import java.security.cert.CertificateException
import javax.crypto.*
import javax.crypto.spec.IvParameterSpec

/**
 * Used to access keys stored in Android KeyStore and do cryptographic operations with them.
 */
class AndroidKeyStoreFacade(context: Context, private val dataKeyGenerator: DataKeyGenerator) {
	@Volatile
	private var keyStore: KeyStore? = null
	private val crypto: Crypto = Crypto(context)

	@get:Throws(KeyStoreException::class)
	@get:Synchronized
	private val orInitKeyStore: KeyStore?
		get() {
			if (keyStore != null) {
				return keyStore
			}
			try {
				val keyStore = KeyStore.getInstance(AndroidKeyStore)
				this.keyStore = keyStore

				keyStore.load(null)
				if (!keyStore.containsAlias(SYMMETRIC_KEY_ALIAS) && !keyStore.containsAlias(ASYMMETRIC_KEY_ALIAS)) {
					generateSymmetricKey()
				}
			} catch (e: NoSuchAlgorithmException) {
				Log.w(TAG, "Keystore could not be initialized", e)
				throw RuntimeException(e)
			} catch (e: NoSuchProviderException) {
				Log.w(TAG, "Keystore could not be initialized", e)
				throw RuntimeException(e)
			} catch (e: InvalidAlgorithmParameterException) {
				Log.w(TAG, "Keystore could not be initialized", e)
				throw RuntimeException(e)
			} catch (e: IOException) {
				Log.w(TAG, "Keystore could not be initialized", e)
				throw RuntimeException(e)
			} catch (e: CertificateException) {
				Log.w(TAG, "Keystore could not be initialized", e)
				throw RuntimeException(e)
			}
			return keyStore
		}

	@Throws(KeyStoreException::class, CryptoError::class)
	fun encryptKey(sessionKey: ByteArray): ByteArray {
		val keyStore = orInitKeyStore

		// If we started using asymmetric encryption on the previous Android version, we keep using uit
		return if (keyStore!!.containsAlias(ASYMMETRIC_KEY_ALIAS)) {
			val publicKey = keyStore.getCertificate(ASYMMETRIC_KEY_ALIAS).publicKey
			try {
				createRSACipher(publicKey, Cipher.ENCRYPT_MODE).doFinal(sessionKey)
			} catch (e: BadPaddingException) {
				throw CryptoError(e)
			} catch (e: IllegalBlockSizeException) {
				throw CryptoError(e)
			}
		} else {
			val key = symmetricKey
			crypto.encryptKey(key, sessionKey)
		}
	}

	@Throws(UnrecoverableEntryException::class, KeyStoreException::class, CryptoError::class)
	fun decryptKey(encSessionKey: ByteArray?): ByteArray? {
		val keyStore = orInitKeyStore

		// If we started using asymmetric encryption on the previous Android version, we keep using uit
		return if (keyStore!!.containsAlias(ASYMMETRIC_KEY_ALIAS)) {
			val privateKey: PrivateKey
			try {
				privateKey = keyStore.getKey(ASYMMETRIC_KEY_ALIAS, null) as PrivateKey
				createRSACipher(privateKey, Cipher.DECRYPT_MODE).doFinal(encSessionKey)
			} catch (e: NoSuchAlgorithmException) {
				throw RuntimeException(e)
			} catch (e: BadPaddingException) {
				throw CryptoError(e)
			} catch (e: IllegalBlockSizeException) {
				throw CryptoError(e)
			}
		} else {
			val key = symmetricKey
			crypto.decryptKey(key, encSessionKey)
		}
	}

	/**
	 * Encrypt {@param data} using {@param cipher}. Assumes symmetric encryption.
	 * Cipher must be properly initialized.
	 * @param data
	 * @param cipher
	 * @return encrypted data
	 * @throws CryptoError when key in cipher is invalid
	 */
	@Throws(CryptoError::class)
	fun encryptData(data: ByteArray?, cipher: Cipher?): ByteArray {
		return try {
			val encryptedData = cipher!!.doFinal(data)
			val iv = cipher.iv
			val baos = ByteArrayOutputStream(encryptedData.size + iv.size)
			try {
				baos.write(iv)
				baos.write(encryptedData)
			} catch (e: IOException) {
				throw RuntimeException(e)
			}
			baos.toByteArray()
		} catch (e: BadPaddingException) {
			throw CryptoError(e)
		} catch (e: IllegalBlockSizeException) {
			throw CryptoError(e)
		}
	}

	/**
	 * Decrypt {@param dataToDecrypt} using {@param cipher}. Assumes symmetric encryption.
	 * Cipher must be properly initialized.
	 * @param dataToDecrypt
	 * @param cipher
	 * @return decrypted data
	 * @throws CryptoError when key in cipher is invalid
	 */
	@Throws(CryptoError::class)
	fun decryptData(dataToDecrypt: ByteArray, cipher: Cipher): ByteArray {
		val actualData = getData(dataToDecrypt)
		return try {
			cipher.doFinal(actualData)
		} catch (e: BadPaddingException) {
			throw CryptoError(e)
		} catch (e: IllegalBlockSizeException) {
			throw CryptoError(e)
		}
	}

	/**
	 * Get initialized cipher for encryption. Cipher will be configured for AES-CBC-PKC7 algorithm.
	 * @param encryptionMode
	 * @return
	 * @throws KeyStoreException if the data key for encryption mode cannot be accessed.
	 */
	@Throws(KeyStoreException::class, KeyPermanentlyInvalidatedException::class)
	fun getCipherForEncryptionMode(encryptionMode: CredentialEncryptionMode): Cipher {
		val key = getDataKey(encryptionMode)
		val cipher: Cipher
		cipher = try {
			Cipher.getInstance(AES_DATA_ALGORITHM, ANDROID_KEY_STORE_BC_WORKAROUND)
		} catch (e: NoSuchAlgorithmException) {
			throw RuntimeException(e)
		} catch (e: NoSuchPaddingException) {
			throw RuntimeException(e)
		} catch (e: NoSuchProviderException) {
			throw RuntimeException(e)
		}
		try {
			cipher.init(Cipher.ENCRYPT_MODE, key)
		} catch (e: KeyPermanentlyInvalidatedException) {
			keyStore!!.deleteEntry(keyAliasForEncryptionMode(encryptionMode))
			throw e
		} catch (e: InvalidKeyException) {
			throw KeyStoreException(e)
		}
		return cipher
	}

	/**
	 * Get initialized cipher for decryption. Will use {@param dataToBeDecrypted} to extract IV.
	 * Cipher will be configured for AES-CBC-PKC7 algorithm.
	 * @param encryptionMode
	 * @param dataToBeDecrypted
	 * @return
	 * @throws KeyStoreException if the data key for encryption mode cannot be accessed.
	 * @throws CryptoError if encrypted data does not contain valid IV
	 */
	@Throws(KeyPermanentlyInvalidatedException::class, KeyStoreException::class, CryptoError::class)
	fun getCipherForDecryptionMode(encryptionMode: CredentialEncryptionMode, dataToBeDecrypted: ByteArray): Cipher {
		val key = getDataKey(encryptionMode)
		val cipher: Cipher = try {
			Cipher.getInstance(AES_DATA_ALGORITHM, ANDROID_KEY_STORE_BC_WORKAROUND)
		} catch (e: NoSuchAlgorithmException) {
			throw RuntimeException(e)
		} catch (e: NoSuchPaddingException) {
			throw RuntimeException(e)
		} catch (e: NoSuchProviderException) {
			throw RuntimeException(e)
		}
		val iv = getIV(dataToBeDecrypted)
		try {
			cipher.init(Cipher.DECRYPT_MODE, key, IvParameterSpec(iv))
		} catch (e: KeyPermanentlyInvalidatedException) {
			keyStore!!.deleteEntry(keyAliasForEncryptionMode(encryptionMode))
			throw e
		} catch (e: InvalidKeyException) {
			throw KeyStoreException(e)
		} catch (e: InvalidAlgorithmParameterException) {
			throw CryptoError(e)
		}
		return cipher
	}

	@Throws(NoSuchAlgorithmException::class, NoSuchProviderException::class, InvalidAlgorithmParameterException::class)
	private fun generateSymmetricKey() {
		val keyGenerator = KeyGenerator.getInstance("AES", AndroidKeyStore)
		keyGenerator.init(KeyGenParameterSpec.Builder(SYMMETRIC_KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
				.setBlockModes(KeyProperties.BLOCK_MODE_CBC)
				.setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
				.setRandomizedEncryptionRequired(false)
				.build())
		keyGenerator.generateKey()
	}

	@get:Throws(KeyStoreException::class)
	private val symmetricKey: Key
		get() {
			val keyStore = orInitKeyStore
			val key: Key
			key = try {
				keyStore!!.getKey(SYMMETRIC_KEY_ALIAS, null)
			} catch (e: NoSuchAlgorithmException) {
				throw RuntimeException(e)
			} catch (e: UnrecoverableKeyException) {
				throw KeyStoreException(e)
			}
			return key
		}

	@Throws(KeyStoreException::class)
	private fun getDataKey(credentialEncryptionMode: CredentialEncryptionMode): Key? {
		val keyStore = orInitKeyStore
		val alias = keyAliasForEncryptionMode(credentialEncryptionMode)
		return if (keyStore!!.containsAlias(alias)) {
			try {
				keyStore.getKey(alias, null)
			} catch (e: UnrecoverableKeyException) {
				throw KeyStoreException(e)
			} catch (e: NoSuchAlgorithmException) {
				throw RuntimeException(e)
			}
		} else {
			dataKeyGenerator.generateDataKey(alias, credentialEncryptionMode)
		}
	}

	private fun keyAliasForEncryptionMode(encryptionMode: CredentialEncryptionMode): String {
		return when (encryptionMode) {
			CredentialEncryptionMode.ENCRYPTION_MODE_DEVICE_LOCK -> DEVICE_LOCK_DATA_KEY_ALIAS
			CredentialEncryptionMode.ENCRYPTION_MODE_SYSTEM_PASSWORD -> SYSTEM_PASSWORD_DATA_KEY_ALIAS
			CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS -> BIOMETRICS_DATA_KEY_ALIAS
		}
	}

	@Throws(CryptoError::class)
	private fun createRSACipher(key: Key, mode: Int): Cipher {
		// We use separate RSA implementation than Crypto.java and all other encryption because on
		// on API versions < 23 only RSA/ECB/NoPadding and RSA/ECB/PKCS1Padding are supported.
		// See: https://developer.android.com/training/articles/keystore#SupportedCiphers
		return try {
			// Specify provider explicitly, otherwise it picks different ones for encryption &
			// decryption.
			// See https://medium.com/@ericfu/securely-storing-secrets-in-an-android-application-501f030ae5a3
			val cipher = Cipher.getInstance(RSA_ALGORITHM, ANDROID_OPEN_SSL_PROVIDER)
			cipher.init(mode, key)
			cipher
		} catch (e: NoSuchAlgorithmException) {
			throw RuntimeException(e)
		} catch (e: NoSuchPaddingException) {
			throw RuntimeException(e)
		} catch (e: NoSuchProviderException) {
			throw RuntimeException(e)
		} catch (e: InvalidKeyException) {
			throw CryptoError(e)
		}
	}

	private fun getIV(dataAndIV: ByteArray) = dataAndIV.copyOfRange(0, Crypto.AES_BLOCK_SIZE_BYTES)

	private fun getData(dataAndIV: ByteArray) = dataAndIV.copyOfRange(Crypto.AES_BLOCK_SIZE_BYTES, dataAndIV.lastIndex + 1)

	companion object {
		const val TAG = "AndroidKeyStoreFacade"
		private const val AndroidKeyStore = "AndroidKeyStore"

		/**
		 * This is an Android SDK "easter egg"!
		 * https://stackoverflow.com/a/36394097/1923879
		 *
		 * Bouncy Castle was buggy and would say it can handle everything so instead of fixing it and AndroidKeyStore
		 * provider they put another special provider.
		 * Since we *really* want to specify a provider for KeyStore keys (and Android docs even say we **must**) we have
		 * to specify something but specifying AndroidKeyStore does not exactly work so we are stuck with this.
		 */
		private const val ANDROID_KEY_STORE_BC_WORKAROUND = "AndroidKeyStoreBCWorkaround"
		private const val SYMMETRIC_KEY_ALIAS = "TutanotaAppDeviceKey"
		private const val DEVICE_LOCK_DATA_KEY_ALIAS = "DeviceLockDataKey"
		private const val SYSTEM_PASSWORD_DATA_KEY_ALIAS = "SystemPasswordDataKey"
		private const val BIOMETRICS_DATA_KEY_ALIAS = "BIometricsDataKey"
		private const val ASYMMETRIC_KEY_ALIAS = "TutanotaAppDeviceAsymmetricKey"
		private const val RSA_ALGORITHM = "RSA/ECB/PKCS1Padding"
		private const val AES_DATA_ALGORITHM = "AES/CBC/PKCS7Padding"
		private const val ANDROID_OPEN_SSL_PROVIDER = "AndroidOpenSSL"
	}

}