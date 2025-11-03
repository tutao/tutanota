import { EntityClient } from "../../../common/api/common/EntityClient"
import { assertNotNull, isEmpty, isNotNull, last, lazyAsync, promiseMap } from "@tutao/tutanota-utils"
import {
	ClientSpamTrainingDatum,
	ClientSpamTrainingDatumIndexEntryTypeRef,
	ClientSpamTrainingDatumTypeRef,
	createClientSpamTrainingDatum,
	MailBag,
	MailBox,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailFolder,
	MailFolderTypeRef,
	MailTypeRef,
} from "../../../common/api/entities/tutanota/TypeRefs"
import { getMailSetKind, getSpamConfidence, MailSetKind, SpamDecision } from "../../../common/api/common/TutanotaConstants"
import { GENERATED_MIN_ID, getElementId, isSameId, timestampToGeneratedId } from "../../../common/api/common/utils/EntityUtils"
import { BulkMailLoader, MailWithMailDetails } from "../index/BulkMailLoader"
import { hasError } from "../../../common/api/common/utils/ErrorUtils"
import { SpamMailProcessor } from "./SpamMailProcessor"
import { createSpamMailDatum } from "../../mail/model/SpamClassificationHandler"
import { CacheMode } from "../../../common/api/worker/rest/EntityRestClient"

/*
 * While downloading mails, we start from the current mailbag. However, it might be that the current mailbag is too new,
 * If there is less than this number of mails in the current mailbag, we will also try to fetch the previous one
 */
const MIN_MAILBAG_MAILS_COUNT: number = 300

const SINGLE_TRAIN_INTERVAL_TRAINING_DATA_LIMIT = 1000
const INITIAL_SPAM_CLASSIFICATION_INDEX_INTERVAL_DAYS = 90
const TRAINING_DATA_TIME_LIMIT: number = INITIAL_SPAM_CLASSIFICATION_INDEX_INTERVAL_DAYS * -1

export type TrainingDataset = {
	trainingData: ClientSpamTrainingDatum[]
	lastTrainingDataIndexId: Id
	hamCount: number
	spamCount: number
}

export class SpamClassificationDataDealer {
	constructor(
		private readonly entityClient: EntityClient,
		private readonly bulkMailLoader: lazyAsync<BulkMailLoader>,
		private readonly spamMailProcessor: SpamMailProcessor = new SpamMailProcessor(),
	) {}

	public async fetchAllTrainingData(ownerGroup: Id): Promise<TrainingDataset> {
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, ownerGroup)
		const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)
		const mailSets = await this.entityClient.loadAll(MailFolderTypeRef, assertNotNull(mailbox.folders).folders)
		const spamFolder = assertNotNull(mailSets.find((s) => getMailSetKind(s) === MailSetKind.SPAM))

		if (mailbox.clientSpamTrainingData == null || mailbox.modifiedClientSpamTrainingDataIndex == null) {
			return { trainingData: [], lastTrainingDataIndexId: GENERATED_MIN_ID, hamCount: 0, spamCount: 0 }
		}

		// clientSpamTrainingData is NOT cached
		let clientSpamTrainingData = await this.entityClient.loadAll(ClientSpamTrainingDatumTypeRef, mailbox.clientSpamTrainingData)

		// if the training data is empty for this mailbox, we are aggregating
		// the last INITIAL_SPAM_CLASSIFICATION_INDEX_INTERVAL_DAYS of mails and uploading the training data
		if (isEmpty(clientSpamTrainingData)) {
			console.log("building and uploading initial training data for mailbox: " + mailbox._id)
			const mailsWithMailDetails = await this.fetchMailAndMailDetailsForMailbox(mailbox)
			await this.uploadTrainingDataForMails(mailsWithMailDetails, mailbox, spamFolder)
			clientSpamTrainingData = await this.entityClient.loadAll(ClientSpamTrainingDatumTypeRef, mailbox.clientSpamTrainingData)
		}
		clientSpamTrainingData.filter((datum) => Number(datum.confidence) > 0 && datum.spamDecision !== SpamDecision.NONE)
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
			undefined,
			{ cacheMode: CacheMode.WriteOnly }, // needs to be writeOnly to ensure that the cacheStorage is updated
		)

		clientSpamTrainingData.filter(
			(datum) => Number(datum.confidence) > 0 && datum.spamDecision !== SpamDecision.NONE && datum.spamDecision !== SpamDecision.DISCARD,
		)
		const { subsampledTrainingData, hamCount, spamCount } = this.subsampleHamAndSpamMails(clientSpamTrainingData)

		return {
			trainingData: subsampledTrainingData,
			lastTrainingDataIndexId: getElementId(assertNotNull(last(modifiedClientSpamTrainingDataIndicesSinceStart))),
			hamCount,
			spamCount,
		}
	}

	private async fetchMailAndMailDetailsForMailbox(mailbox: MailBox): Promise<Array<MailWithMailDetails>> {
		const downloadedMailClassificationData = new Array<MailWithMailDetails>()

		// sorted from latest to oldest
		const allMailbags = [assertNotNull(mailbox.currentMailBag), ...mailbox.archivedMailBags]

		for (
			let currentMailbag = allMailbags.shift();
			isNotNull(currentMailbag) && downloadedMailClassificationData.length < MIN_MAILBAG_MAILS_COUNT;
			currentMailbag = allMailbags.shift()
		) {
			const mailsOfThisMailbag = await this.fetchMailAndMailDetailsByMailbag(currentMailbag)
			downloadedMailClassificationData.push(...mailsOfThisMailbag)
		}

		return downloadedMailClassificationData
	}

	private async fetchMailAndMailDetailsByMailbag(mailbag: MailBag): Promise<Array<MailWithMailDetails>> {
		const { LocalTimeDateProvider } = await import("../../../common/api/worker/DateProvider.js")
		const dateProvider = new LocalTimeDateProvider()
		const startTime = dateProvider.getStartOfDayShiftedBy(TRAINING_DATA_TIME_LIMIT).getTime()
		const bulkMailLoader = await this.bulkMailLoader()
		return await this.entityClient
			.loadAll(MailTypeRef, mailbag.mails, timestampToGeneratedId(startTime))
			// Filter out draft mails and mails with error
			.then((mails) => {
				return mails.filter((m) => isNotNull(m.mailDetails) && !hasError(m))
			})
			// Download mail details
			.then((mails) => bulkMailLoader.loadMailDetails(mails))
	}

	private async uploadTrainingDataForMails(mails: MailWithMailDetails[], mailBox: MailBox, spamFolder: MailFolder): Promise<void> {
		const clientSpamTrainingData: ClientSpamTrainingDatum[] = await promiseMap(
			mails,
			async (mailWithDetail) => {
				const { mail, mailDetails } = mailWithDetail
				const isSpam = mail.sets.some((folderId) => isSameId(folderId, spamFolder._id))
				return createClientSpamTrainingDatum({
					_ownerGroup: assertNotNull(mailBox._ownerGroup),
					confidence: getSpamConfidence(mail).toString(),
					spamDecision: isSpam ? SpamDecision.BLACKLIST : SpamDecision.WHITELIST,
					vector: await this.spamMailProcessor.vectorizeAndCompress(createSpamMailDatum(mail, mailDetails)),
				})
			},
			{
				concurrency: 5,
			},
		)

		await this.entityClient.setupMultipleEntities(mailBox.clientSpamTrainingData, clientSpamTrainingData)
	}

	// Visible for testing
	subsampleHamAndSpamMails(clientSpamTrainingData: ClientSpamTrainingDatum[]): {
		subsampledTrainingData: ClientSpamTrainingDatum[]
		hamCount: number
		spamCount: number
	} {
		const hamData = clientSpamTrainingData.filter((d) => d.spamDecision === SpamDecision.WHITELIST)
		const spamData = clientSpamTrainingData.filter((d) => d.spamDecision === SpamDecision.BLACKLIST || d.spamDecision === SpamDecision.DISCARD)

		const hamCount = hamData.length
		const spamCount = spamData.length

		if (hamCount === 0 || spamCount === 0) {
			return { subsampledTrainingData: clientSpamTrainingData, hamCount, spamCount }
		}

		const ratio = hamCount / spamCount
		const MAX_RATIO = 10
		const MIN_RATIO = 1 / 10

		let finalHam = hamData
		let finalSpam = spamData

		if (ratio > MAX_RATIO) {
			const targetHamCount = Math.floor(spamCount * MAX_RATIO)
			finalHam = this.sampleEntriesFromArray(hamData, targetHamCount)
		} else if (ratio < MIN_RATIO) {
			const targetSpamCount = Math.floor(hamCount * MAX_RATIO)
			finalSpam = this.sampleEntriesFromArray(spamData, targetSpamCount)
		}

		const balanced = [...finalHam, ...finalSpam]
		console.log(
			`Subsampled training data to ${finalHam.length} ham and ${finalSpam.length} spam (ratio ${(finalHam.length / finalSpam.length).toFixed(2)}).`,
		)

		return { subsampledTrainingData: balanced, hamCount: finalHam.length, spamCount: finalSpam.length }
	}

	private sampleEntriesFromArray<T>(arr: T[], numberOfEntries: number): T[] {
		if (numberOfEntries >= arr.length) {
			return arr
		}
		const shuffled = arr.slice().sort(() => Math.random() - 0.5)
		return shuffled.slice(0, numberOfEntries)
	}
}
