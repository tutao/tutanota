/* generated file, don't edit. */

import { IpcClientRect } from "../types/IpcClientRect"
import { DataFile } from "../types/DataFile"
import { FileFacade } from "@tutao/native-bridge/generatedIpc/types"

export class FileFacadeReceiveDispatcher {
	constructor(private readonly facade: FileFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "open": {
				const fileUrl: string = arg[0]
				const mimeType: string = arg[1]
				return this.facade.open(fileUrl, mimeType)
			}
			case "openFileChooser": {
				const boundingRect: IpcClientRect = arg[0]
				const filter: ReadonlyArray<string> | null = arg[1]
				const isFileOnly: boolean | null = arg[2]
				return this.facade.openFileChooser(boundingRect, filter, isFileOnly)
			}
			case "openFolderChooser": {
				return this.facade.openFolderChooser()
			}
			case "openMacImportFileChooser": {
				return this.facade.openMacImportFileChooser()
			}
			case "deleteFile": {
				const fileUrl: string = arg[0]
				return this.facade.deleteFile(fileUrl)
			}
			case "getName": {
				const fileUrl: string = arg[0]
				return this.facade.getName(fileUrl)
			}
			case "getMimeType": {
				const fileUrl: string = arg[0]
				return this.facade.getMimeType(fileUrl)
			}
			case "getSize": {
				const fileUrl: string = arg[0]
				return this.facade.getSize(fileUrl)
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
				const fileId: string = arg[4]
				return this.facade.upload(fileUrl, targetUrl, method, headers, fileId)
			}
			case "abortUpload": {
				const fileId: string = arg[0]
				return this.facade.abortUpload(fileId)
			}
			case "download": {
				const sourceUrl: string = arg[0]
				const filename: string = arg[1]
				const headers: Record<string, string> = arg[2]
				const fileId: string = arg[3]
				return this.facade.download(sourceUrl, filename, headers, fileId)
			}
			case "abortDownload": {
				const fileId: string = arg[0]
				return this.facade.abortDownload(fileId)
			}
			case "hashFile": {
				const fileUrl: string = arg[0]
				return this.facade.hashFile(fileUrl)
			}
			case "clearFileData": {
				return this.facade.clearFileData()
			}
			case "joinFiles": {
				const filename: string = arg[0]
				const filePartsUrls: ReadonlyArray<string> = arg[1]
				return this.facade.joinFiles(filename, filePartsUrls)
			}
			case "openFileForReading": {
				const fileUrl: string = arg[0]
				return this.facade.openFileForReading(fileUrl)
			}
			case "closeFile": {
				const streamUrl: string = arg[0]
				return this.facade.closeFile(streamUrl)
			}
			case "readChunk": {
				const streamUrl: string = arg[0]
				const maxChunkSize: number = arg[1]
				return this.facade.readChunk(streamUrl, maxChunkSize)
			}
			case "writeTempDataFile": {
				const file: DataFile = arg[0]
				return this.facade.writeTempDataFile(file)
			}
			case "writeToAppDir": {
				const content: Uint8Array = arg[0]
				const name: string = arg[1]
				return this.facade.writeToAppDir(content, name)
			}
			case "readFromAppDir": {
				const name: string = arg[0]
				return this.facade.readFromAppDir(name)
			}
			case "deleteFromAppDir": {
				const name: string = arg[0]
				return this.facade.deleteFromAppDir(name)
			}
			case "readDataFile": {
				const fileUrl: string = arg[0]
				return this.facade.readDataFile(fileUrl)
			}
			case "readDirectory": {
				const directoryUrl: string = arg[0]
				return this.facade.readDirectory(directoryUrl)
			}
			case "readDirectory": {
				const filePath: string = arg[0]
				return this.facade.readDirectory(filePath)
			}
		}
	}
}
