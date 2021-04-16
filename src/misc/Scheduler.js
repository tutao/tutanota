// @flow

import type {DateProvider} from "../calendar/date/CalendarUtils"
import type {Thunk} from "../api/common/utils/Utils"

export opaque type ScheduledId = TimeoutID

export interface Scheduler {
	scheduleAfter(thunk: Thunk, ms: number): ScheduledId;

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

	+_bridgedTimeouts: Map<ScheduledId, ScheduledId>;

	constructor(dateProvider: DateProvider, systemTimeout: SystemTimeout) {
		this._dateProvider = dateProvider
		this._systemTimeout = systemTimeout
		this._bridgedTimeouts = new Map()
	}


	scheduleAfter(callback: Thunk, ms: number): ScheduledId {
		return this._systemTimeout.setTimeout(callback, ms)
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
			timeoutId = this.scheduleAfter(() => {
				const newTimoutId = this._scheduleAtInternal(thunk, date)
				this._bridgedTimeouts.set(timeoutId, newTimoutId)
			}, SET_TIMEOUT_LIMIT)
		} else {
			timeoutId = this.scheduleAfter(thunk, diff)
		}
		return timeoutId
	}

	unschedule(id: ScheduledId): void {
		const rescheduledId = this._bridgedTimeouts.get(id) || id
		this._bridgedTimeouts.delete(rescheduledId)
		return this._systemTimeout.clearTimeout(rescheduledId)
	}
}
