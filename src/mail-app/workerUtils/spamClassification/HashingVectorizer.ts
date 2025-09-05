import { arrayHash, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"

export class HashingVectorizer {
	public readonly dimension: number

	constructor(dimension = 256) {
		this.dimension = dimension
	}

	public vectorize(tokens: ReadonlyArray<string>): number[] {
		const vector = new Array(this.dimension).fill(0)

		for (const token of tokens) {
			const index = arrayHash(stringToUtf8Uint8Array(token)) % this.dimension
			vector[index] += 1
		}
		this.normalize(vector)
		return vector
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
