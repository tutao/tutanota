/* generated file, don't edit. */

import { ImapSyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class ImapSyncSystemFacadeSendDispatcher implements ImapSyncSystemFacade {
	constructor(private readonly transport: NativeInterface) {}
	async startSync(...args: Parameters<ImapSyncSystemFacade["startSync"]>) {
		return this.transport.invokeNative("ipc", ["ImapSyncSystemFacade", "startSync", ...args])
	}
	async getImapMailboxesFromServer(...args: Parameters<ImapSyncSystemFacade["getImapMailboxesFromServer"]>) {
		return this.transport.invokeNative("ipc", ["ImapSyncSystemFacade", "getImapMailboxesFromServer", ...args])
	}
	async stopSync(...args: Parameters<ImapSyncSystemFacade["stopSync"]>) {
		return this.transport.invokeNative("ipc", ["ImapSyncSystemFacade", "stopSync", ...args])
	}
}
