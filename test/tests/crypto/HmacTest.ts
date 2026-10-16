import o, { assertThrows } from "@tutao/otest"
import { hmacSha256, random, SymmetricCipherUtils, verifyHmacSha256 } from "../../../src/platform-kit/crypto"
import { CryptoError } from "../../../src/platform-kit/crypto/error"

o.spec("hmac", function () {
	let symmetricCipherUtils: SymmetricCipherUtils

	o.beforeEach(function () {
		symmetricCipherUtils = new SymmetricCipherUtils(random)
	})

	o("round trip", function () {
		const key = symmetricCipherUtils.aes256RandomKey()
		const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
		const tag = hmacSha256(key, data)
		verifyHmacSha256(key, data, tag)
	})
	o("throws if data is not the same", async function () {
		const key = symmetricCipherUtils.aes256RandomKey()
		const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
		const badData = new Uint8Array([6, 5, 4, 3, 2, 1, 0])
		const tag = hmacSha256(key, data)
		await assertThrows(CryptoError, async () => verifyHmacSha256(key, badData, tag))
	})
	o("throws if key is not the same", async function () {
		const key = symmetricCipherUtils.aes256RandomKey()
		const badKey = symmetricCipherUtils.aes256RandomKey()
		const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
		const tag = hmacSha256(key, data)
		await assertThrows(CryptoError, async () => verifyHmacSha256(badKey, data, tag))
	})
})
