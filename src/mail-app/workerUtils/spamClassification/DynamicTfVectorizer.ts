const INITIAL_USED_MAX_VOCABULARY_SIZE = 5000
const INITIAL_MAX_VOCABULARY_SIZE = INITIAL_USED_MAX_VOCABULARY_SIZE + INITIAL_USED_MAX_VOCABULARY_SIZE * 0.5

export class DynamicTfVectorizer {
	public dimension = INITIAL_MAX_VOCABULARY_SIZE
	vocabulary: Array<string> = []

	private getTermToDocumentFrequency(tokenizedDocuments: Array<ReadonlyArray<string>>) {
		const termToDocumentFrequency: Map<string, number> = new Map()

		for (const doc of tokenizedDocuments) {
			for (const token of doc) {
				termToDocumentFrequency.set(token, (termToDocumentFrequency.get(token) || 0) + 1)
			}
		}

		return termToDocumentFrequency
	}

	public generateVocabulary(tokenizedDocuments: Array<ReadonlyArray<string>>) {
		const termToDocumentFrequency = this.getTermToDocumentFrequency(tokenizedDocuments)

		const mostCommonTerms = Array.from(termToDocumentFrequency.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, INITIAL_USED_MAX_VOCABULARY_SIZE)
		const lowestTermFrequency = mostCommonTerms[mostCommonTerms.length - 1][1]
		console.log(
			`Removed ${termToDocumentFrequency.size - mostCommonTerms.length} items which have frequency equal (partial) or less than: ${lowestTermFrequency}`,
		)

		this.vocabulary = mostCommonTerms.map(([term, _index]) => term)
	}

	private expandVocabulary(newVocabulary: ReadonlySet<string>) {
		for (const newVoc of newVocabulary) {
			if (this.vocabulary.length < this.dimension) {
				this.vocabulary.push(newVoc)
			}
		}
	}

	public transform(tokenizedDocuments: Array<ReadonlyArray<string>>): number[][] {
		return tokenizedDocuments.map((doc) => this.vectorize(doc))
	}

	// visibleForTesting
	public vectorize(tokenizedText: ReadonlyArray<string>): number[] {
		const { termCounts, newTerms } = this.countTermFrequencies(tokenizedText)
		const vector = new Array(this.dimension).fill(0)

		if (vector.length > this.vocabulary.length) {
			this.expandVocabulary(newTerms)
		}

		// loop over termCounts and newTerms instead

		for (const [index, voc] of this.vocabulary.entries()) {
			if (termCounts.has(voc)) {
				vector[index] = termCounts.get(voc)
			}
		}

		return vector
	}

	private countTermFrequencies(tokens: ReadonlyArray<string>): {
		termCounts: Map<string, number>
		newTerms: Set<string>
	} {
		const termCounts = new Map<string, number>()
		const newTerms = new Set<string>()
		for (const token of tokens) {
			if (!this.vocabulary.includes(token)) {
				newTerms.add(token)
			}
			termCounts.set(token, (termCounts.get(token) || 0) + 1)
		}
		return { termCounts, newTerms }
	}
}
