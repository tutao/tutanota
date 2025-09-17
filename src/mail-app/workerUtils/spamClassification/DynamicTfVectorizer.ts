import { Shape } from "@tensorflow/tfjs"

const INITIAL_USED_MAX_VOCABULARY_SIZE = 5000

export type Stats = {
	/// This is the lowest frequency of word found in current vocabulary
	/// which means all included vocabulary item have frequency higher than or equal to
	/// this frequency,
	lowestIncludedFrequency: number
	/// Out of total corpse of data, these many items were excluded from vocabulary,
	excludedVocabCount: number
}

// TODO:
// in offline db: store word->frequency map instead of copy of whole(body, subject) mail,
export class DynamicTfVectorizer {
	public readonly dimension = 8000
	private readonly vocabularyOfTrainedModel: Map<string, number> = new Map()
	private readonly newVocabulary: Map<string, number> = new Map()
	public stats: Stats

	private getTermFrequency(outputFrequencyMap: Map<string, number>, termCollection: ReadonlyArray<string>) {
		for (const token of termCollection) {
			outputFrequencyMap.set(token, (outputFrequencyMap.get(token) || 0) + 1)
		}
		return outputFrequencyMap
	}

	// TODO: Perhaps look at excluding the tokens not by available slot but token count, e.g. ignore tokens that only show up once.
	public constructor(tokenizedDocuments: ReadonlyArray<ReadonlyArray<string>>) {
		/// While training we only consume 75% of total available vocabulary slot,
		const maxDimensionToConsume = this.dimension * 0.75
		const allTermFrequency = tokenizedDocuments.reduce(this.getTermFrequency, new Map<string, number>())

		const mostCommonTermsArray = Array.from(allTermFrequency.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, maxDimensionToConsume)

		const lowestIncludedFrequency = mostCommonTermsArray[mostCommonTermsArray.length - 1][1]
		const excludedVocabCount = allTermFrequency.size - mostCommonTermsArray.length

		this.vocabularyOfTrainedModel = new Map(mostCommonTermsArray)
		this.stats = { lowestIncludedFrequency, excludedVocabCount }
	}

	// Fill out vocabulary table with these new sets of vocabs,
	// If we overflow
	// @returns: weather a retrain is required or not
	public expandVocabulary(tokenizedTexts: ReadonlyArray<string>): boolean {
		const mappedTokens = new Map()
		this.getTermFrequency(mappedTokens, tokenizedTexts)
		let affectedExistingFrequency = 0

		for (const [newVocab, newVocabFrequency] of mappedTokens) {
			const oldFrequency = this.vocabularyOfTrainedModel.get(newVocab)
			if (oldFrequency) {
				affectedExistingFrequency += 1
				this.vocabularyOfTrainedModel.set(newVocab, oldFrequency + newVocabFrequency)
				// we can also delete it from newVocab so once we are out of this loop,
				// newVocab will only have the vocab that we have not seen before,
				mappedTokens.delete(newVocab)
			}
		}

		const availableSpace = this.dimension - this.vocabularyOfTrainedModel.size
		const affectedExistingFrequencyRatio = affectedExistingFrequency / this.vocabularyOfTrainedModel.size
		const needsRetraining = availableSpace < mappedTokens.size || affectedExistingFrequencyRatio > 0.4

		mappedTokens.forEach((newVocabFrequency, newVocab) => this.vocabularyOfTrainedModel.set(newVocab, newVocabFrequency))
		mappedTokens.clear()
		return needsRetraining
	}

	public transform(tokenizedDocuments: Array<ReadonlyArray<string>>): number[][] {
		return tokenizedDocuments.map((doc) => this.vectorize(doc))
	}

	public vectorize(tokenizedText: ReadonlyArray<string>): number[] {
		const termFrequency = new Map()
		const tokenMap = this.getTermFrequency(termFrequency, tokenizedText)

		let index = 0
		let vector = new Array<number>(this.vocabularyOfTrainedModel.size).fill(0)
		for (const [term, _] of this.vocabularyOfTrainedModel.entries()) {
			vector[index] = tokenMap.get(term) ?? 0
			index += 1
		}

		return vector
	}

	public getStats(): Readonly<Stats> {
		return Object.seal(this.stats)
	}
}
