import { arrayHashUnsigned, downcast, promiseMap, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { env, PlatformStub, stringToHashBucketFast, tensor1d } from "./tensorflow-custom"
import { BYTES_FOR_SERVER_CLASSIFICATION_DATA, MAX_WORD_FREQUENCY } from "../../../common/api/common/utils/spamClassificationUtils/SpamMailProcessor"

export class HashingVectorizer {
	private readonly hasher: (tokens: Array<string>) => Promise<Array<number>> = this.tensorHash

	constructor(public readonly dimension: number = 2048) {}

	public async vectorize(tokens: ReadonlyArray<string>): Promise<number[]> {
		const vector = new Array(this.dimension).fill(0)

		const indexes = await this.hasher(downcast<Array<string>>(tokens))
		for (const index of indexes) {
			if (vector[index] < MAX_WORD_FREQUENCY) {
				vector[index] += 1
			}
		}

		return vector
	}

	// visibleForTesting
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
		if (env().platform === undefined) {
			// We're okay with ignoring here because this type is a stub that should replace the actual platform type
			// inside tensorflow.js
			// @ts-ignore
			env().setPlatform("browser", new PlatformStub())
		}
		const inputTensor = tensor1d(array, "string")
		const rankTensor = stringToHashBucketFast(inputTensor, this.dimension)
		const resultArray = (await rankTensor.array()) as Array<number>

		// When using the webgl backend we need to manually dispose @tensorflow tensors
		inputTensor.dispose()
		rankTensor.dispose()

		return resultArray
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
