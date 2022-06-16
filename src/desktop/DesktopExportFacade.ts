import {ExportFacade} from "../native/common/generatedipc/ExportFacade.js"
import {MailBundle} from "../mail/export/Bundler.js"
import {getExportDirectoryPath, makeMsgFile, writeFile} from "./DesktopFileExport.js"
import {DataFile} from "../api/common/DataFile.js"
import {fileExists} from "./PathUtils.js"
import path from "path"
import {DesktopDownloadManager} from "./DesktopDownloadManager.js"
import {WindowManager} from "./DesktopWindowManager.js"


export class DesktopExportFacade implements ExportFacade {

	constructor(
		private readonly dl: DesktopDownloadManager,
		private readonly wm: WindowManager,
		private readonly windowId: number,
	) {

	}

	async checkFileExistsInExportDir(fileName: string): Promise<boolean> {
		return fileExists(path.join(await getExportDirectoryPath(this.dl), fileName))
	}

	async mailToMsg(bundle: MailBundle, fileName: string): Promise<DataFile> {
		return makeMsgFile(bundle, fileName)
	}

	async saveToExportDir(file: DataFile): Promise<void> {
		const exportDir = await getExportDirectoryPath(this.dl)
		return writeFile(exportDir, file)
	}

	async startNativeDrag(fileNames: ReadonlyArray<string>): Promise<void> {
		await this.wm.startNativeDrag(fileNames, this.windowId)
		return Promise.resolve()
	}

}