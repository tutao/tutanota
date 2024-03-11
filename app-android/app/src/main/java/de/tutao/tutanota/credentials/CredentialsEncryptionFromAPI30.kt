package de.tutao.tutanota.credentials

import android.content.Context
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.security.keystore.UserNotAuthenticatedException
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.biometric.BiometricManager.*
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


@RequiresApi(30)
class CredentialsEncryptionFromAPI30(
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
		val dataToEncrypt = data.data
		val cipher = getAuthenticatedCipherForEncryptionModelWithFallback(encryptionMode)
		val encryptedBytes = keyStoreFacade.encryptData(dataToEncrypt, cipher)
		return encryptedBytes.wrap()
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
		val dataToDecrypt = encryptedData.data
		val cipher = this.getAuthenticatedCipherForDecryptionModelWithFallback(dataToDecrypt, encryptionMode)
		val decryptedBytes = keyStoreFacade.decryptData(dataToDecrypt, cipher)
		return decryptedBytes.wrap()
	}

	override suspend fun getSupportedEncryptionModes(): List<CredentialEncryptionMode> {
		val supportedModes: MutableList<CredentialEncryptionMode> = ArrayList()
		supportedModes.add(CredentialEncryptionMode.DEVICE_LOCK)
		val biometricManager = from(activity)
		if (biometricManager.canAuthenticate(Authenticators.BIOMETRIC_STRONG) == BIOMETRIC_SUCCESS) {
			supportedModes.add(CredentialEncryptionMode.BIOMETRICS)
		}
		if (biometricManager.canAuthenticate(Authenticators.DEVICE_CREDENTIAL or Authenticators.BIOMETRIC_STRONG) == BIOMETRIC_SUCCESS) {
			supportedModes.add(CredentialEncryptionMode.SYSTEM_PASSWORD)
		}
		return supportedModes
	}

	@Throws(CredentialAuthenticationException::class)
	private fun authenticateCipher(cipher: Cipher, encryptionMode: CredentialEncryptionMode) {
		when (encryptionMode) {
			CredentialEncryptionMode.BIOMETRICS -> authenticateUsingBiometrics(
					BiometricPrompt.CryptoObject(
							cipher
					), encryptionMode
			)
			CredentialEncryptionMode.SYSTEM_PASSWORD -> authenticateUsingBiometrics(
					BiometricPrompt.CryptoObject(
							cipher
					), encryptionMode
			)
			CredentialEncryptionMode.DEVICE_LOCK -> {}
		}
	}

	@Throws(CredentialAuthenticationException::class)
	fun authenticateUsingBiometrics(
			cryptoObject: BiometricPrompt.CryptoObject,
			encryptionMode: CredentialEncryptionMode,
	) {
		// see AuthenticatorUtils#isSupportedCombination from androidx.biometrics
		val allowedAuthenticators =
				if (encryptionMode == CredentialEncryptionMode.BIOMETRICS) Authenticators.BIOMETRIC_STRONG else Authenticators.DEVICE_CREDENTIAL or Authenticators.BIOMETRIC_STRONG
		val promptInfoBuilder = PromptInfo.Builder()
				.setTitle(activity.getString(R.string.unlockCredentials_action))
				.setAllowedAuthenticators(allowedAuthenticators)
		if (encryptionMode == CredentialEncryptionMode.BIOMETRICS) {
			promptInfoBuilder.setNegativeButtonText(activity.getString(android.R.string.cancel))
		}
		val promptInfo = promptInfoBuilder.build()
		authenticationPrompt.authenticateCryptoObject(activity as FragmentActivity, promptInfo, cryptoObject)
	}

	@Throws(
			CredentialAuthenticationException::class,
			KeyStoreException::class,
			KeyPermanentlyInvalidatedException::class
	)
	private fun getAuthenticatedCipherForEncryptionModelWithFallback(encryptionMode: CredentialEncryptionMode): Cipher {
		val cipher = try {
			keyStoreFacade.getCipherForEncryptionMode(encryptionMode)
		} catch (e: KeyStoreException) {
			// If the key was created with the old Android version then we need to use old mechanism
			return if (e.cause is UserNotAuthenticatedException) {
				val message =
						"Got UserNotAuthenticatedException for enc w/ mode $encryptionMode , likely an old key, falling back to old auth"
				Log.i(TAG, message, e)
				authenticationPrompt.authenticate(activity as FragmentActivity, createPromptInfo(encryptionMode))
				keyStoreFacade.getCipherForEncryptionMode(encryptionMode)
			} else {
				throw e
			}
		}
		// If we got here then we use "modern" auth method
		authenticateCipher(cipher, encryptionMode)

		return cipher
	}

	@Throws(
			CredentialAuthenticationException::class,
			KeyStoreException::class,
			KeyPermanentlyInvalidatedException::class,
			CryptoError::class
	)
	private fun getAuthenticatedCipherForDecryptionModelWithFallback(
			dataToDecrypt: ByteArray,
			encryptionMode: CredentialEncryptionMode
	): Cipher {
		val cipher = try {
			keyStoreFacade.getCipherForDecryptionMode(encryptionMode, dataToDecrypt)
		} catch (e: KeyStoreException) {
			// If the key was created with the old Android version then we need to use old mechanism
			return if (e.cause is UserNotAuthenticatedException) {
				val message =
						"Got UserNotAuthenticatedException for dec w/ mode $encryptionMode , likely an old key, falling back to old auth"
				Log.i(TAG, message, e)
				authenticationPrompt.authenticate(activity as FragmentActivity, createPromptInfo(encryptionMode))
				keyStoreFacade.getCipherForDecryptionMode(encryptionMode, dataToDecrypt)
			} else {
				throw e
			}
		}
		// If we got here then we use "modern" auth method
		authenticateCipher(cipher, encryptionMode)
		return cipher
	}


	/**
	 * Prepare prompt info to authenticate the "legacy" way. Once we don't need to support old keys we can get rid of
	 * it.
	 */
	private fun createPromptInfo(mode: CredentialEncryptionMode): PromptInfo {
		return if (mode === CredentialEncryptionMode.BIOMETRICS) {
			val promptInfoBuilder = PromptInfo.Builder()
					.setTitle(activity.getString(R.string.unlockCredentials_action)) // see AuthenticatorUtils#isSupportedCombination from androidx.biometrics
					.setAllowedAuthenticators(Authenticators.BIOMETRIC_STRONG)
					.setNegativeButtonText(activity.getString(android.R.string.cancel))
			promptInfoBuilder.build()
		} else if (mode === CredentialEncryptionMode.SYSTEM_PASSWORD) {
			val promptInfoBuilder = PromptInfo.Builder()
					.setTitle(activity.getString(R.string.unlockCredentials_action)) // see AuthenticatorUtils#isSupportedCombination from androidx.biometrics
					.setAllowedAuthenticators(Authenticators.DEVICE_CREDENTIAL or Authenticators.BIOMETRIC_WEAK)
			promptInfoBuilder.build()
		} else {
			throw AssertionError("")
		}
	}

	companion object {
		const val TAG: String = "CredEncFromAPI30"
	}
}