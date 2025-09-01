import { OfflineStoragePersistence } from "../index/OfflineStoragePersistence"
import { assertWorkerOrNode } from "../../../common/api/common/Env"
// @ts-ignore[untyped-import]
import * as tf from "@tensorflow/tfjs"
// @ts-ignore[untyped-import]
import { Corpus, Document } from "tiny-tfidf"

assertWorkerOrNode()

// fixme try different models/libraries
// fixme determine training frequency (currently it is trained on every move to/out of spam)

export type SpamClassificationRow = {
	listId: string
	elementId: string
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
	private corpus: Corpus | null = null
	private documents: Map<string, string> = new Map<string, string>()

	constructor(private readonly offlineStorage: OfflineStoragePersistence) {}

	public async updateModel(cutoffTimestamp: number, testRatio = 0.2): Promise<boolean> {
		try {
			await this.loadModel()
			await this.loadTokenizerFromOfflineDb()

			if (!this.classifier) {
				console.log("No existing model found. Training from scratch...")
				await this.train(testRatio)
				return false
			}

			if (!this.corpus) {
				console.error("Corpus is null. Cannot retrain.")
				return false
			}

			const newTrainingData = await this.offlineStorage.getSpamClassificationTrainingDataAfterCutoff(cutoffTimestamp)
			if (newTrainingData.length === 0) {
				console.log("No new training data since last update.")
				return false
			}

			console.log(`Retraining model with ${newTrainingData.length} new samples (lastModified > ${new Date(cutoffTimestamp).toString()})`)
			const batchDocumentIds: string[] = []
			for (let i = 0; i < newTrainingData.length; i++) {
				batchDocumentIds.push(`${newTrainingData[i].listId}/${newTrainingData[i].elementId}`)
			}

			const xs = this.buildTfIdfMatrix(batchDocumentIds)
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

	private async train(testRatio = 0.2): Promise<void> {
		const data = await this.offlineStorage.getAllSpamClassificationTrainingData()

		const xs = this.buildTfIdfMatrix(Array.from(this.documents.keys()))
		const ys = tf.tensor1d(data.map((d) => (d.isSpam ? 1 : 0)))

		const { xsTrain, ysTrain, xsTest, ysTest } = this.trainTestSplit(xs, ys, testRatio)
		console.log(`Total size: ${data.length}, train set size: ${ysTrain.shape}, test set size: ${ysTest.shape}`)

		this.classifier = this.buildModel(xs.shape[1])
		await this.classifier.fit(xsTrain, ysTrain, { epochs: 5, batchSize: 32 })

		if (testRatio > 0 && xsTest.shape[0] > 0) {
			await this.test(xsTest, ysTest)
		}

		await this.saveModel()
	}

	public async predict(subjectAndBody: string): Promise<boolean> {
		if (!this.classifier) {
			await this.loadModel()
		}

		if (!this.corpus) {
			await this.loadTokenizerFromOfflineDb()
		}

		if (!this.classifier || !this.corpus) {
			console.error("Classifier or tokenizer not found.")
			return false
		}

		const vector = this.getTfIdfVectorForQuery(subjectAndBody)
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

	// TF - IDF helpers
	private getTfIdfVector(docId: string): number[] {
		const vectorMap = this.corpus.getDocumentVector(docId)
		const allTerms = this.corpus.getTerms()
		const vector: number[] = []
		for (let i = 0; i < allTerms.length; i++) {
			vector.push(vectorMap.get(allTerms[i]) || 0)
		}
		return vector
	}

	private getTfIdfVectorForQuery(query: string): number[] {
		const text = query.trim().length > 0 ? query.trim() : " "
		const terms = new Document(text).getUniqueTerms()
		const allTerms: string[] = this.corpus!.getTerms()
		const vector: number[] = []

		for (let i = 0; i < allTerms.length; i++) {
			const term = allTerms[i]
			const idf = this.corpus!.getCollectionFrequencyWeight(term) || 0
			const tf = terms.filter((t: string) => t === term).length
			vector.push(idf * tf)
		}
		return vector
	}

	private buildTfIdfMatrix(docIds: string[]): tf.Tensor2D {
		const vectors: number[][] = []
		for (let i = 0; i < docIds.length; i++) {
			vectors.push(this.getTfIdfVector(docIds[i]))
		}
		return tf.tensor2d(vectors, [vectors.length, vectors[0].length])
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

	private async loadTokenizerFromOfflineDb(): Promise<void> {
		const data = await this.offlineStorage.getAllSpamClassificationTrainingData()
		data.map((datum) => {
			this.documents.set(`${datum.listId}/${datum.elementId}`, this.sanitizeModelInput(datum.subject, datum.body))
		})
		this.corpus = new Corpus(Array.from(this.documents.keys()), Array.from(this.documents.values()))
	}
}
