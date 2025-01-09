import { getApiBaseUrl } from "../../../common/api/common/Env"
import { ImportMailState, ImportMailStateTypeRef, MailBox, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs"
import { assertNotNull, first, isEmpty } from "@tutao/tutanota-utils"
import { NativeMailImportFacade } from "../../../common/native/common/generatedipc/NativeMailImportFacade"
import { CredentialsProvider } from "../../../common/misc/credentials/CredentialsProvider"
import { DomainConfigProvider } from "../../../common/api/common/DomainConfigProvider"
import { LoginController } from "../../../common/api/main/LoginController"
import m from "mithril"
import { elementIdPart, isSameId } from "../../../common/api/common/utils/EntityUtils.js"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { EstimatingProgressMonitor } from "../../../common/api/common/utils/EstimatingProgressMonitor.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"
import { EventController } from "../../../common/api/main/EventController"
import { ImportErrorCategories, MailImportError } from "../../../common/api/common/error/MailImportError.js"
import { showSnackBar, SnackBarButtonAttrs } from "../../../common/gui/base/SnackBar.js"
import { OpenSettingsHandler } from "../../../common/native/main/OpenSettingsHandler.js"

// keep in sync with napi binding.d.cts
export const enum ImportProgressAction {
	Continue = 0,
	Pause = 1,
	Stop = 2,
}

const DEFAULT_TOTAL_WORK: number = 10000
const DEFAULT_PROGRESS: number = 0

export class MailImporter {
	private progressMonitor: EstimatingProgressMonitor | null = null
	private progressPercentage: number = DEFAULT_PROGRESS
	private finalisedImportStates: Map<Id, ImportMailState> = new Map()
	private activeImportId: IdTuple | null = null
	private uiStatus: UiImportStatus

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
		this.uiStatus = UiImportStatus.Idle
		eventController.addEntityListener((updates) => this.entityEventsReceived(updates))
	}

	async getMailbox(): Promise<MailBox> {
		return assertNotNull(first(await this.mailboxModel.getMailboxDetails())).mailbox
	}

	async initImportMailStates(): Promise<void> {
		const importFacade = assertNotNull(this.nativeMailImportFacade)
		const mailbox = await this.getMailbox()

		if (this.activeImportId === null) {
			const mailOwnerGroupId = assertNotNull(mailbox._ownerGroup)
			const userId = this.loginController.getUserController().userId
			const unencryptedCredentials = assertNotNull(await this.credentialsProvider?.getDecryptedCredentialsByUserId(userId))
			const apiUrl = getApiBaseUrl(this.domainConfigProvider.getCurrentDomainConfig())
			try {
				this.activeImportId = await importFacade.getResumableImport(mailbox._id, mailOwnerGroupId, unencryptedCredentials, apiUrl)
			} catch (e) {
				if (e instanceof MailImportError) {
					this.handleError(e).catch()
				} else {
					throw e
				}
			}
			this.listenForError(importFacade, mailbox._id)
		}

		if (this.activeImportId) {
			// we can't use the result of loadAll (see below) as that might only read from offline cache and
			// not include a new ImportMailState that was created without sending an entity event
			const importMailState = await this.entityClient.load(ImportMailStateTypeRef, this.activeImportId)
			const remoteStatus = parseInt(importMailState.status) as ImportStatus

			switch (remoteStatus) {
				case ImportStatus.Canceled:
				case ImportStatus.Finished:
					this.activeImportId = null
					break
				case ImportStatus.Paused:
				case ImportStatus.Running:
					this.uiStatus = importStatusToUiImportStatus(remoteStatus)
					if (!this.progressMonitor) {
						const totalCount = parseInt(importMailState.totalMails)
						const doneCount = parseInt(importMailState.failedMails) + parseInt(importMailState.successfulMails)
						this.progressMonitor = this.createEstimatingProgressMonitor(totalCount)
						this.progressMonitor.totalWorkDone(doneCount)
					}
					m.redraw()
			}
		}

		const importMailStatesCollection = await this.entityClient.loadAll(ImportMailStateTypeRef, (await this.getMailbox()).mailImportStates)
		for (const importMailState of importMailStatesCollection) {
			if (this.isFinalisedImport(importMailState)) {
				this.updateFinalisedImport(elementIdPart(importMailState._id), importMailState)
			}
		}
		m.redraw()
	}

	private createEstimatingProgressMonitor(totalWork: number = DEFAULT_TOTAL_WORK) {
		return new EstimatingProgressMonitor(totalWork, (value) => {
			this.progressPercentage = value
			m.redraw()
		})
	}

	private isFinalisedImport(importMailState: ImportMailState) {
		return parseInt(importMailState.status) == ImportStatus.Finished || parseInt(importMailState.status) == ImportStatus.Canceled
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
		switch (err.data.category) {
			case ImportErrorCategories.LocalSdkError:
				break
			case ImportErrorCategories.ServerCommunicationError:
				break
			case ImportErrorCategories.InvalidImportFilesErrors:
				break
			case ImportErrorCategories.ImportIncomplete: {
				this.resetStatus()
				const button: SnackBarButtonAttrs = {
					label: "show_action",
					click: () => this.openSettingsHandler.openSettings("mailImport"),
				}
				showSnackBar({ message: "someMailFailedImport_msg", button })
				break
			}
		}
	}

	/**
	 * Call to the nativeMailImportFacade in worker to start a mail import from .eml or .mbox files.
	 * @param targetFolder in which to import mails into
	 * @param filePaths to the .eml/.mbox files to import mails from
	 */
	async onStartBtnClick(targetFolder: MailFolder, filePaths: Array<string>) {
		if (isEmpty(filePaths)) return
		if (!this.shouldRenderStartButton()) throw new ProgrammingError("can't change state to starting")

		this.resetStatus()

		const apiUrl = getApiBaseUrl(this.domainConfigProvider.getCurrentDomainConfig())
		const mailbox = await this.getMailbox()
		const mailboxId = mailbox._id
		const mailOwnerGroupId = assertNotNull(mailbox._ownerGroup)
		const userId = this.loginController.getUserController().userId
		const importFacade = assertNotNull(this.nativeMailImportFacade)

		const unencryptedCredentials = assertNotNull(await this.credentialsProvider?.getDecryptedCredentialsByUserId(userId))
		this.uiStatus = UiImportStatus.Starting
		this.progressMonitor = new EstimatingProgressMonitor(DEFAULT_TOTAL_WORK, (value) => {
			this.progressPercentage = value
			m.redraw()
		})
		this.progressMonitor?.continueEstimation()
		m.redraw()

		try {
			this.activeImportId = await importFacade.prepareNewImport(mailboxId, mailOwnerGroupId, targetFolder._id, filePaths, unencryptedCredentials, apiUrl)
		} catch (e) {
			if (e instanceof MailImportError) {
				this.handleError(e).catch()
			} else {
				throw e
			}
		}
		const nativeImportFacade = assertNotNull(this.nativeMailImportFacade)
		await nativeImportFacade.setProgressAction(mailboxId, ImportProgressAction.Continue)
	}

	async onPauseBtnClick() {
		if (this.uiStatus !== UiImportStatus.Running) {
			throw new ProgrammingError("can't change state to pausing")
		}

		this.uiStatus = UiImportStatus.Pausing
		this.progressMonitor?.pauseEstimation()
		m.redraw()

		const mailboxId = (await this.getMailbox())._id
		const nativeImportFacade = assertNotNull(this.nativeMailImportFacade)
		await nativeImportFacade.setProgressAction(mailboxId, ImportProgressAction.Pause)
	}

	async onResumeBtnClick() {
		if (!this.shouldRenderResumeButton()) throw new ProgrammingError("can't change state to resuming")
		if (!this.activeImportId) throw new ProgrammingError("can't change state to resuming")

		this.uiStatus = UiImportStatus.Resuming
		this.progressMonitor?.continueEstimation()
		m.redraw()

		const mailboxId = (await this.getMailbox())._id
		const nativeImportFacade = assertNotNull(this.nativeMailImportFacade)
		await nativeImportFacade.setProgressAction(mailboxId, ImportProgressAction.Continue)
	}

	async onCancelBtnClick() {
		if (!this.shouldRenderCancelButton()) throw new ProgrammingError("can't change state to cancelling")

		this.uiStatus = UiImportStatus.Cancelling
		this.progressMonitor?.pauseEstimation()
		m.redraw()

		const mailboxId = (await this.getMailbox())._id
		const nativeImportFacade = assertNotNull(this.nativeMailImportFacade)
		await nativeImportFacade.setProgressAction(mailboxId, ImportProgressAction.Stop)
	}

	shouldRenderStartButton() {
		return this.uiStatus === UiImportStatus.Idle || this.uiStatus === UiImportStatus.Error
	}

	shouldRenderImportStatus(): boolean {
		return (
			this.uiStatus === UiImportStatus.Starting ||
			this.uiStatus === UiImportStatus.Running ||
			this.uiStatus === UiImportStatus.Pausing ||
			this.uiStatus === UiImportStatus.Paused ||
			this.uiStatus === UiImportStatus.Cancelling ||
			this.uiStatus === UiImportStatus.Resuming
		)
	}

	shouldRenderPauseButton(): boolean {
		return this.uiStatus === UiImportStatus.Running || this.uiStatus === UiImportStatus.Starting || this.uiStatus === UiImportStatus.Pausing
	}

	shouldDisablePauseButton(): boolean {
		return this.uiStatus === UiImportStatus.Pausing || this.uiStatus === UiImportStatus.Starting
	}

	shouldRenderResumeButton(): boolean {
		return this.uiStatus === UiImportStatus.Paused || this.uiStatus === UiImportStatus.Resuming
	}

	shouldDisableResumeButton(): boolean {
		return this.uiStatus === UiImportStatus.Resuming || this.uiStatus === UiImportStatus.Starting
	}

	shouldRenderCancelButton(): boolean {
		return (
			this.uiStatus === UiImportStatus.Paused ||
			this.uiStatus === UiImportStatus.Running ||
			this.uiStatus === UiImportStatus.Pausing ||
			this.uiStatus === UiImportStatus.Cancelling
		)
	}

	shouldDisableCancelButton(): boolean {
		return this.uiStatus === UiImportStatus.Cancelling || this.uiStatus === UiImportStatus.Pausing || this.uiStatus === UiImportStatus.Starting
	}

	shouldRenderProcessedMails(): boolean {
		return (
			this.progressMonitor?.totalWork != DEFAULT_TOTAL_WORK &&
			(this.uiStatus === UiImportStatus.Running ||
				this.uiStatus === UiImportStatus.Resuming ||
				this.uiStatus === UiImportStatus.Pausing ||
				this.uiStatus === UiImportStatus.Paused)
		)
	}

	getTotalMailsCount() {
		if (this.progressMonitor) {
			return this.progressMonitor?.totalWork
		} else {
			return DEFAULT_TOTAL_WORK
		}
	}

	getProcessedMailsCount() {
		if (this.progressMonitor) {
			return Math.min(Math.round(this.progressMonitor?.workCompleted), this.progressMonitor.totalWork)
		} else {
			return 0
		}
	}

	getFinalisedImports(): Array<ImportMailState> {
		return Array.from(this.finalisedImportStates.values())
	}

	updateFinalisedImport(importMailStateElementId: Id, importMailState: ImportMailState) {
		this.finalisedImportStates.set(importMailStateElementId, importMailState)
	}

	async newImportStateFromServer(serverState: ImportMailState) {
		const wasUpdatedForThisImport = isSameId(this.activeImportId ?? null, serverState._id)

		if (wasUpdatedForThisImport) {
			const remoteStatus = parseInt(serverState.status) as ImportStatus

			if (isFinalisedImport(remoteStatus)) {
				this.resetStatus()
				this.progressMonitor?.pauseEstimation()
				this.updateFinalisedImport(elementIdPart(serverState._id), serverState)
			} else {
				this.uiStatus = importStatusToUiImportStatus(remoteStatus)
				const newTotalWork = parseInt(serverState.totalMails)
				const newDoneWork = parseInt(serverState.successfulMails) + parseInt(serverState.failedMails)
				this.progressMonitor?.updateTotalWork(newTotalWork)
				this.progressMonitor?.totalWorkDone(newDoneWork)
			}
		} else {
			this.updateFinalisedImport(elementIdPart(serverState._id), serverState)
		}

		m.redraw()
	}

	private resetStatus() {
		this.activeImportId = null
		this.progressMonitor = null
		this.progressPercentage = 0
		this.uiStatus = UiImportStatus.Idle
	}

	getProgress() {
		return Math.ceil(this.progressPercentage)
	}

	getUiStatus() {
		if (this.uiStatus) {
			return this.uiStatus
		} else {
			return UiImportStatus.Idle
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
}

export const enum UiImportStatus {
	Idle,
	Starting,
	Resuming,
	Running,
	Pausing,
	Paused,
	Cancelling,
	Canceled,
	Error,
}

function importStatusToUiImportStatus(importStatus: ImportStatus) {
	switch (importStatus) {
		case ImportStatus.Finished:
			return UiImportStatus.Idle
		case ImportStatus.Canceled:
			return UiImportStatus.Idle
		case ImportStatus.Paused:
			return UiImportStatus.Paused
		case ImportStatus.Running:
			return UiImportStatus.Running
	}
}

export const enum ImportStatus {
	Running = 0,
	Paused = 1,
	Canceled = 2,
	Finished = 3,
}

export function isFinalisedImport(remoteImportStatus: ImportStatus): boolean {
	return remoteImportStatus == ImportStatus.Canceled || remoteImportStatus == ImportStatus.Finished
}
