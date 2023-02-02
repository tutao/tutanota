import { OptimizerUpdateAction, THROUGHPUT_THRESHOLD } from "../AdSyncOptimizer.js"
import { AverageThroughput, TimeStamp } from "../../utils/AdSyncUtils.js"
import { ProgrammingError } from "../../../../../api/common/error/ProgrammingError.js"
import { AdSyncProcessesOptimizer, OptimizerProcess } from "./AdSyncProcessesOptimizer.js"

const MINIMUM_PARALLEL_PROCESSES = 2
const MAX_PARALLEL_PROCESSES = 15

export class AdSyncParallelProcessesOptimizer extends AdSyncProcessesOptimizer {
	private optimizerUpdateActionHistory: OptimizerUpdateAction[] = [OptimizerUpdateAction.NO_UPDATE]
	private maxParallelProcesses: number = MAX_PARALLEL_PROCESSES

	override startAdSyncOptimizer(): void {
		super.startAdSyncOptimizer()
		this.scheduler = setInterval(this.optimize.bind(this), this.optimizationInterval * 1000) // every optimizationInterval seconds
		this.optimize() // call once to start downloading of mails
	}

	override optimize(): void {
		let currentInterval = this.getCurrentTimeStampInterval()
		let lastInterval = this.getLastTimeStampInterval()
		let combinedAverageThroughputCurrent = this.getCombinedAverageThroughputInTimeInterval(currentInterval.fromTimeStamp, currentInterval.toTimeStamp)
		let combinedAverageThroughputLast = this.getCombinedAverageThroughputInTimeInterval(lastInterval.fromTimeStamp, lastInterval.toTimeStamp)

		// TODO remove logging
		console.log("(ParallelProcessOptimizer) Throughput stats: ... | " + combinedAverageThroughputLast + " | " + combinedAverageThroughputCurrent + " |")

		let lastUpdateAction = this.optimizerUpdateActionHistory.at(-1)
		if (lastUpdateAction === undefined) {
			throw new ProgrammingError("The optimizerUpdateActionHistory has not been initialized correctly!")
		}

		if (combinedAverageThroughputCurrent + THROUGHPUT_THRESHOLD >= combinedAverageThroughputLast) {
			if (lastUpdateAction != OptimizerUpdateAction.DECREASE) {
				if (this.runningProcessMap.size < this.maxParallelProcesses) {
					this.startSyncSessionProcesses(this.optimizationDifference)
					this.optimizerUpdateActionHistory.push(OptimizerUpdateAction.INCREASE)
				} else {
					this.optimizerUpdateActionHistory.push(OptimizerUpdateAction.NO_UPDATE)
				}
			} else if (this.runningProcessMap.size > 1) {
				this.stopSyncSessionProcesses(1)
				this.optimizerUpdateActionHistory.push(OptimizerUpdateAction.DECREASE)
			}
		} else {
			if (lastUpdateAction == OptimizerUpdateAction.INCREASE && this.runningProcessMap.size > 1) {
				this.stopSyncSessionProcesses(1)
				this.optimizerUpdateActionHistory.push(OptimizerUpdateAction.DECREASE)
			}
		}

		this.optimizerUpdateTimeStampHistory.push(currentInterval.toTimeStamp)
	}

	private getCombinedAverageThroughputInTimeInterval(fromTimeStamp: TimeStamp, toTimeStamp: TimeStamp): AverageThroughput {
		if (this.runningProcessMap.size == 0) {
			return 0
		} else {
			return [...this.runningProcessMap.values()].reduce<AverageThroughput>((acc: AverageThroughput, value: OptimizerProcess) => {
				if (value.syncSessionMailbox) {
					acc += value.syncSessionMailbox.getAverageThroughputInTimeInterval(fromTimeStamp, toTimeStamp)
				}
				return acc
			}, 0)
		}
	}

	forceStopSyncSessionProcess(processId: number, isExceededRateLimit: boolean = false) {
		if (isExceededRateLimit && this.runningProcessMap.size >= MINIMUM_PARALLEL_PROCESSES) {
			this.maxParallelProcesses = this.runningProcessMap.size - 1
		}

		super.forceStopSyncSessionProcess(processId)
	}
}
