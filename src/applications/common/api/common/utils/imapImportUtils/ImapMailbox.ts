import { ImapFolderSyncStatus, MailSetKind, SystemFolderType } from "../../../../../../entities/tutanota/Utils"
import { ListTreeResponse, MailboxObject } from "imapflow"

export class ImapMailboxStatus {
	path: string
	messageCount?: number
	uidNext: number
	uidValidity: bigint
	highestModSeq?: bigint | null // null indicates that the CONDSTORE IMAP extension, and therefore highestModSeq, is not supported
	syncStatus: ImapFolderSyncStatus = ImapFolderSyncStatus.RUNNING

	constructor(path: string, uidNext: number, uidValidity: bigint) {
		this.path = path
		this.uidNext = uidNext
		this.uidValidity = uidValidity
	}

	setMessageCount(messageCount?: number): this {
		this.messageCount = messageCount
		return this
	}

	setHighestModSeq(highestModSeq?: bigint | null): this {
		this.highestModSeq = highestModSeq ?? null
		return this
	}

	setSyncStatus(syncStatus: ImapFolderSyncStatus): this {
		this.syncStatus = syncStatus
		return this
	}

	static fromImapFlowMailboxObject(mailboxObject: MailboxObject): ImapMailboxStatus {
		return new ImapMailboxStatus(mailboxObject.path, mailboxObject.uidNext, mailboxObject.uidValidity)
			.setMessageCount(mailboxObject.exists)
			.setHighestModSeq(mailboxObject.highestModseq)
			.setSyncStatus(ImapFolderSyncStatus.RUNNING)
	}
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

export class ImapMailbox {
	name?: string
	path: string
	pathDelimiter?: string
	flags?: string[]
	specialUse?: ImapMailboxSpecialUse
	disabled?: boolean
	parentFolder?: ImapMailbox | null
	subFolders?: ImapMailbox[]

	constructor(path: string) {
		this.path = path
	}

	setName(name: string): this {
		this.name = name
		return this
	}

	setPathDelimiter(pathDelimiter: string): this {
		this.pathDelimiter = pathDelimiter
		return this
	}

	setFlags(flags: string[]): this {
		this.flags = flags
		return this
	}

	setSpecialUse(specialUse: ImapMailboxSpecialUse): this {
		this.specialUse = specialUse
		return this
	}

	setDisabled(disabled: boolean): this {
		this.disabled = disabled
		return this
	}

	setParentFolder(parentFolder: ImapMailbox | null): this {
		this.parentFolder = parentFolder
		return this
	}

	setSubFolders(subFolders: ImapMailbox[]): this {
		this.subFolders = subFolders
		return this
	}

	static getSpecialUseAsSystemFolderType(mailbox: ImapMailbox): SystemFolderType | null {
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

	static fromImapFlowListTreeResponse(listTreeResponse: ListTreeResponse, parentFolder: ImapMailbox | null): ImapMailbox {
		let imapMailbox = new ImapMailbox(listTreeResponse.path ?? "-")
			.setName(listTreeResponse.name ?? "-")
			.setPathDelimiter(listTreeResponse.delimiter ?? "/")
			.setFlags(Array.from(listTreeResponse.flags ?? []))
			.setSpecialUse(listTreeResponse.specialUse as ImapMailboxSpecialUse)
			.setDisabled(listTreeResponse.disabled ?? false)
			.setParentFolder(parentFolder)

		if (listTreeResponse.folders) {
			imapMailbox.setSubFolders(listTreeResponse.folders.map((value: ListTreeResponse) => ImapMailbox.fromImapFlowListTreeResponse(value, imapMailbox)))
		}

		return imapMailbox
	}
}
