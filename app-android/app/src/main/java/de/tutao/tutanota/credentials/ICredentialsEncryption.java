package de.tutao.tutanota.credentials;

import android.security.keystore.KeyPermanentlyInvalidatedException;

import java.security.KeyStoreException;
import java.util.List;

import de.tutao.tutanota.CredentialAuthenticationException;
import de.tutao.tutanota.CryptoError;

public interface ICredentialsEncryption {
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
	String encryptUsingKeychain(String base64EncodedData, CredentialEncryptionMode encryptionMode) throws KeyStoreException, CryptoError, CredentialAuthenticationException, KeyPermanentlyInvalidatedException;

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
	String decryptUsingKeychain(String base64EncodedEncryptedData, CredentialEncryptionMode encryptionMode) throws KeyStoreException, CryptoError, CredentialAuthenticationException, KeyPermanentlyInvalidatedException;

	List<CredentialEncryptionMode> getSupportedEncryptionModes();
}