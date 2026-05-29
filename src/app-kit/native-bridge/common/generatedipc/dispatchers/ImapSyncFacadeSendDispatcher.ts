/* generated file, don't edit. */

import { ImapSyncFacade } from "@tutao/native-bridge/generatedIpc/types"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class ImapSyncFacadeSendDispatcher implements ImapSyncFacade {
	constructor(private readonly transport: NativeInterface) {}
	async onMailbox(...args: Parameters<ImapSyncFacade["onMailbox"]>) {
		return this.transport.invokeNative("ipc", ["ImapSyncFacade", "onMailbox", ...args])
	}
	async onMailboxStatus(...args: Parameters<ImapSyncFacade["onMailboxStatus"]>) {
		return this.transport.invokeNative("ipc", ["ImapSyncFacade", "onMailboxStatus", ...args])
	}
	async onMultipleMails(...args: Parameters<ImapSyncFacade["onMultipleMails"]>) {
		return this.transport.invokeNative("ipc", ["ImapSyncFacade", "onMultipleMails", ...args])
	}
	async onPostpone(...args: Parameters<ImapSyncFacade["onPostpone"]>) {
		return this.transport.invokeNative("ipc", ["ImapSyncFacade", "onPostpone", ...args])
	}
	async onFinish(...args: Parameters<ImapSyncFacade["onFinish"]>) {
		return this.transport.invokeNative("ipc", ["ImapSyncFacade", "onFinish", ...args])
	}
	async onError(...args: Parameters<ImapSyncFacade["onError"]>) {
		return this.transport.invokeNative("ipc", ["ImapSyncFacade", "onError", ...args])
	}
}
