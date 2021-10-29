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

@RequiresApi(23)
public final class CredentialsEncryptionBeforeAPI30 implements ICredentialsEncryption {
	private final AndroidKeyStoreFacade keyStoreFacade;
	private final FragmentActivity activity;
	private final AuthenticationPrompt authenticationPrompt;

	public CredentialsEncryptionBeforeAPI30(AndroidKeyStoreFacade keyStoreFacade,
											FragmentActivity activity,
											AuthenticationPrompt authenticationPrompt) {
		this.keyStoreFacade = keyStoreFacade;
		this.activity = activity;
		this.authenticationPrompt = authenticationPrompt;
	}

	@Override
	public String encryptUsingKeychain(String base64EncodedData, CredentialEncryptionMode encryptionMode) throws KeyStoreException, CryptoError, CredentialAuthenticationException, KeyPermanentlyInvalidatedException {
		byte[] dataToEncrypt = Utils.base64ToBytes(base64EncodedData);
		Cipher cipher;
		try {
			cipher = keyStoreFacade.getCipherForEncryptionMode(encryptionMode);
			if (encryptionMode == CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS) {
				BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(cipher);
				this.authenticationPrompt.authenticateCryptoObject(activity, createPromptInfo(encryptionMode), cryptoObject);
			}
		} catch (KeyStoreException e) {
			if (e.getCause() instanceof UserNotAuthenticatedException) {
				this.authenticationPrompt.authenticate(activity, createPromptInfo(encryptionMode));
				cipher = keyStoreFacade.getCipherForEncryptionMode(encryptionMode);
			} else {
				throw e;
			}
		}
		byte[] encryptedBytes = keyStoreFacade.encryptData(dataToEncrypt, cipher);
		return Utils.bytesToBase64(encryptedBytes);
	}

	@Override
	public String decryptUsingKeychain(String base64EncodedEncryptedData, CredentialEncryptionMode encryptionMode) throws KeyStoreException, CryptoError, CredentialAuthenticationException, KeyPermanentlyInvalidatedException {
		byte[] dataToDecrypt = Utils.base64ToBytes(base64EncodedEncryptedData);
		Cipher cipher;
		try {
			cipher = keyStoreFacade.getCipherForDecryptionMode(encryptionMode, dataToDecrypt);
			if (encryptionMode == CredentialEncryptionMode.ENCRYPTION_MODE_BIOMETRICS) {
				BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(cipher);
				this.authenticationPrompt.authenticateCryptoObject(activity, createPromptInfo(encryptionMode), cryptoObject);
			}
		} catch (KeyStoreException e) {
			if (e.getCause() instanceof UserNotAuthenticatedException) {
				this.authenticationPrompt.authenticate(activity, createPromptInfo(encryptionMode));
				cipher = keyStoreFacade.getCipherForDecryptionMode(encryptionMode, dataToDecrypt);
			} else {
				throw e;
			}
		}
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
		if (biometricManager.canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL | BiometricManager.Authenticators.BIOMETRIC_WEAK) == BiometricManager.BIOMETRIC_SUCCESS) {
			supportedModes.add(CredentialEncryptionMode.ENCRYPTION_MODE_SYSTEM_PASSWORD);
		}
		return supportedModes;
	}

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
