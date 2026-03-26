/* generated file, don't edit. */

import { ImapImportFacade } from "./ImapImportFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class ImapImportFacadeSendDispatcher implements ImapImportFacade {
	constructor(private readonly transport: NativeInterface) {}
	async onMailbox(...args: Parameters<ImapImportFacade["onMailbox"]>) {
		return this.transport.invokeNative("ipc", ["ImapImportFacade", "onMailbox", ...args])
	}
	async onMailboxStatus(...args: Parameters<ImapImportFacade["onMailboxStatus"]>) {
		return this.transport.invokeNative("ipc", ["ImapImportFacade", "onMailboxStatus", ...args])
	}
	async onMail(...args: Parameters<ImapImportFacade["onMail"]>) {
		return this.transport.invokeNative("ipc", ["ImapImportFacade", "onMail", ...args])
	}
	async onPostpone(...args: Parameters<ImapImportFacade["onPostpone"]>) {
		return this.transport.invokeNative("ipc", ["ImapImportFacade", "onPostpone", ...args])
	}
	async onFinish(...args: Parameters<ImapImportFacade["onFinish"]>) {
		return this.transport.invokeNative("ipc", ["ImapImportFacade", "onFinish", ...args])
	}
	async onError(...args: Parameters<ImapImportFacade["onError"]>) {
		return this.transport.invokeNative("ipc", ["ImapImportFacade", "onError", ...args])
	}
}
