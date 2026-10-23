import type { TokenEndpointResponse } from "oauth4webapi"
import { MailboxMigrationProvider } from "./MigrationKnownConfigs"

export type MigrationMailId = {
	sourceId: string
	modSeq?: bigint
}

export type MigrationMailboxState = {
	sourceId: string
	uidValidity?: bigint
	uidNext?: number
	highestModSeq?: bigint | null // null indicates that the CONDSTORE (and QRESYNC) IMAP extension, and therefore highestModSeq, is not supported
	importedSourceIdToMailIdsMap: Map<string, MigrationMailId>
	noSync: boolean
}

export type MigrationCredentials = {
	host?: string
	port?: number
	username: string
	password?: string
	tokenEndpointResponse?: TokenEndpointResponse
	customCertificateData: Uint8Array<ArrayBuffer> | null
	ignoreCertificateErrors?: boolean
	useSSL?: boolean | null
	provider: MailboxMigrationProvider
	isLegacy: boolean
}

export type MigrationSyncContext = {
	migrationCredentials: MigrationCredentials
	migrationMailboxStates: MigrationMailboxState[]
	isGmail: boolean
}
