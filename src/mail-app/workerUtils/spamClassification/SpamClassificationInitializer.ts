import { EntityClient } from "../../../common/api/common/EntityClient"
import { UserFacade } from "../../../common/api/worker/facades/UserFacade"
import { assertNotNull, groupByAndMap, isNotNull, promiseMap } from "@tutao/tutanota-utils"
import { filterMailMemberships } from "../../../common/api/worker/search/IndexUtils"
import { GroupMembership } from "../../../common/api/entities/sys/TypeRefs"
import {
	Mail,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailDetails,
	MailDetailsBlobTypeRef,
	MailFolderTypeRef,
	MailTypeRef,
} from "../../../common/api/entities/tutanota/TypeRefs"
import { getMailSetKind, MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { LocalTimeDateProvider } from "../../../common/api/worker/DateProvider"
import { INITIAL_MAIL_INDEX_INTERVAL_DAYS } from "../index/MailIndexer"
import { elementIdPart, isSameId, listIdPart, timestampToGeneratedId } from "../../../common/api/common/utils/EntityUtils"
import { OfflineStoragePersistence } from "../index/OfflineStoragePersistence"
import { CacheMode } from "../../../common/api/worker/rest/EntityRestClient"
import { SpamTrainMailDatum } from "./SpamClassifier"
import { getMailBodyText } from "../../../common/api/common/CommonMailUtils"

export class SpamClassificationInitializer {
	constructor(
		private readonly entityClient: EntityClient,
		private readonly userFacade: UserFacade,
		private readonly offlineStorage: OfflineStoragePersistence,
	) {}

	public async init() {
		// populate the spam classification data with the last 28 days of mails if they are
		// available in the current mail bag
		const user = assertNotNull(this.userFacade.getUser())
		const memberships = filterMailMemberships(user)
		const spamTrainMailData = (await promiseMap(memberships, (group) => this.downloadMailAndMailDetailsByGroupMembership(group))).flat()
		for (const spamTrainMailDatum of spamTrainMailData) {
			await this.offlineStorage.storeSpamClassification(spamTrainMailDatum)
		}
		return spamTrainMailData.flat()
	}

	// TODO: can we re-use MailBulkLoader
	private async downloadMailAndMailDetailsByGroupMembership(mailGroupMembership: GroupMembership): Promise<Array<SpamTrainMailDatum>> {
		const mailGroupId = mailGroupMembership.group
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId)
		const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)
		const mailSets = await this.entityClient.loadAll(MailFolderTypeRef, assertNotNull(mailbox.folders).folders)
		const spamFolder = mailSets.find((s) => getMailSetKind(s) === MailSetKind.SPAM)!
		const inboxFolder = mailSets.find((s) => getMailSetKind(s) === MailSetKind.INBOX)!
		const mailList = assertNotNull(mailbox.currentMailBag).mails
		const dateProvider = new LocalTimeDateProvider()
		const startTime = dateProvider.getStartOfDayShiftedBy(-INITIAL_MAIL_INDEX_INTERVAL_DAYS).getTime()
		const mails = await this.entityClient.loadAll(MailTypeRef, mailList, timestampToGeneratedId(startTime)).then((mails) => {
			// Filter out draft mails
			return mails.filter((m) => isNotNull(m.mailDetails))
		})
		const groupedMailDetailIds = groupByAndMap(
			mails.map((m) => m.mailDetails!),
			listIdPart,
			elementIdPart,
		)
		const loadedMailDetailsBlobs = await promiseMap(groupedMailDetailIds, ([mailDetailListId, mailDetailElementIds]) =>
			this.entityClient.loadMultiple(MailDetailsBlobTypeRef, mailDetailListId, mailDetailElementIds, undefined, { cacheMode: CacheMode.ReadOnly }),
		)
		const loadedMailDetailsById = loadedMailDetailsBlobs.flat().reduce((map, detailsBlob) => {
			map.set(elementIdPart(detailsBlob._id), detailsBlob.details)
			return map
		}, new Map<Id, MailDetails>())

		const classifiedMails = mails.map((mail: Mail) => {
			const mailDetails = loadedMailDetailsById.get(elementIdPart(mail.mailDetails!))
			if (!mailDetails) {
				// Mail details might have been deleted in the meantime.
				// but is not a problem
				return null
			}
			const isSpam = mail.sets.some((folderId) => isSameId(folderId, spamFolder._id))
			const isCertain = !mail.unread || !mail.sets.some((folderId) => isSameId(folderId, inboxFolder._id))
			return {
				mailId: mail._id,
				subject: mail.subject,
				body: getMailBodyText(mailDetails.body),
				isSpam: isSpam,
				isCertain: isCertain,
			} as SpamTrainMailDatum
		})
		return classifiedMails.filter(isNotNull)
	}
}
