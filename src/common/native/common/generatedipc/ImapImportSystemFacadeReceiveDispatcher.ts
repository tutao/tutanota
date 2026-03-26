/* generated file, don't edit. */

import { ImapSyncState } from "./ImapSyncState.js"
import { ImapImportSystemFacade } from "./ImapImportSystemFacade.js"

export class ImapImportSystemFacadeReceiveDispatcher {
	constructor(private readonly facade: ImapImportSystemFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "startImport": {
				const imapSyncState: ImapSyncState = arg[0]
				return this.facade.startImport(imapSyncState)
			}
			case "stopImport": {
				return this.facade.stopImport()
			}
		}
	}
}
