// @flow
import sjcl from "./lib/crypto-sjcl-1.0.7"
import {CryptoError} from "../../common/error/CryptoError"
import {assertWorkerOrNode} from "../../Env"
import type {EntropySrcEnum} from "../../common/TutanotaConstants"
import {EntropySrc} from "../../common/TutanotaConstants"

assertWorkerOrNode()

class Randomizer {
	random: any;

	constructor() {
		this.random = new sjcl.prng(6)
	}

	addEntropy(entropyCache: {source: EntropySrcEnum, entropy: number, data: number}[]): Promise<void> {
		entropyCache.forEach(entry => {
			this.random.addEntropy(entry.data, entry.entropy, entry.source)
		})
		return Promise.resolve()
	}

	addStaticEntropy(bytes: Uint8Array) {
		bytes.forEach(byte => {
			this.random.addEntropy(byte, 8, EntropySrc.static)
		})
	}

	/**
	 * Not used currently because we always have enough entropy using getRandomValues()
	 */
	isReady(): boolean {
		return this.random.isReady() !== 0
	}

	generateRandomData(nbrOfBytes: number): Uint8Array {
		try {
			// read the minimal number of words to get nbrOfBytes
			let nbrOfWords = Math.floor((nbrOfBytes + 3) / 4)
			let words = this.random.randomWords(nbrOfWords)
			let arrayBuffer = sjcl.codec.arrayBuffer.fromBits(words, false)
			// simply cut off the exceeding bytes
			return new Uint8Array(arrayBuffer, 0, nbrOfBytes) // truncate the arraybuffer as precaution
		} catch (e) {
			throw new CryptoError("error during random number generation", e)
		}
	}
}

// the randomizer instance (singleton) that should be used throughout the app
export const random: Randomizer = new Randomizer()
