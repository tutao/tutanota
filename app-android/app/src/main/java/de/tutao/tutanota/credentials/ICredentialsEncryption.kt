package de.tutao.tutanota.credentials

import android.security.keystore.KeyPermanentlyInvalidatedException
import de.tutao.tutanota.CredentialAuthenticationException
import de.tutao.tutanota.CryptoError
import java.security.KeyStoreException

interface ICredentialsEncryption {
	/**
	 * Encrypts arbitrary data using keychain keys, prompting for authentication if needed.
	 *
	 * @param base64EncodedData
	 * @param encryptionMode
	 * @return
	 * @throws KeyStoreException                 when the key or keychain cannot be accessed e.g. key was invalidated
	 * @throws CryptoError                       when the key is invalid
	 * @throws CredentialAuthenticationException when authentication fails or is cancelled
	 */
	@Throws(KeyStoreException::class, CryptoError::class, CredentialAuthenticationException::class, KeyPermanentlyInvalidatedException::class)
	fun encryptUsingKeychain(base64EncodedData: String, encryptionMode: CredentialEncryptionMode): String

	/**
	 * Decrypts arbitrary data using keychain keys, prompting for authentication if needed.
	 *
	 * @param base64EncodedEncryptedData
	 * @param encryptionMode
	 * @return
	 * @throws KeyStoreException                 when the key or keychain cannot be accessed e.g. key was invalidated
	 * @throws CryptoError                       when the key or data are invalid
	 * @throws CredentialAuthenticationException when authentication fails or is cancelled
	 */
	@Throws(KeyStoreException::class, CryptoError::class, CredentialAuthenticationException::class, KeyPermanentlyInvalidatedException::class)
	fun decryptUsingKeychain(base64EncodedEncryptedData: String, encryptionMode: CredentialEncryptionMode): String

	val supportedEncryptionModes: List<CredentialEncryptionMode>
}