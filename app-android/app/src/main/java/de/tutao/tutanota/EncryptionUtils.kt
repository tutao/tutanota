package de.tutao.tutanota

import java.nio.charset.StandardCharsets
import java.util.*

@Throws(CryptoError::class)
fun Crypto.decryptDate(encryptedData: String, sessionKey: ByteArray): Date {
	val decBytes = aesDecrypt(sessionKey, encryptedData)
	return Date(String(decBytes, StandardCharsets.UTF_8).toLong())
}

@Throws(CryptoError::class)
fun Crypto.decryptString(encryptedData: String, sessionKey: ByteArray): String {
	val decBytes = aesDecrypt(sessionKey, encryptedData)
	return String(decBytes, StandardCharsets.UTF_8)
}

@Throws(CryptoError::class)
fun Crypto.decryptNumber(encryptedData: String, sessionKey: ByteArray): Long {
	val stringValue = decryptString(encryptedData, sessionKey)
	return stringValue.toLong()
}