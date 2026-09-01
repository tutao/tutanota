/* generated file, don't edit. */

import { ArchiveDownloaderFacade } from "@tutao/native-bridge/generatedIpc/types"

export class ArchiveDownloaderFacadeReceiveDispatcher {
	constructor(private readonly facade: ArchiveDownloaderFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "downloadAndStoreArchive": {
				const sourceUrl: string = arg[0]
				const typeref: string = arg[1]
				const modelVersion: number = arg[2]
				return this.facade.downloadAndStoreArchive(sourceUrl, typeref, modelVersion)
			}
		}
	}
}
