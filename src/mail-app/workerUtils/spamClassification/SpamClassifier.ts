import { OfflineStoragePersistence } from "../index/OfflineStoragePersistence"
import { assertWorkerOrNode } from "../../../common/api/common/Env"
import * as tf from "@tensorflow/tfjs"
//import * as tf from "@tensorflow/tfjs-node"
import { assertNotNull, promiseMap } from "@tutao/tutanota-utils"
import { DynamicTfVectorizer } from "./DynamicTfVectorizer"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"

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
	private dynamicTfVectorizer: Nullable<DynamicTfVectorizer> = null
	public isEnabled: boolean = false

	constructor(private readonly offlineStorage: OfflineStoragePersistence) {}

	public async initialize() {
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
		}

		await this.loadModel()

		if (!this.classifier) {
			console.log("No existing model found. Training from scratch...")
			const data = await assertNotNull(this.offlineStorage).getAllSpamClassificationTrainingData()
			await this.initialTraining(data)
			//await this.saveModel()
			return true
		} else {
			this.isEnabled = true
		}
	}

	public async updateModel(cutoffTimestamp: number, testRatio = 0.2): Promise<boolean> {
		try {
			if (!this.isEnabled) {
				console.warn("Client spam classification is not enabled or there were errors during training")
				return false
			} else if (!this.dynamicTfVectorizer) {
				console.warn("No vectorizer found. Make sure you call initialTraining first")
				return false
			}

			const newTrainingData = await assertNotNull(this.offlineStorage).getSpamClassificationTrainingDataAfterCutoff(cutoffTimestamp)
			if (newTrainingData.length === 0) {
				console.log("No new training data since last update.")
				return false
			}

			console.log(`Retraining model with ${newTrainingData.length} new samples (lastModified > ${new Date(cutoffTimestamp).toString()})`)
			const batchDocuments: string[] = []
			for (let i = 0; i < newTrainingData.length; i++) {
				batchDocuments.push(this.sanitizeModelInput(newTrainingData[i].subject, newTrainingData[i].body))
			}

			// we have offline storage at this point. see WorkerLocator.initializeSpamClassificationTrainingIfEnabled
			const tokenizedBatchDocuments = await promiseMap(batchDocuments, (d) => assertNotNull(this.offlineStorage).tokenize(d))
			const vectors = this.dynamicTfVectorizer.refitTransform(tokenizedBatchDocuments)
			if (vectors == null) {
				// todo drop and retrain the entire model from scratch!
				return false
			} else {
				//const vectors = this.hashingVectorizer.transform(tokenizedBatchDocuments)
				const xs = tf.tensor2d(vectors, [vectors.length, this.dynamicTfVectorizer.featureVectorDimension])
				//const xs = tf.tensor2d(vectors, [vectors.length, this.hashingVectorizer.dimension])
				const ys = tf.tensor1d(newTrainingData.map((d: SpamClassificationRow) => (d.isSpam ? 1 : 0)))

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
	public async initialTraining(data: SpamClassificationRow[]): Promise<void> {
		const documents = data.map((d) => this.sanitizeModelInput(d.subject, d.body))
		const tokenizedDocuments = await promiseMap(documents, (d) => assertNotNull(this.offlineStorage).tokenize(d))

		this.dynamicTfVectorizer = new DynamicTfVectorizer(new Set(), true)
		this.dynamicTfVectorizer.buildInitialTokenVocabulary(tokenizedDocuments)
		const vectors = this.dynamicTfVectorizer.transform(tokenizedDocuments)

		const xs = tf.tensor2d(vectors, [vectors.length, this.dynamicTfVectorizer.featureVectorDimension])
		const ys = tf.tensor1d(data.map((d) => (d.isSpam ? 1 : 0)))

		this.classifier = this.buildModel(xs.shape[1]) // our vocabulary length
		await this.classifier.fit(xs, ys, { epochs: 5, batchSize: 32, shuffle: false })

		console.log(`### Finished Training ### Total size: ${data.length}`)
	}

	public async predict(subjectAndBody: string): Promise<boolean> {
		if (!this.isEnabled) {
			console.error("Classifier not found or client classificat is not enabled")
			await this.updateModel(0)
			return false
		} else if (!this.dynamicTfVectorizer) {
			console.error("Vectorizer not found.")
			return false
		}

		const tokenizedMail = await assertNotNull(this.offlineStorage).tokenize(subjectAndBody)
		const vectors = this.dynamicTfVectorizer.transform([tokenizedMail])
		const xs = tf.tensor2d(vectors, [vectors.length, this.dynamicTfVectorizer.featureVectorDimension])
		const pred = (await (assertNotNull(this.classifier).predict(xs) as tf.Tensor).data())[0]

		return pred > 0.5
	}

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

	private sanitizeModelInput(subject: string | null | undefined, body: string | null | undefined) {
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
				kernelInitializer: tf.initializers.glorotUniform({ seed: 42 }),
				biasInitializer: tf.initializers.zeros(),
			}),
		)
		model.add(tf.layers.dropout({ rate: 0.2, seed: 42 }))
		model.add(
			tf.layers.dense({
				units: 1,
				activation: "sigmoid",
				kernelInitializer: tf.initializers.glorotUniform({ seed: 42 }),
				biasInitializer: tf.initializers.zeros(),
			}),
		)
		model.compile({ optimizer: "adam", loss: "binaryCrossentropy", metrics: ["accuracy"] })
		return model
	}

	// PERSISTENCE
	// fixme we're now saving the same information in 3 places (mail_index, spam_classification in OfflineStoragePersistence + mail and details in OfflineStorage).
	// fixme on current master we only have 2 places (mail index table + mail and details in odb). This is unnecessary and should be optimized before merge
	// fixme add IsSpam column to mail_index?
	// private async saveModel(): Promise<void> {
	// 	if (!this.classifier) {
	// 		return
	// 	}
	//
	// 	await this.classifier.save(
	// 		tf.io.withSaveHandler(async (artifacts) => {
	// 			const modelTopology = JSON.stringify(artifacts.modelTopology)
	//
	// 			const weightSpecs = JSON.stringify(artifacts.weightSpecs)
	//
	// 			const weightData = new Uint8Array(artifacts.weightData as ArrayBuffer)
	//
	// 			await this.offlineStorage.putSpamClassificationModel({
	// 				modelTopology,
	// 				weightSpecs,
	// 				weightData,
	// 			})
	//
	// 			return {
	// 				modelArtifactsInfo: {
	// 					dateSaved: new Date(),
	// 					modelTopologyType: "JSON",
	// 				},
	// 			}
	// 		}),
	// 	)
	// }

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
