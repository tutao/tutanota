import { arrayHashUnsigned, promiseMap, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import * as tf from "@tensorflow/tfjs"

export class HashingVectorizer {
	public readonly dimension: number

	//TODO: Figure out the right dimension, based on time taken to train and speed with accuracy and other metrics.
	constructor(
		dimension = 7500,
		private readonly hasher = arrayHashUnsigned,
	) {
		this.dimension = dimension
	}

	public async vectorize(tokens: ReadonlyArray<string>): Promise<number[]> {
		const tokens2 = Array.from(tokens)
		const indexes = (await tf.string.stringToHashBucketFast(tf.tensor1d(tokens2, "string"), this.dimension).array()) as Array<number>

		const vector = new Array(this.dimension).fill(0)
		for (const i of indexes) {
			vector[i] += 1
		}

		// for (const token of tokens) {
		// 	const index = this.hasher(stringToUtf8Uint8Array(token)) % this.dimension
		// 	vector[index] += 1
		// }
		// this.normalize(vector)
		return vector
	}

	public verifyCollisions(tokens: ReadonlyArray<string>) {
		let mapOfUniqueTokens = new Array<Set<string>>(this.dimension)
		for (let i = 0; i < this.dimension; i++) mapOfUniqueTokens[i] = new Set()

		let nmbrOfTokenPerIndex = new Array<number>(this.dimension).fill(0)
		let nmbrOfUniqueTokenPerIndex = new Array<number>(this.dimension).fill(0)
		let nmbrOfUniqueTokens = 0

		for (const token of tokens) {
			const index = this.hasher(stringToUtf8Uint8Array(token)) % this.dimension
			const seenThisTokenBefore = mapOfUniqueTokens[index].has(token)
			nmbrOfUniqueTokens += seenThisTokenBefore ? 0 : 1
			nmbrOfUniqueTokenPerIndex[index] += seenThisTokenBefore ? 0 : 1
			nmbrOfTokenPerIndex[index] += 1
			mapOfUniqueTokens[index].add(token)
		}

		const collidingUniqueTokens = nmbrOfUniqueTokenPerIndex.filter((count) => count > 1).reduce((sum, count) => sum + (count - 1), 0)
		const indexCountWithAtLeastOneToken = mapOfUniqueTokens.filter((set) => set.size > 0).length
		const collisionAverage = collidingUniqueTokens / indexCountWithAtLeastOneToken

		let variance = 0
		for (let i = 0; i < this.dimension; i++) {
			variance += Math.pow(nmbrOfUniqueTokenPerIndex[i] - collisionAverage, 2)
		}
		const standard_deviation = Math.sqrt(variance / indexCountWithAtLeastOneToken)

		return { collisionAverage, standard_deviation, indexCountWithAtLeastOneToken }
	}

	public async transform(docs: Array<ReadonlyArray<string>>): Promise<number[][]> {
		return await promiseMap(docs, (doc) => this.vectorize(doc), { concurrency: 1 })
	}

	private normalize(vec: number[]): void {
		const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0))
		if (norm > 0) {
			for (let i = 0; i < vec.length; i++) {
				vec[i] /= norm
			}
		}
	}
}
