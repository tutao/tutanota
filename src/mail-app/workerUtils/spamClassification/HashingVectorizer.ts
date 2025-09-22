import { arrayHashUnsigned, downcast, promiseMap, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import * as tf from "@tensorflow/tfjs"
import crypto from "node:crypto"

export class HashingVectorizer {
	public readonly dimension: number = 1024
	private readonly hasher = this.tensorHash

	constructor() {}

	public async vectorize(tokens: ReadonlyArray<string>): Promise<number[]> {
		const vector = new Array(this.dimension).fill(0)

		const indexes = this.hasher(downcast<Array<string>>(tokens))
		for (const index of indexes) {
			vector[index] += 1
		}

		return vector
	}

	public async transform(docs: Array<ReadonlyArray<string>>): Promise<number[][]> {
		return await promiseMap(docs, (doc) => this.vectorize(doc), { concurrency: 1 })
	}

	/**
	 * Best hasher for our use case (lowest amount of FP):
	 * Confusion Matrix:
	 * {
	 *   Predicted_Spam: { True_Positive: 76, False_Positive: 3 },
	 *   Predicted_Ham: { False_Negative: 13, True_Negative: 543 }
	 * }
	 */
	private tensorHash(array: Array<string>): Array<number> {
		return tf.string.stringToHashBucketFast(tf.tensor1d(array, "string"), this.dimension).arraySync() as Array<number>
	}

	/**
	 * Fastest Hasher but not as accurate
	 * Confusion Matrix:
	 * {
	 *   Predicted_Spam: { True_Positive: 76, False_Positive: 5 },
	 *   Predicted_Ham: { False_Negative: 13, True_Negative: 541 }
	 * }
	 */
	public unsignedHash(array: Array<string>): Array<number> {
		return array.map((token) => arrayHashUnsigned(stringToUtf8Uint8Array(token)))
	}

	/**
	 * Faster than tensor hash and best overall but more FP than tensorHash
	 * Confusion Matrix:
	 * {
	 *   Predicted_Spam: { True_Positive: 80, False_Positive: 6 },
	 *   Predicted_Ham: { False_Negative: 9, True_Negative: 540 }
	 * }
	 */
	public sha3Hash(array: Array<string>): Array<number> {
		return array.map((token) => {
			const shaHash = crypto.createHash("sha256").update(stringToUtf8Uint8Array(token)).digest("hex")
			const shaNum = BigInt(`0x${shaHash.slice(0, 32)}`)
			const modulus = shaNum % BigInt(this.dimension)
			return Number(modulus)
		})
	}
}
