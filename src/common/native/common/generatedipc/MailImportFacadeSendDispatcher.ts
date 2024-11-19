/* generated file, don't edit. */

import { MailImportFacade } from "./MailImportFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class MailImportFacadeSendDispatcher implements MailImportFacade {
	constructor(private readonly transport: NativeInterface) {}
	async onNewLocalImportMailState(...args: Parameters<MailImportFacade["onNewLocalImportMailState"]>) {
		return this.transport.invokeNative("ipc", ["MailImportFacade", "onNewLocalImportMailState", ...args])
	}
}
