import { IProgressMonitor, ProgressListener } from "./ProgressMonitor"
import { first, last } from "@tutao/tutanota-utils"

const DEFAULT_RATE_PER_SECOND = 0.5
const DEFAULT_PROGRESS_ESTIMATION_REFRESH_MS: number = 1000
const MINIMUM_HISTORY_LENGTH_FOR_ESTIMATION = 3
const RATE_PER_SECOND_ESTIMATION_SCALING_RATIO: number = 0.75

const WORK_MAX_PERCENTAGE = 100
const WORK_COMPLETED_MIN = 0

/**
 * Class to calculate percentage of total work and report it back.
 * Call {@code workDone() or @code totalWorkDone} for each work step and
 * {@code completed()} when you are done.
 * EstimatingProgressMonitor works the same as the {@link ProgressMonitor}, but
 * additionally **estimates** progress internally on the go.
 */
export class EstimatingProgressMonitor implements IProgressMonitor {
	workCompleted: number
	ratePerSecondHistory: Array<Readonly<[number, number]>> = Array.of([Date.now(), DEFAULT_RATE_PER_SECOND]) // entries: timestamp, rate per second
	totalWork: number
	progressEstimation: TimeoutID

	constructor(totalWork: number, private readonly updater: ProgressListener) {
		this.workCompleted = WORK_COMPLETED_MIN
		this.totalWork = totalWork
	}

	public updateTotalWork(value: number) {
		this.totalWork = value
	}

	public continueEstimation() {
		clearInterval(this.progressEstimation)
		this.progressEstimation = setInterval(() => {
			if (this.ratePerSecondHistory.length < MINIMUM_HISTORY_LENGTH_FOR_ESTIMATION) {
				this.workEstimate(DEFAULT_RATE_PER_SECOND)
			} else {
				let lastRateEntry = last(this.ratePerSecondHistory)!
				let lastRatePerSecond = last(lastRateEntry)!
				let scaledRatePerSecond = lastRatePerSecond * RATE_PER_SECOND_ESTIMATION_SCALING_RATIO
				let workDoneEstimation = Math.max(DEFAULT_RATE_PER_SECOND, scaledRatePerSecond)
				this.workEstimate(workDoneEstimation)
			}
		}, DEFAULT_PROGRESS_ESTIMATION_REFRESH_MS)
	}

	public pauseEstimation() {
		clearInterval(this.progressEstimation)
		this.ratePerSecondHistory = Array.of([Date.now(), DEFAULT_RATE_PER_SECOND])
	}

	private updateRatePerSecond(newWorkAmount: number) {
		let lastRateEntry = last(this.ratePerSecondHistory)!
		let lastTimestamp = first(lastRateEntry)!
		let now = Date.now()
		let durationSinceLastRateEntrySeconds = (now - lastTimestamp) / 1000
		let ratePerSecond = newWorkAmount / durationSinceLastRateEntrySeconds
		let newRateEntry: Readonly<[number, number]> = [now, ratePerSecond]
		this.ratePerSecondHistory.push(newRateEntry)
	}

	private workEstimate(estimate: number) {
		this.workCompleted += estimate
		this.updater(this.percentage())
	}

	public workDone(amount: number) {
		this.updateRatePerSecond(amount)
		this.workCompleted += amount
		this.updater(this.percentage())
	}

	public totalWorkDone(totalAmount: number) {
		let workDifference = totalAmount - this.workCompleted
		this.updateRatePerSecond(workDifference)
		this.workCompleted = totalAmount
		this.updater(this.percentage())
	}

	public percentage(): number {
		const result = (WORK_MAX_PERCENTAGE * this.workCompleted) / this.totalWork
		return Math.min(WORK_MAX_PERCENTAGE, result)
	}

	public completed() {
		this.workCompleted = this.totalWork
		this.updater(WORK_MAX_PERCENTAGE)
	}
}
