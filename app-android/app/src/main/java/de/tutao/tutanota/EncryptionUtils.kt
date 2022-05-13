package de.tutao.tutanota

import java.nio.charset.StandardCharsets
import java.util.*

object EncryptionUtils {
	@Throws(CryptoError::class)
	fun decryptDate(encryptedData: String, crypto: Crypto, sessionKey: ByteArray): Date {
		val decBytes = crypto.aesDecrypt(sessionKey, encryptedData)
		return Date(String(decBytes, StandardCharsets.UTF_8).toLong())
	}

	@Throws(CryptoError::class)
	fun decryptString(encryptedData: String, crypto: Crypto, sessionKey: ByteArray): String {
		val decBytes = crypto.aesDecrypt(sessionKey, encryptedData)
		return String(decBytes, StandardCharsets.UTF_8)
	}

	@Throws(CryptoError::class)
	fun decryptNumber(encryptedData: String, crypto: Crypto, sessionKey: ByteArray): Long {
		val stringValue = decryptString(encryptedData, crypto, sessionKey)
		return stringValue.toLong()
	}
}