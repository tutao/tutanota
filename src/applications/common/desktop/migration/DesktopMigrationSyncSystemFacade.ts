import { MigrationMailbox } from "../../api/common/utils/migrationImportUtils/MigrationMailbox"
import { MigrationCredentials, MigrationSyncContext } from "../../api/common/utils/migrationImportUtils/MigrationSyncContext"
import { MigrationSync } from "./MigrationSync"
import { getServerMigrationConfigForProvider, MigrationFetchMethod } from "../../api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { MigrationSyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"

export type MigrationSyncFactory = (accountSyncId: IdTuple, fetchMethod: MigrationFetchMethod) => MigrationSync
export type MigrationInitFolderSyncFactory = (fetchMethod: MigrationFetchMethod) => MigrationSync

export class DesktopMigrationSyncSystemFacade implements MigrationSyncSystemFacade {
	// Visible for testing
	activeSyncs = new Map<string, MigrationSync>()

	constructor(
		private readonly migrationSyncFactory: MigrationSyncFactory,
		private readonly migrationInitFolderSyncFactory: MigrationInitFolderSyncFactory,
	) {}

	async startSync(mailboxMigrationSyncId: IdTuple, migrationSyncContext: MigrationSyncContext): Promise<void> {
		await this.stopSync(mailboxMigrationSyncId)
		const idKey = mailboxMigrationSyncId.join("/")
		const migrationFetchMethod = getMigrationFetchMethod(migrationSyncContext.migrationCredentials)
		const sync = this.migrationSyncFactory(mailboxMigrationSyncId, migrationFetchMethod)
		this.activeSyncs.set(idKey, sync)

		return sync.startSync(migrationSyncContext)
	}

	async getMigrationMailboxes(migrationCredentials: MigrationCredentials): Promise<MigrationMailbox[]> {
		const migrationFetchMethod = getMigrationFetchMethod(migrationCredentials)
		return await this.migrationInitFolderSyncFactory(migrationFetchMethod).getMigrationMailboxes(migrationCredentials)
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

function getMigrationFetchMethod(migrationCredentials: MigrationCredentials): MigrationFetchMethod {
	return migrationCredentials.isLegacy
		? MigrationFetchMethod.Imap
		: (getServerMigrationConfigForProvider(migrationCredentials.provider)?.fetchMethod ?? MigrationFetchMethod.Imap)
}
