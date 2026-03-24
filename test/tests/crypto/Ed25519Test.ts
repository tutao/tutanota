import o from "@tutao/otest"
import { generateEd25519KeyPair, initEd25519, signWithEd25519, verifyEd25519Signature } from "@tutao/crypto"
import { matchers, object, verify } from "testdouble"
import { assertNotNull } from "@tutao/utils"

o.spec("Ed25519Test", function () {
	o.before(async function () {
		const loadWasmInNode: ArrayBuffer = await node(async () => {
			const { default: fs } = await import("node:fs")
			return fs.readFileSync("../src/crypto-primitives/crypto_primitives_bg.wasm")
		})()
		const loadWasmInBrowser: ArrayBuffer = await browser(async () => {
			const r = await fetch("/crypto_primitives_bg.wasm")
			return await r.arrayBuffer()
		})()

		let wasmBuffer = assertNotNull(loadWasmInNode ?? loadWasmInBrowser)
		await initEd25519(wasmBuffer)
	})

	o("valid Ed25519 round trip", function () {
		const ed25519keypair = generateEd25519KeyPair()
		o(ed25519keypair.private_key.length).equals(32)
		o(ed25519keypair.public_key.length).equals(32)
		const message = "my cute message <3"

		const encodedMessage = new TextEncoder().encode(message)
		const signature = signWithEd25519(ed25519keypair.private_key, encodedMessage)
		const verification = verifyEd25519Signature(ed25519keypair.public_key, encodedMessage, signature)
		o(verification)
	})

	o("report fake signatures", function () {
		const ed25519keypair = generateEd25519KeyPair()
		const message = "my cute message <3"
		const encodedMessage = new TextEncoder().encode(message)

		const fakeMessage = new TextEncoder().encode("I falsify message for a living")
		const fakeSignature = signWithEd25519(ed25519keypair.private_key, fakeMessage)

		const verified = verifyEd25519Signature(ed25519keypair.public_key, encodedMessage, fakeSignature)
		o(verified).equals(false)
	})

	o("report fake messages", function () {
		const ed25519keypair = generateEd25519KeyPair()
		const message = "my cute message <3"
		const encodedMessage = new TextEncoder().encode(message)
		const signature = signWithEd25519(ed25519keypair.private_key, encodedMessage)

		const fakeMessage = new TextEncoder().encode("I falsify message for a living")

		const verified = verifyEd25519Signature(ed25519keypair.public_key, fakeMessage, signature)
		o(verified).equals(false)
	})

	o("verify generateKeyPair invokes Crypto.getRandom", function () {
		const originalGetRandom = global.crypto.getRandomValues
		const cryptoSpy = object(global.crypto)
		try {
			global.crypto.getRandomValues = cryptoSpy.getRandomValues
			const ed25519keypair = generateEd25519KeyPair()
			verify(cryptoSpy.getRandomValues(matchers.anything()))
		} finally {
			global.crypto.getRandomValues = originalGetRandom
		}
	})
})
