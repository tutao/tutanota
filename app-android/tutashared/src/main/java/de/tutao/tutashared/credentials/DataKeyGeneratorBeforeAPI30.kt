package de.tutao.tutashared.credentials

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

class DataKeyGeneratorBeforeAPI30 : DataKeyGenerator {
	override fun generateDataKey(alias: String, credentialEncryptionMode: CredentialEncryptionMode): SecretKey {
		val builder =
				KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
						.setBlockModes(KeyProperties.BLOCK_MODE_CBC)
						.setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
						.setRandomizedEncryptionRequired(true)
						.setUserAuthenticationRequired(credentialEncryptionMode.requiresAuthentication)
		when (credentialEncryptionMode) {
			CredentialEncryptionMode.BIOMETRICS -> {
				@Suppress("DEPRECATION")
				builder.setUserAuthenticationValidityDurationSeconds(-1)
			}
			CredentialEncryptionMode.SYSTEM_PASSWORD -> {
				@Suppress("DEPRECATION")
				builder.setUserAuthenticationValidityDurationSeconds(10)
			}
			CredentialEncryptionMode.DEVICE_LOCK -> {}
		}
		return KeyGenerator.getInstance("AES", "AndroidKeyStore").run {
			init(builder.build())
			generateKey()
		}
	}
}