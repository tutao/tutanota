// @flow

import stream from "mithril/stream/stream.js"
import {ProgressMonitor} from "../common/utils/ProgressMonitor"
import type {ProgressMonitorId} from "../common/utils/ProgressMonitor"


/**
 * The progress tracker controls the progress bar located in Header.js
 * You can register progress monitors with it and then make workDone calls on them
 * and then the total progress will be shown at the top of the window
 */
export class ProgressTracker {

	// Will stream a number between 0 and 1
	onProgressUpdate: Stream<number>
	_monitors: Map<ProgressMonitorId, ProgressMonitor>
	_idCounter: ProgressMonitorId

	constructor() {
		this._init()
	}

	_init() {
		this.onProgressUpdate = stream(0)
		this._monitors = new Map()
		this._idCounter = 0
	}

	/**
	 * Register a monitor with the tracker, so that it's progress can be displayed
	 * Returns an ID as a handle, useful for making calls from the worker
	 *
	 * Make sure that monitor completes so it can be unregistered.
	 * @param work - total work to do
	 */
	registerMonitor(work: number): ProgressMonitorId {
		const id = this._idCounter++
		const monitor = new ProgressMonitor(work, completed => this._onProgress(id, completed))
		this._monitors.set(id, monitor)
		return id
	}

	getMonitor(id: ProgressMonitorId): ?ProgressMonitor {
		return this._monitors.get(id)
	}

	_onProgress(id: ProgressMonitorId, completed: number) {
		// notify
		this.onProgressUpdate(this.completedAmount())

		// we might be done with this one
		if (completed >= 100) this._monitors.delete(id)
	}

	/**
	 * Total work that will be done from all monitors
	 * @returns {void|number}
	 */
	totalWork(): number {
		let total = 0
		for (const value of this._monitors.values()) {
			total += value.totalWork
		}
		return total
	}

	/**
	 * Current amount of completed work from all monitors
	 * @returns {void|number}
	 */
	completedWork(): number {
		let total = 0
		for (const value of this._monitors.values()) {
			total += value.workCompleted
		}
		return total
	}

	/**
	 * Completed amount as a number between 0 and 1
	 * @returns {number}
	 */
	completedAmount(): number {
		const totalWork = this.totalWork()
		const completedWork = this.completedWork()
		// no work to do means you have done all the work
		return totalWork !== 0 ? Math.min(1, completedWork / totalWork) : 1
	}
}