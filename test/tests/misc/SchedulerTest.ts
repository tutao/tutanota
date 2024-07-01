import o from "@tutao/otest"
import type { ScheduledTimeoutId, Scheduler, SystemInterval, SystemTimeout } from "../../../src/common/api/common/utils/Scheduler.js"
import { SchedulerImpl, SET_TIMEOUT_LIMIT } from "../../../src/common/api/common/utils/Scheduler.js"
import type { Thunk } from "@tutao/tutanota-utils"
import { assertNotNull, downcast } from "@tutao/tutanota-utils"
import { DateTime, Duration } from "luxon"
import { DateProvider } from "../../../src/common/api/common/DateProvider.js"
import { spy } from "@tutao/tutanota-test-utils"

o.spec("Scheduler", function () {
	let dateProvider: DateProvider
	let scheduler: SchedulerImpl
	let timeoutMock: TimeoutMock
	let now
	o.beforeEach(function () {
		now = DateTime.fromISO("2020-04-21T22:00:00")
		dateProvider = {
			now: () => now.toMillis(),
			timeZone: () => "Europe/Berlin",
		}
		timeoutMock = new TimeoutMock()
		scheduler = new SchedulerImpl(dateProvider, downcast<SystemTimeout>(timeoutMock), new IntervalMock())
	})
	o("scheduleAt close", function () {
		const cb = spy()
		const duration = Duration.fromObject({
			minutes: 10,
		})
		const scheduleTime = now.plus(duration)
		scheduler.scheduleAt(cb, scheduleTime.toJSDate())
		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([duration.toMillis()])
		o(cb.callCount).equals(0)("Not called earlier")
		assertNotNull(timeoutMock.scheduledAfter.get(duration.toMillis())).thunk()
		o(cb.callCount).equals(1)("Was called after timeout")
	})
	o("scheduleAt far", function () {
		const cb = spy()
		const duration = Duration.fromObject({
			milliseconds: SET_TIMEOUT_LIMIT + 2000,
		})
		const scheduleTime = now.plus(duration)
		scheduler.scheduleAt(cb, scheduleTime.toJSDate())
		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([SET_TIMEOUT_LIMIT])
		o(cb.callCount).equals(0)("Not called earlier")
		const intermediateTimeout = assertNotNull(timeoutMock.scheduledAfter.get(SET_TIMEOUT_LIMIT))
		timeoutMock.scheduledAfter.clear()
		now = now.plus({
			milliseconds: SET_TIMEOUT_LIMIT,
		})
		intermediateTimeout.thunk()
		// The remaining time
		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([2000])
		o(cb.callCount).equals(0)("Not called after later")
		const newTimeout = assertNotNull(timeoutMock.scheduledAfter.get(2000))
		newTimeout.thunk()
		o(cb.callCount).equals(1)("Was called after timeout")
	})
	o("scheduleAt far, cancelled intermediate timeout", function () {
		const cb = spy()
		const duration = Duration.fromObject({
			milliseconds: SET_TIMEOUT_LIMIT + 2000,
		})
		const scheduleTime = now.plus(duration)
		const scheduledId = scheduler.scheduleAt(cb, scheduleTime.toJSDate())
		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([SET_TIMEOUT_LIMIT])
		o(cb.callCount).equals(0)("Not called earlier")
		const intermediateTimeout = assertNotNull(timeoutMock.scheduledAfter.get(SET_TIMEOUT_LIMIT))
		scheduler.unscheduleTimeout(scheduledId)
		o(Array.from(timeoutMock.cancelled.values())).deepEquals([intermediateTimeout.id])
	})
	o("scheduleAt far, cancelled final timeout", function () {
		const cb = spy()
		const duration = Duration.fromObject({
			milliseconds: SET_TIMEOUT_LIMIT + 2000,
		})
		const scheduleTime = now.plus(duration)
		const scheduledId = scheduler.scheduleAt(cb, scheduleTime.toJSDate())
		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([SET_TIMEOUT_LIMIT])
		o(cb.callCount).equals(0)("Not called earlier")
		const intermediateTimeout = assertNotNull(timeoutMock.scheduledAfter.get(SET_TIMEOUT_LIMIT))
		timeoutMock.scheduledAfter.clear()
		now = now.plus({
			milliseconds: SET_TIMEOUT_LIMIT,
		})
		intermediateTimeout.thunk()
		// The remaining time
		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([2000])
		const newTimeout = assertNotNull(timeoutMock.scheduledAfter.get(2000))
		scheduler.unscheduleTimeout(scheduledId)
		o(cb.callCount).equals(0)("Not called after later")
		o(Array.from(timeoutMock.cancelled)).deepEquals([newTimeout.id])
	})
})
type IdThunk = {
	id: ScheduledTimeoutId
	thunk: Thunk
}

class TimeoutMock implements SystemTimeout {
	alarmId: number
	scheduledAfter: Map<number, IdThunk>
	cancelled: Set<TimeoutID>

	constructor() {
		this.alarmId = 0
		this.scheduledAfter = new Map()
		this.cancelled = new Set()
		this.setTimeout.bind(this)
		this.clearTimeout.bind(this)
	}

	setTimeout(callback, ms): ScheduledTimeoutId {
		const id = this._incAlarmId()

		this.scheduledAfter.set(ms, {
			id,
			thunk: callback,
		})
		return id
	}

	clearTimeout(id) {
		this.cancelled.add(id)
	}

	_incAlarmId() {
		return downcast<ScheduledTimeoutId>(this.alarmId++)
	}
}

class IntervalMock implements SystemInterval {
	setInterval(cb, ms): number {
		throw new Error("Not implemented")
	}

	clearInterval() {
		throw new Error("Not implemented")
	}
}
