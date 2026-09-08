/* generated file, don't edit. */

import { MigrationSyncFacade } from "@tutao/native-bridge/generatedIpc/types"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class MigrationSyncFacadeSendDispatcher implements MigrationSyncFacade {
	constructor(private readonly transport: NativeInterface) {}
	async onMailbox(...args: Parameters<MigrationSyncFacade["onMailbox"]>) {
		return this.transport.invokeNative("ipc", ["MigrationSyncFacade", "onMailbox", ...args])
	}
	async onMailboxStatus(...args: Parameters<MigrationSyncFacade["onMailboxStatus"]>) {
		return this.transport.invokeNative("ipc", ["MigrationSyncFacade", "onMailboxStatus", ...args])
	}
	async onMultipleMails(...args: Parameters<MigrationSyncFacade["onMultipleMails"]>) {
		return this.transport.invokeNative("ipc", ["MigrationSyncFacade", "onMultipleMails", ...args])
	}
	async onPostpone(...args: Parameters<MigrationSyncFacade["onPostpone"]>) {
		return this.transport.invokeNative("ipc", ["MigrationSyncFacade", "onPostpone", ...args])
	}
	async onFinish(...args: Parameters<MigrationSyncFacade["onFinish"]>) {
		return this.transport.invokeNative("ipc", ["MigrationSyncFacade", "onFinish", ...args])
	}
	async onError(...args: Parameters<MigrationSyncFacade["onError"]>) {
		return this.transport.invokeNative("ipc", ["MigrationSyncFacade", "onError", ...args])
	}
}
