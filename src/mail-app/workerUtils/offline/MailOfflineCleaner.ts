import { assertNotNull, groupByAndMap } from "@tutao/utils"
import {
	constructMailSetEntryId,
	elementIdPart,
	firstBiggerThanSecondBase64Url,
	GENERATED_MAX_ID,
	getElementId,
	getOfflineStorageDefaultTimeRangeDays,
	listIdPart,
	sysTypeRefs,
	tutanotaTypeRefs,
} from "@tutao/typerefs"
import { OfflineStorage, OfflineStorageCleaner } from "../../../common/api/worker/offline/OfflineStorage.js"
import { AccountType, daysToMillis } from "@tutao/app-env"

export class MailOfflineCleaner implements OfflineStorageCleaner {
	private cutOffId: Id | null = null

	private async calculateCutOffId(offlineStorage: OfflineStorage, userId: string, timeRangeDate: Date | null, now: number): Promise<Id> {
		if (!this.cutOffId) {
			const accountType = assertNotNull(await offlineStorage.get(sysTypeRefs.UserTypeRef, null, userId)).accountType as AccountType
			// Free users always have default time range regardless of what is stored
			const cutoffDate =
				accountType !== AccountType.FREE && timeRangeDate != null
					? timeRangeDate
					: new Date(now - daysToMillis(getOfflineStorageDefaultTimeRangeDays(accountType)))
			this.cutOffId = constructMailSetEntryId(new Date(cutoffDate), GENERATED_MAX_ID)
		}
		return this.cutOffId
	}

	async cleanOfflineDb(offlineStorage: OfflineStorage, timeRangeDate: Date | null, userId: Id, now: number): Promise<void> {
		const mailBoxes = await offlineStorage.getElementsOfType(tutanotaTypeRefs.MailBoxTypeRef)
		for (const mailBox of mailBoxes) {
			const currentMailBag = assertNotNull(mailBox.currentMailBag)
			const folders = await offlineStorage.getWholeList(tutanotaTypeRefs.MailSetTypeRef, mailBox.mailSets.mailSets)
			// Deleting MailSetEntries first to make sure that once we start deleting Mail
			// we don't have any MailSetEntries that reference that Mail anymore.
			for (const mailSet of folders) {
				const customCutoffId = await this.calculateCutOffId(offlineStorage, userId, timeRangeDate, now)
				await this.deleteMailSetEntries(offlineStorage, mailSet.entries, customCutoffId)
			}

			// We should never write cached ranges for mail bags, but we used to do that in the past in some cases
			// (e.g. mail indexing) so we clean them up here.
			// It is just important to remove the ranges so that the cache does not attempt to keep it up-to-date,
			// actual email contents are already handled above.
			for (const mailBag of [currentMailBag, ...mailBox.archivedMailBags]) {
				await offlineStorage.deleteRange(tutanotaTypeRefs.MailTypeRef, mailBag.mails)
			}
		}
	}

	/**
	 * Clean all mail data references by MailSetEntry's in {@param entriesListId} that are older than {@param cutoffId}.
	 */
	private async deleteMailSetEntries(offlineStorage: OfflineStorage, entriesListId: Id, cutoffId: Id) {
		try {
			assertNotNull(entriesListId)
			const mailIdsToDelete: IdTuple[] = []

			await offlineStorage.updateRangeForList(tutanotaTypeRefs.MailSetEntryTypeRef, entriesListId, cutoffId)

			const mailSetEntriesToDelete: IdTuple[] = []
			const mailSetEntries = await offlineStorage.getWholeList(tutanotaTypeRefs.MailSetEntryTypeRef, entriesListId)
			for (let mailSetEntry of mailSetEntries) {
				if (firstBiggerThanSecondBase64Url(cutoffId, getElementId(mailSetEntry))) {
					mailSetEntriesToDelete.push(mailSetEntry._id)
					mailIdsToDelete.push(mailSetEntry.mail)
				}
			}

			await offlineStorage.deleteIn(tutanotaTypeRefs.MailSetEntryTypeRef, entriesListId, mailSetEntriesToDelete.map(elementIdPart))

			const mailsToDelete: tutanotaTypeRefs.Mail[] = []
			for (let [listId, elementIds] of groupByAndMap(mailIdsToDelete, listIdPart, elementIdPart).entries()) {
				mailsToDelete.push(...(await offlineStorage.provideMultiple(tutanotaTypeRefs.MailTypeRef, listId, elementIds)))
			}
			await this.deleteMails(offlineStorage, mailsToDelete)
		} finally {
			// While the cleaner was deleting mails, the range might have been changed already
			// As this is unlikely (cleaner does not run for long) we accept eventual
			// consistency in this case in order to avoid locking
			await offlineStorage.updateRangeForList(tutanotaTypeRefs.MailSetEntryTypeRef, entriesListId, cutoffId)
		}
	}

	/**
	 *
	 * For each mail we delete the mail, its body, headers, all references mail set entries and all referenced attachments.
	 *
	 * When we delete the Files, we also delete the whole range for the user's File list. We need to delete the whole
	 * range because we only have one file list per mailbox, so if we delete something from the middle of it, the range
	 * will no longer be valid. (this is future proofing, because as of now there is not going to be a Range set for the
	 * File list anyway, since we currently do not do range requests for Files.
	 *
	 * We do not delete ConversationEntries because:
	 *  1. They are in the same list for the whole conversation so we can't adjust the range
	 *  2. We might need them in the future for showing the whole thread
	 */
	private async deleteMails(offlineStorage: OfflineStorage, mails: tutanotaTypeRefs.Mail[]) {
		const mailsToDelete: IdTuple[] = []
		const attachmentsToDelete: IdTuple[] = []
		const mailDetailsBlobToDelete: IdTuple[] = []
		const mailDetailsDraftToDelete: IdTuple[] = []

		for (let mail of mails) {
			mailsToDelete.push(mail._id)
			for (const id of mail.attachments) {
				attachmentsToDelete.push(id)
			}

			if (mail.mailDetailsDraft) {
				const mailDetailsId = mail.mailDetailsDraft
				mailDetailsDraftToDelete.push(mailDetailsId)
			}
			if (mail.mailDetails) {
				// mailDetailsBlob
				const mailDetailsId = mail.mailDetails
				mailDetailsBlobToDelete.push(mailDetailsId)
			}
		}

		for (let [listId, elementIds] of groupByAndMap(mailDetailsBlobToDelete, listIdPart, elementIdPart).entries()) {
			await offlineStorage.deleteIn(tutanotaTypeRefs.MailDetailsBlobTypeRef, listId, elementIds)
		}
		for (let [listId, elementIds] of groupByAndMap(mailDetailsDraftToDelete, listIdPart, elementIdPart).entries()) {
			await offlineStorage.deleteIn(tutanotaTypeRefs.MailDetailsDraftTypeRef, listId, elementIds)
		}
		for (let [listId, elementIds] of groupByAndMap(attachmentsToDelete, listIdPart, elementIdPart).entries()) {
			await offlineStorage.deleteIn(tutanotaTypeRefs.FileTypeRef, listId, elementIds)
			await offlineStorage.deleteRange(tutanotaTypeRefs.FileTypeRef, listId)
		}
		for (let [listId, elementIds] of groupByAndMap(mailsToDelete, listIdPart, elementIdPart).entries()) {
			await offlineStorage.deleteIn(tutanotaTypeRefs.MailTypeRef, listId, elementIds)
		}
	}
}
