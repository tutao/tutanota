import { UserTypeRef } from "../../../common/api/entities/sys/TypeRefs.js"
import { AccountType, OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS } from "../../../common/api/common/TutanotaConstants.js"
import { assertNotNull, DAY_IN_MILLIS, groupByAndMap } from "@tutao/tutanota-utils"
import {
	constructMailSetEntryId,
	CUSTOM_MAX_ID,
	elementIdPart,
	firstBiggerThanSecond,
	firstBiggerThanSecondCustomId,
	GENERATED_MAX_ID,
	getElementId,
	listIdPart,
	timestampToGeneratedId,
} from "../../../common/api/common/utils/EntityUtils.js"
import {
	FileTypeRef,
	Mail,
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
		for (const mailBox of mailBoxes) {
			const currentMailBag = mailBox.currentMailBag
			const isMailsetMigrated = currentMailBag != null
			const folders = await offlineStorage.getWholeList(MailFolderTypeRef, mailBox.folders!.folders)
			if (isMailsetMigrated) {
				// Deleting MailSetEntries first to make sure that once we start deleting Mail
				// we don't have any MailSetEntries that reference that Mail anymore.
				const folderSystem = new FolderSystem(folders)
				for (const mailSet of folders) {
					if (isSpamOrTrashFolder(folderSystem, mailSet)) {
						await this.deleteMailSetEntries(offlineStorage, mailSet.entries, CUSTOM_MAX_ID)
					} else {
						const customCutoffId = constructMailSetEntryId(new Date(cutoffTimestamp), GENERATED_MAX_ID)
						await this.deleteMailSetEntries(offlineStorage, mailSet.entries, customCutoffId)
					}
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
	}

	/**
	 * Clean all mail data references by MailSetEntry's in {@param entriesListId} that are older than {@param cutoffId}.
	 */
	private async deleteMailSetEntries(offlineStorage: OfflineStorage, entriesListId: Id, cutoffId: Id) {
		assertNotNull(entriesListId)
		const mailIdsToDelete: IdTuple[] = []

		await offlineStorage.lockRangesDbAccess(entriesListId)
		try {
			await offlineStorage.updateRangeForList(MailSetEntryTypeRef, entriesListId, cutoffId)
		} finally {
			// We unlock access to the "ranges" db here. We lock it in order to prevent race conditions when accessing the "ranges" database.
			await offlineStorage.unlockRangesDbAccess(entriesListId)
		}

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

			if (isDraft(mail)) {
				const mailDetailsId = assertNotNull(mail.mailDetailsDraft)
				mailDetailsDraftToDelete.push(mailDetailsId)
			} else {
				// mailDetailsBlob
				const mailDetailsId = assertNotNull(mail.mailDetails)
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
