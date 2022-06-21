package de.tutao.tutanota

import android.content.Context
import android.support.test.InstrumentationRegistry
import android.support.test.runner.AndroidJUnit4
import de.tutao.tutanota.AndroidNativeCryptoFacade.Companion.bytesToKey
import de.tutao.tutanota.ipc.RsaPrivateKey
import de.tutao.tutanota.ipc.RsaPublicKey
import de.tutao.tutanota.ipc.wrap
import kotlinx.coroutines.runBlocking
import org.apache.commons.io.output.ByteArrayOutputStream
import org.codehaus.jackson.map.ObjectMapper
import org.junit.Assert.assertEquals
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito
import java.io.ByteArrayInputStream
import java.io.IOException
import java.math.BigInteger
import java.security.SecureRandom


@RunWith(AndroidJUnit4::class)
class CompatibilityTest {
	@Test
	@Throws(CryptoError::class, IOException::class)
	fun aes128() {
		val crypto = AndroidNativeCryptoFacade(Mockito.mock(Context::class.java))
		for (td in testData.aes128Tests) {
			val key = hexToBytes(td.hexKey)
			val encryptedBytes = ByteArrayOutputStream()
			crypto.aesEncrypt(key, ByteArrayInputStream(td.plainTextBase64.base64ToBytes()), encryptedBytes, td.ivBase64.base64ToBytes(), false)
			assertEquals(td.cipherTextBase64, encryptedBytes.toByteArray().toBase64())
			val decryptedBytes = ByteArrayOutputStream()
			crypto.aesDecrypt(key, ByteArrayInputStream(encryptedBytes.toByteArray()), decryptedBytes, encryptedBytes.size().toLong())
			assertEquals(td.plainTextBase64, decryptedBytes.toByteArray().toBase64())
		}
	}

	@Test
	@Throws(CryptoError::class, IOException::class)
	fun aes128Key128Encryption() {
		val crypto = AndroidNativeCryptoFacade(Mockito.mock(Context::class.java))
		for (td in testData.aes128Tests) {
			val key = bytesToKey(hexToBytes(td.hexKey))
			val keyToEncrypt128 = hexToBytes(td.keyToEncrypt128)
			val encryptedKey = crypto.encryptKey(key, keyToEncrypt128)
			assertEquals(td.encryptedKey128, encryptedKey.toBase64())
		}
	}

	@Test
	@Throws(CryptoError::class, IOException::class)
	fun aes128Key256Encryption() {
		val crypto = AndroidNativeCryptoFacade(Mockito.mock(Context::class.java))
		for (td in testData.aes128Tests) {
			val key = bytesToKey(hexToBytes(td.hexKey))
			val keyToEncrypt256 = hexToBytes(td.keyToEncrypt256)
			val encryptedKey = crypto.encryptKey(key, keyToEncrypt256)
			assertEquals(td.encryptedKey256, encryptedKey.toBase64())
		}
	}

	@Test
	@Throws(CryptoError::class, IOException::class)
	fun aes128Mac() {
		val crypto = AndroidNativeCryptoFacade(Mockito.mock(Context::class.java))
		for (td in testData.aes128MacTests) {
			val key = hexToBytes(td.hexKey)
			val encryptedBytes = ByteArrayOutputStream()
			crypto.aesEncrypt(key, ByteArrayInputStream(td.plainTextBase64.base64ToBytes()), encryptedBytes, td.ivBase64.base64ToBytes(), true)
			assertEquals(td.cipherTextBase64, encryptedBytes.toByteArray().toBase64())
			val decryptedBytes = ByteArrayOutputStream()
			crypto.aesDecrypt(key, ByteArrayInputStream(encryptedBytes.toByteArray()), decryptedBytes, encryptedBytes.size().toLong())
			assertEquals(td.plainTextBase64, decryptedBytes.toByteArray().toBase64())
		}
	}

	@Test
	@Throws(CryptoError::class)
	fun rsa() = runBlocking {
		for (testData in testData.rsaEncryptionTests) {
			val crypto = AndroidNativeCryptoFacade(Mockito.mock(Context::class.java), stubRandom(testData.seed))
			val publicKeyJSON = hexToPublicKey(testData.publicKey)
			val encryptedResult: ByteArray = crypto.rsaEncrypt(publicKeyJSON, hexToBytes(testData.input).wrap(), hexToBytes(testData.seed).wrap()).data
			//String hexResult = bytesToHex(encryptedResultBytes);
			//assertEquals(testData.getResult(), hexResult);
			//cannot compare encrypted test data because default android implementation ignores randomizer
			val plainText = crypto.rsaDecrypt(hexToPrivateKey(testData.privateKey), encryptedResult.wrap()).data
			assertEquals(testData.input, bytesToHex(plainText))
			val plainTextFromTestData = crypto.rsaDecrypt(hexToPrivateKey(testData.privateKey), hexToBytes(testData.result).wrap()).data
			assertEquals(testData.input, bytesToHex(plainTextFromTestData))
		}
	}

	companion object {
		private const val TEST_DATA = "CompatibilityTestData.json"
		private val om = ObjectMapper()
		private lateinit var testData: TestData

		@BeforeClass
		@Throws(IOException::class)
		@JvmStatic
		fun readTestData() {
			val inputStream = InstrumentationRegistry.getContext().assets.open(TEST_DATA)
			testData = om.readValue(inputStream, TestData::class.java)
		}

		private fun hexToPrivateKey(hex: String): RsaPrivateKey {
			return arrayToPrivateKey(hexToKeyArray(hex))
		}

		private fun hexToPublicKey(hex: String): RsaPublicKey {
			return arrayToPublicKey(hexToKeyArray(hex))
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

		private fun arrayToPrivateKey(keyArray: Array<BigInteger>): RsaPrivateKey {
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

		private fun arrayToPublicKey(keyArray: Array<BigInteger>): RsaPublicKey {
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

		private val hexArray = charArrayOf('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f')
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
	}
}