// import o from "@tutao/otest"
// import { TfIdfVectorizer } from "../../../../../src/mail-app/workerUtils/spamClassification/TfIdfVectorizer"
// import * as tf from "@tensorflow/tfjs"
//
// // to not get WebGL related warnings since the tests run on Node
// await tf.setBackend("cpu")
// await tf.ready()
//
// o.spec("TfIdfVectorizer", () => {
// 	const documents = [
// 		"Tuta is an encrypted email service that prioritizes privacy and open-source principles.",
// 		"With Tuta, your emails and contacts are stored securely using end-to-end encryption.",
// 		"With Tuta, you can create a completely encrypted zero-knowledge calendar, try now!",
// 		"Unlike traditional email providers, Tuta never collects user data or scans your messages.",
// 		"Millions of people choose Tuta to protect their personal and professional communication.",
// 	]
//
// 	const docIds = ["doc1", "doc2", "doc3", "doc4", "doc5"]
//
// 	o("constructor throws if docIds and documents mismatch", () => {
// 		o(() => new TfIdfVectorizer(["doc1"], ["text1", "text2"])).throws(Error)
// 	})
//
// 	o("tokenize filters single character tokens", () => {
// 		const vectorizer = new TfIdfVectorizer(docIds, documents)
// 		const tokens = vectorizer.tokenize("a b c d do data encryption")
// 		o(tokens).deepEquals(["do", "data", "encryption"])
// 	})
//
// 	o("builds correct vocabulary with filtered tokens", () => {
// 		const vectorizer = new TfIdfVectorizer(docIds, documents)
// 		o(vectorizer.vocabulary.includes("tuta")).equals(true)
// 		o(vectorizer.vocabulary.includes("email")).equals(true)
// 		o(vectorizer.vocabulary.includes("a")).equals(false)
// 	})
//
// 	o("calculates correct IDF values", () => {
// 		const vectorizer = new TfIdfVectorizer(docIds, documents)
// 		const termToIndex = vectorizer.termToIndex
// 		const inverseDocumentFrequencies = vectorizer.inverseDocumentFrequencies
//
// 		const index = termToIndex.get("encryption")!
// 		const idf = inverseDocumentFrequencies[index]
// 		o(idf > 1).equals(true)
// 	})
//
// 	o("vectorize returns correct TF-IDF vector", () => {
// 		const vectorizer = new TfIdfVectorizer(docIds, documents)
// 		const vector = vectorizer.vectorize("email encryption")
// 		o(vector.length).equals(vectorizer.vocabulary.length)
//
// 		const emailIndex = vectorizer.termToIndex.get("email")!
// 		const encryptionIndex = vectorizer.termToIndex.get("encryption")!
// 		o(vector[emailIndex] > 0).equals(true)
// 		o(vector[encryptionIndex] > 0).equals(true)
// 	})
//
// 	o("transform returns correct tensor shape", () => {
// 		const vectorizer = new TfIdfVectorizer(docIds, documents)
// 		const tensor = vectorizer.transform(["privacy encryption", "user data"])
//
// 		o(tensor.shape[0]).equals(2)
// 		o(tensor.shape[1]).equals(vectorizer.vocabulary.length)
//
// 		const values = tensor.dataSync()
// 		const allZeros = Array.from(values).every((v) => v === 0)
// 		o(allZeros).equals(false)
// 	})
//
// 	o("handles unknown words gracefully", () => {
// 		const vectorizer = new TfIdfVectorizer(docIds, documents)
// 		const vector = vectorizer.vectorize("xylophone dragon moonbeam")
// 		const nonZero = vector.some((val) => val > 0)
// 		o(nonZero).equals(false)
// 	})
// })
