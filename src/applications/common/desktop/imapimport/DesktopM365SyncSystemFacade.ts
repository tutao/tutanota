import { M365Sync } from "./m365sync/M365Sync.js"
import { ImapMailbox } from "../../api/common/utils/imapImportUtils/ImapMailbox"
import { ImapCredentials, M365SyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"
import { ImapSyncContext } from "../../api/common/utils/imapImportUtils/ImapSyncContext"

export type M365SyncFactory = (accountSyncId: IdTuple) => M365Sync
export type M365InitFolderSyncFactory = () => M365Sync

export class DesktopM365SyncSystemFacade implements M365SyncSystemFacade {
	// Visible for testing
	activeSyncs = new Map<string, M365Sync>()

	constructor(
		private readonly m365SyncFactory: M365SyncFactory,
		private readonly m365InitFolderSyncFactory: M365InitFolderSyncFactory,
	) {}

	async startSync(accountSyncId: IdTuple, imapSyncContext: ImapSyncContext): Promise<void> {
		const idKey = accountSyncId.join("/")
		if (this.activeSyncs.has(idKey)) {
			// Should not normally happen - ImapImporter.continueImport skips starting a new round while the
			// account is already RUNNING. If this logs, something bypassed that guard (e.g. a force-retry) and
			// is about to kill the still-running sync below.
			console.log(`M365 startSync called for ${idKey} while a sync is already active - stopping the previous one before starting a new round.`)
		}
		await this.stopSync(accountSyncId)
		const sync = this.m365SyncFactory(accountSyncId)
		this.activeSyncs.set(idKey, sync)

		return sync.startM365Sync(imapSyncContext)
	}

	async getImapMailboxesFromServer(imapCredentials: ImapCredentials): Promise<ImapMailbox[]> {
		return await this.m365InitFolderSyncFactory().getImapMailboxesFromServer(imapCredentials)
	}

	async stopSync(accountSyncId: IdTuple): Promise<void> {
		const idKey = accountSyncId.join("/")
		const sync = this.activeSyncs.get(idKey)
		if (sync) {
			await sync.stopM365Sync()
			this.activeSyncs.delete(idKey)
		}
	}
}
