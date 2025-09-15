import o from "@tutao/otest"
import fs from "node:fs"
import { join } from "node:path"
import { parseCsv } from "../../../../../../src/common/misc/parsing/CsvParser"
import { SpamClassificationRow, SpamClassifier } from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { tokenize as testTokenize } from "./HashingVectorizerTest"
import { OfflineStoragePersistence } from "../../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { object } from "testdouble"
import { arrayEquals, arrayHashUnsigned, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"

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

async function readMailData(externalSpamPath: string, isSpam: boolean): Promise<SpamClassificationRow[]> {
	const files = await enumerateDir(externalSpamPath)
	let data: SpamClassificationRow[] = []
	for (const filePath of files) {
		const file = await fs.promises.readFile(filePath)
		const csv = parseCsv(file.toString())
		const [subject, body] = csv.rows[1]
		data.push({
			rowid: "0",
			subject,
			body,
			isSpam,
		})
	}

	return data
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

// TODO: remove randomness from tensorflow
// Change dimension
// Change tensorflow inner layers
async function parseCustomDataset(customDataset: string) {
	const file = await fs.promises.readFile(customDataset)
	const csv = parseCsv(file.toString())
	let spamData: any[] = []
	let hamData: any[] = []
	for (let i = 1; i < csv.rows.length; i++) {
		const isSpam = csv.rows[i][0] === "spam"
		const subject = ""
		const body = csv.rows[i][1]
		if (isSpam) {
			spamData.push({
				rowid: "0",
				subject,
				body,
				isSpam,
			})
		} else {
			hamData.push({
				rowid: "0",
				subject,
				body,
				isSpam,
			})
		}
	}
	return { hamData, spamData }
}

// Initial training (cutoff by day or amount)
o.spec("SpamClassifier", () => {
	o("Test Classification on external mail data", async () => {
		o.timeout(20_000_000)

		const externalSpamPath = "csvspam/"
		const externalHamPath = "csvham/"

		//const spamData = await readMailData(externalSpamPath, true)
		//const hamData = await readMailData(externalHamPath, false)

		const customDatasetCsv = "spam_dataset.csv"
		const { hamData, spamData } = await parseCustomDataset(customDatasetCsv)

		console.log("Ham count:" + hamData.length)
		console.log("Spam count:" + spamData.length)
		for (let hamCount = 1000; hamCount <= 1000; hamCount += 400) {
			const hamSlice = hamData.slice(0, hamCount)
			for (let spamCount = 500; spamCount <= 500; spamCount += 100) {
				const spamSlice = spamData.slice(0, spamCount)

				const mockOfflineStorage = object() as OfflineStoragePersistence
				mockOfflineStorage.tokenize = async (text) => {
					return testTokenize(text)
				}

				const data = hamSlice.concat(spamSlice)
				//const { trainSet, testSet } = shuffleArray(data, 0.2)
				const { trainSet } = shuffleArray(data, 0.2)
				const { testSet } = shuffleArray(spamData.concat(hamData), 0.4)

				const classifier = new SpamClassifier(mockOfflineStorage)

				let start = Date.now()
				await classifier.initialTraining(trainSet)
				console.log(`trained in ${Date.now() - start}ms`)

				start = Date.now()
				console.log(` Result when testing with ${hamCount} Ham mails and ${spamCount} Spam-Mails`)
				await classifier.test(testSet)
				console.log(`tested in ${Date.now() - start}ms`)
			}
		}
	})

	o("Test fit and refit.", async () => {
		o.timeout(20_000_000)

		const customDatasetCsv = "spam_dataset.csv"
		const { hamData, spamData } = await parseCustomDataset(customDatasetCsv)

		console.log("Ham count:" + hamData.length)
		console.log("Spam count:" + spamData.length)
		const hamSlice = hamData.slice(0, 500)
		const spamSlice = spamData.slice(0, 500)

		const mockOfflineStorage = object() as OfflineStoragePersistence
		mockOfflineStorage.tokenize = async (text) => {
			return testTokenize(text)
		}

		const data = hamSlice.concat(spamSlice)
		const { trainSet, testSet } = shuffleArray(data, 0.2)
		const trainSetHalf = trainSet.slice(0, trainSet.length / 2)
		const trainSetSecondHalf = trainSet.slice(trainSet.length / 2, trainSet.length)

		const classifierAll = new SpamClassifier(mockOfflineStorage)
		let start = Date.now()
		await classifierAll.initialTraining(trainSet)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		console.log(` Result when testing with 0-200 mails in one go.`)
		await classifierAll.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)
		let weightsAll = await classifierAll.getWeightData()
		console.log("wei?", weightsAll)

		mockOfflineStorage.getSpamClassificationTrainingDataAfterCutoff = async (cutoff) => {
			return trainSetSecondHalf
		}
		const classifierBySteps = new SpamClassifier(mockOfflineStorage)
		start = Date.now()
		await classifierBySteps.initialTraining(trainSetHalf)
		await classifierBySteps.updateModel(0)
		let weights = await classifierBySteps.getWeightData()
		console.log("wei?", weights)
		console.log(`trained in ${Date.now() - start}ms`)
		console.log("THE #### ARE EQUAL?", arrayEquals(weights, weightsAll))

		start = Date.now()
		console.log(` Result when testing with 0-200 mails in two steps.`)
		await classifierBySteps.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)

		const classiOnlySecondHalf = new SpamClassifier(mockOfflineStorage)
		start = Date.now()
		await classiOnlySecondHalf.initialTraining(trainSetSecondHalf)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		console.log(` Result when testing with 100-200 mails.`)
		await classiOnlySecondHalf.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)
		let weightSecond = await classiOnlySecondHalf.getWeightData()
		console.log("wei?", weightSecond)
		console.log("THE #### ARE EQUAL?", arrayEquals(weights, weightSecond))
	})
})
