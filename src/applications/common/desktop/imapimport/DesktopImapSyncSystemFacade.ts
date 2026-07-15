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
			// Network errors sometimes have "errors" and no response and e.message due being aggregate errors
			// // This way we should properly handle any error, if it's unknown we just log the complete error.
			let errorMessage = e.response ?? e.message
			if (!errorMessage) {
				errorMessage = JSON.stringify(e.errors ? e.errors : e, null, 2)
			}
			//const errorCode = e.errors[0].code
			return { error: new ImapError(errorMessage, ImapErrorCause.LIST_MAILBOX_FAILED) }
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
