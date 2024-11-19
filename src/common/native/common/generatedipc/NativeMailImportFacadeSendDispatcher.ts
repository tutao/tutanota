/* generated file, don't edit. */

import { NativeMailImportFacade } from "./NativeMailImportFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class NativeMailImportFacadeSendDispatcher implements NativeMailImportFacade {
	constructor(private readonly transport: NativeInterface) {}
	async importFromFiles(...args: Parameters<NativeMailImportFacade["importFromFiles"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "importFromFiles", ...args])
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
	async resumeImport(...args: Parameters<NativeMailImportFacade["resumeImport"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "resumeImport", ...args])
	}
}
