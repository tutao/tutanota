import { MigrationMailbox } from "../../api/common/utils/migrationImportUtils/MigrationMailbox"
import { MigrationCredentials, MigrationSyncContext } from "../../api/common/utils/migrationImportUtils/MigrationSyncContext"
import { MigrationSyncSession } from "./MigrationSyncSession"
import { MigrationSyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"

export type MigrationSyncFactory = (migrationSyncId: IdTuple) => MigrationSyncSession
export type MigrationInitFolderSyncFactory = () => MigrationSyncSession

export class DesktopMigrationSyncSystemFacade implements MigrationSyncSystemFacade {
	// Visible for testing
	activeSyncs = new Map<string, MigrationSyncSession>()

	constructor(
		private readonly migrationSyncFactory: MigrationSyncFactory,
		private readonly migrationInitFolderSyncFactory: MigrationInitFolderSyncFactory,
	) {}

	async startSync(mailboxMigrationSyncId: IdTuple, migrationSyncContext: MigrationSyncContext): Promise<void> {
		await this.stopSync(mailboxMigrationSyncId)
		const idKey = mailboxMigrationSyncId.join("/")
		const sync = this.migrationSyncFactory(mailboxMigrationSyncId)
		this.activeSyncs.set(idKey, sync)

		return sync.startSync(migrationSyncContext)
	}

	async getMigrationMailboxes(migrationCredentials: MigrationCredentials): Promise<MigrationMailbox[]> {
		return await this.migrationInitFolderSyncFactory().getMigrationMailboxes(migrationCredentials)
	}

	async stopSync(mailboxMigrationSyncId: IdTuple): Promise<void> {
		const idKey = mailboxMigrationSyncId.join("/")
		const sync = this.activeSyncs.get(idKey)
		if (sync) {
			await sync.stopSync()
			this.activeSyncs.delete(idKey)
		}
	}
}
