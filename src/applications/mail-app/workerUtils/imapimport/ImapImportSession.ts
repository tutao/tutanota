import { MailboxMigrationSyncState, MigrationFolderSyncState } from "@tutao/entities/tutanota"
import { UserMigrationInformation } from "@tutao/entities/sys"

export type ImapImportSession = {
	imapAccountSyncState: MailboxMigrationSyncState
	imapFolderSyncStates: MigrationFolderSyncState[]
	userMigrationInformation: UserMigrationInformation | null
	importedMessageIds: Set<string>
	syncProgress?: {
		completed: number
		total: number
	}
}

export function newImapImportSession(
	accountSyncState: MailboxMigrationSyncState,
	folderSyncStates: MigrationFolderSyncState[],
	userMigrationInformation: UserMigrationInformation | null,
): ImapImportSession {
	return {
		imapAccountSyncState: accountSyncState,
		imapFolderSyncStates: folderSyncStates,
		userMigrationInformation,
		importedMessageIds: new Set(),
	}
}
