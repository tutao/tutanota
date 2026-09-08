/* generated file, don't edit. */

import { MigrationMailbox } from "../types/MigrationMailbox"
import { MigrationSyncEventType } from "../types/MigrationSyncEventType"
import { MigrationMailboxStatus } from "../types/MigrationMailboxStatus"
import { MigrationMail } from "../types/MigrationMail"
import { MigrationError } from "../types/MigrationError"
import { MigrationSyncFacade } from "@tutao/native-bridge/generatedIpc/types"

export class MigrationSyncFacadeReceiveDispatcher {
	constructor(private readonly facade: MigrationSyncFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "onMailbox": {
				const accountSyncId: IdTuple = arg[0]
				const migrationMailbox: MigrationMailbox = arg[1]
				const eventType: MigrationSyncEventType = arg[2]
				return this.facade.onMailbox(accountSyncId, migrationMailbox, eventType)
			}
			case "onMailboxStatus": {
				const accountSyncId: IdTuple = arg[0]
				const migrationMailboxStatus: MigrationMailboxStatus = arg[1]
				return this.facade.onMailboxStatus(accountSyncId, migrationMailboxStatus)
			}
			case "onMultipleMails": {
				const accountSyncId: IdTuple = arg[0]
				const migrationMails: ReadonlyArray<MigrationMail> = arg[1]
				const eventType: MigrationSyncEventType = arg[2]
				return this.facade.onMultipleMails(accountSyncId, migrationMails, eventType)
			}
			case "onPostpone": {
				const accountSyncId: IdTuple = arg[0]
				const postponedUntil: number = arg[1]
				return this.facade.onPostpone(accountSyncId, postponedUntil)
			}
			case "onFinish": {
				const accountSyncId: IdTuple = arg[0]
				return this.facade.onFinish(accountSyncId)
			}
			case "onError": {
				const accountSyncId: IdTuple = arg[0]
				const migrationError: MigrationError = arg[1]
				return this.facade.onError(accountSyncId, migrationError)
			}
		}
	}
}
