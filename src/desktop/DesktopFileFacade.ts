import {FileFacade} from "../native/common/generatedipc/FileFacade.js"
import {DownloadTaskResponse} from "../native/common/generatedipc/DownloadTaskResponse.js"
import {IpcClientRect} from "../native/common/generatedipc/IpcClientRect.js"
import {DesktopDownloadManager} from "./DesktopDownloadManager.js"
import {ElectronExports, FsExports} from "./ElectronExportTypes.js"
import {UploadTaskResponse} from "../native/common/generatedipc/UploadTaskResponse.js"
import {DataFile} from "../api/common/DataFile.js"
import {FileUri} from "../native/common/FileApp.js"

function Unimplemented() {
	return new Error("not implemented for this platform")
}

export class DesktopFileFacade implements FileFacade {

	constructor(
		private readonly dl: DesktopDownloadManager,
		private readonly electron: ElectronExports,
	) {
	}

	clearFileData(): Promise<void> {
		this.dl.deleteTutanotaTempDirectory()
		return Promise.resolve()
	}

	deleteFile(file: string): Promise<void> {
		return this.dl.deleteFile(file)
	}

	download(sourceUrl: string, filename: string, headers: Record<string, string>,): Promise<DownloadTaskResponse> {
		return this.dl.downloadNative(sourceUrl, filename, headers)
	}

	getMimeType(file: string): Promise<string> {
		throw Unimplemented()
	}

	getName(file: string): Promise<string> {
		throw Unimplemented()
	}

	getSize(file: string): Promise<number> {
		return this.dl.getSize(file)
	}

	hashFile(fileUri: string): Promise<string> {
		return this.dl.hashFile(fileUri)
	}

	joinFiles(filename: string, files: Array<string>): Promise<string> {
		return this.dl.joinFiles(filename, files)
	}

	open(location: string, mimeType: string): Promise<void> {
		return this.dl.open(location)
	}

	openFileChooser(boundingRect: IpcClientRect): Promise<Array<string>> {
		throw Unimplemented()
	}

	openFolderChooser(): Promise<string | null> {
		// open folder dialog
		return this.electron.dialog
				   .showOpenDialog({
					   properties: ["openDirectory"],
				   })
				   .then(({filePaths}) => filePaths[0] ?? null)
	}

	putFileIntoDownloadsFolder(localFileUri: string): Promise<string> {
		return this.dl.putFileIntoDownloadsFolder(localFileUri)
	}

	splitFile(fileUri: string, maxChunkSizeBytes: number): Promise<Array<string>> {
		throw Unimplemented()
	}

	upload(fileUrl: string, targetUrl: string, method: string, headers: Record<string, string>): Promise<UploadTaskResponse> {
		throw Unimplemented()
	}

	writeDataFile(file: DataFile): Promise<string> {
		return this.dl.writeDataFile(file)
	}

	readDataFile(fileUri: FileUri): Promise<DataFile | null> {
		return this.dl.readDataFile(fileUri)
	}
}