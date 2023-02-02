import { AdSyncOptimizer } from "../AdSyncOptimizer.js"
import { ImapSyncSessionMailbox } from "../../ImapSyncSessionMailbox.js"
import { SyncSessionEventListener } from "../../ImapSyncSession.js"
import { TimeStamp } from "../../utils/AdSyncUtils.js"

export interface AdSyncProcessesOptimizerEventListener {
	onDownloadUpdate(processId: number, syncSessionMailbox: ImapSyncSessionMailbox, downloadedQuota: number): void

	onMailboxFinish(processId: number, syncSessionMailbox: ImapSyncSessionMailbox): void

	onMailboxInterrupted(processId: number, syncSessionMailbox: ImapSyncSessionMailbox): void
}

export class OptimizerProcess {
	mailboxPath: string
	processStartTime: TimeStamp = Date.now()
	syncSessionMailbox?: ImapSyncSessionMailbox

	constructor(mailboxPath: string) {
		this.mailboxPath = mailboxPath
	}
}

export class AdSyncProcessesOptimizer extends AdSyncOptimizer implements AdSyncProcessesOptimizerEventListener {
	protected scheduler?: NodeJS.Timer
	private readonly optimizedSyncSessionMailboxes: ImapSyncSessionMailbox[]
	private syncSessionEventListener: SyncSessionEventListener
	protected runningProcessMap = new Map<number, OptimizerProcess>()
	private nextProcessId: number = 0

	constructor(
		mailboxes: ImapSyncSessionMailbox[],
		optimizationDifference: number,
		optimizationInterval: number,
		syncSessionEventListener: SyncSessionEventListener,
	) {
		super(optimizationDifference, optimizationInterval)
		this.optimizedSyncSessionMailboxes = mailboxes
		this.syncSessionEventListener = syncSessionEventListener
	}

	protected optimize(): void {
		// empty optimize
		// overwritten by AdSyncParallelProcessesOptimizer
		// **not** overwritten by AdSyncSingleProcessesOptimizer
	}

	protected startSyncSessionProcesses(amount: number) {
		let nextMailboxesToDownload = this.nextMailboxesToDownload(amount)

		nextMailboxesToDownload.forEach((mailbox) => {
			if (!this.isExistRunningProcessForMailbox(mailbox)) {
				// we only allow one process per IMAP folder
				this.runningProcessMap.set(this.nextProcessId, new OptimizerProcess(mailbox.mailboxState.path))
				this.syncSessionEventListener.onStartSyncSessionProcess(this.nextProcessId, mailbox)
				this.nextProcessId += 1
			}
		})
	}

	protected stopSyncSessionProcesses(amount: number) {
		let nextProcessIdsToDrop = this.nextProcessIdsToDrop(amount)

		nextProcessIdsToDrop.forEach((processId) => {
			let mailboxToDrop = this.runningProcessMap.get(processId)
			if (mailboxToDrop) {
				let timeToLiveIntervalMS = 1000 * (mailboxToDrop.syncSessionMailbox?.timeToLive ? mailboxToDrop.syncSessionMailbox?.timeToLive : 0) // conversion to milliseconds

				// a process may run at least its timeToLiveInterval in seconds
				if (mailboxToDrop.processStartTime + timeToLiveIntervalMS <= Date.now()) {
					if (mailboxToDrop.syncSessionMailbox) {
						let index = this.optimizedSyncSessionMailboxes.findIndex((mailbox) => {
							return mailbox.mailboxState.path == mailboxToDrop!.mailboxPath
						})
						this.optimizedSyncSessionMailboxes[index] = mailboxToDrop.syncSessionMailbox
					}
					this.runningProcessMap.delete(processId)
					this.syncSessionEventListener.onStopSyncSessionProcess(processId)
				}
			}
		})
	}

	protected nextMailboxesToDownload(amount: number): ImapSyncSessionMailbox[] {
		return this.optimizedSyncSessionMailboxes
			.filter((mailbox) => !this.isExistRunningProcessForMailbox(mailbox)) // we only allow one process per IMAP folder
			.sort((a, b) => b.importance - a.importance)
			.slice(0, amount)
	}

	protected nextProcessIdsToDrop(amount: number): number[] {
		let currentInterval = this.getCurrentTimeStampInterval()
		return [...this.runningProcessMap.entries()]
			.filter(([_processId, value]) => {
				return value.syncSessionMailbox !== undefined
			})
			.sort(([_processIdA, valueA], [_processIdB, valueB]) => {
				let averageEfficiencyScoreA = valueA.syncSessionMailbox!.getAverageEfficiencyScoreInTimeInterval(
					currentInterval.fromTimeStamp,
					currentInterval.toTimeStamp,
				)
				let averageEfficiencyScoreB = valueB.syncSessionMailbox!.getAverageEfficiencyScoreInTimeInterval(
					currentInterval.fromTimeStamp,
					currentInterval.toTimeStamp,
				)
				return averageEfficiencyScoreB - averageEfficiencyScoreA
			})
			.map(([processId, _value]) => processId)
			.slice(0, amount)
	}

	protected isExistRunningProcessForMailbox(mailbox: ImapSyncSessionMailbox) {
		return Array.from(this.runningProcessMap.values()).find((optimizerProcess) => {
			return optimizerProcess.mailboxPath == mailbox.mailboxState.path
		})
	}

	forceStopSyncSessionProcess(processId: number, isExceededRateLimit: boolean = false) {
		this.runningProcessMap.delete(processId)
		this.syncSessionEventListener.onStopSyncSessionProcess(processId)
	}

	onDownloadUpdate(processId: number, syncSessionMailbox: ImapSyncSessionMailbox, downloadedQuota: number): void {
		let optimizerProcess = this.runningProcessMap.get(processId)
		if (optimizerProcess) {
			optimizerProcess.syncSessionMailbox = syncSessionMailbox
			this.runningProcessMap.set(processId, optimizerProcess)

			this.syncSessionEventListener.onDownloadQuotaUpdate(downloadedQuota)
		}
	}

	onMailboxFinish(processId: number, syncSessionMailbox: ImapSyncSessionMailbox): void {
		this.syncSessionEventListener.onStopSyncSessionProcess(processId)

		let mailboxIndex = this.optimizedSyncSessionMailboxes.findIndex((mailbox) => {
			return mailbox.mailboxState.path == syncSessionMailbox.mailboxState.path
		})
		if (mailboxIndex != -1) {
			let isLastMailboxFinish = this.optimizedSyncSessionMailboxes.length == 1
			this.optimizedSyncSessionMailboxes.splice(mailboxIndex, 1)

			this.runningProcessMap.delete(processId)

			// call onAllMailboxesFinish() once download of all IMAP folders is finished
			if (isLastMailboxFinish) {
				this.syncSessionEventListener.onAllMailboxesFinish()
			} else {
				// start a new sync session processes in replacement for the finished one
				this.startSyncSessionProcesses(1)
			}
		}
	}

	onMailboxInterrupted(processId: number, syncSessionMailbox: ImapSyncSessionMailbox): void {
		this.syncSessionEventListener.onStopSyncSessionProcess(processId)

		let mailboxIndex = this.optimizedSyncSessionMailboxes.findIndex((mailbox) => {
			return mailbox.mailboxState.path == syncSessionMailbox.mailboxState.path
		})

		if (mailboxIndex != -1) {
			this.optimizedSyncSessionMailboxes[mailboxIndex] = syncSessionMailbox
			this.runningProcessMap.delete(processId)

			// start a new sync session processes in replacement for the interrupted one
			this.startSyncSessionProcesses(1)
		}
	}
}
