package de.tutao.tutanota

import android.content.Context
import android.net.Uri
import androidx.annotation.VisibleForTesting
import org.apache.commons.io.IOUtils
import org.apache.commons.io.input.CountingInputStream
import org.json.JSONObject
import java.io.*
import java.math.BigInteger
import java.security.*
import java.security.interfaces.RSAPrivateCrtKey
import java.security.interfaces.RSAPublicKey
import java.security.spec.InvalidKeySpecException
import java.security.spec.MGF1ParameterSpec
import java.security.spec.RSAPrivateKeySpec
import java.security.spec.RSAPublicKeySpec
import java.util.*
import javax.crypto.*
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.OAEPParameterSpec
import javax.crypto.spec.PSource
import javax.crypto.spec.SecretKeySpec

class Crypto @VisibleForTesting constructor(private val context: Context, val randomizer: SecureRandom) {

	constructor(context: Context) : this(context, SecureRandom())

	companion object {
		const val TEMP_DIR_ENCRYPTED = "temp/encrypted"
		const val TEMP_DIR_DECRYPTED = "temp/decrypted"
		const val AES_BLOCK_SIZE_BYTES = 16
		private val FIXED_IV = ByteArray(AES_BLOCK_SIZE_BYTES).apply { fill(0x80.toByte()) }
		private const val RSA_KEY_LENGTH_IN_BITS = 2048
		const val RSA_ALGORITHM = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding"
		private const val RSA_PUBLIC_EXPONENT = 65537

		/**
		 * Android picks not the same implementation for encryption and decryption so we have to be
		 * a little bit more explicit.
		 *
		 *
		 * See https://issuetracker.google.com/issues/36708951#comment15
		 * See https://issuetracker.google.com/issues/37075898#comment7
		 */
		private val OAEP_PARAMETER_SPEC = OAEPParameterSpec(
				"SHA-256",
				"MGF1",
				MGF1ParameterSpec.SHA256,
				PSource.PSpecified.DEFAULT
		)
		private const val AES_MODE_PADDING = "AES/CBC/PKCS5Padding"
		const val AES_MODE_NO_PADDING = "AES/CBC/NoPadding"
		const val AES_KEY_LENGTH = 128
		const val AES_KEY_LENGTH_BYTES = AES_KEY_LENGTH / 8
		const val HMAC_256 = "HmacSHA256"

		/**
		 * Converts the given byte array to a key.
		 *
		 * @param key The bytes representation of the key.
		 * @return The key.
		 */
		fun bytesToKey(key: ByteArray): SecretKeySpec {
			require(key.size == AES_KEY_LENGTH_BYTES) { "Invalid key length ${key.size}" }
			return SecretKeySpec(key, "AES")
		}

		@Throws(NoSuchAlgorithmException::class)
		private fun getSubKeys(key: SecretKeySpec, mac: Boolean): SubKeys {
			return if (mac) {
				val digest = MessageDigest.getInstance("SHA-256")
				val hash = digest.digest(key.encoded)
				SubKeys(
						cKey = SecretKeySpec(hash.copyOfRange(0, 16), "AES"),
						mKey = hash.copyOfRange(16, 32)
				)
			} else {
				SubKeys(
						cKey = key,
						mKey = null
				)
			}
		}

		private fun hmac256(key: ByteArray, data: ByteArray): ByteArray {
			val macKey = SecretKeySpec(key, HMAC_256)
			val hmac = Mac.getInstance(HMAC_256)
			hmac.init(macKey)
			return hmac.doFinal(data)
		}
	}

	@Synchronized
	fun generateRsaKey(seed: ByteArray): JSONObject {
		randomizer.setSeed(seed)
		val generator = KeyPairGenerator.getInstance("RSA")
		generator.initialize(RSA_KEY_LENGTH_IN_BITS, randomizer)
		val keyPair = generator.generateKeyPair()
		return keyPairToJson(keyPair)
	}

	private fun privateKeyToJson(key: RSAPrivateCrtKey): JSONObject {
		val json = JSONObject()
		json.put("version", 0)
		json.put("modulus", key.modulus.toByteArray().toBase64())
		json.put("privateExponent", key.privateExponent.toByteArray().toBase64())
		json.put("primeP", key.primeP.toByteArray().toBase64())
		json.put("primeQ", key.primeQ.toByteArray().toBase64())
		json.put("primeExponentP", key.primeExponentP.toByteArray().toBase64())
		json.put("primeExponentQ", key.primeExponentQ.toByteArray().toBase64())
		json.put("crtCoefficient", key.crtCoefficient.toByteArray().toBase64())
		return json
	}

	private fun publicKeyToJson(key: RSAPublicKey): JSONObject {
		val json = JSONObject()
		json.put("version", 0)
		json.put("modulus", key.modulus.toByteArray().toBase64())
		return json
	}

	private fun keyPairToJson(keyPair: KeyPair): JSONObject {
		val json = JSONObject()
		json.put("publicKey", publicKeyToJson(keyPair.public as RSAPublicKey))
		json.put("privateKey", privateKeyToJson(keyPair.private as RSAPrivateCrtKey))
		return json
	}

	private fun jsonToPublicKey(json: JSONObject): PublicKey {
		val modulus = BigInteger(json.getString("modulus").base64ToBytes())
		val keyFactory = KeyFactory.getInstance("RSA")
		return keyFactory.generatePublic(RSAPublicKeySpec(modulus, BigInteger.valueOf(RSA_PUBLIC_EXPONENT.toLong())))
	}

	@Throws(InvalidKeySpecException::class)
	private fun jsonToPrivateKey(json: JSONObject): PrivateKey {
		val modulus = BigInteger(json.getString("modulus").base64ToBytes())
		val privateExponent = BigInteger(json.getString("privateExponent").base64ToBytes())
		val keyFactory = KeyFactory.getInstance("RSA")
		return keyFactory.generatePrivate(RSAPrivateKeySpec(modulus, privateExponent))
	}

	/**
	 * Encrypts an aes key with RSA to a byte array.
	 */
	@Throws(CryptoError::class)
	fun rsaEncrypt(publicKeyJson: JSONObject, data: ByteArray?, random: ByteArray?): String {
		val publicKey = jsonToPublicKey(publicKeyJson)
		return this.rsaEncrypt(publicKey, data, random)
	}

	/**
	 * Encrypts an aes key with RSA to a byte array.
	 */
	@Throws(CryptoError::class)
	fun rsaEncrypt(publicKey: PublicKey, data: ByteArray?, random: ByteArray?): String {
		randomizer.setSeed(random)
		return rsaEncrypt(data, publicKey, randomizer).toBase64()
	}

	@Throws(CryptoError::class)
	private fun rsaEncrypt(data: ByteArray?, publicKey: PublicKey, randomizer: SecureRandom): ByteArray {
		return try {
			val cipher = Cipher.getInstance(RSA_ALGORITHM)
			cipher.init(Cipher.ENCRYPT_MODE, publicKey, OAEP_PARAMETER_SPEC, randomizer)
			cipher.doFinal(data)
		} catch (e: BadPaddingException) {
			throw CryptoError(e)
		} catch (e: IllegalBlockSizeException) {
			throw CryptoError(e)
		} catch (e: InvalidKeyException) {
			throw CryptoError(e)
		}
	}

	/**
	 * Decrypts a byte array with RSA to an AES key.
	 */
	@Throws(CryptoError::class)
	fun rsaDecrypt(jsonPrivateKey: JSONObject, encryptedKey: ByteArray?): String {
		return try {
			val privateKey = jsonToPrivateKey(jsonPrivateKey)
			rsaDecrypt(privateKey, encryptedKey).toBase64()
		} catch (e: InvalidKeySpecException) {
			// These types of errors can happen and that's okay, they should be handled gracefully.
			throw CryptoError(e)
		} catch (e: NoSuchAlgorithmException) {
			throw RuntimeException("rsaDecrypt error", e)
		}
	}

	@Throws(CryptoError::class)
	fun rsaDecrypt(privateKey: PrivateKey?, encryptedKey: ByteArray?): ByteArray {
		return try {
			val cipher = Cipher.getInstance(RSA_ALGORITHM)
			cipher.init(Cipher.DECRYPT_MODE, privateKey, OAEP_PARAMETER_SPEC, randomizer)
			cipher.doFinal(encryptedKey)
		} catch (e: BadPaddingException) {
			throw CryptoError(e)
		} catch (e: InvalidKeyException) {
			throw CryptoError(e)
		} catch (e: IllegalBlockSizeException) {
			throw CryptoError(e)
		} catch (e: NoSuchAlgorithmException) {
			// These errors are not expected, fatal for the whole application and should be
			// reported.
			throw RuntimeException("rsaDecrypt error", e)
		} catch (e: NoSuchPaddingException) {
			throw RuntimeException("rsaDecrypt error", e)
		} catch (e: InvalidAlgorithmParameterException) {
			throw RuntimeException("rsaDecrypt error", e)
		}
	}

	@Throws(IOException::class, CryptoError::class)
	fun aesEncryptFile(key: ByteArray, fileUrl: String, iv: ByteArray): EncryptedFileInfo {
		val fileUri = Uri.parse(fileUrl)
		val file = getFileInfo(context, fileUri)
		val encryptedDir = File(getDir(context), TEMP_DIR_ENCRYPTED)
		encryptedDir.mkdirs()
		val outputFile = File(encryptedDir, file.name)
		val inputStream = CountingInputStream(context.contentResolver.openInputStream(fileUri))
		val out: OutputStream = FileOutputStream(outputFile)
		aesEncrypt(key, inputStream, out, iv, true)
		return EncryptedFileInfo(outputFile.toUri(), inputStream.byteCount)
	}

	@Throws(CryptoError::class, IOException::class)
	fun aesEncrypt(key: ByteArray, input: InputStream, out: OutputStream, iv: ByteArray, useMac: Boolean) {
		var encrypted: InputStream? = null
		try {
			val cipher = Cipher.getInstance(AES_MODE_PADDING)
			val params = IvParameterSpec(iv)
			val subKeys = getSubKeys(bytesToKey(key), useMac)
			cipher.init(Cipher.ENCRYPT_MODE, subKeys.cKey, params)
			encrypted = CipherInputStream(input, cipher)
			val tempOut = ByteArrayOutputStream()
			tempOut.write(iv)
			IOUtils.copy(encrypted, tempOut)
			if (useMac) {
				val data = tempOut.toByteArray()
				out.write(byteArrayOf(1))
				out.write(data)
				val macBytes = hmac256(subKeys.mKey!!, data)
				out.write(macBytes)
			} else {
				out.write(tempOut.toByteArray())
			}
		} catch (e: InvalidKeyException) {
			throw CryptoError(e)
		} finally {
			IOUtils.closeQuietly(input)
			IOUtils.closeQuietly(encrypted)
			IOUtils.closeQuietly(out)
		}
	}

	@Throws(IOException::class, CryptoError::class)
	fun aesDecryptFile(key: ByteArray, fileUrl: String): String {
		val fileUri = Uri.parse(fileUrl)
		val file = getFileInfo(context, fileUri)
		val decryptedDir = File(getDir(context), TEMP_DIR_DECRYPTED)
		decryptedDir.mkdirs()
		val outputFile = File(decryptedDir, file.name)
		val input = context.contentResolver.openInputStream(Uri.parse(fileUrl))!!
		val out: OutputStream = FileOutputStream(outputFile)
		aesDecrypt(key, input, out, file.size)
		return Uri.fromFile(outputFile).toString()
	}

	@Throws(CryptoError::class)
	fun aesDecrypt(key: ByteArray, base64EncData: String): ByteArray {
		val encData = base64EncData.base64ToBytes()
		return this.aesDecrypt(key, encData)
	}

	@Throws(CryptoError::class)
	fun encryptKey(encryptionKey: Key?, keyToEncryptWithoutIv: ByteArray?): ByteArray {
		return try {
			val cipher = Cipher.getInstance(AES_MODE_NO_PADDING)
			val params = IvParameterSpec(FIXED_IV)
			cipher.init(Cipher.ENCRYPT_MODE, encryptionKey, params)
			cipher.doFinal(keyToEncryptWithoutIv)
		} catch (e: BadPaddingException) {
			throw CryptoError(e)
		} catch (e: IllegalBlockSizeException) {
			throw CryptoError(e)
		} catch (e: InvalidKeyException) {
			throw CryptoError(e)
		}
	}

	@Throws(CryptoError::class)
	fun decryptKey(encryptionKey: Key, encryptedKeyWithoutIV: ByteArray): ByteArray {
		return try {
			val cipher = Cipher.getInstance(AES_MODE_NO_PADDING)
			val params = IvParameterSpec(FIXED_IV)
			cipher.init(Cipher.DECRYPT_MODE, encryptionKey, params)
			cipher.doFinal(encryptedKeyWithoutIV)
		} catch (e: BadPaddingException) {
			throw CryptoError(e)
		} catch (e: IllegalBlockSizeException) {
			throw CryptoError(e)
		} catch (e: InvalidKeyException) {
			throw CryptoError(e)
		}
	}

	@Throws(CryptoError::class)
	fun decryptKey(encryptionKey: ByteArray, encryptedKeyWithoutIV: ByteArray): ByteArray {
		return decryptKey(bytesToKey(encryptionKey), encryptedKeyWithoutIV)
	}

	@Throws(CryptoError::class)
	fun aesDecrypt(key: ByteArray, encData: ByteArray): ByteArray {
		val out = ByteArrayOutputStream()
		try {
			this.aesDecrypt(key, ByteArrayInputStream(encData), out, encData.size.toLong())
		} catch (e: IOException) {
			throw CryptoError(e)
		}
		return out.toByteArray()
	}

	@Throws(IOException::class, CryptoError::class)
	fun aesDecrypt(key: ByteArray, input: InputStream, out: OutputStream, inputSize: Long) {
		var input = input
		var decrypted: InputStream? = null
		try {
			var cKey = key
			val macIncluded = inputSize % 2 == 1L
			if (macIncluded) {
				val subKeys = getSubKeys(bytesToKey(key), true)
				cKey = subKeys.cKey!!.encoded
				val tempOut = ByteArrayOutputStream()
				IOUtils.copyLarge(input, tempOut)
				val cipherText = tempOut.toByteArray()
				val cipherTextWithoutMac = cipherText.copyOfRange(1, cipherText.size - 32)
				val providedMacBytes = cipherText.copyOfRange(cipherText.size - 32, cipherText.size)
				val computedMacBytes = hmac256(subKeys.mKey!!, cipherTextWithoutMac)
				if (!Arrays.equals(computedMacBytes, providedMacBytes)) {
					throw CryptoError("invalid mac")
				}
				input = ByteArrayInputStream(cipherTextWithoutMac)
			}
			val iv = ByteArray(AES_KEY_LENGTH_BYTES)
			IOUtils.read(input, iv)
			val cipher = Cipher.getInstance(AES_MODE_PADDING)
			val params = IvParameterSpec(iv)
			cipher.init(Cipher.DECRYPT_MODE, bytesToKey(cKey), params)
			decrypted = CipherInputStream(input, cipher)
			IOUtils.copyLarge(decrypted, out, ByteArray(1024 * 1000))
		} catch (e: InvalidKeyException) {
			throw CryptoError(e)
		} finally {
			IOUtils.closeQuietly(input)
			IOUtils.closeQuietly(decrypted)
			IOUtils.closeQuietly(out)
		}
	}

	class EncryptedFileInfo(val uri: String, val unencSize: Long) {
		fun toJSON(): JSONObject {
			val json = JSONObject()
			json.put("uri", uri)
			json.put("unencSize", unencSize)
			return json
		}
	}

}

private class SubKeys(
		var cKey: SecretKeySpec?,
		var mKey: ByteArray?,
)


class CryptoError : Exception {
	constructor(message: String) : super(message)
	constructor(cause: Throwable) : super(cause)
}