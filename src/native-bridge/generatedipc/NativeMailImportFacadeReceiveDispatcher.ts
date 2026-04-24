/* generated file, don't edit. */

import { UnencryptedCredentials } from "./UnencryptedCredentials.js"
import { NativeMailImportFacade } from "./NativeMailImportFacade.js"

export class NativeMailImportFacadeReceiveDispatcher {
	constructor(private readonly facade: NativeMailImportFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "getResumableImport": {
				const mailboxId: string = arg[0]
				const targetOwnerGroup: string = arg[1]
				const unencryptedTutaCredentials: UnencryptedCredentials = arg[2]
				const apiUrl: string = arg[3]
				return this.facade.getResumableImport(mailboxId, targetOwnerGroup, unencryptedTutaCredentials, apiUrl)
			}
			case "prepareNewImport": {
				const mailboxId: string = arg[0]
				const targetOwnerGroup: string = arg[1]
				const targetMailSet: ReadonlyArray<string> = arg[2]
				const filePaths: ReadonlyArray<string> = arg[3]
				const unencryptedTutaCredentials: UnencryptedCredentials = arg[4]
				const apiUrl: string = arg[5]
				return this.facade.prepareNewImport(mailboxId, targetOwnerGroup, targetMailSet, filePaths, unencryptedTutaCredentials, apiUrl)
			}
			case "setProgressAction": {
				const mailboxId: string = arg[0]
				const importProgressAction: number = arg[1]
				return this.facade.setProgressAction(mailboxId, importProgressAction)
			}
			case "setAsyncErrorHook": {
				const mailboxId: string = arg[0]
				return this.facade.setAsyncErrorHook(mailboxId)
			}
		}
	}
}
