import o from "@tutao/otest"
import {
	aes256RandomKey,
	AesKeyLength,
	base64ToKey,
	bitArrayToUint8Array,
	getAndVerifyAesKeyLength,
	keyToBase64,
	keyToUint8Array,
	uint8ArrayToBitArray,
	uint8ArrayToKey,
} from "../lib/index.js"

o.spec("SymmetricCipherUtilsTest", function () {
	o.spec("Key conversion", function () {
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
	})
	o.spec("key generation", function () {
		o("check key", function () {
			const expectedKeyLength = AesKeyLength.Aes256
			const key = aes256RandomKey()
			const actualKeyLength = getAndVerifyAesKeyLength(key)
			o(actualKeyLength).equals(expectedKeyLength)
			const key2 = aes256RandomKey()
			o(key2).notDeepEquals(key)
			o(getAndVerifyAesKeyLength(key2)).equals(expectedKeyLength)
		})
	})
})
