import { promiseMap } from "@tutao/tutanota-utils"
import { FileReference } from "../../api/common/utils/FileUtils"
import { DataFile } from "../../api/common/DataFile"
import { HttpMethod } from "../../api/common/EntityFunctions"
import { FileFacade } from "./generatedipc/FileFacade.js"
import { ExportFacade } from "./generatedipc/ExportFacade.js"
import { DownloadTaskResponse } from "./generatedipc/DownloadTaskResponse"
import { UploadTaskResponse } from "./generatedipc/UploadTaskResponse"
import { MailBundle } from "../../mailFunctionality/SharedMailUtils.js"

export type FileUri = string

export class NativeFileApp {
	constructor(private readonly fileFacade: FileFacade, private readonly exportFacade: ExportFacade) {}

	/**
	 * Open the file
	 * @param file The uri of the file
	 */
	open(file: FileReference): Promise<void> {
		return this.fileFacade.open(file.location, file.mimeType)
	}

	/**
	 * Opens a file chooser to select a file.
	 * @param boundingRect The file chooser is opened next to the rectangle.
	 * @param filter an optional list of allowed file extensions
	 */
	async openFileChooser(boundingRect: DOMRect, filter?: ReadonlyArray<string>): Promise<Array<FileReference>> {
		/* The file chooser opens next to a location specified by srcRect on larger devices (iPad).
		 * The rectangle must be specifed using values for x, y, height and width.
		 */
		const srcRect = {
			x: Math.round(boundingRect.left),
			y: Math.round(boundingRect.top),
			width: Math.round(boundingRect.width),
			height: Math.round(boundingRect.height),
		}
		const files = await this.fileFacade.openFileChooser(srcRect, filter ?? null)
		return promiseMap(files, this.uriToFileRef.bind(this))
	}

	openFolderChooser(): Promise<string | null> {
		return this.fileFacade.openFolderChooser()
	}

	/**
	 * Deletes the file.
	 * @param  file The uri of the file to delete.
	 */
	deleteFile(file: FileUri): Promise<void> {
		return this.fileFacade.deleteFile(file)
	}

	/**
	 * Returns the name of the file
	 * @param file The uri of the file
	 */
	getName(file: FileUri): Promise<string> {
		return this.fileFacade.getName(file)
	}

	/**
	 * Returns the mime type of the file
	 * @param file The uri of the file
	 */
	getMimeType(file: FileUri): Promise<string> {
		return this.fileFacade.getMimeType(file)
	}

	/**
	 * Returns the byte size of a file
	 * @param file The uri of the file
	 */
	getSize(file: FileUri): Promise<number> {
		return this.fileFacade.getSize(file)
	}

	/**
	 * Copies the file into downloads folder and notifies system and user about that
	 * @param localFileUri URI for the source file
	 * @returns {*} absolute path of the destination file
	 */
	putFileIntoDownloadsFolder(localFileUri: FileUri, fileNameToUse: string): Promise<string> {
		return this.fileFacade.putFileIntoDownloadsFolder(localFileUri, fileNameToUse)
	}

	async writeDataFile(data: DataFile): Promise<FileReference> {
		const fileUri = await this.fileFacade.writeDataFile(data)
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
		return this.fileFacade.upload(fileUrl, targetUrl, method, headers)
	}

	/**
	 * Downloads the binary data of a file from tutadb and stores it in the internal memory.
	 * @returns Resolves to the URI of the downloaded file
	 */
	download(sourceUrl: FileUri, filename: string, headers: Dict): Promise<DownloadTaskResponse> {
		return this.fileFacade.download(sourceUrl, filename, headers)
	}

	/**
	 * Get the shortened (first six bytes) of the SHA256 of the file.
	 * @param fileUri
	 * @return Base64 encoded, shortened SHA256 hash of the file
	 */
	hashFile(fileUri: FileUri): Promise<string> {
		return this.fileFacade.hashFile(fileUri)
	}

	clearFileData(): Promise<any> {
		return this.fileFacade.clearFileData()
	}

	/**
	 * take a file location in the form of
	 *   - a uri like file:///home/user/cat.jpg
	 *   - an absolute file path like C:\Users\cat.jpg
	 * and return a DataFile populated
	 * with data and metadata of that file on disk.
	 *
	 * returns null
	 *   - if invoked in apps, because they use FileRef, not DataFile
	 *   - if file can't be opened for any reason
	 *   - if path is not absolute
	 */
	async readDataFile(uriOrPath: string): Promise<DataFile | null> {
		return this.fileFacade.readDataFile(uriOrPath)
	}

	/**
	 * Generate an MSG file from the mail bundle and save it in the temp export directory
	 * @param bundle
	 * @param fileName
	 * @returns {Promise<*>}
	 */
	mailToMsg(bundle: MailBundle, fileName: string): Promise<DataFile> {
		return this.exportFacade.mailToMsg(bundle, fileName)
	}

	/**
	 * drag given file names from the temp directory
	 * @returns {Promise<*>}
	 * @param fileNames: relative paths to files from the export directory
	 */
	startNativeDrag(fileNames: Array<string>): Promise<void> {
		return this.exportFacade.startNativeDrag(fileNames)
	}

	saveToExportDir(file: DataFile): Promise<void> {
		return this.exportFacade.saveToExportDir(file)
	}

	checkFileExistsInExportDir(path: string): Promise<boolean> {
		return this.exportFacade.checkFileExistsInExportDir(path)
	}

	getFilesMetaData(filesUris: ReadonlyArray<string>): Promise<Array<FileReference>> {
		return promiseMap(filesUris, async (uri) => {
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
		return this.fileFacade.joinFiles(filename, files)
	}

	/**
	 * Splits the given file into chunks of the given maximum size. The chunks will be placed in the temporary decrypted directory.
	 * @param fileUri
	 * @param maxChunkSizeBytes
	 */
	async splitFile(fileUri: FileUri, maxChunkSizeBytes: number): Promise<ReadonlyArray<FileUri>> {
		return this.fileFacade.splitFile(fileUri, maxChunkSizeBytes)
	}
}
