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
	init(): Promise<void>

	indexMails(dataPerGroup: GroupTimestamps, mailsWithDetails: readonly MailWithDetailsAndAttachments[]): Promise<void>

	getCurrentIndexTimestamps(groupIds: readonly Id[]): Promise<Map<Id, number>>

	// FIXME: previous model was ensuring atomicity for batch processing by having a single IndexedDB transaction for
	//  the whole batch. We should think how to replicate this with IndexedDB.
	onMailCreated(mailData: MailWithDetailsAndAttachments): Promise<void>

	onMailUpdated(mailData: MailWithDetailsAndAttachments): Promise<void>

	onMailDeleted(mailId: IdTuple): Promise<void>

	enableIndexing(): Promise<boolean>

	deleteIndex(): Promise<void>

	isMailIndexingEnabled(): Promise<boolean>
}
