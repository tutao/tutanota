import { ImapAccountSyncState, ImapFolderSyncState } from "@tutao/entities/tutanota"

export type ImapImportSession = {
	imapAccountSyncState: ImapAccountSyncState
	imapFolderSyncStates: ImapFolderSyncState[]
	importedMessageIds: Set<string>
	imapMailboxesToTutaFolders: Map<string, Id>
	syncProgress?: {
		completed: number
		total: number
	}
}

export function newImapImportSession(accountSyncState: ImapAccountSyncState): ImapImportSession {
	return {
		imapAccountSyncState: accountSyncState,
		imapFolderSyncStates: [],
		importedMessageIds: new Set(),
		imapMailboxesToTutaFolders: new Map(),
	}
}
