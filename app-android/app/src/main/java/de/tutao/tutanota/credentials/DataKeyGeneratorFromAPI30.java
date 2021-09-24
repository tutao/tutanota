package de.tutao.tutanota.credentials;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;

import androidx.annotation.RequiresApi;

import java.security.InvalidAlgorithmParameterException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;

@RequiresApi(30)
public final class DataKeyGeneratorFromAPI30 implements DataKeyGenerator {
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
				case ENCRYPTION_MODE_BIOMETRICS:
					builder.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG);
					break;
				case ENCRYPTION_MODE_SYSTEM_PASSWORD:
					builder.setUserAuthenticationParameters(0, KeyProperties.AUTH_DEVICE_CREDENTIAL | KeyProperties.AUTH_BIOMETRIC_STRONG);
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
