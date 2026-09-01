import { ArchiveDownloaderFacade } from "@tutao/native-bridge/generatedIpc/types"

const TAG = "[DesktopArchiveDownloaderFacade]"

export class DesktopArchiveDownloaderFacade implements ArchiveDownloaderFacade {
	async downloadAndStoreArchive(sourceUrl: string, typeref: string, modelVersion: number): Promise<void> {
		// download
		// store
	}
}
