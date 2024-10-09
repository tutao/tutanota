/* generated file, don't edit. */

import { UnencryptedCredentials } from "./UnencryptedCredentials.js"
import { ImapCredentials } from "./ImapCredentials.js"
import { ImapImportSystemFacade } from "./ImapImportSystemFacade.js"

export class ImapImportSystemFacadeReceiveDispatcher {
	constructor(private readonly facade: ImapImportSystemFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "setup": {
				const apiUrl: string = arg[0]
				const unencryptedTutaCredentials: UnencryptedCredentials = arg[1]
				const imapCredentials: ImapCredentials = arg[2]
				return this.facade.setup(apiUrl, unencryptedTutaCredentials, imapCredentials)
			}
			case "startImport": {
				return this.facade.startImport()
			}
			case "stopImport": {
				return this.facade.stopImport()
			}
		}
	}
}
