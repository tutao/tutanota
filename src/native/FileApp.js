//@flow
import {nativeApp} from "./NativeWrapper"
import {Request} from "../api/common/WorkerProtocol"


export const fileApp = {
	openFileChooser,
	download,
	upload,
	open,
	deleteFile,
	clearFileData
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

	return nativeApp.invokeNative(new Request("openFileChooser", [srcRect])).map((uri) => {
		return Promise.join(getName(uri), getMimeType(uri), getSize(uri), (name, mimeType, size) => {
			let fileReference = {
				_type: "FileReference",
				name,
				mimeType,
				size,
				location: uri
			}
			return fileReference
		})
	})
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
 * Uploads the binary data of a file to tutadb
 */
function upload(fileUrl: string, targetUrl: string, headers: Object): Promise<number> {
	return nativeApp.invokeNative(new Request("upload", [fileUrl, targetUrl, headers]))
}

/**
 * Downloads the binary data of a file from tutadb and stores it in the internal memory.
 * @returns Resolves to the URI of the downloaded file
 */
function download(sourceUrl: string, filename: string, headers: Object): Promise<string> {
	return nativeApp.invokeNative(new Request("download", [sourceUrl, filename, headers]))
}


function clearFileData() {
	return nativeApp.invokeNative(new Request("clearFileData", []))
}



