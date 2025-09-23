import { OfflineStoragePersistence } from "../index/OfflineStoragePersistence"
import { assertWorkerOrNode } from "../../../common/api/common/Env"
import * as tf from "@tensorflow/tfjs"
import { assertNotNull, promiseMap } from "@tutao/tutanota-utils"
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
	EMAIL_ADDR_PATTERN_TOKEN,
	SPECIAL_CHARACTER_REGEX,
	SPECIAL_CHARACTER_TOKEN,
	URL_PATTERN_TOKEN,
} from "./PreprocessPatterns"
import { DOMAIN_REGEX, EMAIL_ADDR_REGEX } from "../../../common/misc/FormatValidator"
import { random } from "@tutao/tutanota-crypto"
import { SpamClassificationInitializer } from "./SpamClassificationInitializer"
import { getMailBodyText } from "../../../common/api/common/CommonMailUtils"

assertWorkerOrNode()

export type SpamClassificationRow = {
	subject: string
	body: string
	isSpam: boolean
}

export type SpamClassificationModel = {
	modelTopology: string
	weightSpecs: string
	weightData: Uint8Array
}

export class SpamClassifier {
	private classifier: tf.LayersModel | null = null
	public isEnabled: boolean = false
	private vectorizer: DynamicTfVectorizer | HashingVectorizer = new HashingVectorizer()

	constructor(
		private readonly offlineStorage: OfflineStoragePersistence | null,
		private readonly initializer: SpamClassificationInitializer,
		private readonly isPreprocessMails: boolean = true,
		private readonly isRemoveHTML: boolean = true,
		private readonly deterministic: boolean = false,
	) {}

	public async initialize(indexingDone: Promise<void>): Promise<void> {
		await this.loadModel()

		if (!this.classifier) {
			console.log("No existing model found. Training from scratch...")

			// Wait until indexing is done, as its populate offlineDb
			await indexingDone
			const data: Array<SpamClassificationRow> = (await this.initializer.init())
				.filter((classificationData) => classificationData.isCertain)
				.map((classificationData) => {
					return {
						subject: classificationData.mail.subject,
						body: getMailBodyText(classificationData.mailDetails.body),
						isSpam: classificationData.isSpam,
					}
				})
			await this.initialTraining(data)
			await this.saveModel()
			this.isEnabled = true
		} else {
			this.isEnabled = true
		}
	}

	public preprocessMail(subjectAndBody: string): string {
		if (!this.isPreprocessMails) {
			return subjectAndBody
		}

		let preprocessedMail = subjectAndBody

		// 1. Remove HTML code
		if (this.isRemoveHTML) {
			preprocessedMail = htmlToText(preprocessedMail)
		}

		// 2. Replace dates
		for (const datePattern of DATE_REGEX) {
			preprocessedMail = preprocessedMail.replaceAll(datePattern, DATE_PATTERN_TOKEN)
		}

		// 3. Replace urls
		preprocessedMail = preprocessedMail.replaceAll(DOMAIN_REGEX, URL_PATTERN_TOKEN)

		// 4. Replace email addresses
		preprocessedMail = preprocessedMail.replaceAll(EMAIL_ADDR_REGEX, EMAIL_ADDR_PATTERN_TOKEN)

		// 5. Replace Bitcoin addresses
		preprocessedMail = preprocessedMail.replaceAll(BITCOIN_REGEX, BITCOIN_PATTERN_TOKEN)

		// 6. Replace credit card numbers
		preprocessedMail = preprocessedMail.replaceAll(CREDIT_CARD_REGEX, CREDIT_CARD_TOKEN)

		// // 7. Replace remaining numbers
		// preprocessedMail = preprocessedMail.replaceAll(NUMBER_SEQUENCE_REGEX, NUMBER_SEQUENCE_TOKEN)

		// 8. Remove special characters
		preprocessedMail = preprocessedMail.replaceAll(SPECIAL_CHARACTER_REGEX, SPECIAL_CHARACTER_TOKEN)

		// // 9. Replace unreadable expressions
		// preprocessedMail = preprocessedMail.replaceAll(UNREADABLE_SEQUENCE_REGEX, UNREADABLE_SEQUENCE_TOKEN)

		return preprocessedMail
	}

	public async initialTraining(mails: SpamClassificationRow[]): Promise<void> {
		const preprocessedMails = mails.map((mail) => {
			return this.preprocessMail(this.concatSubjectAndBody(mail.subject, mail.body))
		})
		const tokenizedMails = await promiseMap(preprocessedMails, (d) => assertNotNull(this.offlineStorage).tokenize(d))

		const flatTokens = tokenizedMails.flat().join("\n")

		//FIXME remove this line
		fs.writeFileSync("/tmp/with_preprocess.txt", flatTokens, "utf-8")

		if (this.vectorizer instanceof DynamicTfVectorizer) {
			this.vectorizer.buildInitialTokenVocabulary(tokenizedMails)
		}
		const vectors = await this.vectorizer.transform(tokenizedMails)

		const xs = tf.tensor2d(vectors, [vectors.length, this.vectorizer.dimension])
		const ys = tf.tensor1d(mails.map((d) => (d.isSpam ? 1 : 0)))

		this.classifier = this.buildModel(xs.shape[1]) // our vocabulary length
		await this.classifier.fit(xs, ys, { epochs: 5, batchSize: 32, shuffle: false })

		console.log(`### Finished Training ### Total size: ${mails.length}`)
	}

	public async updateModel(cutoffTimestamp: number, testRatio = 0.2): Promise<boolean> {
		try {
			if (!this.isEnabled) {
				console.warn("Client spam classification is not enabled or there were errors during training")
				return false
			}

			const newTrainingData = await assertNotNull(this.offlineStorage).getSpamClassificationTrainingDataAfterCutoff(cutoffTimestamp)
			if (newTrainingData.length === 0) {
				console.log("No new training data since last update.")
				return false
			}

			console.log(`Retraining model with ${newTrainingData.length} new samples (lastModified > ${new Date(cutoffTimestamp).toString()})`)
			const mailBatch: string[] = []
			for (let i = 0; i < newTrainingData.length; i++) {
				mailBatch.push(this.preprocessMail(this.concatSubjectAndBody(newTrainingData[i].subject, newTrainingData[i].body)))
			}

			// we have offline storage at this point. see WorkerLocator.initializeSpamClassificationTrainingIfEnabled
			const tokenizedMailBatch = await promiseMap(mailBatch, (d) => assertNotNull(this.offlineStorage).tokenize(d))
			//const vectors = this.dynamicTfVectorizer.refitTransform(tokenizedMailBatch)
			const vectors = await this.vectorizer.transform(tokenizedMailBatch)
			if (vectors == null) {
				// todo drop and retrain the entire model from scratch!
				return false
			} else {
				//const vectors = this.hashingVectorizer.transform(tokenizedMailBatch)
				const xs = tf.tensor2d(vectors, [vectors.length, this.vectorizer.dimension])
				//const xs = tf.tensor2d(vectors, [vectors.length, this.hashingVectorizer.dimension])
				const ys = tf.tensor1d(newTrainingData.map((mail: SpamClassificationRow) => (mail.isSpam ? 1 : 0)))

				await assertNotNull(this.classifier).fit(xs, ys, { epochs: 5, batchSize: 32 })

				// await this.saveModel()
				return true
			}
		} catch (e) {
			console.error("Failed when trying to update the model:", e)
			return false
		}
	}

	// visibleForTesting
	public async predict(subjectAndBody: string): Promise<boolean> {
		if (!this.isEnabled) {
			throw new Error("SpamClassifier is not enabled yet")
		}

		const preprocessedMail = this.preprocessMail(subjectAndBody)
		const tokenizedMail = await assertNotNull(this.offlineStorage).tokenize(preprocessedMail)
		// const vectors = this.dynamicTfVectorizer.transform([tokenizedMail])
		const vectors = await assertNotNull(this.vectorizer).transform([tokenizedMail])

		const xs = tf.tensor2d(vectors, [vectors.length, assertNotNull(this.vectorizer).dimension])
		const pred = (await (assertNotNull(this.classifier).predict(xs) as tf.Tensor).data())[0]

		return pred > 0.5
	}

	// TODO:
	// Move to SpamClassifierTest.ts after beta stage
	public async test(data: SpamClassificationRow[]): Promise<void> {
		if (!this.classifier) {
			throw new Error("Model not loaded")
		}

		let predsArray: number[] = []
		for (let row of data) {
			const prediction = await this.predict(`${row.subject} ${row.body}`)
			predsArray.push(prediction ? 1 : 0)
		}
		const ysArray = data.map((row) => (row.isSpam ? 1 : 0))

		let tp = 0,
			tn = 0,
			fp = 0,
			fn = 0

		for (let i = 0; i < predsArray.length; i++) {
			const pred = predsArray[i] > 0.5 ? 1 : 0
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
		console.log(`Accuracy: ${(accuracy * 100).toFixed(2)}%`)
		console.log(`Precision: ${(precision * 100).toFixed(2)}%`)
		console.log(`Recall: ${(recall * 100).toFixed(2)}%`)
		console.log(`F1 Score: ${(f1 * 100).toFixed(2)}%`)
		console.log("\nConfusion Matrix:")
		console.log({
			Predicted_Spam: { True_Positive: tp, False_Positive: fp },
			Predicted_Ham: { False_Negative: fn, True_Negative: tn },
		})
	}

	private concatSubjectAndBody(subject: string | null | undefined, body: string | null | undefined) {
		const s = subject || ""
		const b = body || ""
		const text = `${s} ${b}`.trim()
		return text.length > 0 ? text : " "
	}

	private buildModel(inputDim: number): tf.LayersModel {
		const model = tf.sequential()
		// TODO experiment with a different arguments, meaning the file names.
		// TODO experiment with different layers and try to understand it
		model.add(
			tf.layers.dense({
				inputShape: [inputDim],
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

	private async saveModel(): Promise<void> {
		if (!this.classifier) {
			return
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
}
