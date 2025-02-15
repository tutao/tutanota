// @ts-ignore[untyped-import]
import sjcl from "../internal/sjcl.js";
import { CryptoError } from "../misc/CryptoError.js";
/**
 * This Interface provides an abstraction of the random number generator implementation.
 */
export class Randomizer {
    random;
    constructor() {
        this.random = new sjcl.prng(6);
    }
    /**
     * Adds entropy to the random number generator algorithm
     * @param entropyCache with: number Any number value, entropy The amount of entropy in the number in bit,
     * source The source of the number.
     */
    addEntropy(entropyCache) {
        for (const entry of entropyCache) {
            this.random.addEntropy(entry.data, entry.entropy, entry.source);
        }
        return Promise.resolve();
    }
    addStaticEntropy(bytes) {
        for (const byte of bytes) {
            this.random.addEntropy(byte, 8, "static");
        }
    }
    /**
     * Not used currently because we always have enough entropy using getRandomValues()
     */
    isReady() {
        return this.random.isReady() !== 0;
    }
    /**
     * Generates random data. The function initRandomDataGenerator must have been called prior to the first call to this function.
     * @param nbrOfBytes The number of bytes the random data shall have.
     * @return A hex coded string of random data.
     * @throws {CryptoError} if the randomizer is not seeded (isReady == false)
     */
    generateRandomData(nbrOfBytes) {
        try {
            // read the minimal number of words to get nbrOfBytes
            let nbrOfWords = Math.floor((nbrOfBytes + 3) / 4);
            let words = this.random.randomWords(nbrOfWords);
            let arrayBuffer = sjcl.codec.arrayBuffer.fromBits(words, false);
            // simply cut off the exceeding bytes
            return new Uint8Array(arrayBuffer, 0, nbrOfBytes); // truncate the arraybuffer as precaution
        }
        catch (e) {
            throw new CryptoError("error during random number generation", e);
        }
    }
    /**
     * Generate a number that fits in the range of an n-byte integer
     */
    generateRandomNumber(nbrOfBytes) {
        const bytes = this.generateRandomData(nbrOfBytes);
        let result = 0;
        for (let i = 0; i < bytes.length; ++i) {
            result += bytes[i] << (i * 8);
        }
        return result;
    }
}
// TODO singleton should be created in the app?
// the randomizer instance (singleton) that should be used throughout the app
export const random = new Randomizer();
