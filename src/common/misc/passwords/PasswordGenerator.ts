import { assertMainOrNode } from "../../api/common/Env"
import { assert } from "@tutao/tutanota-utils"
import { WorkerRandomizer } from "../../api/worker/workerInterfaces.js"

assertMainOrNode()

// exported for tests
// size of dictionary is within the 2Byte range
export const NUMBER_OF_BYTES: number = 2
export const BYTE_RANGE: number = Math.pow(2, 8 * NUMBER_OF_BYTES)

export class PasswordGenerator {
	constructor(private randomizer: WorkerRandomizer, private dictionary: Array<string>) {}

	async generateRandomPassphrase(): Promise<string> {
		const usedWords = new Set()

		while (usedWords.size < 6) {
			const word = await this.pickRandomWordFromDictionary()
			usedWords.add(word)
		}

		return Array.from(usedWords).join(" ")
	}

	async pickRandomWordFromDictionary(): Promise<string> {
		const length = this.dictionary.length
		return this.dictionary[await this.generateRandomNumberInRange(length)]
	}

	// The Randomizer generates a number within range := {0, ..., BYTE_RANGE - 1} (1Byte -> {0, ..., 255} for BYTE_RANGE = 256)
	// To scale the number n to our desired range, we can divide n by the BYTE_RANGE, resulting in a number n with 0 <= n < 1
	// @param 'range' is the length of the dictionary. Multiplying the above number by the range will result in a number in range := {0, ..., range - 1}
	// This is necessary to keep the distribution of numbers even, as well as ensuring that we do not access any invalid Index
	async generateRandomNumberInRange(range: number): Promise<number> {
		assert(range > 0, "range must be greater than 0")
		const byteNumber = await this.randomizer.generateRandomNumber(NUMBER_OF_BYTES)
		return Math.floor((byteNumber / BYTE_RANGE) * range)
	}
}
