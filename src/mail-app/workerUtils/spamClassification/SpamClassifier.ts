import { assert, assertNotNull, groupByAndMap, isEmpty, Nullable, promiseMap } from "@tutao/tutanota-utils"
import { SpamClassifierDataDealer, TrainingDataset } from "./SpamClassifierDataDealer"
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
import { MailSetKind, SpamDecision } from "../../../common/api/common/TutanotaConstants"
import { SpamClassifierStorageFacade } from "../../../common/api/worker/facades/lazy/SpamClassifierStorageFacade"
import { SpamClassificationHandler } from "../../mail/model/SpamClassificationHandler"
import { ClientSpamTrainingDatum, createMailSet, Mail, MailSet } from "../../../common/api/entities/tutanota/TypeRefs"
import { UnencryptedProcessInboxDatum } from "../../mail/model/ProcessInboxHandler"

export type SpamClassificationModelMetaData = {
	hamCount: number
	spamCount: number
	lastTrainedFromScratchTime: number
	lastTrainingDataIndexId: Id
}

export type SpamClassificationModel = {
	ownerGroup: Id
	modelTopology: string
	weightSpecs: string
	weightData: Uint8Array
	metaData: SpamClassificationModelMetaData
}

export const DEFAULT_PREDICTION_THRESHOLD = 0.55

const TRAINING_INTERVAL = 1000 * 60 * 10 // 10 minutes
const FULL_RETRAINING_INTERVAL = 1000 * 60 * 60 * 24 * 7 // 1 week

export type Classifier = {
	layersModel: LayersModel
	threshold: number
	metaData: SpamClassificationModelMetaData
}

export class SpamClassifier {
	// Visible for testing
	readonly classifierByMailGroup: Map<Id, Classifier>
	sparseVectorCompressor: SparseVectorCompressor
	spamMailProcessor: SpamMailProcessor

	private retrainingIntervalId: IntervalID | null = null

	constructor(
		private readonly spamClassifierStorageFacade: SpamClassifierStorageFacade,
		private readonly spamClassifierDataDealer: SpamClassifierDataDealer,
		private readonly deterministic: boolean = false,
	) {
		// enable tensorflow production mode
		enableProdMode()
		this.classifierByMailGroup = new Map()
		this.sparseVectorCompressor = new SparseVectorCompressor()
		this.spamMailProcessor = new SpamMailProcessor(DEFAULT_PREPROCESS_CONFIGURATION, this.sparseVectorCompressor)
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

	public async initializeFromStorage(ownerGroup: Id): Promise<void> {
		await this.loadAndActivateClassifierFromStorage(ownerGroup)
	}

	public async initializeWithTraining(ownerGroup: Id): Promise<void> {
		const classifier = await this.loadAndActivateClassifierFromStorage(ownerGroup)

		if (classifier) {
			const timeSinceLastFullTraining = Date.now() - FULL_RETRAINING_INTERVAL
			const lastFullTrainingTime = classifier.metaData.lastTrainedFromScratchTime
			if (timeSinceLastFullTraining > lastFullTrainingTime) {
				console.log(
					`retraining spam classification model for mailbox ${ownerGroup} from scratch as last train (${new Date(lastFullTrainingTime)}) was more than a week ago`,
				)
				await this.trainFromScratch(ownerGroup)
			} else {
				console.log(`checking if spam classification model retraining is needed for mailbox ${ownerGroup} ...`)
				await this.updateModelFromIndexStartId(classifier.metaData.lastTrainingDataIndexId, ownerGroup)
			}
		} else {
			console.log(`no existing spam classification model found for mailbox ${ownerGroup}. training from scratch ... `)
			await this.trainFromScratch(ownerGroup)
		}

		if (this.retrainingIntervalId != null) {
			clearInterval(this.retrainingIntervalId)
		}
		this.retrainingIntervalId = setInterval(async () => {
			const classifier = this.classifierByMailGroup.get(ownerGroup)
			if (classifier) {
				await this.updateModelFromIndexStartId(classifier.metaData.lastTrainingDataIndexId, ownerGroup)
			}
		}, TRAINING_INTERVAL)
	}

	private async loadAndActivateClassifierFromStorage(ownerGroup: string) {
		const classifier = await this.loadClassifier(ownerGroup)
		if (classifier) {
			console.log(`loaded existing spam classification model for mailbox ${ownerGroup} from storage`)
			this.classifierByMailGroup.set(ownerGroup, classifier)
		}
		return classifier
	}

	// visibleForTesting
	public async initialTraining(ownerGroup: Id, trainingDataset: TrainingDataset): Promise<void> {
		const { trainingData: clientSpamTrainingData, hamCount, spamCount } = trainingDataset
		const trainingInput = await promiseMap(
			clientSpamTrainingData,
			(d) => {
				/**
				 * TODO: we should also use confidence in initialTraining
				 *
				 * // initialTraining: m1: confience(4) <- initial training here
				 * // new email: m2: confidence(1) <- updated model here ( user received a mail but have  not moved yet)
				 * //
				 * // another email: m3: <- currently classifying
				 *
				 * ====
				 * in this case, m1 should have more influence while classifying on m3.
				 * Currently since we dont use confidence, m1 & m2 will have equal influence
				 */
				const vector = this.sparseVectorCompressor.binaryToVector(d.vector)
				const label = d.spamDecision === SpamDecision.BLACKLIST ? 1 : 0
				const { influenceMagnitude, influenceDirection } = SpamClassifier.recoverServerSideInfluenceFromDatum(d)
				vector.push(influenceMagnitude, influenceDirection)
				return { vector, label }
			},
			{
				concurrency: 5,
			},
		)
		const vectors = trainingInput.map((input) => input.vector)
		const labels = trainingInput.map((input) => input.label)

		const xs = tensor2d(vectors, [trainingInput.length, this.getInputSize()], undefined)
		const ys = tensor1d(labels, undefined)

		const layersModel = this.buildModel(this.getInputSize())

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

		// when using the webgl backend, we need to manually dispose @tensorflow tensors
		xs.dispose()
		ys.dispose()

		const threshold = this.calculateThreshold(trainingDataset.hamCount, trainingDataset.spamCount)
		const metaData: SpamClassificationModelMetaData = {
			hamCount,
			spamCount,
			lastTrainedFromScratchTime: Date.now(),
			lastTrainingDataIndexId: trainingDataset.lastTrainingDataIndexId,
		}
		const classifier: Classifier = {
			layersModel: layersModel,
			metaData,
			threshold,
		}

		await this.activateAndSaveClassifier(ownerGroup, classifier)

		console.log(
			`🐞 finished initial spam classification model training for mailbox ${ownerGroup} (total trained mails: ${clientSpamTrainingData.length} (ham:spam ${hamCount}:${spamCount} => threshold:${threshold}), training time: ${trainingTime})`,
		)
	}

	async activateAndSaveClassifier(ownerGroup: Id, classifier: Classifier) {
		this.classifierByMailGroup.set(ownerGroup, classifier)
		const spamClassificationModel = await this.getSpamClassificationModel(ownerGroup, classifier)
		if (spamClassificationModel == null) {
			throw new Error(`spam classification model for mailbox ${ownerGroup} is not available, and therefore can not be saved`)
		}
		await this.spamClassifierStorageFacade.setSpamClassificationModel(spamClassificationModel)
	}

	public async updateModelFromIndexStartId(indexStartId: Id, ownerGroup: Id): Promise<void> {
		try {
			const modelNotAvailable = this.classifierByMailGroup.get(ownerGroup) === undefined
			if (modelNotAvailable) {
				console.warn(`client spam classification is not found for mailbox ${ownerGroup} or there were errors during training`)
				return
			}

			const trainingDataset = await this.spamClassifierDataDealer.fetchPartialTrainingDataFromIndexStartId(indexStartId, ownerGroup)
			if (isEmpty(trainingDataset.trainingData)) {
				console.log(`no new spam classification training data since last update for mailbox ${ownerGroup}`)
				return
			}

			console.log(
				`retraining spam classification model for mailbox ${ownerGroup} with ${trainingDataset.trainingData.length} new mails (ham:spam ${trainingDataset.hamCount}:${trainingDataset.spamCount}) (lastTrainingDataIndexId > ${indexStartId})`,
			)
			await this.updateModel(ownerGroup, trainingDataset)
		} catch (e) {
			console.error("failed to update the model", e)
		}
	}

	// visibleForTesting
	async updateModel(ownerGroup: Id, trainingDataset: TrainingDataset): Promise<void> {
		if (isEmpty(trainingDataset.trainingData)) {
			console.log(`no new spam classification training data for mailbox ${ownerGroup} since last update`)
			return
		}

		const trainingInput = await promiseMap(
			trainingDataset.trainingData,
			(d) => {
				const vector = this.sparseVectorCompressor.binaryToVector(d.vector)
				const label = d.spamDecision === SpamDecision.BLACKLIST ? 1 : 0
				const isSpamConfidence = Number(d.confidence)
				const { influenceMagnitude, influenceDirection } = SpamClassifier.recoverServerSideInfluenceFromDatum(d)
				vector.push(influenceMagnitude, influenceDirection)
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

		const classifierToUpdate = assertNotNull(this.classifierByMailGroup.get(ownerGroup))

		// we clone the layersModel to allow predictions while retraining is in progress
		const layersModelToUpdate = await this.cloneLayersModel(classifierToUpdate)

		const retrainingStart = performance.now()
		try {
			for (const [isSpamConfidence, trainingInput] of trainingInputByConfidence) {
				const vectors = trainingInput.map((input) => input.vector)
				const labels = trainingInput.map((input) => input.label)

				const xs = tensor2d(vectors, [vectors.length, this.getInputSize()], "int32")
				const ys = tensor1d(labels, "int32")

				// We need a way to put weight on a specific email, an ideal way would be to pass sampleWeight to modelFitArgs,
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
					await layersModelToUpdate.fit(xs, ys, modelFitArgs)
				}

				// when using the webgl backend, we need to manually dispose @tensorflow tensors
				xs.dispose()
				ys.dispose()
			}
		} finally {
			classifierToUpdate.threshold = this.calculateThreshold(classifierToUpdate.metaData.hamCount, classifierToUpdate.metaData.spamCount)
			classifierToUpdate.metaData = {
				hamCount: classifierToUpdate.metaData.hamCount + trainingDataset.hamCount,
				spamCount: classifierToUpdate.metaData.spamCount + trainingDataset.spamCount,
				lastTrainingDataIndexId: trainingDataset.lastTrainingDataIndexId,
				// lastTrainedFromScratchTime update only happens on full training
				lastTrainedFromScratchTime: classifierToUpdate.metaData.lastTrainedFromScratchTime,
			}
			classifierToUpdate.layersModel = layersModelToUpdate
		}

		await this.activateAndSaveClassifier(ownerGroup, classifierToUpdate)

		const trainingMetadata = `Total Ham: ${classifierToUpdate.metaData.hamCount} Spam: ${classifierToUpdate.metaData.spamCount} threshold: ${classifierToUpdate.threshold}`
		console.log(
			`retraining spam classification model finished for mailbox ${ownerGroup}, took: ${performance.now() - retrainingStart}ms ${trainingMetadata}`,
		)
	}

	// visibleForTesting
	public async predict(vector: number[], ownerGroup: Id): Promise<Nullable<boolean>> {
		const classifier = this.classifierByMailGroup.get(ownerGroup)
		if (!classifier) {
			return null
		}

		const vectors = [vector]
		const inputSize = this.getInputSize()
		const xs = tensor2d(vectors, [vectors.length, inputSize], "int32")

		const predictionTensor = classifier.layersModel.predict(xs) as Tensor
		const predictionData = await predictionTensor.data()
		const prediction = predictionData[0]

		console.log(`predicted new mail to be with probability ${prediction.toFixed(2)} spam for mailbox: ${ownerGroup}`)

		// when using the webgl backend, we need to manually dispose @tensorflow tensors
		xs.dispose()
		predictionTensor.dispose()

		return prediction > classifier.threshold
	}

	private getInputSize() {
		return this.sparseVectorCompressor.dimension + 2 // for serverSideInfluence
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

	public async compress(vector: number[]) {
		return await this.spamMailProcessor.compress(vector)
	}

	public async vectorize(mailDatum: SpamMailDatum) {
		return await this.spamMailProcessor.vectorize(mailDatum)
	}

	// visibleForTesting
	public async loadClassifier(ownerGroup: Id): Promise<Nullable<Classifier>> {
		const spamClassificationModel = await assertNotNull(this.spamClassifierStorageFacade).getSpamClassificationModel(ownerGroup)
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
			const metaData = spamClassificationModel.metaData
			const threshold = this.calculateThreshold(metaData.hamCount, metaData.spamCount)
			return {
				layersModel: layersModel,
				threshold,
				metaData,
			}
		} else {
			console.log(`loading the spam classification spamClassificationModel from storage failed for mailbox ${ownerGroup} ... `)
			return null
		}
	}

	private async cloneLayersModel(classifier: Classifier): Promise<LayersModel> {
		const modelArtifacts = await this.getModelArtifacts(classifier)
		const newLayersModel = await loadLayersModelFromIOHandler(fromMemory(modelArtifacts), undefined, undefined)
		newLayersModel.compile({
			optimizer: "adam",
			loss: "binaryCrossentropy",
			metrics: ["accuracy"],
		})
		return newLayersModel
	}

	// visibleForTesting
	public async cloneSpamClassifier(): Promise<SpamClassifier> {
		const newSpamClassifier = new SpamClassifier(this.spamClassifierStorageFacade, this.spamClassifierDataDealer, this.deterministic)
		newSpamClassifier.spamMailProcessor = this.spamMailProcessor
		newSpamClassifier.sparseVectorCompressor = this.sparseVectorCompressor
		for (const [ownerGroup, classifier] of this.classifierByMailGroup) {
			const newLayersModel = await this.cloneLayersModel(classifier)
			newSpamClassifier.classifierByMailGroup.set(ownerGroup, {
				layersModel: newLayersModel,
				threshold: classifier.threshold,
				metaData: classifier.metaData,
			})
		}

		return newSpamClassifier
	}

	private async trainFromScratch(ownerGroup: string) {
		const trainingDataset = await this.spamClassifierDataDealer.fetchAllTrainingData(ownerGroup)
		if (isEmpty(trainingDataset.trainingData)) {
			console.log(`no training trainingData found for mailbox ${ownerGroup} training from scratch aborted.`)
			return
		}
		await this.initialTraining(ownerGroup, trainingDataset)
	}

	private async getSpamClassificationModel(ownerGroup: Id, classifier: Classifier): Promise<SpamClassificationModel | null> {
		const modelArtifacts = await this.getModelArtifacts(classifier)
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
			ownerGroup: ownerGroup,
			metaData: classifier.metaData,
		}
	}

	private async getModelArtifacts(classifier: Classifier) {
		return await new Promise<ModelArtifacts>((resolve, reject) => {
			const saveInfo = withSaveHandler(async (artifacts: any) => {
				resolve(artifacts)
				return {
					modelArtifactsInfo: {
						dateSaved: new Date(),
						modelTopologyType: "JSON",
					},
				}
			})
			classifier.layersModel.save(saveInfo, undefined).catch((err) => {
				reject(err)
			})
		})
	}

	//TODO: this is being used by processInboxHandler and SpamClassificationHandler,
	// both are on main and thus we had to do some static and non static usage
	// and that then allows us to build but it probably has a better way.
	public extractServerSideInfluenceFromMail(mail: Mail, targetFolder: MailSet) {
		return SpamClassifier.extractServerSideInfluenceFromMail(mail, targetFolder)
	}

	public static extractServerSideInfluenceFromMail(mail: Mail, targetFolder: MailSet) {
		assert(targetFolder.folderType === MailSetKind.SPAM || targetFolder.folderType === MailSetKind.INBOX, "Server should either put mail in spam or inbox")
		const influence = Math.min(100, Number(mail.serverSideInfluence))
		const influenceDirection = targetFolder.folderType === MailSetKind.SPAM ? 1 : -1
		const influenceMagnitude = Math.max(1, Math.abs(influence))

		return { influenceMagnitude, influenceDirection }
	}

	public static recoverServerSideInfluenceFromDatum(datum: UnencryptedProcessInboxDatum | ClientSpamTrainingDatum) {
		const influence = Number(assertNotNull(datum.serverSideInfluence))
		assert(influence !== 0 && influence <= 100 && influence >= -100, "server side influence should be between -100 to 100 excluding 0")
		const influenceMagnitude = Math.abs(influence)
		const influenceDirection = influence > 0 ? 1 : -1

		return { influenceMagnitude, influenceDirection }
	}
}
