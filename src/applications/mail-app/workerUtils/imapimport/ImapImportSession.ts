import { ImapAccountSyncState, ImapFolderSyncState } from "@tutao/entities/tutanota"
import { ImapAccountSyncStatus, ImapImportState } from "../../../../entities/tutanota/Utils"

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

	get imapImportState(): ImapImportState {
		if (this.imapAccountSyncState.status === ImapAccountSyncStatus.POSTPONED) {
			return new ImapImportState(this.imapAccountSyncState.status as ImapAccountSyncStatus, new Date(parseInt(this.imapAccountSyncState.postponedUntil)))
		} else {
			return new ImapImportState(this.imapAccountSyncState.status as ImapAccountSyncStatus)
		}
	}
}
