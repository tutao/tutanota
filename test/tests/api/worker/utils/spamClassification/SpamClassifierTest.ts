import o from "@tutao/otest"
import fs from "node:fs"
import { parseCsv } from "../../../../../../src/common/misc/parsing/CsvParser"
import { SpamClassifier, SpamTrainMailDatum } from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { tokenize as testTokenize } from "./HashingVectorizerTest"
import { OfflineStoragePersistence } from "../../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { object } from "testdouble"
import { assertNotNull } from "@tutao/tutanota-utils"
import * as tf from "@tensorflow/tfjs"
import { SpamClassificationInitializer } from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassificationInitializer"

export const DATASET_FILE_PATH: string = "./tests/api/worker/utils/spamClassification/spam_classification_test_mails.csv"

export async function readMailDataFromCSV(filePath: string): Promise<{
	spamData: SpamTrainMailDatum[]
	hamData: SpamTrainMailDatum[]
}> {
	const file = await fs.promises.readFile(filePath)
	const csv = parseCsv(file.toString())

	let spamData: SpamTrainMailDatum[] = []
	let hamData: SpamTrainMailDatum[] = []
	for (const row of csv.rows.slice(1, csv.rows.length - 1)) {
		const subject = row[8]
		const body = row[10]
		const label = row[11]

		let isSpam = label === "spam" ? true : label === "ham" ? false : null
		isSpam = assertNotNull(isSpam, "Unknown label detected: " + label)
		const targetData = isSpam ? spamData : hamData
		targetData.push({
			mailId: ["mailListId", "mailElementId"],
			subject,
			body,
			isSpam,
			importance: 1,
		} as SpamTrainMailDatum)
	}

	return { spamData, hamData }
}

// Initial training (cutoff by day or amount)
o.spec("SpamClassifier", () => {
	o("Test initial fit", async () => {
		o.timeout(20_000_000)

		const profileInfo = await tf.profile(async () => {
			const { spamData, hamData } = await readMailDataFromCSV(DATASET_FILE_PATH)
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
			const mockSpamClassificationInitializer = object() as SpamClassificationInitializer
			mockSpamClassificationInitializer.init = async () => {
				return dataSlice
			}

			seededShuffle(dataSlice, 42)
			const trainTestSplit = dataSlice.length * 0.8
			const trainSet = dataSlice.slice(0, trainTestSplit)
			const testSet = dataSlice.slice(trainTestSplit)

			const classifier = new SpamClassifier(mockOfflineStorage, mockSpamClassificationInitializer)
			classifier.isEnabled = true

			let start = Date.now()
			await classifier.initialTraining(trainSet)
			console.log(`trained in ${Date.now() - start}ms`)

			start = Date.now()
			console.log(`==> Result when testing with ${hamCount} Ham mails and ${spamCount} Spam-Mails`)
			await classifier.test(testSet)
			console.log(`tested in ${Date.now() - start}ms`)
		})

		const kernelNames = profileInfo.kernelNames
		console.log(kernelNames)
	})

	o("Test initial fit and refit.", async () => {
		o.timeout(20_000_000)

		const { spamData, hamData } = await readMailDataFromCSV(DATASET_FILE_PATH)
		console.log("Ham count:" + hamData.length)
		console.log("Spam count:" + spamData.length)
		const hamSlice = hamData.slice(0, 1000)
		const spamSlice = spamData.slice(0, 500)

		const mockOfflineStorage = object() as OfflineStoragePersistence
		mockOfflineStorage.tokenize = async (text) => {
			return testTokenize(text)
		}

		const dataSlice = hamSlice.concat(spamSlice)
		const mockSpamClassificationInitializer = object() as SpamClassificationInitializer
		mockSpamClassificationInitializer.init = async () => {
			return dataSlice
		}

		seededShuffle(dataSlice, 42)
		const trainTestSplit = dataSlice.length * 0.8
		const trainSet = dataSlice.slice(0, trainTestSplit)
		const testSet = dataSlice.slice(trainTestSplit)

		const trainSetHalf = trainSet.slice(0, trainSet.length / 2)

		const mockSpamClassificationInitializerTrainSetHalf = object() as SpamClassificationInitializer
		mockSpamClassificationInitializer.init = async () => {
			return trainSetHalf
		}

		const trainSetSecondHalf = trainSet.slice(trainSet.length / 2, trainSet.length)

		const mockSpamClassificationInitializerTrainSetSecondHalf = object() as SpamClassificationInitializer
		mockSpamClassificationInitializer.init = async () => {
			return trainSetSecondHalf
		}

		const classifierAll = new SpamClassifier(mockOfflineStorage, mockSpamClassificationInitializer)
		classifierAll.isEnabled = true

		let start = Date.now()
		await classifierAll.initialTraining(trainSet)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		console.log(`==> Result when testing with all mails in one go.`)
		await classifierAll.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)

		mockOfflineStorage.getCertainSpamClassificationTrainingDataAfterCutoff = async (_cutoff) => {
			return trainSetSecondHalf
		}
		const classifierBySteps = new SpamClassifier(mockOfflineStorage, mockSpamClassificationInitializerTrainSetHalf)
		classifierBySteps.isEnabled = true

		start = Date.now()
		await classifierBySteps.initialTraining(trainSetHalf)
		await classifierBySteps.updateModelFromCutoff(0)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		console.log(`==> Result when testing with mails in two steps (first step).`)
		await classifierBySteps.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)

		const classifierOnlySecondHalf = new SpamClassifier(mockOfflineStorage, mockSpamClassificationInitializerTrainSetSecondHalf)
		classifierOnlySecondHalf.isEnabled = true

		start = Date.now()
		await classifierOnlySecondHalf.initialTraining(trainSetSecondHalf)
		console.log(`trained in ${Date.now() - start}ms`)

		start = Date.now()
		console.log(`==> Result when testing with mails in two steps (second step).`)
		await classifierOnlySecondHalf.test(testSet)
		console.log(`tested in ${Date.now() - start}ms`)
	})

	o("preprocessMail outputs expected tokens for mail content", async () => {
		const classifier = new SpamClassifier(null, object())
		const mail = {
			subject: `Sample Tokens and values`,
			// prettier-ignore
			body: `Hello, these are my MAC Address
				FB-94-77-45-96-74
				91-58-81-D5-55-7C
				B4-09-49-2A-DE-D4
				along with my ISBNs
				718385414-0
				733065633-X
				632756390-2
				SSN
				227-78-2283
				134-34-1253
				591-61-6459
				SHAs
				585eab9b3a5e4430e08f5096d636d0d475a8c69dae21a61c6f1b26c4bd8dd8c1
				7233d153f2e0725d3d212d1f27f30258fafd72b286d07b3b1d94e7e3c35dce67
				769f65bf44557df44fc5f99c014cbe98894107c9d7be0801f37c55b3776c3990
				Phone Numbers
				(341) 2027690
				+385 958 638 7625
				430-284-9438
				VIN (Vehicle identification number)
				3FADP4AJ3BM438397
				WAULT64B82N564937
				GUIDs
				781a9631-0716-4f9c-bb36-25c3364b754b
				325783d4-a64e-453b-85e6-ed4b2cd4c9bf
				Hex Colors
				#2016c1
				#c090a4
				#c855f5
				#000000
				IPV4
				91.17.182.120
				47.232.175.0
				171.90.3.93
				On Date:
				01-12-2023
				1-12-2023
				Not Date
				2023/12-1
				URL
				https://tuta.com
				https://subdomain.microsoft.com/outlook/test
				NOT URL
				https://tuta/com
				MAIL
				test@example.com
				plus+addressing@example.com
				Credit Card
				5002355116026522
				4041 3751 9030 3866
				Not Credit Card
				1234 1234
				Bit Coin Address
				159S1vV25PAxMiCVaErjPznbWB8YBvANAi
				1NJmLtKTyHyqdKo6epyF9ecMyuH1xFWjEt
				Not BTC
				5213nYwhhGw2qpNijzfnKcbCG4z3hnrVA
				1OUm2eZK2ETeAo8v95WhZioQDy32YSerkD
				Special Characters
				!
				@
				Not Special Characters
				]
				Number Sequences:
				26098375
				IBAN: DE91 1002 0370 0320 2239 82
				Not Number Sequences
				SHLT116
				gb_67ca4b
				Other values found in mails
				❓
				5.090 € 37 m²1 Zi 100%
				Fax (089) 13 33 87 88
				August 12, 2025
				5:20 PM - 5:25 PM
				<this gets removed by HTML as it should use &lt; to represent the character>
				🐟
				and all text on other lines it seems.
				<div>
<a rel="noopener noreferrer" target="_blank" href="https://www.somewebsite.de/?key=c2f395513421312029680" style="background-color:#055063;border-radius:3px;color:#ffffff;display:inline-block;font-size: 14px; font-family: sans-serif;font-weight:bold;line-height:36px;height:36px;text-align:center;text-decoration:none;width:157px;-webkit-text-size-adjust:none; margin-bottom:20px">Button Text</a>
</div>
<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%"><tbody><tr><td align="center"><a href="https://mail.abc-web.de/optiext/optiextension.dll?ID=someid" rel="noopener noreferrer" target="_blank" style="text-decoration:none"><img id="OWATemporaryImageDivContainer1" src="https://mail.some-domain.de/images/SMC/grafik/image.png" alt="" border="0" class="" width="100%" style="max-width:100%;display:block;width:100%"></a></td></tr></tbody></table>
this text is shown
`,
		} as SpamTrainMailDatum
		const preprocessedMail = classifier.preprocessMail(mail)
		const expectedOutput = `Sample Tokens and values Hello <SPECIAL-CHAR>  these are my MAC Address
				FB <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
				 <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER> -D5 <SPECIAL-CHAR>  <NUMBER> -7C
				B4 <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER> -2A-DE-D4
				along with my ISBNs
				 <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
				 <NUMBER> -X
				 <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
				SSN
				 <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
				 <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
				 <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
				SHAs
				585eab9b3a5e4430e08f5096d636d0d475a8c69dae21a61c6f1b26c4bd8dd8c1
				7233d153f2e0725d3d212d1f27f30258fafd72b286d07b3b1d94e7e3c35dce67
				769f65bf44557df44fc5f99c014cbe98894107c9d7be0801f37c55b3776c3990
				Phone Numbers
				 <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>   <NUMBER>
				 <SPECIAL-CHAR>  <NUMBER>   <NUMBER>   <NUMBER>   <NUMBER>
				 <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
				VIN  <SPECIAL-CHAR> Vehicle identification number <SPECIAL-CHAR>
				3FADP4AJ3BM438397
				WAULT64B82N564937
				GUIDs
				781a9631 <SPECIAL-CHAR>  <NUMBER> -4f9c-bb36-25c3364b754b
				325783d4-a64e-453b-85e6-ed4b2cd4c9bf
				Hex Colors
				 <SPECIAL-CHAR> 2016c1
				 <SPECIAL-CHAR> c090a4
				 <SPECIAL-CHAR> c855f5
				 <SPECIAL-CHAR>  <NUMBER>
				IPV4
				 <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
				 <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
				 <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
				On Date <SPECIAL-CHAR>
				 <DATE>
				 <DATE>
				Not Date
				 <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
				URL
				 <URL-tuta.com>
				 <URL-subdomain.microsoft.com>
				NOT URL
				 <URL-tuta>
				MAIL
				 <EMAIL>
				 <EMAIL>
				Credit Card
				 <CREDIT-CARD>
				 <CREDIT-CARD>
				Not Credit Card
				 <NUMBER>   <NUMBER>
				Bit Coin Address
				 <BITCOIN>
				 <BITCOIN>
				Not BTC
				5213nYwhhGw2qpNijzfnKcbCG4z3hnrVA
				1OUm2eZK2ETeAo8v95WhZioQDy32YSerkD
				Special Characters
				 <SPECIAL-CHAR>
				 <SPECIAL-CHAR>
				Not Special Characters
				]
				Number Sequences <SPECIAL-CHAR>
				 <NUMBER>
				IBAN <SPECIAL-CHAR>  DE91  <CREDIT-CARD>  <NUMBER>
				Not Number Sequences
				SHLT116
				gb <SPECIAL-CHAR> 67ca4b
				Other values found in mails
				❓
				 <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  €  <NUMBER>  m² <NUMBER>  Zi  <NUMBER>  <SPECIAL-CHAR>
				Fax  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>   <NUMBER>   <NUMBER>   <NUMBER>   <NUMBER>
				August  <NUMBER>  <SPECIAL-CHAR>   <NUMBER>
				 <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  PM  <SPECIAL-CHAR>   <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  PM

				🐟
				and all text on other lines it seems <SPECIAL-CHAR>

 Button Text


this text is shown`
		o.check(preprocessedMail).equals(expectedOutput)
	})
})

o.spec("Training and ReFitting the model", () => {
	const mockOfflineStorage = object() as OfflineStoragePersistence
	let classifier = object() as SpamClassifier
	let dataSlice
	o.beforeEach(() => {
		mockOfflineStorage.tokenize = async (text) => {
			return testTokenize(text)
		}

		const mockSpamClassificationInitializer = object() as SpamClassificationInitializer
		mockSpamClassificationInitializer.init = async () => {
			return dataSlice
		}
		classifier = new SpamClassifier(mockOfflineStorage, mockSpamClassificationInitializer)
		classifier.isEnabled = true
	})

	o("time to refit", async () => {
		o.timeout(20_000_000)
		const { spamData, hamData } = await readMailDataFromCSV(DATASET_FILE_PATH)
		const hamSlice = hamData.slice(0, 1000)
		const spamSlice = spamData.slice(0, 400)
		dataSlice = hamSlice.concat(spamSlice)
		seededShuffle(dataSlice, 42)

		const start = performance.now()
		await classifier.initialTraining(dataSlice)
		const initialTrainingDuration = performance.now() - start
		console.log(`initial training time ${initialTrainingDuration}ms`)

		for (let i = 0; i < 20; i++) {
			const nowSpam = [hamSlice[0]]
			nowSpam.map((formerHam) => (formerHam.isSpam = true))
			const retrainingStart = performance.now()
			await classifier.updateModel(nowSpam)
			const retrainingDuration = performance.now() - retrainingStart
			console.log(`retraining time ${retrainingDuration}ms`)
		}
	})

	o("refit after moving a false negative classification multiple times", async () => {
		o.timeout(20_000_000)
		const { spamData, hamData } = await readMailDataFromCSV(DATASET_FILE_PATH)
		const hamSlice = hamData.slice(0, 100)
		const spamSlice = spamData.slice(0, 10)
		dataSlice = hamSlice.concat(spamSlice)
		// seededShuffle(dataSlice, 42)

		await classifier.initialTraining(dataSlice)
		const falseNegatives = spamData
			.slice(10)
			.filter(async (mailDatum) => mailDatum.isSpam !== (await classifier.predict(mailDatum)))
			.sort()
			.slice(0, 10)

		let retrainingNeeded = new Array<number>(falseNegatives.length).fill(0)
		for (let i = 0; i < falseNegatives.length; i++) {
			const sample = falseNegatives[i]
			const copiedClassifier = await classifier.cloneClassifier()

			let retrainCount = 0
			let predictedSpam = false
			while (!predictedSpam && retrainCount++ <= 3) {
				// await copiedClassifier.updateModel([{ ...sample, isSpam: false }])

				/*
importance: 2
				[
  3, 2, 1, 3, 1,
  1, 3, 2, 1, 5
] = 22
importance: 3
[
  2, 5, 1, 2, 1,
  1, 1, 2, 1, 2
] = 18

importance: 4
[
  1, 1, 1, 2, 5,
  1, 1, 1, 1, 5
] = 19
Retraining finished. Took: 477ms
Retraining finished. Took: 1259ms
predicted new mail to be with probability 0.46 spam
Retraining finished. Took: 560ms
Retraining finished. Took: 1273ms

importance: 8
Retraining finished. Took: 486ms
Retraining finished. Took: 2289ms
predicted new mail to be with probability 0.82 spam
Retraining finished. Took: 580ms
Retraining finished. Took: 2356ms
predicted new mail to be with probability 1.00 spam
Retraining finished. Took: 556ms
Retraining finished. Took: 2357ms
predicted new mail to be with probability 0.52 spam
[
  1, 1, 1, 1, 1,
  1, 1, 1, 1, 1
]


				 */
				await copiedClassifier.updateModel([{ ...sample, isSpam: true, importance: 1 }])
				predictedSpam = await copiedClassifier.predict(sample)
			}
			retrainingNeeded[i] = retrainCount
		}

		console.log(retrainingNeeded)
		const maxRetrain = Math.max(...retrainingNeeded)
		o.check(retrainingNeeded.length >= 10).equals(true)
		o.check(maxRetrain < 3).equals(true)
	})

	o("refit after moving a false positive classification multiple times", async () => {
		o.timeout(20_000_000)
		const { spamData, hamData } = await readMailDataFromCSV(DATASET_FILE_PATH)
		const hamSlice = hamData.slice(0, 10)
		const spamSlice = spamData.slice(0, 100)
		dataSlice = hamSlice.concat(spamSlice)
		// seededShuffle(dataSlice, 42)

		await classifier.initialTraining(dataSlice)
		const falsePositive = hamData
			.slice(10)
			.filter(async (mailDatum) => mailDatum.isSpam !== (await classifier.predict(mailDatum)))
			.slice(0, 10)
		let retrainingNeeded = new Array<number>(falsePositive.length).fill(0)
		for (let i = 0; i < falsePositive.length; i++) {
			const sample = falsePositive[i]
			const copiedClassifier = await classifier.cloneClassifier()

			let retrainCount = 0
			let predictedSpam = false
			while (!predictedSpam && retrainCount++ <= 10) {
				await copiedClassifier.updateModel([{ ...sample, isSpam: true }])
				await copiedClassifier.updateModel([{ ...sample, isSpam: false }])
				predictedSpam = await copiedClassifier.predict(sample)
			}
			retrainingNeeded[i] = retrainCount
		}

		console.log(retrainingNeeded)
		const maxRetrain = Math.max(...retrainingNeeded)
		o.check(retrainingNeeded.length >= 10).equals(true)
		o.check(maxRetrain < 3).equals(true)
	})

	o("retrain after moving a false negative classification multiple times", async () => {
		o.timeout(20_000_000)
		const { spamData, hamData } = await readMailDataFromCSV(DATASET_FILE_PATH)
		const hamSlice = hamData.slice(0, 100)
		const spamSlice = spamData.slice(0, 10)
		dataSlice = hamSlice.concat(spamSlice)
		seededShuffle(dataSlice, 42)

		await classifier.initialTraining(dataSlice)
		const falseNegatives = spamData
			.slice(10)
			.filter(async (mailDatum) => mailDatum.isSpam !== (await classifier.predict(mailDatum)))
			.slice(0, 10)

		let retrainingNeeded = new Array<number>(falseNegatives.length).fill(0)
		for (let i = 0; i < falseNegatives.length; i++) {
			const sample = falseNegatives[i]
			const copiedClassifier = await classifier.cloneClassifier()

			let retrainCount = 0
			let predictedSpam = false
			while (!predictedSpam && retrainCount++ <= 10) {
				await copiedClassifier.initialTraining([...dataSlice, sample])
				predictedSpam = await copiedClassifier.predict(sample)
			}
			retrainingNeeded[i] = retrainCount
		}

		console.log(retrainingNeeded)
		const maxRetrain = Math.max(...retrainingNeeded)
		o.check(retrainingNeeded.length >= 10).equals(true)
		o.check(maxRetrain < 3).equals(true)
	})
})

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
