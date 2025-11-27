import o from "@tutao/otest"
import {
	aes256RandomKey,
	base64ToKey,
	bitArrayToUint8Array,
	extractIvFromCipherText,
	keyToBase64,
	keyToUint8Array,
	uint8ArrayToBitArray,
	uint8ArrayToKey,
} from "../lib/index.js"
import { stringToBase64 } from "@tutao/tutanota-utils"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoError } from "../lib/misc/CryptoError.js"

o.spec("SymmetricCipherUtilsTest", function () {
	o("bitArrayToUint8Array", function () {
		let bitArray = [8794650181632]
		o(Array.from(bitArrayToUint8Array(bitArray))).deepEquals([170])("no padding should be added during the conversion from bitarray to Uint8Array")
		o(Array.from(bitArrayToUint8Array(uint8ArrayToBitArray(new Uint8Array([170]))))).deepEquals([170])
	})
	o("keyToBase64 round trip", function () {
		const key = aes256RandomKey()
		o(Array.from(base64ToKey(keyToBase64(key)))).deepEquals(key)
	})
	o("keyToUint8Array round trip", function () {
		const key = aes256RandomKey()
		o(Array.from(uint8ArrayToKey(keyToUint8Array(key)))).deepEquals(key)
	})
	o.spec("extract ivs", function () {
		o("can extract IV from cipher text", function () {
			const sk = [4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205]
			const cipherText = "AV1kmZZfCms1pNvUtGrdhOlnDAr3zb2JWpmlpWEhgG5zqYK3g7PfRsi0vQAKLxXmrNRGp16SBKBa0gqXeFw9F6l7nbGs3U8uNLvs6Fi+9IWj"
			const expectedIv = new Uint8Array([93, 100, 153, 150, 95, 10, 107, 53, 164, 219, 212, 180, 106, 221, 132, 233])
			const extractedIv = extractIvFromCipherText(cipherText)
			o(Array.from(extractedIv)).deepEquals(Array.from(expectedIv))
		})

		o("checks that enough bytes are present", async function () {
			await assertThrows(CryptoError, async () => extractIvFromCipherText(""))
			await assertThrows(CryptoError, async () => extractIvFromCipherText(stringToBase64("012345678901234")))
		})
	})
})
