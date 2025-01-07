import o from "@tutao/otest"
import { aes256RandomKey, hmacSha256, verifyHmacSha256 } from "../lib/index.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoError } from "../lib/misc/CryptoError.js"

o.spec("hmac", function () {
	o("round trip", function () {
		const key = aes256RandomKey()
		const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
		const tag = hmacSha256(key, data)
		verifyHmacSha256(key, data, tag)
	})
	o("throws if data is not the same", async function () {
		const key = aes256RandomKey()
		const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
		const badData = new Uint8Array([6, 5, 4, 3, 2, 1, 0])
		const tag = hmacSha256(key, data)
		await assertThrows(CryptoError, async () => verifyHmacSha256(key, badData, tag))
	})
	o("throws if key is not the same", async function () {
		const key = aes256RandomKey()
		const badKey = aes256RandomKey()
		const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
		const tag = hmacSha256(key, data)
		await assertThrows(CryptoError, async () => verifyHmacSha256(badKey, data, tag))
	})
})
