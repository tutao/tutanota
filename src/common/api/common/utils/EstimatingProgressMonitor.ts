import { IProgressMonitor, ProgressListener } from "./ProgressMonitor"
import { first, last } from "@tutao/tutanota-utils"

const DEFAULT_RATE_PER_SECOND = 0.5
const DEFAULT_PROGRESS_ESTIMATION_REFRESH_MS: number = 1000
const MINIMUM_HISTORY_LENGTH_FOR_ESTIMATION = 3
const RATE_PER_SECOND_MAXIMUM_SCALING_RATIO: number = 0.75

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

	constructor(
		totalWork: number,
		private readonly updater: ProgressListener,
	) {
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
				const previousRateEntry = this.ratePerSecondHistory[this.ratePerSecondHistory.length - 2]
				const previousRateEntryTimestamp = first(previousRateEntry)!

				const lastRateEntry = last(this.ratePerSecondHistory)!
				const lastRateEntryTimestamp = first(lastRateEntry)!
				const lastRatePerSecond = last(lastRateEntry)!

				let lastDurationBetweenRatePerSecondUpdatesMs = lastRateEntryTimestamp - previousRateEntryTimestamp
				let currentDurationMs = Date.now() - lastRateEntryTimestamp
				let ratePerSecondScalingRatio: number = Math.min(
					RATE_PER_SECOND_MAXIMUM_SCALING_RATIO,
					lastDurationBetweenRatePerSecondUpdatesMs / currentDurationMs,
				)

				let newRatePerSecondEstimate = lastRatePerSecond * ratePerSecondScalingRatio
				let workDoneEstimation = Math.max(DEFAULT_RATE_PER_SECOND, newRatePerSecondEstimate)

				// only update estimation if we did not exceed the actual totalWork yet
				if (this.workCompleted + workDoneEstimation < this.totalWork) {
					this.workEstimate(workDoneEstimation)
				}
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

		console.log("workCompleted: ", this.workCompleted, "totalWork: ", this.totalWork)
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
		clearInterval(this.progressEstimation)
		this.workCompleted = this.totalWork
		this.updater(WORK_MAX_PERCENTAGE)
	}
}
