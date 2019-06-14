package de.tutao.tutanota;

import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.support.annotation.VisibleForTesting;

import org.apache.commons.io.IOUtils;
import org.apache.commons.io.input.CountingInputStream;
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
import java.security.MessageDigest;
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
import java.util.Arrays;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.Mac;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public final class Crypto {
    public static final String TEMP_DIR_ENCRYPTED = "temp/encrypted";
    public static final String TEMP_DIR_DECRYPTED = "temp/decrypted";
    private static final String PROVIDER = "BC";
    public static final byte[] FIXED_IV = new byte[16];

    private final static int RSA_KEY_LENGTH_IN_BITS = 2048;
    private static final String RSA_ALGORITHM = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";
    private final static int RSA_PUBLIC_EXPONENT = 65537;

    private static final String AES_MODE_PADDING = "AES/CBC/PKCS5Padding";
    private static final String AES_MODE_NO_PADDING = "AES/CBC/NoPadding";
    public static final int AES_KEY_LENGTH = 128;
    public static final int AES_KEY_LENGTH_BYTES = AES_KEY_LENGTH / 8;

    private final static String TAG = "tutao.Crypto";
    private SecureRandom randomizer;

    private static final Integer ANDROID_6_SDK_VERSION = 23;

    private final Context context;

    static {
        // see: http://android-developers.blogspot.de/2013/08/some-securerandom-thoughts.html
        PRNGFixes.apply();
        for (int i = 0; i < FIXED_IV.length; i++) {
            FIXED_IV[i] = (byte) 0x88;
        }
    }

    public static final String HMAC_256 = "HmacSHA256";

    public Crypto(Context context) {
        this(context, new SecureRandom());
    }

    @VisibleForTesting
    protected Crypto(Context context, SecureRandom randomizer) {
        this.context = context;
        this.randomizer = randomizer;
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
    String rsaEncrypt(JSONObject publicKeyJson, byte[] data, byte[] random) throws CryptoError {
        try {
            PublicKey publicKey = jsonToPublicKey(publicKeyJson);
            return this.rsaEncrypt(publicKey, data, random);
        } catch (JSONException e) {
            // These types of errors are unexpected and fatal.
            throw new RuntimeException(e);
        }
    }

    /**
     * Encrypts an aes key with RSA to a byte array.
     */
    String rsaEncrypt(PublicKey publicKey, byte[] data, byte[] random) throws CryptoError {
        this.randomizer.setSeed(random);
        byte[] encrypted = rsaEncrypt(data, publicKey, this.randomizer);
        return Utils.bytesToBase64(encrypted);
    }


    private byte[] rsaEncrypt(byte[] data, PublicKey publicKey, SecureRandom randomizer) throws CryptoError {
        try {
            Cipher cipher = Cipher.getInstance(RSA_ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, publicKey, randomizer);
            return cipher.doFinal(data);
        } catch (NoSuchAlgorithmException | NoSuchPaddingException e) {
            throw new RuntimeException(e);
        } catch (BadPaddingException | IllegalBlockSizeException | InvalidKeyException e) {
            throw new CryptoError(e);
        }
    }

    /**
     * Decrypts a byte array with RSA to an AES key.
     */
    String rsaDecrypt(JSONObject jsonPrivateKey, byte[] encryptedKey) throws CryptoError {
        try {
            PrivateKey privateKey = jsonToPrivateKey(jsonPrivateKey);
            byte[] decrypted = rsaDecrypt(privateKey, encryptedKey);
            return Utils.bytesToBase64(decrypted);
        } catch (InvalidKeySpecException e) {
            // These types of errors can happen and that's okay, they should be handled gracefully.
            throw new CryptoError(e);
        } catch (JSONException | NoSuchAlgorithmException e) {
            // These errors are not expected, fatal for the whole application and should be
            // reported.
            throw new RuntimeException("rsaDecrypt error", e);
        }
    }

    public byte[] rsaDecrypt(PrivateKey privateKey, byte[] encryptedKey) throws CryptoError {
        try {
            Cipher cipher = Cipher.getInstance(RSA_ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, privateKey, this.randomizer);
            return cipher.doFinal(encryptedKey);
        } catch (BadPaddingException | InvalidKeyException
                | IllegalBlockSizeException e) {
            throw new CryptoError(e);
        } catch (NoSuchAlgorithmException |
                NoSuchPaddingException e) {
            // These errors are not expected, fatal for the whole application and should be
            // reported.
            throw new RuntimeException("rsaDecrypt error", e);
        }
    }


    /**
     * Converts the given byte array to a key.
     *
     * @param key The bytes representation of the key.
     * @return The key.
     */
    public static SecretKeySpec bytesToKey(byte[] key) {
        if (key.length != AES_KEY_LENGTH_BYTES) {
            throw new RuntimeException("invalid key length: " + key.length);
        }
        return new SecretKeySpec(key, "AES");
    }

    EncryptedFileInfo aesEncryptFile(final byte[] key, final String fileUrl, final byte[] iv) throws IOException, CryptoError {
        Uri fileUri = Uri.parse(fileUrl);
        FileInfo file = Utils.getFileInfo(context, fileUri);
        File encryptedDir = new File(Utils.getDir(context), TEMP_DIR_ENCRYPTED);
        encryptedDir.mkdirs();
        File outputFile = new File(encryptedDir, file.name);

        CountingInputStream in = new CountingInputStream(context.getContentResolver().openInputStream(fileUri));
        OutputStream out = new FileOutputStream(outputFile);
        aesEncrypt(key, in, out, iv, true);
        return new EncryptedFileInfo(Utils.fileToUri(outputFile), in.getByteCount());
    }

    public void aesEncrypt(final byte[] key, InputStream in, OutputStream out, final byte[] iv, boolean useMac) throws CryptoError, IOException {
        InputStream encrypted = null;
        try {
            Cipher cipher = Cipher.getInstance(AES_MODE_PADDING);
            IvParameterSpec params = new IvParameterSpec(iv);
            SubKeys subKeys = getSubKeys(bytesToKey(key), useMac);
            cipher.init(Cipher.ENCRYPT_MODE, subKeys.cKey, params);
            encrypted = getCipherInputStream(in, cipher);
            ByteArrayOutputStream tempOut = new ByteArrayOutputStream();
            tempOut.write(iv);
            IOUtils.copy(encrypted, tempOut);
            if (useMac) {
                byte[] data = tempOut.toByteArray();
                out.write(new byte[]{1});
                out.write(data);
                byte[] macBytes = hmac256(subKeys.mKey, data);
                out.write(macBytes);
            } else {
                out.write(tempOut.toByteArray());
            }
        } catch (InvalidKeyException e) {
            throw new CryptoError(e);
        } catch (NoSuchPaddingException | InvalidAlgorithmParameterException | NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        } finally {
            IOUtils.closeQuietly(in);
            IOUtils.closeQuietly(encrypted);
            IOUtils.closeQuietly(out);
        }
    }

    String aesDecryptFile(final byte[] key, final String fileUrl) throws IOException, CryptoError {
        Uri fileUri = Uri.parse(fileUrl);
        FileInfo file = Utils.getFileInfo(context, fileUri);
        File decryptedDir = new File(Utils.getDir(context), TEMP_DIR_DECRYPTED);
        decryptedDir.mkdirs();
        File outputFile = new File(decryptedDir, file.name);
        InputStream in = context.getContentResolver().openInputStream(Uri.parse(fileUrl));
        OutputStream out = new FileOutputStream(outputFile);
        aesDecrypt(key, in, out, file.size);
        return Uri.fromFile(outputFile).toString();
    }

    public byte[] aesDecrypt(final byte[] key, String base64EncData) throws CryptoError {
        byte[] encData = Utils.base64ToBytes(base64EncData);
        return this.aesDecrypt(key, encData);
    }

    public byte[] decryptKey(final byte[] encryptionKey, final byte[] encryptedKeyWithoutIV) throws CryptoError {
        try {
            Cipher cipher = Cipher.getInstance(AES_MODE_NO_PADDING);
            IvParameterSpec params = new IvParameterSpec(FIXED_IV);
            cipher.init(Cipher.DECRYPT_MODE, bytesToKey(encryptionKey), params);
            return cipher.doFinal(encryptedKeyWithoutIV);
        } catch (BadPaddingException | IllegalBlockSizeException | InvalidKeyException e) {
            throw new CryptoError(e);
        } catch (InvalidAlgorithmParameterException | NoSuchAlgorithmException | NoSuchPaddingException e) {
            throw new RuntimeException(e);
        }
    }

    public byte[] aesDecrypt(final byte[] key, byte[] encData) throws CryptoError {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            this.aesDecrypt(key, new ByteArrayInputStream(encData), out, encData.length);
        } catch (IOException e) {
            throw new CryptoError(e);
        }
        return out.toByteArray();
    }


    public void aesDecrypt(final byte[] key, InputStream in, OutputStream out, long inputSize) throws IOException, CryptoError {
        InputStream decrypted = null;
        try {
            byte[] cKey = key;
            boolean macIncluded = inputSize % 2 == 1;
            if (macIncluded) {
                SubKeys subKeys = getSubKeys(bytesToKey(key), true);
                cKey = subKeys.cKey.getEncoded();

                ByteArrayOutputStream tempOut = new ByteArrayOutputStream();
                IOUtils.copyLarge(in, tempOut);
                byte[] cipherText = tempOut.toByteArray();

                byte[] cipherTextWithoutMac = Arrays.copyOfRange(cipherText, 1, cipherText.length - 32);

                byte[] providedMacBytes = Arrays.copyOfRange(cipherText, cipherText.length - 32, cipherText.length);
                byte[] computedMacBytes = hmac256(subKeys.mKey, cipherTextWithoutMac);

                if (!Arrays.equals(computedMacBytes, providedMacBytes)) {
                    throw new CryptoError("invalid mac");
                }
                in = new ByteArrayInputStream(cipherTextWithoutMac);
            }

            byte[] iv = new byte[AES_KEY_LENGTH_BYTES];
            IOUtils.read(in, iv);
            Cipher cipher = Cipher.getInstance(AES_MODE_PADDING);
            IvParameterSpec params = new IvParameterSpec(iv);
            cipher.init(Cipher.DECRYPT_MODE, bytesToKey(cKey), params);
            decrypted = getCipherInputStream(in, cipher);
            IOUtils.copyLarge(decrypted, out, new byte[1024 * 1000]);
        } catch (NoSuchAlgorithmException | NoSuchPaddingException
                | InvalidAlgorithmParameterException e) {
            throw new RuntimeException(e);
        } catch (InvalidKeyException e) {
            throw new CryptoError(e);
        } finally {
            IOUtils.closeQuietly(in);
            IOUtils.closeQuietly(decrypted);
            IOUtils.closeQuietly(out);
        }
    }

    public SecureRandom getRandomizer() {
        return randomizer;
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

    private static class SubKeys {
        public SecretKeySpec cKey;
        public byte[] mKey;
    }

    private static SubKeys getSubKeys(SecretKeySpec key, boolean mac) throws NoSuchAlgorithmException {
        SubKeys subKeys = new SubKeys();
        if (mac) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(key.getEncoded());
            subKeys.cKey = new SecretKeySpec(Arrays.copyOfRange(hash, 0, 16), "AES");
            subKeys.mKey = Arrays.copyOfRange(hash, 16, 32);
        } else {
            subKeys.cKey = key;
        }
        return subKeys;
    }

    private static byte[] hmac256(byte[] key, byte[] data) {
        SecretKeySpec macKey = new SecretKeySpec(key, HMAC_256);
        try {
            Mac hmac = Mac.getInstance(HMAC_256);
            hmac.init(macKey);
            return hmac.doFinal(data);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException(e);
        }
    }

    public class EncryptedFileInfo {
        private String uri;
        private long unencSize;

        public EncryptedFileInfo(String uri, long unencSize) {
            this.unencSize = unencSize;
            this.uri = uri;
        }

        public String getUri() {
            return this.uri;
        }

        public long getUnencSize() {
            return this.unencSize;
        }

        public JSONObject toJSON() throws JSONException {
            JSONObject json = new JSONObject();
            json.put("uri", this.uri);
            json.put("unencSize", this.unencSize);
            return json;
        }
    }
}
