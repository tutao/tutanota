package de.tutao.tutashared.crypto

import de.tutao.tutashared.AndroidNativeCryptoFacade.Companion.HMAC_SHA_256
import de.tutao.tutashared.CryptoError
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

class Crypto {
	companion object {
		fun hmacSha256(key: ByteArray, data: ByteArray): ByteArray {
			val macKey = SecretKeySpec(key, HMAC_SHA_256)
			val hmac = Mac.getInstance(HMAC_SHA_256)
			hmac.init(macKey)
			return hmac.doFinal(data)
		}

		fun verifyHmacSha256(key: ByteArray, data: ByteArray, tag: ByteArray) {
			val computedTag = hmacSha256(key, data)
			if (!tag.contentEquals(computedTag)) {
				throw CryptoError("invalid mac")
			}
		}
	}
}