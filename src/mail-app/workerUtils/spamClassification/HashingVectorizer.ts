import { arrayHashUnsigned, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"

export class HashingVectorizer {
	public readonly dimension: number

	//TODO: Figure out the right dimension, based on time taken to train and speed with accuracy and other metrics.
	constructor(dimension = 7500) {
		this.dimension = dimension
	}

	public vectorize(tokens: ReadonlyArray<string>): number[] {
		const vector = new Array(this.dimension).fill(0)

		for (const token of tokens) {
			const index = arrayHashUnsigned(stringToUtf8Uint8Array(token)) % this.dimension
			vector[index] += 1
		}
		this.normalize(vector)
		return vector
	}

	public verifyCollisions(tokens: ReadonlyArray<string>): { collisionCount: number; meanCollisionScore: number } {
		let collisionMap: any = {}
		let collisionCount = 0
		for (const token of tokens) {
			const index = arrayHashUnsigned(stringToUtf8Uint8Array(token)) % this.dimension
			if (!collisionMap[index]) {
				collisionMap[index] = new Set()
			}
			collisionMap[index].add(token)
		}

		let meanCollisionScore = 0
		let isInuseCount = 0
		for (let i = 0; i < this.dimension; i++) {
			if (collisionMap[i]) {
				isInuseCount++
			}
			if (collisionMap[i]?.size > 1) {
				collisionCount += collisionMap[i].size - 1
				meanCollisionScore += collisionMap[i].size
			}
		}
		meanCollisionScore = meanCollisionScore / this.dimension

		return { collisionCount, meanCollisionScore }
	}

	public transform(docs: Array<ReadonlyArray<string>>): number[][] {
		return docs.map((doc) => this.vectorize(doc))
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
