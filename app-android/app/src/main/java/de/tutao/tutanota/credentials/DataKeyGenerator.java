package de.tutao.tutanota.credentials;

import javax.crypto.SecretKey;

/**
 * Interface for obtaining keys that can be used to encrypt arbitrary data using android's keystore API.
 */
public interface DataKeyGenerator {
	SecretKey generateDataKey(String alias, CredentialEncryptionMode credentialEncryptionMode);
}
