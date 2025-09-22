import o from "@tutao/otest"
import fs from "node:fs"
import { parseCsv } from "../../../../../../src/common/misc/parsing/CsvParser"
import { SpamClassificationRow, SpamClassifier } from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { tokenize as testTokenize } from "./HashingVectorizerTest"
import { OfflineStoragePersistence } from "../../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { object } from "testdouble"
import { assertNotNull } from "@tutao/tutanota-utils"
import * as tf from "@tensorflow/tfjs"
import { HashingVectorizer } from "../../../../../../src/mail-app/workerUtils/spamClassification/HashingVectorizer"
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

// Initial training (cutoff by day or amount)
o.spec("SpamClassifier", () => {
	// const vectorizer = new DynamicTfVectorizer(new Set())
	const vectorizer = new HashingVectorizer()

	o("Test Classification on external mail data", async () => {
		o.timeout(20_000_000)

		const { spamData, hamData } = await readMailData(DATASET_FILE_PATH)
		console.log("Ham count:" + hamData.length)
		console.log("Spam count:" + spamData.length)

		const hamCount = 4000
		const spamCount = 1000

		const hamSlice = hamData.slice(0, hamCount)
		const spamSlice = spamData.slice(0, spamCount)

		const mockOfflineStorage = object() as OfflineStoragePersistence
		mockOfflineStorage.tokenize = async (text) => {
			return testTokenize(text)
		}

		const dataSlice = hamSlice.concat(spamSlice)
		tf.util.shuffle(dataSlice)
		const trainTestSplit = dataSlice.length * 0.8
		const trainSet = dataSlice.slice(0, trainTestSplit)
		const testSet = dataSlice.slice(trainTestSplit)

		// const { trainSet: hamTrainSet, testSet: hamTestSet } = shuffleArray(hamSlice, 0.2)
		// const { trainSet: spamTrainSet, testSet: spamTestSet } = shuffleArray(spamSlice, 0.2)
		//
		// let trainSet = hamTrainSet.concat(spamTrainSet)
		// let testSet = hamTestSet.concat(spamTestSet)
		// const { trainSet } = shuffleArray(data, 0.2)
		// const { testSet } = shuffleArray(spamData.concat(hamData), 0.4)

		const classifier = new SpamClassifier(mockOfflineStorage, vectorizer)

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
		tf.util.shuffle(dataSlice)
		const trainTestSplit = dataSlice.length * 0.8
		const trainSet = dataSlice.slice(0, trainTestSplit)
		const testSet = dataSlice.slice(trainTestSplit)

		const trainSetHalf = trainSet.slice(0, trainSet.length / 2)
		const trainSetSecondHalf = trainSet.slice(trainSet.length / 2, trainSet.length)

		const classifierAll = new SpamClassifier(mockOfflineStorage, vectorizer)
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
		const classifierBySteps = new SpamClassifier(mockOfflineStorage, vectorizer)
		start = Date.now()
		await classifierBySteps.initialTraining(trainSetHalf)
		await classifierBySteps.updateModel(0)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		console.log(`==> Result when testing with mails in two steps (first step).`)
		await classifierBySteps.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)

		const classiOnlySecondHalf = new SpamClassifier(mockOfflineStorage, vectorizer)
		start = Date.now()
		await classiOnlySecondHalf.initialTraining(trainSetSecondHalf)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		console.log(`==> Result when testing with mails in two steps (second step).`)
		await classiOnlySecondHalf.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)
	})
})
