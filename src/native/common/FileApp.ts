import {promiseMap, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import type {MailBundle} from "../../mail/export/Bundler"
import type {NativeInterface} from "./NativeInterface"
import {FileReference} from "../../api/common/utils/FileUtils"
import {DataFile} from "../../api/common/DataFile"
import {HttpMethod} from "../../api/common/EntityFunctions"


export type DataTaskResponse = {
	statusCode: number
	errorId: string | null
	precondition: string | null
	suspensionTime: string | null
}
export type DownloadTaskResponse = DataTaskResponse & {
	encryptedFileUri: string | null
}

export type UploadTaskResponse = DataTaskResponse & {
	responseBody: string
}

export type FileUri = string

export class NativeFileApp {
	native: NativeInterface

	constructor(nativeInterface: NativeInterface) {
		this.native = nativeInterface
	}

	/**
	 * Open the file
	 * @param file The uri of the file
	 * @param mimeType The mimeType of the file
	 */
	open(file: FileReference): Promise<void> {
		return this.native.invokeNative("open", [file.location, file.mimeType])
	}

	/**
	 * Opens a file chooser to select a file.
	 * @param button The file chooser is opened next to the rectangle
	 */
	openFileChooser(boundingRect: ClientRect): Promise<Array<FileReference>> {
		/* The file chooser opens next to a location specified by srcRect on larger devices (iPad).
		 * The rectangle must be specifed using values for x, y, height and width.
		 * @param  srcRect Dictionary containing the location of the button which has been pressed to open the file chooser.
		 */
		let srcRect = {
			x: boundingRect.left,
			y: boundingRect.top,
			width: boundingRect.width,
			height: boundingRect.height,
		}
		return this.native
				   .invokeNative("openFileChooser", [srcRect, false])
				   .then((response: Array<string>) => promiseMap(response, this.uriToFileRef.bind(this)))
	}

	openFolderChooser(): Promise<Array<string>> {
		return this.native.invokeNative("openFileChooser", [null, true])
	}

	/**
	 * Deletes the file.
	 * @param  file The uri of the file to delete.
	 */
	deleteFile(file: FileUri): Promise<void> {
		return this.native.invokeNative("deleteFile", [file])
	}

	/**
	 * Returns the name of the file
	 * @param file The uri of the file
	 */
	getName(file: FileUri): Promise<string> {
		return this.native.invokeNative("getName", [file])
	}

	/**
	 * Returns the mime type of the file
	 * @param file The uri of the file
	 */
	getMimeType(file: FileUri): Promise<string> {
		return this.native.invokeNative("getMimeType", [file])
	}

	/**
	 * Returns the byte size of a file
	 * @param file The uri of the file
	 */
	getSize(file: FileUri): Promise<number> {
		return this.native.invokeNative("getSize", [file]).then(sizeString => Number(sizeString))
	}

	/**
	 * Copies the file into downloads folder and notifies system and user about that
	 * @param localFileUri URI for the source file
	 * @returns {*} absolute path of the destination file
	 */
	putFileIntoDownloadsFolder(localFileUri: FileUri): Promise<string> {
		return this.native.invokeNative("putFileIntoDownloads", [localFileUri])
	}

	async saveDataFile(data: DataFile): Promise<FileReference> {
		const fileUri = await this.native.invokeNative("saveDataFile", [data.name, uint8ArrayToBase64(data.data)])
		return {
			_type: "FileReference",
			name: data.name,
			mimeType: data.mimeType,
			size: data.size,
			location: fileUri,
		}
	}

	/**
	 * Uploads the binary data of a file to tutadb
	 */
	upload(fileUrl: string, targetUrl: string, method: HttpMethod, headers: Dict): Promise<UploadTaskResponse> {
		return this.native.invokeNative("upload", [fileUrl, targetUrl, method, headers])
	}

	/**
	 * Downloads the binary data of a file from tutadb and stores it in the internal memory.
	 * @returns Resolves to the URI of the downloaded file
	 */
	download(sourceUrl: FileUri, filename: string, headers: Dict): Promise<DownloadTaskResponse> {
		return this.native.invokeNative("download", [sourceUrl, filename, headers])
	}

	/**
	 * Get the shortened (first six bytes) of the SHA256 of the file.
	 * @param fileUri
	 * @return Base64 encoded, shortened SHA256 hash of the file
	 */
	hashFile(fileUri: FileUri): Promise<string> {
		return this.native.invokeNative('hashFile', [fileUri])
	}

	clearFileData(): Promise<any> {
		return this.native.invokeNative("clearFileData", [])
	}

	readDataFile(uriOrPath: string): Promise<DataFile | null> {
		return this.native.invokeNative("readDataFile", [uriOrPath])
	}

	/**
	 * Generate an MSG file from the mail bundle and save it in the temp export directory
	 * @param bundle
	 * @param fileName
	 * @returns {Promise<*>}
	 */
	mailToMsg(bundle: MailBundle, fileName: string): Promise<DataFile> {
		return this.native.invokeNative("mailToMsg", [bundle, fileName])
	}

	/**
	 * drag given file names from the temp directory
	 * @returns {Promise<*>}
	 * @param fileNames: relative paths to files from the export directory
	 */
	startNativeDrag(fileNames: Array<string>): Promise<void> {
		return this.native.invokeNative("startNativeDrag", [fileNames])
	}

	saveToExportDir(file: DataFile): Promise<void> {
		return this.native.invokeNative("saveToExportDir", [file])
	}

	checkFileExistsInExportDirectory(path: string): Promise<boolean> {
		return this.native.invokeNative("checkFileExistsInExportDirectory", [path])
	}

	getFilesMetaData(filesUris: ReadonlyArray<string>): Promise<Array<FileReference>> {
		return promiseMap(filesUris, async uri => {
			const [name, mimeType, size] = await Promise.all([this.getName(uri), this.getMimeType(uri), this.getSize(uri)])
			return {
				_type: "FileReference",
				name,
				mimeType,
				size,
				location: uri,
			}
		})
	}

	uriToFileRef(uri: string): Promise<FileReference> {
		return Promise.all([this.getName(uri), this.getMimeType(uri), this.getSize(uri)]).then(([name, mimeType, size]) => ({
			_type: "FileReference",
			name,
			mimeType,
			size,
			location: uri,
		}))
	}

	/**
	 * Joins the given files into one single file with a given name. The file is place in the app's temporary decrypted directory.
	 * @param filename the resulting filename
	 * @param files The files to join.
	 *
	 */
	joinFiles(filename: string, files: Array<FileUri>): Promise<FileUri> {
		return this.native.invokeNative('joinFiles', [filename, files])
	}

	/**
	 * Splits the given file into chunks of the given maximum size. The chunks will be placed in the temporary decrypted directory.
	 * @param fileUri
	 * @param maxChunkSizeBytes
	 */
	async splitFile(fileUri: FileUri, maxChunkSizeBytes: number): Promise<Array<FileUri>> {
		return this.native.invokeNative("splitFile", [fileUri, maxChunkSizeBytes])
	}
}