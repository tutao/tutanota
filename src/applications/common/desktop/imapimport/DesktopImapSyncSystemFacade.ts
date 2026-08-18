import { ImapSync } from "./imapsync/ImapSync.js"
import { fromImapFlowError, ImapError, ImapErrorCause } from "../../api/common/error/ImapError.js"
import { ImapGetMailboxResult } from "../../api/common/utils/imapImportUtils/ImapGetMailboxResult"
import { ImapVerifyConnectionResult } from "../../api/common/utils/imapImportUtils/ImapVerifyConnectionResult"
import { ImapCredentials, ImapSyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"
import { ImapSyncContext } from "../../api/common/utils/imapImportUtils/ImapSyncContext"
import { first } from "@tutao/utils"

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

	async getImapMailboxesFromServer(imapCredentials: ImapCredentials): Promise<ImapGetMailboxResult> {
		try {
			const mailboxes = await this.imapInitFolderSyncFactory().getImapMailboxesFromServer(imapCredentials)
			return { result: mailboxes }
		} catch (e) {
			const errorList = e.errors ?? [e]
			const firstError = first(errorList)
			if (firstError instanceof ImapError) {
				return { error: firstError }
			} else if (firstError) {
				return { error: fromImapFlowError(firstError) }
			} else {
				return { error: new ImapError("initial connection failed", ImapErrorCause.INITIAL_CONNECT_FAILED) }
			}
		}
	}

	async verifyImapConnection(imapCredentials: ImapCredentials): Promise<ImapVerifyConnectionResult> {
		try {
			await this.imapInitFolderSyncFactory().verifyImapConnection(imapCredentials)
			return { result: true }
		} catch (e) {
			const errorList = e.errors ?? [e]
			const firstError = first(errorList)
			if (firstError instanceof ImapError) {
				return { error: firstError }
			} else if (firstError) {
				return { error: fromImapFlowError(firstError) }
			} else {
				return { error: new ImapError("initial connection failed", ImapErrorCause.INITIAL_CONNECT_FAILED) }
			}
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
