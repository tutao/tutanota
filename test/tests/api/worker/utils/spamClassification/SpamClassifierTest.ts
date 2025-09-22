import o from "@tutao/otest"
import fs from "node:fs"
import { parseCsv } from "../../../../../../src/common/misc/parsing/CsvParser"
import { SpamClassificationRow, SpamClassifier } from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { tokenize, tokenize as testTokenize } from "./HashingVectorizerTest"
import { OfflineStoragePersistence } from "../../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { object } from "testdouble"
import { arrayHashUnsigned, assertNotNull, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { htmlToText } from "../../../../../../src/common/api/worker/search/IndexUtils"

export const DATASET_FILE_PATH: string = "./tests/api/worker/utils/spamClassification/extracted_mails.csv"

export async function readMailData(filePath: string): Promise<{
	spamData: SpamClassificationRow[]
	hamData: SpamClassificationRow[]
}> {
	const file = await fs.promises.readFile(filePath)
	const csv = parseCsv(file.toString())

	let spamData: SpamClassificationRow[] = []
	let hamData: SpamClassificationRow[] = []
	for (const row of csv.rows.slice(1, csv.rows.length - 1)) {
		const subject = row[8]
		const body = htmlToText(row[10])
		const label = row[11]

		let isSpam = label === "spam" ? true : label === "ham" ? false : null
		isSpam = assertNotNull(isSpam, "Unknown label found: " + label)
		const targetData = isSpam ? spamData : hamData
		targetData.push({
			subject,
			body,
			isSpam,
		})
	}

	return { spamData, hamData }
}

function shuffleArray(
	data: SpamClassificationRow[],
	testRatio: number,
): {
	trainSet: SpamClassificationRow[]
	testSet: SpamClassificationRow[]
} {
	data = data.sort((a, b) => {
		return arrayHashUnsigned(stringToUtf8Uint8Array(a.subject + a.body)) - arrayHashUnsigned(stringToUtf8Uint8Array(b.subject + b.body))
	})

	const trainIndicesArray: SpamClassificationRow[] = []
	const testIndicesArray: SpamClassificationRow[] = []
	for (let i = 0; i < data.length; i++) {
		const iMod = i % 10
		if (iMod < testRatio * 10) {
			testIndicesArray.push(data[i])
		} else {
			trainIndicesArray.push(data[i])
		}
	}

	return { trainSet: trainIndicesArray, testSet: testIndicesArray }
}

// Initial training (cutoff by day or amount)
o.spec("SpamClassifier", () => {
	o("Test Classification on external mail data", async () => {
		o.timeout(20_000_000)

		const { spamData, hamData } = await readMailData(DATASET_FILE_PATH)
		console.log("Ham count:" + hamData.length)
		console.log("Spam count:" + spamData.length)

		const hamCount = 1000
		const spamCount = 500

		const hamSlice = hamData.slice(0, hamCount)
		const spamSlice = spamData.slice(0, spamCount)

		const mockOfflineStorage = object() as OfflineStoragePersistence
		mockOfflineStorage.tokenize = async (text) => {
			return testTokenize(text)
		}

		const dataSlice = hamSlice.concat(spamSlice)
		seededShuffle(dataSlice, 33)
		const trainTestSplit = dataSlice.length * 0.8
		const trainSet = dataSlice.slice(0, trainTestSplit)
		const testSet = dataSlice.slice(trainTestSplit)

		const classifier = new SpamClassifier(mockOfflineStorage, true, true, true)
		classifier.isEnabled = true

		let start = Date.now()
		await classifier.initialTraining(trainSet)
		//console.log("Vocab: " + classifier.dynamicTfVectorizer.vocabulary.length)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		console.log(`==> Result when testing with ${hamCount} Ham mails and ${spamCount} Spam-Mails`)
		await classifier.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)
	})

	o("Test fit and refit.", async () => {
		o.timeout(20_000_000)

		const { spamData, hamData } = await readMailData(DATASET_FILE_PATH)
		console.log("Ham count:" + hamData.length)
		console.log("Spam count:" + spamData.length)
		const hamSlice = hamData.slice(0, 200)
		const spamSlice = spamData.slice(0, 100)

		const mockOfflineStorage = object() as OfflineStoragePersistence
		mockOfflineStorage.tokenize = async (text) => {
			return testTokenize(text)
		}

		const dataSlice = hamSlice.concat(spamSlice)
		seededShuffle(dataSlice, 42)
		const trainTestSplit = dataSlice.length * 0.8
		const trainSet = dataSlice.slice(0, trainTestSplit)
		const testSet = dataSlice.slice(trainTestSplit)

		const trainSetHalf = trainSet.slice(0, trainSet.length / 2)
		const trainSetSecondHalf = trainSet.slice(trainSet.length / 2, trainSet.length)

		const classifierAll = new SpamClassifier(mockOfflineStorage, true)
		let start = Date.now()
		await classifierAll.initialTraining(trainSet)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		console.log(`==> Result when testing with all mails in one go.`)
		await classifierAll.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)

		mockOfflineStorage.getSpamClassificationTrainingDataAfterCutoff = async (cutoff) => {
			return trainSetSecondHalf
		}
		const classifierBySteps = new SpamClassifier(mockOfflineStorage, true)
		start = Date.now()
		await classifierBySteps.initialTraining(trainSetHalf)
		await classifierBySteps.updateModel(0)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		console.log(`==> Result when testing with mails in two steps (first step).`)
		await classifierBySteps.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)

		const classiOnlySecondHalf = new SpamClassifier(mockOfflineStorage, true)
		start = Date.now()
		await classiOnlySecondHalf.initialTraining(trainSetSecondHalf)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		console.log(`==> Result when testing with mails in two steps (second step).`)
		await classiOnlySecondHalf.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)
	})

	o("tokenize ai", async () => {
		const { spamData, hamData } = await readMailData(DATASET_FILE_PATH)
		const all = hamData.concat(spamData)

		const mockOfflineStorage = object() as OfflineStoragePersistence
		const classifier = new SpamClassifier(mockOfflineStorage, true)

		const vocab = buildVocab(
			all.map((m) => tokenize(m.body)),
			5,
		)
		const tokenized = Array.from(new Set(all.map((m) => tokenize(cleanEmailBody(m.body))).reduce((previous, current) => previous.concat(current), [])))
		const shrinked = Array.from(new Set(replaceWithPlaceholders(tokenized, vocab)))
		fs.writeFileSync("/tmp/unique-tokens", shrinked.sort().join("\n"))
		console.log(tokenized.length)
		console.log(shrinked.length)
		// const vectorizer = new HashingVectorizer()
		// const tensor = await vectorizer.transform(tokenized)
	})
})

export function cleanEmailBody(text: string): string {
	// 1. Lowercase
	let cleaned = text.toLowerCase()

	// 2. Remove common headers / separators
	cleaned = cleaned.replace(/^(from|to|subject|cc|bcc):.*$/gim, "")
	cleaned = cleaned.replace(/-{2,}.*original message.*-{2,}/gims, "")

	// 3. Replace emails / URLs
	cleaned = cleaned.replace(/\b\S+@\S+\b/g, " <EMAIL> ")
	cleaned = cleaned.replace(/https?:\/\/\S+|www\.\S+/g, " <URL> ")

	// 4. Replace numbers and long IDs
	cleaned = cleaned.replace(/\b\d{4,}\b/g, " <NUM> ") // long numbers
	cleaned = cleaned.replace(/\b[0-9a-f]{8,}\b/g, " <HEX> ") // hex-like strings

	// 5. Remove non-alphabetic chars except special tokens
	cleaned = cleaned.replace(/[^a-z\s<>]/g, " ")

	// 6. Normalize whitespace
	cleaned = cleaned.replace(/\s+/g, " ").trim()

	return cleaned
}

export function buildVocab(tokenizedDocs: string[][], minFreq: number = 5): Set<string> {
	const freqMap = new Map<string, number>()

	// Count frequencies
	for (const doc of tokenizedDocs) {
		for (const token of doc) {
			freqMap.set(token, (freqMap.get(token) ?? 0) + 1)
		}
	}

	// Filter by minFreq
	const vocab = new Set<string>()
	for (const [token, freq] of freqMap.entries()) {
		if (freq >= minFreq) {
			vocab.add(token)
		}
	}

	// Add special tokens
	vocab.add("<UNK>") // unknown token
	vocab.add("<PAD>") // padding (if needed)

	return vocab
}

export function replaceWithPlaceholders(tokens: string[], vocab: Set<string>, placeholder: string = "<UNK>"): string[] {
	return tokens.map((token) => (vocab.has(token) ? token : placeholder))
}

// For testing, we need deterministic shuffling which is not provided by tf.util.shuffle(dataSlice)
// Seeded Fisher-Yates shuffle
function seededShuffle<T>(array: T[], seed: number): void {
	const random = seededRandom(seed)
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1))
		;[array[i], array[j]] = [array[j], array[i]]
	}
}

function seededRandom(seed: number): () => number {
	const m = 0x80000000 // 2^31
	const a = 1103515245
	const c = 12345

	let state = seed

	return function (): number {
		state = (a * state + c) % m
		return state / m
	}
}
