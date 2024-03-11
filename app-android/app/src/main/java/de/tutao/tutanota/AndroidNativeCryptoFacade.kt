package de.tutao.tutanota

import android.content.Context
import android.net.Uri
import androidx.annotation.Keep
import androidx.annotation.VisibleForTesting
import de.tutao.tutanota.ipc.*
import org.apache.commons.io.IOUtils
import org.apache.commons.io.input.CountingInputStream
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

class AndroidNativeCryptoFacade(
	private val context: Context,
	private val tempDir: TempDir = TempDir(context),
	val randomizer: SecureRandom = SecureRandom(),
) : NativeCryptoFacade {

	companion object {
		const val AES_BLOCK_SIZE_BYTES = 16
		val FIXED_IV = ByteArray(AES_BLOCK_SIZE_BYTES).apply { fill(0x88.toByte()) }
		const val RSA_KEY_LENGTH_IN_BITS = 2048
		const val RSA_ALGORITHM = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding"
		const val RSA_PUBLIC_EXPONENT = 65537

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

		const val AES128_KEY_LENGTH = 128
		const val AES128_KEY_LENGTH_BYTES = AES128_KEY_LENGTH / 8

		const val AES256_KEY_LENGTH = 256
		const val AES256_KEY_LENGTH_BYTES = AES256_KEY_LENGTH / 8

		const val HMAC_256 = "HmacSHA256"

		/**
		 * Converts the given byte array to a key.
		 *
		 * @param key The bytes representation of the key.
		 * @return The key.
		 */
		fun bytesToKey(key: ByteArray): SecretKeySpec {
			require(key.size == AES128_KEY_LENGTH_BYTES || key.size == AES256_KEY_LENGTH_BYTES) { "Invalid key length ${key.size}" }
			return SecretKeySpec(key, "AES")
		}

		@Throws(NoSuchAlgorithmException::class)
		private fun getSubKeys(key: SecretKeySpec, mac: Boolean): SubKeys {
			val keyLength = getAesKeyLength(key)
			return if (mac) {
				val digest = when (keyLength) {
					AesKeyLength.Aes128 -> MessageDigest.getInstance("SHA-256")
					AesKeyLength.Aes256 -> MessageDigest.getInstance("SHA-512")
				}
				val hash = digest.digest(key.encoded)
				val hashLen = hash.size
				val firstHashPart = hash.copyOfRange(0, hashLen / 2)
				val subkeys = SubKeys(
					cKey = SecretKeySpec(firstHashPart, "AES"),
					mKey = hash.copyOfRange(hashLen / 2, hashLen)
				)
				firstHashPart.fill(0)
				subkeys
			} else {
				if (keyLength == AesKeyLength.Aes256) {
					throw java.lang.IllegalArgumentException("must use mac with AES-256")
				}
				SubKeys(
					cKey = key,
					mKey = null
				)
			}
		}

		private fun getAesKeyLength(key: Key): AesKeyLength {
			return getAesKeyLength(key.encoded.size)
		}

		private fun getAesKeyLength(key: SecretKeySpec): AesKeyLength {
			return getAesKeyLength(key.encoded.size)
		}

		private fun getAesKeyLength(sizeInBytes: Int): AesKeyLength {
			return when (sizeInBytes) {
				AES128_KEY_LENGTH_BYTES -> AesKeyLength.Aes128
				AES256_KEY_LENGTH_BYTES -> AesKeyLength.Aes256
				else -> throw CryptoError("invalid key length (in bytes): " + sizeInBytes)
			}

		}

		private fun hmac256(key: ByteArray, data: ByteArray): ByteArray {
			val macKey = SecretKeySpec(key, HMAC_256)
			val hmac = Mac.getInstance(HMAC_256)
			hmac.init(macKey)
			return hmac.doFinal(data)
		}
	}

	@Throws(CryptoError::class)
	override suspend fun generateKyberKeypair(seed: DataWrapper): KyberKeyPair {
		return generateKyberKeypairImpl(seed.data)
	}

	@Throws(CryptoError::class)
	private external fun generateKyberKeypairImpl(seed: ByteArray): KyberKeyPair

	@Throws(CryptoError::class)
	override suspend fun kyberEncapsulate(publicKey: KyberPublicKey, seed: DataWrapper): KyberEncapsulation {
		return this.kyberEncapsulateImpl(publicKey.raw.data, seed.data)
	}

	@Throws(CryptoError::class)
	private external fun kyberEncapsulateImpl(publicKey: ByteArray, seed: ByteArray): KyberEncapsulation

	@Throws(CryptoError::class)
	override suspend fun kyberDecapsulate(privateKey: KyberPrivateKey, ciphertext: DataWrapper): DataWrapper {
		return DataWrapper(this.kyberDecapsulateImpl(ciphertext.data, privateKey.raw.data))
	}

	@Throws(CryptoError::class)
	private external fun kyberDecapsulateImpl(ciphertext: ByteArray, privateKey: ByteArray): ByteArray

	@Throws(CryptoError::class)
	override suspend fun argon2idHashRaw(
		password: DataWrapper,
		salt: DataWrapper,
		timeCost: Int,
		memoryCost: Int,
		parallelism: Int,
		hashLength: Int
	): DataWrapper {
		return DataWrapper(
			this.argon2idHashRawImpl(
				password.data,
				salt.data,
				timeCost,
				memoryCost,
				parallelism,
				hashLength
			)
		)
	}

	@Throws(CryptoError::class)
	external fun argon2idHashRawImpl(
		password: ByteArray,
		salt: ByteArray,
		timeCost: Int,
		memoryCost: Int,
		parallelism: Int,
		hashLength: Int
	): ByteArray

	@Throws(CryptoError::class)
	override suspend fun rsaEncrypt(
		publicKey: RsaPublicKey,
		data: DataWrapper,
		seed: DataWrapper,
	): DataWrapper {
		try {
			return this.rsaEncrypt(
				javaPublicKey(publicKey),
				data.data,
				seed.data
			).wrap()
		} catch (e: InvalidKeySpecException) {
			// These types of errors can happen and that's okay, they should be handled gracefully.
			throw CryptoError(e)
		}
	}

	/**
	 * Encrypts an aes key with RSA to a byte array.
	 */
	@Throws(CryptoError::class)
	fun rsaEncrypt(publicKey: PublicKey, data: ByteArray, random: ByteArray): ByteArray {
		randomizer.setSeed(random)
		return rsaEncrypt(data, publicKey, randomizer)
	}

	@Throws(CryptoError::class)
	private fun rsaEncrypt(data: ByteArray, publicKey: PublicKey, randomizer: SecureRandom): ByteArray {
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

	@Throws(CryptoError::class)
	override suspend fun rsaDecrypt(privateKey: RsaPrivateKey, data: DataWrapper): DataWrapper {
		try {
			return rsaDecrypt(
				javaPrivateKey(privateKey),
				data.data,
			).wrap()
		} catch (e: InvalidKeySpecException) {
			// These types of errors can happen and that's okay, they should be handled gracefully.
			throw CryptoError(e)
		}
	}

	@Throws(CryptoError::class)
	fun rsaDecrypt(privateKey: PrivateKey, encryptedKey: ByteArray): ByteArray {
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
		}
	}

	@Throws(IOException::class, CryptoError::class)
	override suspend fun aesEncryptFile(key: DataWrapper, fileUri: String, iv: DataWrapper): EncryptedFileInfo {
		val parsedFileUri = Uri.parse(fileUri)
		val outputFile = File(tempDir.encrypt, getFileInfo(context, parsedFileUri).name)
		val inputStream = CountingInputStream(context.contentResolver.openInputStream(parsedFileUri))
		val out: OutputStream = FileOutputStream(outputFile)
		aesEncrypt(key.data, inputStream, out, iv.data, usePadding = true, useMac = true)
		return EncryptedFileInfo(outputFile.toUri(), inputStream.byteCount.toInt())
	}

	@Throws(IOException::class, CryptoError::class)
	fun aesEncryptData(
		key: ByteArray,
		input: ByteArray,
		iv: ByteArray = generateIv()
	): ByteArray {
		val bais = ByteArrayInputStream(input)
		val baos = ByteArrayOutputStream()
		aesEncrypt(key, bais, baos, iv, usePadding = true, useMac = true)
		return baos.toByteArray()
	}

	@VisibleForTesting(otherwise = VisibleForTesting.PRIVATE)
	@Throws(CryptoError::class, IOException::class)
	fun aesEncrypt(
		key: ByteArray,
		input: InputStream,
		out: OutputStream,
		iv: ByteArray,
		useMac: Boolean = true,
		usePadding: Boolean = true
	) {
		var encrypted: InputStream? = null
		try {
			val cipher = if (usePadding) {
				Cipher.getInstance(AES_MODE_PADDING)
			} else {
				Cipher.getInstance(AES_MODE_NO_PADDING)
			}
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
	override suspend fun aesDecryptFile(key: DataWrapper, fileUri: String): String {
		val parsedFileUri = Uri.parse(fileUri)
		val file = getFileInfo(context, parsedFileUri)
		val newFileName = getNonClobberingFileName(tempDir.decrypt, file.name)
		val outputFile = File(tempDir.decrypt, newFileName)
		val input = context.contentResolver.openInputStream(parsedFileUri)!!
		val out: OutputStream = FileOutputStream(outputFile)
		aesDecrypt(key.data, input, out, file.size, true)
		return Uri.fromFile(outputFile).toString()
	}

	@Throws(IOException::class, CryptoError::class)
	fun aesDecryptData(
		key: ByteArray,
		input: ByteArray,
	): ByteArray {
		val bais = ByteArrayInputStream(input)
		val baos = ByteArrayOutputStream()
		aesDecrypt(key, bais, baos, input.count().toLong(), padding = true)
		return baos.toByteArray()
	}

	@Throws(CryptoError::class)
	fun encryptKey(encryptionKey: Key, keyToEncryptWithoutIv: ByteArray?): ByteArray {
		return when (getAesKeyLength(encryptionKey)) {
			AesKeyLength.Aes128 -> aes128EncryptKey(encryptionKey, keyToEncryptWithoutIv!!)
			AesKeyLength.Aes256 -> aes256EncryptKey(encryptionKey, keyToEncryptWithoutIv!!)
		}
	}

	private fun aes256EncryptKey(encryptionKey: Key, keyToEncryptWithoutIv: ByteArray): ByteArray {
		val iv = generateIv()
		val keyToEncryptStream = ByteArrayInputStream(keyToEncryptWithoutIv)
		val output = ByteArrayOutputStream()
		this.aesEncrypt(encryptionKey.encoded, keyToEncryptStream, output, iv, true, false)
		return output.toByteArray()
	}

	@VisibleForTesting
	fun generateIv(): ByteArray {
		val iv = ByteArray(AES_BLOCK_SIZE_BYTES)
		randomizer.nextBytes(iv)
		return iv
	}

	fun generateAes256Key(): ByteArray {
		val key = ByteArray(AES256_KEY_LENGTH_BYTES)
		randomizer.nextBytes(key)
		return key
	}

	private fun aes128EncryptKey(encryptionKey: Key, keyToEncryptWithoutIv: ByteArray): ByteArray {
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
	fun decryptKey(encryptionKey: Key, encryptedKey: ByteArray): ByteArray {
		val outputStream = ByteArrayOutputStream()
		when (getAesKeyLength(encryptionKey)) {
			AesKeyLength.Aes128 -> {
				val fullInput =
					FIXED_IV + encryptedKey // concatenate with fixed IVs since it isn't in the key in the legacy case
				aesDecrypt(
					encryptionKey.encoded,
					ByteArrayInputStream(fullInput),
					outputStream,
					fullInput.size.toLong(),
					false
				)
			}

			AesKeyLength.Aes256 -> {
				aesDecrypt(
					encryptionKey.encoded,
					ByteArrayInputStream(encryptedKey),
					outputStream,
					encryptedKey.size.toLong(),
					false
				)
			}
		}
		return outputStream.toByteArray()
	}

	@Throws(CryptoError::class)
	fun decryptKey(encryptionKey: ByteArray, encryptedKeyWithoutIV: ByteArray): ByteArray {
		return decryptKey(bytesToKey(encryptionKey), encryptedKeyWithoutIV)
	}

	@Throws(CryptoError::class)
	fun aesDecryptBase64String(key: ByteArray, base64EncData: String): ByteArray {
		val encData = base64EncData.base64ToBytes()
		val out = ByteArrayOutputStream()
		try {
			this.aesDecrypt(key, ByteArrayInputStream(encData), out, encData.size.toLong(), true)
		} catch (e: IOException) {
			throw CryptoError(e)
		}
		return out.toByteArray()
	}

	@VisibleForTesting(otherwise = VisibleForTesting.PRIVATE)
	@Throws(IOException::class, CryptoError::class)
	fun aesDecrypt(key: ByteArray, input: InputStream, out: OutputStream, inputSize: Long, padding: Boolean) {
		return when (getAesKeyLength(key.size)) {
			AesKeyLength.Aes128 -> aesDecryptImpl(key, input, out, inputSize, padding, false)
			AesKeyLength.Aes256 -> aesDecryptImpl(key, input, out, inputSize, padding, true)
		}
	}

	@Throws(IOException::class, CryptoError::class)
	private fun aesDecryptImpl(
		key: ByteArray,
		input: InputStream,
		out: OutputStream,
		inputSize: Long,
		padding: Boolean,
		enforceMac: Boolean
	) {
		var inputWithoutMac = input
		var decrypted: InputStream? = null
		try {
			var cKey = key
			val hasMac = hasMac(inputSize)
			if (enforceMac && !hasMac) {
				throw CryptoError("mac expected but not found")
			}

			if (hasMac) {
				val subKeys = getSubKeys(bytesToKey(key), hasMac)
				cKey = subKeys.cKey.encoded
					val tempOut = ByteArrayOutputStream()
					IOUtils.copyLarge(inputWithoutMac, tempOut)
					val cipherText = tempOut.toByteArray()
					val cipherTextWithoutMac = cipherText.copyOfRange(1, cipherText.size - 32)
					val providedMacBytes = cipherText.copyOfRange(cipherText.size - 32, cipherText.size)
					val computedMacBytes = hmac256(subKeys.mKey!!, cipherTextWithoutMac)
					if (!Arrays.equals(computedMacBytes, providedMacBytes)) {
						throw CryptoError("invalid mac")
					}
					inputWithoutMac = ByteArrayInputStream(cipherTextWithoutMac)
				}
			val iv = ByteArray(AES_BLOCK_SIZE_BYTES)
			IOUtils.read(inputWithoutMac, iv)
			val aesMode = if (padding) {
				AES_MODE_PADDING
			} else {
				AES_MODE_NO_PADDING
			}
			val cipher = Cipher.getInstance(aesMode)
			val params = IvParameterSpec(iv)
			cipher.init(Cipher.DECRYPT_MODE, bytesToKey(cKey), params)
			decrypted = CipherInputStream(inputWithoutMac, cipher)
			IOUtils.copyLarge(decrypted, out, ByteArray(1024 * 1000))
		} catch (e: InvalidKeyException) {
			throw CryptoError(e)
		} finally {
			IOUtils.closeQuietly(inputWithoutMac)
			IOUtils.closeQuietly(decrypted)
			IOUtils.closeQuietly(out)
		}
	}

	@Throws(InvalidKeySpecException::class)
	private fun javaPublicKey(key: RsaPublicKey): PublicKey {
		val modulus = BigInteger(key.modulus.base64ToBytes())
		val keyFactory = KeyFactory.getInstance("RSA")
		return keyFactory.generatePublic(RSAPublicKeySpec(modulus, BigInteger.valueOf(RSA_PUBLIC_EXPONENT.toLong())))
	}

	@Throws(InvalidKeySpecException::class)
	private fun javaPrivateKey(key: RsaPrivateKey): PrivateKey {
		val modulus = BigInteger(key.modulus.base64ToBytes())
		val privateExponent = BigInteger(key.privateExponent.base64ToBytes())
		val keyFactory = KeyFactory.getInstance("RSA")
		return keyFactory.generatePrivate(RSAPrivateKeySpec(modulus, privateExponent))
	}

	private fun BigInteger.toBase64() = toByteArray().toBase64()

	private fun PrivateKey(javaKey: RSAPrivateCrtKey) = RsaPrivateKey(
		version = 0,
		// TODO: is this correct?
		keyLength = RSA_KEY_LENGTH_IN_BITS,
		modulus = javaKey.modulus.toBase64(),
		privateExponent = javaKey.privateExponent.toBase64(),
		primeP = javaKey.primeP.toBase64(),
		primeQ = javaKey.primeQ.toBase64(),
		primeExponentP = javaKey.primeExponentP.toBase64(),
		primeExponentQ = javaKey.primeExponentQ.toBase64(),
		crtCoefficient = javaKey.crtCoefficient.toBase64(),
	)

	private fun PublicKey(javaKey: RSAPublicKey) = RsaPublicKey(
		version = 0,
		keyLength = RSA_KEY_LENGTH_IN_BITS,
		modulus = javaKey.modulus.toBase64(),
		publicExponent = RSA_PUBLIC_EXPONENT,
	)

	private fun hasMac(dataLength: Long): Boolean {
		return dataLength % 2 == 1L
	}
}


private class SubKeys(
	var cKey: SecretKeySpec,
	var mKey: ByteArray?,
)


@Keep
class CryptoError : Exception {
	constructor(message: String) : super(message)
	constructor(cause: Throwable) : super(cause)
}
