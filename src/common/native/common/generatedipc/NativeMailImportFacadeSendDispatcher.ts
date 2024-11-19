/* generated file, don't edit. */

import { NativeMailImportFacade } from "./NativeMailImportFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}

export class NativeMailImportFacadeSendDispatcher implements NativeMailImportFacade {
	constructor(private readonly transport: NativeInterface) {}

	async setupImapImport(...args: Parameters<NativeMailImportFacade["setupImapImport"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "setupImapImport", ...args])
	}

	async startImapImport(...args: Parameters<NativeMailImportFacade["startImapImport"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "startImapImport", ...args])
	}

	async stopImapImport(...args: Parameters<NativeMailImportFacade["stopImapImport"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "stopImapImport", ...args])
	}

	async importFromFiles(...args: Parameters<NativeMailImportFacade["importFromFiles"]>) {
		return this.transport.invokeNative("ipc", ["NativeMailImportFacade", "importFromFiles", ...args])
	}
}
