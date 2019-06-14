package de.tutao.tutanota;

import java.nio.charset.StandardCharsets;
import java.util.Date;

public class EncryptionUtils {
    public static Date decryptDate(String encryptedData, Crypto crypto, byte[] sessionKey) throws CryptoError {
        byte[] decBytes = crypto.aesDecrypt(sessionKey, encryptedData);
        return new Date(Long.valueOf(new String(decBytes, StandardCharsets.UTF_8)));
    }

    public static String decryptString(String encryptedData, Crypto crypto, byte[] sessionKey) throws CryptoError {
        byte[] decBytes = crypto.aesDecrypt(sessionKey, encryptedData);
        return new String(decBytes, StandardCharsets.UTF_8);
    }
}
