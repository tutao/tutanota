package de.tutao.tutanota

import androidx.test.ext.junit.runners.AndroidJUnit4
import de.tutao.tutashared.CryptoError
import de.tutao.tutashared.crypto.Crypto
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.security.SecureRandom

@RunWith(AndroidJUnit4::class)
class HmacTest {
	lateinit var randomizer: SecureRandom
	lateinit var key: ByteArray
	lateinit var data: ByteArray
	lateinit var macTag: ByteArray

	@Before
	fun setup() {
		randomizer = SecureRandom()
		key = ByteArray(32)
		data = ByteArray(256)

		randomizer.nextBytes(key)
		randomizer.nextBytes(data)

		macTag = Crypto.hmacSha256(key, data)
	}

	@Test
	fun roundTrip() {
		Crypto.verifyHmacSha256(key, data, macTag)
	}

	@Test
	fun badKey() {
		val badKey = ByteArray(32)
		randomizer.nextBytes(badKey)

		assertThrows(CryptoError::class.java) {
			Crypto.verifyHmacSha256(badKey, data, macTag)
		}
	}

	@Test
	fun badData() {
		val badData = ByteArray(256)
		randomizer.nextBytes(badData)

		assertThrows(CryptoError::class.java) {
			Crypto.verifyHmacSha256(key, badData, macTag)
		}
	}
}
