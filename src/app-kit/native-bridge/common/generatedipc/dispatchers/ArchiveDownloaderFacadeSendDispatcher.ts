/* generated file, don't edit. */

import { ArchiveDownloaderFacade } from "@tutao/native-bridge/generatedIpc/types"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class ArchiveDownloaderFacadeSendDispatcher implements ArchiveDownloaderFacade {
	constructor(private readonly transport: NativeInterface) {}
	async downloadAndStoreArchive(...args: Parameters<ArchiveDownloaderFacade["downloadAndStoreArchive"]>) {
		return this.transport.invokeNative("ipc", ["ArchiveDownloaderFacade", "downloadAndStoreArchive", ...args])
	}
	async abortDownloadAndStoreArchive(...args: Parameters<ArchiveDownloaderFacade["abortDownloadAndStoreArchive"]>) {
		return this.transport.invokeNative("ipc", ["ArchiveDownloaderFacade", "abortDownloadAndStoreArchive", ...args])
	}
	async clearStoredArchives(...args: Parameters<ArchiveDownloaderFacade["clearStoredArchives"]>) {
		return this.transport.invokeNative("ipc", ["ArchiveDownloaderFacade", "clearStoredArchives", ...args])
	}
}
