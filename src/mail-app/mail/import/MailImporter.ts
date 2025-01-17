import { getApiBaseUrl } from "../../../common/api/common/Env"
import { ImportMailState, ImportMailStateTypeRef, MailBox, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs"
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

// keep in sync with napi binding.d.cts
export const enum ImportProgressAction {
	Continue = 0,
	Pause = 1,
	Stop = 2,
}

const DEFAULT_TOTAL_WORK: number = 10000
const DEFAULT_PROGRESS: number = 0

type ActiveImport = {
	remoteStateId: IdTuple
	uiStatus: UiImportStatus
}

export class MailImporter {
	private progressMonitor: EstimatingProgressMonitor | null = null
	private progressPercentage: number = DEFAULT_PROGRESS
	private finalisedImportStates: Map<Id, ImportMailState> = new Map()
	private activeImport: ActiveImport | null = null

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
		const importFacade = assertNotNull(this.nativeMailImportFacade)
		const mailbox = await this.getMailbox()

		let activeImportId = null
		if (this.activeImport === null) {
			const mailOwnerGroupId = assertNotNull(mailbox._ownerGroup)
			const userId = this.loginController.getUserController().userId
			const unencryptedCredentials = assertNotNull(await this.credentialsProvider?.getDecryptedCredentialsByUserId(userId))
			const apiUrl = getApiBaseUrl(this.domainConfigProvider.getCurrentDomainConfig())

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
					break

				case ImportStatus.Paused:
				case ImportStatus.Running:
					this.activeImport = {
						remoteStateId: activeImportId,
						uiStatus: UiImportStatus.Paused,
					}

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
				showSnackBar({ message: "someMailFailedImport_msg", button }).then()
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

		const apiUrl = getApiBaseUrl(this.domainConfigProvider.getCurrentDomainConfig())
		const mailbox = await this.getMailbox()
		const mailboxId = mailbox._id
		const mailOwnerGroupId = assertNotNull(mailbox._ownerGroup)
		const userId = this.loginController.getUserController().userId
		const importFacade = assertNotNull(this.nativeMailImportFacade)
		const unencryptedCredentials = assertNotNull(await this.credentialsProvider?.getDecryptedCredentialsByUserId(userId))

		this.resetStatus()
		this.activeImport = { remoteStateId: [GENERATED_MIN_ID, GENERATED_MIN_ID], uiStatus: UiImportStatus.Starting }
		this.progressMonitor = new EstimatingProgressMonitor(DEFAULT_TOTAL_WORK, (value) => {
			this.progressPercentage = value
			m.redraw()
		})
		this.progressMonitor?.continueEstimation()
		m.redraw()

		try {
			this.activeImport.remoteStateId = await importFacade.prepareNewImport(
				mailboxId,
				mailOwnerGroupId,
				targetFolder._id,
				filePaths,
				unencryptedCredentials,
				apiUrl,
			)
		} catch (e) {
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
		this.progressMonitor?.pauseEstimation()
		m.redraw()

		const mailboxId = (await this.getMailbox())._id
		const nativeImportFacade = assertNotNull(this.nativeMailImportFacade)
		await nativeImportFacade.setProgressAction(mailboxId, ImportProgressAction.Pause)
	}

	async onResumeBtnClick() {
		if (!this.shouldRenderResumeButton()) throw new ProgrammingError("can't change state to resuming")

		let activeImport = assertNotNull(this.activeImport)
		activeImport.uiStatus = UiImportStatus.Resuming

		this.progressMonitor?.continueEstimation()
		m.redraw()

		const mailboxId = (await this.getMailbox())._id
		const nativeImportFacade = assertNotNull(this.nativeMailImportFacade)
		await nativeImportFacade.setProgressAction(mailboxId, ImportProgressAction.Continue)
	}

	async onCancelBtnClick() {
		if (!this.shouldRenderCancelButton()) throw new ProgrammingError("can't change state to cancelling")

		let activeImport = assertNotNull(this.activeImport)
		activeImport.uiStatus = UiImportStatus.Cancelling

		this.progressMonitor?.pauseEstimation()
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
			this.progressMonitor?.totalWork != DEFAULT_TOTAL_WORK &&
			(activeImportStatus === UiImportStatus.Running ||
				activeImportStatus === UiImportStatus.Resuming ||
				activeImportStatus === UiImportStatus.Pausing ||
				activeImportStatus === UiImportStatus.Paused)
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
		const wasUpdatedForThisImport = this.activeImport !== null && isSameId(this.activeImport.remoteStateId, serverState._id)

		if (wasUpdatedForThisImport) {
			const remoteStatus = parseInt(serverState.status) as ImportStatus

			if (isFinalisedImport(remoteStatus)) {
				this.resetStatus()
				this.progressMonitor?.pauseEstimation()
				this.updateFinalisedImport(elementIdPart(serverState._id), serverState)
			} else {
				assertNotNull(this.activeImport).uiStatus = importStatusToUiImportStatus(remoteStatus)
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
		this.activeImport = null
		this.progressMonitor = null
		this.activeImport = null
		this.progressPercentage = 0
	}

	getProgress() {
		return Math.ceil(this.progressPercentage)
	}

	getUiStatus() {
		return this.activeImport?.uiStatus ?? null
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
	Starting,
	Resuming,
	Running,
	Pausing,
	Paused,
	Cancelling,
}

function importStatusToUiImportStatus(importStatus: ImportStatus) {
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

export const enum ImportStatus {
	Running = 0,
	Paused = 1,
	Canceled = 2,
	Finished = 3,
}

export function isFinalisedImport(remoteImportStatus: ImportStatus): boolean {
	return remoteImportStatus == ImportStatus.Canceled || remoteImportStatus == ImportStatus.Finished
}
