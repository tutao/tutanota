package de.tutao.tutanota.credentials;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;

import java.security.InvalidAlgorithmParameterException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;

public final class DataKeyGeneratorBeforeAPI30 implements DataKeyGenerator {
	@Override
	public SecretKey generateDataKey(String alias, CredentialEncryptionMode credentialEncryptionMode) {
		try {
			KeyGenerator keyGenerator = KeyGenerator.getInstance("AES", "AndroidKeyStore");
			KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
					.setBlockModes(KeyProperties.BLOCK_MODE_CBC)
					.setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
					.setRandomizedEncryptionRequired(true)
					.setUserAuthenticationRequired(credentialEncryptionMode.requiresAuthentication);
			switch (credentialEncryptionMode) {
				// This looks odd, right?
				// see https://stackoverflow.com/questions/66067041/how-to-replace-deprecated-keygenparameterspec-builder-setuserauthenticationvalid
				case ENCRYPTION_MODE_BIOMETRICS:
					builder.setUserAuthenticationValidityDurationSeconds(-1);
					break;
				case ENCRYPTION_MODE_SYSTEM_PASSWORD:
					builder.setUserAuthenticationValidityDurationSeconds(10);
					break;
				case ENCRYPTION_MODE_DEVICE_LOCK:
					break;
			}
			keyGenerator.init(builder.build());
			return keyGenerator.generateKey();
		} catch (InvalidAlgorithmParameterException | NoSuchAlgorithmException | NoSuchProviderException e) {
			throw new RuntimeException(e);
		}
	}
}
