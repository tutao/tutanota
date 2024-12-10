import { ExportFacade } from "../../native/common/generatedipc/ExportFacade.js"
import { createDataFile, DataFile } from "../../api/common/DataFile.js"
import { fileExists } from "../PathUtils.js"
import path from "node:path"
import { DesktopConfigKey } from "../config/ConfigKeys.js"
import { DesktopConfig } from "../config/DesktopConfig.js"
import { NativeImage } from "electron"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { Attachment, Email, MessageEditorFormat } from "@tutao/oxmsg"
import { sanitizeFilename } from "../../api/common/utils/FileUtils.js"
import type * as FsModule from "node:fs"
import { promises as fs } from "node:fs"
import { TempFs } from "../files/TempFs.js"
import { MailBundle, MailExportMode } from "../../mailFunctionality/SharedMailUtils.js"
import { ElectronExports } from "../ElectronExportTypes.js"
import { CancelledError } from "../../api/common/error/CancelledError.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
import { generateExportFileName, mailToEmlFile } from "../../../mail-app/mail/export/emlUtils.js"
import { MailboxExportPersistence, MailboxExportState } from "./MailboxExportPersistence.js"
import { DateProvider } from "../../api/common/DateProvider.js"
import { formatSortableDate } from "@tutao/tutanota-utils"
import { FileOpenError } from "../../api/common/error/FileOpenError.js"
import { ExportError, ExportErrorReason } from "../../api/common/error/ExportError"
import { DesktopExportLock, LockResult } from "./DesktopExportLock"

const EXPORT_DIR = "export"

export class DesktopExportFacade implements ExportFacade {
	constructor(
		private readonly tfs: TempFs,
		private readonly electron: ElectronExports,
		private readonly conf: DesktopConfig,
		private readonly window: ApplicationWindow,
		private readonly dragIcons: Record<MailExportMode, NativeImage>,
		private readonly mailboxExportPersistence: MailboxExportPersistence,
		private readonly fs: typeof FsModule,
		private readonly dateProvider: DateProvider,
		private readonly desktopExportLock: DesktopExportLock,
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

	async startMailboxExport(userId: string, mailboxId: string, mailBagId: string, mailId: string): Promise<void> {
		if (this.desktopExportLock.acquireLock(userId) === LockResult.AlreadyLocked) {
			throw new ExportError(`Export is locked for user: ${userId}`, ExportErrorReason.LockedForUser)
		}
		const previousExportState = await this.mailboxExportPersistence.getStateForUser(userId)
		if (previousExportState != null && previousExportState.type !== "finished") {
			throw new ExportError(`Export is already running for user: ${userId}`, ExportErrorReason.RunningForUser)
		}
		const directory = await this.electron.dialog
			.showOpenDialog(this.window._browserWindow, {
				properties: ["openDirectory"],
			})
			.then(({ filePaths }) => filePaths[0] ?? null)
		if (directory == null) {
			this.desktopExportLock.unlock(userId)
			throw new CancelledError("Directory picking canceled")
		}
		const folderName = `TutaExport-${formatSortableDate(new Date(this.dateProvider.now()))}`
		const fullPath = await this.pickUniqueFileName(path.join(directory, folderName))
		await this.fs.promises.mkdir(fullPath)
		await this.mailboxExportPersistence.setStateForUser({
			type: "running",
			userId,
			mailboxId,
			exportDirectoryPath: fullPath,
			mailBagId,
			mailId,
			exportedMails: 0,
		})
	}

	private async pickUniqueFileName(path: string): Promise<string> {
		let counter = 0
		let currentCandidate = path
		while (await this.fileExists(currentCandidate)) {
			counter += 1
			currentCandidate = path + `-${counter}`
		}
		return currentCandidate
	}

	private async fileExists(path: string): Promise<boolean> {
		try {
			await this.fs.promises.stat(path)
		} catch (e) {
			if (e.code === "ENOENT") {
				return false
			} else {
				throw e
			}
		}
		return true
	}

	async getMailboxExportState(userId: string): Promise<MailboxExportState | null> {
		const state = await this.mailboxExportPersistence.getStateForUser(userId)
		if (state && state.type === "running") {
			if (this.desktopExportLock.acquireLock(userId) === LockResult.AlreadyLocked) {
				return {
					type: "locked",
					userId,
				}
			}
		}
		return state
	}

	async endMailboxExport(userId: string): Promise<void> {
		const previousExportState = await this.mailboxExportPersistence.getStateForUser(userId)
		if (previousExportState && previousExportState.type === "running") {
			await this.mailboxExportPersistence.setStateForUser({
				type: "finished",
				userId,
				exportDirectoryPath: previousExportState.exportDirectoryPath,
				mailboxId: previousExportState.mailboxId,
			})
		} else {
			throw new ProgrammingError("An Export was not previously running")
		}
	}

	async saveMailboxExport(bundle: MailBundle, userId: string, mailBagId: string, mailId: string): Promise<void> {
		const exportState = await this.mailboxExportPersistence.getStateForUser(userId)
		if (exportState == null || exportState.type !== "running") {
			throw new ProgrammingError("Export is not running")
		}
		const filename = generateExportFileName(bundle.subject, new Date(bundle.sentOn), "eml")
		const fullPath = path.join(exportState.exportDirectoryPath, filename)
		const file = mailToEmlFile(bundle, filename)
		try {
			await this.fs.promises.writeFile(fullPath, file.data)
		} catch (e) {
			if (e.code === "ENOENT" || e.code === "EPERM") {
				throw new FileOpenError(`Could not write ${fullPath}`)
			} else {
				throw e
			}
		}
		await this.mailboxExportPersistence.setStateForUser({
			type: "running",
			userId,
			mailBagId,
			mailId,
			exportDirectoryPath: exportState.exportDirectoryPath,
			mailboxId: exportState.mailboxId,
			exportedMails: exportState.exportedMails + 1,
		})
	}

	async clearExportState(userId: string): Promise<void> {
		await this.mailboxExportPersistence.clearStateForUser(userId)
		this.desktopExportLock.unlock(userId)
	}

	async openExportDirectory(userId: string): Promise<void> {
		const exportState = await this.mailboxExportPersistence.getStateForUser(userId)
		if (exportState == null || exportState.type !== "finished") {
			throw new ProgrammingError("Export is not finished")
		}
		await this.electron.shell.openPath(exportState.exportDirectoryPath)
	}

	private async getExportDirectoryPath(): Promise<string> {
		const directory = path.join(this.tfs.getTutanotaTempPath(), EXPORT_DIR)
		await fs.mkdir(directory, { recursive: true })
		return directory
	}
}
