import { File as TutanotaFile, Mail, MailDetails } from "../../../common/api/entities/tutanota/TypeRefs"

export interface MailWithDetailsAndAttachments {
	mail: Mail
	mailDetails: MailDetails
	attachments: readonly TutanotaFile[]
}

export const enum IndexResult {
	NOT_WRITTEN_YET,
	WRITTEN,
}

export type GroupTimestamps = Map<Id, number>

export interface MailIndexerBackend {
	indexMails(dataPerGroup: GroupTimestamps, mailsWithDetails: readonly MailWithDetailsAndAttachments[]): Promise<void>

	getCurrentIndexTimestamps(groupIds: readonly Id[]): Promise<Map<Id, number>>

	truncateAllCurrentIndexTimestamps(newTimestamp: number): Promise<void>

	onMailCreated(mailData: MailWithDetailsAndAttachments): Promise<void>

	onMailUpdated(mailData: MailWithDetailsAndAttachments): Promise<void>

	/**
	 * Called before the mail is deleted from the cache.
	 * Useful if updating the index requires using the cached data.
	 */
	onBeforeMailDeleted(mailId: IdTuple): Promise<void>

	/**
	 * Called when processing entity event that deletes mail
	 */
	onMailDeleted(mailId: IdTuple): Promise<void>

	enableIndexing(): Promise<void>

	isMailIndexingEnabled(): Promise<boolean>
}
