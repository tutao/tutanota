import o from "@tutao/otest"
import { HashingVectorizer } from "../../../../../../src/mail-app/workerUtils/spamClassification/HashingVectorizer"
import { arrayEquals, arrayHashUnsigned, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import fs from "node:fs"
import { readMailData } from "./SpamClassifierTest"
import { sha256Hash } from "@tutao/tutanota-crypto"

export const tokenize = (text: string): string[] =>
	text
		.toLowerCase()
		.split(/\s+/)
		.map((t) => t.replace(/[^a-z0-9-]/gi, "")) // remove punctuation
		.filter((t) => t.length > 1)

async function getAllTextFromDataset(datasetFilePath: string) {
	const file = await fs.promises.readFile(datasetFilePath)
	const entireFile = file.toString()
	return entireFile
}

import * as crypto from "node:crypto"

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

	o("verify hash collisions of different dimensions", async () => {
		const dimension = 7500
		const sha3NumberMapper = (inp) => {
			const shaHash = crypto.createHash("sha256").update(inp).digest("hex")
			const shaNum = BigInt(`0x${shaHash.slice(0, 32)}`)
			const modulus = shaNum % BigInt(dimension)
			return Number(modulus)
		}
		const sameIndexHasher = (_) => {
			return 1
		}

		const datasetFilePath = "/home/kib/spam_ham_dataset.csv"
		const { hamData, spamData } = await readMailData(datasetFilePath)
		const allText = hamData
			.concat(spamData)
			.map((r) => [r.subject, r.body].join(" "))
			.join(" ")

		const tokens = tokenize(allText)
		const uniqueTokens = new Set(tokens)
		console.log(`Number of unique tokens: ${uniqueTokens.size}. Un-unique: ${tokens.length}`)

		{
			const vectorizer = new HashingVectorizer(dimension, arrayHashUnsigned)
			const resultForCustomHash = vectorizer.verifyCollisions(tokens)
			console.log(
				`[Our hash]
			Total indexes used: ${resultForCustomHash.indexCountWithAtLeastOneToken}
			Average of collision: ${resultForCustomHash.collisionAverage}
			Standard deviation: ${resultForCustomHash.standard_deviation}`,
			)
		}

		{
			const sha3Vectorizer = new HashingVectorizer(dimension, sha3NumberMapper)
			const resultForSha3Hash = sha3Vectorizer.verifyCollisions(tokens)
			console.log(
				`[Sha3 hash]
			Total indexes used: ${resultForSha3Hash.indexCountWithAtLeastOneToken}
			Average of collision: ${resultForSha3Hash.collisionAverage}
			Standard deviation: ${resultForSha3Hash.standard_deviation}`,
			)
		}
		{
			const sameIndexVectorizer = new HashingVectorizer(dimension, sameIndexHasher)
			const resultForRandomHash = sameIndexVectorizer.verifyCollisions(tokens)
			console.log(
				`[Same hash]
			Total indexes used: ${resultForRandomHash.indexCountWithAtLeastOneToken}
			Average of collision: ${resultForRandomHash.collisionAverage}
			Standard deviation: ${resultForRandomHash.standard_deviation}`,
			)
		}
	})
})
