import { ImapMailbox } from "./imapmail/ImapMailbox.js"

export class ImapAccount {
	host: string
	port: number
	username: string
	password?: string
	accessToken?: string

	constructor(host: string, port: number, username: string) {
		this.host = host
		this.port = port
		this.username = username
	}
}

export class ImapMailIds {
	uid: number
	modSeq?: bigint
	externalMailId?: any

	constructor(uid: number) {
		this.uid = uid
	}
}

export class ImapMailboxState {
	path: string
	uidValidity?: bigint
	uidNext?: number
	highestModSeq?: bigint | null // null indicates that the CONDSTORE (and QRESYNC) IMAP extension, and therefore highestModSeq, is not supported
	importedUidToMailIdsMap: Map<number, ImapMailIds>

	constructor(path: string, importedUidToMailIdsMap: Map<number, ImapMailIds>) {
		this.path = path
		this.importedUidToMailIdsMap = importedUidToMailIdsMap
	}

	static fromImapMailbox(imapMailbox: ImapMailbox) {
		return new ImapMailboxState(imapMailbox.path, new Map<number, ImapMailIds>())
	}
}

export class ImapSyncState {
	imapAccount: ImapAccount
	maxQuota: number
	mailboxStates: ImapMailboxState[]

	constructor(imapAccount: ImapAccount, maxQuata: number, mailboxStates: ImapMailboxState[]) {
		this.imapAccount = imapAccount
		this.maxQuota = maxQuata
		this.mailboxStates = mailboxStates
	}
}
