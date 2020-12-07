//@flow

export type ProgressMonitorId = number
export type ProgressListener = (percentageCompleted: number) => any

export interface IProgressMonitor {
	/**
	 * @param amount of work completed in current step
	 */
	workDone(amount: number): void;

	completed(): void;
}

/**
 * Class to calculate percentage of total work and report it back.
 * Call {@code workDone()} for each work step and {@code completed()}
 * when you are done.
 */
export class ProgressMonitor implements IProgressMonitor {
	totalWork: number
	workCompleted: number
	updater: ProgressListener

	constructor(totalWork: number, updater: ProgressListener) {
		this.updater = updater
		this.totalWork = totalWork
		this.workCompleted = 0
	}

	workDone(amount: number) {
		this.workCompleted += amount
		const result = this.totalWork ? Math.round(100 * (this.workCompleted) / this.totalWork) : 100
		const percentage = Math.min(100, result)
		this.updater(percentage)
	}

	completed() {
		this.workCompleted = this.totalWork
		this.updater(100)
	}
}

export class NoopProgressMonitor implements IProgressMonitor {
	workDone(amount: number) {
	}

	completed() {
	}
}