import { ArchiveDownloaderFacade } from "@tutao/native-bridge/generatedIpc/types"

const TAG = "[DesktopArchiveDownloaderFacade]"

export class DesktopArchiveDownloaderFacade implements ArchiveDownloaderFacade {
	abortDownloadAndStoreArchive(archive: string): Promise<void> {
		throw new Error("Method not implemented.")
	}
	async downloadAndStoreArchive(sourceUrl: string, archiveId: string, typeref: string, modelVersion: number): Promise<void> {
		// download
		// store
	}
}
