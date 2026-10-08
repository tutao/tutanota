import { MailboxMigrationFolderSyncStatus, MailSetKind, SystemFolderType } from "../../../../../../entities/tutanota/Utils"
import { ListTreeResponse } from "imapflow"

export type MigrationMailboxStatus = {
	path: string
	messageCount?: number
	uidNext: number
	uidValidity: bigint
	syncStatus: MailboxMigrationFolderSyncStatus
}

export enum MigrationMailboxSpecialUse {
	INBOX = "\\Inbox",
	SENT = "\\Sent",
	DRAFTS = "\\Drafts",
	DRAFT = "\\Draft",
	TRASH = "\\Trash",
	ARCHIVE = "\\Archive",
	JUNK = "\\Junk",
	ALL = "\\All",
	FLAGGED = "\\FLAGGED",
	IMPORTANT = "\\Important",
}

export type MigrationMailbox = {
	name?: string
	sourceId: string
	pathDelimiter?: string
	flags?: string[]
	specialUse?: MigrationMailboxSpecialUse
	disabled?: boolean
	parentFolder?: MigrationMailbox | null
	subFolders?: MigrationMailbox[]
}

export function migrationMailboxFromImapFlowListTreeResponse(listTreeResponse: ListTreeResponse, parentFolder: MigrationMailbox | null): MigrationMailbox {
	let migrationMailbox: MigrationMailbox = {
		sourceId: listTreeResponse.path ?? "-",
		name: listTreeResponse.name ?? "-",
		pathDelimiter: listTreeResponse.delimiter ?? "/",
		flags: Array.from(listTreeResponse.flags ?? []),
		// the Gmail \Important special use is on the flags
		specialUse: listTreeResponse.flags?.has(MigrationMailboxSpecialUse.IMPORTANT)
			? MigrationMailboxSpecialUse.IMPORTANT
			: (listTreeResponse.specialUse as MigrationMailboxSpecialUse),
		disabled: listTreeResponse.disabled ?? false,
		parentFolder: parentFolder,
	}

	if (listTreeResponse.folders) {
		migrationMailbox.subFolders = listTreeResponse.folders.map((value: ListTreeResponse) =>
			migrationMailboxFromImapFlowListTreeResponse(value, migrationMailbox),
		)
	}

	return migrationMailbox
}

export function getSpecialUseAsSystemFolderType(mailbox: MigrationMailbox): SystemFolderType | null {
	switch (mailbox.specialUse) {
		case MigrationMailboxSpecialUse.INBOX:
			return MailSetKind.INBOX
		case MigrationMailboxSpecialUse.DRAFTS:
			return MailSetKind.DRAFT
		case MigrationMailboxSpecialUse.SENT:
			return MailSetKind.SENT
		case MigrationMailboxSpecialUse.TRASH:
			return MailSetKind.TRASH
		case MigrationMailboxSpecialUse.ARCHIVE:
			return MailSetKind.ARCHIVE
		case MigrationMailboxSpecialUse.JUNK:
			return MailSetKind.SPAM
	}
	return null
}
