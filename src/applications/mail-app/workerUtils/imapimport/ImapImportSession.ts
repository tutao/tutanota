import { MailboxMigrationSyncState, MigrationFolderSyncState } from "@tutao/entities/tutanota"
import { UserMigrationInformation } from "@tutao/entities/sys"

export type ImapImportSession = {
	imapAccountSyncState: MailboxMigrationSyncState
	imapFolderSyncStates: MigrationFolderSyncState[]
	/** The current source of truth for this sync state's provider/credentials, if one exists (see ImapImportUtils.getImapCredentialSource). */
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
