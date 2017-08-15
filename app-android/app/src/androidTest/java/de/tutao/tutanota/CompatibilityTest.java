package de.tutao.tutanota;


import android.support.test.InstrumentationRegistry;
import android.support.test.runner.AndroidJUnit4;

import org.apache.commons.codec.DecoderException;
import org.apache.commons.codec.binary.Hex;
import org.apache.commons.io.output.ByteArrayOutputStream;
import org.codehaus.jackson.JsonParseException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

import javax.crypto.NoSuchPaddingException;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;

@RunWith(AndroidJUnit4.class)
public class CompatibilityTest {

    final static String TEST_DATA = "CompatibilityTestData.json";

    static ObjectMapper om = new ObjectMapper();
    static TestData testData;

    @BeforeClass
    public static void readTestData() throws JsonParseException, JsonMappingException, IOException {
        InputStream inputStream = InstrumentationRegistry.getContext().getAssets().open(TEST_DATA);
        testData = om.readValue(inputStream, TestData.class);
    }


    @Test
    public void aes128() throws InvalidKeyException, NoSuchAlgorithmException, NoSuchPaddingException, InvalidAlgorithmParameterException, IOException {
        Crypto crypto = new Crypto();
        for (AesTestData td : CompatibilityTest.testData.getAes128Tests()) {
            byte[] key = hexToBytes(td.getHexKey());
            ByteArrayOutputStream encryptedBytes = new ByteArrayOutputStream();
            crypto.aesEncrypt(key, new ByteArrayInputStream(Utils.base64ToBytes(td.getPlainTextBase64())), encryptedBytes, Utils.base64ToBytes(td.getIvBase64()));
            assertEquals(td.getCipherTextBase64(), Utils.bytesToBase64(encryptedBytes.toByteArray()));
            ByteArrayOutputStream decryptedBytes = new ByteArrayOutputStream();
            crypto.aesDecrypt(key, new ByteArrayInputStream(encryptedBytes.toByteArray()), decryptedBytes);
            assertEquals(td.getPlainTextBase64(), Utils.bytesToBase64(decryptedBytes.toByteArray()));
        }
    }

    public static String bytesToHex(byte[] binaryData) {
        return Hex.encodeHexString(binaryData);
    }

    public static byte[] hexToBytes(String hex) {
        try {
            return Hex.decodeHex(hex.toCharArray());
        } catch (DecoderException e) {
            throw new RuntimeException("invalid hex: " + hex);
        }
    }

}