import o from "@tutao/otest"
import { Argon2IDExports, bitArrayToUint8Array, generateRandomSalt } from "../lib/index.js"
import { generateKeyFromPassphrase } from "../lib/hashes/Argon2id/Argon2id.js"
import { loadWasmModuleFallback, loadWasmModuleFromFile } from "./WebAssemblyTestUtils.js"
import { $ } from "zx"
import * as fs from "node:fs"

o.spec("Argon2id", function () {
	o.before(async () => {
		const currentPath = process.cwd()

		const make = $
		make.verbose = true
		make.cwd = "../../../libs/webassembly/"
		make.env = {
			...process.env,
			WASM: `${currentPath}/argon2.wasm`,
			WASM_FALLBACK: `${currentPath}/argon2.js`,
		}

		await make`make -f Makefile_argon2 build fallback`

		make.cwd = currentPath
	})

	// We remove them after the tests since we don't need them anymore
	o.after(() => {
		fs.rmSync("./argon2.wasm")
		fs.rmSync("./argon2.js")
	})

	o("GenerateKeyFromPassphrase", async function () {
		const argon2 = (await loadWasmModuleFromFile("./argon2.wasm")) as Argon2IDExports

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

	o("GenerateKeyFromPassphrase - fallback", async function () {
		const argon2Fallback = (await loadWasmModuleFallback("../argon2.js")) as Argon2IDExports
		let salt1 = generateRandomSalt()
		let salt2 = generateRandomSalt()
		let key0 = await generateKeyFromPassphrase(argon2Fallback, "hello", salt1)
		let key1 = await generateKeyFromPassphrase(argon2Fallback, "hello", salt1)
		let key2 = await generateKeyFromPassphrase(argon2Fallback, "hello", salt2)
		let key3 = await generateKeyFromPassphrase(argon2Fallback, "hellohello", salt1)
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
