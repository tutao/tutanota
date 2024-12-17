import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { MailBag } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { GENERATED_MAX_ID, getElementId, isSameId } from "../../../common/api/common/utils/EntityUtils.js"
import { assertNotNull, delay, filterInt, isNotNull, lastThrow } from "@tutao/tutanota-utils"
import { HtmlSanitizer } from "../../../common/misc/HtmlSanitizer.js"
import { ExportFacade } from "../../../common/native/common/generatedipc/ExportFacade.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { CancelledError } from "../../../common/api/common/error/CancelledError.js"
import { FileOpenError } from "../../../common/api/common/error/FileOpenError.js"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils.js"
import { MailExportFacade } from "../../../common/api/worker/facades/lazy/MailExportFacade.js"
import { SuspensionError } from "../../../common/api/common/error/SuspensionError"
import { Scheduler } from "../../../common/api/common/utils/Scheduler"
import { ExportError, ExportErrorReason } from "../../../common/api/common/error/ExportError"
import { assertMainOrNode } from "../../../common/api/common/Env"

assertMainOrNode()

export type MailExportState =
	| { type: "idle" }
	| { type: "exporting"; mailboxDetail: MailboxDetail; progress: number; exportedMails: number }
	| { type: "locked" }
	| { type: "error"; message: string }
	| {
			type: "finished"
			mailboxDetail: MailboxDetail
	  }

const TAG = "MailboxExport"

/**
 * Controller to keep the state of mail exporting with the details.
 */
export class MailExportController {
	private _state: Stream<MailExportState> = stream({ type: "idle" })
	private _lastExport: Date | null = null

	get lastExport(): Date | null {
		return this._lastExport
	}

	constructor(
		private readonly mailExportFacade: MailExportFacade,
		private readonly sanitizer: HtmlSanitizer,
		private readonly exportFacade: ExportFacade,
		private readonly logins: LoginController,
		private readonly mailboxModel: MailboxModel,
		private readonly scheduler: Scheduler,
	) {}

	get state(): Stream<MailExportState> {
		return this._state
	}

	private get userId(): Id {
		return this.logins.getUserController().userId
	}

	/**
	 * Start exporting the mailbox for the user
	 * @param mailboxDetail
	 */
	async startExport(mailboxDetail: MailboxDetail) {
		const allMailBags = [assertNotNull(mailboxDetail.mailbox.currentMailBag), ...mailboxDetail.mailbox.archivedMailBags]

		try {
			await this.exportFacade.startMailboxExport(this.userId, mailboxDetail.mailbox._id, allMailBags[0]._id, GENERATED_MAX_ID)
		} catch (e) {
			if (e instanceof CancelledError) {
				console.log("Export start cancelled")
				return
			} else if (e instanceof ExportError && e.data === ExportErrorReason.LockedForUser) {
				this._state({ type: "locked" })
				return
			} else {
				throw e
			}
		}

		this._state({ type: "exporting", mailboxDetail: mailboxDetail, progress: 0, exportedMails: 0 })
		this._lastExport = new Date()

		await this.runExport(mailboxDetail, allMailBags, GENERATED_MAX_ID)
	}

	async resumeIfNeeded() {
		const exportState = await this.exportFacade.getMailboxExportState(this.userId)
		console.log(TAG, `Export, previous state: ${exportState?.type}`)
		if (exportState) {
			if (exportState.type === "running") {
				const mailboxDetail = await this.mailboxModel.getMailboxDetailByMailboxId(exportState.mailboxId)
				if (mailboxDetail == null) {
					console.warn(TAG, `Did not find mailbox to resume export: ${exportState.mailboxId}`)
					await this.cancelExport()
					return
				}
				this._state({
					type: "exporting",
					mailboxDetail: mailboxDetail,
					progress: 0,
					exportedMails: exportState.exportedMails,
				})
				this._lastExport = new Date()
				await this.resumeExport(mailboxDetail, exportState.mailBagId, exportState.mailId)
			} else if (exportState.type === "finished") {
				const mailboxDetail = await this.mailboxModel.getMailboxDetailByMailboxId(exportState.mailboxId)
				if (mailboxDetail == null) {
					console.warn(TAG, `Did not find mailbox to resume export: ${exportState.mailboxId}`)
					await this.cancelExport()
					return
				}
				this._state({ type: "finished", mailboxDetail: mailboxDetail })
			} else if (exportState.type === "locked") {
				this._state({ type: "locked" })
				this.scheduler.scheduleAfter(() => this.resumeIfNeeded(), 1000 * 60 * 5) // 5 min
			}
		}
	}

	async openExportDirectory() {
		if (this._state().type === "finished") {
			await this.exportFacade.openExportDirectory(this.userId)
		}
	}

	/**
	 * When the user wants to cancel the exporting
	 */
	async cancelExport() {
		this._state({ type: "idle" })
		await this.exportFacade.clearExportState(this.userId)
	}

	private async resumeExport(mailboxDetail: MailboxDetail, mailbagId: Id, mailId: Id) {
		console.log(TAG, `Resuming export from mail bag: ${mailbagId} ${mailId}`)
		const allMailBags = [assertNotNull(mailboxDetail.mailbox.currentMailBag), ...mailboxDetail.mailbox.archivedMailBags]
		const currentMailBagIndex = allMailBags.findIndex((mb) => mb._id === mailbagId)
		const mailBags = allMailBags.slice(currentMailBagIndex)

		await this.runExport(mailboxDetail, mailBags, mailId)
	}

	private async runExport(mailboxDetail: MailboxDetail, mailBags: MailBag[], mailId: Id) {
		const startTime = assertNotNull(this._lastExport)
		for (const mailBag of mailBags) {
			await this.exportMailBag(mailBag, mailId)
			if (this._state().type !== "exporting" || this._lastExport !== startTime) {
				return
			}
		}

		if (this._state().type !== "exporting") {
			return
		}
		await this.exportFacade.endMailboxExport(this.userId)
		this._state({ type: "finished", mailboxDetail: mailboxDetail })
	}

	private async exportMailBag(mailBag: MailBag, startId: Id): Promise<void> {
		console.log(TAG, `Exporting mail bag: ${mailBag._id} ${startId}`)
		let currentStartId = startId
		while (true) {
			try {
				const downloadedMails = await this.mailExportFacade.loadFixedNumberOfMailsWithCache(mailBag.mails, currentStartId)
				if (downloadedMails.length === 0) {
					break
				}

				const downloadedMailDetails = await this.mailExportFacade.loadMailDetails(downloadedMails)
				const attachmentInfo = await this.mailExportFacade.loadAttachments(downloadedMails)

				for (const { mail, mailDetails } of downloadedMailDetails) {
					if (this._state().type !== "exporting") {
						return
					}
					const mailAttachmentInfo = mail.attachments
						.map((attachmentId) => attachmentInfo.find((attachment) => isSameId(attachment._id, attachmentId)))
						.filter(isNotNull)
					const attachments = await this.mailExportFacade.loadAttachmentData(mail, mailAttachmentInfo)
					const { makeMailBundle } = await import("../../mail/export/Bundler.js")
					const mailBundle = makeMailBundle(this.sanitizer, mail, mailDetails, attachments)

					// can't write export if it was canceled
					if (this._state().type !== "exporting") {
						return
					}
					try {
						await this.exportFacade.saveMailboxExport(mailBundle, this.userId, mailBag._id, getElementId(mail))
					} catch (e) {
						if (e instanceof FileOpenError) {
							this._state({ type: "error", message: e.message })
							return
						} else {
							throw e
						}
					}
				}
				currentStartId = getElementId(lastThrow(downloadedMails))
				const currentState = this._state()
				if (currentState.type != "exporting") {
					return
				}
				this._state({ ...currentState, exportedMails: currentState.exportedMails + downloadedMails.length })
			} catch (e) {
				if (isOfflineError(e)) {
					console.log(TAG, "Offline, will retry later")
					await delay(1000 * 60) // 1 min
				} else if (e instanceof SuspensionError) {
					const timeToWait = Math.max(filterInt(assertNotNull(e.data)), 1)
					console.log(TAG, `Pausing for ${Math.floor(timeToWait / 1000 + 0.5)} seconds`)
					const currentExportTime = this._lastExport
					await delay(timeToWait)
					if (this._state().type !== "exporting" || this._lastExport !== currentExportTime) {
						return
					}
				} else {
					throw e
				}
				console.log(TAG, "Trying to continue with export")
			}
		}
	}
}
