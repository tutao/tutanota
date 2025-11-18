import { EntityClient } from "../../../common/api/common/EntityClient"
import { assertNotNull, isEmpty, isNotNull, last, lazyAsync, promiseMap } from "@tutao/tutanota-utils"
import {
	ClientSpamTrainingDatum,
	ClientSpamTrainingDatumIndexEntryTypeRef,
	ClientSpamTrainingDatumTypeRef,
	MailBag,
	MailBox,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailFolder,
	MailFolderTypeRef,
	MailTypeRef,
	PopulateClientSpamTrainingDatum,
} from "../../../common/api/entities/tutanota/TypeRefs"
import { getMailSetKind, isFolder, MailSetKind, SpamDecision } from "../../../common/api/common/TutanotaConstants"
import { GENERATED_MIN_ID, getElementId, isSameId, StrippedEntity, timestampToGeneratedId } from "../../../common/api/common/utils/EntityUtils"
import { BulkMailLoader, MailWithMailDetails } from "../index/BulkMailLoader"
import { hasError } from "../../../common/api/common/utils/ErrorUtils"
import { getSpamConfidence } from "../../../common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"

//Visible for testing
export const SINGLE_TRAIN_INTERVAL_TRAINING_DATA_LIMIT = 1000
const INITIAL_SPAM_CLASSIFICATION_INDEX_INTERVAL_DAYS = 90
const TRAINING_DATA_TIME_LIMIT: number = INITIAL_SPAM_CLASSIFICATION_INDEX_INTERVAL_DAYS * -1

export type TrainingDataset = {
	trainingData: ClientSpamTrainingDatum[]
	lastTrainingDataIndexId: Id
	hamCount: number
	spamCount: number
}

export type UnencryptedPopulateClientSpamTrainingDatum = Omit<StrippedEntity<PopulateClientSpamTrainingDatum>, "encVector" | "ownerEncVectorSessionKey"> & {
	vector: Uint8Array
}

export class SpamClassificationDataDealer {
	constructor(
		private readonly entityClient: EntityClient,
		private readonly bulkMailLoader: lazyAsync<BulkMailLoader>,
		private readonly mailFacade: lazyAsync<MailFacade>,
	) {}

	public async fetchAllTrainingData(ownerGroup: Id): Promise<TrainingDataset> {
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, ownerGroup)
		const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)
		const mailSets = await this.entityClient.loadAll(MailFolderTypeRef, assertNotNull(mailbox.folders).folders)

		if (mailbox.clientSpamTrainingData == null || mailbox.modifiedClientSpamTrainingDataIndex == null) {
			return { trainingData: [], lastTrainingDataIndexId: GENERATED_MIN_ID, hamCount: 0, spamCount: 0 }
		}

		// clientSpamTrainingData is NOT cached
		let clientSpamTrainingData = await this.entityClient.loadAll(ClientSpamTrainingDatumTypeRef, mailbox.clientSpamTrainingData)

		// if the training data is empty for this mailbox, we are aggregating
		// the last INITIAL_SPAM_CLASSIFICATION_INDEX_INTERVAL_DAYS of mails and uploading the training data
		if (isEmpty(clientSpamTrainingData)) {
			console.log("building and uploading initial training data for mailbox: " + mailbox._id)
			const mailsWithMailDetails = await this.fetchMailAndMailDetailsForMailbox(mailbox, mailSets)
			console.log(`mailbox has ${mailsWithMailDetails.length} mails suitable for encrypted training vector data upload`)
			console.log(`vectorizing, compressing and encrypting those ${mailsWithMailDetails.length} mails...`)
			await this.uploadTrainingDataForMails(mailsWithMailDetails, mailbox, mailSets)
			clientSpamTrainingData = await this.entityClient.loadAll(ClientSpamTrainingDatumTypeRef, mailbox.clientSpamTrainingData)
			console.log(`clientSpamTrainingData list on the mailbox has ${clientSpamTrainingData.length} members.`)
		}

		const { subsampledTrainingData, hamCount, spamCount } = this.subsampleHamAndSpamMails(clientSpamTrainingData)

		const modifiedClientSpamTrainingDataIndices = await this.entityClient.loadAll(
			ClientSpamTrainingDatumIndexEntryTypeRef,
			mailbox.modifiedClientSpamTrainingDataIndex,
		)
		const lastModifiedClientSpamTrainingDataIndexElementId = isEmpty(modifiedClientSpamTrainingDataIndices)
			? GENERATED_MIN_ID
			: getElementId(assertNotNull(last(modifiedClientSpamTrainingDataIndices)))

		return {
			trainingData: subsampledTrainingData,
			lastTrainingDataIndexId: lastModifiedClientSpamTrainingDataIndexElementId,
			hamCount,
			spamCount,
		}
	}

	async fetchPartialTrainingDataFromIndexStartId(indexStartId: Id, ownerGroup: Id): Promise<TrainingDataset> {
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, ownerGroup)
		const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)

		const emptyResult = { trainingData: [], lastTrainingDataIndexId: indexStartId, hamCount: 0, spamCount: 0 }
		if (mailbox.clientSpamTrainingData == null || mailbox.modifiedClientSpamTrainingDataIndex == null) {
			return emptyResult
		}

		const modifiedClientSpamTrainingDataIndicesSinceStart = await this.entityClient.loadRange(
			ClientSpamTrainingDatumIndexEntryTypeRef,
			mailbox.modifiedClientSpamTrainingDataIndex,
			indexStartId,
			SINGLE_TRAIN_INTERVAL_TRAINING_DATA_LIMIT,
			false,
		)

		if (isEmpty(modifiedClientSpamTrainingDataIndicesSinceStart)) {
			return emptyResult
		}

		const clientSpamTrainingData = await this.entityClient.loadMultiple(
			ClientSpamTrainingDatumTypeRef,
			mailbox.clientSpamTrainingData,
			modifiedClientSpamTrainingDataIndicesSinceStart.map((index) => index.clientSpamTrainingDatumElementId),
		)

		const { subsampledTrainingData, hamCount, spamCount } = this.subsampleHamAndSpamMails(clientSpamTrainingData)

		return {
			trainingData: subsampledTrainingData,
			lastTrainingDataIndexId: getElementId(assertNotNull(last(modifiedClientSpamTrainingDataIndicesSinceStart))),
			hamCount,
			spamCount,
		}
	}

	// Visible for testing
	subsampleHamAndSpamMails(clientSpamTrainingData: ClientSpamTrainingDatum[]): {
		subsampledTrainingData: ClientSpamTrainingDatum[]
		hamCount: number
		spamCount: number
	} {
		//  we always want to include clientSpamTrainingData with high confidence (usually 4), because these mails have been moved explicitly by the user
		const hamDataHighConfidence = clientSpamTrainingData.filter((d) => Number(d.confidence) > 1 && d.spamDecision === SpamDecision.WHITELIST)
		const spamDataHighConfidence = clientSpamTrainingData.filter((d) => Number(d.confidence) > 1 && d.spamDecision === SpamDecision.BLACKLIST)

		const hamDataLowConfidence = clientSpamTrainingData.filter((d) => Number(d.confidence) === 1 && d.spamDecision === SpamDecision.WHITELIST)
		const spamDataLowConfidence = clientSpamTrainingData.filter((d) => Number(d.confidence) === 1 && d.spamDecision === SpamDecision.BLACKLIST)

		const hamCount = hamDataHighConfidence.length + hamDataLowConfidence.length
		const spamCount = spamDataHighConfidence.length + spamDataLowConfidence.length

		if (hamCount === 0 || spamCount === 0) {
			return { subsampledTrainingData: clientSpamTrainingData, hamCount, spamCount }
		}

		const ratio = hamCount / spamCount
		const MAX_RATIO = 10
		const MIN_RATIO = 1 / 10

		let sampledHamLowConfidence = hamDataLowConfidence
		let sampledSpamLowConfidence = spamDataLowConfidence

		if (ratio > MAX_RATIO) {
			const targetHamCount = Math.floor(spamCount * MAX_RATIO)
			sampledHamLowConfidence = this.sampleEntriesFromArray(hamDataLowConfidence, targetHamCount)
		} else if (ratio < MIN_RATIO) {
			const targetSpamCount = Math.floor(hamCount * MAX_RATIO)
			sampledSpamLowConfidence = this.sampleEntriesFromArray(spamDataLowConfidence, targetSpamCount)
		}

		const finalHam = hamDataHighConfidence.concat(sampledHamLowConfidence)
		const finalSpam = spamDataHighConfidence.concat(sampledSpamLowConfidence)

		const balanced = [...finalHam, ...finalSpam]
		console.log(
			`Subsampled training data to ${finalHam.length} ham (${hamDataHighConfidence.length} are confidence > 1) and ${finalSpam.length} spam (${spamDataHighConfidence.length} are confidence > 1) (ratio ${(finalHam.length / finalSpam.length).toFixed(2)}).`,
		)

		return { subsampledTrainingData: balanced, hamCount: finalHam.length, spamCount: finalSpam.length }
	}

	// Visible for testing
	async fetchMailsByMailbagAfterDate(mailbag: MailBag, mailSets: MailFolder[], startDate: Date): Promise<Array<MailWithMailDetails>> {
		const bulkMailLoader = await this.bulkMailLoader()
		const mails = await this.entityClient.loadAll(MailTypeRef, mailbag.mails, timestampToGeneratedId(startDate.getTime()))
		const filteredMails = mails.filter((mail) => {
			const trashFolder = assertNotNull(mailSets.find((set) => getMailSetKind(set) === MailSetKind.TRASH))
			const isMailTrashed = mail.sets.some((setId) => isSameId(setId, trashFolder._id))
			return isNotNull(mail.mailDetails) && !hasError(mail) && mail.receivedDate > startDate && !isMailTrashed
		})
		const mailsWithMailDetails = await bulkMailLoader.loadMailDetails(filteredMails)
		return mailsWithMailDetails ?? []
	}

	private async fetchMailAndMailDetailsForMailbox(mailbox: MailBox, mailSets: MailFolder[]): Promise<Array<MailWithMailDetails>> {
		const downloadedMailClassificationData = new Array<MailWithMailDetails>()

		const { LocalTimeDateProvider } = await import("../../../common/api/worker/DateProvider")
		const startDate = new LocalTimeDateProvider().getStartOfDayShiftedBy(TRAINING_DATA_TIME_LIMIT)

		// sorted from latest to oldest
		const mailbagsToFetch = [assertNotNull(mailbox.currentMailBag), ...mailbox.archivedMailBags.reverse()]
		for (let currentMailbag = mailbagsToFetch.shift(); isNotNull(currentMailbag); currentMailbag = mailbagsToFetch.shift()) {
			const mailsOfThisMailbag = await this.fetchMailsByMailbagAfterDate(currentMailbag, mailSets, startDate)
			if (isEmpty(mailsOfThisMailbag)) {
				// the list is empty if none of the mails in the mailbag were recent enough,
				// therefore, there is no point in requesting the remaining mailbags unnecessarily
				break
			}
			downloadedMailClassificationData.push(...mailsOfThisMailbag)
		}
		return downloadedMailClassificationData
	}

	private async uploadTrainingDataForMails(mails: MailWithMailDetails[], mailBox: MailBox, mailSets: MailFolder[]): Promise<void> {
		const clientSpamTrainingDataListId = mailBox.clientSpamTrainingData
		if (clientSpamTrainingDataListId == null) {
			return
		}

		const unencryptedPopulateClientSpamTrainingData: UnencryptedPopulateClientSpamTrainingDatum[] = await promiseMap(
			mails,
			async (mailWithDetail) => {
				const { mail, mailDetails } = mailWithDetail
				const allMailFolders = mailSets.filter((mailSet) => isFolder(mailSet)).map((mailFolder) => mailFolder._id)
				const sourceMailFolderId = assertNotNull(mail.sets.find((setId) => allMailFolders.find((folderId) => isSameId(setId, folderId))))
				const sourceMailFolder = assertNotNull(mailSets.find((set) => isSameId(set._id, sourceMailFolderId)))
				const isSpam = getMailSetKind(sourceMailFolder) === MailSetKind.SPAM
				const unencryptedPopulateClientSpamTrainingData: UnencryptedPopulateClientSpamTrainingDatum = {
					mailId: mail._id,
					isSpam,
					confidence: getSpamConfidence(mail),
					vector: await (await this.mailFacade()).vectorizeAndCompressMails({ mail, mailDetails }),
				}
				return unencryptedPopulateClientSpamTrainingData
			},
			{
				concurrency: 5,
			},
		)

		if (!isEmpty(unencryptedPopulateClientSpamTrainingData)) {
			// we are uploading the initial spam training data using the PopulateClientSpamTrainingDataService
			return (await this.mailFacade()).populateClientSpamTrainingData(assertNotNull(mailBox._ownerGroup), unencryptedPopulateClientSpamTrainingData)
		}
	}

	private sampleEntriesFromArray<T>(arr: T[], numberOfEntries: number): T[] {
		if (numberOfEntries >= arr.length) {
			return arr
		}
		const shuffled = arr.slice().sort(() => Math.random() - 0.5)
		return shuffled.slice(0, numberOfEntries)
	}
}
