import type { IProgressMonitor, ProgressMonitorId } from "../common/utils/ProgressMonitor"
import { ExposedProgressTracker } from "../main/ProgressTracker.js"

/** A wrapper that will send completed work remotely */
export class ProgressMonitorDelegate implements IProgressMonitor {
	private readonly ref: Promise<ProgressMonitorId>
	totalWork: number

	constructor(
		private readonly progressTracker: ExposedProgressTracker,
		totalWork: number,
	) {
		this.totalWork = totalWork
		this.ref = progressTracker.registerMonitor(totalWork)
	}

	async updateTotalWork(value: number) {
		this.totalWork = value
		await this.progressTracker.updateTotalWorkForMonitor(await this.ref, this.totalWork)
	}

	async workDone(amount: number) {
		await this.progressTracker.workDoneForMonitor(await this.ref, amount)
	}

	async totalWorkDone(totalAmount: number) {
		await this.progressTracker.totalWorkDoneForMonitor(await this.ref, totalAmount)
	}

	async completed() {
		await this.progressTracker.workDoneForMonitor(await this.ref, this.totalWork)
	}

	isDone(): boolean {
		return this.progressTracker.isDone()
	}
}
