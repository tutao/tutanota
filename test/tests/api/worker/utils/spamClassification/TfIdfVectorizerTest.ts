import o from "@tutao/otest"
import { TfIdfVectorizer } from "../../../../../../src/mail-app/workerUtils/spamClassification/TfIdfVectorizer"

o.spec("TfIdfVectorizer", () => {
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

	const docIds = ["doc1", "doc2", "doc3", "doc4", "doc5"]

	o("constructor throws if docIds and documents mismatch", () => {
		o(() => new TfIdfVectorizer(["doc1"], [["token1"], ["token2"]])).throws(Error)
	})

	o("builds correct vocabulary with filtered tokens", () => {
		const vectorizer = new TfIdfVectorizer(docIds, tokenizedDocuments)
		o(vectorizer.vocabulary.includes("tuta")).equals(true)
		o(vectorizer.vocabulary.includes("email")).equals(true)
		o(vectorizer.vocabulary.includes("a")).equals(false)
	})

	o("calculates correct IDF values", () => {
		const vectorizer = new TfIdfVectorizer(docIds, tokenizedDocuments)
		const termToIndex = vectorizer.termToIndex
		const inverseDocumentFrequencies = vectorizer.inverseDocumentFrequencies

		const index = termToIndex.get("encryption")!
		const idf = inverseDocumentFrequencies[index]
		o(idf > 1).equals(true)
	})

	o("vectorize returns correct TF-IDF vector", () => {
		const vectorizer = new TfIdfVectorizer(docIds, tokenizedDocuments)
		const tokens = ["email", "encryption"]
		const vector = vectorizer.vectorize(tokens)
		o(vector.length).equals(vectorizer.vocabulary.length)

		const emailIndex = vectorizer.termToIndex.get("email")!
		const encryptionIndex = vectorizer.termToIndex.get("encryption")!
		o(vector[emailIndex] > 0).equals(true)
		o(vector[encryptionIndex] > 0).equals(true)
	})

	o("transform returns correct tensor shape", () => {
		const vectorizer = new TfIdfVectorizer(docIds, tokenizedDocuments)
		const inputTokens = [
			["privacy", "encryption"],
			["user", "data"],
		]
		const tensor = vectorizer.transform(inputTokens)

		o(tensor.length).equals(2)
		o(tensor[0].length).equals(vectorizer.vocabulary.length)

		const allZeros = Array.from(tensor.flat()).every((v) => v === 0)
		o(allZeros).equals(false)
	})

	o("handles unknown words gracefully", () => {
		const vectorizer = new TfIdfVectorizer(docIds, tokenizedDocuments)
		const tokens = ["hannover", "munich"]
		const vector = vectorizer.vectorize(tokens)
		const nonZero = vector.some((val) => val > 0)
		o(nonZero).equals(false)
	})
})
