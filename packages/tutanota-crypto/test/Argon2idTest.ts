import o from "@tutao/otest"
import { bitArrayToUint8Array, generateRandomSalt, uint8ArrayToBitArray } from "../lib/index.js"
import { generateKeyFromPassphrase } from "../lib/hashes/Argon2id/Argon2id.js"
import { Hex, hexToUint8Array, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { Aes256Key } from "../lib/encryption/Aes.js"

async function loadArgon2ModuleFromFile(path: string): Promise<WebAssembly.Exports> {
	if (typeof process !== "undefined") {
		try {
			const { readFile } = await import("node:fs/promises")
			const wasmBuffer = await readFile(path)
			return (await WebAssembly.instantiate(wasmBuffer)).instance.exports
		} catch (e) {
			throw new Error(`Can't load argon2 module: ${e}`)
		}
	} else {
		return (await WebAssembly.instantiateStreaming(await fetch(path))).instance.exports
	}
}

const argon2 = await loadArgon2ModuleFromFile("../lib/hashes/Argon2id/argon2.wasm")

function _hexToKey(hex: Hex): Aes256Key {
	return uint8ArrayToBitArray(hexToUint8Array(hex))
}

function _keyToHex(key: Aes256Key): Hex {
	return uint8ArrayToHex(bitArrayToUint8Array(key))
}

o.spec("Argon2id", async function () {
	o("GenerateKeyFromPassphrase", async function () {
		let salt1 = generateRandomSalt()
		let salt2 = generateRandomSalt()
		let key0 = await generateKeyFromPassphrase(argon2, "hello", salt1)
		let key1 = await generateKeyFromPassphrase(argon2, "hello", salt1)
		let key2 = await generateKeyFromPassphrase(argon2, "hello", salt2)
		let key3 = await generateKeyFromPassphrase(argon2, "hellohello", salt1)
		o(key1).deepEquals(key0)
		// make sure a different password or different key result in different keys
		o(key2).notDeepEquals(key0)
		o(key3).notDeepEquals(key0)
		// test the key length to be 256 bit
		o(Array.from(bitArrayToUint8Array(key0)).length).equals(32)
		o(Array.from(bitArrayToUint8Array(key2)).length).equals(32)
		o(Array.from(bitArrayToUint8Array(key3)).length).equals(32)
	})
})
