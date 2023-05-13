import { ImapMailboxState } from "./ImapSyncState.js"
import {
	AverageEfficiencyScore,
	AverageThroughput,
	DownloadBatchSize,
	getAverageOfList,
	Throughput,
	TimeIntervalTimeStamp,
	TimeStamp,
} from "./utils/AdSyncUtils.js"
import { ImapMailboxSpecialUse } from "./imapmail/ImapMailbox.js"

export enum SyncSessionMailboxImportance {
	NO_SYNC = 0,
	LOW = 1,
	MEDIUM = 2,
	HIGH = 3,
}

export class ImapSyncSessionMailbox {
	mailboxState: ImapMailboxState
	downloadBatchSize: number
	mailCount: number | null = 0
	timeToLiveInterval: number = 10 // in seconds
	importance: SyncSessionMailboxImportance = SyncSessionMailboxImportance.MEDIUM
	lastFetchedMailSeq = 0

	private _specialUse: ImapMailboxSpecialUse | null = null
	private throughputHistory: Map<TimeStamp, Throughput> = new Map<TimeStamp, Throughput>()
	private averageThroughputInTimeIntervalHistory: Map<TimeIntervalTimeStamp, AverageThroughput> = new Map<TimeIntervalTimeStamp, AverageThroughput>()
	private downloadBatchSizeHistory: Map<TimeStamp, DownloadBatchSize> = new Map<TimeStamp, DownloadBatchSize>()

	constructor(mailboxState: ImapMailboxState, downloadBatchSize: number) {
		this.mailboxState = mailboxState
		this.downloadBatchSize = downloadBatchSize
	}

	get specialUse(): ImapMailboxSpecialUse | null {
		return this._specialUse
	}

	set specialUse(value: ImapMailboxSpecialUse | null) {
		this._specialUse = value

		switch (this._specialUse) {
			case ImapMailboxSpecialUse.INBOX:
				this.importance = SyncSessionMailboxImportance.HIGH
				break
			case ImapMailboxSpecialUse.TRASH:
			case ImapMailboxSpecialUse.ARCHIVE:
			case ImapMailboxSpecialUse.ALL:
			case ImapMailboxSpecialUse.SENT:
				this.importance = SyncSessionMailboxImportance.LOW
				break
			case ImapMailboxSpecialUse.JUNK:
				this.importance = SyncSessionMailboxImportance.NO_SYNC
				break
			default:
				this.importance = SyncSessionMailboxImportance.MEDIUM
				break
		}
	}

	getAverageThroughputInTimeInterval(fromTimeStamp: TimeStamp, toTimeStamp: TimeStamp): AverageThroughput {
		let throughputsInTimeInterval = [...this.throughputHistory.entries()]
			.filter(([timeStamp, _throughput]) => {
				return timeStamp >= fromTimeStamp && timeStamp < toTimeStamp
			})
			.map(([_timeStamp, throughput]) => {
				return throughput
			})
		let averageThroughputInTimeInterval = getAverageOfList(throughputsInTimeInterval)
		this.averageThroughputInTimeIntervalHistory.set(`${fromTimeStamp}${toTimeStamp}`, averageThroughputInTimeInterval)
		return averageThroughputInTimeInterval
	}

	getAverageEfficiencyScoreInTimeInterval(fromTimeStamp: TimeStamp, toTimeStamp: TimeStamp): AverageEfficiencyScore {
		let key = `${fromTimeStamp}${toTimeStamp}`
		let averageExists = this.averageThroughputInTimeIntervalHistory.has(key)
		return (
			this.importance *
			(averageExists ? this.averageThroughputInTimeIntervalHistory.get(key)! : this.getAverageThroughputInTimeInterval(fromTimeStamp, toTimeStamp))
		)
	}

	getDownloadBatchSizeInTimeInterval(fromTimeStamp: TimeStamp, toTimeStamp: TimeStamp): DownloadBatchSize {
		let downloadBatchSizeInTimeInterval = [...this.downloadBatchSizeHistory.entries()]
			.filter(([timeStamp, _downloadBatchSize]) => {
				return timeStamp >= fromTimeStamp && timeStamp < toTimeStamp
			})
			.map(([_timeStamp, downloadBatchSize]) => {
				return downloadBatchSize
			})
			.at(-1)
		if (downloadBatchSizeInTimeInterval !== undefined) {
			return downloadBatchSizeInTimeInterval
		} else {
			return this.downloadBatchSize
		}
	}

	reportCurrentThroughput(throughput: Throughput) {
		this.throughputHistory.set(Date.now(), throughput)
	}

	reportDownloadBatchSizeUsage(downloadBatchSize?: DownloadBatchSize) {
		// -1 indicates IMAP QRESYNC
		this.downloadBatchSizeHistory.set(Date.now(), downloadBatchSize ? downloadBatchSize : -1)
	}
}
