import { MigrationMailboxState } from "../../api/common/utils/migrationImportUtils/MigrationSyncContext"
import { MigrationMailbox, MigrationMailboxSpecialUse } from "../../api/common/utils/migrationImportUtils/MigrationMailbox.js"

export enum SyncSessionMailboxImportance {
	NO_SYNC = 0,
	LOW = 1,
	MEDIUM = 2,
	HIGH = 3,
}

export class MigrationSessionMailbox {
	mailboxState: MigrationMailboxState
	mailCount: number | null = 0
	importance: SyncSessionMailboxImportance = SyncSessionMailboxImportance.MEDIUM
	lastFetchedMailSeq = 0
	failCount = 0

	private _specialUse: MigrationMailboxSpecialUse | null = null

	constructor(mailboxState: MigrationMailboxState) {
		this.mailboxState = mailboxState
		if (mailboxState.noSync) {
			this.importance = SyncSessionMailboxImportance.NO_SYNC
		}
	}

	get specialUse(): MigrationMailboxSpecialUse | null {
		return this._specialUse
	}

	set specialUse(value: MigrationMailboxSpecialUse | null) {
		this._specialUse = value
		if (this.importance === SyncSessionMailboxImportance.NO_SYNC) {
			return
		}
		switch (this._specialUse) {
			case MigrationMailboxSpecialUse.INBOX:
			case MigrationMailboxSpecialUse.SENT:
				this.importance = SyncSessionMailboxImportance.HIGH
				break
			case MigrationMailboxSpecialUse.ARCHIVE:
			case MigrationMailboxSpecialUse.JUNK:
			case MigrationMailboxSpecialUse.TRASH:
			case MigrationMailboxSpecialUse.ALL:
				this.importance = SyncSessionMailboxImportance.LOW
				break
			default:
				this.importance = SyncSessionMailboxImportance.MEDIUM
				break
		}
	}
}

export function migrationMailboxFromSyncSessionMailbox(syncSessionMailbox: MigrationSessionMailbox): MigrationMailbox {
	return { sourceId: syncSessionMailbox.mailboxState.path, specialUse: syncSessionMailbox.specialUse ?? undefined }
}
