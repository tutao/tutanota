import { ImapSyncSessionMailbox, SyncSessionMailboxImportance } from "./ImapSyncSessionMailbox.js"
import { ImapMailboxState, ImapSyncState } from "./ImapSyncState.js"
import { AdSyncEventListener, AdSyncEventType } from "./AdSyncEventListener.js"
import { AdSyncParallelProcessesOptimizer } from "./optimizer/processesoptimizer/AdSyncParallelProcessesOptimizer.js"
import { ImapSyncSessionProcess, SyncSessionProcessState } from "./ImapSyncSessionProcess.js"
import { AdSyncDownloadBatchSizeOptimizer } from "./optimizer/AdSyncDownloadBatchSizeOptimizer.js"
import { ProgrammingError } from "@tutao/app-env"
import { ImapFlow } from "imapflow"
import { ImapMailbox } from "../../../api/common/utils/imapImportUtils/ImapMailbox.js"
import { AdSyncConfig } from "./ImapAdSync.js"
import { AdSyncSingleProcessesOptimizer } from "./optimizer/processesoptimizer/AdSyncSingleProcessesOptimizer.js"
import { AdSyncProcessesOptimizer } from "./optimizer/processesoptimizer/AdSyncProcessesOptimizer.js"
import { ImapError, ImapErrorCause } from "./imapmail/ImapError"

const DOWNLOADED_QUOTA_SAFETY_THRESHOLD: number = 50000000 // in byte
const DEFAULT_POSTPONE_TIME: number = 24 * 60 * 60 * 1000 // 24 hours
const ERROR_POSTPONE_TIME: number = 60 * 1000 // 60 seconds

export enum SyncSessionState {
	RUNNING,
	PAUSED,
	POSTPONED,
	FINISHED,
}

export enum ShutdownSyncAction {
	NONE,
	POSTPONE,
	AUTH_FAIL,
	UNKNOWN,
}

export interface SyncSessionEventListener {
	onStartSyncSessionProcess(processId: number, syncSessionMailbox: ImapSyncSessionMailbox): void

	onStopSyncSessionProcess(processId: number): void

	onDownloadQuotaUpdate(downloadedQuota: number): void

	onAllMailboxesFinish(): Promise<void>
}

export class ImapSyncSession implements SyncSessionEventListener {
	private state: SyncSessionState
	private imapSyncState?: ImapSyncState
	private adSyncOptimizer?: AdSyncProcessesOptimizer
	private runningSyncSessionProcesses: Map<number, ImapSyncSessionProcess> = new Map()
	private downloadedQuotas: number[] = []

	constructor(
		private adSyncEventListener: AdSyncEventListener,
		private adSyncConfig: AdSyncConfig,
	) {
		this.state = SyncSessionState.PAUSED
	}

	async startSyncSession(imapSyncState: ImapSyncState): Promise<ImapError | null> {
		if (this.state !== SyncSessionState.RUNNING) {
			this.state = SyncSessionState.RUNNING
			this.imapSyncState = imapSyncState
			this.runningSyncSessionProcesses = new Map()
			this.downloadedQuotas = []
			const runSyncResult = await this.runSyncSession()
			if (runSyncResult !== null) {
				this.state = SyncSessionState.PAUSED
				return runSyncResult
			}
		}
		return null
	}

	async stopSyncSession(): Promise<void> {
		await this.shutDownSyncSession()
		return
	}

	private async shutDownSyncSession(shutdownSyncAction: ShutdownSyncAction = ShutdownSyncAction.NONE, postponeDuration: number = DEFAULT_POSTPONE_TIME) {
		this.state = SyncSessionState.PAUSED

		this.adSyncOptimizer?.stopAdSyncOptimizer()
		for (const syncSessionProcess of this.runningSyncSessionProcesses.values()) {
			syncSessionProcess.stopSyncSessionProcess()
		}
		this.runningSyncSessionProcesses.clear()

		if (shutdownSyncAction === ShutdownSyncAction.POSTPONE) {
			this.state = SyncSessionState.POSTPONED
			this.adSyncEventListener.onPostpone(Date.now() + postponeDuration)
		} else if (shutdownSyncAction === ShutdownSyncAction.AUTH_FAIL) {
			// This should only happen now in case Auth is changed on imap server *after* being
			// configured or something expired.
			this.adSyncEventListener.onError(new ImapError("Authentication failed, please check your password"))
		} else {
			this.adSyncEventListener.onError(new ImapError("An unknown error happened, " + shutdownSyncAction))
		}
	}

	private async runSyncSession(): Promise<ImapError | null> {
		let setupResult = await this.setupSyncSession()
		if (setupResult instanceof ImapError) {
			return setupResult as ImapError
		}
		let mailboxes = setupResult as ImapSyncSessionMailbox[]

		// We probably want to get rid of optimizer.
		if (mailboxes != null) {
			if (this.adSyncConfig.isEnableParallelProcessesOptimizer) {
				this.adSyncOptimizer = new AdSyncParallelProcessesOptimizer(
					mailboxes,
					this.adSyncConfig.parallelProcessesOptimizationDifference,
					this.adSyncConfig.optimizationInterval,
					this,
				)
			} else {
				// start AdSyncSingleProcessesOptimizer with optimizationDifference and optimizationInterval of zero (0) (always open only a single mailbox (i.e. folder) at a time)
				this.adSyncOptimizer = new AdSyncSingleProcessesOptimizer(mailboxes, this)
			}
			this.adSyncOptimizer.startAdSyncOptimizer()
		}
		return null
	}

	private async setupSyncSession(): Promise<ImapSyncSessionMailbox[] | ImapError> {
		if (!this.imapSyncState) {
			throw new ProgrammingError("The ImapSyncState has not been set!")
		}

		let knownMailboxes = this.imapSyncState.imapMailboxStates.map((mailboxState) => {
			return new ImapSyncSessionMailbox(mailboxState, this.adSyncConfig.defaultDownloadBatchSize, this.adSyncConfig.processesTimeToLive)
		})

		let imapAccount = this.imapSyncState.imapAccount
		const imapClient = new ImapFlow({
			host: imapAccount.host,
			port: imapAccount.port,
			secure: false,
			auth: {
				user: imapAccount.username,
				pass: imapAccount.password,
				accessToken: imapAccount.accessToken,
			},
		})

		try {
			await imapClient.connect()
			let listTreeResponse = await imapClient.listTree()
			await imapClient.logout()

			let fetchedRootMailboxes = listTreeResponse.folders!.map((listTreeResponse) => {
				return ImapMailbox.fromImapFlowListTreeResponse(listTreeResponse, null)
			})
			return this.getSyncSessionMailboxes(knownMailboxes, fetchedRootMailboxes)
		} catch (error) {
			console.log("we are getting errors still, error")
			let syncAction = ShutdownSyncAction.UNKNOWN
			if (error?.serverResponseCode === "AUTHENTICATIONFAILED") {
				return new ImapError(error, ImapErrorCause.AUTH_FAILED)
			} else {
				// For now any other error we are postponing...
				// TODO: Find which error cases are the valid ones for postponing.
				console.log("The error on postpone was: ", error)
				syncAction = ShutdownSyncAction.POSTPONE
			}
			await this.shutDownSyncSession(syncAction, ERROR_POSTPONE_TIME)
			return new ImapError(error)
		}
	}

	private getSyncSessionMailboxes(knownMailboxes: ImapSyncSessionMailbox[], fetchedRootMailboxes: ImapMailbox[]): ImapSyncSessionMailbox[] {
		let resultMailboxes: ImapSyncSessionMailbox[] = []
		for (const fetchedRootMailbox of fetchedRootMailboxes) {
			resultMailboxes.push(...this.traverseImapMailboxes(knownMailboxes, fetchedRootMailbox))
		}

		knownMailboxes.map((knownMailbox) => {
			let index = resultMailboxes.findIndex((mailbox) => {
				return mailbox.mailboxState.path === knownMailbox.mailboxState.path
			})

			if (index === -1) {
				let deletedImapMailbox = ImapMailbox.fromSyncSessionMailbox(knownMailbox)
				this.adSyncEventListener.onMailbox(deletedImapMailbox, AdSyncEventType.DELETE)
				return true
			}

			return false
		})

		return resultMailboxes
	}

	private traverseImapMailboxes(knownMailboxes: ImapSyncSessionMailbox[], imapMailbox: ImapMailbox): ImapSyncSessionMailbox[] {
		let result: ImapSyncSessionMailbox[] = []

		let syncSessionMailbox = knownMailboxes.find((value) => value.mailboxState.path === imapMailbox.path)
		if (syncSessionMailbox === undefined) {
			this.adSyncEventListener.onMailbox(imapMailbox, AdSyncEventType.CREATE)
			syncSessionMailbox = new ImapSyncSessionMailbox(
				ImapMailboxState.fromImapMailbox(imapMailbox),
				this.adSyncConfig.defaultDownloadBatchSize,
				this.adSyncConfig.processesTimeToLive,
			)
		}

		if (imapMailbox.specialUse) {
			syncSessionMailbox.specialUse = imapMailbox.specialUse
		}

		// some settings lead to importance "NO_SYNC" which means that the mailbox should not be imported / migrated
		if (syncSessionMailbox.importance !== SyncSessionMailboxImportance.NO_SYNC) {
			result.push(syncSessionMailbox)
		}

		if (imapMailbox.subFolders) {
			for (const imapMailbox1 of imapMailbox.subFolders) {
				result.push(...this.traverseImapMailboxes(knownMailboxes, imapMailbox1))
			}
		}
		return result
	}

	onStartSyncSessionProcess(processId: number, nextMailboxToDownload: ImapSyncSessionMailbox): void {
		if (this.state === SyncSessionState.RUNNING) {
			console.log("onStartSyncSessionProcess : processId: " + processId + " -> " + nextMailboxToDownload.mailboxState.path)

			if (!this.adSyncOptimizer) {
				throw new ProgrammingError("The SyncSessionEventListener should be exclusively used by the AdSyncEfficiencyScoreOptimizer!")
			}

			if (!this.imapSyncState) {
				throw new ProgrammingError("The ImapSyncState has not been set!")
			}

			let adSyncDownloadBlatchSizeOptimizer = new AdSyncDownloadBatchSizeOptimizer(
				nextMailboxToDownload,
				this.adSyncConfig.downloadBatchSizeOptimizationDifference,
				this.adSyncConfig.optimizationInterval,
			)
			let syncSessionProcess = new ImapSyncSessionProcess(processId, adSyncDownloadBlatchSizeOptimizer, this.adSyncOptimizer, this.adSyncConfig)

			this.runningSyncSessionProcesses.set(syncSessionProcess.processId, syncSessionProcess)
			syncSessionProcess.startSyncSessionProcess(this.imapSyncState.imapAccount, this.adSyncEventListener).then((state) => {
				if (state === SyncSessionProcessState.CONNECTION_FAILED_REJECTED) {
					this.adSyncOptimizer?.forceStopSyncSessionProcess(processId, true)
				} else if (state === SyncSessionProcessState.CONNECTION_FAILED_UNKNOWN) {
					this.adSyncOptimizer?.forceStopSyncSessionProcess(processId, false)
				} else {
					if (this.adSyncConfig.isEnableDownloadBatchSizeOptimizer && this.state === SyncSessionState.RUNNING) {
						adSyncDownloadBlatchSizeOptimizer.startAdSyncOptimizer()
					}
				}
			})
		}
	}

	onStopSyncSessionProcess(nextProcessIdToDrop: number): void {
		console.log("onStopSyncSessionProcess : processId: " + nextProcessIdToDrop)

		let syncSessionProcessToDrop = this.runningSyncSessionProcesses.get(nextProcessIdToDrop)

		syncSessionProcessToDrop?.stopSyncSessionProcess()
		this.runningSyncSessionProcesses.delete(nextProcessIdToDrop)
	}

	onDownloadQuotaUpdate(downloadedQuota: number): void {
		this.downloadedQuotas.push(downloadedQuota)

		if (!this.imapSyncState) {
			throw new ProgrammingError("The ImapSyncState has not been set!")
		}

		let downloadedQuotaTotal = this.downloadedQuotas.reduce((quotaSum, quota) => quotaSum + quota, 0)
		if (downloadedQuotaTotal > this.imapSyncState.maxQuota - DOWNLOADED_QUOTA_SAFETY_THRESHOLD) {
			this.shutDownSyncSession(ShutdownSyncAction.POSTPONE)
		}
	}

	async onAllMailboxesFinish(): Promise<void> {
		console.log("onAllMailboxesFinish")
		if (this.state !== SyncSessionState.FINISHED) {
			this.state = SyncSessionState.FINISHED
			await this.shutDownSyncSession()

			let downloadedQuotaTotal = this.downloadedQuotas.reduce((quotaSum, quota) => quotaSum + quota, 0)
			this.adSyncEventListener.onFinish(downloadedQuotaTotal)
		}
	}
}
