import type { TokenEndpointResponse } from "oauth4webapi"

export type ImapMailId = {
	uid: number
	modSeq?: bigint
	messageId?: string
}

export type ImapMailboxState = {
	path: string
	uidValidity?: bigint
	uidNext?: number
	highestModSeq?: bigint | null // null indicates that the CONDSTORE (and QRESYNC) IMAP extension, and therefore highestModSeq, is not supported
	importedUidToMailIdsMap: Map<number, ImapMailId>
	noSync: boolean
}

export type ImapCredentials = {
	host: string
	port: number
	username: string
	password?: string
	tokenEndpointResponse?: TokenEndpointResponse
	customCertificateData: Uint8Array | null
	ignoreCertificateErrors: boolean
}

export type ImapSyncContext = {
	imapCredentials: ImapCredentials
	maxQuota: number
	imapMailboxStates: ImapMailboxState[]
}
