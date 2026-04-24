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
import { ImapError } from "./imapmail/ImapError"

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

	async startSyncSession(imapSyncState: ImapSyncState): Promise<void> {
		if (this.state !== SyncSessionState.RUNNING) {
			this.state = SyncSessionState.RUNNING
			this.imapSyncState = imapSyncState
			this.runningSyncSessionProcesses = new Map()
			this.downloadedQuotas = []
			this.runSyncSession()
		}
		return
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

		console.log("on shutdownsync session got..", shutdownSyncAction)
		if (shutdownSyncAction === ShutdownSyncAction.POSTPONE) {
			this.state = SyncSessionState.POSTPONED
			console.log("on shutdown sync we set the postponed to be further...", Date.now() + postponeDuration)
			this.adSyncEventListener.onPostpone(Date.now() + postponeDuration)
		} else if (shutdownSyncAction === ShutdownSyncAction.AUTH_FAIL) {
			console.log("Failed Authentication... inform listener...")
			this.adSyncEventListener.onError(new ImapError("Authentication failed, please check your password"))
		}
	}

	private async runSyncSession() {
		let mailboxes = await this.setupSyncSession()

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
	}

	private async setupSyncSession(): Promise<ImapSyncSessionMailbox[] | null> {
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
			console.log("caught an error during setup sync", error)
			let syncAction = ShutdownSyncAction.UNKNOWN
			if (error?.serverResponseCode === "AUTHENTICATIONFAILED") {
				syncAction = ShutdownSyncAction.AUTH_FAIL
			} else {
				syncAction = ShutdownSyncAction.POSTPONE
			}
			await this.shutDownSyncSession(syncAction, ERROR_POSTPONE_TIME)
			return null
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
