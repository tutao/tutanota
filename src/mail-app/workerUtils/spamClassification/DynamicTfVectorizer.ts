const DEFAULT_TOKEN_VOCABULARY_LIMIT = 5000
const DEFAULT_USE_TOKEN_STEMMING = true

export type Stats = {
	/// This is the lowest frequency of word found in current vocabulary,
	/// which means all included vocabulary item have frequency higher than or equal to this frequency.
	lowestIncludedFrequency: number
	/// Out of total corpus of token vocabulary, these many items were excluded from vocabulary,
	excludedTokenVocabularyCount: number
}

export class DynamicTfVectorizer {
	readonly dimension: number

	private stats: Stats | null = null

	public constructor(
		tokenVocabulary: Set<string>,
		readonly useTokenStemming: boolean = DEFAULT_USE_TOKEN_STEMMING,
		readonly tokenVocabularyLimit: number = DEFAULT_TOKEN_VOCABULARY_LIMIT,
	) {
		this.tokenVocabulary = tokenVocabulary
		// we account for 50% more vocabulary than initially occupied
		this.dimension = tokenVocabularyLimit + tokenVocabularyLimit * 0.5
	}

	private tokenVocabulary: Set<string>

	public buildInitialTokenVocabulary(initialTokenizedMails: ReadonlyArray<ReadonlyArray<string>>) {
		console.log(initialTokenizedMails)

		const allTokenFrequencies = initialTokenizedMails.reduce((_, tokenizedMail) => this.getTokenFrequency(tokenizedMail), new Map<string, number>())

		console.log(allTokenFrequencies)

		const mostCommonTokens = Array.from(allTokenFrequencies.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, this.tokenVocabularyLimit)

		const lowestIncludedFrequency = mostCommonTokens[mostCommonTokens.length - 1][1]
		const excludedTokenVocabularyCount = allTokenFrequencies.size - mostCommonTokens.length

		console.log(mostCommonTokens)

		this.tokenVocabulary = new Set(mostCommonTokens.map(([token, _frequency]) => token))
		console.log(this.tokenVocabulary)
		this.stats = { lowestIncludedFrequency, excludedTokenVocabularyCount }
	}

	private getTokenFrequency(tokenCollection: ReadonlyArray<string>, expandTokenVocabulary = false) {
		const resultTokenFrequencyMap = new Map<string, number>()
		for (let token of tokenCollection) {
			if (this.useTokenStemming) {
				//token = stemmer(token)
			}
			if (expandTokenVocabulary && !this.tokenVocabulary.has(token)) {
				this.expandTokenVocabulary(token)
			}

			resultTokenFrequencyMap.set(token, (resultTokenFrequencyMap.get(token) || 0) + 1)
		}
		return resultTokenFrequencyMap
	}

	/**
	 * Expand (add to) the token vocabulary with the new token.
	 */
	private expandTokenVocabulary(token: string) {
		this.tokenVocabulary.add(token)
	}

	public transform(tokenizedMails: Array<ReadonlyArray<string>>): number[][] {
		return this._transform(tokenizedMails, false)
	}

	/**
	 * transform method to be used when refitting
	 * @returns: null in case a full retraining of the model is required
	 */
	public refitTransform(tokenizedMails: Array<ReadonlyArray<string>>): number[][] | null {
		const transformResult = this._transform(tokenizedMails, true)

		const availableSpace = this.dimension - this.tokenVocabulary.size
		if (availableSpace <= 0) {
			return null
		} else {
			return transformResult
		}
	}

	private _transform(tokenizedMails: Array<ReadonlyArray<string>>, expandTokenVocabulary = false): number[][] {
		return tokenizedMails.map((tokenizedMail) => this.vectorize(tokenizedMail, expandTokenVocabulary))
	}

	// visibleForTesting
	public vectorize(tokenizedMail: ReadonlyArray<string>, expandTokenVocabulary = false): number[] {
		const tokenFrequencyMap = this.getTokenFrequency(tokenizedMail, expandTokenVocabulary)

		let index = 0
		let vector = new Array<number>(this.dimension).fill(0)
		for (const [token, _] of this.tokenVocabulary.entries()) {
			vector[index] = tokenFrequencyMap.get(token) ?? 0
			index += 1
		}

		return vector
	}

	public getStats(): Stats | null {
		return Object.seal(this.stats)
	}
}
