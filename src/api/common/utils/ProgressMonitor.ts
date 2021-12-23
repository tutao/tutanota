//@flow

import type {ProgressTracker} from "../../main/ProgressTracker"
import {assertNotNull} from "@tutao/tutanota-utils"

export type ProgressMonitorId = number
export type ProgressListener = (percentageCompleted: number) => mixed

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
		this.updater(this.percentage())
	}

	percentage(): number {
		const result = Math.round(100 * (this.workCompleted) / this.totalWork)
		return Math.min(100, result)
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

export type WorkDoneCallback = (percentageCompleted: number) => mixed

export type ProgressStage = {part: number, monitor: ProgressMonitor}

export class AggregateProgressMonitor {
	stages: Array<ProgressStage>
	updater: WorkDoneCallback

	constructor(updater: WorkDoneCallback) {
		this.stages = []
		this.updater = updater
	}

	addStage(part: number, totalWork: number) {
		this.stages.push({part, monitor: new ProgressMonitor(totalWork, () => this._onUpdate())})
	}

	workDone(stageNumber: number, amount: number) {
		const stage = this.stages[stageNumber]
		if (stage == null) {
			throw new Error("No stage at index" + stageNumber)
		}
		stage.monitor.workDone(amount)
	}

	completedStage(stage: number) {
		this.stages[stage].monitor.completed()
	}

	completedAll() {
		this.stages.forEach((s) => s.monitor.workCompleted = s.monitor.totalWork)
		this._onUpdate()
	}

	setStageTotalWork(stageNumber: number, totalWork: number) {
		const stage = this.stages[stageNumber]
		if (stage == null) {
			throw new Error("No stage at index" + stageNumber)
		}
		stage.monitor.totalWork = totalWork
	}

	_onUpdate() {
		const total = this.stages.reduce((acc, stage) => acc + stage.monitor.percentage() * stage.part, 0)
		console.log("monitor percentage: ", this.stages.map(s => s.monitor.percentage()), " total: ", total)
		this.updater(total)
	}
}


export function makeTrackedProgressMonitor(tracker: ProgressTracker, totalWork: number): IProgressMonitor {
	if (totalWork < 1) return new NoopProgressMonitor()

	const handle = tracker.registerMonitor(totalWork)
	return assertNotNull(tracker.getMonitor(handle))
}
