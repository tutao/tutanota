import o from "@tutao/otest"
import { loadWasmModuleFallback, loadWasmModuleFromFile } from "./WebAssemblyTestUtils.js"
import { decapsulate, encapsulate, generateKeyPair, LibOQSExports } from "../lib/encryption/Liboqs/Kyber.js"
import { random } from "../lib/index.js"

o.spec("Kyber", function () {
	o("encryption roundtrip", async function () {
		const liboqs = (await loadWasmModuleFromFile("../lib/encryption/Liboqs/liboqs.wasm")) as LibOQSExports

		const keyPair = generateKeyPair(liboqs, random)
		o(keyPair.privateKey.raw.length).equals(3168)
		o(keyPair.publicKey.raw.length).equals(1568)

		const encapsulation = encapsulate(liboqs, keyPair.publicKey, random)
		o(encapsulation.sharedSecret.length).equals(32)
		o(encapsulation.ciphertext.length).equals(1568)

		const decapsulatedSecret = decapsulate(liboqs, keyPair.privateKey, encapsulation.ciphertext)

		o(encapsulation.sharedSecret).deepEquals(decapsulatedSecret)
	})

	o("encryption roundtrip - fallback", async function () {
		const liboqsFallback = (await loadWasmModuleFallback("../lib/encryption/Liboqs/liboqs.js")) as LibOQSExports

		const keyPair = generateKeyPair(liboqsFallback, random)
		o(keyPair.privateKey.raw.length).equals(3168)
		o(keyPair.publicKey.raw.length).equals(1568)

		const encapsulation = encapsulate(liboqsFallback, keyPair.publicKey, random)
		o(encapsulation.sharedSecret.length).equals(32)
		o(encapsulation.ciphertext.length).equals(1568)

		const decapsulatedSecret = decapsulate(liboqsFallback, keyPair.privateKey, encapsulation.ciphertext)

		o(encapsulation.sharedSecret).deepEquals(decapsulatedSecret)
	})
})
