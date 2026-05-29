import { ImapAccountSyncState, ImapFolderSyncState } from "@tutao/entities/tutanota"

export type ImapImportSession = {
	imapAccountSyncState: ImapAccountSyncState
	imapFolderSyncStates: ImapFolderSyncState[]
	importedMessageIds: Set<string>
	syncProgress?: {
		completed: number
		total: number
	}
}

export function newImapImportSession(accountSyncState: ImapAccountSyncState, folderSyncStates: ImapFolderSyncState[]): ImapImportSession {
	return {
		imapAccountSyncState: accountSyncState,
		imapFolderSyncStates: folderSyncStates,
		importedMessageIds: new Set(),
	}
}
