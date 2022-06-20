import {ExportFacade} from "../native/common/generatedipc/ExportFacade.js"
import {MailBundle} from "../mail/export/Bundler.js"
import {getExportDirectoryPath, makeMsgFile, writeFile} from "./DesktopFileExport.js"
import {DataFile} from "../api/common/DataFile.js"
import {fileExists} from "./PathUtils.js"
import path from "path"
import {DesktopDownloadManager} from "./DesktopDownloadManager.js"
import {MailExportMode} from "../mail/export/Exporter.js"
import {DesktopConfigKey} from "./config/ConfigKeys.js"
import {DesktopConfig} from "./config/DesktopConfig.js"
import {NativeImage} from "electron"
import {ApplicationWindow} from "./ApplicationWindow.js"


export class DesktopExportFacade implements ExportFacade {

	constructor(
		private readonly dl: DesktopDownloadManager,
		private readonly conf: DesktopConfig,
		private readonly window: ApplicationWindow,
		private readonly dragIcons: Record<MailExportMode, NativeImage>,
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
		const exportDir = await getExportDirectoryPath(this.dl)
		const files = fileNames.map(fileName => path.join(exportDir, fileName)).filter(fileExists)
		const exportMode: MailExportMode = await this.conf.getVar(DesktopConfigKey.mailExportMode)
		const icon = this.dragIcons[exportMode]
		this.window._browserWindow.webContents.startDrag({
			file: '',
			files,
			icon,
		})
	}

}