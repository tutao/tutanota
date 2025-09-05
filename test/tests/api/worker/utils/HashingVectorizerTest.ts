import o from "@tutao/otest"
import { HashingVectorizer } from "../../../../../src/mail-app/workerUtils/spamClassification/HashingVectorizer"
import { arrayEquals } from "@tutao/tutanota-utils"

o.spec("HashingVectorizer", () => {
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

	o("vectorize outputs normalized vector", () => {
		const vectorizer = new HashingVectorizer()
		const tokens = ["email", "email", "encryption"]
		const vector = vectorizer.vectorize(tokens)

		const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
		o(Math.abs(norm - 1) < 0.00001).equals(true)
	})

	o("vectorize creates same vector for same tokens", () => {
		const vectorizer = new HashingVectorizer()
		const tokens = ["privacy", "email", "data"]
		const v1 = vectorizer.vectorize(tokens)
		const v2 = vectorizer.vectorize(tokens)
		o(arrayEquals(v1, v2)).equals(true)
	})

	o("vectorize handles empty input", () => {
		const vectorizer = new HashingVectorizer()
		const vector = vectorizer.vectorize([])
		o(vector.every((v) => v === 0)).equals(true)
	})

	o("transform returns correct shape", () => {
		const vectorizer = new HashingVectorizer()
		const tensor = vectorizer.transform(tokenizedDocuments)

		o(tensor.length).equals(tokenizedDocuments.length)
		for (const vec of tensor) {
			o(vec.length).equals(vectorizer.dimension)
		}
	})
})
