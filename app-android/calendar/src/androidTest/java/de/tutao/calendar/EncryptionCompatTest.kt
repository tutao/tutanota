package de.tutao.calendar

import android.content.Context
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.fasterxml.jackson.databind.ObjectMapper
import de.tutao.calendar.testdata.TestData
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.AndroidNativeCryptoFacade.Companion.AES256_KEY_LENGTH_BYTES
import de.tutao.tutashared.AndroidNativeCryptoFacade.Companion.bytesToKey
import de.tutao.tutashared.CryptoError
import de.tutao.tutashared.TempDir
import de.tutao.tutashared.base64ToBytes
import de.tutao.tutashared.ipc.*
import de.tutao.tutashared.toBase64
import de.tutao.tutashared.toHexString
import kotlinx.coroutines.runBlocking
import org.apache.commons.io.output.ByteArrayOutputStream
import org.junit.Assert.*
import org.junit.Before
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import java.io.ByteArrayInputStream
import java.io.DataInputStream
import java.io.IOException
import java.math.BigInteger
import java.security.SecureRandom
import java.util.*


const val ARGON2ID_TIME_COST = 4
const val ARGON2ID_MEMORY_COST = 32 * 1024
const val ARGON2ID_PARALLELISM = 1
const val ARGON2ID_HASH_LENGTH = 32

@RunWith(AndroidJUnit4::class)
class CompatibilityTest {

	lateinit var crypto: AndroidNativeCryptoFacade

	@Before
	fun setup() {
		val context = mock(Context::class.java)
		crypto = AndroidNativeCryptoFacade(context, TempDir(context))
	}

	@Test
	@Throws(CryptoError::class, IOException::class)
	fun aes128() {
		for (td in testData.aes128Tests) {
			val key = hexToBytes(td.hexKey)
			val encryptedBytes = ByteArrayOutputStream()
			crypto.aesEncrypt(
				key,
				ByteArrayInputStream(td.plainTextBase64.base64ToBytes()),
				encryptedBytes,
				td.ivBase64.base64ToBytes(),
				false
			)
			assertEquals(td.cipherTextBase64, encryptedBytes.toByteArray().toBase64())
			val decryptedBytes = ByteArrayOutputStream()
			crypto.aesDecrypt(
				key,
				ByteArrayInputStream(encryptedBytes.toByteArray()),
				decryptedBytes,
				encryptedBytes.size().toLong(),
				true
			)
			assertEquals(td.plainTextBase64, decryptedBytes.toByteArray().toBase64())

			// encrypt 128 key
			val encryptedKey128 = crypto.encryptKey(bytesToKey(key), hexToBytes(td.keyToEncrypt128))
			assertEquals(td.encryptedKey128, encryptedKey128.toBase64())
			val decryptedKey128 = crypto.decryptKey(bytesToKey(key), td.encryptedKey128.base64ToBytes())
			assertEquals(td.keyToEncrypt128, decryptedKey128.toHexString())

			// encrypt 256 key
			val encryptedKey256 = crypto.encryptKey(bytesToKey(key), hexToBytes(td.keyToEncrypt256))
			assertEquals(td.encryptedKey256, encryptedKey256.toBase64())
			val decryptedKey256 = crypto.decryptKey(bytesToKey(key), td.encryptedKey256.base64ToBytes())
			assertEquals(td.keyToEncrypt256, decryptedKey256.toHexString())
		}
	}


	@Test
	@Throws(CryptoError::class, IOException::class)
	fun aes256() {
		for (td in testData.aes256Tests) {
			val key = hexToBytes(td.hexKey)
			val encryptedBytes = ByteArrayOutputStream()
			crypto.aesEncrypt(
				key,
				ByteArrayInputStream(td.plainTextBase64.base64ToBytes()),
				encryptedBytes,
				td.ivBase64.base64ToBytes(),
				true
			)
			assertEquals(td.cipherTextBase64, encryptedBytes.toByteArray().toBase64())
			val decryptedBytes = ByteArrayOutputStream()
			crypto.aesDecrypt(
				key,
				ByteArrayInputStream(encryptedBytes.toByteArray()),
				decryptedBytes,
				encryptedBytes.size().toLong(),
				true
			)
			assertEquals(td.plainTextBase64, decryptedBytes.toByteArray().toBase64())

			// encrypt 128 key
			val encryptedKey128 = ByteArrayOutputStream()
			crypto.aesEncrypt(
				key,
				ByteArrayInputStream(hexToBytes(td.keyToEncrypt128)),
				encryptedKey128,
				td.ivBase64.base64ToBytes(),
				true,
				false
			)
			assertEquals(td.encryptedKey128, encryptedKey128.toByteArray().toBase64())
			val decryptedKey128 = crypto.decryptKey(bytesToKey(key), td.encryptedKey128.base64ToBytes())
			assertEquals(td.keyToEncrypt128, decryptedKey128.toHexString())

			// encrypt 256 key
			val encryptedKey256 = ByteArrayOutputStream()
			crypto.aesEncrypt(
				key,
				ByteArrayInputStream(hexToBytes(td.keyToEncrypt256)),
				encryptedKey256,
				td.ivBase64.base64ToBytes(),
				true,
				false
			)
			assertEquals(td.encryptedKey256, encryptedKey256.toByteArray().toBase64())
			val decryptedKey256 = crypto.decryptKey(bytesToKey(key), td.encryptedKey256.base64ToBytes())
			assertEquals(td.keyToEncrypt256, decryptedKey256.toHexString())

		}
	}


	@Test
	@Throws(CryptoError::class, IOException::class)
	fun aes256EnforcesMac() {
		crypto.aesEncrypt(
			ByteArray(AES256_KEY_LENGTH_BYTES),
			ByteArrayInputStream(ByteArray(16)),
			ByteArrayOutputStream(),
			ByteArray(16),
			true
		)
		try {
			crypto.aesEncrypt(
				ByteArray(AES256_KEY_LENGTH_BYTES),
				ByteArrayInputStream(ByteArray(16)),
				ByteArrayOutputStream(),
				ByteArray(16),
				false
			)
			fail()
		} catch (e: IllegalArgumentException) {
			assertEquals("must use mac with AES-256", e.message)
		}
	}


	@Test
	@Throws(CryptoError::class, IOException::class)
	fun aes128Mac() {
		for (td in testData.aes128MacTests) {
			val key = hexToBytes(td.hexKey)
			val encryptedBytes = ByteArrayOutputStream()
			crypto.aesEncrypt(
				key,
				ByteArrayInputStream(td.plainTextBase64.base64ToBytes()),
				encryptedBytes,
				td.ivBase64.base64ToBytes(),
				true
			)
			assertEquals(td.cipherTextBase64, encryptedBytes.toByteArray().toBase64())
			val decryptedBytes = ByteArrayOutputStream()
			crypto.aesDecrypt(
				key,
				ByteArrayInputStream(encryptedBytes.toByteArray()),
				decryptedBytes,
				encryptedBytes.size().toLong(),
				true
			)
			assertEquals(td.plainTextBase64, decryptedBytes.toByteArray().toBase64())
		}
	}

	@Test
	fun argon2idTest() {
		for (td in testData.argon2idTests) {
			val key = hexToBytes(td.keyHex)
			val salt = hexToBytes(td.saltHex)
			val password = td.password.toByteArray()
			assertArrayEquals(
				key,
				crypto.argon2idHashRawImpl(
					password,
					salt,
					ARGON2ID_TIME_COST,
					ARGON2ID_MEMORY_COST,
					ARGON2ID_PARALLELISM,
					ARGON2ID_HASH_LENGTH
				)
			)
		}
	}

	@Test
	@Throws(CryptoError::class)
	fun rsa() = runBlocking {
		for (testData in testData.rsaEncryptionTests) {
			val publicKeyJSON = hexToPublicKey(testData.publicKey)
			val encryptedResult: ByteArray = crypto.rsaEncrypt(
				publicKeyJSON,
				hexToBytes(testData.input).wrap(),
				hexToBytes(testData.seed).wrap()
			).data
			//String hexResult = bytesToHex(encryptedResultBytes);
			//assertEquals(testData.getResult(), hexResult);
			//cannot compare encrypted test data because default android implementation ignores randomizer
			val plainText = crypto.rsaDecrypt(hexToPrivateKey(testData.privateKey), encryptedResult.wrap()).data
			assertEquals(testData.input, bytesToHex(plainText))
			val plainTextFromTestData =
				crypto.rsaDecrypt(hexToPrivateKey(testData.privateKey), hexToBytes(testData.result).wrap()).data
			assertEquals(testData.input, bytesToHex(plainTextFromTestData))
		}
	}

	@Test
	@Throws(CryptoError::class)
	fun kyber() = runBlocking {
		for (td in testData.kyberEncryptionTests) {
			// we need to use the same seed so that we always obtain the same encapsulation
			val privateKey: KyberPrivateKey = hexToKyberPrivateKey(td.privateKey)
			val publicKey: KyberPublicKey = hexToKyberPublicKey(td.publicKey)
			val encapsulation = crypto.kyberEncapsulate(publicKey, hexToBytes(td.seed).wrap())
			assertEquals(td.cipherText, bytesToHex(encapsulation.ciphertext.data))
			assertEquals(td.sharedSecret, bytesToHex(encapsulation.sharedSecret.data))
			val sharedSecret = crypto.kyberDecapsulate(privateKey, hexToBytes(td.cipherText).wrap())
			assertEquals(td.sharedSecret, bytesToHex(sharedSecret.data))
		}
	}

	private fun hexToKyberPrivateKey(privateKey: String): KyberPrivateKey {
		val keyComponents = bytesToByteArrays(hexToBytes(privateKey), 5)
		return KyberPrivateKey(DataWrapper(keyComponents[0] + keyComponents[3] + keyComponents[4] + keyComponents[1] + keyComponents[2]))
	}

	private fun hexToKyberPublicKey(publicKey: String): KyberPublicKey {
		val keyComponents = bytesToByteArrays(hexToBytes(publicKey), 2)
		return KyberPublicKey(DataWrapper(keyComponents[0] + keyComponents[1]))
	}

	companion object {
		private const val TEST_DATA = "CompatibilityTestData.json"
		private val om = ObjectMapper()
		private lateinit var testData: TestData

		@BeforeClass
		@Throws(IOException::class)
		@JvmStatic
		fun readTestData() {
			val instrumentation = InstrumentationRegistry.getInstrumentation()
			val pm = instrumentation.context.packageManager
			val resources = pm.getResourcesForApplication(instrumentation.context.applicationInfo)
			val inputStream = resources.assets.open(TEST_DATA)
			testData = om.readValue(inputStream, TestData::class.java)
		}

		private fun hexToPrivateKey(hex: String): RsaPrivateKey {
			return arrayToRsaPrivateKey(hexToKeyArray(hex))
		}

		private fun hexToPublicKey(hex: String): RsaPublicKey {
			return arrayToRsaPublicKey(hexToKeyArray(hex))
		}

		private fun hexToKeyArray(hex: String): Array<BigInteger> {
			val key = ArrayList<BigInteger>()
			var pos = 0
			while (pos < hex.length) {
				val nextParamLen = hex.substring(pos, pos + 4).toInt(16)
				pos += 4
				key.add(BigInteger(hex.substring(pos, pos + nextParamLen), 16))
				pos += nextParamLen
			}
			return key.toArray(arrayOf())
		}

		private fun arrayToRsaPrivateKey(keyArray: Array<BigInteger>): RsaPrivateKey {
			val keyParts = keyArray.map { it.toByteArray().toBase64() }
			return RsaPrivateKey(
				version = 0,
				modulus = keyParts[0],
				privateExponent = keyParts[1],
				primeP = keyParts[2],
				primeQ = keyParts[3],
				primeExponentP = keyParts[4],
				primeExponentQ = keyParts[5],
				crtCoefficient = keyParts[6],
				keyLength = AndroidNativeCryptoFacade.RSA_KEY_LENGTH_IN_BITS,
			)
		}

		private fun arrayToRsaPublicKey(keyArray: Array<BigInteger>): RsaPublicKey {
			return RsaPublicKey(
				version = 0,
				modulus = keyArray[0].toByteArray().toBase64(),
				keyLength = AndroidNativeCryptoFacade.RSA_KEY_LENGTH_IN_BITS,
				publicExponent = AndroidNativeCryptoFacade.RSA_PUBLIC_EXPONENT,
			)
		}

		private fun hexToBytes(s: String): ByteArray {
			val len = s.length
			val data = ByteArray(len / 2)
			for (i in 0 until len step 2)
				data[i / 2] = ((s[i].digitToInt(16) shl 4) + (s[i + 1].digitToInt(16))).toByte()
			return data
		}

		private val hexArray =
			charArrayOf('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f')

		private fun bytesToHex(bytes: ByteArray): String {
			val hexChars = CharArray(bytes.size * 2)
			var v: Int
			for (j in bytes.indices) {
				v = bytes[j].toInt() and 0xFF
				hexChars[j * 2] = hexArray[v ushr 4]
				hexChars[j * 2 + 1] = hexArray[v and 0x0F]
			}
			return String(hexChars)
		}

		/**
		 * Decodes a byte array encoded by #byteArraysToBytes.
		 *
		 * @return list of byte arrays
		 */
		private fun bytesToByteArrays(encodedByteArrays: ByteArray, expectedByteArrays: Int): ArrayList<ByteArray> {
			val `in` = DataInputStream(ByteArrayInputStream(encodedByteArrays))
			return try {
				val byteArrays = ArrayList<ByteArray>()
				var pos = 0
				while (pos < encodedByteArrays.size) {
					val byteArrayLength: Int = `in`.readUnsignedShort()
					pos += 2
					val byteArray = ByteArray(byteArrayLength)
					val readBytes = `in`.read(byteArray)
					if (readBytes != byteArrayLength) {
						throw RuntimeException(
							"cannot read encoded byte array at pos:" + pos + " expected bytes:" + byteArrayLength + " read bytes:" + readBytes + " read byte arrays:" + byteArrays.size
						)
					}
					byteArrays.add(byteArray.copyOf(byteArrayLength))
					pos += byteArrayLength
				}
				if (byteArrays.size != expectedByteArrays) {
					throw RuntimeException("invalid amount of key parameters. Expected: " + expectedByteArrays + " actual:" + byteArrays.size)
				}
				byteArrays
			} catch (e: IOException) {
				throw RuntimeException(e)
			}
		}

		private fun stubRandom(seed: String): SecureRandom {
			return object : SecureRandom() {
				@Synchronized
				override fun nextBytes(bytes: ByteArray) {
					if (bytes.size != 32) {
						throw RuntimeException(bytes.size.toString() + "!")
					} else {
						val random = hexToBytes(seed)
						System.arraycopy(random, 0, bytes, 0, bytes.size)
					}
				}
			}
		}

		init {
			System.loadLibrary("tutanota")
		}
	}
}