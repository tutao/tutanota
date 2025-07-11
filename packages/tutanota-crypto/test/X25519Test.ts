import o from "@tutao/otest"
import { deriveX25519PublicKey, generateX25519KeyPair, hexToRsaPublicKey, random, x25519Decapsulate, x25519Encapsulate, X25519KeyPair } from "../lib/index.js"
import { CryptoError } from "../lib/error.js"

const originalRandom = random.generateRandomData
o.spec("X25519Test", function () {
	o.afterEach(function () {
		random.generateRandomData = originalRandom
	})

	/**
	 * Reuse the key pairs to save time
	 */
	let _keyPairAlice: X25519KeyPair
	let _keyPairBob: X25519KeyPair
	let _keyPairEphemeral: X25519KeyPair

	function _getKeyPair(who: string): X25519KeyPair {
		switch (who) {
			case "Alice":
				return _keyPairAlice ? _keyPairAlice : (_keyPairAlice = generateX25519KeyPair())
			case "Bob":
				return _keyPairBob ? _keyPairBob : (_keyPairBob = generateX25519KeyPair())
			case "Ephemeral":
				return _keyPairEphemeral ? _keyPairEphemeral : (_keyPairEphemeral = generateX25519KeyPair())
			default:
				throw new Error(`I don't know who ${who} is`)
		}
	}

	o("invalid hex key conversion", function () {
		const hexPublicKey = "hello"

		o(() => hexToRsaPublicKey(hexPublicKey)).throws(CryptoError)
	})
	o("ECDH secret exchange", function () {
		let keyPairAlice = _getKeyPair("Alice")
		let keyPairEphemeral = _getKeyPair("Ephemeral")
		let keyPairBob = _getKeyPair("Bob")

		const aliceEncapsulate = x25519Encapsulate(keyPairAlice.privateKey, keyPairEphemeral.privateKey, keyPairBob.publicKey)
		const bobDecapsulate = x25519Decapsulate(keyPairAlice.publicKey, keyPairEphemeral.publicKey, keyPairBob.privateKey)
		o(aliceEncapsulate).deepEquals(bobDecapsulate)
	})
	o("key is clamped", function () {
		// we can't inject any randomness since noble-curves gives a method, so there is a small chance this test may pass when it shouldn't; in this case, it's
		// a 1 in 32 chance for a 256-bit key to happen to be already clamped, assuming the RNG is uniform
		for (let i = 0; i < 10; i++) {
			let key = generateX25519KeyPair()
			o(key.privateKey[0] & 0b00000111).equals(0b00000000)("lowest 3 bits needs to be cleared (to be divisible by the cofactor)")
			o(key.privateKey[key.privateKey.length - 1] & 0b10000000).equals(0b00000000)("the highest bit needs to be cleared")
			o(key.privateKey[key.privateKey.length - 1] & 0b01000000).equals(0b01000000)("the second-highest bit needs to be set")
		}
	})

	o("extract public key", function () {
		const keyPair = generateX25519KeyPair()
		const extractedPublicKey = deriveX25519PublicKey(keyPair.privateKey)
		o(extractedPublicKey).deepEquals(keyPair.publicKey)
	})
})
