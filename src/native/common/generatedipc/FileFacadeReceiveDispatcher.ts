/* generated file, don't edit. */

import { IpcClientRect } from "./IpcClientRect.js"
import { DataFile } from "./DataFile.js"
import { FileFacade } from "./FileFacade.js"

export class FileFacadeReceiveDispatcher {
	constructor(private readonly facade: FileFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "open": {
				const location: string = arg[0]
				const mimeType: string = arg[1]
				return this.facade.open(location, mimeType)
			}
			case "openFileChooser": {
				const boundingRect: IpcClientRect = arg[0]
				const filter: ReadonlyArray<string> | null = arg[1]
				return this.facade.openFileChooser(boundingRect, filter)
			}
			case "openFolderChooser": {
				return this.facade.openFolderChooser()
			}
			case "deleteFile": {
				const file: string = arg[0]
				return this.facade.deleteFile(file)
			}
			case "getName": {
				const file: string = arg[0]
				return this.facade.getName(file)
			}
			case "getMimeType": {
				const file: string = arg[0]
				return this.facade.getMimeType(file)
			}
			case "getSize": {
				const file: string = arg[0]
				return this.facade.getSize(file)
			}
			case "putFileIntoDownloadsFolder": {
				const localFileUri: string = arg[0]
				const fileNameToUse: string = arg[1]
				return this.facade.putFileIntoDownloadsFolder(localFileUri, fileNameToUse)
			}
			case "upload": {
				const fileUrl: string = arg[0]
				const targetUrl: string = arg[1]
				const method: string = arg[2]
				const headers: Record<string, string> = arg[3]
				return this.facade.upload(fileUrl, targetUrl, method, headers)
			}
			case "download": {
				const sourceUrl: string = arg[0]
				const filename: string = arg[1]
				const headers: Record<string, string> = arg[2]
				return this.facade.download(sourceUrl, filename, headers)
			}
			case "hashFile": {
				const fileUri: string = arg[0]
				return this.facade.hashFile(fileUri)
			}
			case "clearFileData": {
				return this.facade.clearFileData()
			}
			case "joinFiles": {
				const filename: string = arg[0]
				const files: ReadonlyArray<string> = arg[1]
				return this.facade.joinFiles(filename, files)
			}
			case "splitFile": {
				const fileUri: string = arg[0]
				const maxChunkSizeBytes: number = arg[1]
				return this.facade.splitFile(fileUri, maxChunkSizeBytes)
			}
			case "writeDataFile": {
				const file: DataFile = arg[0]
				return this.facade.writeDataFile(file)
			}
			case "readDataFile": {
				const filePath: string = arg[0]
				return this.facade.readDataFile(filePath)
			}
		}
	}
}
