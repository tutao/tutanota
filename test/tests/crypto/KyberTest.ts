import o, { assertThrows } from "@tutao/otest"
import { decapsulateKyber, encapsulateKyber, extractKyberPublicKeyFromKyberPrivateKey, generateKeyPairKyber, LibOQSExports, random } from "@tutao/crypto"
import { loadWasmExports, loadWasmModuleFallback } from "./WebAssemblyTestUtils.js"

o.spec("Kyber", function () {
	o("encryption roundtrip", async function () {
		const liboqs = (await loadWasmExports("liboqs.wasm")) as LibOQSExports

		const keyPair = generateKeyPairKyber(liboqs, random)
		o(keyPair.privateKey.raw.length).equals(3168)
		o(keyPair.publicKey.raw.length).equals(1568)

		const encapsulation = encapsulateKyber(liboqs, keyPair.publicKey, random)
		o(encapsulation.sharedSecret.length).equals(32)
		o(encapsulation.ciphertext.length).equals(1568)

		const decapsulatedSecret = decapsulateKyber(liboqs, keyPair.privateKey, encapsulation.ciphertext)

		o(encapsulation.sharedSecret).deepEquals(decapsulatedSecret)
	})

	o("liboqs fallback unavailable", async function () {
		await assertThrows(Error, async () => await loadWasmModuleFallback("../liboqs.js"))
	})

	o("extract public key", async function () {
		const liboqs = (await loadWasmExports("liboqs.wasm")) as LibOQSExports
		const keyPair = generateKeyPairKyber(liboqs, random)
		const extractedPublicKey = extractKyberPublicKeyFromKyberPrivateKey(keyPair.privateKey)

		o(extractedPublicKey).deepEquals(keyPair.publicKey)
	})
})
