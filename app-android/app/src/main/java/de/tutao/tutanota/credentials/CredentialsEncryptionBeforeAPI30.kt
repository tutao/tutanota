package de.tutao.tutanota.credentials

import android.security.keystore.KeyPermanentlyInvalidatedException
import android.security.keystore.UserNotAuthenticatedException
import androidx.annotation.RequiresApi
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.biometric.BiometricPrompt.PromptInfo
import androidx.fragment.app.FragmentActivity
import de.tutao.tutanota.*
import java.security.KeyStoreException
import java.util.*
import javax.crypto.Cipher

@RequiresApi(23)
class CredentialsEncryptionBeforeAPI30(
	private val keyStoreFacade: AndroidKeyStoreFacade,
	private val activity: FragmentActivity,
	private val authenticationPrompt: AuthenticationPrompt,
) : ICredentialsEncryption {
	@Throws(KeyStoreException::class, CryptoError::class, CredentialAuthenticationException::class, KeyPermanentlyInvalidatedException::class)
	override fun encryptUsingKeychain(base64EncodedData: String, encryptionMode: CredentialEncryptionMode): String {
		val dataToEncrypt = Utils.base64ToBytes(base64EncodedData)
		var cipher: Cipher?
		try {
			cipher = keyStoreFacade.getCipherForEncryptionMode(encryptionMode)
			if (encryptionMode == CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS) {
				val cryptoObject = BiometricPrompt.CryptoObject(cipher)
				authenticationPrompt.authenticateCryptoObject(activity, createPromptInfo(encryptionMode), cryptoObject)
			}
		} catch (e: KeyStoreException) {
			cipher = if (e.cause is UserNotAuthenticatedException) {
				authenticationPrompt.authenticate(activity, createPromptInfo(encryptionMode))
				keyStoreFacade.getCipherForEncryptionMode(encryptionMode)
			} else {
				throw e
			}
		}
		val encryptedBytes = keyStoreFacade.encryptData(dataToEncrypt, cipher)
		return Utils.bytesToBase64(encryptedBytes)
	}

	@Throws(KeyStoreException::class, CryptoError::class, CredentialAuthenticationException::class, KeyPermanentlyInvalidatedException::class)
	override fun decryptUsingKeychain(base64EncodedEncryptedData: String, encryptionMode: CredentialEncryptionMode): String {
		val dataToDecrypt = Utils.base64ToBytes(base64EncodedEncryptedData)
		var cipher: Cipher
		try {
			cipher = keyStoreFacade.getCipherForDecryptionMode(encryptionMode, dataToDecrypt)
			if (encryptionMode == CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS) {
				val cryptoObject = BiometricPrompt.CryptoObject(cipher)
				authenticationPrompt.authenticateCryptoObject(activity, createPromptInfo(encryptionMode), cryptoObject)
			}
		} catch (e: KeyStoreException) {
			cipher = if (e.cause is UserNotAuthenticatedException) {
				authenticationPrompt.authenticate(activity, createPromptInfo(encryptionMode))
				keyStoreFacade.getCipherForDecryptionMode(encryptionMode, dataToDecrypt)
			} else {
				throw e
			}
		}
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
			if (biometricManager.canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL or BiometricManager.Authenticators.BIOMETRIC_WEAK) == BiometricManager.BIOMETRIC_SUCCESS) {
				supportedModes.add(CredentialEncryptionMode.ENCRYPTION_MODE_SYSTEM_PASSWORD)
			}
			return supportedModes
		}

	private fun createPromptInfo(mode: CredentialEncryptionMode): PromptInfo {
		return when (mode) {
			CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS      -> {
				val promptInfoBuilder = PromptInfo.Builder()
						.setTitle(activity.getString(R.string.unlockCredentials_action)) // see AuthentorUtils#isSupportedCombination from androidx.biometrics
						.setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
						.setNegativeButtonText(activity.getString(android.R.string.cancel))
				promptInfoBuilder.build()
			}
			CredentialEncryptionMode.ENCRYPTION_MODE_SYSTEM_PASSWORD -> {
				val promptInfoBuilder = PromptInfo.Builder()
						.setTitle(activity.getString(R.string.unlockCredentials_action)) // see AuthentorUtils#isSupportedCombination from androidx.biometrics
						.setAllowedAuthenticators(BiometricManager.Authenticators.DEVICE_CREDENTIAL or BiometricManager.Authenticators.BIOMETRIC_WEAK)
				promptInfoBuilder.build()
			}
			else                                                     -> {
				throw AssertionError("")
			}
		}
	}
}