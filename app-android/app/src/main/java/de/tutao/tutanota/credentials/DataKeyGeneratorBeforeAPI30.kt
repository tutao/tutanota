package de.tutao.tutanota.credentials

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.InvalidAlgorithmParameterException
import java.security.NoSuchAlgorithmException
import java.security.NoSuchProviderException
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

class DataKeyGeneratorBeforeAPI30 : DataKeyGenerator {
	override fun generateDataKey(alias: String, credentialEncryptionMode: CredentialEncryptionMode): SecretKey {
		return try {
			val keyGenerator = KeyGenerator.getInstance("AES", "AndroidKeyStore")
			val builder = KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
					.setBlockModes(KeyProperties.BLOCK_MODE_CBC)
					.setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
					.setRandomizedEncryptionRequired(true)
					.setUserAuthenticationRequired(credentialEncryptionMode.requiresAuthentication)
			when (credentialEncryptionMode) {
				CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS      -> builder.setUserAuthenticationValidityDurationSeconds(-1)
				CredentialEncryptionMode.ENCRYPTION_MODE_SYSTEM_PASSWORD -> builder.setUserAuthenticationValidityDurationSeconds(10)
				CredentialEncryptionMode.ENCRYPTION_MODE_DEVICE_LOCK     -> {}
			}
			keyGenerator.init(builder.build())
			keyGenerator.generateKey()
		} catch (e: InvalidAlgorithmParameterException) {
			throw RuntimeException(e)
		} catch (e: NoSuchAlgorithmException) {
			throw RuntimeException(e)
		} catch (e: NoSuchProviderException) {
			throw RuntimeException(e)
		}
	}
}