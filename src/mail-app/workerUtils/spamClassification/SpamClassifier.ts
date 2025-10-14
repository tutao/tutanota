import { assertWorkerOrNode } from "../../../common/api/common/Env"
import { assertNotNull, defer, groupByAndMap, isNotNull, Nullable, promiseMap } from "@tutao/tutanota-utils"
import { DynamicTfVectorizer } from "./DynamicTfVectorizer"
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
import { OfflineStoragePersistence } from "../index/OfflineStoragePersistence"
import { filterMailMemberships, htmlToText } from "../../../common/api/common/utils/IndexUtils"
import {
	dense,
	dropout,
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

const TRAINING_INTERVAL = 1000 * 60 * 10

type TrainingPerformance = {
	trainingTime: number
	vectorizationTime: number
}

export class SpamClassifier {
	private readonly classifier: Map<Id, { model: LayersModel; isEnabled: boolean }>

	constructor(
		private readonly offlineStorage: OfflineStoragePersistence | null,
		private readonly offlineStorageCache: CacheStorage,
		private readonly initializer: SpamClassificationInitializer,
		private readonly deterministic: boolean = false,
		private readonly preprocessConfiguration: PreprocessConfiguration = DEFAULT_PREPROCESS_CONFIGURATION,
		private readonly vectorizer: DynamicTfVectorizer | HashingVectorizer = new HashingVectorizer(),
	) {
		this.classifier = new Map()
	}

	public getEnabledSpamClassifierForOwnerGroup(ownerGroup: Id): Nullable<LayersModel> {
		const classifier = this.classifier.get(ownerGroup) ?? null
		if (classifier && classifier.isEnabled) {
			return classifier.model
		}
		return null
	}

	public async initialize(ownerGroup: Id): Promise<void> {
		const loadedModel = await this.loadModel(ownerGroup)

		const storage = assertNotNull(this.offlineStorageCache)
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
		const data = await this.initializer.init(ownerGroup)
		await this.initialTraining(data)
		await this.saveModel(ownerGroup)
		setInterval(async () => {
			await this.updateAndSaveModel(storage, ownerGroup)
		}, TRAINING_INTERVAL)
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
		const vectorizationStart = performance.now()

		const tokenizedMails = await promiseMap(mails, (mail) => assertNotNull(this.offlineStorage).tokenize(this.preprocessMail(mail)))
		if (this.vectorizer instanceof DynamicTfVectorizer) {
			this.vectorizer.buildInitialTokenVocabulary(tokenizedMails)
		}

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
			callbacks: {
				onEpochEnd: async (epoch, logs) => {
					console.log(`Epoch ${epoch + 1} - Loss: ${logs!.loss.toFixed(4)}`)
				},
			},
		})
		const trainingTime = performance.now() - trainingStart

		// When using the webgl backend we need to manually dispose @tensorflow tensors
		xs.dispose()
		ys.dispose()

		this.classifier.set(mails[0].ownerGroup, { model: classifier, isEnabled: true })

		console.log(`### Finished Initial Training ### (total trained mails: ${mails.length})`)

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
		const offlineStorage = assertNotNull(this.offlineStorage)
		const tokenizedMailsArray = await promiseMap(newTrainingMails, async (mail) => {
			const preprocessedMail = this.preprocessMail(mail)
			const tokenizedMail = await offlineStorage.tokenize(preprocessedMail)
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
					callbacks: {
						onEpochEnd: async (epoch, logs) => {
							console.log(`Epoch ${epoch + 1} - Loss: ${logs!.loss.toFixed(4)}`)
						},
					},
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
		const tokenizedMail = await assertNotNull(this.offlineStorage).tokenize(preprocessedMail)
		const vectors = await assertNotNull(this.vectorizer).transform([tokenizedMail])

		const xs = tensor2d(vectors, [vectors.length, assertNotNull(this.vectorizer).dimension], undefined)
		const predictionTensor = classifier.model.predict(xs) as Tensor
		const predictionData = await predictionTensor.data()
		const prediction = predictionData[0]

		console.log(`predicted new mail to be with probability ${prediction.toFixed(2)} spam. Owner Group: ${spamPredMailDatum.ownerGroup}`)

		// When using the webgl backend we need to manually dispose @tensorflow tensors
		xs.dispose()
		predictionTensor.dispose()

		return prediction > PREDICTION_THRESHOLD
	}

	/*
	 * TODO: Only for internal release
	 *
	 * Allows to check the accuracy of your currently trained classifier against the content of mailbox itself
	 * How-to:
	 * 1) Open console and switch context to worker-bootstrap.js
	 * 2) Execute this method in console: `locator.spamClassifier.getSpamMetricsForCurrentMailBox()`
	 * 3) Let execution continue from breakpoint
	 *
	 * Since we change constant of this.initializer,
	 * it's better to restart the client to not have unexpected effect
	 */
	public async getSpamMetricsForCurrentMailBox(ownerGroup?: Id): Promise<void> {
		const { LocalTimeDateProvider } = await import("../../../common/api/worker/DateProvider.js")
		const dateProvider = new LocalTimeDateProvider()

		const getIdOfClassificationMail = (classificationData: any) => {
			return ((classificationData.listId as Id) + "/" + classificationData.elementId) as Id
		}
		const user = assertNotNull((this.initializer as any).userFacade.getUser())
		const firstOwnerGroup = ownerGroup ?? filterMailMemberships(user)[0]._id
		console.log(`Testing with ownergroup: ${firstOwnerGroup}`)

		const readingAllSpamStart = performance.now()
		const trainedMails = await assertNotNull(this.offlineStorage)
			.getCertainSpamClassificationTrainingDataAfterCutoff(0, firstOwnerGroup)
			.then((mails) => new Set(mails.map(getIdOfClassificationMail)))
		console.log(`Done reading ${trainedMails.size} certain training mail data in: ${performance.now() - readingAllSpamStart}ms`)

		// since we train with last -28 days, we can test with last -90
		;(this.initializer as any).TIME_LIMIT = dateProvider.getStartOfDayShiftedBy(-90)
		// if exists, try to test with at 5xleast same number of mails as in training sample
		;(this.initializer as any).MIN_MAILS_COUNT = trainedMails.size * 5
		// to avoid putting stuff into offline storage
		;(this.initializer as any).offlineStorage.storeSpamClassification = async () => {
			console.log("not putting classification datum into offline storage")
		}

		const downloadingExtraMailsStart = performance.now()
		const testingMails = (await this.initializer.init(firstOwnerGroup))
			// do not test with the same mails that was used to train
			.filter((classificationData) => !trainedMails.has(getIdOfClassificationMail(classificationData)))
		console.log(`Done downloading extra ${testingMails.length} of last 90 days mail data in: ${performance.now() - downloadingExtraMailsStart}ms`)

		const testingAllSamplesStart = performance.now()
		await this.test(testingMails)
		console.log(`Done testing all extra mails sample in: ${performance.now() - testingAllSamplesStart}ms`)
	}

	public async test(mails: SpamTrainMailDatum[]): Promise<void> {
		if (!this.classifier) {
			throw new Error("Model has not been loaded")
		}

		let predictionArray: number[] = []
		for (let mail of mails) {
			const prediction = await this.predict(mail)
			predictionArray.push(prediction ? 1 : 0)
		}
		const ysArray = mails.map((mail) => mail.isSpam)

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

	// VisibleForTesting
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

	// === Testing methods
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
}
