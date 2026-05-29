import { ImapSync } from "./imapsync/ImapSync.js"
import { ImapError, ImapErrorCause } from "../../api/common/error/ImapError.js"
import { ImapGetMailboxResult } from "../../api/common/utils/imapImportUtils/ImapGetMailboxResult"
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

	async getImapMailboxesFromServer(imapAccount: ImapCredentials): Promise<ImapGetMailboxResult> {
		try {
			const mailboxes = await this.imapInitFolderSyncFactory().getImapMailboxesFromServer(imapAccount)
			return { result: mailboxes }
		} catch (e) {
			return { error: new ImapError(e.response, ImapErrorCause.LIST_MAILBOX_FAILED) }
		}
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
