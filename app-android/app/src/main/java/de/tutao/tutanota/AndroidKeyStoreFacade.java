package de.tutao.tutanota;

import android.content.Context;
import android.os.Build;
import android.security.KeyPairGeneratorSpec;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.support.annotation.RequiresApi;
import android.util.Log;

import javax.crypto.*;
import javax.security.auth.x500.X500Principal;
import java.io.IOException;
import java.math.BigInteger;
import java.security.*;
import java.security.cert.CertificateException;
import java.util.Calendar;


public class AndroidKeyStoreFacade {
	public static final String TAG = "AndroidKeyStoreFacade";

	private static final String AndroidKeyStore = "AndroidKeyStore";
	private static final String SYMMETRIC_KEY_ALIAS = "TutanotaAppDeviceKey";
	private static final String ASYMMETRIC_KEY_ALIAS = "TutanotaAppDeviceAsymmetricKey";
	private static final String RSA_ALGORITHM = "RSA/ECB/PKCS1Padding";
	private static final String ANDROID_OPEN_SSL_PROVIDER = "AndroidOpenSSL";

	private final Context context;
	private volatile KeyStore keyStore;
	private Crypto crypto;


	public AndroidKeyStoreFacade(Context context) {
		this.context = context;
		this.crypto = new Crypto(context);
	}


	private synchronized void initialize() throws CryptoError, KeyStoreException {
		if (keyStore != null) {
			return;
		}
		try {
			keyStore = KeyStore.getInstance(AndroidKeyStore);
			keyStore.load(null);

			if (!keyStore.containsAlias(SYMMETRIC_KEY_ALIAS) && !keyStore.containsAlias(ASYMMETRIC_KEY_ALIAS)) {
				// We try to use symmetric encryption if possible because it's much more efficient.
				// Creating secure RSA keys (like 4096) might take up to a minute (!) and render the whole
				// device unresponsive for that time.
				if (supportsSymmetricEncryption()) {
					generateSymmetricKey();
				} else {
					generateAsymmetricKeyPair();
				}
			}
		} catch (NoSuchAlgorithmException | NoSuchProviderException | InvalidAlgorithmParameterException | IOException | CertificateException e) {
			Log.w(TAG, "Keystore could not be initialized", e);
			throw new CryptoError(e);
		}
	}


	public String encryptKey(byte[] sessionKey) throws KeyStoreException, CryptoError {
		initialize();

		// If we started using asymmetric encryption on the previous Android version, we keep using uit
		if (keyStore.containsAlias(ASYMMETRIC_KEY_ALIAS)) {
			PublicKey publicKey = keyStore.getCertificate(ASYMMETRIC_KEY_ALIAS).getPublicKey();
			try {
				return Utils.bytesToBase64(this.createRSACipher(publicKey, Cipher.ENCRYPT_MODE).doFinal(sessionKey));
			} catch (BadPaddingException | IllegalBlockSizeException e) {
				throw new CryptoError(e);
			}
		} else {
			Key key = getSymmetricKey();
			return Utils.bytesToBase64(crypto.encryptKey(key, sessionKey));
		}
	}

	public byte[] decryptKey(String encSessionKey) throws UnrecoverableEntryException, KeyStoreException, CryptoError {
		initialize();

		// If we started using asymmetric encryption on the previous Android version, we keep using uit
		if (keyStore.containsAlias(ASYMMETRIC_KEY_ALIAS)) {
			PrivateKey privateKey;
			try {
				privateKey = (PrivateKey) keyStore.getKey(ASYMMETRIC_KEY_ALIAS, null);
				byte[] encSessionKeyRaw = Utils.base64ToBytes(encSessionKey);
				return this.createRSACipher(privateKey, Cipher.DECRYPT_MODE).doFinal(encSessionKeyRaw);
			} catch (NoSuchAlgorithmException e) {
				throw new RuntimeException(e);
			} catch (BadPaddingException | IllegalBlockSizeException e) {
				throw new CryptoError(e);
			}
		} else {
			Key key = getSymmetricKey();
			return crypto.decryptKey(key, Utils.base64ToBytes(encSessionKey));
		}
	}

	private void generateAsymmetricKeyPair() throws NoSuchAlgorithmException, NoSuchProviderException, InvalidAlgorithmParameterException {
		Calendar start = Calendar.getInstance();
		Calendar end = Calendar.getInstance();
		end.add(Calendar.YEAR, 50);

		KeyPairGeneratorSpec spec = new KeyPairGeneratorSpec.Builder(context)
				.setAlias(ASYMMETRIC_KEY_ALIAS)
				.setSubject(new X500Principal("CN=" + ASYMMETRIC_KEY_ALIAS))
				.setSerialNumber(BigInteger.TEN)
				.setStartDate(start.getTime())
				.setEndDate(end.getTime())
				.setKeySize(2048)
				.build();
		Log.d(TAG, "Generating device key");
		KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA", AndroidKeyStore);
		kpg.initialize(spec);
		long startTime = System.currentTimeMillis();
		kpg.generateKeyPair();
		long endTime = System.currentTimeMillis();
		Log.d(TAG, "Generation of key took (ms): " + (endTime - startTime));
	}

	@RequiresApi(23)
	private void generateSymmetricKey() throws NoSuchAlgorithmException, NoSuchProviderException, InvalidAlgorithmParameterException {
		KeyGenerator keyGenerator = KeyGenerator.getInstance("AES", AndroidKeyStore);
		keyGenerator.init(new KeyGenParameterSpec.Builder(SYMMETRIC_KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
				.setBlockModes(KeyProperties.BLOCK_MODE_CBC)
				.setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
				.setRandomizedEncryptionRequired(false)
				.build());
		keyGenerator.generateKey();
	}

	private boolean supportsSymmetricEncryption() {
		return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M;
	}

	private Key getSymmetricKey() throws KeyStoreException {
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
}
