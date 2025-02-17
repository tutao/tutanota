import { getApiBaseUrl } from "../../../common/api/common/Env"
import { ImportMailState, ImportMailStateTypeRef, MailBox, MailFolder, MailFolderTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { assertNotNull, first, isEmpty } from "@tutao/tutanota-utils"
import { NativeMailImportFacade } from "../../../common/native/common/generatedipc/NativeMailImportFacade"
import { CredentialsProvider } from "../../../common/misc/credentials/CredentialsProvider"
import { DomainConfigProvider } from "../../../common/api/common/DomainConfigProvider"
import { LoginController } from "../../../common/api/main/LoginController"
import m from "mithril"
import { elementIdPart, GENERATED_MIN_ID, isSameId } from "../../../common/api/common/utils/EntityUtils.js"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { EstimatingProgressMonitor } from "../../../common/api/common/utils/EstimatingProgressMonitor.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"
import { EventController } from "../../../common/api/main/EventController"
import { ImportErrorCategories, MailImportError } from "../../../common/api/common/error/MailImportError.js"
import { showSnackBar, SnackBarButtonAttrs } from "../../../common/gui/base/SnackBar.js"
import { OpenSettingsHandler } from "../../../common/native/main/OpenSettingsHandler.js"
import { Dialog } from "../../../common/gui/base/Dialog"
import { ImportStatus, MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { mailLocator } from "../../mailLocator"

// keep in sync with napi binding.d.cts
export const enum ImportProgressAction {
	Continue = 0,
	Pause = 1,
	Stop = 2,
}

const DEFAULT_TOTAL_WORK: number = 10000
type ActiveImport = {
	remoteStateId: IdTuple
	uiStatus: UiImportStatus
	progressMonitor: EstimatingProgressMonitor
}

export class MailImporter {
	private finalisedImportStates: Map<Id, ImportMailState> = new Map()
	private activeImport: ActiveImport | null = null
	public foldersForMailbox: FolderSystem | undefined
	public selectedTargetFolder: MailFolder | null = null

	constructor(
		private readonly domainConfigProvider: DomainConfigProvider,
		private readonly loginController: LoginController,
		private readonly mailboxModel: MailboxModel,
		private readonly entityClient: EntityClient,
		eventController: EventController,
		private readonly credentialsProvider: CredentialsProvider,
		private readonly nativeMailImportFacade: NativeMailImportFacade,
		private readonly openSettingsHandler: OpenSettingsHandler,
	) {
		eventController.addEntityListener((updates) => this.entityEventsReceived(updates))
	}

	async getMailbox(): Promise<MailBox> {
		return assertNotNull(first(await this.mailboxModel.getMailboxDetails())).mailbox
	}

	async initImportMailStates(): Promise<void> {
		await this.checkForResumableImport()

		const importMailStatesCollection = await this.entityClient.loadAll(ImportMailStateTypeRef, (await this.getMailbox()).mailImportStates)
		for (const importMailState of importMailStatesCollection) {
			if (this.isFinalisedImport(importMailState)) {
				this.updateFinalisedImport(elementIdPart(importMailState._id), importMailState)
			}
		}
		m.redraw()
	}

	private async checkForResumableImport(): Promise<void> {
		const importFacade = assertNotNull(this.nativeMailImportFacade)
		const mailbox = await this.getMailbox()
		this.foldersForMailbox = this.getFoldersForMailGroup(assertNotNull(mailbox._ownerGroup))

		let activeImportId: IdTuple | null = null
		if (this.activeImport === null) {
			const mailOwnerGroupId = assertNotNull(mailbox._ownerGroup)
			const userId = this.loginController.getUserController().userId
			const unencryptedCredentials = assertNotNull(await this.credentialsProvider?.getDecryptedCredentialsByUserId(userId))
			const apiUrl = getApiBaseUrl(this.domainConfigProvider.getCurrentDomainConfig())
			this.selectedTargetFolder = this.foldersForMailbox.getSystemFolderByType(MailSetKind.ARCHIVE)

			try {
				activeImportId = await importFacade.getResumableImport(mailbox._id, mailOwnerGroupId, unencryptedCredentials, apiUrl)
			} catch (e) {
				if (e instanceof MailImportError) this.handleError(e).catch()
				else throw e
			}

			this.listenForError(importFacade, mailbox._id).then()
		}

		if (activeImportId) {
			// we can't use the result of loadAll (see below) as that might only read from offline cache and
			// not include a new ImportMailState that was created without sending an entity event
			const importMailState = await this.entityClient.load(ImportMailStateTypeRef, activeImportId)
			const remoteStatus = parseInt(importMailState.status) as ImportStatus

			switch (remoteStatus) {
				case ImportStatus.Canceled:
				case ImportStatus.Finished:
					activeImportId = null
					this.activeImport = null
					this.selectedTargetFolder = this.foldersForMailbox.getSystemFolderByType(MailSetKind.ARCHIVE)
					break

				case ImportStatus.Paused:
				case ImportStatus.Running: {
					let progressMonitor = this.activeImport?.progressMonitor ?? null
					if (!progressMonitor) {
						const totalCount = parseInt(importMailState.totalMails)
						const doneCount = parseInt(importMailState.failedMails) + parseInt(importMailState.successfulMails)
						progressMonitor = this.createEstimatingProgressMonitor(totalCount)
						progressMonitor.totalWorkDone(doneCount)
					}

					this.activeImport = {
						remoteStateId: activeImportId,
						uiStatus: UiImportStatus.Paused,
						progressMonitor,
					}
					this.selectedTargetFolder = await this.entityClient.load(MailFolderTypeRef, importMailState.targetFolder)
				}
			}
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(ImportMailStateTypeRef, update)) {
				const updatedState = await this.entityClient.load(ImportMailStateTypeRef, [update.instanceListId, update.instanceId])
				await this.newImportStateFromServer(updatedState)
			}
		}
	}

	async newImportStateFromServer(serverState: ImportMailState) {
		const remoteStatus = parseInt(serverState.status) as ImportStatus

		const wasUpdatedForThisImport = this.activeImport !== null && isSameId(this.activeImport.remoteStateId, serverState._id)
		if (wasUpdatedForThisImport) {
			if (isFinalisedImport(remoteStatus)) {
				this.resetStatus()
				this.updateFinalisedImport(elementIdPart(serverState._id), serverState)
			} else {
				const activeImport = assertNotNull(this.activeImport)
				activeImport.uiStatus = importStatusToUiImportStatus(remoteStatus)
				const newTotalWork = parseInt(serverState.totalMails)
				const newDoneWork = parseInt(serverState.successfulMails) + parseInt(serverState.failedMails)
				activeImport.progressMonitor.updateTotalWork(newTotalWork)
				activeImport.progressMonitor.totalWorkDone(newDoneWork)
				if (remoteStatus === ImportStatus.Paused) {
					activeImport.progressMonitor.pauseEstimation()
				} else {
					activeImport.progressMonitor.continueEstimation()
				}
			}
		} else {
			this.updateFinalisedImport(elementIdPart(serverState._id), serverState)
		}

		m.redraw()
	}

	private createEstimatingProgressMonitor(totalWork: number = DEFAULT_TOTAL_WORK) {
		return new EstimatingProgressMonitor(totalWork, (_) => {
			m.redraw()
		})
	}

	private isFinalisedImport(importMailState: ImportMailState) {
		return parseInt(importMailState.status) == ImportStatus.Finished || parseInt(importMailState.status) == ImportStatus.Canceled
	}

	private getFoldersForMailGroup(mailGroupId: Id): FolderSystem {
		if (mailGroupId) {
			const folderSystem = mailLocator.mailModel.getFolderSystemByGroupId(mailGroupId)
			if (folderSystem) {
				return folderSystem
			}
		}
		throw new Error("could not load folder list")
	}

	/// start a loop that listens to an arbitrary amount of errors that can happen during the import process.
	private async listenForError(importFacade: NativeMailImportFacade, mailboxId: string) {
		while (true) {
			try {
				await importFacade.setAsyncErrorHook(mailboxId)
			} catch (e) {
				if (e instanceof MailImportError) {
					this.handleError(e).catch()
					continue
				}
				throw e
			}
			throw new ProgrammingError("setAsyncErrorHook should never complete normally!")
		}
	}

	private async handleError(err: MailImportError) {
		if (this.activeImport) {
			this.activeImport.uiStatus = UiImportStatus.Paused
			this.activeImport.progressMonitor.pauseEstimation()
		}
		if (err.data.category == ImportErrorCategories.ImportFeatureDisabled) {
			await Dialog.message("mailImportErrorServiceUnavailable_msg")
		} else if (err.data.category == ImportErrorCategories.ConcurrentImport) {
			console.log("Tried to start concurrent import")
			showSnackBar({
				message: "pleaseWait_msg",
				button: {
					label: "ok_action",
					click: () => {},
				},
			})
		} else {
			console.log(`Error while importing mails, category: ${err.data.category}, source: ${err.data.source}`)
			const navigateToImportSettings: SnackBarButtonAttrs = {
				label: "show_action",
				click: () => this.openSettingsHandler.openSettings("mailImport"),
			}
			showSnackBar({ message: "someMailFailedImport_msg", button: navigateToImportSettings })
		}
	}

	/**
	 * Call to the nativeMailImportFacade in worker to start a mail import from .eml or .mbox files.
	 * @param filePaths to the .eml/.mbox files to import mails from
	 */
	async onStartBtnClick(filePaths: Array<string>) {
		if (isEmpty(filePaths)) return
		if (!this.shouldRenderStartButton()) throw new ProgrammingError("can't change state to starting")

		const apiUrl = getApiBaseUrl(this.domainConfigProvider.getCurrentDomainConfig())
		const mailbox = await this.getMailbox()
		const mailboxId = mailbox._id
		const mailOwnerGroupId = assertNotNull(mailbox._ownerGroup)
		const userId = this.loginController.getUserController().userId
		const importFacade = assertNotNull(this.nativeMailImportFacade)
		const selectedTargetFolder = assertNotNull(this.selectedTargetFolder)
		const unencryptedCredentials = assertNotNull(await this.credentialsProvider?.getDecryptedCredentialsByUserId(userId))

		this.resetStatus()
		let progressMonitor = this.createEstimatingProgressMonitor()
		this.activeImport = {
			remoteStateId: [GENERATED_MIN_ID, GENERATED_MIN_ID],
			uiStatus: UiImportStatus.Starting,
			progressMonitor,
		}
		this.activeImport?.progressMonitor?.continueEstimation()
		m.redraw()

		try {
			this.activeImport.remoteStateId = await importFacade.prepareNewImport(
				mailboxId,
				mailOwnerGroupId,
				selectedTargetFolder._id,
				filePaths,
				unencryptedCredentials,
				apiUrl,
			)
		} catch (e) {
			this.resetStatus()
			m.redraw()

			if (e instanceof MailImportError) {
				this.handleError(e).catch()
			} else {
				throw e
			}
		}
		await importFacade.setProgressAction(mailboxId, ImportProgressAction.Continue)
	}

	async onPauseBtnClick() {
		let activeImport = assertNotNull(this.activeImport)

		if (activeImport.uiStatus !== UiImportStatus.Running) throw new ProgrammingError("can't change state to pausing")

		activeImport.uiStatus = UiImportStatus.Pausing
		activeImport.progressMonitor.pauseEstimation()
		m.redraw()

		const mailboxId = (await this.getMailbox())._id
		const nativeImportFacade = assertNotNull(this.nativeMailImportFacade)
		await nativeImportFacade.setProgressAction(mailboxId, ImportProgressAction.Pause)
	}

	async onResumeBtnClick() {
		if (!this.shouldRenderResumeButton()) throw new ProgrammingError("can't change state to resuming")

		let activeImport = assertNotNull(this.activeImport)
		activeImport.uiStatus = UiImportStatus.Resuming

		activeImport.progressMonitor.continueEstimation()
		m.redraw()

		const mailboxId = (await this.getMailbox())._id
		const nativeImportFacade = assertNotNull(this.nativeMailImportFacade)
		await nativeImportFacade.setProgressAction(mailboxId, ImportProgressAction.Continue)
	}

	async onCancelBtnClick() {
		if (!this.shouldRenderCancelButton()) throw new ProgrammingError("can't change state to cancelling")

		let activeImport = assertNotNull(this.activeImport)
		activeImport.uiStatus = UiImportStatus.Cancelling

		activeImport.progressMonitor.pauseEstimation()
		m.redraw()

		const mailboxId = (await this.getMailbox())._id
		const nativeImportFacade = assertNotNull(this.nativeMailImportFacade)
		await nativeImportFacade.setProgressAction(mailboxId, ImportProgressAction.Stop)
	}

	shouldRenderStartButton() {
		return this.activeImport === null
	}

	shouldRenderImportStatus(): boolean {
		const activeImportStatus = this.getUiStatus()
		if (activeImportStatus === null) return false

		return (
			activeImportStatus === UiImportStatus.Starting ||
			activeImportStatus === UiImportStatus.Running ||
			activeImportStatus === UiImportStatus.Pausing ||
			activeImportStatus === UiImportStatus.Paused ||
			activeImportStatus === UiImportStatus.Cancelling ||
			activeImportStatus === UiImportStatus.Resuming
		)
	}

	shouldRenderPauseButton(): boolean {
		const activeImportStatus = this.getUiStatus()
		if (activeImportStatus === null) return false

		return activeImportStatus === UiImportStatus.Running || activeImportStatus === UiImportStatus.Starting || activeImportStatus === UiImportStatus.Pausing
	}

	shouldDisablePauseButton(): boolean {
		const activeImportStatus = this.getUiStatus()
		if (activeImportStatus === null) return false

		return activeImportStatus === UiImportStatus.Pausing || activeImportStatus === UiImportStatus.Starting
	}

	shouldRenderResumeButton(): boolean {
		const activeImportStatus = this.getUiStatus()
		if (activeImportStatus === null) return false

		return activeImportStatus === UiImportStatus.Paused || activeImportStatus === UiImportStatus.Resuming
	}

	shouldDisableResumeButton(): boolean {
		const activeImportStatus = this.getUiStatus()
		if (activeImportStatus === null) return false

		return activeImportStatus === UiImportStatus.Resuming || activeImportStatus === UiImportStatus.Starting
	}

	shouldRenderCancelButton(): boolean {
		const activeImportStatus = this.getUiStatus()
		if (activeImportStatus === null) return false

		return (
			activeImportStatus === UiImportStatus.Paused ||
			activeImportStatus === UiImportStatus.Running ||
			activeImportStatus === UiImportStatus.Pausing ||
			activeImportStatus === UiImportStatus.Cancelling
		)
	}

	shouldDisableCancelButton(): boolean {
		const activeImportStatus = this.getUiStatus()
		return (
			activeImportStatus === UiImportStatus.Cancelling || activeImportStatus === UiImportStatus.Pausing || activeImportStatus === UiImportStatus.Starting
		)
	}

	shouldRenderProcessedMails(): boolean {
		const activeImportStatus = this.getUiStatus()
		return (
			this.activeImport?.progressMonitor?.totalWork != DEFAULT_TOTAL_WORK &&
			(activeImportStatus === UiImportStatus.Running ||
				activeImportStatus === UiImportStatus.Resuming ||
				activeImportStatus === UiImportStatus.Pausing ||
				activeImportStatus === UiImportStatus.Paused)
		)
	}

	getTotalMailsCount() {
		return assertNotNull(this.activeImport).progressMonitor.totalWork
	}

	getProcessedMailsCount() {
		const progressMonitor = assertNotNull(this.activeImport).progressMonitor
		return Math.min(Math.round(progressMonitor.workCompleted), progressMonitor.totalWork)
	}

	getProgress() {
		const progressMonitor = assertNotNull(this.activeImport).progressMonitor
		return Math.ceil(progressMonitor.percentage())
	}

	getFinalisedImports(): Array<ImportMailState> {
		return Array.from(this.finalisedImportStates.values())
	}

	updateFinalisedImport(importMailStateElementId: Id, importMailState: ImportMailState) {
		this.finalisedImportStates.set(importMailStateElementId, importMailState)
	}

	private resetStatus() {
		this.activeImport?.progressMonitor?.pauseEstimation()
		this.activeImport = null
	}

	getUiStatus() {
		return this.activeImport?.uiStatus ?? null
	}
}

export const enum UiImportStatus {
	Starting,
	Resuming,
	Running,
	Pausing,
	Paused,
	Cancelling,
}

function importStatusToUiImportStatus(importStatus: ImportStatus) {
	// We do not render ImportStatus.Finished and ImportStatus.Canceled
	// in the UI, and therefore return the corresponding previous states.
	switch (importStatus) {
		case ImportStatus.Finished:
			return UiImportStatus.Running
		case ImportStatus.Canceled:
			return UiImportStatus.Cancelling
		case ImportStatus.Paused:
			return UiImportStatus.Paused
		case ImportStatus.Running:
			return UiImportStatus.Running
	}
}

export function isFinalisedImport(remoteImportStatus: ImportStatus): boolean {
	return remoteImportStatus == ImportStatus.Canceled || remoteImportStatus == ImportStatus.Finished
}
