import { arrayHashUnsigned, downcast, promiseMap, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import * as tfCore from "@tensorflow/tfjs-core"

export class HashingVectorizer {
	public readonly dimension: number = 2048
	private readonly hasher: (tokens: Array<string>) => Promise<Array<number>> = this.tensorHash

	constructor() {}

	public async vectorize(tokens: ReadonlyArray<string>): Promise<number[]> {
		const vector = new Array(this.dimension).fill(0)

		const indexes = await this.hasher(downcast<Array<string>>(tokens))
		for (const index of indexes) {
			vector[index] += 1
		}

		return vector
	}

	public async transform(preprocessedMails: Array<ReadonlyArray<string>>): Promise<number[][]> {
		return await promiseMap(preprocessedMails, (preprocessedMail) => this.vectorize(preprocessedMail), { concurrency: 1 })
	}

	/**
	 * Best hasher for our use case (lowest amount of FP):
	 * Confusion Matrix:
	 * {
	 *   Predicted_Spam: { True_Positive: 76, False_Positive: 3 },
	 *   Predicted_Ham: { False_Negative: 13, True_Negative: 543 }
	 * }
	 */
	private async tensorHash(array: Array<string>): Promise<Array<number>> {
		return tfCore.string.stringToHashBucketFast(tfCore.tensor1d(array, "string"), this.dimension).array() as Promise<Array<number>>
	}

	/**
	 * Fastest Hasher but not as accurate
	 * Confusion Matrix:
	 * {
	 *   Predicted_Spam: { True_Positive: 76, False_Positive: 5 },
	 *   Predicted_Ham: { False_Negative: 13, True_Negative: 541 }
	 * }
	 */
	public async unsignedHash(array: Array<string>): Promise<Array<number>> {
		return array.map((token) => arrayHashUnsigned(stringToUtf8Uint8Array(token)))
	}
}
