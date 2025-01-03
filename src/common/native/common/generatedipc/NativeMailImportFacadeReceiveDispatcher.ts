/* generated file, don't edit. */

import { UnencryptedCredentials } from "./UnencryptedCredentials.js"
import { NativeMailImportFacade } from "./NativeMailImportFacade.js"

export class NativeMailImportFacadeReceiveDispatcher {
	constructor(private readonly facade: NativeMailImportFacade) {}

	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "importFromFiles": {
				const apiUrl: string = arg[0]
				const unencryptedTutaCredentials: UnencryptedCredentials = arg[1]
				const targetOwnerGroup: string = arg[2]
				const targetFolder: ReadonlyArray<string> = arg[3]
				const filePaths: ReadonlyArray<string> = arg[4]
				return this.facade.importFromFiles(apiUrl, unencryptedTutaCredentials, targetOwnerGroup, targetFolder, filePaths)
			}
			case "setContinueProgressAction": {
				return this.facade.setContinueProgressAction()
			}
			case "setStopProgressAction": {
				return this.facade.setStopProgressAction()
			}
			case "setPausedProgressAction": {
				return this.facade.setPausedProgressAction()
			}
			case "getResumeableImport": {
				const mailboxId: string = arg[0]
				return this.facade.getResumeableImport(mailboxId)
			}
			case "resumeImport": {
				const apiUrl: string = arg[0]
				const unencryptedTutaCredentials: UnencryptedCredentials = arg[1]
				const importStateId: IdTuple = arg[2]
				return this.facade.resumeImport(apiUrl, unencryptedTutaCredentials, importStateId)
			}
			case "deinitLogger": {
				return this.facade.deinitLogger()
			}
		}
	}
}
