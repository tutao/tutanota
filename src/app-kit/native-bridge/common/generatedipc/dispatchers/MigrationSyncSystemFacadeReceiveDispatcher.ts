/* generated file, don't edit. */

import { MigrationSyncContext } from "../types/MigrationSyncContext"
import { MigrationCredentials } from "../types/MigrationCredentials"
import { MigrationSyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"

export class MigrationSyncSystemFacadeReceiveDispatcher {
	constructor(private readonly facade: MigrationSyncSystemFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "startSync": {
				const accountSyncId: IdTuple = arg[0]
				const migrationSyncContext: MigrationSyncContext = arg[1]
				return this.facade.startSync(accountSyncId, migrationSyncContext)
			}
			case "getMigrationMailboxes": {
				const migrationCredentials: MigrationCredentials = arg[0]
				return this.facade.getMigrationMailboxes(migrationCredentials)
			}
			case "stopSync": {
				const accountSyncId: IdTuple = arg[0]
				return this.facade.stopSync(accountSyncId)
			}
		}
	}
}
