/* generated file, don't edit. */

import { IpcClientRect } from "./IpcClientRect.js"
import { UploadTaskResponse } from "./UploadTaskResponse.js"
import { DownloadTaskResponse } from "./DownloadTaskResponse.js"
import { DataFile } from "./DataFile.js"
/**
 * filesystem-related operations. none of the methods writing files to disk guarantee a fixed file name or location, except for putFileIntoDownloadsFolder.
 */
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

	/**
	 * get the absolute size in bytes of the file at the given location
	 */
	getSize(file: string): Promise<number>

	/**
	 * move and rename a decrypted file from the decryption location to the download location preferred by the user and return the absolute path to the moved file
	 */
	putFileIntoDownloadsFolder(localFileUri: string, fileNameToUse: string): Promise<string>

	upload(fileUrl: string, targetUrl: string, method: string, headers: Record<string, string>): Promise<UploadTaskResponse>

	/**
	 * download an encrypted file to the file system and return the location of the data
	 */
	download(sourceUrl: string, filename: string, headers: Record<string, string>): Promise<DownloadTaskResponse>

	/**
	 * Calculates specified file hash (with SHA-256). Returns first 6 bytes of it as Base64.
	 */
	hashFile(fileUri: string): Promise<string>

	clearFileData(): Promise<void>

	/**
	 * given a list of chunk file locations, will re-join them in order to reconstruct a single file and returns the location of that file on disk.
	 */
	joinFiles(filename: string, files: ReadonlyArray<string>): Promise<string>

	/**
	 * split a given file on disk into as many chunks as necessary to limit their size to the max byte size. returns the list of chunk file locations.
	 */
	splitFile(fileUri: string, maxChunkSizeBytes: number): Promise<ReadonlyArray<string>>

	/**
	 * Save the unencrypted data file to the disk into a fixed temporary location, not the user's preferred download dir.
	 */
	writeDataFile(file: DataFile): Promise<string>

	/**
	 * read the file at the given location into a DataFile. Returns null if reading fails for any reason.
	 */
	readDataFile(filePath: string): Promise<DataFile | null>
}
