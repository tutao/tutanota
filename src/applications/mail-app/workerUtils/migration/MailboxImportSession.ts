import { MailboxMigrationSyncState, MailboxMigrationFolderSyncState } from "@tutao/entities/tutanota"
import { UserMigrationInformation } from "@tutao/entities/sys"

export type MailboxImportSession = {
	mailboxMigrationSyncState: MailboxMigrationSyncState
	mailboxMigrationFolderSyncStates: MailboxMigrationFolderSyncState[]
	userMigrationInformation: UserMigrationInformation | null
	syncProgress?: {
		completed: number
		total: number
	}
}

export function newMailboxImportSession(
	migrationSyncState: MailboxMigrationSyncState,
	folderSyncStates: MailboxMigrationFolderSyncState[],
	userMigrationInformation: UserMigrationInformation | null,
): MailboxImportSession {
	return {
		mailboxMigrationSyncState: migrationSyncState,
		mailboxMigrationFolderSyncStates: folderSyncStates,
		userMigrationInformation,
	}
}
