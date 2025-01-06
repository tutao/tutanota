/* generated file, don't edit. */

import { NativeMailImportFacade } from "./NativeMailImportFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class NativeMailImportFacadeSendDispatcher implements NativeMailImportFacade {
	constructor(private readonly transport: NativeInterface) {}
	async startFileImport(...args: Parameters<NativeMailImportFacade["startFileImport"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "startFileImport", ...args])
	}
	async setContinueProgressAction(...args: Parameters<NativeMailImportFacade["setContinueProgressAction"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "setContinueProgressAction", ...args])
	}
	async setStopProgressAction(...args: Parameters<NativeMailImportFacade["setStopProgressAction"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "setStopProgressAction", ...args])
	}
	async setPausedProgressAction(...args: Parameters<NativeMailImportFacade["setPausedProgressAction"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "setPausedProgressAction", ...args])
	}
	async getResumeableImport(...args: Parameters<NativeMailImportFacade["getResumeableImport"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "getResumeableImport", ...args])
	}
	async resumeFileImport(...args: Parameters<NativeMailImportFacade["resumeFileImport"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "resumeFileImport", ...args])
	}
	async getImportState(...args: Parameters<NativeMailImportFacade["getImportState"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "getImportState", ...args])
	}
	async deinitLogger(...args: Parameters<NativeMailImportFacade["deinitLogger"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "deinitLogger", ...args])
	}
}
