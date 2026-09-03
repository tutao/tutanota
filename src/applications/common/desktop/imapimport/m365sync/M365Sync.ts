import { ImapSyncEventListener } from "../imapsync/ImapSyncEventListener.js"
import { M365SyncSession } from "./M365SyncSession.js"
import { ImapMailbox } from "../../../api/common/utils/imapImportUtils/ImapMailbox"
import { ImapCredentials, ImapSyncContext } from "../../../api/common/utils/imapImportUtils/ImapSyncContext"

export class M365Sync {
	constructor(private readonly syncSession: M365SyncSession) {}

	async startM365Sync(imapSyncContext: ImapSyncContext): Promise<void> {
		return this.syncSession.startSync(imapSyncContext)
	}

	async stopM365Sync(): Promise<void> {
		this.syncSession.stop()
	}

	async getImapMailboxesFromServer(imapCredentials: ImapCredentials): Promise<ImapMailbox[]> {
		return await this.syncSession.getImapMailboxesFromServer(imapCredentials)
	}
}

export function createM365Sync(imapSyncEventListener: ImapSyncEventListener): M365Sync {
	return new M365Sync(new M365SyncSession(imapSyncEventListener))
}
