import { UserTypeRef } from "../../../common/api/entities/sys/TypeRefs.js"
import { AccountType, OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS } from "../../../common/api/common/TutanotaConstants.js"
import { assertNotNull, DAY_IN_MILLIS, groupByAndMap } from "@tutao/tutanota-utils"
import {
	constructMailSetEntryId,
	DEFAULT_MAILSET_ENTRY_CUSTOM_CUTOFF_TIMESTAMP,
	elementIdPart,
	firstBiggerThanSecond,
	GENERATED_MAX_ID,
	getElementId,
	listIdPart,
	timestampToGeneratedId,
} from "../../../common/api/common/utils/EntityUtils.js"
import {
	FileTypeRef,
	MailBoxTypeRef,
	MailDetailsBlobTypeRef,
	MailDetailsDraftTypeRef,
	MailFolderTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem.js"
import { OfflineStorage, OfflineStorageCleaner } from "../../../common/api/worker/offline/OfflineStorage.js"
import { isDraft, isSpamOrTrashFolder } from "../../mail/model/MailChecks.js"

export class MailOfflineCleaner implements OfflineStorageCleaner {
	async cleanOfflineDb(offlineStorage: OfflineStorage, timeRangeDays: number | null, userId: Id, now: number): Promise<void> {
		const user = await offlineStorage.get(UserTypeRef, null, userId)

		// Free users always have default time range regardless of what is stored
		const isFreeUser = user?.accountType === AccountType.FREE
		const timeRange = isFreeUser || timeRangeDays == null ? OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS : timeRangeDays
		const daysSinceDayAfterEpoch = now / DAY_IN_MILLIS - 1
		const timeRangeMillisSafe = Math.min(daysSinceDayAfterEpoch, timeRange) * DAY_IN_MILLIS
		// from May 15th 2109 onward, exceeding daysSinceDayAfterEpoch in the time range setting will
		// lead to an overflow in our 42 bit timestamp in the id.
		const cutoffTimestamp = now - timeRangeMillisSafe

		const mailBoxes = await offlineStorage.getElementsOfType(MailBoxTypeRef)
		const cutoffId = timestampToGeneratedId(cutoffTimestamp)
		for (const mailBox of mailBoxes) {
			const isMailsetMigrated = mailBox.currentMailBag != null
			const folders = await offlineStorage.getWholeList(MailFolderTypeRef, mailBox.folders!.folders)
			if (isMailsetMigrated) {
				// deleting mailsetentries first to make sure that once we start deleting mail
				// we don't have any entries that reference that mail
				const folderSystem = new FolderSystem(folders)
				for (const mailSet of folders) {
					if (isSpamOrTrashFolder(folderSystem, mailSet)) {
						await this.deleteMailSetEntries(offlineStorage, mailSet.entries, DEFAULT_MAILSET_ENTRY_CUSTOM_CUTOFF_TIMESTAMP)
					} else {
						await this.deleteMailSetEntries(offlineStorage, mailSet.entries, cutoffTimestamp)
					}
				}

				const mailListIds = [mailBox.currentMailBag!, ...mailBox.archivedMailBags].map((mailbag) => mailbag.mails)
				for (const mailListId of mailListIds) {
					await this.deleteMailListLegacy(offlineStorage, mailListId, cutoffId)
				}
			} else {
				const folderSystem = new FolderSystem(folders)
				for (const folder of folders) {
					if (isSpamOrTrashFolder(folderSystem, folder)) {
						await this.deleteMailListLegacy(offlineStorage, folder.mails, GENERATED_MAX_ID)
					} else {
						await this.deleteMailListLegacy(offlineStorage, folder.mails, cutoffId)
					}
				}
			}
		}
	}

	/**
	 * This method deletes mails from {@param listId} what are older than {@param cutoffId} as well as associated data.
	 *
	 * it's considered legacy because once we start importing mail into mail bags, maintaining mail list ranges doesn't make
	 * sense anymore - mail order in a list is arbitrary at that point.
	 *
	 * For each mail we delete the mail, its body, headers, all references mail set entries and all referenced attachments.
	 *
	 * When we delete the Files, we also delete the whole range for the user's File list. We need to delete the whole
	 * range because we only have one file list per mailbox, so if we delete something from the middle of it, the range
	 * will no longer be valid. (this is future proofing, because as of now there is not going to be a Range set for the
	 * File list anyway, since we currently do not do range requests for Files.
	 *
	 * 	We do not delete ConversationEntries because:
	 * 	1. They are in the same list for the whole conversation so we can't adjust the range
	 * 	2. We might need them in the future for showing the whole thread
	 */
	private async deleteMailListLegacy(offlineStorage: OfflineStorage, listId: Id, cutoffId: Id): Promise<void> {
		// We lock access to the "ranges" db here in order to prevent race conditions when accessing the "ranges" database.
		await offlineStorage.lockRangesDbAccess(listId)
		try {
			// This must be done before deleting mails to know what the new range has to be
			await offlineStorage.updateRangeForListAndDeleteObsoleteData(MailTypeRef, listId, cutoffId)
		} finally {
			// We unlock access to the "ranges" db here. We lock it in order to prevent race conditions when accessing the "ranges" database.
			await offlineStorage.unlockRangesDbAccess(listId)
		}

		const mailsToDelete: IdTuple[] = []
		const attachmentsToDelete: IdTuple[] = []
		const mailDetailsBlobToDelete: IdTuple[] = []
		const mailDetailsDraftToDelete: IdTuple[] = []

		const mails = await offlineStorage.getWholeList(MailTypeRef, listId)
		for (let mail of mails) {
			if (firstBiggerThanSecond(cutoffId, getElementId(mail))) {
				mailsToDelete.push(mail._id)
				for (const id of mail.attachments) {
					attachmentsToDelete.push(id)
				}

				if (isDraft(mail)) {
					const mailDetailsId = assertNotNull(mail.mailDetailsDraft)
					mailDetailsDraftToDelete.push(mailDetailsId)
				} else {
					// mailDetailsBlob
					const mailDetailsId = assertNotNull(mail.mailDetails)
					mailDetailsBlobToDelete.push(mailDetailsId)
				}
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

		await offlineStorage.deleteIn(MailTypeRef, listId, mailsToDelete.map(elementIdPart))
	}

	/**
	 * delete all mail set entries of a mail set that reference some mail with a receivedDate older than
	 * cutoffTimestamp. this doesn't clean up mails or their associated data because we could be breaking the
	 * offline list range invariant by deleting data from the middle of a mail range. cleaning up mails is done
	 * the legacy way currently even for mailset users.
	 */
	private async deleteMailSetEntries(offlineStorage: OfflineStorage, entriesListId: Id, cutoffTimestamp: number) {
		const cutoffId = constructMailSetEntryId(new Date(cutoffTimestamp), GENERATED_MAX_ID)
		await offlineStorage.lockRangesDbAccess(entriesListId)
		try {
			await offlineStorage.updateRangeForListAndDeleteObsoleteData(MailSetEntryTypeRef, entriesListId, cutoffId)
		} finally {
			// We unlock access to the "ranges" db here. We lock it in order to prevent race conditions when accessing the "ranges" database.
			await offlineStorage.unlockRangesDbAccess(entriesListId)
		}

		const mailSetEntriesToDelete: IdTuple[] = []
		const mailSetEntries = await offlineStorage.getWholeList(MailSetEntryTypeRef, entriesListId)
		for (let mailSetEntry of mailSetEntries) {
			if (firstBiggerThanSecond(cutoffId, getElementId(mailSetEntry))) {
				mailSetEntriesToDelete.push(mailSetEntry._id)
			}
		}
		await offlineStorage.deleteIn(MailSetEntryTypeRef, entriesListId, mailSetEntriesToDelete.map(elementIdPart))
	}
}
