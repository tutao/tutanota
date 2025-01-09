import type { IProgressMonitor, ProgressMonitorId } from "../common/utils/ProgressMonitor"
import { ExposedProgressTracker } from "../main/ProgressTracker.js"

/** A wrapper that will send completed work remotely */
export class ProgressMonitorDelegate implements IProgressMonitor {
	private readonly ref: Promise<ProgressMonitorId>

	constructor(private readonly progressTracker: ExposedProgressTracker, readonly totalWork: number) {
		this.ref = progressTracker.registerMonitor(totalWork)
	}

	async workDone(amount: number) {
		await this.progressTracker.workDoneForMonitor(await this.ref, amount)
	}

	async totalWorkDone(totalAmount: number) {
		await this.progressTracker.workDoneForMonitor(await this.ref, this.totalWork - totalAmount)
	}

	async completed() {
		await this.progressTracker.workDoneForMonitor(await this.ref, this.totalWork)
	}
}
