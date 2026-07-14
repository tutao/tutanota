/* generated file, don't edit. */

import { ImapSyncContext } from "../types/ImapSyncContext"
import { ImapCredentials } from "../types/ImapCredentials"
import { ImapSyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"

export class ImapSyncSystemFacadeReceiveDispatcher {
	constructor(private readonly facade: ImapSyncSystemFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "startSync": {
				const accountSyncId: IdTuple = arg[0]
				const imapSyncContext: ImapSyncContext = arg[1]
				return this.facade.startSync(accountSyncId, imapSyncContext)
			}
			case "getImapMailboxesFromServer": {
				const imapCredentials: ImapCredentials = arg[0]
				return this.facade.getImapMailboxesFromServer(imapCredentials)
			}
			case "stopSync": {
				const accountSyncId: IdTuple = arg[0]
				return this.facade.stopSync(accountSyncId)
			}
		}
	}
}
