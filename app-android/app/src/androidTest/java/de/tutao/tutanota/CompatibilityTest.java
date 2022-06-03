package de.tutao.tutanota;


import static org.junit.Assert.assertEquals;

import android.content.Context;
import android.support.test.InstrumentationRegistry;
import android.support.test.runner.AndroidJUnit4;

import androidx.annotation.NonNull;
import org.apache.commons.io.output.ByteArrayOutputStream;
import org.codehaus.jackson.map.ObjectMapper;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;
import java.security.SecureRandom;
import java.util.ArrayList;
import static org.mockito.Mockito.mock;


@RunWith(AndroidJUnit4.class)
public class CompatibilityTest {

    private final static String TEST_DATA = "CompatibilityTestData.json";

    private static ObjectMapper om = new ObjectMapper();
    private static TestData testData;

    @BeforeClass
    public static void readTestData() throws IOException {
        InputStream inputStream = InstrumentationRegistry.getContext().getAssets().open(TEST_DATA);
        testData = om.readValue(inputStream, TestData.class);
    }


    @Test
    public void aes128() throws CryptoError, IOException {
        Crypto crypto = new Crypto(mock(Context.class));
        for (AesTestData td : CompatibilityTest.testData.getAes128Tests()) {
            byte[] key = hexToBytes(td.getHexKey());
            ByteArrayOutputStream encryptedBytes = new ByteArrayOutputStream();
            crypto.aesEncrypt(key, new ByteArrayInputStream(Utils.base64ToBytes(td.getPlainTextBase64())), encryptedBytes, Utils.base64ToBytes(td.getIvBase64()), false);
            assertEquals(td.getCipherTextBase64(), Utils.toBase64(encryptedBytes.toByteArray()));
            ByteArrayOutputStream decryptedBytes = new ByteArrayOutputStream();
            crypto.aesDecrypt(key, new ByteArrayInputStream(encryptedBytes.toByteArray()), decryptedBytes, encryptedBytes.size());
            assertEquals(td.getPlainTextBase64(), Utils.toBase64(decryptedBytes.toByteArray()));
        }
    }

    @Test
    public void aes128Mac() throws CryptoError, IOException {
        Crypto crypto = new Crypto(mock(Context.class));
        for (AesTestData td : CompatibilityTest.testData.getAes128MacTests()) {
            byte[] key = hexToBytes(td.getHexKey());
            ByteArrayOutputStream encryptedBytes = new ByteArrayOutputStream();
            crypto.aesEncrypt(key, new ByteArrayInputStream(Utils.base64ToBytes(td.getPlainTextBase64())), encryptedBytes, Utils.base64ToBytes(td.getIvBase64()), true);
            assertEquals(td.getCipherTextBase64(), Utils.toBase64(encryptedBytes.toByteArray()));
            ByteArrayOutputStream decryptedBytes = new ByteArrayOutputStream();
            crypto.aesDecrypt(key, new ByteArrayInputStream(encryptedBytes.toByteArray()), decryptedBytes, encryptedBytes.size());
            assertEquals(td.getPlainTextBase64(), Utils.toBase64(decryptedBytes.toByteArray()));
        }
    }

    @Test
    public void rsa() throws CryptoError {

        for (EncryptionTestData testData : CompatibilityTest.testData.getRsaEncryptionTests()) {
            Crypto crypto = new Crypto(mock(Context.class), stubRandom(testData.seed));
            JSONObject publicKeyJSON = hexToPublicKey(testData.getPublicKey());

            String base64Result = crypto.rsaEncrypt(publicKeyJSON, hexToBytes(testData.getInput()), hexToBytes(testData.seed));
            byte[] encryptedResultBytes = Utils.base64ToBytes(base64Result);
            //String hexResult = bytesToHex(encryptedResultBytes);
            //assertEquals(testData.getResult(), hexResult);
            //cannot compare encrypted test data because default android implementation ignores randomizer

            String base64PlainText = crypto.rsaDecrypt(hexToPrivateKey(testData.getPrivateKey()), encryptedResultBytes);
            assertEquals(testData.input, bytesToHex(Utils.base64ToBytes(base64PlainText)));

            String base64PlainTextFromTestData = crypto.rsaDecrypt(hexToPrivateKey(testData.getPrivateKey()), hexToBytes(testData.getResult()));
            assertEquals(testData.input, bytesToHex(Utils.base64ToBytes(base64PlainTextFromTestData)));
        }
    }

    @NonNull
    private static JSONObject hexToPrivateKey(@NonNull String hex) {
        return arrayToPrivateKey(hexToKeyArray(hex));
    }

    @NonNull
    private static JSONObject hexToPublicKey(@NonNull String hex) {
        return arrayToPublicKey(hexToKeyArray(hex));
    }

    @NonNull
    private static BigInteger[] hexToKeyArray(@NonNull String hex) {
        ArrayList<BigInteger> key = new ArrayList<>();
        int pos = 0;
        while (pos < hex.length()) {
            int nextParamLen = Integer.parseInt(hex.substring(pos, pos + 4), 16);
            pos += 4;
            key.add(new BigInteger(hex.substring(pos, pos + nextParamLen), 16));
            pos += nextParamLen;
        }
        return key.toArray(new BigInteger[]{});
    }

    @NonNull
    private static JSONObject arrayToPrivateKey(@NonNull BigInteger[] keyArray) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("version", 0);
            jsonObject.put("modulus", Utils.toBase64(keyArray[0].toByteArray()));
            jsonObject.put("privateExponent", Utils.toBase64(keyArray[1].toByteArray()));
            jsonObject.put("primeP", Utils.toBase64(keyArray[2].toByteArray()));
            jsonObject.put("primeQ", Utils.toBase64(keyArray[3].toByteArray()));
            jsonObject.put("primeExponentP", Utils.toBase64(keyArray[4].toByteArray()));
            jsonObject.put("primeExponentQ", Utils.toBase64(keyArray[5].toByteArray()));
            jsonObject.put("crtCoefficient", Utils.toBase64(keyArray[6].toByteArray()));
            return jsonObject;
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    @NonNull
    private static JSONObject arrayToPublicKey(@NonNull BigInteger[] keyArray) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("version", 0);
            jsonObject.put("modulus", Utils.toBase64(keyArray[0].toByteArray()));
            return jsonObject;
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    private static byte[] hexToBytes(String s) {
        int len = s.length();
        byte[] data = new byte[len / 2];

        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4) + Character.digit(s.charAt(i + 1), 16));
        }

        return data;
    }

    final private static char[] hexArray = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'};

    private static String bytesToHex(byte[] bytes) {
        char[] hexChars = new char[bytes.length * 2];
        int v;

        for (int j = 0; j < bytes.length; j++) {
            v = bytes[j] & 0xFF;
            hexChars[j * 2] = hexArray[v >>> 4];
            hexChars[j * 2 + 1] = hexArray[v & 0x0F];
        }

        return new String(hexChars);
    }


    private static SecureRandom stubRandom(final String seed) {
        return new SecureRandom() {
            @Override
            public synchronized void nextBytes(byte[] bytes) {
                if (bytes.length != 32) {
                    throw new RuntimeException(bytes.length + "!");
                } else {
                    byte[] random = hexToBytes(seed);
                    System.arraycopy(random, 0, bytes, 0, bytes.length);
                }
            }
        };
    }

}
