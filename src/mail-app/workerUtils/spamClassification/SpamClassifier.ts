import { assertWorkerOrNode } from "../../../common/api/common/Env"
import { assertNotNull, defer, groupByAndMap, isNotNull, Nullable, promiseMap, tokenize } from "@tutao/tutanota-utils"
import { HashingVectorizer } from "./HashingVectorizer"
import {
	ML_BITCOIN_REGEX,
	ML_BITCOIN_TOKEN,
	ML_CREDIT_CARD_REGEX,
	ML_CREDIT_CARD_TOKEN,
	ML_DATE_REGEX,
	ML_DATE_TOKEN,
	ML_EMAIL_ADDR_REGEX,
	ML_EMAIL_ADDR_TOKEN,
	ML_NUMBER_SEQUENCE_REGEX,
	ML_NUMBER_SEQUENCE_TOKEN,
	ML_SPACE_BEFORE_NEW_LINE_REGEX,
	ML_SPACE_BEFORE_NEW_LINE_TOKEN,
	ML_SPECIAL_CHARACTER_REGEX,
	ML_SPECIAL_CHARACTER_TOKEN,
	ML_URL_REGEX,
	ML_URL_TOKEN,
} from "./PreprocessPatterns"
import { SpamClassificationInitializer } from "./SpamClassificationInitializer"
import { CacheStorage } from "../../../common/api/worker/rest/DefaultEntityRestCache"
import { htmlToText } from "../../../common/api/common/utils/IndexUtils"
import {
	dense,
	fromMemory,
	glorotUniform,
	LayersModel,
	loadLayersModelFromIOHandler,
	sequential,
	tensor1d,
	tensor2d,
	withSaveHandler,
} from "./tensorflow-custom"
import type { Tensor } from "@tensorflow/tfjs-core"
import type { ModelArtifacts } from "@tensorflow/tfjs-core/dist/io/types"
import type { ModelFitArgs } from "@tensorflow/tfjs-layers"
import { OfflineStoragePersistence } from "../index/OfflineStoragePersistence"

assertWorkerOrNode()

export type SpamClassificationModel = {
	modelTopology: string
	weightSpecs: string
	weightData: Uint8Array
	ownerGroup: Id
}

export type SpamTrainMailDatum = {
	mailId: IdTuple
	subject: string
	body: string
	isSpam: boolean
	isSpamConfidence: number
	ownerGroup: Id
}

export type SpamPredMailDatum = {
	subject: string
	body: string
	ownerGroup: Id
}

const PREDICTION_THRESHOLD = 0.55

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
	isRemoveSpaceBeforeNewLine: boolean
}

export const DEFAULT_PREPROCESS_CONFIGURATION: PreprocessConfiguration = {
	isPreprocessMails: true,
	isRemoveHTML: true,
	isReplaceDates: true,
	isReplaceUrls: true,
	isReplaceMailAddresses: true,
	isReplaceBitcoinAddress: true,
	isReplaceCreditCards: true,
	isReplaceNumbers: true,
	isReplaceSpecialCharacters: true,
	isRemoveSpaceBeforeNewLine: true,
}

const TRAINING_INTERVAL = 1000 * 60 * 10 // 10 minutes
const FULL_RETRAINING_INTERVAL = 1000 * 60 * 60 * 24 * 7 // 1 week

type TrainingPerformance = {
	trainingTime: number
	vectorizationTime: number
}

export const spamClassifierTokenizer = (text: string): string[] => tokenize(text)

export class SpamClassifier {
	private readonly classifier: Map<Id, { model: LayersModel; isEnabled: boolean }>

	constructor(
		private readonly offlineStorage: OfflineStoragePersistence,
		private readonly offlineStorageCache: CacheStorage,
		private readonly initializer: SpamClassificationInitializer,
		private readonly deterministic: boolean = false,
		private readonly preprocessConfiguration: PreprocessConfiguration = DEFAULT_PREPROCESS_CONFIGURATION,
		private readonly vectorizer: HashingVectorizer = new HashingVectorizer(),
	) {
		this.classifier = new Map()
	}

	public async initialize(ownerGroup: Id): Promise<void> {
		const loadedModel = await this.loadModel(ownerGroup)

		const storage = assertNotNull(this.offlineStorageCache)
		setInterval(async () => {
			const cutoffDate = Date.now() - FULL_RETRAINING_INTERVAL
			const lastFullTrainingTime = await storage.getLastTrainedFromScratchTime()

			if (cutoffDate > lastFullTrainingTime) {
				await this.retrainModelFromScratch(storage, ownerGroup, cutoffDate)
			}
		}, FULL_RETRAINING_INTERVAL)
		if (isNotNull(loadedModel)) {
			console.log("Loaded existing spam classification model from database")

			this.classifier.set(ownerGroup, { model: loadedModel, isEnabled: true })

			await this.updateAndSaveModel(storage, ownerGroup)
			setInterval(async () => {
				await this.updateAndSaveModel(storage, ownerGroup)
			}, TRAINING_INTERVAL)
			return
		}

		console.log("No existing model found. Training from scratch...")
		await this.trainFromScratch(storage, ownerGroup)
		setInterval(async () => {
			await this.updateAndSaveModel(storage, ownerGroup)
		}, TRAINING_INTERVAL)
	}

	private async trainFromScratch(storage: CacheStorage, ownerGroup: string) {
		const data = await this.initializer.init(ownerGroup)
		await this.initialTraining(data)
		await this.saveModel(ownerGroup)
		await storage.setLastTrainedFromScratchTime(Date.now())
	}

	// VisibleForTesting
	public async updateAndSaveModel(storage: CacheStorage, ownerGroup: Id) {
		const isModelUpdated = await this.updateModelFromCutoff(await storage.getLastTrainedTime(), ownerGroup)
		if (isModelUpdated) {
			await this.saveModel(ownerGroup)
			await storage.setLastTrainedTime(Date.now())
		}
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
			for (const datePattern of ML_DATE_REGEX) {
				preprocessedMail = preprocessedMail.replaceAll(datePattern, ML_DATE_TOKEN)
			}
		}

		// 3. Replace urls
		if (this.preprocessConfiguration.isReplaceUrls) {
			preprocessedMail = preprocessedMail.replaceAll(ML_URL_REGEX, ML_URL_TOKEN)
		}

		// 4. Replace email addresses
		if (this.preprocessConfiguration.isReplaceMailAddresses) {
			preprocessedMail = preprocessedMail.replaceAll(ML_EMAIL_ADDR_REGEX, ML_EMAIL_ADDR_TOKEN)
		}

		// 5. Replace Bitcoin addresses
		if (this.preprocessConfiguration.isReplaceBitcoinAddress) {
			preprocessedMail = preprocessedMail.replaceAll(ML_BITCOIN_REGEX, ML_BITCOIN_TOKEN)
		}

		// 6. Replace credit card numbers
		if (this.preprocessConfiguration.isReplaceCreditCards) {
			preprocessedMail = preprocessedMail.replaceAll(ML_CREDIT_CARD_REGEX, ML_CREDIT_CARD_TOKEN)
		}

		// 7. Replace remaining numbers
		if (this.preprocessConfiguration.isReplaceNumbers) {
			preprocessedMail = preprocessedMail.replaceAll(ML_NUMBER_SEQUENCE_REGEX, ML_NUMBER_SEQUENCE_TOKEN)
		}

		// 8. Remove special characters
		if (this.preprocessConfiguration.isReplaceSpecialCharacters) {
			preprocessedMail = preprocessedMail.replaceAll(ML_SPECIAL_CHARACTER_REGEX, ML_SPECIAL_CHARACTER_TOKEN)
		}

		// 9. Remove spaces at end of lines
		if (this.preprocessConfiguration.isRemoveSpaceBeforeNewLine) {
			preprocessedMail = preprocessedMail.replaceAll(ML_SPACE_BEFORE_NEW_LINE_REGEX, ML_SPACE_BEFORE_NEW_LINE_TOKEN)
		}

		return preprocessedMail
	}

	public async initialTraining(mails: SpamTrainMailDatum[]): Promise<TrainingPerformance> {
		const preprocessingStart = performance.now()
		const tokenizedMails = await promiseMap(mails, (mail) => spamClassifierTokenizer(this.preprocessMail(mail)))
		const preprocessingTime = performance.now() - preprocessingStart

		const vectorizationStart = performance.now()

		const vectors = await this.vectorizer.transform(tokenizedMails)
		const labels = mails.map((mail) => (mail.isSpam ? 1 : 0))
		const vectorizationTime = performance.now() - vectorizationStart

		const xs = tensor2d(vectors, [vectors.length, this.vectorizer.dimension], undefined)
		const ys = tensor1d(labels, undefined)

		const classifier = this.buildModel(this.vectorizer.dimension)

		const trainingStart = performance.now()
		await classifier.fit(xs, ys, {
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
		})
		const trainingTime = performance.now() - trainingStart

		// When using the webgl backend we need to manually dispose @tensorflow tensors
		xs.dispose()
		ys.dispose()

		this.classifier.set(mails[0].ownerGroup, { model: classifier, isEnabled: true })

		console.log(
			`### Finished Initial Training ### (total trained mails: ${mails.length}, preprocessing time: ${preprocessingTime}, vectorization time: ${vectorizationTime}ms, training time: ${trainingTime})`,
		)

		return { vectorizationTime, trainingTime }
	}

	public async updateModelFromCutoff(cutoffTimestamp: number, ownerGroup: Id): Promise<boolean> {
		try {
			const modelNotEnabled = this.classifier.get(ownerGroup) === undefined || this.classifier.get(ownerGroup)?.isEnabled === false
			if (modelNotEnabled) {
				console.warn("Client spam classification is not enabled or there were errors during training")
				return false
			}

			const newTrainingMails = await assertNotNull(this.offlineStorage).getCertainSpamClassificationTrainingDataAfterCutoff(cutoffTimestamp, ownerGroup)
			if (newTrainingMails.length === 0) {
				console.log("No new training data since last update.")
				return false
			}
			console.log(`Retraining model with ${newTrainingMails.length} new mails (lastModified > ${new Date(cutoffTimestamp).toString()})`)

			return await this.updateModel(ownerGroup, newTrainingMails)
		} catch (e) {
			console.error("Failed trying to update the model: ", e)
			return false
		}
	}

	// VisibleForTesting
	async updateModel(ownerGroup: Id, newTrainingMails: SpamTrainMailDatum[]) {
		const retrainingStart = performance.now()

		const modelToUpdate = assertNotNull(this.classifier.get(ownerGroup))
		const tokenizedMailsArray = await promiseMap(newTrainingMails, async (mail) => {
			const preprocessedMail = this.preprocessMail(mail)
			const tokenizedMail = spamClassifierTokenizer(preprocessedMail)
			return { tokenizedMail, isSpamConfidence: mail.isSpamConfidence, isSpam: mail.isSpam ? 1 : 0 }
		})

		const tokenizedMailsByConfidence = groupByAndMap(
			tokenizedMailsArray,
			({ isSpamConfidence }) => isSpamConfidence,
			({ isSpam, tokenizedMail }) => {
				return { isSpam, tokenizedMail }
			},
		)
		modelToUpdate.isEnabled = false
		try {
			for (const [isSpamConfidence, tokenizedMails] of tokenizedMailsByConfidence) {
				const vectors = await this.vectorizer.transform(tokenizedMails.map(({ tokenizedMail }) => tokenizedMail))
				const xs = tensor2d(vectors, [vectors.length, this.vectorizer.dimension], undefined)
				const ys = tensor1d(
					tokenizedMails.map(({ isSpam }) => isSpam),
					undefined,
				)

				// We need a way to put weight on a specific mail, ideal way would be to pass sampleWeight to modelFitArgs,
				// but is not yet implemented: https://github.com/tensorflow/tfjs/blob/0fc04d958ea592f3b8db79a8b3b497b5c8904097/tfjs-layers/src/engine/training.ts#L1487
				//
				// work around:
				// current: Re fit the vector of mail multiple times corresponding to `isSpamConfidence`
				// tried approaches:
				// 1) Increasing value in vectorizer by isSpamConfidence instead of 1
				// 2) duplicating the emails with higher isSpamConfidence and calling .fit once
				const modelFitArgs: ModelFitArgs = {
					epochs: 8,
					batchSize: 32,
					shuffle: !this.deterministic,
					// callbacks: {
					// 	onEpochEnd: async (epoch, logs) => {
					// 		console.log(`Epoch ${epoch + 1} - Loss: ${logs!.loss.toFixed(4)}`)
					// 	},
					// },
				}
				for (let i = 0; i <= isSpamConfidence; i++) {
					await modelToUpdate.model.fit(xs, ys, modelFitArgs)
				}

				// When using the webgl backend we need to manually dispose @tensorflow tensors
				xs.dispose()
				ys.dispose()
			}
		} finally {
			modelToUpdate.isEnabled = true
		}

		console.log(`Retraining finished. Took: ${performance.now() - retrainingStart}ms`)
		return true
	}

	// visibleForTesting
	public async predict(spamPredMailDatum: SpamPredMailDatum): Promise<Nullable<boolean>> {
		const classifier = this.classifier.get(spamPredMailDatum.ownerGroup)
		if (classifier == null || !classifier.isEnabled) {
			return null
		}

		const preprocessedMail = this.preprocessMail(spamPredMailDatum)
		const tokenizedMail = spamClassifierTokenizer(preprocessedMail)
		const vectors = await assertNotNull(this.vectorizer).transform([tokenizedMail])

		const xs = tensor2d(vectors, [vectors.length, assertNotNull(this.vectorizer).dimension], undefined)
		const predictionTensor = classifier.model.predict(xs) as Tensor
		const predictionData = await predictionTensor.data()
		const prediction = predictionData[0]

		// console.log(`predicted new mail to be with probability ${prediction.toFixed(2)} spam. Owner Group: ${spamPredMailDatum.ownerGroup}`)

		// When using the webgl backend we need to manually dispose @tensorflow tensors
		xs.dispose()
		predictionTensor.dispose()

		return prediction > PREDICTION_THRESHOLD
	}

	public getSpamClassification(mailId: IdTuple) {
		return this.offlineStorage.getSpamClassification(mailId)
	}

	public updateSpamClassification(mailId: IdTuple, isSpam: boolean, isSpamConfidence: number) {
		return this.offlineStorage.updateSpamClassification(mailId, isSpam, isSpamConfidence)
	}

	public storeSpamClassification(spamTrainMailDatum: SpamTrainMailDatum) {
		return this.offlineStorage.storeSpamClassification(spamTrainMailDatum)
	}

	public deleteSpamClassification(mailId: IdTuple) {
		return this.offlineStorage.deleteSpamClassification(mailId)
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
		const modelArtifacts = await this.getModelArtifacts(ownerGroup)
		if (modelArtifacts == null) {
			throw new Error("Model is not available, and therefore can not be saved")
		}
		await assertNotNull(this.offlineStorage).putSpamClassificationModel(modelArtifacts.spamClassificationModel)
	}

	private async getModelArtifacts(ownerGroup: Id) {
		const classifier = this.classifier.get(ownerGroup)?.model ?? null
		if (!classifier) return null
		const spamClassificationModel = defer<SpamClassificationModel>()
		const modelArtificats = new Promise<ModelArtifacts>((resolve) => {
			const saveInfo = withSaveHandler(async (artifacts: any) => {
				resolve(artifacts)
				const modelTopology = JSON.stringify(artifacts.modelTopology)
				const weightSpecs = JSON.stringify(artifacts.weightSpecs)
				const weightData = new Uint8Array(artifacts.weightData as ArrayBuffer)

				spamClassificationModel.resolve({
					modelTopology,
					weightSpecs,
					weightData,
					ownerGroup,
				})
				return {
					modelArtifactsInfo: {
						dateSaved: new Date(),
						modelTopologyType: "JSON",
					},
				}
			})
			classifier.save(saveInfo, undefined)
		})

		return {
			modelArtifacts: await modelArtificats,
			spamClassificationModel: await spamClassificationModel.promise,
		}
	}

	// visibleForTesting
	public async loadModel(ownerGroup: Id): Promise<Nullable<LayersModel>> {
		const model = await assertNotNull(this.offlineStorage).getSpamClassificationModel(ownerGroup)
		if (model) {
			const modelTopology = JSON.parse(model.modelTopology)
			const weightSpecs = JSON.parse(model.weightSpecs)
			const weightData = model.weightData.buffer.slice(model.weightData.byteOffset, model.weightData.byteOffset + model.weightData.byteLength)
			const classifier = await loadLayersModelFromIOHandler(fromMemory(modelTopology, weightSpecs, weightData, undefined), undefined)
			classifier.compile({
				optimizer: "adam",
				loss: "binaryCrossentropy",
				metrics: ["accuracy"],
			})
			return classifier
		} else {
			console.error("Loading the model from offline db failed")
			return null
		}
	}

	private concatSubjectAndBody(mail: SpamTrainMailDatum | SpamPredMailDatum) {
		const subject = mail.subject || ""
		const body = mail.body || ""
		const concatenated = `${subject} ${body}`.trim()
		return concatenated.length > 0 ? concatenated : " "
	}

	private async retrainModelFromScratch(storage: CacheStorage, ownerGroup: Id, cutoffTimestamp: number) {
		console.log("Model is being re-trained from scratch, deleting old data")
		try {
			await assertNotNull(this.offlineStorage).deleteSpamClassificationTrainingDataBeforeCutoff(cutoffTimestamp, ownerGroup)
		} catch (e) {
			console.error("Failed delete old training data: ", e)
			return
		}

		await this.trainFromScratch(storage, ownerGroup)
	}

	// visibleForTesting
	public async cloneClassifier(): Promise<SpamClassifier> {
		const newClassifier = new SpamClassifier(
			this.offlineStorage,
			this.offlineStorageCache,
			this.initializer,
			this.deterministic,
			this.preprocessConfiguration,
		)
		for (const [ownerGroup, { model: _, isEnabled }] of this.classifier) {
			const { modelArtifacts } = assertNotNull(await this.getModelArtifacts(ownerGroup))
			const newModel = await loadLayersModelFromIOHandler(fromMemory(modelArtifacts, undefined, undefined, undefined), undefined)
			newModel.compile({
				optimizer: "adam",
				loss: "binaryCrossentropy",
				metrics: ["accuracy"],
			})
			newClassifier.classifier.set(ownerGroup, { model: newModel, isEnabled })
		}

		return newClassifier
	}

	// visibleForTesting
	public addSpamClassifierForOwner(ownerGroup: Id, model: LayersModel, isEnabled: boolean) {
		this.classifier.set(ownerGroup, { model, isEnabled })
	}
}
