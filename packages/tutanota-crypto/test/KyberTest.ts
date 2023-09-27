import o from "@tutao/otest"
import { loadWasmModuleFromFile } from "./WebAssemblyTestUtils.js"
import { decapsulate, encapsulate, generateKeyPair } from "../lib/encryption/Liboqs/Kyber.js"
import { random } from "../lib/index.js"

const liboqs = await loadWasmModuleFromFile("../lib/encryption/Liboqs/liboqs.wasm")

o.spec("Kyber", async function () {
	o("encryption roundtrip", async function () {
		const keyPair = generateKeyPair(liboqs, random)
		o(keyPair.privateKey.raw.length).equals(3168)
		o(keyPair.publicKey.raw.length).equals(1568)

		const encapsulation = encapsulate(liboqs, keyPair.publicKey, random)
		o(encapsulation.sharedSecret.length).equals(32)
		o(encapsulation.ciphertext.length).equals(1568)

		const decapsulatedSecret = decapsulate(liboqs, keyPair.privateKey, encapsulation.ciphertext)

		o(encapsulation.sharedSecret).deepEquals(decapsulatedSecret)
	})
})
