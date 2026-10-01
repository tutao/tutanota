/* generated file, don't edit. */

import { MigrationSyncContext } from "../types/MigrationSyncContext"
import { MigrationCredentials } from "../types/MigrationCredentials"
import { MigrationMailbox } from "../types/MigrationMailbox"
/**
 * Facade implemented by the native desktop client starting and stopping a Migration sync.
 */
export interface MigrationSyncSystemFacade {
	/**
	 * Start the Migration sync for a specific account.
	 */
	startSync(accountSyncId: IdTuple, migrationSyncContext: MigrationSyncContext): Promise<void>

	/**
	 * Fetches the folders from the Migration server, to be used for the folder mapping step
	 */
	getMigrationMailboxes(migrationCredentials: MigrationCredentials): Promise<ReadonlyArray<MigrationMailbox>>

	/**
	 * Stop a specific running Migration sync.
	 */
	stopSync(accountSyncId: IdTuple): Promise<void>
}
