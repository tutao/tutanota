import { assertNotNull, daysToMillis, groupByAndMap } from "@tutao/tutanota-utils"
import {
	constructMailSetEntryId,
	elementIdPart,
	firstBiggerThanSecondCustomId,
	GENERATED_MAX_ID,
	getElementId,
	listIdPart,
} from "../../../common/api/common/utils/EntityUtils.js"
import {
	FileTypeRef,
	Mail,
	MailBoxTypeRef,
	MailDetailsBlobTypeRef,
	MailDetailsDraftTypeRef,
	MailSetTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import { OfflineStorage, OfflineStorageCleaner } from "../../../common/api/worker/offline/OfflineStorage.js"
import { UserTypeRef } from "../../../common/api/entities/sys/TypeRefs"
import { AccountType, OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS } from "../../../common/api/common/TutanotaConstants"

export class MailOfflineCleaner implements OfflineStorageCleaner {
	private cutOffId: Id | null = null

	private async calculateCutOffId(offlineStorage: OfflineStorage, userId: string, timeRangeDate: Date | null, now: number): Promise<Id> {
		if (!this.cutOffId) {
			const user = await offlineStorage.get(UserTypeRef, null, userId)
			// Free users always have default time range regardless of what is stored
			const isFreeUser = user?.accountType === AccountType.FREE
			const cutoffDate = isFreeUser || timeRangeDate == null ? new Date(now - daysToMillis(OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS)) : timeRangeDate
			this.cutOffId = constructMailSetEntryId(new Date(cutoffDate), GENERATED_MAX_ID)
		}
		return this.cutOffId
	}

	async cleanOfflineDb(offlineStorage: OfflineStorage, timeRangeDate: Date | null, userId: Id, now: number): Promise<void> {
		const mailBoxes = await offlineStorage.getElementsOfType(MailBoxTypeRef)
		for (const mailBox of mailBoxes) {
			const currentMailBag = assertNotNull(mailBox.currentMailBag)
			const folders = await offlineStorage.getWholeList(MailSetTypeRef, mailBox.mailSets.mailSets)
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
				await offlineStorage.deleteRange(MailTypeRef, mailBag.mails)
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

			await offlineStorage.updateRangeForList(MailSetEntryTypeRef, entriesListId, cutoffId)

			const mailSetEntriesToDelete: IdTuple[] = []
			const mailSetEntries = await offlineStorage.getWholeList(MailSetEntryTypeRef, entriesListId)
			for (let mailSetEntry of mailSetEntries) {
				if (firstBiggerThanSecondCustomId(cutoffId, getElementId(mailSetEntry))) {
					mailSetEntriesToDelete.push(mailSetEntry._id)
					mailIdsToDelete.push(mailSetEntry.mail)
				}
			}

			await offlineStorage.deleteIn(MailSetEntryTypeRef, entriesListId, mailSetEntriesToDelete.map(elementIdPart))

			const mailsToDelete: Mail[] = []
			for (let [listId, elementIds] of groupByAndMap(mailIdsToDelete, listIdPart, elementIdPart).entries()) {
				mailsToDelete.push(...(await offlineStorage.provideMultiple(MailTypeRef, listId, elementIds)))
			}
			await this.deleteMails(offlineStorage, mailsToDelete)
		} finally {
			// While the cleaner was deleting mails, the range might have been changed already
			// As this is unlikely (cleaner does not run for long) we accept eventual
			// consistency in this case in order to avoid locking
			await offlineStorage.updateRangeForList(MailSetEntryTypeRef, entriesListId, cutoffId)
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
	private async deleteMails(offlineStorage: OfflineStorage, mails: Mail[]) {
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
			await offlineStorage.deleteIn(MailDetailsBlobTypeRef, listId, elementIds)
		}
		for (let [listId, elementIds] of groupByAndMap(mailDetailsDraftToDelete, listIdPart, elementIdPart).entries()) {
			await offlineStorage.deleteIn(MailDetailsDraftTypeRef, listId, elementIds)
		}
		for (let [listId, elementIds] of groupByAndMap(attachmentsToDelete, listIdPart, elementIdPart).entries()) {
			await offlineStorage.deleteIn(FileTypeRef, listId, elementIds)
			await offlineStorage.deleteRange(FileTypeRef, listId)
		}
		for (let [listId, elementIds] of groupByAndMap(mailsToDelete, listIdPart, elementIdPart).entries()) {
			await offlineStorage.deleteIn(MailTypeRef, listId, elementIds)
		}
	}
}
