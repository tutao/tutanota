/* generated file, don't edit. */

import { MigrationSyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class MigrationSyncSystemFacadeSendDispatcher implements MigrationSyncSystemFacade {
	constructor(private readonly transport: NativeInterface) {}
	async startSync(...args: Parameters<MigrationSyncSystemFacade["startSync"]>) {
		return this.transport.invokeNative("ipc", ["MigrationSyncSystemFacade", "startSync", ...args])
	}
	async getMigrationMailboxes(...args: Parameters<MigrationSyncSystemFacade["getMigrationMailboxes"]>) {
		return this.transport.invokeNative("ipc", ["MigrationSyncSystemFacade", "getMigrationMailboxes", ...args])
	}
	async stopSync(...args: Parameters<MigrationSyncSystemFacade["stopSync"]>) {
		return this.transport.invokeNative("ipc", ["MigrationSyncSystemFacade", "stopSync", ...args])
	}
}
