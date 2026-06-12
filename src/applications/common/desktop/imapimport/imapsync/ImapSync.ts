import { ImapSyncEventListener } from "./ImapSyncEventListener.js"
import { ImapSyncSession } from "./ImapSyncSession.js"
import { ImapCredentials, ImapSyncState } from "../../../api/common/utils/imapImportUtils/ImapSyncState.js"
import { ImapError } from "../../../api/common/error/ImapError"
import { ImapMailbox } from "../../../api/common/utils/imapImportUtils/ImapMailbox"
import { ImapSyncEventType } from "../../../../../entities/tutanota/Utils"

const defaultImapSyncConfig: ImapSyncConfig = {
	emitAdSyncEventTypes: new Set<ImapSyncEventType>([ImapSyncEventType.CREATE]),
	isEnableImapQresync: true,
}

export interface ImapSyncConfig {
	emitAdSyncEventTypes: Set<ImapSyncEventType>
	isEnableImapQresync: boolean
}

export class ImapSync {
	constructor(private readonly syncSession: ImapSyncSession) {}

	async startImapSync(imapSyncState: ImapSyncState): Promise<ImapError | null> {
		return await this.syncSession.startSyncSession(imapSyncState)
	}

	async stopImapSync(): Promise<void> {
		return this.syncSession.stopSyncSession()
	}

	async getImapMailboxesFromServer(imapAccount: ImapCredentials): Promise<ReadonlyArray<ImapMailbox>> {
		return await this.syncSession.getImapMailboxesFromServer(imapAccount)
	}
}

export function createImapSync(imapSyncEventListener: ImapSyncEventListener, imapSyncConfig: ImapSyncConfig = defaultImapSyncConfig): ImapSync {
	return new ImapSync(new ImapSyncSession(imapSyncEventListener, imapSyncConfig))
}
