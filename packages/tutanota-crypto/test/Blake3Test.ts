import o from "@tutao/otest"
import { aes256RandomKey, blake3Hash, blake3Kdf, blake3Mac, blake3MacVerify } from "../lib/index.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoError } from "../lib/misc/CryptoError.js"

o.spec("blake3", function () {
	o.spec("hash", function () {
		o("is reproducible", function () {
			const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
			const digest1 = blake3Hash(data)
			const digest2 = blake3Hash(data)
			o(digest1).deepEquals(digest2)
		})
		o("depends on input", function () {
			const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
			const differentData = new Uint8Array([6, 5, 4, 3, 2, 1, 0])
			const digest1 = blake3Hash(data)
			const digest2 = blake3Hash(differentData)
			o(digest1).notDeepEquals(digest2)
		})
	})
	o.spec("mac", function () {
		o("round trip", function () {
			const key = aes256RandomKey()
			const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
			const tag = blake3Mac(key, data)
			blake3MacVerify(key, data, tag)
		})
		o("throws if data is not the same", async function () {
			const key = aes256RandomKey()
			const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
			const badData = new Uint8Array([6, 5, 4, 3, 2, 1, 0])
			const tag = blake3Mac(key, data)
			await assertThrows(CryptoError, async () => blake3MacVerify(key, badData, tag))
		})
		o("throws if key is not the same", async function () {
			const key = aes256RandomKey()
			const badKey = aes256RandomKey()
			const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
			const tag = blake3Mac(key, data)
			await assertThrows(CryptoError, async () => blake3MacVerify(badKey, data, tag))
		})
	})
	o.spec("kdf", function () {
		o("is reproducible", function () {
			const inputKey = aes256RandomKey()
			const context = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
			const key1 = blake3Kdf(inputKey, context)
			const key2 = blake3Kdf(inputKey, context)
			o(key1).deepEquals(key2)
		})

		o("output depends on context", function () {
			const inputKey = aes256RandomKey()
			const context1 = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
			const context2 = new Uint8Array([6, 5, 4, 3, 2, 1, 0])
			const key1 = blake3Kdf(inputKey, context1)
			const key2 = blake3Kdf(inputKey, context2)
			o(key1).notDeepEquals(key2)
		})

		o("output depends on input key material", function () {
			const inputKey1 = aes256RandomKey()
			const inputKey2 = aes256RandomKey()
			const context = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
			const key1 = blake3Kdf(inputKey1, context)
			const key2 = blake3Kdf(inputKey2, context)
			o(key1).notDeepEquals(key2)
		})
	})
})
