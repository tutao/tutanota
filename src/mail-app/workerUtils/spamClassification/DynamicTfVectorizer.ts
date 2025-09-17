import { Nullable } from "@tutao/tutanota-utils/dist/Utils"

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
	public stats: Nullable<Stats> = null
	vocabulary: Set<string> = new Set<string>()

	private getTermToDocumentFrequency(tokenizedDocuments: Array<ReadonlyArray<string>>) {
		const termToDocumentFrequency: Map<string, number> = new Map()

		for (const doc of tokenizedDocuments) {
			for (const token of doc) {
				termToDocumentFrequency.set(token, (termToDocumentFrequency.get(token) || 0) + 1)
			}
		}

		return termToDocumentFrequency
	}

	// TODO: Perhaps look at excluding the tokens not by available slot but token count, e.g. ignore tokens that only show up once.
	public generateVocabulary(tokenizedDocuments: Array<ReadonlyArray<string>>) {
		/// While training we only consume 75% of total available vocabulary slot,
		const maxDimensionToConsume = this.dimension * 0.75
		const termToDocumentFrequency = this.getTermToDocumentFrequency(tokenizedDocuments)

		const mostCommonTerms = Array.from(termToDocumentFrequency.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, maxDimensionToConsume)

		const lowestIncludedFrequency = mostCommonTerms[mostCommonTerms.length - 1][1]
		const excludedVocabCount = termToDocumentFrequency.size - mostCommonTerms.length
		this.stats = { lowestIncludedFrequency, excludedVocabCount }

		this.vocabulary = new Set(mostCommonTerms.map((term) => term[0]))
	}

	// Fill out vocabulary table with these new sets of vocabs,
	// If we overflow
	private expandVocabulary(tokenizedTexts: ReadonlyArray<string>) {
		let changedFrequencyOfExistingVocab = false
		const newVocabMap = this.getTermToDocumentFrequency([tokenizedTexts])

		for (const [newVocab, newVocabFrequency] of newVocabMap) {
			const oldFrequency = this.vocabulary.get(newVocab)
			if (oldFrequency) {
				changedFrequencyOfExistingVocab = true
				this.vocabulary.set(newVocab, oldFrequency + newVocabFrequency)
				// we can also delete it from newVocab so once we are out of this loop,
				// newVocab will only have the vocab that we have not seen before,
				newVocabMap.delete(newVocab)
			}
		}

		// First Training
		// Mail 1: Body: Hello money spam spam Hello Hello // this uses the body space
		// Mail 1 {Hello: 3, spam: 2, money: 1}] // store this as it`s cheaper
		//Mail 2 {Hello: 3, ham: 1, money: 0}]
		//Mail 3 {Hello: 2, ham: 1, friend: 1}]
		// Vocabulary:   [Hello, spam, ham, money, friend]
		// Vocabulary(_s|_h) :  {Hello: 8, spam: 2, ham: 2, money: 1, friend:1}] == the model internal representation

		// After Training
		//Mail 4 {Hello: 1, ham: 1, joy: 1 }]
		// Vocabulary:  {Hello: 9, spam: 2, ham: 3, money: 1, friend: 1, joy: 1}]
		// Vocabulary:   [Hello, spam, ham, money, friend, joy] // we know when to train based on the length
		// only retraining when the vocabulary token count is the limit.

		// reaming stuff in newVocabMap is the vocab we have not seen before,

		const availableSpace = this.dimension - this.vocabulary.size
		if (availableSpace >= newVocabMap.size) {
			// we can add all new vocab
		} else {
			// re-order all vocab
			// re-train
		}

		const termToDocumentFrequency = this.getTermToDocumentFrequency(newVocabulary)

		const mostCommonTerms = Array.from(termToDocumentFrequency.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, maxDimensionToConsume)

		for (const newVoc of newVocabulary) {
			if (this.vocabulary.size < this.dimension) {
				this.vocabulary.add(newVoc)
			}
		}
	}

	public transform(tokenizedDocuments: Array<ReadonlyArray<string>>): number[][] {
		return tokenizedDocuments.map((doc) => this.vectorize(doc))
	}

	// Normal classification.  *Body: Hello Someone, here is a spam, say hello to me*
	///Get the text from Mail()
	// Text->Vectorize() [2(hello count), 1, 1, 1(spam)]
	// Vector
	// Classify -> Done.
	//
	// Move mail
	// Verify if we update the offline DB
	// re-train.
	// get the text from the offline_db
	// vectorize
	// train the model. Here we can increase the vocabulary
	// visibleForTesting
	public vectorize(tokenizedText: ReadonlyArray<string>): number[] {
		this.expandVocabulary()
		// loop tokenizedText

		const { termCounts, newTerms } = this.countTermFrequencies(tokenizedText)
		const vector: Array<number> = new Array(this.dimension).fill(0)

		if (vector.length > this.vocabulary.length) {
			this.expandVocabulary(newTerms, termCounts)
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
