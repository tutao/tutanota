import { MigrationCredentials, MigrationSyncContext } from "../../api/common/utils/migrationImportUtils/MigrationSyncContext"
import { MigrationMailbox } from "../../api/common/utils/migrationImportUtils/MigrationMailbox"

export interface MigrationSync {
	startSync(migrationSyncContext: MigrationSyncContext): Promise<void>
	stopSync(): Promise<void>
	getMigrationMailboxes(migrationCredentials: MigrationCredentials): Promise<MigrationMailbox[]>
}
