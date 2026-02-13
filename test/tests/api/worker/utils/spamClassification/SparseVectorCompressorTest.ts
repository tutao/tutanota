import o from "@tutao/otest"
import { promiseMap } from "@tutao/tutanota-utils"
import { SparseVectorCompressor } from "../../../../../../src/common/api/common/utils/spamClassificationUtils/SparseVectorCompressor"
import { HashingVectorizer } from "../../../../../../src/mail-app/workerUtils/spamClassification/HashingVectorizer"
import { DATASET_FILE_PATH, readMailDataFromCSV } from "./SpamClassifierTest"
import { spamClassifierTokenizer, SpamMailProcessor } from "../../../../../../src/common/api/common/utils/spamClassificationUtils/SpamMailProcessor"

o.spec("SparseVectorCompressorTest", () => {
	o("sparse compress vectors", async () => {
		o.timeout(20_000)
		const spamHamData = await readMailDataFromCSV(DATASET_FILE_PATH)
		const spamData = spamHamData.spamData
		const hamData = spamHamData.hamData
		const dataSlice = spamData.concat(hamData)
		const tokenizedMails = await promiseMap(dataSlice, (mail) => spamClassifierTokenizer(new SpamMailProcessor().preprocessMail(mail)))
		const vectorizer = new HashingVectorizer()
		const compressor = new SparseVectorCompressor()
		const vectors = (await vectorizer.transform(tokenizedMails)).slice(0, 1)

		const BYTES_PER_NUMBER = 2
		console.log("Byte size of a number: ", BYTES_PER_NUMBER)
		const compressedVectors = vectors.map((vectorized) => compressor.compress(vectorized))
		const decompressedVectors = compressedVectors.map((compressed, i) => compressor.decompress(compressed, vectors[i].length))

		const decompressedVectorByteSizes: number[] = []
		const compressedVectorByteSizes: number[] = []
		for (let i = 0; i < compressedVectors.length; i++) {
			compressedVectorByteSizes.push(compressedVectors[i].values.length + compressedVectors[i].length)
			decompressedVectorByteSizes.push(decompressedVectors[i].length)
		}
		const averageCompressedVectorByteSize = compressedVectorByteSizes.reduce((a, b) => a + b, 0) / compressedVectorByteSizes.length
		const averageDecompressedVectorByteSize = decompressedVectorByteSizes.reduce((a, b) => a + b, 0) / decompressedVectorByteSizes.length
		console.log(`Average compressed vector byte size (Custom): ${averageCompressedVectorByteSize.toFixed(2)}B`)
		console.log(`Average decompressed vector byte size (Custom): ${averageDecompressedVectorByteSize.toFixed(2)}B`)

		o.check(decompressedVectors).deepEquals(vectors)
	})

	o("round trip with big data", async () => {
		const compressor = new SparseVectorCompressor()
		const vectorizer = new HashingVectorizer()

		const data = await vectorizer.vectorize(
			Array(1024 * 20)
				.fill(0)
				.map(() => createRandomString(5)),
		)
		const compressed = compressor.compress(data)
		const decompressed = Array.from(compressor.decompress(compressed, data.length))

		o(data).deepEquals(decompressed)
	})
	o("server classification data string compression round trip", async () => {
		const compressor = new SparseVectorCompressor()
		const vectorizer = new HashingVectorizer()
		const processor = new SpamMailProcessor()
		const serverClassificationData = "1,8:0,3:1,2"
		const oneHotEncodedServerClassificationData = processor.oneHotEncodeServerClassifiers(serverClassificationData)
		const compressed = compressor.compress(oneHotEncodedServerClassificationData)
		const decompressed = compressor.decompress(compressed, oneHotEncodedServerClassificationData.length)
		o(oneHotEncodedServerClassificationData).deepEquals(decompressed)
	})
	o("encode decode compressed vector length", () => {
		const compressor = new SparseVectorCompressor()
		const length = 656
		const encodedVecLength = compressor.encodeCompressedVectorLength(length)
		const decodedVecLength = compressor.decodeCompressedVectorLength(encodedVecLength)

		o(decodedVecLength).equals(length)
	})
})

export function createRandomString(length) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	let result = ""
	const randomArray = new Uint8Array(length)
	crypto.getRandomValues(randomArray)
	for (const number of randomArray) {
		result += chars[number % chars.length]
	}
	return result
}
