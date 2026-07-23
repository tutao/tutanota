import o, { assertThrows } from "@tutao/otest"
import { Aes128Key, Aes256Key, AesKey } from "../../../src/platform-kit/crypto"
import { CryptoError } from "../../../src/platform-kit/crypto/error"

o.spec("AesKey", function () {
	o.test("AesKey256 length is checked", async function () {
		const invalidKeyLength = new Array(7).fill(0)
		await assertThrows(CryptoError, async () => {
			return new Aes256Key(invalidKeyLength)
		})
	})

	o.test("AesKey256 - 128 bit key is rejected", async function () {
		const invalidKeyLength = new Array(4).fill(0)
		await assertThrows(CryptoError, async () => {
			return new Aes256Key(invalidKeyLength)
		})
	})

	o.test("AesKey128 length is checked", async function () {
		const invalidKeyLength = new Array(7).fill(0)
		await assertThrows(CryptoError, async () => {
			return new Aes128Key(invalidKeyLength)
		})
	})

	o.test("AesKey128 - 256 bit key is rejected", async function () {
		const invalidKeyLength = new Array(8).fill(0)
		await assertThrows(CryptoError, async () => {
			return new Aes128Key(invalidKeyLength)
		})
	})
})
