package de.tutao.tutanota;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyPermanentlyInvalidatedException;
import android.security.keystore.KeyProperties;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.UnrecoverableEntryException;
import java.security.UnrecoverableKeyException;
import java.security.cert.CertificateException;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.KeyGenerator;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.IvParameterSpec;

import de.tutao.tutanota.credentials.CredentialEncryptionMode;
import de.tutao.tutanota.credentials.DataKeyGenerator;

/**
 * Used to access keys stored in Android KeyStore and do cryptographic operations with them.
 */
public class AndroidKeyStoreFacade {
	public static final String TAG = "AndroidKeyStoreFacade";

	private static final String AndroidKeyStore = "AndroidKeyStore";
	private static final String SYMMETRIC_KEY_ALIAS = "TutanotaAppDeviceKey";
	private static final String DEVICE_LOCK_DATA_KEY_ALIAS = "DeviceLockDataKey";
	private static final String SYSTEM_PASSWORD_DATA_KEY_ALIAS = "SystemPasswordDataKey";
	private static final String BIOMETRICS_DATA_KEY_ALIAS = "BIometricsDataKey";
	private static final String ASYMMETRIC_KEY_ALIAS = "TutanotaAppDeviceAsymmetricKey";
	private static final String RSA_ALGORITHM = "RSA/ECB/PKCS1Padding";
	private static final String AES_DATA_ALGORITHM = "AES/CBC/PKCS7Padding";
	private static final String ANDROID_OPEN_SSL_PROVIDER = "AndroidOpenSSL";

	private volatile KeyStore keyStore;
	private final Crypto crypto;
	private final DataKeyGenerator dataKeyGenerator;

	public AndroidKeyStoreFacade(Context context, DataKeyGenerator dataKeyGenerator) {
		this.crypto = new Crypto(context);
		this.dataKeyGenerator = dataKeyGenerator;
	}

	private synchronized KeyStore getOrInitKeyStore() throws KeyStoreException {
		if (keyStore != null) {
			return keyStore;
		}
		try {
			keyStore = KeyStore.getInstance(AndroidKeyStore);
			keyStore.load(null);

			if (!keyStore.containsAlias(SYMMETRIC_KEY_ALIAS) && !keyStore.containsAlias(ASYMMETRIC_KEY_ALIAS)) {
				generateSymmetricKey();
			}
		} catch (NoSuchAlgorithmException | NoSuchProviderException | InvalidAlgorithmParameterException | IOException | CertificateException e) {
			Log.w(TAG, "Keystore could not be initialized", e);
			throw new RuntimeException(e);
		}
		return keyStore;
	}


	public byte[] encryptKey(byte[] sessionKey) throws KeyStoreException, CryptoError {
		KeyStore keyStore = getOrInitKeyStore();

		// If we started using asymmetric encryption on the previous Android version, we keep using uit
		if (keyStore.containsAlias(ASYMMETRIC_KEY_ALIAS)) {
			PublicKey publicKey = keyStore.getCertificate(ASYMMETRIC_KEY_ALIAS).getPublicKey();
			try {
				return this.createRSACipher(publicKey, Cipher.ENCRYPT_MODE).doFinal(sessionKey);
			} catch (BadPaddingException | IllegalBlockSizeException e) {
				throw new CryptoError(e);
			}
		} else {
			Key key = getSymmetricKey();
			return crypto.encryptKey(key, sessionKey);
		}
	}

	public byte[] decryptKey(byte[] encSessionKey) throws UnrecoverableEntryException, KeyStoreException, CryptoError {
		KeyStore keyStore = getOrInitKeyStore();

		// If we started using asymmetric encryption on the previous Android version, we keep using uit
		if (keyStore.containsAlias(ASYMMETRIC_KEY_ALIAS)) {
			PrivateKey privateKey;
			try {
				privateKey = (PrivateKey) keyStore.getKey(ASYMMETRIC_KEY_ALIAS, null);
				return this.createRSACipher(privateKey, Cipher.DECRYPT_MODE).doFinal(encSessionKey);
			} catch (NoSuchAlgorithmException e) {
				throw new RuntimeException(e);
			} catch (BadPaddingException | IllegalBlockSizeException e) {
				throw new CryptoError(e);
			}
		} else {
			Key key = getSymmetricKey();
			return crypto.decryptKey(key, encSessionKey);
		}
	}

	/**
	 * Encrypt {@param data} using {@param cipher}. Assumes symmetric encryption.
	 * Cipher must be properly initialized.
	 * @param data
	 * @param cipher
	 * @return encrypted data
	 * @throws CryptoError when key in cipher is invalid
	 */
	public byte[] encryptData(byte[] data, Cipher cipher) throws CryptoError {
		try {
			byte[] encryptedData = cipher.doFinal(data);
			byte[] iv = cipher.getIV();
			ByteArrayOutputStream baos = new ByteArrayOutputStream(encryptedData.length + iv.length);
			try {
				baos.write(iv);
				baos.write(encryptedData);
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
			return baos.toByteArray();
		} catch (BadPaddingException | IllegalBlockSizeException e) {
			throw new CryptoError(e);
		}
	}

	/**
	 * Decrypt {@param dataToDecrypt} using {@param cipher}. Assumes symmetric encryption.
	 * Cipher must be properly initialized.
	 * @param dataToDecrypt
	 * @param cipher
	 * @return decrypted data
	 * @throws CryptoError when key in cipher is invalid
	 */
	public byte[] decryptData(byte[] dataToDecrypt, Cipher cipher) throws CryptoError {
		byte[] actualData = this.getData(dataToDecrypt);
		try {
			return cipher.doFinal(actualData);
		} catch (BadPaddingException | IllegalBlockSizeException e) {
			throw new CryptoError(e);
		}
	}

	/**
	 * Get initialized cipher for encryption. Cipher will be configured for AES-CBC-PKC7 algorithm.
	 * @param encryptionMode
	 * @return
	 * @throws KeyStoreException if the data key for encryption mode cannot be accessed.
	 */
	public Cipher getCipherForEncryptionMode(CredentialEncryptionMode encryptionMode) throws KeyStoreException, KeyPermanentlyInvalidatedException {
		Key key = this.getDataKey(encryptionMode);
		Cipher cipher;
		try {
			cipher = Cipher.getInstance(AES_DATA_ALGORITHM);
		} catch (NoSuchAlgorithmException | NoSuchPaddingException e) {
			throw new RuntimeException(e);
		}
		try {
			cipher.init(Cipher.ENCRYPT_MODE, key);
		} catch (KeyPermanentlyInvalidatedException e) {
			keyStore.deleteEntry(keyAliasForEncryptionMode(encryptionMode));
			throw e;
		} catch (InvalidKeyException e) {
			throw new KeyStoreException(e);
		}
		return cipher;
	}

	/**
	 * Get initialized cipher for decryption. Will use {@param dataToBeDecrypted} to extract IV.
	 *  Cipher will be configured for AES-CBC-PKC7 algorithm.
	 * @param encryptionMode
	 * @param dataToBeDecrypted
	 * @return
	 * @throws KeyStoreException if the data key for encryption mode cannot be accessed.
	 * @throws CryptoError if encrypted data does not contain valid IV
	 */
	public Cipher getCipherForDecryptionMode(CredentialEncryptionMode encryptionMode, byte[] dataToBeDecrypted) throws KeyPermanentlyInvalidatedException, KeyStoreException, CryptoError {
		Key key = this.getDataKey(encryptionMode);
		Cipher cipher;
		try {
			cipher = Cipher.getInstance(AES_DATA_ALGORITHM);
		} catch (NoSuchAlgorithmException | NoSuchPaddingException e) {
			throw new RuntimeException(e);
		}
		byte[] iv = this.getIV(dataToBeDecrypted);
		try {
			cipher.init(Cipher.DECRYPT_MODE, key, new IvParameterSpec(iv));
		} catch (KeyPermanentlyInvalidatedException e) {
			keyStore.deleteEntry(keyAliasForEncryptionMode(encryptionMode));
			throw e;
		} catch (InvalidKeyException e) {
			throw new KeyStoreException(e);
		} catch (InvalidAlgorithmParameterException e) {
			throw new CryptoError(e);
		}
		return cipher;
	}

	private void generateSymmetricKey() throws NoSuchAlgorithmException, NoSuchProviderException, InvalidAlgorithmParameterException {
		KeyGenerator keyGenerator = KeyGenerator.getInstance("AES", AndroidKeyStore);
		keyGenerator.init(new KeyGenParameterSpec.Builder(SYMMETRIC_KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
				.setBlockModes(KeyProperties.BLOCK_MODE_CBC)
				.setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
				.setRandomizedEncryptionRequired(false)
				.build());
		keyGenerator.generateKey();
	}

	private Key getSymmetricKey() throws KeyStoreException {
		KeyStore keyStore = getOrInitKeyStore();
		Key key;
		try {
			key = keyStore.getKey(SYMMETRIC_KEY_ALIAS, null);
		} catch (NoSuchAlgorithmException e) {
			throw new RuntimeException(e);
		} catch (UnrecoverableKeyException e) {
			throw new KeyStoreException(e);
		}

		return key;
	}

	private Key getDataKey(CredentialEncryptionMode credentialEncryptionMode) throws KeyStoreException {
		KeyStore keyStore = getOrInitKeyStore();
		String alias = keyAliasForEncryptionMode(credentialEncryptionMode);
		if (keyStore.containsAlias(alias)) {
			try {
				return keyStore.getKey(alias, null);
			} catch (UnrecoverableKeyException e) {
				throw new KeyStoreException(e);
			} catch (NoSuchAlgorithmException e) {
				throw new RuntimeException(e);
			}
		} else {
			return this.dataKeyGenerator.generateDataKey(alias, credentialEncryptionMode);
		}
	}

	private String keyAliasForEncryptionMode(CredentialEncryptionMode encryptionMode) {
		switch (encryptionMode) {
			case ENCRYPTION_MODE_DEVICE_LOCK:
				return DEVICE_LOCK_DATA_KEY_ALIAS;
			case ENCRYPTION_MODE_SYSTEM_PASSWORD:
				return SYSTEM_PASSWORD_DATA_KEY_ALIAS;
			case ENCRYPTION_MODE_BIOMETRICS:
				return BIOMETRICS_DATA_KEY_ALIAS;
			default:
				throw new AssertionError("Unknown encryption mode");
		}
	}

	private Cipher createRSACipher(Key key, int mode) throws CryptoError {
		// We use separate RSA implementation than Crypto.java and all other encryption because on
		// on API versions < 23 only RSA/ECB/NoPadding and RSA/ECB/PKCS1Padding are supported.
		// See: https://developer.android.com/training/articles/keystore#SupportedCiphers
		try {
			// Specify provider explicitly, otherwise it picks different ones for encryption &
			// decryption.
			// See https://medium.com/@ericfu/securely-storing-secrets-in-an-android-application-501f030ae5a3
			Cipher cipher = Cipher.getInstance(RSA_ALGORITHM, ANDROID_OPEN_SSL_PROVIDER);
			cipher.init(mode, key);
			return cipher;
		} catch (NoSuchAlgorithmException | NoSuchPaddingException | NoSuchProviderException e) {
			throw new RuntimeException(e);
		} catch (InvalidKeyException e) {
			throw new CryptoError(e);
		}
	}

	private byte[] getIV(byte[] dataAndIV) {
		byte[] iv = new byte[Crypto.AES_BLOCK_SIZE_BYTES];
		System.arraycopy(dataAndIV, 0, iv, 0, Crypto.AES_BLOCK_SIZE_BYTES);
		return iv;
	}

	private byte[] getData(byte[] dataAndIV) {
		byte[] actualDataToDecrypt = new byte[dataAndIV.length - Crypto.AES_BLOCK_SIZE_BYTES];
		System.arraycopy(dataAndIV, Crypto.AES_BLOCK_SIZE_BYTES, actualDataToDecrypt, 0, actualDataToDecrypt.length);
		return actualDataToDecrypt;
	}
}
