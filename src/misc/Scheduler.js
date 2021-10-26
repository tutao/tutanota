// @flow

import type {DateProvider} from "../calendar/date/CalendarUtils"
import type {Thunk} from "@tutao/tutanota-utils"

export opaque type ScheduledId = TimeoutID

export interface Scheduler {
	scheduleAt(thunk: Thunk, date: Date): ScheduledId;

	unschedule(id: ScheduledId): void;
}

/**
 * setTimeout() only works on 32bit integers, it doesn't do what you expect on longer intervals. If you use Scheduler you should not
 * worry about it, mainly exported for tests.
 * */
export const SET_TIMEOUT_LIMIT = 0x7FFFFFFF

/** Default impl of timeout functions, useful for testing */
export type SystemTimeout = {setTimeout: typeof setTimeout, clearTimeout: typeof clearTimeout}

export class SchedulerImpl implements Scheduler {
	+_dateProvider: DateProvider
	+_systemTimeout: SystemTimeout;

	/**
	 * This points from the originally scheduled timeout to the most recent timeout
	 */
	+_bridgedTimeouts: Map<ScheduledId, ScheduledId>;

	constructor(dateProvider: DateProvider, systemTimeout: SystemTimeout) {
		this._dateProvider = dateProvider
		this._systemTimeout = systemTimeout
		this._bridgedTimeouts = new Map()
	}

	scheduleAt(callback: Thunk, date: Date): ScheduledId {
		let timeoutId

		// Call the thunk and clean up timeout in the map
		const wrappedCallback = () => {
			this._bridgedTimeouts.delete(timeoutId)
			callback()
		}
		timeoutId = this._scheduleAtInternal(wrappedCallback, date)

		return timeoutId
	}

	/** We have separate internal version which does not re-wrap the thunk. */
	_scheduleAtInternal(thunk: Thunk, date: Date): ScheduledId {
		const now = this._dateProvider.now()
		const then = date.getTime()
		const diff = Math.max((then - now), 0)

		let timeoutId
		if (diff > SET_TIMEOUT_LIMIT) {
			timeoutId = this._systemTimeout.setTimeout(() => {
				const newTimeoutId = this._scheduleAtInternal(thunk, date)
				this._bridgedTimeouts.set(timeoutId, newTimeoutId)
			}, SET_TIMEOUT_LIMIT)
		} else {
			timeoutId = this._systemTimeout.setTimeout(thunk, diff)
		}
		return timeoutId
	}

	unschedule(id: ScheduledId): void {
		const rescheduledId = this._bridgedTimeouts.get(id) || id
		this._bridgedTimeouts.delete(rescheduledId)
		return this._systemTimeout.clearTimeout(rescheduledId)
	}
}
