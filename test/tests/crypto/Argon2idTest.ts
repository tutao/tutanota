import o, { assertThrows } from "@tutao/otest"
import { Argon2IDExports, generateKeyFromPassphraseArgon2id, generateRandomSalt, keyToUint8Array } from "@tutao/crypto"
import { loadWasmExports, loadWasmModuleFallback } from "./WebAssemblyTestUtils.js"

o.spec("Argon2id", function () {
	o("GenerateKeyFromPassphrase", async function () {
		const argon2 = (await loadWasmExports("argon2.wasm")) as Argon2IDExports

		let salt1 = generateRandomSalt()
		let salt2 = generateRandomSalt()
		let key0 = await generateKeyFromPassphraseArgon2id(argon2, "hello", salt1)
		let key1 = await generateKeyFromPassphraseArgon2id(argon2, "hello", salt1)
		let key2 = await generateKeyFromPassphraseArgon2id(argon2, "hello", salt2)
		let key3 = await generateKeyFromPassphraseArgon2id(argon2, "hellohello", salt1)
		o(key1).deepEquals(key0)
		// make sure a different password or different key result in different keys
		o(key2).notDeepEquals(key0)
		o(key3).notDeepEquals(key0)
		// test the key length to be 256 bit
		o(Array.from(keyToUint8Array(key0)).length).equals(32)
		o(Array.from(keyToUint8Array(key2)).length).equals(32)
		o(Array.from(keyToUint8Array(key3)).length).equals(32)
	})

	o("argon2 fallback unavailable", async function () {
		await assertThrows(Error, async () => await loadWasmModuleFallback("../argon2.js"))
	})
})
