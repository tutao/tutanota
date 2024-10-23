/* generated file, don't edit. */

import { MailImportFacade } from "./MailImportFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class MailImportFacadeSendDispatcher implements MailImportFacade {
	constructor(private readonly transport: NativeInterface) {}
	async setupImapImport(...args: Parameters<MailImportFacade["setupImapImport"]>) {
		return this.transport.invokeNative("ipc", ["MailImportFacade", "setupImapImport", ...args])
	}
	async startImapImport(...args: Parameters<MailImportFacade["startImapImport"]>) {
		return this.transport.invokeNative("ipc", ["MailImportFacade", "startImapImport", ...args])
	}
	async stopImapImport(...args: Parameters<MailImportFacade["stopImapImport"]>) {
		return this.transport.invokeNative("ipc", ["MailImportFacade", "stopImapImport", ...args])
	}
	async importFromFiles(...args: Parameters<MailImportFacade["importFromFiles"]>) {
		return this.transport.invokeNative("ipc", ["MailImportFacade", "importFromFiles", ...args])
	}
}
