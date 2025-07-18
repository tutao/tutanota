import type { ProgressTracker } from "../../main/ProgressTracker"
import { assertNotNull } from "@tutao/tutanota-utils"

export type ProgressMonitorId = number
export type ProgressListener = (percentageCompleted: number) => unknown

export interface IProgressMonitor {
	/**
	 * @param amount of work completed in current step
	 */
	workDone(amount: number): void

	totalWorkDone(totalAmount: number): void

	completed(): void
}

/**
 * Class to calculate percentage of total work and report it back.
 * Call {@code workDone() or @code totalWorkDone()} for each work step and {@code completed()}
 * when you are done.
 */
export class ProgressMonitor implements IProgressMonitor {
	workCompleted: number

	constructor(
		readonly totalWork: number,
		private readonly updater: ProgressListener,
	) {
		this.workCompleted = 0
	}

	workDone(amount: number) {
		this.workCompleted += amount
		this.updater(this.percentage())
	}

	totalWorkDone(totalAmount: number) {
		this.workCompleted = totalAmount
		this.updater(this.percentage())
	}

	percentage(): number {
		const result = (100 * this.workCompleted) / this.totalWork
		return Math.min(100, result)
	}

	completed() {
		this.workCompleted = this.totalWork
		this.updater(100)
	}
}

export class NoopProgressMonitor implements IProgressMonitor {
	workDone(amount: number) {}

	totalWorkDone(totalAmount: number) {}

	completed() {}
}

export function makeTrackedProgressMonitor(tracker: ProgressTracker, totalWork: number): IProgressMonitor {
	if (totalWork < 1) return new NoopProgressMonitor()
	const handle = tracker.registerMonitorSync(totalWork)
	return assertNotNull(tracker.getMonitor(handle))
}
