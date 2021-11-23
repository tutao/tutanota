//@flow
import {Request} from "../../api/common/Queue"
import {uint8ArrayToBase64} from "@tutao/tutanota-utils"
import type {MailBundle} from "../../mail/export/Bundler";
import {promiseMap} from "@tutao/tutanota-utils"
import type {NativeInterface} from "./NativeInterface"

export type DataTaskResponse = {
	statusCode: number,
	errorId: ?string,
	precondition: ?string,
	suspensionTime: ?string,
}

export type DownloadTaskResponse = DataTaskResponse & {
	encryptedFileUri: ?string,
}


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
		return this.native.invokeNative(new Request("open", [file.location, file.mimeType]))
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
			"x": boundingRect.left,
			"y": boundingRect.top,
			"width": boundingRect.width,
			"height": boundingRect.height
		}

		return this.native.invokeNative(new Request("openFileChooser", [srcRect, false]))
		                .then((response: Array<string>) => promiseMap(response, this.uriToFileRef.bind(this)))
	}

	openFolderChooser(): Promise<Array<string>> {
		return this.native.invokeNative(new Request("openFileChooser", [null, true]))
	}



	/**
	 * Deletes the file.
	 * @param  file The uri of the file to delete.
	 */
	deleteFile(file: string): Promise<void> {
		return this.native.invokeNative(new Request("deleteFile", [file]))
	}

	/**
	 * Returns the name of the file
	 * @param file The uri of the file
	 */
	getName(file: string): Promise<string> {
		return this.native.invokeNative(new Request("getName", [file]))
	}

	/**
	 * Returns the mime type of the file
	 * @param file The uri of the file
	 */
	getMimeType(file: string): Promise<string> {
		return this.native.invokeNative(new Request("getMimeType", [file]))
	}

	/**
	 * Returns the byte size of a file
	 * @param file The uri of the file
	 */
	getSize(file: string): Promise<number> {
		return this.native.invokeNative(new Request("getSize", [file])).then(sizeString => Number(sizeString))
	}

	/**
	 * Copies the file into downloads folder and notifies system and user about that
	 * @param localFileUri URI for the source file
	 * @returns {*} absolute path of the destination file
	 */
	putFileIntoDownloadsFolder(localFileUri: string): Promise<string> {
		return this.native.invokeNative(new Request("putFileIntoDownloads", [localFileUri]))
	}

	saveBlob(data: DataFile): Promise<void> {
		return this.native.invokeNative(new Request("saveBlob", [data.name, uint8ArrayToBase64(data.data)]))
	}

	/**
	 * Uploads the binary data of a file to tutadb
	 */
	upload(fileUrl: string, targetUrl: string, headers: Object): Promise<DataTaskResponse> {
		return this.native.invokeNative(new Request("upload", [fileUrl, targetUrl, headers]))
	}

	/**
	 * Downloads the binary data of a file from tutadb and stores it in the internal memory.
	 * @returns Resolves to the URI of the downloaded file
	 */
	download(sourceUrl: string, filename: string, headers: Object): Promise<DownloadTaskResponse> {
		return this.native.invokeNative(new Request("download", [sourceUrl, filename, headers]))
	}

	clearFileData(): Promise<any> {
		return this.native.invokeNative(new Request("clearFileData", []))
	}

	readDataFile(uriOrPath: string): Promise<?DataFile> {
		return this.native.invokeNative(new Request("readDataFile", [uriOrPath]))
	}


	/**
	 * Generate an MSG file from the mail bundle and save it in the temp export directory
	 * @param bundle
	 * @param fileName
	 * @returns {Promise<*>}
	 */
	mailToMsg(bundle: MailBundle, fileName: string): Promise<DataFile> {
		return this.native.invokeNative(new Request("mailToMsg", [bundle, fileName]))
	}

	/**
	 * drag given file names from the temp directory
	 * @returns {Promise<*>}
	 * @param fileNames: relative paths to files from the export directory
	 */
	startNativeDrag(fileNames: Array<string>): Promise<void> {
		return this.native.invokeNative(new Request("startNativeDrag", [fileNames]))
	}

	saveToExportDir(file: DataFile): Promise<void> {
		return this.native.invokeNative(new Request("saveToExportDir", [file]))
	}

	checkFileExistsInExportDirectory(path: string): Promise<boolean> {
		return this.native.invokeNative(new Request("checkFileExistsInExportDirectory", [path]))
	}

	getFilesMetaData(filesUris: string[]): Promise<Array<FileReference>> {
		return promiseMap(filesUris, async uri => {
			const [name, mimeType, size] = await Promise.all([this.getName(uri), this.getMimeType(uri), this.getSize(uri)])
			return {
				_type: "FileReference",
				name,
				mimeType,
				size,
				location: uri
			}
		})
	}


	uriToFileRef(uri: string): Promise<FileReference> {
		return Promise.all([this.getName(uri), this.getMimeType(uri), this.getSize(uri)]).then(([name, mimeType, size]) => ({
			_type: "FileReference",
			name,
			mimeType,
			size,
			location: uri
		}))
	}
}

