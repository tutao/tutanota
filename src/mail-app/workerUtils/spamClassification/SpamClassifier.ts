import { assertWorkerOrNode } from "../../../common/api/common/Env"
import { assertNotNull, groupByAndMap, isEmpty, Nullable, promiseMap } from "@tutao/tutanota-utils"
import { SpamClassificationDataDealer, TrainingDataset } from "./SpamClassificationDataDealer"
import { CacheStorage } from "../../../common/api/worker/rest/DefaultEntityRestCache"
import {
	dense,
	enableProdMode,
	fromMemory,
	glorotUniform,
	LayersModel,
	loadLayersModelFromIOHandler,
	sequential,
	tensor1d,
	tensor2d,
	withSaveHandler,
} from "./tensorflow-custom"
import type { ModelArtifacts } from "@tensorflow/tfjs-core/dist/io/types"
import type { ModelFitArgs } from "@tensorflow/tfjs-layers"
import type { Tensor } from "@tensorflow/tfjs-core"
import { DEFAULT_PREPROCESS_CONFIGURATION, SpamMailDatum, SpamMailProcessor } from "../../../common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { SparseVectorCompressor } from "../../../common/api/common/utils/spamClassificationUtils/SparseVectorCompressor"
import { SpamDecision } from "../../../common/api/common/TutanotaConstants"
import { HashingVectorizer } from "./HashingVectorizer"

assertWorkerOrNode()

export type SpamClassificationModel = {
	modelTopology: string
	weightSpecs: string
	weightData: Uint8Array
	ownerGroup: Id
	hamCount: number
	spamCount: number
}

export const DEFAULT_PREDICTION_THRESHOLD = 0.55

const TRAINING_INTERVAL = 1000 * 60 * 10 // 10 minutes
const FULL_RETRAINING_INTERVAL = 1000 * 60 * 60 * 24 * 7 // 1 week

export type Classifier = {
	isEnabled: boolean
	layersModel: LayersModel
	threshold: number
	hamCount: number
	spamCount: number
}

export class SpamClassifier {
	// Visible for testing
	readonly classifiers: Map<Id, Classifier>
	sparseVectorCompressor: SparseVectorCompressor
	spamMailProcessor: SpamMailProcessor

	constructor(
		private readonly cacheStorage: CacheStorage,
		private readonly initializer: SpamClassificationDataDealer,
		private readonly deterministic: boolean = false,
	) {
		// enable tensorflow production mode
		enableProdMode()
		this.classifiers = new Map()
		this.sparseVectorCompressor = new SparseVectorCompressor()
		this.spamMailProcessor = new SpamMailProcessor(DEFAULT_PREPROCESS_CONFIGURATION, new HashingVectorizer(), this.sparseVectorCompressor)
	}

	calculateThreshold(hamCount: number, spamCount: number) {
		const hamToSpamRatio = hamCount / spamCount
		let threshold = -0.1 * Math.log10(hamToSpamRatio * 10) + 0.65
		if (threshold < DEFAULT_PREDICTION_THRESHOLD) {
			threshold = DEFAULT_PREDICTION_THRESHOLD
		} else if (threshold > 0.75) {
			threshold = 0.75
		}
		return threshold
	}

	public async initialize(ownerGroup: Id): Promise<void> {
		const classifier = await this.loadClassifier(ownerGroup)

		if (classifier) {
			const timeSinceLastFullTraining = Date.now() - FULL_RETRAINING_INTERVAL
			const lastFullTrainingTime = await this.cacheStorage.getLastTrainedFromScratchTime()
			if (timeSinceLastFullTraining > lastFullTrainingTime) {
				console.log(`Retraining from scratch as last train (${new Date(lastFullTrainingTime)}) was more than a week ago`)
				await this.trainFromScratch(this.cacheStorage, ownerGroup)
			} else {
				console.log("loaded existing spam classification model from database")
				this.classifiers.set(ownerGroup, classifier)
				await this.updateAndSaveModel(this.cacheStorage, ownerGroup)
			}

			setInterval(async () => {
				await this.updateAndSaveModel(this.cacheStorage, ownerGroup)
			}, TRAINING_INTERVAL)
		} else {
			console.log("no existing model found. Training from scratch ...")
			await this.trainFromScratch(this.cacheStorage, ownerGroup)
			setInterval(async () => {
				await this.updateAndSaveModel(this.cacheStorage, ownerGroup)
			}, TRAINING_INTERVAL)
		}
	}

	// visibleForTesting
	public async updateAndSaveModel(storage: CacheStorage, ownerGroup: Id) {
		const isModelUpdated = await this.updateModelFromIndexStartId(await storage.getLastTrainingDataIndexId(), ownerGroup)
		if (isModelUpdated) {
			console.log(`Model updated successfully at ${Date.now()}`)
		}
	}

	public async initialTraining(ownerGroup: Id, trainingDataset: TrainingDataset): Promise<void> {
		const { trainingData: clientSpamTrainingData, hamCount, spamCount } = trainingDataset
		const trainingInput = await promiseMap(
			clientSpamTrainingData,
			(d) => {
				const vector = this.sparseVectorCompressor.binaryToVector(d.vector)
				const label = d.spamDecision === SpamDecision.BLACKLIST ? 1 : 0
				return { vector, label }
			},
			{
				concurrency: 5,
			},
		)
		const vectors = trainingInput.map((input) => input.vector)
		const labels = trainingInput.map((input) => input.label)

		const xs = tensor2d(vectors, [trainingInput.length, this.sparseVectorCompressor.dimension], undefined)
		const ys = tensor1d(labels, undefined)

		const layersModel = this.buildModel(this.sparseVectorCompressor.dimension)

		const trainingStart = performance.now()
		await layersModel.fit(xs, ys, {
			epochs: 16,
			batchSize: 32,
			shuffle: !this.deterministic,
			// callbacks: {
			// 	onEpochEnd: async (epoch, logs) => {
			// 		if (logs) {
			// 			console.log(`Epoch ${epoch + 1} - Loss: ${logs.loss.toFixed(4)}`)
			// 		}
			// 	},
			// },
			yieldEvery: 15,
		})
		const trainingTime = performance.now() - trainingStart

		// when using the webgl backend we need to manually dispose @tensorflow tensors
		xs.dispose()
		ys.dispose()

		const threshold = this.calculateThreshold(trainingDataset.hamCount, trainingDataset.spamCount)
		const classifier = {
			layersModel: layersModel,
			isEnabled: true,
			hamCount,
			spamCount,
			threshold,
		}
		this.classifiers.set(ownerGroup, classifier)

		console.log(
			`### Finished Initial Spam Classification Model Training ### (total trained mails: ${clientSpamTrainingData.length} (ham:spam ${hamCount}:${spamCount} => threshold:${threshold}), training time: ${trainingTime})`,
		)
	}

	public async updateModelFromIndexStartId(indexStartId: Id, ownerGroup: Id): Promise<boolean> {
		try {
			const modelNotEnabled = this.classifiers.get(ownerGroup) === undefined || this.classifiers.get(ownerGroup)?.isEnabled === false
			if (modelNotEnabled) {
				console.warn("client spam classification is not enabled or there were errors during training")
				return false
			}

			const trainingDataset = await this.initializer.fetchPartialTrainingDataFromIndexStartId(indexStartId, ownerGroup)
			if (isEmpty(trainingDataset.trainingData)) {
				console.log("no new spam classification training data since last update")
				return false
			}

			console.log(
				`retraining spam classification model with ${trainingDataset.trainingData.length} new mails (ham:spam ${trainingDataset.hamCount}:${trainingDataset.spamCount}) (lastTrainingDataIndexId > ${indexStartId})`,
			)

			return await this.updateModel(ownerGroup, trainingDataset)
		} catch (e) {
			console.error("failed to update the model", e)
			return false
		}
	}

	// visibleForTesting
	async updateModel(ownerGroup: Id, trainingDataset: TrainingDataset): Promise<boolean> {
		const retrainingStart = performance.now()

		if (isEmpty(trainingDataset.trainingData)) {
			console.log("no new spam classification training data since last update")
			return false
		}

		const modelToUpdate = assertNotNull(this.classifiers.get(ownerGroup))
		const trainingInput = await promiseMap(
			trainingDataset.trainingData,
			(d) => {
				const vector = this.sparseVectorCompressor.binaryToVector(d.vector)
				const label = d.spamDecision === SpamDecision.BLACKLIST ? 1 : 0
				const isSpamConfidence = Number(d.confidence)
				return { vector, label, isSpamConfidence }
			},
			{
				concurrency: 5,
			},
		)

		const trainingInputByConfidence = groupByAndMap(
			trainingInput,
			({ isSpamConfidence }) => isSpamConfidence,
			({ vector, label }) => {
				return { vector, label }
			},
		)

		modelToUpdate.isEnabled = false

		try {
			for (const [isSpamConfidence, trainingInput] of trainingInputByConfidence) {
				const vectors = trainingInput.map((input) => input.vector)
				const labels = trainingInput.map((input) => input.label)

				const xs = tensor2d(vectors, [vectors.length, this.sparseVectorCompressor.dimension], "int32")
				const ys = tensor1d(labels, "int32")

				// We need a way to put weight on a specific mail, ideal way would be to pass sampleWeight to modelFitArgs,
				// but is not yet implemented: https://github.com/tensorflow/tfjs/blob/0fc04d958ea592f3b8db79a8b3b497b5c8904097/tfjs-layers/src/engine/training.ts#L1487
				//
				// For now, we use the following workaround:
				// Re-fit the vector multiple times corresponding to `isSpamConfidence`
				const modelFitArgs: ModelFitArgs = {
					epochs: 8,
					batchSize: 32,
					shuffle: !this.deterministic,
					// callbacks: {
					// 	onEpochEnd: async (epoch, logs) => {
					// 		console.log(`Epoch ${epoch + 1} - Loss: ${logs!.loss.toFixed(4)}`)
					// 	},
					// },
					yieldEvery: 15,
				}
				for (let i = 0; i <= isSpamConfidence; i++) {
					await modelToUpdate.layersModel.fit(xs, ys, modelFitArgs)
				}

				// when using the webgl backend we need to manually dispose @tensorflow tensors
				xs.dispose()
				ys.dispose()
			}
		} finally {
			modelToUpdate.hamCount += trainingDataset.hamCount
			modelToUpdate.spamCount += trainingDataset.spamCount
			modelToUpdate.threshold = this.calculateThreshold(modelToUpdate.hamCount, modelToUpdate.spamCount)
			modelToUpdate.isEnabled = true
		}

		const trainingMetadata = `Total Ham: ${modelToUpdate.hamCount} Spam: ${modelToUpdate.spamCount} threshold: ${modelToUpdate.threshold}}`
		console.log(`retraining spam classification model finished, took: ${performance.now() - retrainingStart}ms ${trainingMetadata}`)
		await this.saveModel(ownerGroup)
		await this.cacheStorage.setLastTrainingDataIndexId(trainingDataset.lastTrainingDataIndexId)
		return true
	}

	// visibleForTesting
	public async predict(vector: number[], ownerGroup: Id): Promise<Nullable<boolean>> {
		const classifier = this.classifiers.get(ownerGroup)
		if (classifier == null || !classifier.isEnabled) {
			return null
		}

		const vectors = [vector]
		const xs = tensor2d(vectors, [vectors.length, this.sparseVectorCompressor.dimension], "int32")

		const predictionTensor = classifier.layersModel.predict(xs) as Tensor
		const predictionData = await predictionTensor.data()
		const prediction = predictionData[0]

		console.log(`predicted new mail to be with probability ${prediction.toFixed(2)} spam. Owner Group: ${ownerGroup}`)

		// when using the webgl backend we need to manually dispose @tensorflow tensors
		xs.dispose()
		predictionTensor.dispose()

		return prediction > classifier.threshold
	}

	// visibleForTesting
	public buildModel(inputDimension: number): LayersModel {
		const model = sequential()
		model.add(
			dense({
				inputShape: [inputDimension],
				units: 16,
				activation: "relu",
				kernelInitializer: this.deterministic ? glorotUniform({ seed: 42 }) : glorotUniform({}),
			}),
		)
		model.add(
			dense({
				inputShape: [16],
				units: 16,
				activation: "relu",
				kernelInitializer: this.deterministic ? glorotUniform({ seed: 42 }) : glorotUniform({}),
			}),
		)
		model.add(
			dense({
				inputShape: [16],
				units: 16,
				activation: "relu",
				kernelInitializer: this.deterministic ? glorotUniform({ seed: 42 }) : glorotUniform({}),
			}),
		)
		model.add(
			dense({
				units: 1,
				activation: "sigmoid",
				kernelInitializer: this.deterministic ? glorotUniform({ seed: 42 }) : glorotUniform({}),
			}),
		)
		model.compile({ optimizer: "adam", loss: "binaryCrossentropy", metrics: ["accuracy"] })
		return model
	}

	public async saveModel(ownerGroup: Id): Promise<void> {
		const spamClassificationModel = await this.getSpamClassificationModel(ownerGroup)
		if (spamClassificationModel == null) {
			throw new Error("spam classification model is not available, and therefore can not be saved")
		}
		await this.cacheStorage.setSpamClassificationModel(spamClassificationModel)
	}

	async vectorizeAndCompress(mailDatum: SpamMailDatum) {
		return await this.spamMailProcessor.vectorizeAndCompress(mailDatum)
	}

	async vectorize(mailDatum: SpamMailDatum) {
		return await this.spamMailProcessor.vectorize(mailDatum)
	}

	// visibleForTesting
	public async loadClassifier(ownerGroup: Id): Promise<Nullable<Classifier>> {
		const spamClassificationModel = await assertNotNull(this.cacheStorage).getSpamClassificationModel(ownerGroup)
		if (spamClassificationModel) {
			const modelTopology = JSON.parse(spamClassificationModel.modelTopology)
			const weightSpecs = JSON.parse(spamClassificationModel.weightSpecs)
			const weightData = spamClassificationModel.weightData.buffer.slice(
				spamClassificationModel.weightData.byteOffset,
				spamClassificationModel.weightData.byteOffset + spamClassificationModel.weightData.byteLength,
			)
			const modelArtifacts = { modelTopology, weightSpecs, weightData }
			const layersModel = await loadLayersModelFromIOHandler(fromMemory(modelArtifacts), undefined, undefined)
			layersModel.compile({
				optimizer: "adam",
				loss: "binaryCrossentropy",
				metrics: ["accuracy"],
			})
			const threshold = this.calculateThreshold(spamClassificationModel.hamCount, spamClassificationModel.spamCount)
			return {
				isEnabled: true,
				layersModel: layersModel,
				threshold,
				hamCount: spamClassificationModel.hamCount,
				spamCount: spamClassificationModel.spamCount,
			}
		} else {
			console.log("loading the spam classification spamClassificationModel from offline db failed ... ")
			return null
		}
	}

	// visibleForTesting
	public async cloneClassifier(): Promise<SpamClassifier> {
		const newClassifier = new SpamClassifier(this.cacheStorage, this.initializer, this.deterministic)
		newClassifier.spamMailProcessor = this.spamMailProcessor
		newClassifier.sparseVectorCompressor = this.sparseVectorCompressor
		for (const [ownerGroup, { layersModel: _, isEnabled, threshold, hamCount, spamCount }] of this.classifiers) {
			const modelArtifacts = assertNotNull(await this.getModelArtifacts(ownerGroup))
			const newModel = await loadLayersModelFromIOHandler(fromMemory(modelArtifacts), undefined, undefined)
			newModel.compile({
				optimizer: "adam",
				loss: "binaryCrossentropy",
				metrics: ["accuracy"],
			})
			newClassifier.classifiers.set(ownerGroup, {
				layersModel: newModel,
				isEnabled,
				threshold,
				hamCount,
				spamCount,
			})
		}

		return newClassifier
	}

	// visibleForTesting
	public addSpamClassifierForOwner(ownerGroup: Id, classifier: Classifier) {
		this.classifiers.set(ownerGroup, classifier)
	}

	private async trainFromScratch(storage: CacheStorage, ownerGroup: string) {
		const trainingDataset = await this.initializer.fetchAllTrainingData(ownerGroup)
		const { trainingData, lastTrainingDataIndexId } = trainingDataset
		if (isEmpty(trainingData)) {
			console.log("No training trainingData found. Training from scratch aborted.")
			return
		}
		await this.initialTraining(ownerGroup, trainingDataset)
		await this.saveModel(ownerGroup)
		await storage.setLastTrainedFromScratchTime(Date.now())
		await storage.setLastTrainingDataIndexId(lastTrainingDataIndexId)
	}

	private async getSpamClassificationModel(ownerGroup: Id): Promise<SpamClassificationModel | null> {
		const classifier = this.classifiers.get(ownerGroup)
		if (!classifier) {
			return null
		}
		const modelArtifacts = await this.getModelArtifacts(ownerGroup)
		if (!modelArtifacts) {
			return null
		}
		const modelTopology = JSON.stringify(modelArtifacts.modelTopology)
		const weightSpecs = JSON.stringify(modelArtifacts.weightSpecs)
		const weightData = new Uint8Array(modelArtifacts.weightData as ArrayBuffer)
		return {
			modelTopology,
			weightSpecs,
			weightData,
			ownerGroup,
			hamCount: classifier.hamCount,
			spamCount: classifier.spamCount,
		}
	}

	private async getModelArtifacts(ownerGroup: Id) {
		const classifier = this.classifiers.get(ownerGroup)
		if (!classifier) {
			return null
		}

		return await new Promise<ModelArtifacts>((resolve) => {
			const saveInfo = withSaveHandler(async (artifacts: any) => {
				resolve(artifacts)
				return {
					modelArtifactsInfo: {
						dateSaved: new Date(),
						modelTopologyType: "JSON",
					},
				}
			})
			classifier.layersModel.save(saveInfo, undefined)
		})
	}
}
