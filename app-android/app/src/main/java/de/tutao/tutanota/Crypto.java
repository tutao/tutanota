package de.tutao.tutanota;

import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import org.apache.commons.io.IOUtils;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigInteger;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.RSAPrivateKeySpec;
import java.security.spec.RSAPublicKeySpec;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public final class Crypto {
    public static final String TEMP_DIR_ENCRYPTED = "temp/encrypted";
    public static final String TEMP_DIR_DECRYPTED = "temp/decrypted";
    private static final String PROVIDER = "BC";

    private final static int RSA_KEY_LENGTH_IN_BITS = 2048;
    private static final String RSA_ALGORITHM = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";
    private final static int RSA_PUBLIC_EXPONENT = 65537;

    public static final String AES_MODE_PADDING = "AES/CBC/PKCS5Padding";
    public static final int AES_KEY_LENGTH = 128;
    public static final int AES_KEY_LENGTH_BYTES = AES_KEY_LENGTH / 8;

    private final static String TAG = "tutao.Crypto";
    private SecureRandom randomizer;

    private static final Integer ANDROID_6_SDK_VERSION = 23;

    private final MainActivity activity;

    static {
        // see: http://android-developers.blogspot.de/2013/08/some-securerandom-thoughts.html
        PRNGFixes.apply();
    }

    public Crypto(MainActivity activity) {
        this.activity = activity;
        this.randomizer = new SecureRandom();
    }


    protected synchronized JSONObject generateRsaKey(byte[] seed) throws JSONException, NoSuchProviderException, NoSuchAlgorithmException {
        this.randomizer.setSeed(seed);
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA", PROVIDER);
        generator.initialize(RSA_KEY_LENGTH_IN_BITS, randomizer);
        KeyPair keyPair = generator.generateKeyPair();
        return this.keyPairToJson(keyPair);
    }

    private JSONObject privateKeyToJson(RSAPrivateCrtKey key) throws JSONException {
        JSONObject json = new JSONObject();
        json.put("version", 0);
        json.put("modulus", Utils.bytesToBase64(key.getModulus().toByteArray()));
        json.put("privateExponent", Utils.bytesToBase64(key.getPrivateExponent().toByteArray()));
        json.put("primeP", Utils.bytesToBase64(key.getPrimeP().toByteArray()));
        json.put("primeQ", Utils.bytesToBase64(key.getPrimeQ().toByteArray()));
        json.put("primeExponentP", Utils.bytesToBase64(key.getPrimeExponentP().toByteArray()));
        json.put("primeExponentQ", Utils.bytesToBase64(key.getPrimeExponentQ().toByteArray()));
        json.put("crtCoefficient", Utils.bytesToBase64(key.getCrtCoefficient().toByteArray()));
        return json;
    }

    private JSONObject publicKeyToJson(RSAPublicKey key) throws JSONException {
        JSONObject json = new JSONObject();
        json.put("version", 0);
        json.put("modulus", Utils.bytesToBase64(key.getModulus().toByteArray()));
        return json;
    }

    private JSONObject keyPairToJson(KeyPair keyPair) throws JSONException {
        JSONObject json = new JSONObject();
        json.put("publicKey", publicKeyToJson((RSAPublicKey) keyPair.getPublic()));
        json.put("privateKey", privateKeyToJson((RSAPrivateCrtKey) keyPair.getPrivate()));
        return json;
    }

    private PublicKey jsonToPublicKey(JSONObject json) throws JSONException {
        BigInteger modulus = new BigInteger(Utils.base64ToBytes(json.getString("modulus")));

        try {
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            return keyFactory.generatePublic(new RSAPublicKeySpec(modulus, BigInteger.valueOf(RSA_PUBLIC_EXPONENT)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private PrivateKey jsonToPrivateKey(JSONObject json) throws JSONException, NoSuchAlgorithmException, InvalidKeySpecException {
        BigInteger modulus = new BigInteger(Utils.base64ToBytes(json.getString("modulus")));
        BigInteger privateExponent = new BigInteger(Utils.base64ToBytes(json.getString("privateExponent")));

        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePrivate(new RSAPrivateKeySpec(modulus, privateExponent));
    }

    /**
     * Encrypts an aes key with RSA to a byte array.
     */
    String rsaEncrypt(JSONObject publicKeyJson, byte[] key, byte[] random) throws JSONException, NoSuchAlgorithmException,
            NoSuchProviderException, NoSuchPaddingException, InvalidKeyException, IllegalBlockSizeException, BadPaddingException {
        PublicKey publicKey = jsonToPublicKey(publicKeyJson);
        this.randomizer.setSeed(random);
        byte[] encrypted = rsaEncrypt(key, publicKey, this.randomizer);
        String encryptedBase64 = Utils.bytesToBase64(encrypted);
        return encryptedBase64;
    }

    private byte[] rsaEncrypt(byte[] key, PublicKey publicKey, SecureRandom randomizer) throws NoSuchAlgorithmException, NoSuchProviderException, NoSuchPaddingException, InvalidKeyException, IllegalBlockSizeException, BadPaddingException {
        Cipher cipher = Cipher.getInstance(RSA_ALGORITHM, PROVIDER);
        cipher.init(Cipher.ENCRYPT_MODE, publicKey, randomizer);
        return cipher.doFinal(key);
    }

    /**
     * Decrypts a byte array with RSA to an AES key.
     */
    String rsaDecrypt(JSONObject jsonPrivateKey, byte[] encryptedKey) throws NoSuchAlgorithmException,
            InvalidKeySpecException, JSONException, NoSuchProviderException, NoSuchPaddingException, InvalidKeyException, IllegalBlockSizeException,
            BadPaddingException {
        byte[] decrypted = rsaDecrypt(jsonPrivateKey, encryptedKey, this.randomizer);
        return Utils.bytesToBase64(decrypted);
    }

    private byte[] rsaDecrypt(JSONObject jsonPrivateKey, byte[] encryptedKey, SecureRandom randomizer) throws JSONException, NoSuchAlgorithmException, InvalidKeySpecException, NoSuchProviderException, NoSuchPaddingException, InvalidKeyException, IllegalBlockSizeException, BadPaddingException {
        Cipher cipher;
        PrivateKey privateKey = jsonToPrivateKey(jsonPrivateKey);
        cipher = Cipher.getInstance(RSA_ALGORITHM, PROVIDER);
        cipher.init(Cipher.DECRYPT_MODE, privateKey, randomizer);
        return cipher.doFinal(encryptedKey);
    }

    /**
     * Converts the given byte array to a key.
     *
     * @param key The bytes representation of the key.
     * @return The key.
     */
    public static SecretKeySpec bytesToKey(byte[] key) {
        if (key.length != AES_KEY_LENGTH_BYTES) {
            throw new RuntimeException("invalid key length");
        }
        return new SecretKeySpec(key, "AES");
    }

    String aesEncryptFile(final byte[] key, final String fileUrl, final byte[] iv) throws IOException, InvalidKeyException, NoSuchAlgorithmException, NoSuchPaddingException, InvalidAlgorithmParameterException {
        Context context = activity.getWebView().getContext();
        File inputFile = Utils.uriToFile(context, fileUrl);
        File encryptedDir = new File(Utils.getDir(context), TEMP_DIR_ENCRYPTED);
        encryptedDir.mkdirs();
        File outputFile = new File(encryptedDir, inputFile.getName());

        InputStream in = context.getContentResolver().openInputStream(Uri.parse(fileUrl));
        OutputStream out = new FileOutputStream(outputFile);
        aesEncrypt(key, in, out, iv);

        return Utils.fileToUri(outputFile);
    }

    public void aesEncrypt(final byte[] key, InputStream in, OutputStream out, final byte[] iv) throws NoSuchAlgorithmException, NoSuchPaddingException, InvalidKeyException,
            InvalidAlgorithmParameterException, IOException {
        InputStream encrypted = null;
        try {
            Cipher cipher = Cipher.getInstance(AES_MODE_PADDING);
            IvParameterSpec params = new IvParameterSpec(iv);
            cipher.init(Cipher.ENCRYPT_MODE, bytesToKey(key), params);
            encrypted = getCipherInputStream(in, cipher);
            out.write(iv);
            IOUtils.copy(encrypted, out);
        } finally {
            IOUtils.closeQuietly(in);
            IOUtils.closeQuietly(encrypted);
            IOUtils.closeQuietly(out);
        }
    }

    private String aesDecrypt(final byte[] key, final byte[] cipherText) throws InvalidKeyException, NoSuchAlgorithmException, InvalidAlgorithmParameterException, NoSuchPaddingException, IOException {
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    aesDecrypt(key, new ByteArrayInputStream(cipherText), out);
                            return Utils.bytesToBase64(out.toByteArray());
    }

    String aesDecryptFile(final byte[] key, final String fileUrl) throws IOException, InvalidKeyException, NoSuchAlgorithmException, InvalidAlgorithmParameterException, NoSuchPaddingException {
        Context context = activity.getWebView().getContext();
        File inputFile = Utils.uriToFile(context, fileUrl);
        File decryptedDir = new File(Utils.getDir(context), TEMP_DIR_DECRYPTED);
        decryptedDir.mkdirs();
        File outputFile = new File(decryptedDir, inputFile.getName());

        InputStream in = context.getContentResolver().openInputStream(Uri.parse(fileUrl));
        OutputStream out = new FileOutputStream(outputFile);
        aesDecrypt(key, in, out);

        return Utils.fileToUri(outputFile);
    }

    public void aesDecrypt(final byte[] key, InputStream in, OutputStream out) throws IOException,
            NoSuchAlgorithmException, NoSuchPaddingException, InvalidKeyException, InvalidAlgorithmParameterException {
        InputStream decrypted = null;
        try {
            byte[] iv = new byte[AES_KEY_LENGTH_BYTES];
            IOUtils.read(in, iv);
            Cipher cipher = Cipher.getInstance(AES_MODE_PADDING);
            IvParameterSpec params = new IvParameterSpec(iv);
            cipher.init(Cipher.DECRYPT_MODE, bytesToKey(key), params);
            decrypted = getCipherInputStream(in, cipher);
            IOUtils.copy(decrypted, out);
        } finally {
            IOUtils.closeQuietly(in);
            IOUtils.closeQuietly(decrypted);
            IOUtils.closeQuietly(out);
        }
    }

    private InputStream getCipherInputStream(InputStream in, Cipher cipher) {
        if (Build.VERSION.SDK_INT < ANDROID_6_SDK_VERSION) {
            // Use the tutao cipher suite implementation to increase download performance.
            return new TutaoCipherInputStream(in, cipher);
        } else {
            // Cipher.getOutputSize returns to small buffer in some case in android 6.0.
            return new CipherInputStream(in, cipher);
        }
    }

}