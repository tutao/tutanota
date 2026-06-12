import { ImapFolderSyncStatus, MailSetKind, SystemFolderType } from "../../../../../../entities/tutanota/Utils"
import { ListTreeResponse } from "imapflow"

export type ImapMailboxStatus = {
	path: string
	messageCount?: number
	uidNext: number
	uidValidity: bigint
	highestModSeq?: bigint | null // null indicates that the CONDSTORE IMAP extension, and therefore highestModSeq, is not supported
	syncStatus: ImapFolderSyncStatus
}

export enum ImapMailboxSpecialUse {
	INBOX = "\\Inbox",
	SENT = "\\Sent",
	DRAFTS = "\\Drafts",
	TRASH = "\\Trash",
	ARCHIVE = "\\Archive",
	JUNK = "\\Junk",
	ALL = "\\All",
	FLAGGED = "\\FLAGGED",
}

export type ImapMailbox = {
	name?: string
	path: string
	pathDelimiter?: string
	flags?: string[]
	specialUse?: ImapMailboxSpecialUse
	disabled?: boolean
	parentFolder?: ImapMailbox | null
	subFolders?: ImapMailbox[]
}

export function imapMailboxFromImapFlowListTreeResponse(listTreeResponse: ListTreeResponse, parentFolder: ImapMailbox | null): ImapMailbox {
	let imapMailbox: ImapMailbox = {
		path: listTreeResponse.path ?? "-",
		name: listTreeResponse.name ?? "-",
		pathDelimiter: listTreeResponse.delimiter ?? "/",
		flags: Array.from(listTreeResponse.flags ?? []),
		specialUse: listTreeResponse.specialUse as ImapMailboxSpecialUse,
		disabled: listTreeResponse.disabled ?? false,
		parentFolder: parentFolder,
	}

	if (listTreeResponse.folders) {
		imapMailbox.subFolders = listTreeResponse.folders.map((value: ListTreeResponse) => imapMailboxFromImapFlowListTreeResponse(value, imapMailbox))
	}

	return imapMailbox
}

export function getSpecialUseAsSystemFolderType(mailbox: ImapMailbox): SystemFolderType | null {
	switch (mailbox.specialUse) {
		case ImapMailboxSpecialUse.INBOX:
			return MailSetKind.INBOX
		case ImapMailboxSpecialUse.DRAFTS:
			return MailSetKind.DRAFT
		case ImapMailboxSpecialUse.SENT:
			return MailSetKind.SENT
		case ImapMailboxSpecialUse.TRASH:
			return MailSetKind.TRASH
		case ImapMailboxSpecialUse.ARCHIVE:
			return MailSetKind.ARCHIVE
		case ImapMailboxSpecialUse.JUNK:
			return MailSetKind.SPAM
	}
	return null
}
