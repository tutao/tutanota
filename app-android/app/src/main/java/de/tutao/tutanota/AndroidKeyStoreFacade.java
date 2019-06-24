package de.tutao.tutanota;

import android.content.Context;
import android.security.KeyPairGeneratorSpec;
import android.util.Log;

import java.io.IOException;
import java.math.BigInteger;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.UnrecoverableEntryException;
import java.security.cert.CertificateException;
import java.security.spec.MGF1ParameterSpec;
import java.util.Calendar;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import javax.security.auth.x500.X500Principal;

import static de.tutao.tutanota.Crypto.RSA_ALGORITHM;

public class AndroidKeyStoreFacade {
    public static final String TAG = "AndroidKeyStoreFacade";

    private static final String AndroidKeyStore = "AndroidKeyStore";
    private static final String KEY_ALIAS = "TutanotaAppDeviceKey";
    private final Crypto crypto;
    private KeyStore keyStore;
    private Context context;

    private final static OAEPParameterSpec OAEP_PARAMETER_SPEC_MGF1_SHA1 = new OAEPParameterSpec(
            "SHA-256",
            "MGF1",
            MGF1ParameterSpec.SHA1,
            PSource.PSpecified.DEFAULT);


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
                        .setKeySize(4096)
                        .build();
                KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA", AndroidKeyStore);
                kpg.initialize(spec);
                kpg.generateKeyPair();
            }

        } catch (NoSuchAlgorithmException | NoSuchProviderException | InvalidAlgorithmParameterException | KeyStoreException | IOException | CertificateException e) {
            Log.w(TAG, "Keystore could not be initialized", e);
        }
    }

    public String encryptKey(byte[] sessionKey) throws KeyStoreException, CryptoError {
        if (keyStore == null) {
            throw new KeyStoreException("Keystore was not initialized");
        }
        PublicKey publicKey = keyStore.getCertificate(KEY_ALIAS).getPublicKey();
        try {
            return Utils.bytesToBase64(this.createRSACipher(publicKey, Cipher.ENCRYPT_MODE).doFinal(sessionKey));
        } catch (BadPaddingException | IllegalBlockSizeException e) {
            throw new CryptoError(e);
        }
    }

    private Cipher createRSACipher(Key key, int mode) throws CryptoError {
        // We use separate RSA implementation than Crypto.java and all other encryption because
        // AndroidKeyStore provider is incompatible with OAEP MGF1_SHA256
        try {
            Cipher cipher = Cipher.getInstance(RSA_ALGORITHM);
            cipher.init(mode, key, OAEP_PARAMETER_SPEC_MGF1_SHA1);
            return cipher;
        } catch (NoSuchAlgorithmException | NoSuchPaddingException | InvalidAlgorithmParameterException e) {
            throw new RuntimeException(e);
        } catch (InvalidKeyException e) {
            throw new CryptoError(e);
        }
    }


    public byte[] decryptKey(String encSessionKey) throws UnrecoverableEntryException, KeyStoreException, CryptoError {
        if (keyStore == null) {
            throw new KeyStoreException("Keystore was not initialized");
        }
        PrivateKey privateKey;
        try {
            privateKey = (PrivateKey) keyStore.getKey(KEY_ALIAS, null);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
        byte[] encSessionKeyRaw = Utils.base64ToBytes(encSessionKey);
        try {
            return this.createRSACipher(privateKey, Cipher.DECRYPT_MODE).doFinal(encSessionKeyRaw);
        } catch (BadPaddingException | IllegalBlockSizeException e) {
            throw new CryptoError(e);
        }
    }
}
