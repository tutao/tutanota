//@bundleInto:common

import { ImapSyncSessionMailbox } from "../ImapSyncSessionMailbox.js"

export class ImapMailboxStatus {
	path: string
	messageCount?: number
	uidNext: number
	uidValidity: bigint
	highestModSeq?: bigint | null // null indicates that the CONDSTORE IMAP extension, and therefore highestModSeq, is not supported

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

	static fromImapFlowMailboxObject(mailboxObject: MailboxObject): ImapMailboxStatus {
		return new ImapMailboxStatus(mailboxObject.path, mailboxObject.uidNext, mailboxObject.uidValidity)
			.setMessageCount(mailboxObject.exists)
			.setHighestModSeq(mailboxObject.highestModseq)
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

	static fromImapFlowListTreeResponse(listTreeResponse: ListTreeResponse, parentFolder: ImapMailbox | null): ImapMailbox {
		let imapMailbox = new ImapMailbox(listTreeResponse.path)
			.setName(listTreeResponse.name)
			.setPathDelimiter(listTreeResponse.delimiter)
			.setFlags(listTreeResponse.flags)
			.setSpecialUse(listTreeResponse.specialUse as ImapMailboxSpecialUse)
			.setDisabled(listTreeResponse.disabled)
			.setParentFolder(parentFolder)

		if (listTreeResponse.folders) {
			imapMailbox.setSubFolders(listTreeResponse.folders.map((value: ListTreeResponse) => ImapMailbox.fromImapFlowListTreeResponse(value, imapMailbox)))
		}

		return imapMailbox
	}

	static fromSyncSessionMailbox(syncSessionMailbox: ImapSyncSessionMailbox): ImapMailbox {
		return new ImapMailbox(syncSessionMailbox.mailboxState.path)
	}
}
