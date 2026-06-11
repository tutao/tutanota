import { ImapMailbox } from "./ImapMailbox.js"
import type { TokenEndpointResponse } from "oauth4webapi"

export class ImapMailId {
	uid: number
	modSeq?: bigint
	messageId?: string

	constructor(uid: number) {
		this.uid = uid
	}
}

export class ImapMailboxState {
	path: string
	uidValidity?: bigint
	uidNext?: number
	highestModSeq?: bigint | null // null indicates that the CONDSTORE (and QRESYNC) IMAP extension, and therefore highestModSeq, is not supported
	importedUidToMailIdsMap: Map<number, ImapMailId>

	constructor(path: string, importedUidToMailIdsMap: Map<number, ImapMailId>) {
		this.path = path
		this.importedUidToMailIdsMap = importedUidToMailIdsMap
	}

	static fromImapMailbox(imapMailbox: ImapMailbox) {
		return new ImapMailboxState(imapMailbox.path, new Map<number, ImapMailId>())
	}
}

export class ImapCredentials {
	host: string
	port: number
	username: string
	password?: string
	tokenEndpointResponse?: TokenEndpointResponse

	constructor(host: string, port: number, username: string) {
		this.host = host
		this.port = port
		this.username = username
	}
}

export class ImapSyncState {
	imapAccount: ImapCredentials
	maxQuota: number
	imapMailboxStates: ImapMailboxState[]

	constructor(imapAccount: ImapCredentials, maxQuata: number, mailboxStates: ImapMailboxState[]) {
		this.imapAccount = imapAccount
		this.maxQuota = maxQuata
		this.imapMailboxStates = mailboxStates
	}
}
