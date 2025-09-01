import { OfflineStoragePersistence } from "../index/OfflineStoragePersistence"
import { FileFacade } from "../../../common/native/common/generatedipc/FileFacade"
import { stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { assertWorkerOrNode } from "../../../common/api/common/Env"
// @ts-ignore[untyped-import]
import * as tf from "@tensorflow/tfjs"
// @ts-ignore[untyped-import]
import { Corpus, Document } from "tiny-tfidf"

assertWorkerOrNode()

// fixme try different models/libraries
// fixme add retraining of existing model
// fixme determine training frequency (currently it is trained on every move to spam)

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
	private readonly modelFilename = "spam_classification_model"
	private corpus: Corpus | null = null
	private documentIds: string[] = []

	constructor(
		private readonly offlineStorage: OfflineStoragePersistence,
		private readonly fileFacade: FileFacade,
	) {}

	public async train(userId: string, testRatio = 0.0): Promise<void> {
		const data = await this.offlineStorage.getSpamMailClassifications()

		const { trainSet, testSet } = this.trainTestSplit(data, testRatio)
		console.log(`Total size: ${data.length}, train set size: ${trainSet.length}, test set size: ${testSet.length}`)

		const trainTexts: string[] = []
		this.documentIds = []
		for (let i = 0; i < trainSet.length; i++) {
			trainTexts.push(this.sanitizeModelInput(trainSet[i].subject, trainSet[i].body))
			this.documentIds.push(`${trainSet[i].listId}/${trainSet[i].elementId}`)
		}

		this.corpus = new Corpus(this.documentIds, trainTexts)

		const xs = this.buildTfIdfMatrix(this.corpus, this.documentIds)
		const ys = tf.tensor1d(trainSet.map((d) => (d.isSpam ? 1 : 0)))

		this.classifier = this.buildModel(xs.shape[1])
		await this.classifier.fit(xs, ys, { epochs: 5, batchSize: 32 })

		// fixme should we have train-test split at all? If yes, the corpus sizes don't match
		// fixme either apply the same split while loadTokenizerFromOfflineDb (but corpora are not guaranteed to be same?)
		// await this.test(testSet)

		await this.saveModel(userId)
	}

	public async predict(subjectAndBody: string, userId: string): Promise<boolean> {
		if (!this.classifier) {
			await this.loadModel(userId)
		}

		if (!this.corpus) {
			await this.loadTokenizerFromOfflineDb()
		}

		if (!this.classifier) {
			console.error("Classifier not trained or model not found.")
			return false
		}

		const vector = this.getTfIdfVectorForQuery(subjectAndBody)
		const xs = tf.tensor2d([vector], [1, vector.length])
		const pred = (await (this.classifier.predict(xs) as tf.Tensor).data())[0]
		return pred > 0.5
	}

	private async test(testData: SpamClassificationRow[]): Promise<void> {
		if (!this.classifier) {
			throw new Error("Model not loaded")
		}
		if (!this.corpus) {
			throw new Error("Corpus not initialized")
		}

		const xsArray: number[][] = []
		const ysArray: number[] = []

		for (const d of testData) {
			const text = this.sanitizeModelInput(d.subject, d.body)
			xsArray.push(this.getTfIdfVectorForQuery(text))
			ysArray.push(d.isSpam ? 1 : 0)
		}

		const xs = tf.tensor2d(xsArray, [xsArray.length, xsArray[0].length])
		const predsTensor = this.classifier.predict(xs) as tf.Tensor
		const predsArray = Array.from(await predsTensor.data()) as number[]

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
		data: SpamClassificationRow[],
		testRatio: number,
	): {
		testSet: SpamClassificationRow[]
		trainSet: SpamClassificationRow[]
	} {
		const shuffled = data.slice()
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			const tmp = shuffled[i]
			shuffled[i] = shuffled[j]
			shuffled[j] = tmp
		}

		const splitIndex = Math.floor(shuffled.length * (1 - testRatio))
		const trainSet = shuffled.slice(0, splitIndex)
		const testSet = shuffled.slice(splitIndex)
		return { trainSet, testSet }
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
	private getTfIdfVector(corpus: Corpus, docId: string): number[] {
		const vectorMap = corpus.getDocumentVector(docId)
		const allTerms = corpus.getTerms()
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

	private buildTfIdfMatrix(corpus: Corpus, docIds: string[]): tf.Tensor2D {
		const vectors: number[][] = []
		for (let i = 0; i < docIds.length; i++) {
			vectors.push(this.getTfIdfVector(corpus, docIds[i]))
		}
		return tf.tensor2d(vectors, [vectors.length, vectors[0].length])
	}

	// PERSISTENCE
	// fixme we're now saving the same information in 3 places (mail_index, spam_classification in OfflineStoragePersistence + mail and details in OfflineStorage).
	// fixme on current master we only have 2 places (mail index table + mail and details in odb). This is unnecessary and should be optimized before merge
	// fixme add IsSpam column to mail_index?
	private async saveModel(userId: string): Promise<void> {
		if (!this.classifier) {
			return
		}

		await this.classifier.save(
			tf.io.withSaveHandler(async (artifacts) => {
				const topologyBytes = stringToUtf8Uint8Array(JSON.stringify(artifacts.modelTopology))
				await this.fileFacade.writeToAppDir(topologyBytes, `${this.modelFilename}_${userId}_topology.json`)

				const weightSpecsBytes = stringToUtf8Uint8Array(JSON.stringify(artifacts.weightSpecs))
				await this.fileFacade.writeToAppDir(weightSpecsBytes, `${this.modelFilename}_${userId}_weightsSpecs.json`)

				await this.fileFacade.writeToAppDir(
					new Uint8Array(artifacts.weightData as ArrayBuffer), // fixme can this be ArrayBuffer[], if yes, what to do?
					`${this.modelFilename}_${userId}_weights.bin`,
				)

				return {
					modelArtifactsInfo: {
						dateSaved: new Date(),
						modelTopologyType: "JSON",
						modelTopologyBytes: topologyBytes.byteLength,
						weightSpecsBytes: weightSpecsBytes.byteLength,
						weightDataBytes: (artifacts.weightData as ArrayBuffer).byteLength,
					},
				}
			}),
		)
	}

	private async loadModel(userId: string): Promise<void> {
		try {
			const topologyBytes = await this.fileFacade.readFromAppDir(`${this.modelFilename}_${userId}_topology.json`)
			const modelTopology = JSON.parse(utf8Uint8ArrayToString(topologyBytes))

			const weightSpecsBytes = await this.fileFacade.readFromAppDir(`${this.modelFilename}_${userId}_weightsSpecs.json`)
			const weightSpecs = JSON.parse(utf8Uint8ArrayToString(weightSpecsBytes))

			const weightBytes = await this.fileFacade.readFromAppDir(`${this.modelFilename}_${userId}_weights.bin`)
			const weightData = weightBytes.buffer.slice(weightBytes.byteOffset, weightBytes.byteOffset + weightBytes.byteLength)

			this.classifier = await tf.loadLayersModel(
				tf.io.fromMemory({
					modelTopology,
					weightSpecs,
					weightData,
				}),
			)
		} catch (e) {
			console.error("Load model failed:", e)
			this.classifier = null
		}
	}

	private async loadTokenizerFromOfflineDb(): Promise<void> {
		const data = await this.offlineStorage.getSpamMailClassifications()
		const texts: string[] = []
		data.map((datum) => {
			this.documentIds.push(`${datum.listId}/${datum.elementId}`)
			texts.push(this.sanitizeModelInput(datum.subject, datum.body))
		})
		this.corpus = new Corpus(this.documentIds, texts)
	}
}
