import { OfflineStoragePersistence } from "../index/OfflineStoragePersistence"
import { assertWorkerOrNode } from "../../../common/api/common/Env"
import * as tf from "@tensorflow/tfjs"
import { assertNotNull, isNotNull, promiseMap } from "@tutao/tutanota-utils"
import { DynamicTfVectorizer } from "./DynamicTfVectorizer"
import { HashingVectorizer } from "./HashingVectorizer"
import { htmlToText } from "../../../common/api/worker/search/IndexUtils"
import {
	BITCOIN_PATTERN_TOKEN,
	BITCOIN_REGEX,
	CREDIT_CARD_REGEX,
	CREDIT_CARD_TOKEN,
	DATE_PATTERN_TOKEN,
	DATE_REGEX,
	EMAIL_ADDR_PATTERN,
	EMAIL_ADDR_PATTERN_TOKEN,
	NUMBER_SEQUENCE_REGEX,
	NUMBER_SEQUENCE_TOKEN,
	SPECIAL_CHARACTER_REGEX,
	SPECIAL_CHARACTER_TOKEN,
	URL_PATTERN,
	URL_PATTERN_TOKEN,
} from "./PreprocessPatterns"
import { random } from "@tutao/tutanota-crypto"
import { SpamClassificationInitializer } from "./SpamClassificationInitializer"

assertWorkerOrNode()

export type SpamClassificationModel = {
	modelTopology: string
	weightSpecs: string
	weightData: Uint8Array
}

export type SpamTrainMailDatum = {
	mailId: IdTuple
	subject: string
	body: string
	isSpam: boolean
	isCertain: boolean
}

export type SpamPredMailDatum = {
	subject: string
	body: string
}

const PREDICTION_THRESHOLD = 0.5

export type PreprocessConfiguration = {
	isPreprocessMails: boolean
	isRemoveHTML: boolean
	isReplaceDates: boolean
	isReplaceUrls: boolean
	isReplaceMailAddresses: boolean
	isReplaceBitcoinAddress: boolean
	isReplaceCreditCards: boolean
	isReplaceNumbers: boolean
	isReplaceSpecialCharacters: boolean
}

const DEFAULT_PREPROCESS_CONFIGURATION = {
	isPreprocessMails: true,
	isRemoveHTML: true,
	isReplaceDates: true,
	isReplaceUrls: true,
	isReplaceMailAddresses: true,
	isReplaceBitcoinAddress: true,
	isReplaceCreditCards: true,
	isReplaceNumbers: true,
	isReplaceSpecialCharacters: true,
}

export class SpamClassifier {
	public isEnabled: boolean = false

	private classifier: tf.LayersModel | null = null
	private vectorizer: DynamicTfVectorizer | HashingVectorizer = new HashingVectorizer()

	constructor(
		private readonly offlineStorage: OfflineStoragePersistence | null,
		private readonly initializer: SpamClassificationInitializer,
		private readonly deterministic: boolean = false,
		private readonly preprocessConfiguration: PreprocessConfiguration = DEFAULT_PREPROCESS_CONFIGURATION,
	) {}

	public async initialize(): Promise<void> {
		await this.loadModel()
		if (isNotNull(this.classifier)) {
			console.log("Loaded existing spam classification model from database")
			this.isEnabled = true
			return
		}

		console.log("No existing model found. Training from scratch...")
		const data: Array<SpamTrainMailDatum> = (await this.initializer.init()).filter((classificationData) => classificationData.isCertain)
		await this.initialTraining(data)
		await this.saveModel()
		this.isEnabled = true
	}

	// visibleForTesting
	public preprocessMail(mail: SpamTrainMailDatum | SpamPredMailDatum): string {
		const mailText = this.concatSubjectAndBody(mail)

		if (!this.preprocessConfiguration.isPreprocessMails) {
			return mailText
		}

		let preprocessedMail = mailText

		// 1. Remove HTML code
		if (this.preprocessConfiguration.isRemoveHTML) {
			preprocessedMail = htmlToText(preprocessedMail)
		}

		// 2. Replace dates
		if (this.preprocessConfiguration.isReplaceDates) {
			for (const datePattern of DATE_REGEX) {
				preprocessedMail = preprocessedMail.replaceAll(datePattern, DATE_PATTERN_TOKEN)
			}
		}

		// 3. Replace urls
		if (this.preprocessConfiguration.isReplaceUrls) {
			preprocessedMail = preprocessedMail.replaceAll(URL_PATTERN, URL_PATTERN_TOKEN)
		}

		// 4. Replace email addresses
		if (this.preprocessConfiguration.isReplaceMailAddresses) {
			preprocessedMail = preprocessedMail.replaceAll(EMAIL_ADDR_PATTERN, EMAIL_ADDR_PATTERN_TOKEN)
		}

		// 5. Replace Bitcoin addresses
		if (this.preprocessConfiguration.isReplaceBitcoinAddress) {
			preprocessedMail = preprocessedMail.replaceAll(BITCOIN_REGEX, BITCOIN_PATTERN_TOKEN)
		}

		// 6. Replace credit card numbers
		if (this.preprocessConfiguration.isReplaceCreditCards) {
			preprocessedMail = preprocessedMail.replaceAll(CREDIT_CARD_REGEX, CREDIT_CARD_TOKEN)
		}

		// 7. Replace remaining numbers
		if (this.preprocessConfiguration.isReplaceNumbers) {
			preprocessedMail = preprocessedMail.replaceAll(NUMBER_SEQUENCE_REGEX, NUMBER_SEQUENCE_TOKEN)
		}

		// 8. Remove special characters
		if (this.preprocessConfiguration.isReplaceSpecialCharacters) {
			preprocessedMail = preprocessedMail.replaceAll(SPECIAL_CHARACTER_REGEX, SPECIAL_CHARACTER_TOKEN)
		}

		return preprocessedMail
	}

	public async initialTraining(mails: SpamTrainMailDatum[]): Promise<void> {
		const notPreprocessedMails = mails.map((mail) => this.concatSubjectAndBody(mail))
		const preprocessedMails = mails.map((mail) => this.preprocessMail(mail))

		const tokenizedMailsNotPreprocessed = await promiseMap(notPreprocessedMails, (notPreprocessedMail) =>
			assertNotNull(this.offlineStorage).tokenize(notPreprocessedMail),
		)
		const tokenizedMails = await promiseMap(preprocessedMails, (preprocessedMail) => assertNotNull(this.offlineStorage).tokenize(preprocessedMail))

		const flatTokens = tokenizedMails.flat()
		const uniqueTokenSet = new Set(flatTokens)
		const flatTokenNotPreprocessed = tokenizedMailsNotPreprocessed.flat()
		const uniqueTokenSetNotPreprocessed = new Set(flatTokenNotPreprocessed)
		console.log(`Vocabulary size not unique (not preprocessed): ${flatTokenNotPreprocessed.length}`)
		console.log(`Vocabulary size unique (not preprocessed): ${uniqueTokenSetNotPreprocessed.size}`)
		console.log(`Vocabulary size not unique: ${flatTokens.length}`)
		console.log(`Vocabulary size unique: ${uniqueTokenSet.size}`)

		if (this.vectorizer instanceof DynamicTfVectorizer) {
			this.vectorizer.buildInitialTokenVocabulary(tokenizedMails)
		}

		const vectors = await this.vectorizer.transform(tokenizedMails)

		const xs = tf.tensor2d(vectors, [vectors.length, this.vectorizer.dimension])
		const ys = tf.tensor1d(mails.map((mail) => (mail.isSpam ? 1 : 0)))

		this.classifier = this.buildModel(this.vectorizer.dimension)
		await this.classifier.fit(xs, ys, { epochs: 16, batchSize: 128, shuffle: true })

		console.log(`### Finished Initial Training ### (total trained mails: ${mails.length})`)
	}

	public async updateModel(cutoffTimestamp: number): Promise<boolean> {
		try {
			if (!this.isEnabled) {
				console.warn("Client spam classification is not enabled or there were errors during training")
				return false
			}

			const newTrainingMails = await assertNotNull(this.offlineStorage).getCertainSpamClassificationTrainingDataAfterCutoff(cutoffTimestamp)
			if (newTrainingMails.length === 0) {
				console.log("No new training data since last update.")
				return false
			}

			const retrainingStart = performance.now()
			console.log(`Retraining model with ${newTrainingMails.length} new mails (lastModified > ${new Date(cutoffTimestamp).toString()})`)
			const mailBatch: string[] = []
			for (const newTrainingMail of newTrainingMails) {
				const preprocessedMail = this.preprocessMail(newTrainingMail)
				mailBatch.push(preprocessedMail)
			}

			// we have offline storage at this point. see WorkerLocator.initializeSpamClassificationTrainingIfEnabled
			const tokenizedMailBatch = await promiseMap(mailBatch, (preprocessedMail) => assertNotNull(this.offlineStorage).tokenize(preprocessedMail))
			// const vectors = this.dynamicTfVectorizer.refitTransform(tokenizedMailBatch)
			const vectors = await this.vectorizer.transform(tokenizedMailBatch)
			const xs = tf.tensor2d(vectors, [vectors.length, this.vectorizer.dimension])
			const ys = tf.tensor1d(newTrainingMails.map((mail) => (mail.isSpam ? 1 : 0)))

			// Avoid potentially running .predict() at the same time while we are re-fitting
			this.isEnabled = false
			await assertNotNull(this.classifier).fit(xs, ys, { epochs: 5, batchSize: 32, shuffle: true })
			this.isEnabled = true

			console.log(`Retraining finished. Took: ${performance.now() - retrainingStart}ms`)
			return true
		} catch (e) {
			console.error("Failed trying to update the model: ", e)
			return false
		}
	}

	// visibleForTesting
	public async predict(spamPredMailDatum: SpamPredMailDatum): Promise<boolean> {
		if (!this.isEnabled) {
			throw new Error("SpamClassifier is not enabled yet")
		}

		const preprocessedMail = this.preprocessMail(spamPredMailDatum)
		const tokenizedMail = await assertNotNull(this.offlineStorage).tokenize(preprocessedMail)
		const vectors = await assertNotNull(this.vectorizer).transform([tokenizedMail])

		const xs = tf.tensor2d(vectors, [vectors.length, assertNotNull(this.vectorizer).dimension])
		const predictionTensor = assertNotNull(this.classifier).predict(xs) as tf.Tensor
		const predictionData = await predictionTensor.data()
		const prediction = predictionData[0]

		return prediction > PREDICTION_THRESHOLD
	}

	// FIXME
	public async test(mails: SpamTrainMailDatum[]): Promise<void> {
		if (!this.classifier) {
			throw new Error("Model has not been loaded")
		}

		let predictionArray: number[] = []
		for (let mail of mails) {
			const prediction = await this.predict(mail)
			predictionArray.push(prediction ? 1 : 0)
		}
		const ysArray = mails.map((mail) => (mail.isSpam ? 1 : 0))

		let tp = 0,
			tn = 0,
			fp = 0,
			fn = 0

		for (let i = 0; i < predictionArray.length; i++) {
			const pred = predictionArray[i] > 0.5 ? 1 : 0
			const actual = ysArray[i]
			if (pred === 1 && actual === 1) tp++
			else if (pred === 0 && actual === 0) tn++
			else if (pred === 1 && actual === 0) fp++
			else if (pred === 0 && actual === 1) fn++
		}

		const total = tp + tn + fp + fn
		const accuracy = (tp + tn) / total
		const precision = tp / (tp + fp + 1e-7)
		const recall = tp / (tp + fn + 1e-7)
		const f1 = 2 * ((precision * recall) / (precision + recall + 1e-7))

		console.log("\n--- Evaluation Metrics ---")
		console.log(`Accuracy: 	${(accuracy * 100).toFixed(2)}%`)
		console.log(`Precision: ${(precision * 100).toFixed(2)}%`)
		console.log(`Recall: 	${(recall * 100).toFixed(2)}%`)
		console.log(`F1 Score: 	${(f1 * 100).toFixed(2)}%`)
		console.log("\nConfusion Matrix:")
		console.log({
			Predicted_Spam: { True_Positive: tp, False_Positive: fp },
			Predicted_Ham: { False_Negative: fn, True_Negative: tn },
		})
	}

	// visibleForTesting
	public buildModel(inputDimension: number): tf.LayersModel {
		const model = tf.sequential()
		model.add(
			tf.layers.dense({
				inputShape: [inputDimension],
				units: 128,
				activation: "relu",
				kernelInitializer: tf.initializers.glorotUniform({ seed: this.deterministic ? 42 : random.generateRandomNumber(4) }),
			}),
		)
		model.add(
			tf.layers.dropout({
				rate: 0.2,
				seed: this.deterministic ? 42 : random.generateRandomNumber(4),
			}),
		)
		model.add(
			tf.layers.dense({
				units: 1,
				activation: "sigmoid",
				kernelInitializer: tf.initializers.glorotUniform({ seed: this.deterministic ? 42 : random.generateRandomNumber(4) }),
			}),
		)
		model.compile({ optimizer: "adam", loss: "binaryCrossentropy", metrics: ["accuracy"] })
		return model
	}

	public async saveModel(): Promise<void> {
		if (!this.classifier) {
			throw new Error("Model is not available, and therefore can not be saved")
		}

		await this.classifier.save(
			tf.io.withSaveHandler(async (artifacts) => {
				const modelTopology = JSON.stringify(artifacts.modelTopology)
				const weightSpecs = JSON.stringify(artifacts.weightSpecs)
				const weightData = new Uint8Array(artifacts.weightData as ArrayBuffer)

				await assertNotNull(this.offlineStorage).putSpamClassificationModel({
					modelTopology,
					weightSpecs,
					weightData,
				})

				return {
					modelArtifactsInfo: {
						dateSaved: new Date(),
						modelTopologyType: "JSON",
					},
				}
			}),
		)
	}

	private async loadModel(): Promise<void> {
		const model = await assertNotNull(this.offlineStorage).getSpamClassificationModel()
		if (model) {
			const modelTopology = JSON.parse(model.modelTopology)
			const weightSpecs = JSON.parse(model.weightSpecs)
			const weightData = model.weightData.buffer.slice(model.weightData.byteOffset, model.weightData.byteOffset + model.weightData.byteLength)
			this.classifier = await tf.loadLayersModel(
				tf.io.fromMemory({
					modelTopology,
					weightSpecs,
					weightData,
				}),
			)
			this.classifier.compile({
				optimizer: "adam",
				loss: "binaryCrossentropy",
				metrics: ["accuracy"],
			})
		} else {
			console.error("Loading the model from offline db failed")
			this.classifier = null
		}
	}

	private concatSubjectAndBody(mail: SpamTrainMailDatum | SpamPredMailDatum) {
		const subject = mail.subject || ""
		const body = mail.body || ""
		const concatenated = `${subject} ${body}`.trim()
		return concatenated.length > 0 ? concatenated : " "
	}
}
