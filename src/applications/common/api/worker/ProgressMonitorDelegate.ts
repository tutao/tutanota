import { ExposedProgressTracker } from "../main/ProgressTracker.js"
import { ProgressMonitorId, ProgressMonitorInterface } from "../../../../platform-kit/network/ProgressMonitorInterface"

/** A wrapper that will send completed work remotely */
export class ProgressMonitorDelegate implements ProgressMonitorInterface {
	readonly progressMonitorId: Promise<ProgressMonitorId>
	totalWork: number

	constructor(
		private readonly progressTracker: ExposedProgressTracker,
		totalWork: number,
	) {
		this.totalWork = totalWork
		this.progressMonitorId = progressTracker.registerMonitor(totalWork)
	}

	async updateTotalWork(value: number) {
		this.totalWork = value
		await this.progressTracker.updateTotalWorkForMonitor(await this.progressMonitorId, this.totalWork)
	}

	async workDone(amount: number) {
		await this.progressTracker.workDoneForMonitor(await this.progressMonitorId, amount)
	}

	async totalWorkDone(totalAmount: number) {
		await this.progressTracker.totalWorkDoneForMonitor(await this.progressMonitorId, totalAmount)
	}

	async completed() {
		await this.progressTracker.workDoneForMonitor(await this.progressMonitorId, this.totalWork)
	}

	async isDone(): Promise<boolean> {
		return await this.progressTracker.isDoneForMonitor(await this.progressMonitorId)
	}
}
