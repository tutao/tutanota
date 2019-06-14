package de.tutao.tutanota;

import android.content.Context;
import android.security.KeyPairGeneratorSpec;
import android.util.Log;

import java.io.IOException;
import java.math.BigInteger;
import java.security.InvalidAlgorithmParameterException;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.UnrecoverableEntryException;
import java.security.cert.CertificateException;
import java.util.Calendar;

import javax.security.auth.x500.X500Principal;

public class AndroidKeyStoreFacade {
    public static final String TAG = "AndroidKeyStoreFacade";

    private static final String AndroidKeyStore = "AndroidKeyStore";
    private static final String KEY_ALIAS = "TutanotaAppDeviceKey";
    private final Crypto crypto;
    private KeyStore keyStore;
    private Context context;


    public AndroidKeyStoreFacade(Context context) {
        this.context = context;
        this.crypto = new Crypto(context);
        try {
            keyStore = KeyStore.getInstance(AndroidKeyStore);
            keyStore.load(null);
            // Generate the RSA key pairs
            if (!keyStore.containsAlias(KEY_ALIAS)) {
                // Generate a key pair for encryption
                Calendar start = Calendar.getInstance();
                Calendar end = Calendar.getInstance();
                end.add(Calendar.YEAR, 50);

                KeyPairGeneratorSpec spec = new KeyPairGeneratorSpec.Builder(context)
                        .setAlias(KEY_ALIAS)
                        .setSubject(new X500Principal("CN=" + KEY_ALIAS))
                        .setSerialNumber(BigInteger.TEN)
                        .setStartDate(start.getTime())
                        .setEndDate(end.getTime())
                        .build();
                KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA", AndroidKeyStore);
                kpg.initialize(spec);
                kpg.generateKeyPair();
            }

        } catch (NoSuchAlgorithmException | NoSuchProviderException | InvalidAlgorithmParameterException | KeyStoreException | IOException | CertificateException e) {
            Log.w(TAG, "Keystore could not be initialized", e);
        }
    }

    public String encryptKey(byte[] sessionKey) throws UnrecoverableEntryException, KeyStoreException, CryptoError {
        if (keyStore == null) {
            throw new KeyStoreException("Keystore was not initialized");
        }
        KeyStore.PrivateKeyEntry privateKeyEntry;
        try {
            privateKeyEntry = (KeyStore.PrivateKeyEntry) keyStore.getEntry(KEY_ALIAS, null);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }

        return this.crypto.rsaEncrypt(privateKeyEntry.getCertificate().getPublicKey(), sessionKey, new byte[0]);
    }

    public byte[] decryptKey(String encSessionKey) throws UnrecoverableEntryException, KeyStoreException, CryptoError {
        if (keyStore == null) {
            throw new KeyStoreException("Keystore was not initialized");
        }
        KeyStore.PrivateKeyEntry privateKeyEntry;
        try {
            privateKeyEntry = (KeyStore.PrivateKeyEntry) keyStore.getEntry(KEY_ALIAS, null);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
        byte[] encSessionKeyRaw = Utils.base64ToBytes(encSessionKey);
        return this.crypto.rsaDecrypt(privateKeyEntry.getPrivateKey(), encSessionKeyRaw);
    }
}
