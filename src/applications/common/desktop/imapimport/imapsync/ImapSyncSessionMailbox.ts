import type { ImapMailboxState } from "../../../api/common/utils/imapImportUtils/ImapSyncContext.js"
import { ImapMailbox, ImapMailboxSpecialUse } from "../../../api/common/utils/imapImportUtils/ImapMailbox.js"

export enum SyncSessionMailboxImportance {
	NO_SYNC = 0,
	LOW = 1,
	MEDIUM = 2,
	HIGH = 3,
}

export class ImapSyncSessionMailbox {
	mailboxState: ImapMailboxState
	mailCount: number | null = 0
	importance: SyncSessionMailboxImportance = SyncSessionMailboxImportance.MEDIUM
	lastFetchedMailSeq = 0
	failCount = 0

	private _specialUse: ImapMailboxSpecialUse | null = null

	constructor(mailboxState: ImapMailboxState) {
		this.mailboxState = mailboxState
	}

	get specialUse(): ImapMailboxSpecialUse | null {
		return this._specialUse
	}

	set specialUse(value: ImapMailboxSpecialUse | null) {
		this._specialUse = value

		switch (this._specialUse) {
			case ImapMailboxSpecialUse.INBOX:
				this.importance = SyncSessionMailboxImportance.HIGH
				break
			case ImapMailboxSpecialUse.TRASH:
			case ImapMailboxSpecialUse.ARCHIVE:
			case ImapMailboxSpecialUse.ALL:
			case ImapMailboxSpecialUse.SENT:
			case ImapMailboxSpecialUse.JUNK:
				this.importance = SyncSessionMailboxImportance.LOW
				break
			default:
				this.importance = SyncSessionMailboxImportance.MEDIUM
				break
		}
	}
}

export function imapMailboxFromSyncSessionMailbox(syncSessionMailbox: ImapSyncSessionMailbox): ImapMailbox {
	return { path: syncSessionMailbox.mailboxState.path }
}
