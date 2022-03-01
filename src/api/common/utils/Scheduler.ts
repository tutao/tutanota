import type {Thunk} from "@tutao/tutanota-utils"
import {DateProvider} from "../DateProvider.js"

export type ScheduledTimeoutId = TimeoutID
export type ScheduledPeriodicId = TimeoutID

export interface Scheduler {
	scheduleAt(thunk: Thunk, date: Date): ScheduledTimeoutId;

	unscheduleTimeout(id: ScheduledTimeoutId): void;

	schedulePeriodic(thunk: Thunk, period: number): ScheduledPeriodicId

	unschedulePeriodic(id: ScheduledPeriodicId): void;
}

/**
 * setTimeout() only works on 32bit integers, it doesn't do what you expect on longer intervals. If you use Scheduler you should not
 * worry about it, mainly exported for tests.
 * */
export const SET_TIMEOUT_LIMIT = 0x7fffffff

/** Default impl of timeout functions, useful for testing */
export type SystemTimeout = {
	// Copying it because ts has some weird properties attach to it in node tslib.
	// no-arg version because lambadas exist.
	setTimeout(callback: () => void, ms: number): number;
	clearTimeout: typeof clearTimeout
}

export type SystemInterval = {
	// Copying it because ts has some weird properties attach to it in node tslib.
	// no-arg version because lambadas exist.
	setInterval(callback: () => void, ms: number): number;
	clearInterval: typeof clearInterval,
}

export class SchedulerImpl implements Scheduler {
	/**
	 * This points from the originally scheduled timeout to the most recent timeout
	 */
	private readonly bridgedTimeouts: Map<ScheduledTimeoutId, ScheduledTimeoutId>

	constructor(
		private readonly dateProvider: DateProvider,
		private readonly systemTimeout: SystemTimeout,
		private readonly systemInterval: SystemInterval
		) {
		this.bridgedTimeouts = new Map()
	}

	scheduleAt(callback: Thunk, date: Date): ScheduledTimeoutId {
		let timeoutId: TimeoutID

		// Call the thunk and clean up timeout in the map
		const wrappedCallback = () => {
			this.bridgedTimeouts.delete(timeoutId)

			callback()
		}

		timeoutId = this.scheduleAtInternal(wrappedCallback, date)
		return timeoutId
	}

	/** We have separate internal version which does not re-wrap the thunk. */
	private scheduleAtInternal(thunk: Thunk, date: Date): ScheduledTimeoutId {
		const now = this.dateProvider.now()

		const then = date.getTime()
		const diff = Math.max(then - now, 0)
		let timeoutId: TimeoutID

		if (diff > SET_TIMEOUT_LIMIT) {
			timeoutId = this.systemTimeout.setTimeout(() => {
				const newTimeoutId = this.scheduleAtInternal(thunk, date)

				this.bridgedTimeouts.set(timeoutId, newTimeoutId)
			}, SET_TIMEOUT_LIMIT)
		} else {
			timeoutId = this.systemTimeout.setTimeout(thunk, diff)
		}

		return timeoutId
	}

	unscheduleTimeout(id: ScheduledTimeoutId): void {
		const rescheduledId = this.bridgedTimeouts.get(id) || id

		this.bridgedTimeouts.delete(rescheduledId)

		return this.systemTimeout.clearTimeout(rescheduledId)
	}

	schedulePeriodic(thunk: Thunk, ms: number): ScheduledPeriodicId {
		return this.systemInterval.setInterval(thunk, ms)
	}

	unschedulePeriodic(id: ScheduledPeriodicId) {
		this.systemInterval.clearInterval(id)
	}
}