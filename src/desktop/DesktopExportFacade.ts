import {ExportFacade} from "../native/common/generatedipc/ExportFacade.js"
import {MailBundle} from "../mail/export/Bundler.js"
import {createDataFile, DataFile} from "../api/common/DataFile.js"
import {fileExists} from "./PathUtils.js"
import path from "path"
import {DesktopDownloadManager} from "./net/DesktopDownloadManager.js"
import {MailExportMode} from "../mail/export/Exporter.js"
import {DesktopConfigKey} from "./config/ConfigKeys.js"
import {DesktopConfig} from "./config/DesktopConfig.js"
import {NativeImage} from "electron"
import {ApplicationWindow} from "./ApplicationWindow.js"
import {Attachment, Email, MessageEditorFormat} from "@tutao/oxmsg"
import {sanitizeFilename} from "../api/common/utils/FileUtils.js"
import {promises as fs} from "fs"
import {DesktopUtils} from "./DesktopUtils.js"


const EXPORT_DIR = "export"

export class DesktopExportFacade implements ExportFacade {

	constructor(
		private readonly desktopUtils: DesktopUtils,
		private readonly conf: DesktopConfig,
		private readonly window: ApplicationWindow,
		private readonly dragIcons: Record<MailExportMode, NativeImage>,
	) {

	}

	async checkFileExistsInExportDir(fileName: string): Promise<boolean> {
		return fileExists(path.join(await this.getExportDirectoryPath(), fileName))
	}

	async mailToMsg(bundle: MailBundle, fileName: string): Promise<DataFile> {
		const subject = `[Tutanota] ${bundle.subject}`
		const email = new Email(bundle.isDraft, bundle.isRead)
			.subject(subject)
			.bodyHtml(bundle.body)
			.bodyFormat(MessageEditorFormat.EDITOR_FORMAT_HTML)
			.sender(bundle.sender.address, bundle.sender.name)
			.tos(bundle.to)
			.ccs(bundle.cc)
			.bccs(bundle.bcc)
			.replyTos(bundle.replyTo)
			.sentOn(new Date(bundle.sentOn))
			.receivedOn(new Date(bundle.receivedOn))
			.headers(bundle.headers || "")

		for (let attachment of bundle.attachments) {
			// When the MailBundle gets passed over via the IPC it loses some of it's type information. the Uint8Arrays stored in the
			// attachment DataFiles cease to be Uint8Arrays and just because regular arrays, thus we have to remake them here.
			// Oxmsg currently doesn't accept regular arrays for binary data, only Uint8Arrays, strings and booleans
			// we could change the Oxmsg behaviour, it's kind of nice for it to be strict though.
			email.attach(new Attachment(new Uint8Array(attachment.data), attachment.name, attachment.cid || ""))
		}

		return createDataFile(fileName, "application/vnd.ms-outlook", email.msg())
	}

	async saveToExportDir(file: DataFile): Promise<void> {
		const exportDir = await this.getExportDirectoryPath()
		const fullPath = path.join(exportDir, sanitizeFilename(file.name))
		return fs.writeFile(fullPath, file.data)
	}

	async startNativeDrag(fileNames: ReadonlyArray<string>): Promise<void> {
		const exportDir = await this.getExportDirectoryPath()
		const files = fileNames.map(fileName => path.join(exportDir, fileName)).filter(fileExists)
		const exportMode: MailExportMode = await this.conf.getVar(DesktopConfigKey.mailExportMode)
		const icon = this.dragIcons[exportMode]
		this.window._browserWindow.webContents.startDrag({
			file: '',
			files,
			icon,
		})
	}

	private async getExportDirectoryPath(): Promise<string> {
		const directory = path.join(this.desktopUtils.getTutanotaTempPath(), EXPORT_DIR)
		await fs.mkdir(directory, {recursive: true})
		return directory
	}
}