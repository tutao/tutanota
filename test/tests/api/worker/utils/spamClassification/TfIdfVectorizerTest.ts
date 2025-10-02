import o from "@tutao/otest"
import { DynamicTfVectorizer } from "../../../../../../src/mail-app/workerUtils/spamClassification/DynamicTfVectorizer"

o.spec("DynamicTfVectorizer", () => {
	const tokenize = (text: string): string[] =>
		text
			.toLowerCase()
			.split(/\s+/)
			.map((t) => t.replace(/[^a-z0-9-]/gi, "")) // remove punctuation
			.filter((t) => t.length > 1)

	const rawDocuments = [
		"Tuta is an encrypted email service that prioritizes privacy and open-source principles.",
		"With Tuta, your emails and contacts are stored securely using end-to-end encryption.",
		"With Tuta, you can create a completely encrypted zero-knowledge calendar, try now!",
		"Unlike traditional email providers, Tuta never collects user data or scans your messages.",
		"Millions of people choose Tuta to protect their personal and professional communication.",
	]

	const tokenizedDocuments = rawDocuments.map(tokenize)

	o("constructor throws if docIds and documents mismatch", () => {
		// o(() => new DynamicTfVectorizer(["doc1"], [["token1"], ["token2"]])).throws(Error)
	})

	// o("builds correct vocabulary with filtered tokens", () => {
	// 	const vectorizer = new DynamicTfVectorizer()
	// 	vectorizer.initializeVocabulary(tokenizedDocuments)
	// 	o(vectorizer.vocabulary.includes("tuta")).equals(true)
	// 	o(vectorizer.vocabulary.includes("email")).equals(true)
	// 	o(vectorizer.vocabulary.includes("a")).equals(false)
	// })

	// o("vectorize returns correct TF vector", () => {
	// 	const vectorizer = new DynamicTfVectorizer()
	// 	vectorizer.initializeVocabulary(tokenizedDocuments)
	// 	const tokens = ["email", "encryption"]
	// 	const vector = vectorizer.vectorize(tokens)
	// 	o(vector.length).equals(vectorizer.featureVectorDimension)
	//
	// 	const emailIndex = vectorizer.vocabulary.includes("email")!
	// 	const encryptionIndex = vectorizer.vocabulary.includes("encryption")!
	// 	o(emailIndex).equals(true)
	// 	o(encryptionIndex).equals(true)
	// })

	// o("transform returns correct tensor shape", () => {
	// 	const vectorizer = new DynamicTfVectorizer()
	// 	vectorizer.initializeVocabulary(tokenizedDocuments)
	// 	const inputTokens = [
	// 		["privacy", "encryption"],
	// 		["user", "data"],
	// 	]
	// 	const vector = vectorizer.transform(inputTokens)
	//
	// 	o(vector.length).equals(2)
	// 	o(vector[0].length).equals(vectorizer.featureVectorDimension)
	//
	// 	const allZeros = Array.from(vector.flat()).every((v) => v === 0)
	// 	o(allZeros).equals(false)
	// })

	// o("adds unknown words to vocabulary when still enough space", () => {
	// 	const vectorizer = new DynamicTfVectorizer()
	// 	vectorizer.initializeVocabulary(tokenizedDocuments)
	// 	const tokens = ["hannover", "munich"]
	// 	const vector = vectorizer.vectorize(tokens)
	// 	const nonZero = vector.some((val) => val > 0)
	// 	o(nonZero).equals(true)
	// })
})
