import { ImapAccountSyncState, ImapFolderSyncState } from "@tutao/entities/tutanota"

export class ImapImportSession {
	imapAccountSyncState: ImapAccountSyncState
	imapFolderSyncStates: ImapFolderSyncState[] = []
	importedMessageIds: Set<string> = new Set()
	imapMailboxesToTutaFolders: Map<string, Id> = new Map()
	syncProgress?: {
		completed: number
		total: number
	}
	constructor(accountSyncState: ImapAccountSyncState) {
		this.imapAccountSyncState = accountSyncState
	}
}
