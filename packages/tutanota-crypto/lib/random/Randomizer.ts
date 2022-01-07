// @ts-ignore[untyped-import]
import sjcl from "../internal/sjcl.js"
import type {EntropySource} from "../misc/Constants.js"
import {CryptoError} from "../misc/CryptoError.js"

/**
 * This Interface provides an abstraction of the random number generator implementation.
 */
export class Randomizer {
    random: any

    constructor() {
        this.random = new sjcl.prng(6)
    }

    /**
     * Adds entropy to the random number generator algorithm
     * @param entropyCache with: number Any number value, entropy The amount of entropy in the number in bit,
     * source The source of the number.
     */
    addEntropy(
        entropyCache: Array<{
            source: EntropySource
            entropy: number
            data: number | Array<number>
        }>,
    ): Promise<void> {
        entropyCache.forEach(entry => {
            this.random.addEntropy(entry.data, entry.entropy, entry.source)
        })
        return Promise.resolve()
    }

    addStaticEntropy(bytes: Uint8Array) {
        bytes.forEach(byte => {
            this.random.addEntropy(byte, 8, "static")
        })
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
    generateRandomData(nbrOfBytes: number): Uint8Array {
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
}
// TODO singleton should be created in the app?
// the randomizer instance (singleton) that should be used throughout the app
export const random: Randomizer = new Randomizer()