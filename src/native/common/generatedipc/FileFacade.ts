/* generated file, don't edit. */

import { IpcClientRect } from "./IpcClientRect.js"
import { UploadTaskResponse } from "./UploadTaskResponse.js"
import { DownloadTaskResponse } from "./DownloadTaskResponse.js"
import { DataFile } from "./DataFile.js"
export interface FileFacade {
	/**
	 * Opens the file with the built-in viewer or external program.
	 */
	open(location: string, mimeType: string): Promise<void>

	/**
	 * Opens OS file picker. Returns the list of URIs for the selected files. add a list of extensions (without dot) to filter the options.
	 */
	openFileChooser(boundingRect: IpcClientRect, filter: ReadonlyArray<string> | null): Promise<ReadonlyArray<string>>

	/**
	 * Opens OS file picker for selecting a folder. Only on desktop.
	 */
	openFolderChooser(): Promise<string | null>

	deleteFile(file: string): Promise<void>

	getName(file: string): Promise<string>

	getMimeType(file: string): Promise<string>

	getSize(file: string): Promise<number>

	putFileIntoDownloadsFolder(localFileUri: string): Promise<string>

	upload(fileUrl: string, targetUrl: string, method: string, headers: Record<string, string>): Promise<UploadTaskResponse>

	download(sourceUrl: string, filename: string, headers: Record<string, string>): Promise<DownloadTaskResponse>

	/**
	 * Calculates specified file hash (with SHA-256). Returns first 6 bytes of it as Base64.
	 */
	hashFile(fileUri: string): Promise<string>

	clearFileData(): Promise<void>

	joinFiles(filename: string, files: ReadonlyArray<string>): Promise<string>

	splitFile(fileUri: string, maxChunkSizeBytes: number): Promise<ReadonlyArray<string>>

	writeDataFile(file: DataFile): Promise<string>

	readDataFile(filePath: string): Promise<DataFile | null>
}
