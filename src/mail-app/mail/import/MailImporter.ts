import { getApiBaseUrl } from "../../../common/api/common/Env"
import { ImportMailState, ImportMailStateTypeRef, MailBox, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs"
import { assertNotNull, first, isEmpty } from "@tutao/tutanota-utils"
import { NativeMailImportFacade } from "../../../common/native/common/generatedipc/NativeMailImportFacade"
import { CredentialsProvider } from "../../../common/misc/credentials/CredentialsProvider"
import { DomainConfigProvider } from "../../../common/api/common/DomainConfigProvider"
import { LoginController } from "../../../common/api/main/LoginController"
import m from "mithril"
import { elementIdPart, generatedIdToTimestamp, isSameId } from "../../../common/api/common/utils/EntityUtils.js"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { MailModel } from "../model/MailModel.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { LocalImportMailState } from "../../../common/native/common/generatedipc/LocalImportMailState.js"
import { ProgressMonitor } from "../../../common/api/common/utils/ProgressMonitor.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { ResumableImport } from "../../../common/native/common/generatedipc/ResumableImport.js"
import Stream from "mithril/stream"
import { WsConnectionState } from "../../../common/api/main/WorkerClient.js"
import { mailLocator } from "../../mailLocator.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"
import { EventController } from "../../../common/api/main/EventController"
import { Dialog } from "../../../common/gui/base/Dialog"

const DEFAULT_TOTAL_WORK: number = 100000
const DEFAULT_PROGRESS_ESTIMATION_REFRESH_MS: number = 1000
const DEFAULT_PROGRESS: number = 0

export class MailImporter {
	public nativeMailImportFacade: NativeMailImportFacade | null = null
	public credentialsProvider: CredentialsProvider | null = null

	private domainConfigProvider: DomainConfigProvider
	private loginController: LoginController
	public mailboxModel: MailboxModel
	public mailModel: MailModel
	private entityClient: EntityClient

	private finalisedImportStates: Map<Id, ImportMailState> = new Map()

	private progressMonitor: ProgressMonitor | null = null
	private progressEstimation: TimeoutID
	private progress: number = DEFAULT_PROGRESS

	private activeImport: LocalImportMailState | null = null
	private uiStatus: UiImportStatus
	private wsConnectionOnline: boolean = false
	private eventController: EventController
	private isInitialized: boolean = false
	private isLastRunFailed: boolean = false

	constructor(
		domainConfigProvider: DomainConfigProvider,
		loginController: LoginController,
		mailboxModel: MailboxModel,
		mailModel: MailModel,
		entityClient: EntityClient,
		eventController: EventController,
	) {
		this.domainConfigProvider = domainConfigProvider
		this.loginController = loginController
		this.mailboxModel = mailboxModel
		this.mailModel = mailModel
		this.entityClient = entityClient

		this.uiStatus = UiImportStatus.Idle
		this.updateProgressMonitorTotalWork(DEFAULT_TOTAL_WORK)
		this.eventController = eventController

		this.eventController.addEntityListener((updates) => this.entityEventsReceived(updates))
	}

	async getMailbox(): Promise<MailBox> {
		return assertNotNull(first(await this.mailboxModel.getMailboxDetails())).mailbox
	}

	async initImportMailStates(): Promise<void> {
		if (this.isInitialized) {
			return Promise.resolve()
		}
		this.isInitialized = true
		const importFacade = assertNotNull(this.nativeMailImportFacade)

		let resumableImport: ResumableImport | null = null
		try {
			resumableImport = await importFacade.getResumeableImport((await this.getMailbox())._id)
		} catch (e) {
			if (e instanceof Error && e.message === "NoElementIdForState") {
				console.log("nothing to resume")
			} else {
				throw e
			}
		}

		if (resumableImport) {
			// we can't use the result of loadAll (see below) as that might only read from offline cache and
			// not include a new ImportMailState that was created without sending an entity event
			const importMailState = await this.entityClient.load(ImportMailStateTypeRef, resumableImport.remoteStateId) //
			if (this.uiStatus != UiImportStatus.Running) {
				importMailState.status = ImportStatus.Paused.toString()
				this.activeImport = remoteStateAsLocal(importMailState, this.activeImport)
				this.uiStatus = importStatusToUiImportStatus(this.activeImport.status)
				const doneCount = parseInt(importMailState.failedMails) + parseInt(importMailState.successfulMails)
				const totalCount = doneCount + resumableImport.remainingEmlCount
				this.updateProgressMonitorTotalWork(totalCount)
				this.progressMonitor?.totalWorkDone(doneCount)
			}
		}

		const importMailStatesCollection = await this.entityClient.loadAll(ImportMailStateTypeRef, (await this.getMailbox()).mailImportStates)
		for (const importMailState of importMailStatesCollection) {
			const remoteStatus = parseInt(importMailState.status) as ImportStatus
			if (isFinalisedImport(remoteStatus)) {
				this.updateFinalisedImport(elementIdPart(importMailState._id), importMailState)
			}
		}
		m.redraw()

		this.connectionStateListener(mailLocator.connectivityModel.wsConnection()).then()
	}

	/**
	 * Call to the nativeMailImportFacade in worker to start a mail import from .eml or .mbox files.
	 * @param targetFolder in which to import mails into
	 * @param filePaths to the .eml/.mbox files to import mails from
	 */
	async onStartBtnClick(targetFolder: MailFolder, filePaths: Array<string>) {
		if (isEmpty(filePaths)) return
		if (!this.shouldShowStartButton()) throw new ProgrammingError("can't change state to starting")

		const apiUrl = getApiBaseUrl(this.domainConfigProvider.getCurrentDomainConfig())
		const ownerGroup = assertNotNull(targetFolder._ownerGroup)
		const userId = this.loginController.getUserController().userId
		const importFacade = assertNotNull(this.nativeMailImportFacade)
		const unencryptedCredentials = assertNotNull(await this.credentialsProvider?.getDecryptedCredentialsByUserId(userId))

		this.uiStatus = UiImportStatus.Starting
		this.isLastRunFailed = false
		this.startProgressEstimation()
		m.redraw()
		await importFacade.startFileImport((await this.getMailbox())._id, apiUrl, unencryptedCredentials, ownerGroup, targetFolder._id, filePaths)
	}

	async onPauseBtnClick() {
		if (this.uiStatus !== UiImportStatus.Running) {
			throw new ProgrammingError("can't change state to pausing")
		}

		this.stopProgressEstimation()
		this.uiStatus = UiImportStatus.Pausing
		m.redraw()

		const importFacade = assertNotNull(this.nativeMailImportFacade)
		await importFacade.setPausedProgressAction((await this.getMailbox())._id)
	}

	async onResumeBtnClick() {
		if (!this.shouldShowResumeButton()) throw new ProgrammingError("can't change state to resuming")
		if (!this.activeImport) throw new ProgrammingError("can't change state to resuming")

		this.uiStatus = UiImportStatus.Resuming
		this.startProgressEstimation()
		m.redraw()

		const importFacade = assertNotNull(this.nativeMailImportFacade)
		const apiUrl = getApiBaseUrl(this.domainConfigProvider.getCurrentDomainConfig())
		const userId = this.loginController.getUserController().userId

		const unencryptedCredentials = assertNotNull(await this.credentialsProvider?.getDecryptedCredentialsByUserId(userId))
		const resumableStateId = assertNotNull(this.activeImport?.remoteStateId)

		await importFacade.resumeFileImport((await this.getMailbox())._id, apiUrl, unencryptedCredentials, resumableStateId)
	}

	async onCancelBtnClick() {
		if (!this.shouldShowCancelButton()) throw new ProgrammingError("can't change state to cancelling")
		const importFacade = assertNotNull(this.nativeMailImportFacade)

		this.stopProgressEstimation()

		const isInRunningStatus = this.uiStatus === UiImportStatus.Running
		const isInPausedStatus = this.uiStatus === UiImportStatus.Paused
		this.uiStatus = UiImportStatus.Cancelling
		m.redraw()

		await importFacade.setStopProgressAction((await this.getMailbox())._id)
	}

	shouldShowStartButton() {
		return this.wsConnectionOnline && this.uiStatus === UiImportStatus.Idle
	}

	shouldShowImportStatus(): boolean {
		return (
			this.uiStatus === UiImportStatus.Starting ||
			this.uiStatus === UiImportStatus.Running ||
			this.uiStatus === UiImportStatus.Pausing ||
			this.uiStatus === UiImportStatus.Paused ||
			this.uiStatus === UiImportStatus.Cancelling
		)
	}

	shouldShowPauseButton(): boolean {
		return this.wsConnectionOnline && (this.uiStatus === UiImportStatus.Running || this.uiStatus === UiImportStatus.Pausing)
	}

	shouldDisablePauseButton(): boolean {
		return this.wsConnectionOnline && this.uiStatus === UiImportStatus.Pausing
	}

	shouldShowResumeButton(): boolean {
		return this.wsConnectionOnline && (this.uiStatus === UiImportStatus.Paused || this.uiStatus === UiImportStatus.Resuming)
	}

	shouldDisableResumeButton(): boolean {
		return !this.wsConnectionOnline || this.uiStatus === UiImportStatus.Resuming
	}

	shouldShowCancelButton(): boolean {
		return (
			this.wsConnectionOnline &&
			(this.uiStatus === UiImportStatus.Paused ||
				this.uiStatus === UiImportStatus.Running ||
				this.uiStatus === UiImportStatus.Pausing ||
				this.uiStatus === UiImportStatus.Cancelling)
		)
	}

	shouldDisableCancelButton(): boolean {
		return !this.wsConnectionOnline || this.uiStatus === UiImportStatus.Cancelling || this.uiStatus === UiImportStatus.Pausing
	}

	shouldShowProcessedMails(): boolean {
		return (
			this.uiStatus === UiImportStatus.Running ||
			this.uiStatus === UiImportStatus.Resuming ||
			this.uiStatus === UiImportStatus.Pausing ||
			this.uiStatus === UiImportStatus.Paused
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
			return Math.min(this.progressMonitor?.workCompleted, this.progressMonitor.totalWork)
		} else {
			return 0
		}
	}

	updateProgressMonitorTotalWork(newTotalWork: number) {
		this.progressMonitor = new ProgressMonitor(newTotalWork, (newProgressPercentage) => {
			this.progress = newProgressPercentage
			m.redraw()
		})
	}

	getFinalisedImports(): Array<ImportMailState> {
		return Array.from(this.finalisedImportStates.values())
	}

	updateFinalisedImport(importMailStateElementId: Id, importMailState: ImportMailState) {
		this.finalisedImportStates.set(importMailStateElementId, importMailState)
	}

	private startProgressEstimation() {
		clearInterval(this.progressEstimation)

		this.progressEstimation = setInterval(() => {
			let now = Date.now()
			let completedMails = this.progressMonitor?.workCompleted
			if (completedMails) {
				let startTimestamp = this.activeImport?.start_timestamp ?? now
				let durationSinceStartSeconds = (now - startTimestamp) / 1000
				let mailsPerSecond = completedMails / durationSinceStartSeconds
				this.progressMonitor?.workDone(Math.round(mailsPerSecond))
			} else {
				this.progressMonitor?.workDone(5)
			}
			m.redraw()
		}, DEFAULT_PROGRESS_ESTIMATION_REFRESH_MS)
	}

	private stopProgressEstimation() {
		clearInterval(this.progressEstimation)
	}

	async refreshLocalImportState() {
		const importFacade = assertNotNull(this.nativeMailImportFacade)
		const localState = await importFacade.getImportState((await this.getMailbox())._id)
		if (localState) {
			this.onNewLocalImportMailState(localState)
		} else if (this.uiStatus != UiImportStatus.Paused) {
			this.resetStatus()
		}
	}

	/**
	 * New localImportMailState event received from native mail import process.
	 * Used to update import progress locally without sending entityEvents.
	 * @param localImportMailState
	 */
	async onNewLocalImportMailState(localImportMailState: LocalImportMailState): Promise<void> {
		const previousState = this.activeImport
		if (localImportMailState.status == ImportStatus.Error) {
			this.resetStatus()
			if (!this.isLastRunFailed) {
				this.isLastRunFailed = true
				await Dialog.message("mailImportErrorServiceUnavailable_msg")
				await assertNotNull(this.nativeMailImportFacade).setStopProgressAction((await this.getMailbox())._id)
			}
		} else {
			this.activeImport = localImportMailState
			if (
				!previousState ||
				previousState.status !== localImportMailState.status ||
				previousState.successfulMails !== localImportMailState.successfulMails ||
				previousState.totalMails !== localImportMailState.totalMails
			) {
				this.uiStatus = importStatusToUiImportStatus(this.activeImport.status)
				this.updateProgressMonitorTotalWork(localImportMailState.totalMails)
				this.progressMonitor?.totalWorkDone(localImportMailState.successfulMails + localImportMailState.failedMails)
				if (localImportMailState.status == ImportStatus.Finished) this.stopProgressEstimation()
			}
		}
		m.redraw()
	}

	async newImportStateFromServer(serverState: ImportMailState) {
		const wasUpdatedForThisImport = isSameId(this.activeImport?.remoteStateId ?? null, serverState._id)

		const remoteStatus = parseInt(serverState.status) as ImportStatus
		if (wasUpdatedForThisImport) {
			if (remoteStatus == ImportStatus.Paused) {
				this.activeImport = remoteStateAsLocal(serverState, this.activeImport)
				this.uiStatus = UiImportStatus.Paused
				m.redraw()
				return
			} else if (isFinalisedImport(remoteStatus)) {
				this.resetStatus()
			}
		}

		if (isFinalisedImport(remoteStatus)) {
			this.updateFinalisedImport(elementIdPart(serverState._id), serverState)
		}
		m.redraw()
	}

	private resetStatus() {
		this.activeImport = null
		this.progressMonitor = null
		this.progress = 0
		this.stopProgressEstimation()
		this.uiStatus = UiImportStatus.Idle
	}

	async connectionStateListener(wsStream: Stream<WsConnectionState>) {
		wsStream.map(async (wsConnection) => {
			console.log("Importer says client connection is: " + wsConnection)

			// Importer will never it the loop if the client connection is offline,
			// as we don't have timeout on `dyn RestClient` yet.
			// this will put the ui to paused state immediately and
			// importer to paused state once client is back online ( after it can err/sucess current chunk )
			const haveImportOngoing = this.shouldShowImportStatus()
			this.wsConnectionOnline = wsConnection === WsConnectionState.connected
			if (haveImportOngoing && !this.wsConnectionOnline) {
				this.stopProgressEstimation()
				this.uiStatus = UiImportStatus.Paused
				m.redraw()
				assertNotNull(this.nativeMailImportFacade).setPausedProgressAction((await this.getMailbox())._id)
			}
		})
	}

	getProgress() {
		return Math.round(this.progress)
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

function remoteStateAsLocal(remoteState: ImportMailState, activeImport: LocalImportMailState | null = null): LocalImportMailState {
	return {
		failedMails: parseInt(remoteState.failedMails),
		remoteStateId: remoteState._id,
		start_timestamp: generatedIdToTimestamp(elementIdPart(remoteState._id)),
		status: parseInt(remoteState.status),
		successfulMails: parseInt(remoteState.successfulMails),
		totalMails: activeImport ? activeImport?.totalMails : DEFAULT_TOTAL_WORK,
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
		case ImportStatus.Error:
			return UiImportStatus.Error
	}
}

export const enum ImportStatus {
	Running = 0,
	Paused = 1,
	Canceled = 2,
	Finished = 3,
	Error = 4,
}

export function isFinalisedImport(remoteImportStatus: ImportStatus): boolean {
	return remoteImportStatus == ImportStatus.Canceled || remoteImportStatus == ImportStatus.Finished
}
