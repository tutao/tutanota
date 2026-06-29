import o, { assertThrows } from "@tutao/otest"
import {
	aes256RandomKey,
	AesKeyLength,
	base64ToKey,
	bitArrayToUint8Array,
	keyToBase64,
	keyToUint8Array,
	uint8ArrayToBitArray,
	uint8ArrayToKey,
} from "../../../src/platform-kit/crypto"
import { CryptoError } from "../../../src/platform-kit/crypto/error"

o.spec("SymmetricCipherUtilsTest", function () {
	o.spec("Key conversion", function () {
		o("bitArrayToUint8Array", function () {
			let bitArray = [8794650181632]
			o(Array.from(bitArrayToUint8Array(bitArray))).deepEquals([170])("no padding should be added during the conversion from bitarray to Uint8Array")
			o(Array.from(bitArrayToUint8Array(uint8ArrayToBitArray(new Uint8Array([170]))))).deepEquals([170])
		})
		o("keyToBase64 round trip", function () {
			const key = aes256RandomKey()
			o(Array.from(base64ToKey(keyToBase64(key)).bits)).deepEquals(key.bits)
		})
		o("keyToUint8Array round trip", function () {
			const key = aes256RandomKey()
			o(Array.from(uint8ArrayToKey(keyToUint8Array(key)).bits)).deepEquals(key.bits)
		})

		o.spec("uint8ArrayToKey", function () {
			o.test("accept only 256", async function () {
				const bits = new Uint8Array(16).fill(0)
				await assertThrows(CryptoError, async () => {
					return uint8ArrayToKey(bits, AesKeyLength.Aes256)
				})
			})
			o.test("accept only 128", async function () {
				const bits = new Uint8Array(32).fill(0)
				await assertThrows(CryptoError, async () => {
					return uint8ArrayToKey(bits, AesKeyLength.Aes128)
				})
			})
			o.test("accept 256", function () {
				const bits = new Uint8Array(32).fill(0)
				uint8ArrayToKey(bits, AesKeyLength.Aes256)
			})
			o.test("accept 128", function () {
				const bits = new Uint8Array(16).fill(0)
				uint8ArrayToKey(bits, AesKeyLength.Aes128)
			})
			o.test("invalid key length", async function () {
				const bits = new Uint8Array(24).fill(0)
				await assertThrows(CryptoError, async () => {
					return uint8ArrayToKey(bits)
				})
			})
		})
	})
	o.spec("bitArrayToUint8Array", function () {
		o("length is multiple of 4", function () {
			o(4).equals(bitArrayToUint8Array([125]).length)
		})
	})
	o.spec("key generation", function () {
		o("check key", function () {
			const expectedKeyLength = AesKeyLength.Aes256
			const key = aes256RandomKey()
			const actualKeyLength = key.keyLength
			o(actualKeyLength).equals(expectedKeyLength)
			const key2 = aes256RandomKey()
			o(key2).notDeepEquals(key)
			o(key2.keyLength).equals(expectedKeyLength)
		})
	})
})
