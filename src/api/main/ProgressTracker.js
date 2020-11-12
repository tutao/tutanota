// @flow

import stream from "mithril/stream/stream.js"
import type {ProgressMonitorId} from "../common/utils/Utils"
import {ProgressMonitor} from "../common/utils/Utils"


const TIME_TO_RESET = 2000

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
	_done: boolean

	// we set a time out to say that we're finished if it's been a while since the
	// last work was done and wanna just say it's all g
	// best figure out exactly how much work will be done if you can though
	_timeoutHandle: TimeoutID

	constructor() {
		this._init()
	}

	_init() {
		this.onProgressUpdate = stream(0)
		this._monitors = new Map()
		this._idCounter = 0
		this._done = true
	}

	/**
	 * Register a monitor with the tracker, so that it's progress can be displayed
	 * Returns an ID as a handle, useful for making calls from the worker
	 * Automatically deregisters after a given timeout, or when a monitor completes its work
	 * @param monitor
	 * @returns {number}
	 */
	registerMonitor(monitor: ProgressMonitor): ProgressMonitorId {
		this._done = false
		const id = this._idCounter++
		monitor.addListener(completed => this._onProgress(id, completed))
		this._monitors.set(id, monitor)
		return id
	}

	getMonitor(id: ProgressMonitorId): ?ProgressMonitor {
		return this._monitors.get(id)
	}

	_onProgress(id: ProgressMonitorId, completed: number) {
		if (!this._done) {
			// notify
			this.onProgressUpdate(this.completedAmount())

			// we might be done with this one
			if (completed >= 100) this._monitors.delete(id)

			// we might be done with all of them
			this._done = this._monitors.size === 0

			clearTimeout(this._timeoutHandle)
			if (this._done) {
				// just in case ?
				this.onProgressUpdate(1)
			} else {
				this._timeoutHandle = window.setTimeout(() => {
					this.onProgressUpdate(1)
					this._init()
				}, TIME_TO_RESET)
			}
		}
	}

	/**
	 * Total work that will be done from all monitors
	 * @returns {void|number}
	 */
	totalWork(): number {
		return Array.from(this._monitors.values()).reduce((sum, monitor) => sum + monitor.totalWork, 0)
	}

	/**
	 * Current amount of completed work from all monitors
	 * @returns {void|number}
	 */
	completedWork(): number {
		return Array.from(this._monitors.values()).reduce((sum, monitor) => sum + monitor.workCompleted, 0)
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