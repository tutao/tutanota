import { OfflineStoragePersistence } from "../index/OfflineStoragePersistence"
import { assertWorkerOrNode } from "../../../common/api/common/Env"
import * as tf from "@tensorflow/tfjs"
import { promiseMap } from "@tutao/tutanota-utils"
import { HashingVectorizer } from "./HashingVectorizer"

assertWorkerOrNode()

export type SpamClassificationRow = {
	rowid: string
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
	private hashingVectorizer: HashingVectorizer = new HashingVectorizer()

	constructor(private readonly offlineStorage: OfflineStoragePersistence) {}

	public async initialize() {
		await this.loadModel()

		if (!this.classifier) {
			console.log("No existing model found. Training from scratch...")
			await this.initialTraining()
			return true
		}
	}

	public async updateModel(cutoffTimestamp: number, testRatio = 0.2): Promise<boolean> {
		try {
			if (!this.classifier) {
				console.warn("No existing model found. Check if there errors during training")
				return false
			}

			const newTrainingData = await this.offlineStorage.getSpamClassificationTrainingDataAfterCutoff(cutoffTimestamp)
			if (newTrainingData.length === 0) {
				console.log("No new training data since last update.")
				return false
			}

			console.log(`Retraining model with ${newTrainingData.length} new samples (lastModified > ${new Date(cutoffTimestamp).toString()})`)
			const batchDocuments: string[] = []
			for (let i = 0; i < newTrainingData.length; i++) {
				batchDocuments.push(this.sanitizeModelInput(newTrainingData[i].subject, newTrainingData[i].body))
			}

			const tokenizedBatchDocuments = await promiseMap(batchDocuments, (d) => this.offlineStorage.tokenize(d))
			const vectors = this.hashingVectorizer.transform(tokenizedBatchDocuments)
			const xs = tf.tensor2d(vectors, [vectors.length, this.hashingVectorizer.dimension])
			const ys = tf.tensor1d(newTrainingData.map((d: SpamClassificationRow) => (d.isSpam ? 1 : 0)))

			const { xsTrain, ysTrain, xsTest, ysTest } = this.trainTestSplit(xs, ys, testRatio)

			await this.classifier.fit(xsTrain, ysTrain, { epochs: 5, batchSize: 32 })

			if (testRatio > 0 && xsTest.shape[0] > 0) {
				await this.test(xsTest, ysTest)
			}

			await this.saveModel()
			return true
		} catch (e) {
			console.error("Failed when trying to update the model:", e)
			return false
		}
	}

	private async initialTraining(testRatio = 0.2): Promise<void> {
		const data = await this.offlineStorage.getAllSpamClassificationTrainingData()

		const documents = data.map((d) => this.sanitizeModelInput(d.subject, d.body))
		const tokenizedDocuments = await promiseMap(documents, (d) => this.offlineStorage.tokenize(d))
		const vectors = this.hashingVectorizer.transform(tokenizedDocuments)
		const xs = tf.tensor2d(vectors, [vectors.length, this.hashingVectorizer.dimension])
		const ys = tf.tensor1d(data.map((d) => (d.isSpam ? 1 : 0)))

		const { xsTrain, ysTrain, xsTest, ysTest } = this.trainTestSplit(xs, ys, testRatio)
		this.classifier = this.buildModel(xs.shape[1])

		await this.classifier.fit(xsTrain, ysTrain, { epochs: 5, batchSize: 32 })
		if (testRatio > 0 && xsTest.shape[0] > 0) {
			await this.test(xsTest, ysTest)
		}
		await this.saveModel()

		console.log(`### Finished Training ### Total size: ${data.length}, train set size: ${ysTrain.shape}, test set size: ${ysTest.shape}`)
	}

	public async predict(subjectAndBody: string): Promise<boolean> {
		if (!this.classifier) {
			await this.loadModel()
		}

		if (!this.classifier) {
			console.error("Classifier not found.")
			await this.updateModel(0)
			return false
		}

		const tokenizedInput = await this.offlineStorage.tokenize(subjectAndBody)
		const vector = this.hashingVectorizer.vectorize(tokenizedInput)
		const xs = tf.tensor2d([vector], [1, vector.length])
		const pred = (await (this.classifier.predict(xs) as tf.Tensor).data())[0]

		return pred > 0.5
	}

	private async test(xsTest: tf.Tensor2D, ysTest: tf.Tensor1D): Promise<void> {
		if (!this.classifier) {
			throw new Error("Model not loaded")
		}

		const predsTensor = this.classifier.predict(xsTest) as tf.Tensor
		const predsArray = Array.from(await predsTensor.data()) as number[]
		const ysArray = Array.from(await ysTest.data()) as number[]

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
		console.table({
			Predicted_Spam: { Actual_Spam: tp, Actual_Ham: fp },
			Predicted_Ham: { Actual_Spam: fn, Actual_Ham: tn },
		})
	}

	private trainTestSplit(
		xs: tf.Tensor2D,
		ys: tf.Tensor1D,
		testRatio: number,
	): {
		xsTrain: tf.Tensor2D
		ysTrain: tf.Tensor1D
		xsTest: tf.Tensor2D
		ysTest: tf.Tensor1D
	} {
		const numSamples = xs.shape[0]
		const indices = tf.util.createShuffledIndices(numSamples)

		const testSize = Math.floor(numSamples * testRatio)
		const trainSize = numSamples - testSize

		const trainIndicesArray = Array.from(indices.slice(0, trainSize))
		const testIndicesArray = Array.from(indices.slice(trainSize))

		const trainIndices = tf.tensor1d(trainIndicesArray, "int32")
		const testIndices = tf.tensor1d(testIndicesArray, "int32")

		const xsTrain = tf.gather(xs, trainIndices)
		const ysTrain = tf.gather(ys, trainIndices)
		const xsTest = tf.gather(xs, testIndices)
		const ysTest = tf.gather(ys, testIndices)

		return { xsTrain, ysTrain, xsTest, ysTest }
	}

	private sanitizeModelInput(subject: string | null | undefined, body: string | null | undefined) {
		const s = subject || ""
		const b = body || ""
		const text = `${s} ${b}`.trim()
		return text.length > 0 ? text : " "
	}

	private buildModel(inputDim: number): tf.LayersModel {
		const model = tf.sequential()
		model.add(tf.layers.dense({ inputShape: [inputDim], units: 128, activation: "relu" }))
		model.add(tf.layers.dropout({ rate: 0.2 }))
		model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }))
		model.compile({ optimizer: "adam", loss: "binaryCrossentropy", metrics: ["accuracy"] })
		return model
	}

	// PERSISTENCE
	// fixme we're now saving the same information in 3 places (mail_index, spam_classification in OfflineStoragePersistence + mail and details in OfflineStorage).
	// fixme on current master we only have 2 places (mail index table + mail and details in odb). This is unnecessary and should be optimized before merge
	// fixme add IsSpam column to mail_index?
	private async saveModel(): Promise<void> {
		if (!this.classifier) {
			return
		}

		await this.classifier.save(
			tf.io.withSaveHandler(async (artifacts) => {
				const modelTopology = JSON.stringify(artifacts.modelTopology)

				const weightSpecs = JSON.stringify(artifacts.weightSpecs)

				const weightData = new Uint8Array(artifacts.weightData as ArrayBuffer)

				await this.offlineStorage.putSpamClassificationModel({
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
		const model = await this.offlineStorage.getSpamClassificationModel()
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
