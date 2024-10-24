/* generated file, don't edit. */

import { UnencryptedCredentials } from "./UnencryptedCredentials.js"
import { MailImportFacade } from "./MailImportFacade.js"

export class MailImportFacadeReceiveDispatcher {
	constructor(private readonly facade: MailImportFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "setupImapImport": {
				const apiUrl: string = arg[0]
				const unencryptedTutaCredentials: UnencryptedCredentials = arg[1]
				return this.facade.setupImapImport(apiUrl, unencryptedTutaCredentials)
			}
			case "startImapImport": {
				return this.facade.startImapImport()
			}
			case "stopImapImport": {
				return this.facade.stopImapImport()
			}
			case "importFromFiles": {
				const apiUrl: string = arg[0]
				const unencryptedTutaCredentials: UnencryptedCredentials = arg[1]
				const filePaths: ReadonlyArray<string> = arg[2]
				const targetFolderId: string = arg[3]
				return this.facade.importFromFiles(apiUrl, unencryptedTutaCredentials, filePaths, targetFolderId)
			}
		}
	}
}
