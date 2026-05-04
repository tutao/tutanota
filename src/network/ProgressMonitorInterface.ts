export type ProgressMonitorId = number

export type ProgressListener = (percentageCompleted: number) => unknown

export interface ProgressMonitorInterface {
	totalWork: number
	readonly progressMonitorId: Promise<ProgressMonitorId> | null

	/**
	 * @param amount of work completed in the current step
	 */
	workDone(amount: number): void

	totalWorkDone(totalAmount: number): void

	updateTotalWork(totalWork: number): void

	completed(): void

	isDone(): Promise<boolean>
}

/**
 * Class to calculate percentage of total work and report it back.
 * Call {@code workDone() or @code totalWorkDone()} for each work step and {@code completed()}
 * when you are done.
 */
export class ProgressMonitor implements ProgressMonitorInterface {
	workCompleted: number
	totalWork: number
	progressMonitorId: Promise<number> | null

	constructor(
		totalWork: number,
		private readonly updater: ProgressListener,
	) {
		this.totalWork = totalWork
		this.workCompleted = 0
		this.progressMonitorId = null
	}

	updateTotalWork(totalWork: number) {
		this.totalWork = totalWork
		this.updater(this.percentage())
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

	async isDone(): Promise<boolean> {
		return this.workCompleted >= this.totalWork
	}
}

export class NoopProgressMonitor implements ProgressMonitorInterface {
	totalWork: number = 0
	progressMonitorId: Promise<number> | null = null

	workDone(amount: number) {}

	totalWorkDone(totalAmount: number) {}

	updateTotalWork(totalWork: number) {}

	completed() {}

	async isDone(): Promise<boolean> {
		return true
	}
}
