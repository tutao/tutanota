import { ImapSync } from "./imapsync/ImapSync.js"
import { ImapMailbox } from "../../api/common/utils/imapImportUtils/ImapMailbox"
import { ImapCredentials, ImapSyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"
import { ImapSyncContext } from "../../api/common/utils/imapImportUtils/ImapSyncContext"

export type ImapSyncFactory = (accountSyncId: IdTuple) => ImapSync
export type ImapInitFolderSyncFactory = () => ImapSync

export class DesktopImapSyncSystemFacade implements ImapSyncSystemFacade {
	// Visible for testing
	activeSyncs = new Map<string, ImapSync>()

	constructor(
		private readonly imapSyncFactory: ImapSyncFactory,
		private readonly imapInitFolderSyncFactory: ImapInitFolderSyncFactory,
	) {}

	async startSync(accountSyncId: IdTuple, imapSyncContext: ImapSyncContext): Promise<void> {
		await this.stopSync(accountSyncId)
		const idKey = accountSyncId.join("/")
		const sync = this.imapSyncFactory(accountSyncId)
		this.activeSyncs.set(idKey, sync)

		return sync.startImapSync(imapSyncContext)
	}

	async getImapMailboxesFromServer(imapCredentials: ImapCredentials): Promise<ImapMailbox[]> {
		return await this.imapInitFolderSyncFactory().getImapMailboxesFromServer(imapCredentials)
	}

	async stopSync(accountSyncId: IdTuple): Promise<void> {
		const idKey = accountSyncId.join("/")
		const sync = this.activeSyncs.get(idKey)
		if (sync) {
			await sync.stopImapSync()
			this.activeSyncs.delete(idKey)
		}
	}
}
