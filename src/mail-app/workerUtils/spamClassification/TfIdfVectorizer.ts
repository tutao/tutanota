const INITIAL_MAX_VOCABULARY_SIZE = 5000

export class TfIdfVectorizer {
	// VisibleForTesting
	private termToIndex: Map<string, number> = new Map()
	// VisibleForTesting
	private inverseDocumentFrequencies: number[] = []

	static getTermToDocumentFrequency(tokenizedDocuments: Array<ReadonlyArray<string>>) {
		const termToDocumentFrequency: Map<string, number> = new Map()

		for (const doc of tokenizedDocuments) {
			for (const token of doc) {
				termToDocumentFrequency.set(token, (termToDocumentFrequency.get(token) || 0) + 1)
			}
		}

		return termToDocumentFrequency
	}

	static generateVocabulary(tokenizedDocuments: Array<ReadonlyArray<string>>) {
		const termToDocumentFrequency = this.getTermToDocumentFrequency(tokenizedDocuments)

		const sortedTerms = Array.from(termToDocumentFrequency.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, INITIAL_MAX_VOCABULARY_SIZE)

		const vocabulary = sortedTerms.map(([term]) => term)
		return vocabulary
	}

	constructor(
		docIds: string[],
		tokenizedDocuments: Array<ReadonlyArray<string>>,
		readonly vocabulary: Array<string>,
		readonly max_length: number = INITIAL_MAX_VOCABULARY_SIZE,
	) {
		if (docIds.length !== tokenizedDocuments.length) {
			throw new Error("docIds and tokenizedDocuments must have the same length")
		}

		//TODO: Find a way to not need to re-create these term frequencies and assign them multiple times.
		const termToDocumentFrequency = TfIdfVectorizer.getTermToDocumentFrequency(tokenizedDocuments)

		this.termToIndex = new Map(this.vocabulary.map((term, index) => [term, index]))

		const numDocuments = tokenizedDocuments.length
		this.inverseDocumentFrequencies = this.vocabulary.map((term) => {
			const documentFrequencyForTerm = termToDocumentFrequency.get(term) || 0
			return Math.log((numDocuments + 1) / (documentFrequencyForTerm + 1)) + 1
		})
	}

	public expandVocabulary(newVocabulary: ReadonlyArray<string>) {
		for (const token of newVocabulary) {
			if (!this.termToIndex.get(token) && this.vocabulary.length < this.max_length) {
				this.vocabulary.push(token)
			}
		}
		// TODO: we need to update the frequency after expanding the vocabulary
		this.generateIndexAndFrequency()
	}

	private generateIndexAndFrequency() {
		this.termToIndex = new Map(this.vocabulary.map((term, index) => [term, index]))

		// const numDocuments = tokenizedDocuments.length
		// this.inverseDocumentFrequencies = this.vocabulary.map((term) => {
		// 	const documentFrequencyForTerm = termToDocumentFrequency.get(term) || 0
		// 	return Math.log((numDocuments + 1) / (documentFrequencyForTerm + 1)) + 1
		// })
	}

	//retrain()
	public transform(tokenizedDocuments: Array<ReadonlyArray<string>>): number[][] {
		return tokenizedDocuments.map((doc) => this.vectorize(doc))
	}

	public vectorize(tokenizedText: ReadonlyArray<string>): number[] {
		const termCounts: Map<string, number> = this.countTermFrequencies(tokenizedText)

		const vector = new Array(this.max_length).fill(0)

		for (const [term, count] of termCounts.entries()) {
			const index = this.termToIndex.get(term)
			if (index !== undefined) {
				vector[index] = count * this.inverseDocumentFrequencies[index]
			}
		}

		return vector
	}

	private countTermFrequencies(tokens: ReadonlyArray<string>): Map<string, number> {
		const counts = new Map<string, number>()
		for (const token of tokens) {
			if (this.termToIndex.has(token)) {
				counts.set(token, (counts.get(token) || 0) + 1)
			}
		}
		return counts
	}
}
