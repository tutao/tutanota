package de.tutao.tutashared.credentials

import androidx.biometric.BiometricPrompt
import androidx.biometric.BiometricPrompt.PromptInfo
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import de.tutao.tutashared.CredentialAuthenticationException
import java.util.concurrent.Semaphore

/**
 * Class to display an authentication prompt using various authentication methods to unlock keystore keys.
 */
class AuthenticationPrompt constructor() {
	/**
	 * We use a semaphore to ensure that an authentication prompt can only be displayed once. This prevents multiple
	 * requests from the web layer trying to open multiple authentication prompts which would lead to a
	 * [android.security.keystore.UserNotAuthenticatedException].
	 */
	private val sem: Semaphore = Semaphore(1)

	/**
	 * Displays an authentication prompt. This refreshes ambient system authentication.
	 * @param activity Activity on which to display the authentication prompt fragment.
	 * @param promptInfo Configuration object for the authentication prompt to be displayed.
	 * @throws CredentialAuthenticationException If authentication fails by either cancelling authentication or exceeded limit of failed attempts.
	 */
	@Throws(CredentialAuthenticationException::class)
	fun authenticate(
		activity: FragmentActivity,
		promptInfo: PromptInfo,
	) {
		showPrompt(activity, promptInfo, null)
	}

	/**
	 * Displays an authentication prompt. This authenticates exactly one operation using {@param cryptoObject}.
	 * @param activity Activity on which to display the authentication prompt fragment.
	 * @param promptInfo Configuration object for the authentication prompt to be displayed.
	 * @param cryptoObject
	 * @throws CredentialAuthenticationException If authentication fails by either cancelling authentication or exceeded limit of failed attempts.
	 */
	@Throws(CredentialAuthenticationException::class)
	fun authenticateCryptoObject(
		activity: FragmentActivity,
		promptInfo: PromptInfo,
		cryptoObject: BiometricPrompt.CryptoObject?,
	) {
		showPrompt(activity, promptInfo, cryptoObject)
	}

	@Throws(CredentialAuthenticationException::class)
	private fun showPrompt(
		activity: FragmentActivity,
		promptInfo: PromptInfo,
		cryptoObject: BiometricPrompt.CryptoObject?,
	) {
		sem.acquireUninterruptibly()
		var error: String? = null
		activity.runOnUiThread {
			val biometricPrompt = BiometricPrompt(
				activity,
				ContextCompat.getMainExecutor(activity),
				object : BiometricPrompt.AuthenticationCallback() {
					override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
						error = errString.toString()
						sem.release()
					}

					override fun onAuthenticationSucceeded(
						result: BiometricPrompt.AuthenticationResult,
					) {
						sem.release()
					}

					override fun onAuthenticationFailed() {}
				})
			if (cryptoObject != null) {
				biometricPrompt.authenticate(promptInfo, cryptoObject)
			} else {
				biometricPrompt.authenticate(promptInfo)
			}
		}
		try {
			sem.acquire()
			sem.release()
		} catch (ignored: InterruptedException) {
		}
		error?.let {
			throw CredentialAuthenticationException(it)
		}
	}

}