/* generated file, don't edit. */

import { NativeMailImportFacade } from "./NativeMailImportFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class NativeMailImportFacadeSendDispatcher implements NativeMailImportFacade {
	constructor(private readonly transport: NativeInterface) {}
	async stopImport(...args: Parameters<NativeMailImportFacade["stopImport"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "stopImport", ...args])
	}
	async importFromFiles(...args: Parameters<NativeMailImportFacade["importFromFiles"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "importFromFiles", ...args])
	}
}
