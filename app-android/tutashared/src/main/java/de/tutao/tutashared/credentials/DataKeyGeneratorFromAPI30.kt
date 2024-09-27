package de.tutao.tutashared.credentials

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.annotation.RequiresApi
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

@RequiresApi(30)
class DataKeyGeneratorFromAPI30 : DataKeyGenerator {
	override fun generateDataKey(alias: String, credentialEncryptionMode: CredentialEncryptionMode): SecretKey {
		val builder = KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
				.setBlockModes(KeyProperties.BLOCK_MODE_CBC)
				.setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
				.setRandomizedEncryptionRequired(true)
				.setUserAuthenticationRequired(credentialEncryptionMode.requiresAuthentication)
		when (credentialEncryptionMode) {
			CredentialEncryptionMode.BIOMETRICS -> builder.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG)
			CredentialEncryptionMode.SYSTEM_PASSWORD -> builder.setUserAuthenticationParameters(0, KeyProperties.AUTH_DEVICE_CREDENTIAL or KeyProperties.AUTH_BIOMETRIC_STRONG)
			CredentialEncryptionMode.DEVICE_LOCK -> {}
		}
		return KeyGenerator.getInstance("AES", "AndroidKeyStore").run {
			init(builder.build())
			generateKey()
		}
	}
}