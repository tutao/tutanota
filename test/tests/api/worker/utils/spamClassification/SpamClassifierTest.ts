import o from "@tutao/otest"
import fs from "node:fs"
import { join } from "node:path"
import { parseCsv } from "../../../../../../src/common/misc/parsing/CsvParser"
import { SpamClassificationRow, SpamClassifier } from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { tokenize as testTokenize } from "./HashingVectorizerTest"
import { OfflineStoragePersistence } from "../../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { object } from "testdouble"
import { arrayHashUnsigned, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import * as tf from "@tensorflow/tfjs"

async function enumerateDir(rootDir, files: string[] = []): Promise<string[]> {
	const entries = await fs.promises.readdir(rootDir, { withFileTypes: true })

	for (const ent of entries) {
		const full = join(rootDir, ent.name) as string
		if (ent.isFile()) {
			files.push(full)
		}
	}
	return files
}

async function readMailData(filePath: string): Promise<{
	spamData: SpamClassificationRow[]
	hamData: SpamClassificationRow[]
}> {
	const file = await fs.promises.readFile(filePath)
	const csv = parseCsv(file.toString())

	let spamData: SpamClassificationRow[] = []
	let hamData: SpamClassificationRow[] = []
	for (const row of csv.rows.slice(1, csv.rows.length - 1)) {
		let isSpam: boolean
		if (row[1] === "ham") isSpam = false
		else if (row[1] === "spam") isSpam = true
		else {
			throw new Error("Incorrect label: " + row[1])
		}

		const lines = row[2].split("\n")
		const subject: string = lines[0].split(":").splice(1).join("")
		const body: string = lines.slice(1).join("\n")
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

		const { spamData, hamData } = await readMailData("/home/jhm/Downloads/spam-ham/spam_ham_dataset.csv")
		console.log("Ham count:" + hamData.length)
		console.log("Spam count:" + spamData.length)

		const hamCount = 4000
		const spamCount = 2000

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

		const classifier = new SpamClassifier(mockOfflineStorage)

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

		const { spamData, hamData } = await readMailData("/home/jhm/Downloads/spam-ham/spam_ham_dataset.csv")
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

		const classifierAll = new SpamClassifier(mockOfflineStorage)
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
		const classifierBySteps = new SpamClassifier(mockOfflineStorage)
		start = Date.now()
		await classifierBySteps.initialTraining(trainSetHalf)
		await classifierBySteps.updateModel(0)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		console.log(`==> Result when testing with mails in two steps (first step).`)
		await classifierBySteps.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)

		const classiOnlySecondHalf = new SpamClassifier(mockOfflineStorage)
		start = Date.now()
		await classiOnlySecondHalf.initialTraining(trainSetSecondHalf)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		console.log(`==> Result when testing with mails in two steps (second step).`)
		await classiOnlySecondHalf.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)
	})
})
