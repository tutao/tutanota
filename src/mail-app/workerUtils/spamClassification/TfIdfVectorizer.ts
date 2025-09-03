import * as tf from "@tensorflow/tfjs"

export class TfIdfVectorizer {
	// VisibleForTesting
	readonly vocabulary: string[] = []
	// VisibleForTesting
	readonly termToIndex: Map<string, number> = new Map()
	// VisibleForTesting
	readonly inverseDocumentFrequencies: number[] = []

	constructor(
		docIds: string[],
		documents: string[],
		private readonly maxVocabSize: number = 1000,
	) {
		if (docIds.length !== documents.length) {
			throw new Error("docIds and documents must have the same length")
		}

		const termToDocumentFrequency: Map<string, number> = new Map()

		for (const doc of documents) {
			const tokens = new Set(this.tokenize(doc))
			for (const token of tokens) {
				termToDocumentFrequency.set(token, (termToDocumentFrequency.get(token) || 0) + 1)
			}
		}

		const sortedTerms = Array.from(termToDocumentFrequency.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, this.maxVocabSize)

		this.vocabulary = sortedTerms.map(([term]) => term)
		this.termToIndex = new Map(this.vocabulary.map((term, index) => [term, index]))

		const numDocuments = documents.length
		this.inverseDocumentFrequencies = this.vocabulary.map((term) => {
			const documentFrequencyForTerm = termToDocumentFrequency.get(term) || 0
			return Math.log((numDocuments + 1) / (documentFrequencyForTerm + 1)) + 1
		})
	}

	public transform(documents: string[]): tf.Tensor2D {
		const vectors = documents.map((doc) => this.vectorize(doc))
		return tf.tensor2d(vectors, [vectors.length, this.vocabulary.length])
	}

	public vectorize(text: string): number[] {
		const tokens = this.tokenize(text)
		const termCounts: Map<string, number> = this.countTermFrequencies(tokens)

		const vector = new Array(this.vocabulary.length).fill(0)

		for (const [term, count] of termCounts.entries()) {
			const index = this.termToIndex.get(term)
			if (index !== undefined) {
				vector[index] = count * this.inverseDocumentFrequencies[index]
			}
		}

		return vector
	}

	// VisibleForTesting
	tokenize(text: string): string[] {
		return text
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, " ")
			.split(/\s+/)
			.filter((token) => token.length > 1)
	}

	private countTermFrequencies(tokens: string[]): Map<string, number> {
		const counts = new Map<string, number>()
		for (const token of tokens) {
			if (this.termToIndex.has(token)) {
				counts.set(token, (counts.get(token) || 0) + 1)
			}
		}
		return counts
	}
}
