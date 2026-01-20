import { EntityClient } from "../../../common/api/common/EntityClient"
import { assertNotNull, isEmpty, isNotNull, last, lazyAsync, promiseMap, splitInChunks } from "@tutao/tutanota-utils"
import {
	ClientSpamTrainingDatum,
	ClientSpamTrainingDatumIndexEntryTypeRef,
	ClientSpamTrainingDatumTypeRef,
	Mail,
	MailBag,
	MailBox,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailSet,
	MailSetTypeRef,
	MailTypeRef,
	PopulateClientSpamTrainingDatum,
} from "../../../common/api/entities/tutanota/TypeRefs"
import { getMailSetKind, isFolder, MailSetKind, MAX_NBR_OF_MAILS_SYNC_OPERATION, SpamDecision } from "../../../common/api/common/TutanotaConstants"
import {
	compareNewestFirst,
	GENERATED_MIN_ID,
	getElementId,
	isSameId,
	StrippedEntity,
	timestampToGeneratedId,
} from "../../../common/api/common/utils/EntityUtils"
import { BulkMailLoader, MailWithMailDetails } from "../index/BulkMailLoader"
import { hasError } from "../../../common/api/common/utils/ErrorUtils"
import { getSpamConfidence } from "../../../common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { isAppleDevice, isDesktop } from "../../../common/api/common/Env"

// visible for testing
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

export class SpamClassifierDataDealer {
	constructor(
		private readonly entityClient: EntityClient,
		private readonly bulkMailLoader: lazyAsync<BulkMailLoader>,
		private readonly mailFacade: lazyAsync<MailFacade>,
	) {}

	private getMaxMailsCapForDevice() {
		const MAX_MAILS_CAP_DESKTOP = 8000
		const MAX_MAILS_CAP_DESKTOP_APPLE = 4000
		const MAX_MAILS_CAP_APPLE = 1000
		const MAX_MAILS_CAP = 2000

		if (isAppleDevice()) {
			if (isDesktop()) {
				return MAX_MAILS_CAP_DESKTOP_APPLE
			} else {
				return MAX_MAILS_CAP_APPLE
			}
		} else {
			if (isDesktop()) {
				return MAX_MAILS_CAP_DESKTOP
			} else {
				return MAX_MAILS_CAP
			}
		}
	}

	public async fetchAllTrainingData(ownerGroup: Id): Promise<TrainingDataset> {
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, ownerGroup)
		const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)
		const mailSets = await this.entityClient.loadAll(MailSetTypeRef, mailbox.mailSets.mailSets)

		// clientSpamTrainingData is NOT cached
		let clientSpamTrainingData = await this.entityClient.loadAll(ClientSpamTrainingDatumTypeRef, mailbox.clientSpamTrainingData)
		console.log(`current clientSpamTrainingData list on the mailbox ${mailbox._id} has ${clientSpamTrainingData.length} members.`)
		// if the clientSpamTrainingData is empty or does not include all relevant clientSpamTrainingData
		// for this mailbox, we are aggregating the last INITIAL_SPAM_CLASSIFICATION_INDEX_INTERVAL_DAYS of mails
		// and upload the missing clientSpamTrainingDatum entries
		const allRelevantMailsInTrainingInterval = await this.fetchMailsForMailbox(mailbox, mailSets)
		console.log(`mailbox ${mailbox._id} has total ${allRelevantMailsInTrainingInterval.length} relevant mails in training interval for spam classification`)
		if (clientSpamTrainingData.length < allRelevantMailsInTrainingInterval.length) {
			const mailsToUpload = allRelevantMailsInTrainingInterval.filter((mail) => {
				return !clientSpamTrainingData.some((datum) => isSameId(getElementId(mail), getElementId(datum)))
			})
			console.log("building and uploading initial / new training data for mailbox: " + mailbox._id)
			console.log(`mailbox ${mailbox._id} has ${mailsToUpload.length} new mails suitable for encrypted training vector data upload`)
			const bulkMailLoader = await this.bulkMailLoader()
			await promiseMap(
				splitInChunks(MAX_NBR_OF_MAILS_SYNC_OPERATION, mailsToUpload),
				async (mailChunk) => {
					const mailChunkWithDetails = await bulkMailLoader.loadMailDetails(mailChunk)
					await this.uploadTrainingDataForMails(mailChunkWithDetails, mailbox, mailSets)
				},
				{ concurrency: 5 },
			)
			clientSpamTrainingData = await this.entityClient.loadAll(ClientSpamTrainingDatumTypeRef, mailbox.clientSpamTrainingData)
			console.log(`new clientSpamTrainingData list on the mailbox ${mailbox._id} has ${clientSpamTrainingData.length} members.`)
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
	subsampleHamAndSpamMails(
		clientSpamTrainingData: ClientSpamTrainingDatum[],
		maxMailsCap: number = this.getMaxMailsCapForDevice(),
	): {
		subsampledTrainingData: ClientSpamTrainingDatum[]
		hamCount: number
		spamCount: number
	} {
		// we always want to include clientSpamTrainingData with high confidence (usually 4), because these mails have been moved explicitly by the user
		// we always want to include more recently received mails before including older mails
		const HIGH_CONFIDENCE_THRESHOLD = 4

		const dateSortedClientSpamTrainingData = clientSpamTrainingData.sort((l, r) => compareNewestFirst(l._id, r._id))

		const hamDataHighConfidence = dateSortedClientSpamTrainingData.filter(
			(d) => Number(d.confidence) >= HIGH_CONFIDENCE_THRESHOLD && d.spamDecision === SpamDecision.WHITELIST,
		)

		const spamDataHighConfidence = dateSortedClientSpamTrainingData.filter(
			(d) => Number(d.confidence) >= HIGH_CONFIDENCE_THRESHOLD && d.spamDecision === SpamDecision.BLACKLIST,
		)

		const hamDataLowConfidence = dateSortedClientSpamTrainingData.filter(
			(d) => Number(d.confidence) > 0 && Number(d.confidence) < HIGH_CONFIDENCE_THRESHOLD && d.spamDecision === SpamDecision.WHITELIST,
		)

		const spamDataLowConfidence = dateSortedClientSpamTrainingData.filter(
			(d) => Number(d.confidence) > 0 && Number(d.confidence) < HIGH_CONFIDENCE_THRESHOLD && d.spamDecision === SpamDecision.BLACKLIST,
		)

		const hamCount = hamDataHighConfidence.length + hamDataLowConfidence.length
		const spamCount = spamDataHighConfidence.length + spamDataLowConfidence.length

		const MAX_RATIO = 10
		const MIN_RATIO = 1 / 10

		// in case a mailbox has 0 ham mails or 0 spam mails we use the ratio DEFAULT_HAM_COUNT/x or x/DEFAULT_SPAM_COUNT
		const DEFAULT_HAM_COUNT = 1
		const DEFAULT_SPAM_COUNT = 1
		const ratio = Math.max(hamCount, DEFAULT_HAM_COUNT) / Math.max(spamCount, DEFAULT_SPAM_COUNT)

		let sampledHamLowConfidence = hamDataLowConfidence
		let sampledSpamLowConfidence = spamDataLowConfidence

		if (ratio > MAX_RATIO) {
			const targetHamCount = Math.floor(spamCount * MAX_RATIO)
			sampledHamLowConfidence = this.sampleEntriesFromArray(hamDataLowConfidence, targetHamCount)
		} else if (ratio < MIN_RATIO) {
			const targetSpamCount = Math.floor(hamCount * (1 / MIN_RATIO))
			sampledSpamLowConfidence = this.sampleEntriesFromArray(spamDataLowConfidence, targetSpamCount)
		}

		const finalHam = hamDataHighConfidence.concat(sampledHamLowConfidence)
		const finalSpam = spamDataHighConfidence.concat(sampledSpamLowConfidence)
		const finalHamSize = finalHam.length
		const finalSpamSize = finalSpam.length
		const finalSize = finalHamSize + finalSpamSize

		const finalHamCapped = finalHam.slice(0, Math.floor((finalHamSize / finalSize) * maxMailsCap))
		const finalSpamCapped = finalSpam.slice(0, Math.floor((finalSpamSize / finalSize) * maxMailsCap))

		const balanced = [...finalHamCapped, ...finalSpamCapped]
		console.log(
			`Subsampled training data to ${finalHam.length} ham (${hamDataHighConfidence.length} are confidence > ${HIGH_CONFIDENCE_THRESHOLD} ; capped to: ${finalHamCapped.length}) and ${finalSpam.length} spam (${spamDataHighConfidence.length} are confidence > ${HIGH_CONFIDENCE_THRESHOLD} ; capped to: ${finalSpamCapped.length}) (ratio ${(finalHam.length / finalSpam.length).toFixed(2)}).`,
		)

		return { subsampledTrainingData: balanced, hamCount: finalHamCapped.length, spamCount: finalSpamCapped.length }
	}

	// Visible for testing
	async fetchMailsByMailbagAfterDate(mailbag: MailBag, mailSets: MailSet[], startDate: Date): Promise<Array<Mail>> {
		const mails = await this.entityClient.loadAll(MailTypeRef, mailbag.mails, timestampToGeneratedId(startDate.getTime()))
		const trashFolder = assertNotNull(mailSets.find((set) => getMailSetKind(set) === MailSetKind.TRASH))
		return mails.filter((mail) => {
			const isMailTrashed = mail.sets.some((setId) => isSameId(setId, trashFolder._id))
			return isNotNull(mail.mailDetails) && !hasError(mail) && mail.receivedDate > startDate && !isMailTrashed
		})
	}

	private async fetchMailsForMailbox(mailbox: MailBox, mailSets: MailSet[]): Promise<Array<Mail>> {
		const downloadedMailClassificationData = new Array<Mail>()

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

	private async uploadTrainingDataForMails(mails: MailWithMailDetails[], mailBox: MailBox, mailSets: MailSet[]): Promise<void> {
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
