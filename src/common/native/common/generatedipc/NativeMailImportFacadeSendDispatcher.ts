/* generated file, don't edit. */

import { NativeMailImportFacade } from "./NativeMailImportFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class NativeMailImportFacadeSendDispatcher implements NativeMailImportFacade {
	constructor(private readonly transport: NativeInterface) {}
	async getResumableImport(...args: Parameters<NativeMailImportFacade["getResumableImport"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "getResumableImport", ...args])
	}
	async prepareNewImport(...args: Parameters<NativeMailImportFacade["prepareNewImport"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "prepareNewImport", ...args])
	}
	async setProgressAction(...args: Parameters<NativeMailImportFacade["setProgressAction"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "setProgressAction", ...args])
	}
	async setAsyncErrorHook(...args: Parameters<NativeMailImportFacade["setAsyncErrorHook"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "setAsyncErrorHook", ...args])
	}
}
