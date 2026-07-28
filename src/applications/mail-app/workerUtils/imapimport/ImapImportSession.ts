import { ImapAccountSyncState, ImapFolderSyncState, MailSet } from "@tutao/entities/tutanota"

export type ImapImportSession = {
	imapAccountSyncState: ImapAccountSyncState
	imapFolderSyncStates: ImapFolderSyncState[]
	allMailSets: MailSet[]
	importedMessageIds: Set<string>
	syncProgress?: {
		completed: number
		total: number
	}
}

export function newImapImportSession(
	accountSyncState: ImapAccountSyncState,
	folderSyncStates: ImapFolderSyncState[],
	allMailSets: MailSet[],
): ImapImportSession {
	return {
		imapAccountSyncState: accountSyncState,
		imapFolderSyncStates: folderSyncStates,
		allMailSets: allMailSets,
		importedMessageIds: new Set(),
	}
}
