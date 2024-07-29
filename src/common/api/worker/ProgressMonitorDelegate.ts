import type { IProgressMonitor, ProgressMonitorId } from "../common/utils/ProgressMonitor"
import { ExposedProgressTracker } from "../main/ProgressTracker.js"

/** A wrapper that will send completed work remotely */
export class ProgressMonitorDelegate implements IProgressMonitor {
	private readonly ref: Promise<ProgressMonitorId>

	constructor(private readonly progressTracker: ExposedProgressTracker, readonly totalAmount: number) {
		this.ref = progressTracker.registerMonitor(totalAmount)
	}

	async workDone(amount: number) {
		await this.progressTracker.workDoneForMonitor(await this.ref, amount)
	}

	async completed() {
		await this.progressTracker.workDoneForMonitor(await this.ref, this.totalAmount)
	}
}
