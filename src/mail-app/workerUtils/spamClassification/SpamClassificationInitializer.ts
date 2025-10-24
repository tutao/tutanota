import { EntityClient } from "../../../common/api/common/EntityClient"
import { assertNotNull, isNotNull, lazyAsync } from "@tutao/tutanota-utils"
import { MailBag, MailboxGroupRootTypeRef, MailBoxTypeRef, MailFolder, MailFolderTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { getMailSetKind, getSpamConfidence, MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { elementIdPart, isSameId, listIdPart, timestampToGeneratedId } from "../../../common/api/common/utils/EntityUtils"
import { OfflineStoragePersistence } from "../index/OfflineStoragePersistence"
import { getMailBodyText } from "../../../common/api/common/CommonMailUtils"
import { BulkMailLoader, MailWithMailDetails } from "../index/BulkMailLoader"
import { hasError } from "../../../common/api/common/utils/ErrorUtils"
import { SpamTrainMailDatum } from "./SpamClassifier"

const INITIAL_SPAM_CLASSIFICATION_INDEX_INTERVAL_DAYS = 28

export class SpamClassificationInitializer {
	/*
	 * While downloading mails, we start from current mailbag, but it might be that current mailbag is too new,
	 * If there are less than this mail in current mailbag, we will also try to fetch previous one
	 */
	public readonly MIN_MAILS_COUNT: number = 300
	public readonly TIME_LIMIT: number = INITIAL_SPAM_CLASSIFICATION_INDEX_INTERVAL_DAYS * -1

	constructor(
		private readonly entityClient: EntityClient,
		private readonly offlineStorage: OfflineStoragePersistence,
		private readonly bulkMailLoader: lazyAsync<BulkMailLoader>,
	) {}

	public async init(ownerGroup: Id): Promise<SpamTrainMailDatum[]> {
		// populate the spam classification data with the last 28 days of mails if they are
		// available in the current mail bag
		const data = await this.downloadMailAndMailDetailsByGroupMembership(ownerGroup)
		data.filter((datum) => datum.isSpamConfidence > 0)
		data.map((datum) => this.offlineStorage.storeSpamClassification(datum))

		let spamMailsCount = 0
		let hamMailsCount = 0
		for (const spamTrainMailDatum of data) {
			await this.offlineStorage.storeSpamClassification(spamTrainMailDatum)

			if (spamTrainMailDatum.isSpam) spamMailsCount += 1
			else hamMailsCount += 1
		}

		console.log(
			`Downloaded ${spamMailsCount} spam mails and ${hamMailsCount} ham mails for group: ${ownerGroup}. Spam:Ham ratio is: ${(spamMailsCount / hamMailsCount).toFixed(2)}`,
		)

		return data
	}

	private async downloadMailAndMailDetailsByGroupMembership(mailGroupId: Id): Promise<Array<SpamTrainMailDatum>> {
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId)
		const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)
		const mailSets = await this.entityClient.loadAll(MailFolderTypeRef, assertNotNull(mailbox.folders).folders)
		const spamFolder = mailSets.find((s) => getMailSetKind(s) === MailSetKind.SPAM)!
		const inboxFolder = mailSets.find((s) => getMailSetKind(s) === MailSetKind.INBOX)!

		const downloadedMailClassificationDatas = new Array<SpamTrainMailDatum>()
		const allMailbags = [assertNotNull(mailbox.currentMailBag), ...mailbox.archivedMailBags].reverse() // sorted from latest to oldest

		for (
			let currentMailbag = allMailbags.pop();
			isNotNull(currentMailbag) && downloadedMailClassificationDatas.length < this.MIN_MAILS_COUNT;
			currentMailbag = allMailbags.pop()
		) {
			const mailsOfThisMailbag = await this.downloadMailAndMailDetailsByMailbag(currentMailbag, spamFolder, inboxFolder)
			downloadedMailClassificationDatas.push(...mailsOfThisMailbag)
		}

		return downloadedMailClassificationDatas
	}

	private async downloadMailAndMailDetailsByMailbag(mailbag: MailBag, spamFolder: MailFolder, inboxFolder: MailFolder): Promise<Array<SpamTrainMailDatum>> {
		const { LocalTimeDateProvider } = await import("../../../common/api/worker/DateProvider.js")
		const dateProvider = new LocalTimeDateProvider()
		const startTime = dateProvider.getStartOfDayShiftedBy(this.TIME_LIMIT).getTime()
		const bulkMailLoader = await this.bulkMailLoader()
		return await this.entityClient
			.loadAll(MailTypeRef, mailbag.mails, timestampToGeneratedId(startTime))
			// Filter out draft mails and mails with error
			.then((mails) => {
				return mails.filter((m) => isNotNull(m.mailDetails) && !hasError(m))
			})
			// Download mail details
			.then((mails) => bulkMailLoader.loadMailDetails(mails))
			// Map to spam mail datum
			.then((mails) => mails.map((m) => this.mailWithDetailsToMailDatum(spamFolder, inboxFolder, m)))
	}

	private mailWithDetailsToMailDatum(spamFolder: MailFolder, inboxFolder: MailFolder, { mail, mailDetails }: MailWithMailDetails): SpamTrainMailDatum {
		const isSpam = mail.sets.some((folderId) => isSameId(folderId, spamFolder._id))
		return {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(mailDetails.body),
			isSpam: isSpam,
			isSpamConfidence: getSpamConfidence(mail),
			listId: listIdPart(mail._id),
			elementId: elementIdPart(mail._id),
			ownerGroup: assertNotNull(mail._ownerGroup),
		} as SpamTrainMailDatum
	}
}
