import type { TokenEndpointResponse } from "oauth4webapi"
import { ImapProvider } from "./ImapKnownConfigs"

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
	// Dedup for providers whose native message id isn't a real IMAP UID (Microsoft Graph today, a future
	// Gmail message id) - kept separate from importedUidToMailIdsMap since IMAP's CONDSTORE/QRESYNC
	// differential-uid logic (DifferentialUidLoader) is inherently numeric and IMAP-specific.
	importedSourceIds: Set<string>
	noSync: boolean
}

export type ImapCredentials = {
	host: string
	port: number
	username: string
	password?: string
	tokenEndpointResponse?: TokenEndpointResponse
	customCertificateData: Uint8Array<ArrayBuffer> | null
	ignoreCertificateErrors: boolean
	useSSL: boolean | null
	provider: ImapProvider
}

export type ImapSyncContext = {
	imapCredentials: ImapCredentials
	maxQuota: number
	imapMailboxStates: ImapMailboxState[]
	isGmail: boolean
}
