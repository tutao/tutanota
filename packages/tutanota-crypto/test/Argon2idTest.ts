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

	o("Generate KAT", async function () {
		const passwords: Array<string> = [
			"password",
			"password1",
			"letmein",
			"?",
			"%",
			"€uropa",
			"?uropa",
			"This passphrase is relatively long, I hope I won't forget it",
			"This passphrase is relatively long, I hope I won't forget it!",
			"",
			"Vitor jagt zwölf Boxkämpfer quer über den großen Sylter Deich.",
			"Só juíza chata não vê câmera frágil e dá kiwi à ré sexy que pôs ações em baú.",
		]

		const salts = [
			"4ac9796036cd28377d57220e8d64acb8",
			"b8b2540a203e37bbc03bf2c2a14372e2",
			"829080f1b6323c57ab107c5eabc1507f",
			"491ae1add690a04c7dfab4fe821b122c",
			"2557ee3798f9cfdc04a11179287fbe8b",
			"5c51874d5536a76e3215007ac26678b7",
			"907d7d60e7256ea369d3ad8907c964db",
			"0ed92ca8ecf1e30bc01ff5939d432a46",
			"ad1922881222af4bc770793f76c7eb4a",
			"bd9abf81a251a53fbf6d005476e860b9",
			"8612243591d58a0d36a138cf265ed352",
			"d258d86af2f539cc59ddf763ebf53307",
		]

		const outputs: Array<{ password: string; keyHex: string; saltHex: string }> = []
		for (let i = 0; i < passwords.length; i++) {
			const salt = hexToUint8Array(salts[i])
			const key = await generateKeyFromPassphrase(argon2, passwords[i], salt)
			const keyHex = _keyToHex(key)
			outputs.push({
				password: passwords[i],
				keyHex: keyHex,
				saltHex: salts[i],
			})
		}

		// uncomment to regenerate test vectors:
		// console.log("argon2idTests: ", JSON.stringify(outputs, null, 2))
	})
})
