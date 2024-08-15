import { UserTypeRef } from "../../common/api/entities/sys/TypeRefs.js"
import { AccountType, OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS } from "../../common/api/common/TutanotaConstants.js"
import { assertNotNull, DAY_IN_MILLIS, getTypeId, groupByAndMap, mapNullable, TypeRef } from "@tutao/tutanota-utils"
import {
	elementIdPart,
	firstBiggerThanSecond,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	getElementId,
	listIdPart,
	timestampToGeneratedId,
} from "../../common/api/common/utils/EntityUtils.js"
import { FileTypeRef, MailDetailsBlobTypeRef, MailDetailsDraftTypeRef, MailFolderTypeRef, MailTypeRef } from "../../common/api/entities/tutanota/TypeRefs.js"
import { FolderSystem } from "../../common/api/common/mail/FolderSystem.js"
import { isDraft, isSpamOrTrashFolder } from "../mail/model/MailUtils.js"
import { ListElementEntity } from "../../common/api/common/EntityTypes.js"
import { OfflineStorage, OfflineStorageCleaner } from "../../common/api/worker/offline/OfflineStorage.js"

export class MailOfflineCleaner implements OfflineStorageCleaner {
	async cleanOfflineDb(offlineStorage: OfflineStorage, timeRangeDays: number | null, userId: Id, now: number): Promise<void> {
		const user = await offlineStorage.get(UserTypeRef, null, userId)

		// Free users always have default time range regardless of what is stored
		const isFreeUser = user?.accountType === AccountType.FREE
		const timeRange = isFreeUser || timeRangeDays == null ? OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS : timeRangeDays
		const daysSinceDayAfterEpoch = now / DAY_IN_MILLIS - 1
		const timeRangeMillisSafe = Math.min(daysSinceDayAfterEpoch, timeRange) * DAY_IN_MILLIS
		// from may 15th 2109 onward, exceeding daysSinceDayAfterEpoch in the time range setting will
		// lead to an overflow in our 42 bit timestamp in the id.
		const cutoffTimestamp = now - timeRangeMillisSafe
		const cutoffId = timestampToGeneratedId(cutoffTimestamp)

		const folders = await offlineStorage.getListElementsOfType(MailFolderTypeRef)
		const folderSystem = new FolderSystem(folders)

		for (const folder of folders) {
			if (isSpamOrTrashFolder(folderSystem, folder)) {
				await this.deleteMailList(offlineStorage, folder.mails, GENERATED_MAX_ID)
			} else {
				await this.deleteMailList(offlineStorage, folder.mails, cutoffId)
			}
		}
	}

	/**
	 * This method deletes mails from {@param listId} what are older than {@param cutoffId}. as well as associated data
	 *
	 * For each mail we delete its body, headers, and all referenced attachments.
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
	private async deleteMailList(offlineStorage: OfflineStorage, listId: Id, cutoffId: Id): Promise<void> {
		// We lock access to the "ranges" db here in order to prevent race conditions when accessing the "ranges" database.
		await offlineStorage.lockRangesDbAccess(listId)
		try {
			// This must be done before deleting mails to know what the new range has to be
			await this.updateRangeForList(offlineStorage, MailTypeRef, listId, cutoffId)
		} finally {
			// We unlock access to the "ranges" db here. We lock it in order to prevent race conditions when accessing the "ranges" database.
			await offlineStorage.unlockRangesDbAccess(listId)
		}

		const mailsToDelete: IdTuple[] = []
		const attachmentsTodelete: IdTuple[] = []
		const mailDetailsBlobToDelete: IdTuple[] = []
		const mailDetailsDraftToDelete: IdTuple[] = []

		const mails = await offlineStorage.getWholeList(MailTypeRef, listId)
		for (let mail of mails) {
			if (firstBiggerThanSecond(cutoffId, getElementId(mail))) {
				mailsToDelete.push(mail._id)
				for (const id of mail.attachments) {
					attachmentsTodelete.push(id)
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
		for (let [listId, elementIds] of groupByAndMap(attachmentsTodelete, listIdPart, elementIdPart).entries()) {
			await offlineStorage.deleteIn(FileTypeRef, listId, elementIds)
			await offlineStorage.deleteRange(FileTypeRef, listId)
		}

		await offlineStorage.deleteIn(MailTypeRef, listId, mailsToDelete.map(elementIdPart))
	}

	private async updateRangeForList<T extends ListElementEntity>(
		offlineStorage: OfflineStorage,
		typeRef: TypeRef<T>,
		listId: Id,
		cutoffId: Id,
	): Promise<void> {
		const type = getTypeId(typeRef)

		const range = await offlineStorage.getRange(type, listId)
		if (range == null) {
			return
		}

		// If the range for a given list is complete from the beginning (starts at GENERATED_MIN_ID), then we only want to actually modify the
		// saved range if we would be removing elements from the list, in order to not lose the information that the range is complete in storage.
		// So we have to check how old the oldest element in said range is. If it is newer than cutoffId, then we will not modify the range,
		// otherwise we will just modify it normally
		if (range.lower === GENERATED_MIN_ID) {
			const entities = await offlineStorage.provideFromRange(typeRef, listId, GENERATED_MIN_ID, 1, false)
			const id = mapNullable(entities[0], getElementId)
			const rangeWontBeModified = id == null || firstBiggerThanSecond(id, cutoffId) || id === cutoffId
			if (rangeWontBeModified) {
				return
			}
		}

		if (firstBiggerThanSecond(cutoffId, range.lower)) {
			// If the upper id of the range is below the cutoff, then the entire range will be deleted from the storage
			// so we just delete the range as well
			// Otherwise, we only want to modify
			if (firstBiggerThanSecond(cutoffId, range.upper)) {
				await offlineStorage.deleteRange(typeRef, listId)
			} else {
				await offlineStorage.setLowerRangeForList(typeRef, listId, cutoffId)
			}
		}
	}
}
