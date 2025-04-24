import o from "@tutao/otest"
import { generateEd25519KeyPair, signWithEd25519, verifyEd25519Signature } from "../lib/index.js"
import { CryptoError } from "../lib/error.js"
import { initSync } from "../lib/encryption/ed25519wasm/crypto_primitives.js"
import fs from "node:fs"

o.spec("Ed25519Test", function () {
	o.before(async function () {
		// Use the readFileSync function to read the contents of the "add.wasm" file
		const wasmBuffer = fs.readFileSync("../lib/encryption/ed25519wasm/crypto_primitives_bg.wasm")
		initSync({ module: wasmBuffer })
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
})
