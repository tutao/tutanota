import o from "@tutao/otest"
import {
	CryptoError,
	hexToPublicKey,
	random,
	x25519decapsulate,
	x25519encapsulate,
	x25519generateKeyPair,
	x25519hexToPrivateKey,
	x25519hexToPublicKey,
	X25519KeyPair,
	x25519privateKeyToHex,
	x25519publicKeyToHex,
} from "../lib/index.js"

const originalRandom = random.generateRandomData
o.spec("x25519", function () {
	o.afterEach(function () {
		random.generateRandomData = originalRandom
	})

	/**
	 * Reuse the key pairs to save time
	 */
	let _keyPairAlice: X25519KeyPair
	let _keyPairBob: X25519KeyPair

	function _getKeyPair(who: string): X25519KeyPair {
		switch (who) {
			case "Alice":
				return _keyPairAlice ? _keyPairAlice : (_keyPairAlice = x25519generateKeyPair())
			case "Bob":
				return _keyPairBob ? _keyPairBob : (_keyPairBob = x25519generateKeyPair())
			default:
				throw new Error(`I don't know who ${who} is`)
		}
	}

	o("hex key conversion", function () {
		let keyPairAlice = _getKeyPair("Alice")

		let hexPrivateKey = x25519privateKeyToHex(keyPairAlice.priv)
		let hexPublicKey = x25519publicKeyToHex(keyPairAlice.pub)
		o(x25519privateKeyToHex(x25519hexToPrivateKey(hexPrivateKey))).equals(hexPrivateKey)
		o(x25519publicKeyToHex(x25519hexToPublicKey(hexPublicKey))).equals(hexPublicKey)
	})
	o("invalid hex key conversion", function () {
		const hexPublicKey = "hello"

		o(() => hexToPublicKey(hexPublicKey)).throws(CryptoError)
	})
	o("ECDH secret exchange", function () {
		let keyPairAlice = _getKeyPair("Alice")
		let keyPairBob = _getKeyPair("Bob")

		const aliceEncapsulate = x25519encapsulate(keyPairAlice, keyPairBob.pub)
		const bobDecapsulate = x25519decapsulate(keyPairBob.priv, keyPairAlice.pub)
		o(aliceEncapsulate).deepEquals(bobDecapsulate)
	})
	o("key is clamped", function () {
		// we can't inject any randomness since noble-curves gives a method, so there is a small chance this test may pass when it shouldn't; in this case, it's
		// a 1 in 32 chance for a 256-bit key to happen to be already clamped, assuming the RNG is uniform
		for (let i = 0; i < 10; i++) {
			let key = x25519generateKeyPair()
			o(key.priv[0] & 0b00000111).equals(0b00000000)("lowest 3 bits needs to be cleared (to be divisible by the cofactor)")
			o(key.priv[key.priv.length - 1] & 0b10000000).equals(0b00000000)("the highest bit needs to be cleared")
			o(key.priv[key.priv.length - 1] & 0b01000000).equals(0b01000000)("the second-highest bit needs to be set")
		}
	})
})
