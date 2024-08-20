import { ExportFacade } from "../native/common/generatedipc/ExportFacade.js"
import { createDataFile, DataFile } from "../api/common/DataFile.js"
import { fileExists } from "./PathUtils.js"
import path from "node:path"
import { DesktopConfigKey } from "./config/ConfigKeys.js"
import { DesktopConfig } from "./config/DesktopConfig.js"
import { NativeImage } from "electron"
import { ApplicationWindow } from "./ApplicationWindow.js"
import { Attachment, Email, MessageEditorFormat } from "@tutao/oxmsg"
import { sanitizeFilename } from "../api/common/utils/FileUtils.js"
import { promises as fs } from "node:fs"
import { TempFs } from "./files/TempFs.js"
import { MailBundle, MailExportMode } from "../mailFunctionality/SharedMailUtils.js"

const EXPORT_DIR = "export"

export class DesktopExportFacade implements ExportFacade {
	constructor(
		private readonly tfs: TempFs,
		private readonly conf: DesktopConfig,
		private readonly window: ApplicationWindow,
		private readonly dragIcons: Record<MailExportMode, NativeImage>,
	) {}

	async checkFileExistsInExportDir(fileName: string): Promise<boolean> {
		return fileExists(path.join(await this.getExportDirectoryPath(), fileName))
	}

	async mailToMsg(bundle: MailBundle, fileName: string): Promise<DataFile> {
		const subject = `[Tuta Mail] ${bundle.subject}`
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
		const files = fileNames.map((fileName) => path.join(exportDir, fileName)).filter(fileExists)
		const exportMode: MailExportMode = await this.conf.getVar(DesktopConfigKey.mailExportMode)
		const icon = this.dragIcons[exportMode]
		this.window._browserWindow.webContents.startDrag({
			file: "",
			files,
			icon,
		})
	}

	private async getExportDirectoryPath(): Promise<string> {
		const directory = path.join(this.tfs.getTutanotaTempPath(), EXPORT_DIR)
		await fs.mkdir(directory, { recursive: true })
		return directory
	}
}
