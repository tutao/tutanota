/* generated file, don't edit. */

import { ArchiveDownloadRangeHeaders } from "../types/ArchiveDownloadRangeHeaders"
import { ArchiveDownloaderFacade } from "@tutao/native-bridge/generatedIpc/types"

export class ArchiveDownloaderFacadeReceiveDispatcher {
	constructor(private readonly facade: ArchiveDownloaderFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "downloadAndStoreArchive": {
				const sourceUrl: string = arg[0]
				const archiveId: string = arg[1]
				const archiveType: string = arg[2]
				const modelVersion: number = arg[3]
				const rangeHeaders: ArchiveDownloadRangeHeaders | null = arg[4]
				return this.facade.downloadAndStoreArchive(sourceUrl, archiveId, archiveType, modelVersion, rangeHeaders)
			}
			case "abortDownloadAndStoreArchive": {
				const archiveId: string = arg[0]
				return this.facade.abortDownloadAndStoreArchive(archiveId)
			}
		}
	}
}
