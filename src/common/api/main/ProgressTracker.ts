import stream from "mithril/stream"
import type { ProgressMonitorId } from "../common/utils/ProgressMonitor"
import { ProgressMonitor } from "../common/utils/ProgressMonitor"

export type ExposedProgressTracker = Pick<ProgressTracker, "registerMonitor" | "workDoneForMonitor">

/**
 * The progress tracker controls the progress bar located in Header.js
 * You can register progress monitors with it and then make workDone calls on them
 * and then the total progress will be shown at the top of the window
 */
export class ProgressTracker {
	// Will stream a number between 0 and 1
	onProgressUpdate: stream<number>
	private readonly monitors: Map<ProgressMonitorId, ProgressMonitor>
	private idCounter: ProgressMonitorId

	constructor() {
		// initially, there is no work, so we are done by default.
		this.onProgressUpdate = stream(1)
		this.monitors = new Map()
		this.idCounter = 0
	}

	/**
	 * Register a monitor with the tracker, so that it's progress can be displayed
	 * Returns an ID as a handle, useful for making calls from the worker
	 *
	 * Make sure that monitor completes, so it can be unregistered.
	 * @param work - total work to do
	 */
	registerMonitorSync(work: number): ProgressMonitorId {
		const id = this.idCounter++
		const monitor = new ProgressMonitor(work, (percentage) => this.onProgress(id, percentage))

		this.monitors.set(id, monitor)

		return id
	}

	/** async wrapper for remote */
	async registerMonitor(work: number): Promise<ProgressMonitorId> {
		return this.registerMonitorSync(work)
	}

	async workDoneForMonitor(id: ProgressMonitorId, amount: number): Promise<void> {
		this.getMonitor(id)?.workDone(amount)
	}

	getMonitor(id: ProgressMonitorId): ProgressMonitor | null {
		return this.monitors.get(id) ?? null
	}

	private onProgress(id: ProgressMonitorId, percentage: number) {
		// notify
		this.onProgressUpdate(this.completedAmount())
		// we might be done with this one
		if (percentage >= 100) this.monitors.delete(id)
	}

	/**
	 * Total work that will be done from all monitors
	 */
	totalWork(): number {
		let total = 0

		for (const monitor of this.monitors.values()) {
			total += monitor.totalWork
		}

		return total
	}

	/**
	 * Current absolute amount of completed work from all monitors
	 */
	completedWork(): number {
		let total = 0

		for (const monitor of this.monitors.values()) {
			total += monitor.workCompleted
		}

		return total
	}

	/**
	 * Completed percentage of completed work as a number between 0 and 1
	 */
	completedAmount(): number {
		const totalWork = this.totalWork()
		const completedWork = this.completedWork()
		// no work to do means you have done all the work
		return totalWork !== 0 ? Math.min(1, completedWork / totalWork) : 1
	}
}
