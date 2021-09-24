package de.tutao.tutanota.credentials;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import java.util.concurrent.Semaphore;

import de.tutao.tutanota.CredentialAuthenticationException;

/**
 * Class to display an authentication prompt using various authentication methods to unlock keystore keys.
 */
public final class AuthenticationPrompt {
	/**
	 * We use a semaphore to ensure that an authentication prompt can only be displayed once. This prevents multiple
	 * requests from the web layer trying to open multiple authentication prompts which would lead to a
	 * {@link android.security.keystore.UserNotAuthenticatedException}.
	 */
	private final Semaphore sem;

	AuthenticationPrompt() {
		sem = new Semaphore(1);
	}

	/**
	 * Displays an authentication prompt. This refreshes ambient system authentication.
	 * @param activity Activity on which to display the authentication prompt fragment.
	 * @param promptInfo Configuration object for the authentication prompt to be displayed.
	 * @throws CredentialAuthenticationException If authentication fails by either cancelling authentication or exceeded limit of failed attempts.
	 */
	public void authenticate(FragmentActivity activity,
							 BiometricPrompt.PromptInfo promptInfo) throws CredentialAuthenticationException {
		showPrompt(activity, promptInfo, null);
	}

	/**
	 * Displays an authentication prompt. This authenticates exactly one operation using {@param cryptoObject}.
	 * @param activity Activity on which to display the authentication prompt fragment.
	 * @param promptInfo Configuration object for the authentication prompt to be displayed.
	 * @param cryptoObject
	 * @throws CredentialAuthenticationException If authentication fails by either cancelling authentication or exceeded limit of failed attempts.
	 */
	public void authenticateCryptoObject(FragmentActivity activity,
										 BiometricPrompt.PromptInfo promptInfo,
										 BiometricPrompt.CryptoObject cryptoObject) throws CredentialAuthenticationException {
		showPrompt(activity, promptInfo, cryptoObject);
	}

	private void showPrompt(FragmentActivity activity,
							BiometricPrompt.PromptInfo promptInfo,
							@Nullable BiometricPrompt.CryptoObject cryptoObject) throws CredentialAuthenticationException {
		sem.acquireUninterruptibly();
		final String[] error = {null};

		activity.runOnUiThread(() -> {
			BiometricPrompt biometricPrompt = new BiometricPrompt(activity, ContextCompat.getMainExecutor(activity), new BiometricPrompt.AuthenticationCallback() {
				@Override
				public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
					error[0] = errString.toString();
					sem.release();
				}

				@Override
				public void onAuthenticationSucceeded(
						@NonNull BiometricPrompt.AuthenticationResult result) {
					sem.release();
				}

				@Override
				public void onAuthenticationFailed() {
				}
			});
			if (cryptoObject != null) {
				biometricPrompt.authenticate(promptInfo, cryptoObject);
			} else {
				biometricPrompt.authenticate(promptInfo);
			}
		});


		try {
			sem.acquire();
			sem.release();
		} catch (InterruptedException ignored) {
		}
		if (error[0] != null) {
			throw new CredentialAuthenticationException(error[0]);
		}
	}
}
