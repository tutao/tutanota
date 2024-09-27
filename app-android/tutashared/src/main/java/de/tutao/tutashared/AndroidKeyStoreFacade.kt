package de.tutao.tutashared

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.security.keystore.KeyProperties
import android.util.Log
import de.tutao.tutashared.credentials.CredentialEncryptionMode
import de.tutao.tutashared.credentials.DataKeyGenerator
import java.io.ByteArrayOutputStream
import java.security.*
import javax.crypto.BadPaddingException
import javax.crypto.Cipher
import javax.crypto.IllegalBlockSizeException
import javax.crypto.KeyGenerator
import javax.crypto.spec.IvParameterSpec

/**
 * Used to access keys stored in Android KeyStore and do cryptographic operations with them.
 */
class AndroidKeyStoreFacade(
	private val dataKeyGenerator: DataKeyGenerator
) {
	private val keyStore: KeyStore by lazy(LazyThreadSafetyMode.SYNCHRONIZED) {
		try {
			val keyStore = KeyStore.getInstance(AndroidKeyStore)

			keyStore.load(null)
			if (!keyStore.containsAlias(SYMMETRIC_KEY_ALIAS) && !keyStore.containsAlias(ASYMMETRIC_KEY_ALIAS)) {
				generateSymmetricKey()
			}

			keyStore
		} catch (e: Throwable) {
			Log.w(TAG, "Keystore could not be initialized", e)
			throw e
		}
	}

	@Throws(KeyStoreException::class, CryptoError::class)
	fun encryptKey(sessionKey: ByteArray): ByteArray {
		// If we started using asymmetric encryption on the previous Android version, we keep using uit
		return if (keyStore.containsAlias(ASYMMETRIC_KEY_ALIAS)) {
			val publicKey = keyStore.getCertificate(ASYMMETRIC_KEY_ALIAS).publicKey
			try {
				createRSACipher(publicKey, Cipher.ENCRYPT_MODE).doFinal(sessionKey)
			} catch (e: BadPaddingException) {
				throw CryptoError(e)
			} catch (e: IllegalBlockSizeException) {
				throw CryptoError(e)
			}
		} else {
			val key = getSymmetricKey()
			encryptKeyStoreKey(key, sessionKey)
		}
	}

	@Throws(UnrecoverableEntryException::class, KeyStoreException::class, CryptoError::class)
	fun decryptKey(encSessionKey: ByteArray): ByteArray? {
		// If we started using asymmetric encryption on the previous Android version, we keep using it
		return if (keyStore.containsAlias(ASYMMETRIC_KEY_ALIAS)) {
			val privateKey: PrivateKey
			try {
				privateKey = keyStore.getKey(ASYMMETRIC_KEY_ALIAS, null) as PrivateKey
				createRSACipher(privateKey, Cipher.DECRYPT_MODE).doFinal(encSessionKey)
			} catch (e: BadPaddingException) {
				throw CryptoError(e)
			} catch (e: IllegalBlockSizeException) {
				throw CryptoError(e)
			}
		} else {
			val key = getSymmetricKey()
			decryptKeyStoreKey(key, encSessionKey)
		}
	}

	private fun encryptKeyStoreKey(encryptionKey: Key, keyToEncryptWithoutIv: ByteArray): ByteArray {
		return try {
			val cipher = Cipher.getInstance(AndroidNativeCryptoFacade.AES_MODE_NO_PADDING)
			val params = IvParameterSpec(AndroidNativeCryptoFacade.FIXED_IV)
			cipher.init(Cipher.ENCRYPT_MODE, encryptionKey, params)
			cipher.doFinal(keyToEncryptWithoutIv)
		} catch (e: BadPaddingException) {
			throw CryptoError(e)
		} catch (e: IllegalBlockSizeException) {
			throw CryptoError(e)
		} catch (e: InvalidKeyException) {
			throw CryptoError(e)
		}
	}

	private fun decryptKeyStoreKey(encryptionKey: Key, encryptedKeyWithoutIV: ByteArray): ByteArray {
		return try {
			val cipher = Cipher.getInstance(AndroidNativeCryptoFacade.AES_MODE_NO_PADDING)
			val params = IvParameterSpec(AndroidNativeCryptoFacade.FIXED_IV)
			cipher.init(Cipher.DECRYPT_MODE, encryptionKey, params)
			cipher.doFinal(encryptedKeyWithoutIV)
		} catch (e: BadPaddingException) {
			throw CryptoError(e)
		} catch (e: IllegalBlockSizeException) {
			throw CryptoError(e)
		} catch (e: InvalidKeyException) {
			throw CryptoError(e)
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
	fun encryptData(data: ByteArray, cipher: Cipher): ByteArray {
		return try {
			val encryptedData = cipher.doFinal(data)
			val iv = cipher.iv
			val baos = ByteArrayOutputStream(encryptedData.size + iv.size)
			baos.write(iv)
			baos.write(encryptedData)
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
		val cipher = Cipher.getInstance(AES_DATA_ALGORITHM, ANDROID_KEY_STORE_BC_WORKAROUND)
		try {
			cipher.init(Cipher.ENCRYPT_MODE, key)
		} catch (e: KeyPermanentlyInvalidatedException) {
			keyStore.deleteEntry(keyAliasForEncryptionMode(encryptionMode))
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
		val cipher = Cipher.getInstance(AES_DATA_ALGORITHM, ANDROID_KEY_STORE_BC_WORKAROUND)

		val iv = getIV(dataToBeDecrypted)
		try {
			cipher.init(Cipher.DECRYPT_MODE, key, IvParameterSpec(iv))
		} catch (e: KeyPermanentlyInvalidatedException) {
			keyStore.deleteEntry(keyAliasForEncryptionMode(encryptionMode))
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
		keyGenerator.init(
			KeyGenParameterSpec.Builder(
				SYMMETRIC_KEY_ALIAS,
				KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
			)
				.setBlockModes(KeyProperties.BLOCK_MODE_CBC)
				.setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
				.setRandomizedEncryptionRequired(false)
				.build()
		)
		keyGenerator.generateKey()
	}

	@Throws(KeyStoreException::class)
	private fun getSymmetricKey(): Key {
		return try {
			keyStore.getKey(SYMMETRIC_KEY_ALIAS, null)
		} catch (e: UnrecoverableKeyException) {
			throw KeyStoreException(e)
		}
	}

	@Throws(KeyStoreException::class)
	private fun getDataKey(credentialEncryptionMode: CredentialEncryptionMode): Key? {
		val alias = keyAliasForEncryptionMode(credentialEncryptionMode)
		return if (keyStore.containsAlias(alias)) {
			try {
				keyStore.getKey(alias, null)
			} catch (e: UnrecoverableKeyException) {
				throw KeyStoreException(e)
			}
		} else {
			dataKeyGenerator.generateDataKey(alias, credentialEncryptionMode)
		}
	}

	private fun keyAliasForEncryptionMode(encryptionMode: CredentialEncryptionMode): String {
		return when (encryptionMode) {
			CredentialEncryptionMode.DEVICE_LOCK -> DEVICE_LOCK_DATA_KEY_ALIAS
			CredentialEncryptionMode.SYSTEM_PASSWORD -> SYSTEM_PASSWORD_DATA_KEY_ALIAS
			CredentialEncryptionMode.BIOMETRICS -> BIOMETRICS_DATA_KEY_ALIAS
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
		} catch (e: InvalidKeyException) {
			throw CryptoError(e)
		}
	}

	private fun getIV(dataAndIV: ByteArray) = dataAndIV.copyOfRange(0, AndroidNativeCryptoFacade.AES_BLOCK_SIZE_BYTES)

	private fun getData(dataAndIV: ByteArray) =
		dataAndIV.copyOfRange(AndroidNativeCryptoFacade.AES_BLOCK_SIZE_BYTES, dataAndIV.lastIndex + 1)

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

		/** Yes it has a typo which we have to live with. */
		private const val BIOMETRICS_DATA_KEY_ALIAS = "BIometricsDataKey"
		private const val ASYMMETRIC_KEY_ALIAS = "TutanotaAppDeviceAsymmetricKey"
		private const val RSA_ALGORITHM = "RSA/ECB/PKCS1Padding"
		private const val AES_DATA_ALGORITHM = "AES/CBC/PKCS7Padding"
		private const val ANDROID_OPEN_SSL_PROVIDER = "AndroidOpenSSL"
	}

}