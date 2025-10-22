import o from "@tutao/otest"
import fs from "node:fs"
import { parseCsv } from "../../../../../../src/common/misc/parsing/CsvParser"
import {
	DEFAULT_PREPROCESS_CONFIGURATION,
	SpamClassifier,
	spamClassifierTokenizer,
	SpamTrainMailDatum,
} from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { OfflineStoragePersistence } from "../../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { matchers, object, when } from "testdouble"
import { assertNotNull, promiseMap } from "@tutao/tutanota-utils"
import { SpamClassificationInitializer } from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassificationInitializer"
import { CacheStorage } from "../../../../../../src/common/api/worker/rest/DefaultEntityRestCache"
import { mockAttribute } from "@tutao/tutanota-test-utils"
import "@tensorflow/tfjs-backend-cpu"
import {
	HashingVectorizer,
	numberArrayToUint8ArrayFixed,
	SparseVectorCompressor,
	uint8ArrayToNumberArrayFixed,
} from "../../../../../../src/mail-app/workerUtils/spamClassification/HashingVectorizer"
import { LayersModel, tensor1d } from "../../../../../../src/mail-app/workerUtils/spamClassification/tensorflow-custom"
import { createTestEntity } from "../../../../TestUtils"
import { MailTypeRef } from "../../../../../../src/common/api/entities/tutanota/TypeRefs"
import { Sequential } from "@tensorflow/tfjs-layers"
import { compress, uncompress } from "../../../../../../src/common/api/worker/Compression"

const { anything } = matchers
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
			isSpamConfidence: 1,
			ownerGroup: "owner",
		} as SpamTrainMailDatum)
	}

	return { spamData, hamData }
}

// Initial training (cutoff by day or amount)
o.spec("SpamClassifierTest", () => {
	const mockOfflineStorageCache = object<CacheStorage>()
	const mockOfflineStorage = object<OfflineStoragePersistence>()
	const mockSpamClassificationInitializer = object<SpamClassificationInitializer>()
	let nonEfficientSmallVectorizer: HashingVectorizer
	let spamClassifier: SpamClassifier

	let spamData: SpamTrainMailDatum[]
	let hamData: SpamTrainMailDatum[]
	let dataSlice: SpamTrainMailDatum[]

	o.beforeEach(async () => {
		const spamHamData = await readMailDataFromCSV(DATASET_FILE_PATH)
		spamData = spamHamData.spamData
		hamData = spamHamData.hamData
		dataSlice = spamData.concat(hamData)
		seededShuffle(dataSlice, 42)

		mockSpamClassificationInitializer.init = async () => {
			return dataSlice
		}

		nonEfficientSmallVectorizer = new HashingVectorizer(512)
		spamClassifier = new SpamClassifier(
			mockOfflineStorage,
			mockOfflineStorageCache,
			mockSpamClassificationInitializer,
			true,
			DEFAULT_PREPROCESS_CONFIGURATION,
			nonEfficientSmallVectorizer,
		)
	})

	o("processSpam maintains server classification when client classification is not enabled", async function () {
		const mail = createTestEntity(MailTypeRef, {
			_id: ["mailListId", "mailId"],
			sets: [["folderList", "serverFolder"]],
		})
		const spamTrainMailDatum: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: "some body",
			isSpam: true,
			isSpamConfidence: 1,
			ownerGroup: "owner",
		}
		const layersModel = object<Sequential>()
		spamClassifier.addSpamClassifierForOwner(spamTrainMailDatum.ownerGroup, layersModel, false)

		const predictedSpam = await spamClassifier.predict(spamTrainMailDatum)
		o(predictedSpam).equals(null)
	})

	o("processSpam uses client classification when enabled", async function () {
		const mail = createTestEntity(MailTypeRef, {
			_id: ["mailListId", "mailId"],
			sets: [["folderList", "serverFolder"]],
		})
		const spamTrainMailDatum: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: "some body",
			isSpam: false,
			isSpamConfidence: 0,
			ownerGroup: "owner",
		}

		const layersModel = object<Sequential>()
		when(layersModel.predict(anything())).thenReturn(tensor1d([1]))
		spamClassifier.addSpamClassifierForOwner(spamTrainMailDatum.ownerGroup, layersModel, true)

		const predictedSpam = await spamClassifier.predict(spamTrainMailDatum)
		o(predictedSpam).equals(true)
	})

	o("Initial training only", async () => {
		o.timeout(20_000)

		const trainTestSplit = dataSlice.length * 0.8
		const trainSet = dataSlice.slice(0, trainTestSplit)
		const testSet = dataSlice.slice(trainTestSplit)

		await spamClassifier.initialTraining(trainSet)
		await testClassifier(spamClassifier, testSet)
	})

	o("compress vectors", async () => {
		o.timeout(20_000)
		const tokenizedMails = await promiseMap(dataSlice, (mail) => spamClassifierTokenizer(spamClassifier.preprocessMail(mail)))
		const vectorizer = new HashingVectorizer()
		const vectors = await vectorizer.transform(tokenizedMails)

		const compressor = new SparseVectorCompressor()
		const BYTES_PER_NUMBER = 2
		console.log("Byte size of a number: ", BYTES_PER_NUMBER)
		const compressedVectors = vectors.map((v) => compressor.compressVector(v))
		const decompressedVectors = compressedVectors.map((v) => compressor.decompressVector(v))
		const decompressedVectorByteSizes: number[] = []
		const compressedVectorByteSizes: number[] = []
		for (let i = 0; i < compressedVectors.length; i++) {
			compressedVectorByteSizes.push((compressedVectors[i].rleValues.length + compressedVectors[i].indices.length) * BYTES_PER_NUMBER)
			decompressedVectorByteSizes.push(decompressedVectors[i].length * BYTES_PER_NUMBER)
		}
		const averageCompressedVectorByteSize = compressedVectorByteSizes.reduce((a, b) => a + b, 0) / compressedVectorByteSizes.length
		const averageDecompressedVectorByteSize = decompressedVectorByteSizes.reduce((a, b) => a + b, 0) / decompressedVectorByteSizes.length
		console.log(`Average compressed vector byte size (Custom): ${averageCompressedVectorByteSize.toFixed(2)}B`)
		console.log(`Average decompressed vector byte size (Custom): ${averageDecompressedVectorByteSize.toFixed(2)}B`)

		o.check(decompressedVectors).deepEquals(vectors)
		const rleCompressedVectors = vectors.map((v) => compressor.rleEncode(v))
		const rleDecompressedVectors = rleCompressedVectors.map((v) => compressor.rleDecode(v))
		const rleDecompressedVectorByteSizes: number[] = []
		const rleCompressedVectorByteSizes: number[] = []
		for (let i = 0; i < rleCompressedVectors.length; i++) {
			// todo get byte size
			rleCompressedVectorByteSizes.push(rleCompressedVectors[i].length * BYTES_PER_NUMBER)
			rleDecompressedVectorByteSizes.push(rleDecompressedVectors[i].length * BYTES_PER_NUMBER)
		}
		const averageRleCompressedVectorByteSize = rleCompressedVectorByteSizes.reduce((a, b) => a + b, 0) / rleCompressedVectorByteSizes.length
		const averageRleDecompressedVectorByteSize = rleDecompressedVectorByteSizes.reduce((a, b) => a + b, 0) / rleDecompressedVectorByteSizes.length
		console.log(`Average compressed vector byte size (RLE): ${averageRleCompressedVectorByteSize.toFixed(2)}B`)
		console.log(`Average decompressed vector byte size (RLE): ${averageRleDecompressedVectorByteSize.toFixed(2)}B`)

		o.check(rleDecompressedVectors).deepEquals(vectors)
		const lz4CompressedVectors = vectors.map((v) => compress(numberArrayToUint8ArrayFixed(v)))
		const lz4DecompressedVectors = lz4CompressedVectors.map((v) => uint8ArrayToNumberArrayFixed(uncompress(v)))
		const lz4DecompressedVectorByteSizes: number[] = []
		const lz4compressedVectorByteSizes: number[] = []
		for (let i = 0; i < rleCompressedVectors.length; i++) {
			lz4compressedVectorByteSizes.push(lz4CompressedVectors[i].byteLength)
			lz4DecompressedVectorByteSizes.push(decompressedVectors[i].length * BYTES_PER_NUMBER)
		}
		const averageLz4CompressedVectorByteSize = lz4compressedVectorByteSizes.reduce((a, b) => a + b, 0) / lz4compressedVectorByteSizes.length
		const averageLz4DecompressedVectorByteSize = lz4DecompressedVectorByteSizes.reduce((a, b) => a + b, 0) / lz4DecompressedVectorByteSizes.length
		console.log(`Average compressed vector byte size (LZ4): ${averageLz4CompressedVectorByteSize.toFixed(2)}B`)
		console.log(`Average decompressed vector byte size (LZ4): ${averageLz4DecompressedVectorByteSize.toFixed(2)}B`)
		o.check(lz4DecompressedVectors).deepEquals(vectors)
	})

	o("Initial training and refitting in multi step", async () => {
		o.timeout(20_000)

		const trainTestSplit = dataSlice.length * 0.8
		const trainSet = dataSlice.slice(0, trainTestSplit)
		const testSet = dataSlice.slice(trainTestSplit)

		const trainSetFirstHalf = trainSet.slice(0, trainSet.length / 2)
		const trainSetSecondHalf = trainSet.slice(trainSet.length / 2, trainSet.length)

		dataSlice = trainSetFirstHalf
		o(await mockSpamClassificationInitializer.init("owner")).deepEquals(trainSetFirstHalf)
		await spamClassifier.initialTraining(dataSlice)
		console.log(`==> Result when testing with mails in two steps (first step).`)
		await testClassifier(spamClassifier, testSet)

		await spamClassifier.updateModel("owner", trainSetSecondHalf)
		console.log(`==> Result when testing with mails in two steps (second step).`)
		await testClassifier(spamClassifier, testSet)
	})

	o("preprocessMail outputs expected tokens for mail content", async () => {
		const classifier = new SpamClassifier(object(), object(), object())
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
				5.090 € 37 m 1 Zi 100%
				Fax (089) 13 33 87 88
				August 12, 2025
				5:20 PM - 5:25 PM
				<this gets removed by HTML as it should use &lt; to represent the character>
				and all text on other lines it seems.
				<div>
<a rel="noopener noreferrer" target="_blank" href="https://www.somewebsite.de/?key=c2f395513421312029680" style="background-color:#055063;border-radius:3px;color:#ffffff;display:inline-block;font-size: 14px; font-family: sans-serif;font-weight:bold;line-height:36px;height:36px;text-align:center;text-decoration:none;width:157px;-webkit-text-size-adjust:none; margin-bottom:20px">Button Text</a>
</div>
<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%"><tbody><tr><td align="center"><a href="https://mail.abc-web.de/optiext/optiextension.dll?ID=someid" rel="noopener noreferrer" target="_blank" style="text-decoration:none"><img id="OWATemporaryImageDivContainer1" src="https://mail.some-domain.de/images/SMC/grafik/image.png" alt="" border="0" class="" width="100%" style="max-width:100%;display:block;width:100%"></a></td></tr></tbody></table>
this text is shown
`,
		} as SpamTrainMailDatum
		const preprocessedMail = classifier.preprocessMail(mail)
		// prettier-ignore
		const expectedOutput = `Sample Tokens and values Hello <SPECIAL-CHAR>  these are my MAC Address
\t\t\t\tFB <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
\t\t\t\t <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER> -D5 <SPECIAL-CHAR>  <NUMBER> -7C
\t\t\t\tB4 <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER> -2A-DE-D4
\t\t\t\talong with my ISBNs
\t\t\t\t <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
\t\t\t\t <NUMBER> -X
\t\t\t\t <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
\t\t\t\tSSN
\t\t\t\t <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
\t\t\t\t <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
\t\t\t\t <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
\t\t\t\tSHAs
\t\t\t\t585eab9b3a5e4430e08f5096d636d0d475a8c69dae21a61c6f1b26c4bd8dd8c1
\t\t\t\t7233d153f2e0725d3d212d1f27f30258fafd72b286d07b3b1d94e7e3c35dce67
\t\t\t\t769f65bf44557df44fc5f99c014cbe98894107c9d7be0801f37c55b3776c3990
\t\t\t\tPhone Numbers
\t\t\t\t <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>   <NUMBER>
\t\t\t\t <SPECIAL-CHAR>  <NUMBER>   <NUMBER>   <NUMBER>   <NUMBER>
\t\t\t\t <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
\t\t\t\tVIN  <SPECIAL-CHAR> Vehicle identification number <SPECIAL-CHAR>
\t\t\t\t3FADP4AJ3BM438397
\t\t\t\tWAULT64B82N564937
\t\t\t\tGUIDs
\t\t\t\t781a9631 <SPECIAL-CHAR>  <NUMBER> -4f9c-bb36-25c3364b754b
\t\t\t\t325783d4-a64e-453b-85e6-ed4b2cd4c9bf
\t\t\t\tHex Colors
\t\t\t\t <SPECIAL-CHAR> 2016c1
\t\t\t\t <SPECIAL-CHAR> c090a4
\t\t\t\t <SPECIAL-CHAR> c855f5
\t\t\t\t <SPECIAL-CHAR>  <NUMBER>
\t\t\t\tIPV4
\t\t\t\t <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
\t\t\t\t <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
\t\t\t\t <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
\t\t\t\tOn Date <SPECIAL-CHAR>
\t\t\t\t <DATE>
\t\t\t\t <DATE>
\t\t\t\tNot Date
\t\t\t\t <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>  <NUMBER>
\t\t\t\tURL
\t\t\t\t <URL-tuta.com>
\t\t\t\t <URL-subdomain.microsoft.com>
\t\t\t\tNOT URL
\t\t\t\t <URL-tuta>
\t\t\t\tMAIL
\t\t\t\t <EMAIL>
\t\t\t\t <EMAIL>
\t\t\t\tCredit Card
\t\t\t\t <CREDIT-CARD>
\t\t\t\t <CREDIT-CARD>
\t\t\t\tNot Credit Card
\t\t\t\t <NUMBER>   <NUMBER>
\t\t\t\tBit Coin Address
\t\t\t\t <BITCOIN>
\t\t\t\t <BITCOIN>
\t\t\t\tNot BTC
\t\t\t\t5213nYwhhGw2qpNijzfnKcbCG4z3hnrVA
\t\t\t\t1OUm2eZK2ETeAo8v95WhZioQDy32YSerkD
\t\t\t\tSpecial Characters
\t\t\t\t <SPECIAL-CHAR>
\t\t\t\t <SPECIAL-CHAR>
\t\t\t\tNot Special Characters
\t\t\t\t]
\t\t\t\tNumber Sequences <SPECIAL-CHAR>
\t\t\t\t <NUMBER>
\t\t\t\tIBAN <SPECIAL-CHAR>  DE91  <CREDIT-CARD>  <NUMBER>
\t\t\t\tNot Number Sequences
\t\t\t\tSHLT116
\t\t\t\tgb <SPECIAL-CHAR> 67ca4b
\t\t\t\tOther values found in mails
\t\t\t\t <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  €  <NUMBER>  m  <NUMBER>  Zi  <NUMBER>  <SPECIAL-CHAR>
\t\t\t\tFax  <SPECIAL-CHAR>  <NUMBER>  <SPECIAL-CHAR>   <NUMBER>   <NUMBER>   <NUMBER>   <NUMBER>
\t\t\t\tAugust  <NUMBER>  <SPECIAL-CHAR>   <NUMBER>
\t\t\t\t <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  PM  <SPECIAL-CHAR>   <NUMBER>  <SPECIAL-CHAR>  <NUMBER>  PM
\t\t\t\tand all text on other lines it seems <SPECIAL-CHAR>
 Button Text
this text is shown`
		o.check(preprocessedMail).equals(expectedOutput)
	})

	o("predict uses different models for different owner groups", async () => {
		const firstGroupModel = object<LayersModel>()
		const secondGroupModel = object<LayersModel>()
		mockAttribute(spamClassifier, spamClassifier.loadModel, (ownerGroup) => {
			if (ownerGroup === "firstGroup") {
				return Promise.resolve(firstGroupModel)
			} else if (ownerGroup === "secondGroup") {
				return Promise.resolve(secondGroupModel)
			}
			return null
		})

		mockAttribute(spamClassifier, spamClassifier.updateAndSaveModel, () => {
			return Promise.resolve()
		})

		const firstGroupReturnTensor = tensor1d([1.0], undefined)
		when(firstGroupModel.predict(matchers.anything())).thenReturn(firstGroupReturnTensor)
		const secondGroupReturnTensor = tensor1d([0.0], undefined)
		when(secondGroupModel.predict(matchers.anything())).thenReturn(secondGroupReturnTensor)

		await spamClassifier.initialize("firstGroup")
		await spamClassifier.initialize("secondGroup")

		const isSpamFirstMail = await spamClassifier.predict({ subject: "", body: "", ownerGroup: "firstGroup" })
		const isSpamSecondMail = await spamClassifier.predict({ subject: "", body: "", ownerGroup: "secondGroup" })

		o(isSpamFirstMail).equals(true)
		o(isSpamSecondMail).equals(false)

		// manually dispose @tensorflow tensors to save memory
		firstGroupReturnTensor.dispose()
		secondGroupReturnTensor.dispose()
	})
})

// These are rather analysis instead of test
// They run in loop hence do take more time to finish and is not necessary to include in CI test suite
//
// To enable running this, change following constant to true
const DO_RUN_PERFORMANCE_ANALYSIS = false
if (DO_RUN_PERFORMANCE_ANALYSIS) {
	o.spec("SpamClassifier - Performance Analysis", () => {
		const mockOfflineStorageCache = object<CacheStorage>()
		const mockOfflineStorage = object<OfflineStoragePersistence>()
		let spamClassifier = object<SpamClassifier>()
		let dataSlice: SpamTrainMailDatum[]
		o.beforeEach(() => {
			const mockSpamClassificationInitializer = object<SpamClassificationInitializer>()
			mockSpamClassificationInitializer.init = async () => {
				return dataSlice
			}
			spamClassifier = new SpamClassifier(mockOfflineStorage, mockOfflineStorageCache, mockSpamClassificationInitializer)
		})

		o("time to refit", async () => {
			o.timeout(20_000_000)
			const { spamData, hamData } = await readMailDataFromCSV(DATASET_FILE_PATH)
			const hamSlice = hamData.slice(0, 1000)
			const spamSlice = spamData.slice(0, 400)
			dataSlice = hamSlice.concat(spamSlice)
			seededShuffle(dataSlice, 42)

			const start = performance.now()
			await spamClassifier.initialTraining(dataSlice)
			const initialTrainingDuration = performance.now() - start
			console.log(`initial training time ${initialTrainingDuration}ms`)

			for (let i = 0; i < 20; i++) {
				const nowSpam = [hamSlice[0]]
				nowSpam.map((formerHam) => (formerHam.isSpam = true))
				const retrainingStart = performance.now()
				await spamClassifier.updateModel("owner", nowSpam)
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

			await spamClassifier.initialTraining(dataSlice)
			const falseNegatives = spamData
				.slice(10)
				.filter(async (mailDatum) => mailDatum.isSpam !== (await spamClassifier.predict(mailDatum)))
				.sort()
				.slice(0, 10)

			let retrainingNeeded = new Array<number>(falseNegatives.length).fill(0)
			for (let i = 0; i < falseNegatives.length; i++) {
				const sample = falseNegatives[i]
				const copiedClassifier = await spamClassifier.cloneClassifier()

				let retrainCount = 0
				let predictedSpam = false
				while (!predictedSpam && retrainCount++ <= 3) {
					// await copiedClassifier.updateModel([{ ...sample, isSpam: false }])

					/*
    isSpamConfidence: 2
                    [
      3, 2, 1, 3, 1,
      1, 3, 2, 1, 5
    ] = 22
    isSpamConfidence: 3
    [
      2, 5, 1, 2, 1,
      1, 1, 2, 1, 2
    ] = 18

    isSpamConfidence: 4
    [
      1, 1, 1, 2, 5,
      1, 1, 1, 1, 5
    ] = 19
    Retraining finished. Took: 477ms
    Retraining finished. Took: 1259ms
    predicted new mail to be with probability 0.46 spam
    Retraining finished. Took: 560ms
    Retraining finished. Took: 1273ms

    isSpamConfidence: 8
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
					await copiedClassifier.updateModel("owner", [{ ...sample, isSpam: true, isSpamConfidence: 1 }])
					predictedSpam = assertNotNull(await copiedClassifier.predict(sample))
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

			await spamClassifier.initialTraining(dataSlice)
			const falsePositive = hamData
				.slice(10)
				.filter(async (mailDatum) => mailDatum.isSpam !== (await spamClassifier.predict(mailDatum)))
				.slice(0, 10)
			let retrainingNeeded = new Array<number>(falsePositive.length).fill(0)
			for (let i = 0; i < falsePositive.length; i++) {
				const sample = falsePositive[i]
				const copiedClassifier = await spamClassifier.cloneClassifier()

				let retrainCount = 0
				let predictedSpam = false
				while (!predictedSpam && retrainCount++ <= 10) {
					await copiedClassifier.updateModel("owner", [{ ...sample, isSpam: true }])
					await copiedClassifier.updateModel("owner", [{ ...sample, isSpam: false }])
					predictedSpam = assertNotNull(await copiedClassifier.predict(sample))
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

			await spamClassifier.initialTraining(dataSlice)
			const falseNegatives = spamData
				.slice(10)
				.filter(async (mailDatum) => mailDatum.isSpam !== (await spamClassifier.predict(mailDatum)))
				.slice(0, 10)

			let retrainingNeeded = new Array<number>(falseNegatives.length).fill(0)
			for (let i = 0; i < falseNegatives.length; i++) {
				const sample = falseNegatives[i]
				const copiedClassifier = await spamClassifier.cloneClassifier()

				let retrainCount = 0
				let predictedSpam = false
				while (!predictedSpam && retrainCount++ <= 10) {
					await copiedClassifier.initialTraining([...dataSlice, sample])
					predictedSpam = assertNotNull(await copiedClassifier.predict(sample))
				}
				retrainingNeeded[i] = retrainCount
			}

			console.log(retrainingNeeded)
			const maxRetrain = Math.max(...retrainingNeeded)
			o.check(retrainingNeeded.length >= 10).equals(true)
			o.check(maxRetrain < 3).equals(true)
		})

		o("Time spent in vectorization during initial training", async () => {
			o.timeout(2_000_000)

			const ITERATION_COUNT: number = 1
			const { spamData, hamData } = await readMailDataFromCSV(DATASET_FILE_PATH)
			dataSlice = spamData.concat(hamData)

			let trainingTimes = new Array<number>()
			let vectorizationTimes = new Array<number>()
			let trainingWithoutVectorization = new Array<number>()

			await promiseMap(
				new Array<number>(ITERATION_COUNT).fill(0),
				async () => {
					const { vectorizationTime, trainingTime } = await spamClassifier.initialTraining(dataSlice)
					trainingTimes.push(trainingTime)
					vectorizationTimes.push(vectorizationTime)
					trainingWithoutVectorization.push(trainingTime - vectorizationTime)
				},
				{ concurrency: ITERATION_COUNT },
			)

			trainingTimes = trainingTimes.sort()
			vectorizationTimes = vectorizationTimes.sort()
			trainingWithoutVectorization = trainingWithoutVectorization.sort()
			const avgTrainingTime = trainingTimes.reduce((a, b) => a + b, 0) / trainingTimes.length
			const avgVectorizationTime = vectorizationTimes.reduce((a, b) => a + b, 0) / vectorizationTimes.length
			const avgTrainingWithoutVectorization = trainingWithoutVectorization.reduce((a, b) => a + b, 0) / trainingWithoutVectorization.length

			console.log("For vectorization:")
			console.log({ min: vectorizationTimes.at(0), max: vectorizationTimes.at(-1), avg: avgVectorizationTime })
			console.log("For whole training:")
			console.log({ min: trainingTimes.at(0), max: trainingTimes.at(-1), avg: avgTrainingTime })
			console.log("For training without vectorization:")
			console.log({
				min: trainingWithoutVectorization.at(0),
				max: trainingWithoutVectorization.at(-1),
				avg: avgTrainingWithoutVectorization,
			})
		})
	})
}

async function testClassifier(classifier: SpamClassifier, mails: SpamTrainMailDatum[]): Promise<void> {
	let predictionArray: number[] = []
	for (let mail of mails) {
		const prediction = await classifier.predict(mail)
		predictionArray.push(prediction ? 1 : 0)
	}
	const ysArray = mails.map((mail) => mail.isSpam)

	let tp = 0,
		tn = 0,
		fp = 0,
		fn = 0

	for (let i = 0; i < predictionArray.length; i++) {
		const predictedSpam = predictionArray[i] > 0.5
		const isActuallyASpam = ysArray[i]
		if (predictedSpam && isActuallyASpam) tp++
		else if (!predictedSpam && !isActuallyASpam) tn++
		else if (predictedSpam && !isActuallyASpam) fp++
		else if (!predictedSpam && isActuallyASpam) fn++
	}

	const total = tp + tn + fp + fn
	const accuracy = (tp + tn) / total
	const precision = tp / (tp + fp + 1e-7)
	const recall = tp / (tp + fn + 1e-7)
	const f1 = 2 * ((precision * recall) / (precision + recall + 1e-7))

	console.log("\n--- Evaluation Metrics ---")
	console.log(`Accuracy: \t${(accuracy * 100).toFixed(2)}%`)
	console.log(`Precision:\t${(precision * 100).toFixed(2)}%`)
	console.log(`Recall:   \t${(recall * 100).toFixed(2)}%`)
	console.log(`F1 Score: \t${(f1 * 100).toFixed(2)}%`)
	console.log("\nConfusion Matrix:")
	console.log({
		Predicted_Spam: { True_Positive: tp, False_Positive: fp },
		Predicted_Ham: { False_Negative: fn, True_Negative: tn },
	})
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
