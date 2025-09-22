import o from "@tutao/otest"
import { HashingVectorizer } from "../../../../../../src/mail-app/workerUtils/spamClassification/HashingVectorizer"
import { arrayEquals } from "@tutao/tutanota-utils"

export const tokenize = (text: string): string[] =>
	text
		.toLowerCase()
		.split(/\s+/)
		.map((t) => t.replace(/[^a-z0-9]/gi, "")) // remove punctuation
		.filter((t) => t.length > 1)

o.spec("HashingVectorizer", () => {
	const rawDocuments = [
		"Tuta is an encrypted email service that prioritizes privacy and open-source principles.",
		"With Tuta, your emails and contacts are stored securely using end-to-end encryption.",
		"With Tuta, you can create a completely encrypted zero-knowledge calendar, try now!",
		"Unlike traditional email providers, Tuta never collects user data or scans your messages.",
		"Millions of people choose Tuta to protect their personal and professional communication.",
	]

	const tokenizedDocuments = rawDocuments.map(tokenize)

	o("vectorize outputs normalized vector", async () => {
		const vectorizer = new HashingVectorizer()
		const tokens = ["email", "email", "encryption"]
		const vector = await vectorizer.vectorize(tokens)

		const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
		o(Math.abs(norm - 1) < 0.00001).equals(true)
	})

	o("vectorize creates same vector for same tokens", async () => {
		const vectorizer = new HashingVectorizer()
		const tokens = ["privacy", "email", "data"]
		const v1 = await vectorizer.vectorize(tokens)
		const v2 = await vectorizer.vectorize(tokens)
		o(arrayEquals(v1, v2)).equals(true)
	})

	o("vectorize handles empty input", async () => {
		const vectorizer = new HashingVectorizer()
		const vector = await vectorizer.vectorize([])
		o(vector.every((v) => v === 0)).equals(true)
	})

	o("transform returns correct shape", async () => {
		const vectorizer = new HashingVectorizer()
		const tensor = await vectorizer.transform(tokenizedDocuments)

		o(tensor.length).equals(tokenizedDocuments.length)
		for (const vec of tensor) {
			o(vec.length).equals(vectorizer.dimension)
		}
	})
})
