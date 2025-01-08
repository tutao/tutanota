/* generated file, don't edit. */

import { UnencryptedCredentials } from "./UnencryptedCredentials.js"
import { NativeMailImportFacade } from "./NativeMailImportFacade.js"

export class NativeMailImportFacadeReceiveDispatcher {
	constructor(private readonly facade: NativeMailImportFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "startFileImport": {
				const mailboxId: string = arg[0]
				const apiUrl: string = arg[1]
				const unencryptedTutaCredentials: UnencryptedCredentials = arg[2]
				const targetOwnerGroup: string = arg[3]
				const targetFolder: ReadonlyArray<string> = arg[4]
				const filePaths: ReadonlyArray<string> = arg[5]
				return this.facade.startFileImport(mailboxId, apiUrl, unencryptedTutaCredentials, targetOwnerGroup, targetFolder, filePaths)
			}
			case "setProgressAction": {
				const mailboxId: string = arg[0]
				const apiUrl: string = arg[1]
				const unencryptedTutaCredentials: UnencryptedCredentials = arg[2]
				const progressAction: number = arg[3]
				return this.facade.setProgressAction(mailboxId, apiUrl, unencryptedTutaCredentials, progressAction)
			}
			case "getResumeableImport": {
				const mailboxId: string = arg[0]
				return this.facade.getResumeableImport(mailboxId)
			}
			case "resumeFileImport": {
				const mailboxId: string = arg[0]
				const apiUrl: string = arg[1]
				const unencryptedTutaCredentials: UnencryptedCredentials = arg[2]
				const importStateId: IdTuple = arg[3]
				return this.facade.resumeFileImport(mailboxId, apiUrl, unencryptedTutaCredentials, importStateId)
			}
			case "getImportState": {
				const mailboxId: string = arg[0]
				return this.facade.getImportState(mailboxId)
			}
			case "deinitLogger": {
				return this.facade.deinitLogger()
			}
		}
	}
}
