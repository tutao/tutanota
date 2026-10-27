// @ts-ignore[untyped-import]
import sjcl from "../internal/sjcl.js"
import { CryptoError } from "@tutao/crypto/error"

import { EntropyDataChunk } from "./EntropyDataChunk"
import crypto from "node:crypto"
import { EntropySource } from "../CryptoTypes"

/**
 * This Interface provides an abstraction of the random number generator implementation.
 */
export interface Randomizer {
	addEntropy(entropyCache: Array<EntropyDataChunk>): Promise<void>
	addStaticEntropy(bytes: Uint8Array<ArrayBuffer>): void
	isReady(): boolean
	generateRandomData(nbrOfBytes: number): Uint8Array<ArrayBuffer>
	generateRandomNumber(nbrOfBytes: number): number
}

// Don't export the randomizer implementation because we want to enforce seeding by calling createSeededRandomizer
class RandomizerImplementation implements Randomizer {
	random: any

	/**
	 * Adds entropy to the random number generator algorithm
	 * @param entropyCache with: number Any number value, entropy The amount of entropy in the number in bit,
	 * source The source of the number.
	 */
	addEntropy(entropyCache: Array<EntropyDataChunk>): Promise<void> {
		for (const entry of entropyCache) {
			this.random.addEntropy(entry.data, entry.entropy, entry.source)
		}
		return Promise.resolve()
	}

	addStaticEntropy(bytes: Uint8Array<ArrayBuffer>): void {
		for (const byte of bytes) {
			this.random.addEntropy(byte, 8, "static")
		}
	}

	/**
	 * Not used currently because we always have enough entropy using getRandomValues()
	 */
	isReady(): boolean {
		return this.random.isReady() !== 0
	}

	/**
	 * Generates random data. The function initRandomDataGenerator must have been called prior to the first call to this function.
	 * @param nbrOfBytes The number of bytes the random data shall have.
	 * @return A hex coded string of random data.
	 * @throws {CryptoError} if the randomizer is not seeded (isReady == false)
	 */
	generateRandomData(nbrOfBytes: number): Uint8Array<ArrayBuffer> {
		try {
			// read the minimal number of words to get nbrOfBytes
			let nbrOfWords = Math.floor((nbrOfBytes + 3) / 4)
			let words = this.random.randomWords(nbrOfWords)
			let arrayBuffer = sjcl.codec.arrayBuffer.fromBits(words, false)
			// simply cut off the exceeding bytes
			return new Uint8Array(arrayBuffer, 0, nbrOfBytes) // truncate the arraybuffer as precaution
		} catch (e) {
			throw new CryptoError("error during random number generation", e as Error)
		}
	}

	/**
	 * Generate a number that fits in the range of an n-byte integer
	 */
	generateRandomNumber(nbrOfBytes: number): number {
		const bytes = this.generateRandomData(nbrOfBytes)
		let result = 0

		for (let i = 0; i < bytes.length; ++i) {
			result += bytes[i] << (i * 8)
		}
		return result
	}
}

export function createSeededRandomizer() {
	const instance = new RandomizerImplementation()
	instance.random = new sjcl.prng(6)

	// Seed the instance of the random number generator
	const entropy = Array.from(crypto.randomBytes(128))
	instance.addEntropy(entropy.map((b) => new EntropyDataChunk(EntropySource.Random, 128 * 8, b))).then()

	return instance
}
