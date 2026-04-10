import { tutanotaTypeRefs } from "@tutao/typeRefs"

export interface MailWithDetailsAndAttachments {
	mail: tutanotaTypeRefs.Mail
	mailDetails: tutanotaTypeRefs.MailDetails
	attachments: readonly tutanotaTypeRefs.File[]
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
	 * Called when only the mail entity data is updated.
	 * Only data that is directly on the Mail entity (e.g. sets) was updated.
	 */
	onPartialMailUpdated(mail: tutanotaTypeRefs.Mail): Promise<void>

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

	resetIndex(): Promise<void>
}
