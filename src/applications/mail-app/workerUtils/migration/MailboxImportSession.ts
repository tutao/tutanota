import { MailboxMigrationSyncState, MailboxMigrationFolderSyncState } from "@tutao/entities/tutanota"
import { UserMigrationInfo } from "@tutao/entities/sys"

export type MailboxImportSession = {
	mailboxMigrationSyncState: MailboxMigrationSyncState
	mailboxMigrationFolderSyncStates: MailboxMigrationFolderSyncState[]
	userMigrationInfo: UserMigrationInfo | null
	syncProgress?: {
		completed: number
		total: number
	}
}

export function newMailboxImportSession(
	migrationSyncState: MailboxMigrationSyncState,
	folderSyncStates: MailboxMigrationFolderSyncState[],
	userMigrationInfo: UserMigrationInfo | null,
): MailboxImportSession {
	return {
		mailboxMigrationSyncState: migrationSyncState,
		mailboxMigrationFolderSyncStates: folderSyncStates,
		userMigrationInfo,
	}
}
