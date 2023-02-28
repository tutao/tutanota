import { FileFacade } from "../native/common/generatedipc/FileFacade.js"
import { DownloadTaskResponse } from "../native/common/generatedipc/DownloadTaskResponse.js"
import { IpcClientRect } from "../native/common/generatedipc/IpcClientRect.js"
import { DesktopDownloadManager } from "./net/DesktopDownloadManager.js"
import { ElectronExports } from "./ElectronExportTypes.js"
import { UploadTaskResponse } from "../native/common/generatedipc/UploadTaskResponse.js"
import { DataFile } from "../api/common/DataFile.js"
import { FileUri } from "../native/common/FileApp.js"
import path from "node:path"
import { ApplicationWindow } from "./ApplicationWindow.js"
import { mimes } from "./flat-mimes.js"

export class DesktopFileFacade implements FileFacade {
	constructor(private readonly win: ApplicationWindow, private readonly dl: DesktopDownloadManager, private readonly electron: ElectronExports) {}

	clearFileData(): Promise<void> {
		this.dl.deleteTutanotaTempDirectory()
		return Promise.resolve()
	}

	deleteFile(file: string): Promise<void> {
		return this.dl.deleteFile(file)
	}

	download(sourceUrl: string, filename: string, headers: Record<string, string>): Promise<DownloadTaskResponse> {
		return this.dl.downloadNative(sourceUrl, filename, headers)
	}

	async getMimeType(file: string): Promise<string> {
		const ext = path.extname(file).slice(1)
		const { mimes } = await import("./flat-mimes.js")
		const candidates = mimes[ext]
		// sometimes there are multiple options, but we'll take the first and reorder if issues arise.
		return candidates != null ? candidates[0] : "application/octet-stream"
	}

	async getName(file: string): Promise<string> {
		return path.basename(file)
	}

	getSize(file: string): Promise<number> {
		return this.dl.getSize(file)
	}

	hashFile(fileUri: string): Promise<string> {
		return this.dl.blobHashFile(fileUri)
	}

	joinFiles(filename: string, files: Array<string>): Promise<string> {
		return this.dl.joinFiles(filename, files)
	}

	open(location: string, mimeType: string): Promise<void> {
		return this.dl.open(location)
	}

	async openFileChooser(boundingRect: IpcClientRect, filter: ReadonlyArray<string> | null): Promise<Array<string>> {
		const opts: Record<string, unknown> = { properties: ["openFile", "multiSelections"] }
		if (filter != null) {
			opts.filters = [{ name: "Filter", extensions: filter }]
		}
		const { filePaths } = await this.electron.dialog.showOpenDialog(this.win._browserWindow, opts)
		return filePaths
	}

	openFolderChooser(): Promise<string | null> {
		// open folder dialog
		return this.electron.dialog
			.showOpenDialog(this.win._browserWindow, {
				properties: ["openDirectory"],
			})
			.then(({ filePaths }) => filePaths[0] ?? null)
	}

	putFileIntoDownloadsFolder(localFileUri: string): Promise<string> {
		return this.dl.putFileIntoDownloadsFolder(localFileUri)
	}

	splitFile(fileUri: string, maxChunkSizeBytes: number): Promise<Array<string>> {
		return this.dl.splitFile(fileUri, maxChunkSizeBytes)
	}

	upload(fileUrl: string, targetUrl: string, method: string, headers: Record<string, string>): Promise<UploadTaskResponse> {
		return this.dl.upload(fileUrl, targetUrl, method, headers)
	}

	writeDataFile(file: DataFile): Promise<string> {
		return this.dl.writeDataFile(file)
	}

	async readDataFile(fileUri: FileUri): Promise<DataFile | null> {
		const [dataFile, mimeType] = await Promise.all([this.dl.readDataFile(fileUri), this.getMimeType(fileUri)])
		if (dataFile == null) return null
		dataFile.mimeType = mimeType
		return dataFile
	}
}
