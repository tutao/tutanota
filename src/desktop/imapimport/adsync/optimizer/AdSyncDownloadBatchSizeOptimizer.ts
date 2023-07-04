import { AdSyncOptimizer, THROUGHPUT_THRESHOLD } from "./AdSyncOptimizer.js"
import { ImapSyncSessionMailbox } from "../ImapSyncSessionMailbox.js"

export class AdSyncDownloadBatchSizeOptimizer extends AdSyncOptimizer {
	protected _optimizedSyncSessionMailbox: ImapSyncSessionMailbox
	protected scheduler?: NodeJS.Timer

	constructor(syncSessionMailbox: ImapSyncSessionMailbox, optimizationDifference: number, optimizationInterval: number) {
		super(optimizationDifference, optimizationInterval)
		this._optimizedSyncSessionMailbox = syncSessionMailbox
	}

	override startAdSyncOptimizer(): void {
		super.startAdSyncOptimizer()
		this.scheduler = setInterval(this.optimize.bind(this), this.optimizationInterval * 1000) // every optimizationInterval seconds
	}

	get optimizedSyncSessionMailbox(): ImapSyncSessionMailbox {
		return this._optimizedSyncSessionMailbox
	}

	protected optimize(): void {
		let currentInterval = this.getCurrentTimeStampInterval()
		let lastInterval = this.getLastTimeStampInterval()
		let averageThroughputCurrent = this.optimizedSyncSessionMailbox.getAverageThroughputInTimeInterval(
			currentInterval.fromTimeStamp,
			currentInterval.toTimeStamp,
		)
		let averageThroughputLast = this.optimizedSyncSessionMailbox.getAverageThroughputInTimeInterval(lastInterval.fromTimeStamp, lastInterval.toTimeStamp)

		// TODO remove logging
		console.log(
			"(DownloadBatchSizeOptimizer -> " +
				this.optimizedSyncSessionMailbox.mailboxState.path +
				" : last downloadBatchSize | " +
				this.optimizedSyncSessionMailbox.downloadBatchSize +
				" |) Throughput stats: ... | " +
				averageThroughputLast +
				" | " +
				averageThroughputCurrent +
				" |",
		)

		let downloadBatchSizeCurrent = this.optimizedSyncSessionMailbox.getDownloadBatchSizeInTimeInterval(
			currentInterval.fromTimeStamp,
			currentInterval.toTimeStamp,
		)
		let downloadBatchSizeLast = this.optimizedSyncSessionMailbox.getDownloadBatchSizeInTimeInterval(lastInterval.fromTimeStamp, lastInterval.toTimeStamp)
		let downloadBatchSizeDidIncrease = downloadBatchSizeCurrent - downloadBatchSizeLast >= 0

		if (averageThroughputCurrent + THROUGHPUT_THRESHOLD >= averageThroughputLast) {
			if (downloadBatchSizeDidIncrease) {
				this.optimizedSyncSessionMailbox.downloadBatchSize = this.optimizedSyncSessionMailbox.downloadBatchSize + this.optimizationDifference
			} else if (this.optimizedSyncSessionMailbox.downloadBatchSize - this.optimizationDifference > 0) {
				this.optimizedSyncSessionMailbox.downloadBatchSize = this.optimizedSyncSessionMailbox.downloadBatchSize - this.optimizationDifference
			}
		} else {
			if (downloadBatchSizeDidIncrease && this.optimizedSyncSessionMailbox.downloadBatchSize - this.optimizationDifference > 0) {
				this.optimizedSyncSessionMailbox.downloadBatchSize = this.optimizedSyncSessionMailbox.downloadBatchSize - this.optimizationDifference
			}
		}

		this.optimizerUpdateTimeStampHistory.push(currentInterval.toTimeStamp)
	}
}
