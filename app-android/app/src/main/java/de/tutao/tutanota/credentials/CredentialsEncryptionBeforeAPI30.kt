package de.tutao.tutanota.credentials

import android.content.Context
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.security.keystore.UserNotAuthenticatedException
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.biometric.BiometricPrompt.PromptInfo
import androidx.fragment.app.FragmentActivity
import de.tutao.tutanota.AndroidKeyStoreFacade
import de.tutao.tutanota.CredentialAuthenticationException
import de.tutao.tutanota.CryptoError
import de.tutao.tutanota.R
import de.tutao.tutanota.ipc.CredentialEncryptionMode
import de.tutao.tutanota.ipc.DataWrapper
import de.tutao.tutanota.ipc.wrap
import java.security.KeyStoreException
import javax.crypto.Cipher

class CredentialsEncryptionBeforeAPI30(
	private val keyStoreFacade: AndroidKeyStoreFacade,
	private val activity: Context,
	private val authenticationPrompt: AuthenticationPrompt,
) : AndroidNativeCredentialsFacade(keyStoreFacade, activity, authenticationPrompt) {
	@Throws(
			KeyStoreException::class,
			CryptoError::class,
			CredentialAuthenticationException::class,
			KeyPermanentlyInvalidatedException::class
	)
	override suspend fun encryptUsingKeychain(data: DataWrapper, encryptionMode: CredentialEncryptionMode): DataWrapper {

		var cipher: Cipher
		try {
			cipher = keyStoreFacade.getCipherForEncryptionMode(encryptionMode)
			if (encryptionMode == CredentialEncryptionMode.BIOMETRICS) {
				val cryptoObject = BiometricPrompt.CryptoObject(cipher)
				authenticationPrompt.authenticateCryptoObject(activity as FragmentActivity, createPromptInfo(encryptionMode), cryptoObject)
			}
		} catch (e: KeyStoreException) {
			cipher = if (e.cause is UserNotAuthenticatedException) {
				authenticationPrompt.authenticate(activity as FragmentActivity, createPromptInfo(encryptionMode))
				keyStoreFacade.getCipherForEncryptionMode(encryptionMode)
			} else {
				throw e
			}
		}
		return keyStoreFacade.encryptData(data.data, cipher).wrap()
	}

	@Throws(
			KeyStoreException::class,
			CryptoError::class,
			CredentialAuthenticationException::class,
			KeyPermanentlyInvalidatedException::class
	)
	override suspend fun decryptUsingKeychain(
			encryptedData: DataWrapper,
			encryptionMode: CredentialEncryptionMode
	): DataWrapper {
		var cipher: Cipher
		val dataToDecrypt = encryptedData.data
		try {
			cipher = keyStoreFacade.getCipherForDecryptionMode(encryptionMode, dataToDecrypt)
			if (encryptionMode == CredentialEncryptionMode.BIOMETRICS) {
				val cryptoObject = BiometricPrompt.CryptoObject(cipher)
				authenticationPrompt.authenticateCryptoObject(activity as FragmentActivity, createPromptInfo(encryptionMode), cryptoObject)
			}
		} catch (e: KeyStoreException) {
			cipher = if (e.cause is UserNotAuthenticatedException) {
				authenticationPrompt.authenticate(activity as FragmentActivity, createPromptInfo(encryptionMode))
				keyStoreFacade.getCipherForDecryptionMode(encryptionMode, dataToDecrypt)
			} else {
				throw e
			}
		}
		return keyStoreFacade.decryptData(dataToDecrypt, cipher).wrap()
	}

	override suspend fun getSupportedEncryptionModes(): List<CredentialEncryptionMode> = buildList {
		add(CredentialEncryptionMode.DEVICE_LOCK)

		val biometricManager = BiometricManager.from(activity)
		if (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS) {
			add(CredentialEncryptionMode.BIOMETRICS)
		}

		if (biometricManager.canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL or BiometricManager.Authenticators.BIOMETRIC_WEAK) == BiometricManager.BIOMETRIC_SUCCESS) {
			add(CredentialEncryptionMode.SYSTEM_PASSWORD)
		}
	}

	private fun createPromptInfo(mode: CredentialEncryptionMode): PromptInfo {
		return when (mode) {
			CredentialEncryptionMode.BIOMETRICS -> {
				val promptInfoBuilder = PromptInfo.Builder()
						.setTitle(activity.getString(R.string.unlockCredentials_action)) // see AuthenticatorUtils#isSupportedCombination from androidx.biometrics
						.setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
						.setNegativeButtonText(activity.getString(android.R.string.cancel))
				promptInfoBuilder.build()
			}
			CredentialEncryptionMode.SYSTEM_PASSWORD -> {
				val promptInfoBuilder = PromptInfo.Builder()
						.setTitle(activity.getString(R.string.unlockCredentials_action)) // see AuthenticatorUtils#isSupportedCombination from androidx.biometrics
						.setAllowedAuthenticators(BiometricManager.Authenticators.DEVICE_CREDENTIAL or BiometricManager.Authenticators.BIOMETRIC_WEAK)
				promptInfoBuilder.build()
			}
			else -> {
				throw AssertionError("")
			}
		}
	}
}