import { MailboxMigrationSyncState, MailboxMigrationFolderSyncState } from "@tutao/entities/tutanota"
import { UserMigrationInformation } from "@tutao/entities/sys"

export type MailboxImportSession = {
	mailboxMigrationSyncState: MailboxMigrationSyncState
	imapFolderSyncStates: MailboxMigrationFolderSyncState[]
	userMigrationInformation: UserMigrationInformation | null
	importedMessageIds: Set<string>
	syncProgress?: {
		completed: number
		total: number
	}
}

export function newMailboxImportSession(
	accountSyncState: MailboxMigrationSyncState,
	folderSyncStates: MailboxMigrationFolderSyncState[],
	userMigrationInformation: UserMigrationInformation | null,
): MailboxImportSession {
	return {
		mailboxMigrationSyncState: accountSyncState,
		imapFolderSyncStates: folderSyncStates,
		userMigrationInformation,
		importedMessageIds: new Set(),
	}
}
