/* generated file, don't edit. */

import { ExportFacade } from "./ExportFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class ExportFacadeSendDispatcher implements ExportFacade {
	constructor(private readonly transport: NativeInterface) {}
	async mailToMsg(...args: Parameters<ExportFacade["mailToMsg"]>) {
		return this.transport.invokeNative("ipc", ["ExportFacade", "mailToMsg", ...args])
	}
	async saveToExportDir(...args: Parameters<ExportFacade["saveToExportDir"]>) {
		return this.transport.invokeNative("ipc", ["ExportFacade", "saveToExportDir", ...args])
	}
	async startNativeDrag(...args: Parameters<ExportFacade["startNativeDrag"]>) {
		return this.transport.invokeNative("ipc", ["ExportFacade", "startNativeDrag", ...args])
	}
	async checkFileExistsInExportDir(...args: Parameters<ExportFacade["checkFileExistsInExportDir"]>) {
		return this.transport.invokeNative("ipc", ["ExportFacade", "checkFileExistsInExportDir", ...args])
	}
	async getMailboxExportState(...args: Parameters<ExportFacade["getMailboxExportState"]>) {
		return this.transport.invokeNative("ipc", ["ExportFacade", "getMailboxExportState", ...args])
	}
	async endMailboxExport(...args: Parameters<ExportFacade["endMailboxExport"]>) {
		return this.transport.invokeNative("ipc", ["ExportFacade", "endMailboxExport", ...args])
	}
	async startMailboxExport(...args: Parameters<ExportFacade["startMailboxExport"]>) {
		return this.transport.invokeNative("ipc", ["ExportFacade", "startMailboxExport", ...args])
	}
	async saveMailboxExport(...args: Parameters<ExportFacade["saveMailboxExport"]>) {
		return this.transport.invokeNative("ipc", ["ExportFacade", "saveMailboxExport", ...args])
	}
	async clearExportState(...args: Parameters<ExportFacade["clearExportState"]>) {
		return this.transport.invokeNative("ipc", ["ExportFacade", "clearExportState", ...args])
	}
	async openExportDirectory(...args: Parameters<ExportFacade["openExportDirectory"]>) {
		return this.transport.invokeNative("ipc", ["ExportFacade", "openExportDirectory", ...args])
	}
}
