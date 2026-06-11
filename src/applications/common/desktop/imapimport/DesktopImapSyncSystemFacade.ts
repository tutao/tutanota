import { ImapSync } from "./imapsync/ImapSync.js"
import { ImapCredentials, ImapSyncState } from "../../api/common/utils/imapImportUtils/ImapSyncState.js"
import { ImapError, ImapErrorCause } from "../../api/common/utils/imapImportUtils/ImapError.js"
import { ImapGetMailboxResult } from "../../api/common/utils/imapImportUtils/ImapGetMailboxResult"
import { ImapSyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"

export type ImapSyncFactory = (accountSyncId: IdTuple) => ImapSync
export type ImapInitFolderSyncFactory = () => ImapSync

export class DesktopImapSyncSystemFacade implements ImapSyncSystemFacade {
	// Visible for testing
	activeSyncs = new Map<string, ImapSync>()

	constructor(
		private readonly imapSyncFactory: ImapSyncFactory,
		private readonly imapInitFolderSyncFactory: ImapInitFolderSyncFactory,
	) {}

	async startSync(accountSyncId: IdTuple, imapSyncState: ImapSyncState): Promise<ImapError | null> {
		const idKey = accountSyncId.join("/")
		const adSync = this.imapSyncFactory(accountSyncId)
		this.activeSyncs.set(idKey, adSync)
		return adSync.startImapSync(imapSyncState)
	}

	async getImapMailboxesFromServer(imapAccount: ImapCredentials): Promise<ImapGetMailboxResult> {
		try {
			const mailboxes = await this.imapInitFolderSyncFactory().getImapMailboxesFromServer(imapAccount)
			return new ImapGetMailboxResult(mailboxes)
		} catch (e) {
			return new ImapGetMailboxResult(undefined, new ImapError(e, ImapErrorCause.LIST_MAILBOX_FAILED))
		}
	}

	async stopSync(accountSyncId: IdTuple): Promise<void> {
		const idKey = accountSyncId.join("/")
		const adSync = this.activeSyncs.get(idKey)
		if (adSync) {
			await adSync.stopImapSync()
			this.activeSyncs.delete(idKey)
		}
	}
}
