//@flow
import {nativeApp} from "./NativeWrapper"
import {Request} from "../api/common/WorkerProtocol"
import {uint8ArrayToBase64} from "../api/common/utils/Encoding"


export const fileApp = {
	openFileChooser,
	openFolderChooser,
	download,
	upload,
	open,
	deleteFile,
	clearFileData,
	readFile,
	saveBlob
}


/**
 * Open the file
 * @param file The uri of the file
 * @param mimeType The mimeType of the file
 */
function open(file: FileReference): Promise<void> {
	return nativeApp.invokeNative(new Request("open", [file.location, file.mimeType]))
}

/**
 * Opens a file chooser to select a file.
 * @param button The file chooser is opened next to the rectangle
 */
function openFileChooser(boundingRect: ClientRect): Promise<Array<FileReference>> {
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

	return nativeApp.invokeNative(new Request("openFileChooser", [srcRect, false])).map(uriToFileRef)
}

function openFolderChooser(): Promise<Array<string>> {
	return nativeApp.invokeNative(new Request("openFileChooser", [null, true]))
}

/**
 * Deletes the file.
 * @param  file The uri of the file to delete.
 */
function deleteFile(file: string): Promise<void> {
	return nativeApp.invokeNative(new Request("deleteFile", [file]))
}

/**
 * Returns the name of the file
 * @param file The uri of the file
 */
export function getName(file: string): Promise<string> {
	return nativeApp.invokeNative(new Request("getName", [file]))
}

/**
 * Returns the mime type of the file
 * @param file The uri of the file
 */
export function getMimeType(file: string): Promise<string> {
	return nativeApp.invokeNative(new Request("getMimeType", [file]))
}

/**
 * Returns the byte size of a file
 * @param file The uri of the file
 */
export function getSize(file: string): Promise<number> {
	return nativeApp.invokeNative(new Request("getSize", [file])).then(sizeString => Number(sizeString))
}

/**
 * Copies the file into downloads folder and notifies system and user about that
 * @param localFileUri URI for the source file
 * @returns {*} absolute path of the destination file
 */
export function putFileIntoDownloadsFolder(localFileUri: string): Promise<string> {
	return nativeApp.invokeNative(new Request("putFileIntoDownloads", [localFileUri]))
}

function saveBlob(data: DataFile): Promise<void> {
	return nativeApp.invokeNative(new Request("saveBlob", [data.name, uint8ArrayToBase64(data.data)]))
}

/**
 * Uploads the binary data of a file to tutadb
 */
function upload(fileUrl: string, targetUrl: string,
                headers: Object): Promise<{statusCode: number, errorId: ?string, precondition: ?string, uri: ?string, suspensionTime: ?string}> {
	return nativeApp.invokeNative(new Request("upload", [fileUrl, targetUrl, headers]))
}

/**
 * Downloads the binary data of a file from tutadb and stores it in the internal memory.
 * @returns Resolves to the URI of the downloaded file
 */
function download(sourceUrl: string, filename: string, headers: Object): Promise<{statusCode: number, encryptedFileUri: ?string, errorId: ?string, precondition: ?string, suspensionTime: ?string}> {
	return nativeApp.invokeNative(new Request("download", [sourceUrl, filename, headers]))
}

function clearFileData(): Promise<any> {
	return nativeApp.invokeNative(new Request("clearFileData", []))
}

function readFile(path: string): Promise<Base64> {
	return nativeApp.invokeNative(new Request("readFile", [path]))
}

export function uriToFileRef(uri: string): Promise<FileReference> {
	return Promise.join(getName(uri), getMimeType(uri), getSize(uri), (name, mimeType, size) => ({
		_type: "FileReference",
		name,
		mimeType,
		size,
		location: uri
	}))
}

