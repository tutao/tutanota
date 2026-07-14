import { ImapSyncEventListener } from "./ImapSyncEventListener.js"
import { ImapSyncSession } from "./ImapSyncSession.js"
import { ImapMailbox } from "../../../api/common/utils/imapImportUtils/ImapMailbox"
import { ImapSyncEventType } from "../../../../../entities/tutanota/Utils"
import { ImapCredentials, ImapSyncContext } from "../../../api/common/utils/imapImportUtils/ImapSyncContext"
import { CertificateProvider } from "../../CertificateProvider"

const defaultImapSyncConfig: ImapSyncConfig = {
	emitImapSyncEventTypes: new Set<ImapSyncEventType>([ImapSyncEventType.CREATE]),
	isEnableImapQresync: false,
}

export interface ImapSyncConfig {
	emitImapSyncEventTypes: Set<ImapSyncEventType>
	isEnableImapQresync: boolean
}

export class ImapSync {
	constructor(private readonly syncSession: ImapSyncSession) {}

	async startImapSync(imapSyncContext: ImapSyncContext): Promise<void> {
		return this.syncSession.startSyncSession(imapSyncContext)
	}

	async stopImapSync(): Promise<void> {
		return this.syncSession.stopSyncSession()
	}

	async getImapMailboxesFromServer(imapCredentials: ImapCredentials): Promise<ReadonlyArray<ImapMailbox>> {
		return await this.syncSession.getImapMailboxesFromServer(imapCredentials)
	}
}

export function createImapSync(
	imapSyncEventListener: ImapSyncEventListener,
	certificateProvider: CertificateProvider,
	imapSyncConfig: ImapSyncConfig = defaultImapSyncConfig,
): ImapSync {
	return new ImapSync(new ImapSyncSession(imapSyncEventListener, certificateProvider, imapSyncConfig))
}
