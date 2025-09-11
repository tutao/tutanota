import o from "@tutao/otest"
import fs from "node:fs"
import { join } from "node:path"
import { parseCsv } from "../../../../../../src/common/misc/parsing/CsvParser"
import { SpamClassificationRow, SpamClassifier } from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { tokenize as testTokenize } from "./HashingVectorizerTest"
import { OfflineStoragePersistence } from "../../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { object } from "testdouble"

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

	// let result = new Array(data.length).fill(null)
	// for (let i = 0; i < data.length; i++) {
	// 	const hash = arrayHashUnsigned(stringToUtf8Uint8Array(data[i].subject))
	// 	const index = hash % result.length
	// 	result[index] = data[i]
	// }
	// result = result.filter((d) => d != null)

	// const testSize = Math.floor(result.length * testRatio)
	// const trainSize = result.length - testSize
	//
	// const trainIndicesArray = Array.from(result.slice(0, trainSize))
	// const testIndicesArray = Array.from(result.slice(trainSize))

	return { trainSet: trainIndicesArray, testSet: testIndicesArray }
}

// TODO: remove randomness from tensorflow
// Change dimension
// Change tensorflow inner layers
// Initial training (cutoff by day or amount)
o.spec("SpamClassifier", () => {
	o("Test Classification on external mail data", async () => {
		o.timeout(200000)

		const externalSpamPath = "/home/das/Documents/csvspam/"
		const externalHamPath = "/home/das/Documents/csvham/"

		const spamData = await readMailData(externalSpamPath, true)
		const hamData = await readMailData(externalHamPath, false)
		const mockOfflineStorage = object() as OfflineStoragePersistence
		mockOfflineStorage.tokenize = async (text) => {
			return testTokenize(text)
		}

		const data = spamData.concat(hamData)
		const { trainSet, testSet } = shuffleArray(data, 0.2)

		const classifier = new SpamClassifier(mockOfflineStorage)

		let start = Date.now()
		await classifier.initialTraining(trainSet)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		await classifier.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)
	})
})
