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
}
