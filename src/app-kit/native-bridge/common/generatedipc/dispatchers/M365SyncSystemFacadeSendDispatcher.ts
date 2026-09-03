/* generated file, don't edit. */

import { M365SyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class M365SyncSystemFacadeSendDispatcher implements M365SyncSystemFacade {
	constructor(private readonly transport: NativeInterface) {}
	async startSync(...args: Parameters<M365SyncSystemFacade["startSync"]>) {
		return this.transport.invokeNative("ipc", ["M365SyncSystemFacade", "startSync", ...args])
	}
	async getImapMailboxesFromServer(...args: Parameters<M365SyncSystemFacade["getImapMailboxesFromServer"]>) {
		return this.transport.invokeNative("ipc", ["M365SyncSystemFacade", "getImapMailboxesFromServer", ...args])
	}
	async stopSync(...args: Parameters<M365SyncSystemFacade["stopSync"]>) {
		return this.transport.invokeNative("ipc", ["M365SyncSystemFacade", "stopSync", ...args])
	}
}
