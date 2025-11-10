import o from "@tutao/otest"
import { hkdf } from "../lib/hashes/HKDF.js"
import { SHA256_HASH_LENGTH_BYTES } from "../lib/hashes/Sha256.js"

o.spec("HKDF", function () {
	o("hkdf salt is null", function () {
		const key = new Uint8Array([
			113, 145, 58, 2, 163, 254, 231, 34, 7, 204, 72, 184, 219, 131, 21, 128, 76, 100, 162, 111, 178, 210, 208, 109, 255, 142, 174, 128, 56, 15, 55, 96,
		])
		const expectedBytes = new Uint8Array([
			127, 174, 172, 214, 164, 208, 17, 37, 211, 49, 49, 98, 106, 243, 235, 151, 69, 161, 122, 238, 54, 95, 117, 107, 218, 103, 253, 162, 243, 128, 44,
			136,
		])
		const info = Uint8Array.from("just a test case without salt")
		const outputLength = 32
		const derivedBytes = hkdf(null, key, info, outputLength)
		o(derivedBytes).deepEquals(expectedBytes)

		const fallBackSalt = new Uint8Array(SHA256_HASH_LENGTH_BYTES).fill(0)
		const fallbackDerivedBytes = hkdf(fallBackSalt, key, info, outputLength)
		o(fallbackDerivedBytes).deepEquals(derivedBytes)
	})
})
