// @ts-ignore[untyped-import]
import bayes, { BayesClassifier } from "bayes"
import { OfflineStoragePersistence } from "../index/OfflineStoragePersistence"
import { FileFacade } from "../../../common/native/common/generatedipc/FileFacade"
import { stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { assertWorkerOrNode } from "../../../common/api/common/Env"

assertWorkerOrNode()

export type SpamClassificationRow = {
	listId: string
	elementId: string
	subject: string
	body: string
	isSpam: boolean
}

export class SpamClassifier {
	private classifier: BayesClassifier | null = null
	private readonly modelFilename = "spam_classification_model"

	constructor(
		private readonly offlineStorage: OfflineStoragePersistence,
		private readonly fileFacade: FileFacade,
	) {}

	public async train(userId: string): Promise<void> {
		this.classifier = bayes()

		const trainingData = await this.offlineStorage.getSpamMailClassifications()
		console.log("training corpus size: " + trainingData.length)
		trainingData.map(async (trainingDatum) => {
			const input = `${trainingDatum.subject} ${trainingDatum.body}`
			const label = trainingDatum.isSpam ? "spam" : "ham"
			await this.classifier.learn(input, label)
		})

		const json = await this.classifier.toJson()
		const bytes = stringToUtf8Uint8Array(json)
		await this.fileFacade.writeToAppDir(bytes, `${this.modelFilename}_${userId}.json`)
	}

	public async predict(subjectAndBody: string, userId: string): Promise<boolean> {
		if (!this.classifier) {
			await this.loadModel(userId)
		}

		if (!this.classifier) {
			console.error("Classifier not trained or model not found.")
			return false
		}

		const label = await this.classifier.categorize(subjectAndBody)
		return label === "spam"
	}

	private async loadModel(userId: string): Promise<void> {
		try {
			const data = await this.fileFacade.readFromAppDir(`${this.modelFilename}_${userId}.json`)
			const json = utf8Uint8ArrayToString(data)
			this.classifier = await bayes.fromJson(json)
		} catch (e) {
			console.error(e)
			this.classifier = null
		}
	}
}
