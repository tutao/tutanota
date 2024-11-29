import o from "@tutao/otest"
import { DesktopExportFacade } from "../../../../src/common/desktop/export/DesktopExportFacade.js"
import { matchers, object, verify, when } from "testdouble"
import { ElectronExports } from "../../../../src/common/desktop/ElectronExportTypes.js"
import { MailboxExportPersistence, MailboxExportState } from "../../../../src/common/desktop/export/MailboxExportPersistence.js"
import { CancelledError } from "../../../../src/common/api/common/error/CancelledError.js"
import { ProgrammingError } from "../../../../src/common/api/common/error/ProgrammingError.js"
import type * as FsModule from "node:fs"
import { MailBundle } from "../../../../src/common/mailFunctionality/SharedMailUtils.js"
import { generateExportFileName, mailToEmlFile } from "../../../../src/mail-app/mail/export/emlUtils.js"
import path from "node:path"
import { DateProvider } from "../../../../src/common/api/common/DateProvider.js"

function enoentError() {
	const err = new Error()
	Object.assign(err, { code: "ENOENT" })
	return err
}

o.spec("DesktopExportFacade", function () {
	const userId = "userId"
	let facade: DesktopExportFacade
	let dialog: Electron.Dialog
	let persistence: MailboxExportPersistence
	let fsPromises: (typeof FsModule)["promises"]
	let fs: typeof FsModule
	let dateProvider: DateProvider

	const mailboxId = "mailboxId"
	const mailBagId = "mailBagId"
	const mailId = "mailId"

	o.beforeEach(function () {
		dialog = object()
		const electron = {
			dialog,
		} as Partial<ElectronExports> as ElectronExports
		persistence = object()
		fsPromises = object()
		dateProvider = object()
		when(dateProvider.now()).thenReturn(new Date("2024-12-05T12:00").getTime())
		fs = { promises: fsPromises } as typeof FsModule
		facade = new DesktopExportFacade(object(), electron, object(), object(), object(), persistence, fs, dateProvider)
	})

	o.spec("startMailboxExport", function () {
		o.test("if export is already running it throws an error", async function () {
			when(persistence.getStateForUser(userId)).thenResolve({
				type: "running",
				userId,
				mailboxId: "",
				exportDirectoryPath: "",
				exportedMails: 0,
				mailId: "",
				mailBagId: "",
			})
			await o(() => facade.startMailboxExport(userId, "", "", "")).asyncThrows(Error)
		})

		o.test("if no directory is selected it throws an error", async function () {
			when(persistence.getStateForUser(userId)).thenResolve(null)
			when(dialog.showOpenDialog(matchers.anything(), { properties: ["openDirectory"] })).thenResolve({ filePaths: [] })
			await o(() => facade.startMailboxExport(userId, "", "", "")).asyncThrows(CancelledError)
		})

		o.test("when directory already exists it picks a unique path", async function () {
			when(persistence.getStateForUser(userId)).thenResolve(null)
			const selectedDirectory = "path"
			const finalExportDirectoryPath = "path/TutaExport-2024-12-05-1"
			when(dialog.showOpenDialog(matchers.anything(), { properties: ["openDirectory"] })).thenResolve({ filePaths: [selectedDirectory] })
			when(fsPromises.stat(finalExportDirectoryPath)).thenReject(enoentError())

			await facade.startMailboxExport(userId, mailboxId, mailBagId, mailId)

			verify(fsPromises.mkdir(finalExportDirectoryPath))
			verify(
				persistence.setStateForUser({
					type: "running",
					userId,
					mailboxId,
					exportDirectoryPath: finalExportDirectoryPath,
					mailBagId,
					mailId,
					exportedMails: 0,
				}),
			)
		})

		o.test("new state is set", async function () {
			when(persistence.getStateForUser(userId)).thenResolve(null)
			const selectedDirectory = "path"
			const exportDirectoryPath = "path/TutaExport-2024-12-05"
			when(dialog.showOpenDialog(matchers.anything(), { properties: ["openDirectory"] })).thenResolve({ filePaths: [selectedDirectory] })
			when(fsPromises.stat(exportDirectoryPath)).thenReject(enoentError())
			await facade.startMailboxExport(userId, mailboxId, mailBagId, mailId)
			verify(fsPromises.mkdir(exportDirectoryPath))
			verify(
				persistence.setStateForUser({
					type: "running",
					userId,
					mailboxId,
					exportDirectoryPath,
					mailBagId,
					mailId,
					exportedMails: 0,
				}),
			)
		})
	})

	o.spec("endMailboxExport", function () {
		o.test("when there's no previous state it throws an error", async function () {
			when(persistence.getStateForUser(userId)).thenResolve(null)
			await o(() => facade.endMailboxExport(userId)).asyncThrows(ProgrammingError)
		})

		o.test("saves the state", async function () {
			const exportDirectoryPath = "exportPath"
			const previousState: MailboxExportState = {
				type: "running",
				userId,
				mailboxId,
				mailId,
				mailBagId,
				exportDirectoryPath,
				exportedMails: 42,
			}
			when(persistence.getStateForUser(userId)).thenResolve(previousState)
			await facade.endMailboxExport(userId)
			verify(
				persistence.setStateForUser({
					type: "finished",
					userId,
					exportDirectoryPath,
					mailboxId,
				}),
			)
		})
	})

	o.spec("saveMailboxExport", function () {
		const sentOn = new Date("2024-12-05T11:58Z")
		const receivedOn = new Date("2024-12-05T11:59Z")
		const mailBundleStub: MailBundle = {
			mailId: ["mailListId", mailId],
			bcc: [],
			body: "and I am a body!!",
			attachments: [],
			headers: null,
			isDraft: false,
			isRead: true,
			replyTo: [],
			sender: { address: "sender@example.com" },
			sentOn: sentOn.getTime(),
			cc: [],
			receivedOn: receivedOn.getTime(),
			subject: "I am a subject!!",
			to: [],
		}
		o.test("when there's no previous state it throws an error", async function () {
			when(persistence.getStateForUser(userId)).thenResolve(null)

			await o(() => facade.saveMailboxExport(mailBundleStub, userId, mailBagId, mailId)).asyncThrows(ProgrammingError)
		})

		o.test("when there's mail bundle without attachments it writes the file", async function () {
			const runningState: MailboxExportState = {
				type: "running",
				userId,
				mailboxId,
				mailId,
				mailBagId,
				exportDirectoryPath: "test/innerFolder/TutaExport-2024-12-05",
				exportedMails: 42,
			}
			when(persistence.getStateForUser(userId)).thenResolve(runningState)
			await facade.saveMailboxExport(mailBundleStub, userId, mailBagId, mailId)
			const fileName = generateExportFileName(mailBundleStub.subject, sentOn, "eml")
			const fullPath = path.join(runningState.exportDirectoryPath, fileName)
			const bundleData = mailToEmlFile(mailBundleStub, fileName)

			verify(fsPromises.writeFile(fullPath, bundleData.data))
			verify(
				persistence.setStateForUser({
					type: "running",
					userId,
					mailboxId,
					mailId,
					mailBagId,
					exportDirectoryPath: "test/innerFolder/TutaExport-2024-12-05",
					exportedMails: 43,
				}),
			)
		})
	})

	o.spec("clearExportState", function () {
		o.test("calls the correct function", async function () {
			await facade.clearExportState(userId)
			verify(persistence.clearStateForUser(userId))
		})
	})
})
