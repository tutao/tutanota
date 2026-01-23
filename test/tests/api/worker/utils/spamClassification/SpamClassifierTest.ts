import o from "@tutao/otest"
import fs from "node:fs"
import { parseCsv } from "../../../../../../src/common/misc/parsing/CsvParser"
import {
	Classifier,
	CURRENT_SPACE_FOR_SERVER_RESULT,
	DEFAULT_PREDICTION_THRESHOLD,
	SpamClassificationModelMetaData,
	SpamClassifier,
} from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { matchers, object, when } from "testdouble"
import { assertNotNull } from "@tutao/tutanota-utils"
import { SpamClassifierDataDealer, TrainingDataset } from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassifierDataDealer"
import { mockAttribute } from "@tutao/tutanota-test-utils"
import "@tensorflow/tfjs-backend-cpu"
import { LayersModel, tensor1d } from "../../../../../../src/mail-app/workerUtils/spamClassification/tensorflow-custom"
import { createTestEntity } from "../../../../TestUtils"
import { ClientSpamTrainingDatum, ClientSpamTrainingDatumTypeRef, MailTypeRef } from "../../../../../../src/common/api/entities/tutanota/TypeRefs"
import { Sequential } from "@tensorflow/tfjs-layers"
import { SparseVectorCompressor } from "../../../../../../src/common/api/common/utils/spamClassificationUtils/SparseVectorCompressor"
import {
	DEFAULT_IS_SPAM_CONFIDENCE,
	DEFAULT_PREPROCESS_CONFIGURATION,
	SpamMailDatum,
	SpamMailProcessor,
} from "../../../../../../src/common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { SpamDecision } from "../../../../../../src/common/api/common/TutanotaConstants"
import { GENERATED_MIN_ID } from "../../../../../../src/common/api/common/utils/EntityUtils"
import { SpamClassifierStorageFacade } from "../../../../../../src/common/api/worker/facades/lazy/SpamClassifierStorageFacade"

const { anything } = matchers
export const DATASET_FILE_PATH: string = "./tests/api/worker/utils/spamClassification/spam_classification_test_mails.csv"
const TEST_OWNER_GROUP = "owner"

export async function readMailDataFromCSV(filePath: string): Promise<{
	spamData: SpamMailDatum[]
	hamData: SpamMailDatum[]
}> {
	const file = await fs.promises.readFile(filePath)
	const csv = parseCsv(file.toString())

	let spamData: SpamMailDatum[] = []
	let hamData: SpamMailDatum[] = []
	for (const row of csv.rows.slice(1, csv.rows.length - 1)) {
		const subject = row[8]
		const body = row[10]
		const label = row[11]
		const from = row[0]
		const to = row[1]
		const cc = row[2]
		const bcc = row[3]
		const authStatus = row[4]

		let isSpam = label === "spam" ? true : label === "ham" ? false : null
		isSpam = assertNotNull(isSpam, "Unknown label detected: " + label)
		const spamMailDatum = {
			subject,
			body,
			ownerGroup: TEST_OWNER_GROUP,
			sender: from,
			toRecipients: to,
			ccRecipients: cc,
			bccRecipients: bcc,
			authStatus: authStatus,
			serverIsSpam: true,
			serverClassifier: 0,
		} satisfies SpamMailDatum

		const targetData = isSpam ? spamData : hamData
		targetData.push(spamMailDatum)
	}

	return { spamData, hamData }
}

async function convertToClientTrainingDatum(spamData: SpamMailDatum[], spamProcessor: SpamMailProcessor, isSpam: boolean): Promise<ClientSpamTrainingDatum[]> {
	let result: ClientSpamTrainingDatum[] = []
	for (const spamDatum of spamData) {
		const { vectorToUpload } = await spamProcessor.createModelInputAndUploadVector(CURRENT_SPACE_FOR_SERVER_RESULT, spamDatum)
		const clientSpamTrainingDatum = createTestEntity(ClientSpamTrainingDatumTypeRef, {
			confidence: DEFAULT_IS_SPAM_CONFIDENCE.toString(),
			spamDecision: isSpam ? SpamDecision.BLACKLIST : SpamDecision.WHITELIST,
			vector: vectorToUpload,
		})

		result.push(clientSpamTrainingDatum)
	}

	return result
}

function getTrainingDataset(trainSet: ClientSpamTrainingDatum[]) {
	return {
		trainingData: trainSet,
		hamCount: trainSet.filter((item) => item.spamDecision === SpamDecision.WHITELIST).length,
		spamCount: trainSet.filter((item) => item.spamDecision === SpamDecision.BLACKLIST).length,
		lastTrainingDataIndexId: GENERATED_MIN_ID,
	}
}

// Initial training (cutoff by day or amount)
o.spec("SpamClassifierTest", () => {
	const mockSpamClassificationDataDealer = object<SpamClassifierDataDealer>()
	const mockSpamClassifierStorageFacade = object<SpamClassifierStorageFacade>()
	let spamClassifier: SpamClassifier
	let spamProcessor: SpamMailProcessor
	let metaData: SpamClassificationModelMetaData

	let compressor: SparseVectorCompressor
	let spamData: ClientSpamTrainingDatum[]
	let hamData: ClientSpamTrainingDatum[]
	let dataSlice: ClientSpamTrainingDatum[]

	o.beforeEach(async () => {
		const spamHamData = await readMailDataFromCSV(DATASET_FILE_PATH)
		mockSpamClassificationDataDealer.fetchAllTrainingData = async () => {
			return getTrainingDataset(dataSlice)
		}
		const vectorLength = 512
		compressor = new SparseVectorCompressor(vectorLength)

		spamProcessor = new SpamMailProcessor(DEFAULT_PREPROCESS_CONFIGURATION, compressor)
		spamClassifier = new SpamClassifier(mockSpamClassifierStorageFacade, mockSpamClassificationDataDealer, true)
		spamClassifier.spamMailProcessor = spamProcessor
		spamClassifier.sparseVectorCompressor = compressor
		spamData = await convertToClientTrainingDatum(spamHamData.spamData, spamProcessor, true)
		hamData = await convertToClientTrainingDatum(spamHamData.hamData, spamProcessor, false)
		dataSlice = spamData.concat(hamData)
		metaData = {
			spaceForServerResult: CURRENT_SPACE_FOR_SERVER_RESULT,
			spamCount: spamData.length,
			hamCount: hamData.length,
			lastTrainingDataIndexId: "someId",
			lastTrainedFromScratchTime: Date.now(),
		}
		seededShuffle(dataSlice, 42)
	})

	o("processSpam respects the classifier threshold", async function () {
		const mail = createTestEntity(MailTypeRef, {
			_id: ["mailListId", "mailId"],
			sets: [["folderList", "serverFolder"]],
		})
		const spamMailDatum: SpamMailDatum = {
			ownerGroup: TEST_OWNER_GROUP,
			subject: mail.subject,
			body: "some body",
			sender: "sender@tuta.com",
			toRecipients: "recipient@tuta.com",
			ccRecipients: "",
			bccRecipients: "",
			authStatus: "0",
			serverClassifier: 0,
			serverIsSpam: true,
		}

		const layersModel = object<Sequential>()
		when(layersModel.predict(anything())).thenReturn(tensor1d([0.7]))
		spamClassifier.classifierByMailGroup.set(spamMailDatum.ownerGroup, { layersModel, threshold: 0.9, metaData })

		const { modelInput } = await spamProcessor.createModelInputAndUploadVector(CURRENT_SPACE_FOR_SERVER_RESULT, spamMailDatum)
		const predictedSpam = await spamClassifier.predict(modelInput, spamMailDatum.ownerGroup)
		o(predictedSpam).equals(false)
	})

	o("Initial training only", async () => {
		o.timeout(20_000)

		const trainTestSplit = dataSlice.length * 0.8
		const trainSet = dataSlice.slice(0, trainTestSplit)
		const testSet = dataSlice.slice(trainTestSplit)
		const trainingDataset: TrainingDataset = getTrainingDataset(trainSet)
		await spamClassifier.initialTraining(TEST_OWNER_GROUP, trainingDataset)
		await testClassifier(spamClassifier, testSet, spamProcessor)

		const classifier = spamClassifier.classifierByMailGroup.get(TEST_OWNER_GROUP)
		o(classifier?.metaData.hamCount).equals(trainingDataset.hamCount)
		o(classifier?.metaData.spamCount).equals(trainingDataset.spamCount)
		o(classifier?.threshold).equals(spamClassifier.calculateThreshold(trainingDataset.hamCount, trainingDataset.spamCount))
	})

	o("Initial training and refitting in multi step", async () => {
		o.timeout(20_000)

		const trainTestSplit = dataSlice.length * 0.8
		const trainSet = dataSlice.slice(0, trainTestSplit)
		const testSet = dataSlice.slice(trainTestSplit)

		const trainSetFirstHalf = trainSet.slice(0, trainSet.length / 2)
		const trainSetSecondHalf = trainSet.slice(trainSet.length / 2, trainSet.length)

		dataSlice = trainSetFirstHalf
		o((await mockSpamClassificationDataDealer.fetchAllTrainingData(TEST_OWNER_GROUP)).trainingData).deepEquals(dataSlice)
		const initialTrainingDataset = getTrainingDataset(dataSlice)
		await spamClassifier.initialTraining(TEST_OWNER_GROUP, initialTrainingDataset)
		console.log(`==> Result when testing with mails in two steps (first step).`)
		await testClassifier(spamClassifier, testSet, spamProcessor)

		const trainingDatasetSecondHalf = getTrainingDataset(trainSetSecondHalf)
		trainingDatasetSecondHalf.lastTrainingDataIndexId = "some new index id"
		await spamClassifier.updateModel(TEST_OWNER_GROUP, trainingDatasetSecondHalf)
		console.log(`==> Result when testing with mails in two steps (second step).`)
		await testClassifier(spamClassifier, testSet, spamProcessor)

		const classifier = spamClassifier.classifierByMailGroup.get(TEST_OWNER_GROUP)
		const finalHamCount = initialTrainingDataset.hamCount + trainingDatasetSecondHalf.hamCount
		const finalSpamCount = initialTrainingDataset.spamCount + trainingDatasetSecondHalf.spamCount
		o(classifier?.metaData.hamCount).equals(finalHamCount)
		o(classifier?.metaData.spamCount).equals(finalSpamCount)
		o(classifier?.metaData.lastTrainingDataIndexId).equals(trainingDatasetSecondHalf.lastTrainingDataIndexId)
		o(classifier?.threshold).equals(spamClassifier.calculateThreshold(finalHamCount, finalSpamCount))
	})

	o("preprocessMail outputs expected tokens for mail content", async () => {
		const mail = {
			subject: `Sample Tokens and values`,
			sender: "sender",
			toRecipients: "toRecipients",
			ccRecipients: "ccRecipients",
			bccRecipients: "bccRecipients",
			authStatus: "authStatus",
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
				Not Special Character
				§
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
		} as SpamMailDatum
		const preprocessedMail = spamProcessor.preprocessMail(mail)
		// prettier-ignore
		const expectedOutput = `Sample Tokens and values
Hello TSPECIALCHAR  these are my MAC Address
\t\t\t\tFB TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER
\t\t\t\t TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR D5 TSPECIALCHAR  TNUMBER  TSPECIALCHAR 7C
\t\t\t\tB4 TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR 2A TSPECIALCHAR DE TSPECIALCHAR D4
\t\t\t\talong with my ISBNs
\t\t\t\t TNUMBER  TSPECIALCHAR  TNUMBER
\t\t\t\t TNUMBER  TSPECIALCHAR X
\t\t\t\t TNUMBER  TSPECIALCHAR  TNUMBER
\t\t\t\tSSN
\t\t\t\t TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER
\t\t\t\t TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER
\t\t\t\t TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER
\t\t\t\tSHAs
\t\t\t\t585eab9b3a5e4430e08f5096d636d0d475a8c69dae21a61c6f1b26c4bd8dd8c1
\t\t\t\t7233d153f2e0725d3d212d1f27f30258fafd72b286d07b3b1d94e7e3c35dce67
\t\t\t\t769f65bf44557df44fc5f99c014cbe98894107c9d7be0801f37c55b3776c3990
\t\t\t\tPhone Numbers
\t\t\t\t TSPECIALCHAR  TNUMBER  TSPECIALCHAR   TNUMBER
\t\t\t\t TSPECIALCHAR  TNUMBER   TNUMBER   TNUMBER   TNUMBER
\t\t\t\t TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER
\t\t\t\tVIN  TSPECIALCHAR Vehicle identification number TSPECIALCHAR
\t\t\t\t3FADP4AJ3BM438397
\t\t\t\tWAULT64B82N564937
\t\t\t\tGUIDs
\t\t\t\t781a9631 TSPECIALCHAR  TNUMBER  TSPECIALCHAR 4f9c TSPECIALCHAR bb36 TSPECIALCHAR 25c3364b754b
\t\t\t\t325783d4 TSPECIALCHAR a64e TSPECIALCHAR 453b TSPECIALCHAR 85e6 TSPECIALCHAR ed4b2cd4c9bf
\t\t\t\tHex Colors
\t\t\t\t TSPECIALCHAR 2016c1
\t\t\t\t TSPECIALCHAR c090a4
\t\t\t\t TSPECIALCHAR c855f5
\t\t\t\t TSPECIALCHAR  TNUMBER
\t\t\t\tIPV4
\t\t\t\t TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER
\t\t\t\t TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER
\t\t\t\t TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER
\t\t\t\tOn Date TSPECIALCHAR
\t\t\t\t TDATE
\t\t\t\t TDATE
\t\t\t\tNot Date
\t\t\t\t TNUMBER  TSPECIALCHAR  TNUMBER  TSPECIALCHAR  TNUMBER
\t\t\t\tURL
\t\t\t\t TURLtuta TSPECIALCHAR com
\t\t\t\t TURLsubdomain TSPECIALCHAR microsoft TSPECIALCHAR com
\t\t\t\tNOT URL
\t\t\t\t TURLtuta
\t\t\t\tMAIL
\t\t\t\t TEMAIL
\t\t\t\t TEMAIL
\t\t\t\tCredit Card
\t\t\t\t TCREDITCARD
\t\t\t\t TCREDITCARD
\t\t\t\tNot Credit Card
\t\t\t\t TNUMBER   TNUMBER
\t\t\t\tBit Coin Address
\t\t\t\t TBITCOIN
\t\t\t\t TBITCOIN
\t\t\t\tNot BTC
\t\t\t\t5213nYwhhGw2qpNijzfnKcbCG4z3hnrVA
\t\t\t\t1OUm2eZK2ETeAo8v95WhZioQDy32YSerkD
\t\t\t\tSpecial Characters
\t\t\t\t TSPECIALCHAR
\t\t\t\t TSPECIALCHAR
\t\t\t\tNot Special Character
\t\t\t\t§
\t\t\t\tNumber Sequences TSPECIALCHAR
\t\t\t\t TNUMBER
\t\t\t\tIBAN TSPECIALCHAR  DE91  TCREDITCARD  TNUMBER
\t\t\t\tNot Number Sequences
\t\t\t\tSHLT116
\t\t\t\tgb TSPECIALCHAR 67ca4b
\t\t\t\tOther values found in mails
\t\t\t\t TNUMBER  TSPECIALCHAR  TNUMBER  €  TNUMBER  m  TNUMBER  Zi  TNUMBER  TSPECIALCHAR
\t\t\t\tFax  TSPECIALCHAR  TNUMBER  TSPECIALCHAR   TNUMBER   TNUMBER   TNUMBER   TNUMBER
\t\t\t\tAugust  TNUMBER  TSPECIALCHAR   TNUMBER
\t\t\t\t TNUMBER  TSPECIALCHAR  TNUMBER  PM  TSPECIALCHAR   TNUMBER  TSPECIALCHAR  TNUMBER  PM
\t\t\t\tand all text on other lines it seems TSPECIALCHAR
 Button Text
this text is shown
sender
toRecipients
ccRecipients
bccRecipients
authStatus`
		o.check(preprocessedMail).equals(expectedOutput)
	})

	o("predict uses different models for different owner groups", async () => {
		const firstGroupClassifier = {
			layersModel: object<LayersModel>(),
			threshold: DEFAULT_PREDICTION_THRESHOLD,
			metaData,
		} satisfies Classifier
		const secondGroupClassifier = {
			layersModel: object<LayersModel>(),
			threshold: DEFAULT_PREDICTION_THRESHOLD,
			metaData,
		} satisfies Classifier
		mockAttribute(spamClassifier, spamClassifier.loadClassifier, (ownerGroup) => {
			if (ownerGroup === "firstGroup") {
				return Promise.resolve(firstGroupClassifier)
			} else if (ownerGroup === "secondGroup") {
				return Promise.resolve(secondGroupClassifier)
			}
			return null
		})

		mockAttribute(spamClassifier, spamClassifier.updateModelFromIndexStartId, () => {
			return Promise.resolve()
		})

		const firstGroupReturnTensor = tensor1d([1.0], undefined)
		when(firstGroupClassifier.layersModel.predict(matchers.anything())).thenReturn(firstGroupReturnTensor)
		const secondGroupReturnTensor = tensor1d([0.0], undefined)
		when(secondGroupClassifier.layersModel.predict(matchers.anything())).thenReturn(secondGroupReturnTensor)

		await spamClassifier.initializeWithTraining("firstGroup")
		await spamClassifier.initializeWithTraining("secondGroup")

		const commonSpamFields = {
			subject: "",
			body: "",
			sender: "string",
			toRecipients: "string",
			ccRecipients: "string",
			bccRecipients: "string",
			authStatus: "",
			serverClassifier: 0,
			serverIsSpam: true,
		}

		const { modelInput: firstMailVector } = await spamProcessor.createModelInputAndUploadVector(CURRENT_SPACE_FOR_SERVER_RESULT, {
			ownerGroup: "firstGroup",
			...commonSpamFields,
		})
		const isSpamFirstMail = await spamClassifier.predict(firstMailVector, "firstGroup")
		const { modelInput: secondMailVector } = await spamProcessor.createModelInputAndUploadVector(CURRENT_SPACE_FOR_SERVER_RESULT, {
			ownerGroup: "secondGroup",
			...commonSpamFields,
		})
		const isSpamSecondMail = await spamClassifier.predict(secondMailVector, "secondGroup")

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
const DO_RUN_PERFORMANCE_ANALYSIS = true
if (DO_RUN_PERFORMANCE_ANALYSIS) {
	async function filterForMisclassifiedClientSpamTrainingData(
		classifier: SpamClassifier,
		compressor: SparseVectorCompressor,
		dataSlice: ClientSpamTrainingDatum[],
		desiredSlice: number,
	) {
		return dataSlice
			.slice(desiredSlice)
			.filter(async (datum) => {
				const currentClassificationIsSpam = datum.spamDecision === SpamDecision.BLACKLIST
				const actualPrediction = await classifier.predict(compressor.binaryToVector(datum.vector), datum._ownerGroup || TEST_OWNER_GROUP)
				return currentClassificationIsSpam !== actualPrediction
			})
			.sort()
			.slice(0, desiredSlice)
	}

	o.spec("SpamClassifier - Performance Analysis", () => {
		const compressor = new SparseVectorCompressor()
		let spamClassifier = object<SpamClassifier>()
		let dataSlice: ClientSpamTrainingDatum[]
		let spamProcessor: SpamMailProcessor

		o.beforeEach(async () => {
			const mockSpamClassificationDataDealer = object<SpamClassifierDataDealer>()
			const mockSpamClassifierStorageFacade = object<SpamClassifierStorageFacade>()
			mockSpamClassificationDataDealer.fetchAllTrainingData = async () => {
				return getTrainingDataset(dataSlice)
			}
			spamProcessor = new SpamMailProcessor(DEFAULT_PREPROCESS_CONFIGURATION, compressor)
			spamClassifier = new SpamClassifier(mockSpamClassifierStorageFacade, mockSpamClassificationDataDealer, false)
			spamClassifier.spamMailProcessor = spamProcessor
		})

		o("time to refit and multiple refits work correctly", async () => {
			o.timeout(20_000_000)
			const { spamData, hamData } = await readMailDataFromCSV(DATASET_FILE_PATH)
			const hamSlice = await convertToClientTrainingDatum(hamData.slice(0, 1000), spamProcessor, false)
			const spamSlice = await convertToClientTrainingDatum(spamData.slice(0, 400), spamProcessor, true)
			dataSlice = hamSlice.concat(spamSlice)
			seededShuffle(dataSlice, 42)

			const start = performance.now()
			const initialTrainingDataset = getTrainingDataset(dataSlice)
			await spamClassifier.initialTraining(TEST_OWNER_GROUP, initialTrainingDataset)
			const initialClassifier = spamClassifier.classifierByMailGroup.get(TEST_OWNER_GROUP)!
			const initialHamCount = initialClassifier.metaData.hamCount
			const initialSpamCount = initialClassifier.metaData.spamCount
			const initialTrainingDuration = performance.now() - start
			console.log(`initial training time ${initialTrainingDuration}ms`)

			for (let i = 0; i < 20; i++) {
				const nowSpam = [hamSlice[0]]
				nowSpam.map((formerHam) => (formerHam.spamDecision = SpamDecision.BLACKLIST))
				const retrainingStart = performance.now()
				const newPartialRetrainingDataset = getTrainingDataset(nowSpam)
				newPartialRetrainingDataset.lastTrainingDataIndexId = "lastTrainingDataIndexId" + i
				await spamClassifier.updateModel(TEST_OWNER_GROUP, newPartialRetrainingDataset)
				const retrainingDuration = performance.now() - retrainingStart
				console.log(`retraining time ${retrainingDuration}ms`)

				// verify classifier correctness
				const classifier = spamClassifier.classifierByMailGroup.get(TEST_OWNER_GROUP)!
				const finalHamCount = initialHamCount
				const finalSpamCount = initialSpamCount + i + 1
				o(classifier?.metaData.hamCount).equals(finalHamCount)
				o(classifier?.metaData.spamCount).equals(finalSpamCount)
				o(classifier?.metaData.lastTrainingDataIndexId).equals(newPartialRetrainingDataset.lastTrainingDataIndexId)
				o(classifier?.threshold).equals(spamClassifier.calculateThreshold(finalHamCount, finalSpamCount))
			}
		})

		o("refit after moving a false negative classification multiple times", async () => {
			o.timeout(20_000_000)
			const { spamData, hamData } = await readMailDataFromCSV(DATASET_FILE_PATH)
			const hamSlice = await convertToClientTrainingDatum(hamData.slice(0, 100), spamProcessor, false)
			const spamSlice = await convertToClientTrainingDatum(spamData.slice(0, 10), spamProcessor, true)
			dataSlice = hamSlice.concat(spamSlice)
			seededShuffle(dataSlice, 42)

			await spamClassifier.initialTraining(TEST_OWNER_GROUP, getTrainingDataset(dataSlice))
			const falseNegatives = await filterForMisclassifiedClientSpamTrainingData(spamClassifier, compressor, spamSlice, 10)

			let retrainingNeeded = new Array<number>(falseNegatives.length).fill(0)
			for (let i = 0; i < falseNegatives.length; i++) {
				const sample = falseNegatives[i]
				const copiedClassifier = await spamClassifier.cloneSpamClassifier()

				let retrainCount = 0
				let predictedSpam = false
				while (!predictedSpam && retrainCount++ <= 10) {
					await copiedClassifier.updateModel(
						TEST_OWNER_GROUP,
						getTrainingDataset([
							{
								...sample,
								spamDecision: SpamDecision.BLACKLIST,
								confidence: "4",
							},
						]),
					)
					predictedSpam = assertNotNull(await copiedClassifier.predict(compressor.binaryToVector(sample.vector), TEST_OWNER_GROUP))
				}
				retrainingNeeded[i] = retrainCount
			}

			console.log(retrainingNeeded)
			const maxRetrain = Math.max(...retrainingNeeded)
			o.check(retrainingNeeded.length >= 10).equals(false)
			o.check(maxRetrain < 3).equals(true)
		})

		o("refit after moving a false positive classification multiple times", async () => {
			o.timeout(20_000_000)
			const { spamData, hamData } = await readMailDataFromCSV(DATASET_FILE_PATH)
			const hamSlice = await convertToClientTrainingDatum(hamData.slice(0, 10), spamProcessor, false)
			const spamSlice = await convertToClientTrainingDatum(spamData.slice(0, 100), spamProcessor, true)
			dataSlice = hamSlice.concat(spamSlice)
			seededShuffle(dataSlice, 42)

			await spamClassifier.initialTraining(TEST_OWNER_GROUP, getTrainingDataset(dataSlice))

			const falsePositive = await filterForMisclassifiedClientSpamTrainingData(spamClassifier, compressor, hamSlice, 10)
			let retrainingNeeded = new Array<number>(falsePositive.length).fill(0)
			for (let i = 0; i < falsePositive.length; i++) {
				const sample = falsePositive[i]
				const copiedClassifier = await spamClassifier.cloneSpamClassifier()

				let retrainCount = 0
				let predictedSpam = false
				while (!predictedSpam && retrainCount++ <= 10) {
					await copiedClassifier.updateModel(
						TEST_OWNER_GROUP,
						getTrainingDataset([{ ...sample, spamDecision: SpamDecision.WHITELIST, confidence: "4" }]),
					)
					predictedSpam = assertNotNull(await copiedClassifier.predict(compressor.binaryToVector(sample.vector), TEST_OWNER_GROUP))
				}
				retrainingNeeded[i] = retrainCount
			}

			console.log(retrainingNeeded)
			const maxRetrain = Math.max(...retrainingNeeded)
			o.check(retrainingNeeded.length >= 10).equals(false)
			o.check(maxRetrain < 3).equals(true)
		})

		o("retrain from scratch after moving a false negative classification multiple times", async () => {
			o.timeout(20_000_000)
			const { spamData, hamData } = await readMailDataFromCSV(DATASET_FILE_PATH)
			const hamSlice = await convertToClientTrainingDatum(hamData.slice(0, 100), spamProcessor, false)
			const spamSlice = await convertToClientTrainingDatum(spamData.slice(0, 10), spamProcessor, true)
			dataSlice = hamSlice.concat(spamSlice)
			seededShuffle(dataSlice, 42)

			await spamClassifier.initialTraining(TEST_OWNER_GROUP, getTrainingDataset(dataSlice))
			const falseNegatives = await filterForMisclassifiedClientSpamTrainingData(spamClassifier, compressor, spamSlice, 10)

			let retrainingNeeded = new Array<number>(falseNegatives.length).fill(0)
			for (let i = 0; i < falseNegatives.length; i++) {
				const sample = falseNegatives[i]
				const copiedClassifier = await spamClassifier.cloneSpamClassifier()

				let retrainCount = 0
				let predictedSpam = false
				while (!predictedSpam && retrainCount++ <= 10) {
					await copiedClassifier.initialTraining(
						TEST_OWNER_GROUP,
						getTrainingDataset([
							...dataSlice,
							{
								...sample,
								spamDecision: SpamDecision.BLACKLIST,
								confidence: "4",
							},
						]),
					)
					predictedSpam = assertNotNull(await copiedClassifier.predict(compressor.binaryToVector(sample.vector), TEST_OWNER_GROUP))
				}
				retrainingNeeded[i] = retrainCount
			}

			console.log(retrainingNeeded)
			const maxRetrain = Math.max(...retrainingNeeded)
			o.check(retrainingNeeded.length >= 10).equals(false)
			o.check(maxRetrain < 3).equals(true)
		})
	})
}

async function testClassifier(classifier: SpamClassifier, mails: ClientSpamTrainingDatum[], spamMailProcessor: SpamMailProcessor): Promise<void> {
	let predictionArray: number[] = []
	for (let mail of mails) {
		const vector = await spamMailProcessor.makeModelInput(CURRENT_SPACE_FOR_SERVER_RESULT, mail)
		const prediction = await classifier.predict(vector, TEST_OWNER_GROUP)
		predictionArray.push(prediction ? 1 : 0)
	}
	const ysArray = mails.map((mail) => mail.spamDecision === SpamDecision.BLACKLIST)

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
