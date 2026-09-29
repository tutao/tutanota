/**
 * This is a wrapper for commonly used crypto functions, easier to inject/swap implementations and test.
 */
import crypto from "node:crypto"
import { Aes256Key, AesKey, base64ToKey, EntropySource, Randomizer, SymmetricCipherFacade, uint8ArrayToKey } from "@tutao/crypto"

import { EntropyDataChunk } from "../../../platform-kit/crypto/random/EntropyDataChunk"
import { SymmetricCipherUtils } from "../../../platform-kit/crypto/encryption/symmetric/SymmetricCipherUtils"

// the prng throws if it doesn't have enough entropy
// it may be called very early, so we need to seed it
// we do it here because it's the first place in the dep. chain that knows it's
// in node but the last one that knows the prng implementation

// const seed = (random: Randomizer) => {
// 	const entropy = Array.from(crypto.randomBytes(128))
// 	random.addEntropy(entropy.map((b) => new EntropyDataChunk(EntropySource.Random, 128 * 8, b))).then()
// }
//
// seed(random)

export class CryptoFunctions {
	constructor(
		private readonly random: Randomizer,
		private readonly symmetricCipherUtils: SymmetricCipherUtils,
		private readonly symmetricCipherFacade: SymmetricCipherFacade,
	) {}

	static seed(random: Randomizer) {
		const entropy = Array.from(crypto.randomBytes(128))
		random.addEntropy(entropy.map((b) => new EntropyDataChunk(EntropySource.Random, 128 * 8, b))).then()
	}

	seed() {
		CryptoFunctions.seed(this.random)
	}

	aesEncrypt(key: AesKey, bytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return this.symmetricCipherFacade.encryptBytes(key, bytes)
	}

	encryptKey(key: AesKey, bytes: AesKey): Uint8Array<ArrayBuffer> {
		return this.symmetricCipherFacade.encryptKey(key, bytes)
	}

	aesDecrypt(key: AesKey, encryptedBytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return this.symmetricCipherFacade.decryptBytes(key, encryptedBytes)
	}

	/**
	 * @deprecated
	 */
	unauthenticatedAesDecrypt(key: Aes256Key, encryptedBytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return this.symmetricCipherFacade.decryptBytesDeprecatedUnauthenticated(key, encryptedBytes)
	}

	/**
	 * @deprecated
	 */
	decryptKeyUnauthenticatedWithDeviceKeyChain(key: Aes256Key, encryptedBytes: Uint8Array<ArrayBuffer>): AesKey {
		return this.symmetricCipherFacade.decryptKeyDeprecatedUnauthenticated(key, encryptedBytes)
	}

	decryptKey(encryptionKey: AesKey, key: Uint8Array<ArrayBuffer>): AesKey {
		return this.symmetricCipherFacade.decryptKey(encryptionKey, key)
	}

	bytesToKey(bytes: Uint8Array<ArrayBuffer>): AesKey {
		return uint8ArrayToKey(bytes)
	}

	base64ToKey(base64: Base64): AesKey {
		return base64ToKey(base64)
	}

	/**
	 * verify a signature of some data with a given PEM-encoded spki public key
	 */
	verifySignature(pem: string, data: Uint8Array, signature: Uint8Array<ArrayBuffer>): boolean {
		return crypto.verify("SHA512", data, pem, signature)
	}

	randomBytes(nbrOfBytes: number): Uint8Array<ArrayBuffer> {
		try {
			// may fail if the entropy pools are exhausted
			return this.random.generateRandomData(nbrOfBytes)
		} catch (e) {
			this.seed()
			return this.random.generateRandomData(nbrOfBytes)
		}
	}

	aes256RandomKey(): Aes256Key {
		return this.symmetricCipherUtils.aes256RandomKey()
	}
}
