package de.tutao.tutanota.credentials

import android.security.keystore.KeyPermanentlyInvalidatedException
import androidx.annotation.RequiresApi
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.biometric.BiometricPrompt.PromptInfo
import androidx.fragment.app.FragmentActivity
import de.tutao.tutanota.*
import java.security.KeyStoreException
import java.util.*
import javax.crypto.Cipher

@RequiresApi(30)
class CredentialsEncryptionFromAPI30(private val keyStoreFacade: AndroidKeyStoreFacade, private val activity: FragmentActivity, private val authenticationPrompt: AuthenticationPrompt) : ICredentialsEncryption {
	@Throws(KeyStoreException::class, CryptoError::class, CredentialAuthenticationException::class, KeyPermanentlyInvalidatedException::class)
	override fun encryptUsingKeychain(base64EncodedData: String, encryptionMode: CredentialEncryptionMode): String {
		val dataToEncrypt = Utils.base64ToBytes(base64EncodedData)
		val cipher = keyStoreFacade.getCipherForEncryptionMode(encryptionMode)
		authenticateCipher(cipher, encryptionMode)
		val encryptedBytes = keyStoreFacade.encryptData(dataToEncrypt, cipher)
		return Utils.bytesToBase64(encryptedBytes)
	}

	@Throws(KeyStoreException::class, CryptoError::class, CredentialAuthenticationException::class, KeyPermanentlyInvalidatedException::class)
	override fun decryptUsingKeychain(base64EncodedEncryptedData: String, encryptionMode: CredentialEncryptionMode): String {
		val dataToDecrypt = Utils.base64ToBytes(base64EncodedEncryptedData)
		val cipher = keyStoreFacade.getCipherForDecryptionMode(encryptionMode, dataToDecrypt)
		authenticateCipher(cipher, encryptionMode)
		val decryptedBytes = keyStoreFacade.decryptData(dataToDecrypt, cipher)
		return Utils.bytesToBase64(decryptedBytes)
	}

	override val supportedEncryptionModes: List<CredentialEncryptionMode>
		get() {
			val supportedModes: MutableList<CredentialEncryptionMode> = ArrayList()
			supportedModes.add(CredentialEncryptionMode.ENCRYPTION_MODE_DEVICE_LOCK)
			val biometricManager = BiometricManager.from(activity)
			if (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS) {
				supportedModes.add(CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS)
			}
			if (biometricManager.canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL or BiometricManager.Authenticators.BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS) {
				supportedModes.add(CredentialEncryptionMode.ENCRYPTION_MODE_SYSTEM_PASSWORD)
			}
			return supportedModes
		}

	@Throws(CredentialAuthenticationException::class)
	private fun authenticateCipher(cipher: Cipher?, encryptionMode: CredentialEncryptionMode) {
		when (encryptionMode) {
			CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS      -> authenticateUsingBiometrics(BiometricPrompt.CryptoObject(cipher!!), encryptionMode)
			CredentialEncryptionMode.ENCRYPTION_MODE_SYSTEM_PASSWORD -> authenticateUsingBiometrics(BiometricPrompt.CryptoObject(cipher!!), encryptionMode)
			CredentialEncryptionMode.ENCRYPTION_MODE_DEVICE_LOCK     -> {}
		}
	}

	@Throws(CredentialAuthenticationException::class)
	fun authenticateUsingBiometrics(
		cryptoObject: BiometricPrompt.CryptoObject?,
		encryptionMode: CredentialEncryptionMode,
	) {
		// see AuthentorUtils#isSupportedCombination from androidx.biometrics
		val allowedAuthenticators = if (encryptionMode == CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS) BiometricManager.Authenticators.BIOMETRIC_STRONG else BiometricManager.Authenticators.DEVICE_CREDENTIAL or BiometricManager.Authenticators.BIOMETRIC_STRONG
		val promptInfoBuilder = PromptInfo.Builder()
				.setTitle(activity.getString(R.string.unlockCredentials_action))
				.setAllowedAuthenticators(allowedAuthenticators)
		if (encryptionMode == CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS) {
			promptInfoBuilder.setNegativeButtonText(activity.getString(android.R.string.cancel))
		}
		val promptInfo = promptInfoBuilder.build()
		authenticationPrompt.authenticateCryptoObject(activity, promptInfo, cryptoObject)
	}
}