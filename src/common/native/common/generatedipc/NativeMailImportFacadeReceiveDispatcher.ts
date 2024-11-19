/* generated file, don't edit. */

import { UnencryptedCredentials } from "./UnencryptedCredentials.js"
import { NativeMailImportFacade } from "./NativeMailImportFacade.js"

export class NativeMailImportFacadeReceiveDispatcher {
	constructor(private readonly facade: NativeMailImportFacade) {}

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
				const targetOwnerGroup: string = arg[2]
				const targetFolder: ReadonlyArray<string> = arg[3]
				const filePaths: ReadonlyArray<string> = arg[4]
				return this.facade.importFromFiles(apiUrl, unencryptedTutaCredentials, targetOwnerGroup, targetFolder, filePaths)
			}
		}
	}
}
