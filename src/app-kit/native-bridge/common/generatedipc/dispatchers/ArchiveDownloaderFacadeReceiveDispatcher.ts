/* generated file, don't edit. */

import { ArchiveDownloaderFacade } from "@tutao/native-bridge/generatedIpc/types"

export class ArchiveDownloaderFacadeReceiveDispatcher {
	constructor(private readonly facade: ArchiveDownloaderFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "downloadAndStoreArchive": {
				const sourceUrl: string = arg[0]
				const archiveId: string = arg[1]
				const typeref: string = arg[2]
				const modelVersion: number = arg[3]
				const serverIdentifier: string = arg[4]
				return this.facade.downloadAndStoreArchive(sourceUrl, archiveId, typeref, modelVersion, serverIdentifier)
			}
			case "abortDownloadAndStoreArchive": {
				const archiveId: string = arg[0]
				return this.facade.abortDownloadAndStoreArchive(archiveId)
			}
		}
	}
}
