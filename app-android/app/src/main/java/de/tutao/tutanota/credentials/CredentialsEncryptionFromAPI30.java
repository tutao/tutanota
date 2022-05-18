package de.tutao.tutanota.credentials;

import android.security.keystore.KeyPermanentlyInvalidatedException;
import android.security.keystore.UserNotAuthenticatedException;
import android.util.Log;

import androidx.annotation.RequiresApi;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.fragment.app.FragmentActivity;

import java.security.KeyStoreException;
import java.util.ArrayList;
import java.util.List;

import javax.crypto.Cipher;

import de.tutao.tutanota.AndroidKeyStoreFacade;
import de.tutao.tutanota.CredentialAuthenticationException;
import de.tutao.tutanota.CryptoError;
import de.tutao.tutanota.R;
import de.tutao.tutanota.Utils;

@RequiresApi(30)
public final class CredentialsEncryptionFromAPI30 implements ICredentialsEncryption {
	private static final String TAG = "CredEnc30";

	private final AndroidKeyStoreFacade keyStoreFacade;
	private final FragmentActivity activity;
	private final AuthenticationPrompt authenticationPrompt;

	public CredentialsEncryptionFromAPI30(AndroidKeyStoreFacade keyStoreFacade, FragmentActivity activity, AuthenticationPrompt authenticationPrompt) {
		this.keyStoreFacade = keyStoreFacade;
		this.activity = activity;
		this.authenticationPrompt = authenticationPrompt;
	}

	@Override
	public String encryptUsingKeychain(String base64EncodedData, CredentialEncryptionMode encryptionMode) throws KeyStoreException, CryptoError, CredentialAuthenticationException, KeyPermanentlyInvalidatedException {
		byte[] dataToEncrypt = Utils.base64ToBytes(base64EncodedData);
		Cipher cipher = this.getAuthenticatedCipherForEncryptionModelWithFallback(encryptionMode);
		byte[] encryptedBytes = keyStoreFacade.encryptData(dataToEncrypt, cipher);
		return Utils.bytesToBase64(encryptedBytes);
	}

	@Override
	public String decryptUsingKeychain(String base64EncodedEncryptedData, CredentialEncryptionMode encryptionMode) throws KeyStoreException, CryptoError, CredentialAuthenticationException, KeyPermanentlyInvalidatedException {
		byte[] dataToDecrypt = Utils.base64ToBytes(base64EncodedEncryptedData);
		Cipher cipher = this.getAuthenticatedCipherForDecryptionModelWithFallback(dataToDecrypt, encryptionMode);

		byte[] decryptedBytes = keyStoreFacade.decryptData(dataToDecrypt, cipher);
		return Utils.bytesToBase64(decryptedBytes);
	}

	@Override
	public List<CredentialEncryptionMode> getSupportedEncryptionModes() {
		List<CredentialEncryptionMode> supportedModes = new ArrayList<>();
		supportedModes.add(CredentialEncryptionMode.ENCRYPTION_MODE_DEVICE_LOCK);
		BiometricManager biometricManager = BiometricManager.from(activity);
		if (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS) {
			supportedModes.add(CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS);
		}
		if (biometricManager.canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL | BiometricManager.Authenticators.BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS) {
			supportedModes.add(CredentialEncryptionMode.ENCRYPTION_MODE_SYSTEM_PASSWORD);
		}
		return supportedModes;
	}

	private Cipher getAuthenticatedCipherForEncryptionModelWithFallback(CredentialEncryptionMode encryptionMode) throws CredentialAuthenticationException, KeyStoreException, KeyPermanentlyInvalidatedException {
		Cipher cipher;
		try {
			cipher = keyStoreFacade.getCipherForEncryptionMode(encryptionMode);
		} catch (KeyStoreException e) {
			// If the key was created with the old Android version then we need to use old mechanism
			if (e.getCause() instanceof UserNotAuthenticatedException) {
				String message = "Got UserNotAuthenticatedException for enc w/ mode " + encryptionMode + " , likely an old key, falling back to old auth";
				Log.i(TAG, message, e);
				this.authenticationPrompt.authenticate(activity, createPromptInfo(encryptionMode));
				return keyStoreFacade.getCipherForEncryptionMode(encryptionMode);
			} else {
				throw e;
			}
		}
		// If we got here then we use "modern" auth method
		authenticateCipher(cipher, encryptionMode);
		return cipher;
	}

	private Cipher getAuthenticatedCipherForDecryptionModelWithFallback(byte[] dataToDecrypt, CredentialEncryptionMode encryptionMode) throws CredentialAuthenticationException, KeyStoreException, KeyPermanentlyInvalidatedException, CryptoError {
		Cipher cipher;
		try {
			cipher = keyStoreFacade.getCipherForDecryptionMode(encryptionMode, dataToDecrypt);
		} catch (KeyStoreException e) {
			// If the key was created with the old Android version then we need to use old mechanism
			if (e.getCause() instanceof UserNotAuthenticatedException) {
				String message = "Got UserNotAuthenticatedException for dec w/ mode " + encryptionMode + " , likely an old key, falling back to old auth";
				Log.i(TAG, message, e);
				this.authenticationPrompt.authenticate(activity, createPromptInfo(encryptionMode));
				return keyStoreFacade.getCipherForDecryptionMode(encryptionMode, dataToDecrypt);
			} else {
				throw e;
			}
		}
		// If we got here then we use "modern" auth method
		authenticateCipher(cipher, encryptionMode);
		return cipher;
	}

	private void authenticateCipher(Cipher cipher, CredentialEncryptionMode encryptionMode) throws CredentialAuthenticationException {
		switch (encryptionMode) {
			case ENCRYPTION_MODE_BIOMETRICS:
				authenticateUsingBiometrics(new BiometricPrompt.CryptoObject(cipher), encryptionMode);
				break;
			case ENCRYPTION_MODE_SYSTEM_PASSWORD:
				authenticateUsingBiometrics(new BiometricPrompt.CryptoObject(cipher), encryptionMode);
				break;
			case ENCRYPTION_MODE_DEVICE_LOCK:
				break;
			default:
				throw new AssertionError("Unknown encryption mode");
		}
	}

	public void authenticateUsingBiometrics(
			BiometricPrompt.CryptoObject cryptoObject,
			CredentialEncryptionMode encryptionMode
	) throws CredentialAuthenticationException {
		// see AuthentorUtils#isSupportedCombination from androidx.biometrics
		int allowedAuthenticators = encryptionMode == CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS
				? BiometricManager.Authenticators.BIOMETRIC_STRONG
				: (BiometricManager.Authenticators.DEVICE_CREDENTIAL | BiometricManager.Authenticators.BIOMETRIC_STRONG);
		BiometricPrompt.PromptInfo.Builder promptInfoBuilder = new BiometricPrompt.PromptInfo.Builder()
				.setTitle(activity.getString(R.string.unlockCredentials_action))
				.setAllowedAuthenticators(allowedAuthenticators);
		if (encryptionMode == CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS) {
			promptInfoBuilder.setNegativeButtonText(activity.getString(android.R.string.cancel));
		}
		BiometricPrompt.PromptInfo promptInfo = promptInfoBuilder.build();

		this.authenticationPrompt.authenticateCryptoObject(activity, promptInfo, cryptoObject);
	}

	/**
	 * Prepare prompt info to authenticate the "legacy" way. Once we don't need to support old keys we can get rid of
	 * it.
	 */
	private BiometricPrompt.PromptInfo createPromptInfo(CredentialEncryptionMode mode) {
		if (mode == CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS) {
			BiometricPrompt.PromptInfo.Builder promptInfoBuilder = new BiometricPrompt.PromptInfo.Builder()
					.setTitle(activity.getString(R.string.unlockCredentials_action))
					// see AuthentorUtils#isSupportedCombination from androidx.biometrics
					.setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
					.setNegativeButtonText(activity.getString(android.R.string.cancel));
			return promptInfoBuilder.build();

		} else if (mode == CredentialEncryptionMode.ENCRYPTION_MODE_SYSTEM_PASSWORD) {
			BiometricPrompt.PromptInfo.Builder promptInfoBuilder = new BiometricPrompt.PromptInfo.Builder()
					.setTitle(activity.getString(R.string.unlockCredentials_action))
					// see AuthentorUtils#isSupportedCombination from androidx.biometrics
					.setAllowedAuthenticators(BiometricManager.Authenticators.DEVICE_CREDENTIAL | BiometricManager.Authenticators.BIOMETRIC_WEAK);
			return promptInfoBuilder.build();
		} else {
			throw new AssertionError("");
		}
	}
}
