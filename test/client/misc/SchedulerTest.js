// @flow
import o from "ospec"
import type {ScheduledId, Scheduler, SystemTimeout} from "../../../src/misc/Scheduler"
import {SchedulerImpl, SET_TIMEOUT_LIMIT} from "../../../src/misc/Scheduler"
import type {DateProvider} from "../../../src/calendar/date/CalendarUtils"
import type {Thunk} from "../../../src/api/common/utils/Utils"
import {assertNotNull, downcast} from "../../../src/api/common/utils/Utils"
import {DateTime, Duration} from "luxon"

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
		scheduler = new SchedulerImpl(dateProvider, downcast<SystemTimeout>(timeoutMock))
	})

	o("simple scheduleAfer", function () {
		const cb = o.spy()
		scheduler.scheduleAfter(cb, 5000)

		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([5000])
		o(cb.callCount).equals(0)("Not called earlier")

		assertNotNull(timeoutMock.scheduledAfter.get(5000)).thunk()

		o(cb.callCount).equals(1)("Was called after timeout")
	})

	o("scheduleAfter then cancel", function () {
		const cb = o.spy()
		const scheduledId = scheduler.scheduleAfter(cb, 5000)

		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([5000])
		o(cb.callCount).equals(0)("Not called earlier")

		scheduler.unschedule(scheduledId)

		o(Array.from(timeoutMock.cancelled.values())).deepEquals([scheduledId])
	})

	o("scheduleAt close", function () {
		const cb = o.spy()
		const duration = Duration.fromObject({minutes: 10})
		const scheduleTime = now.plus(duration)
		scheduler.scheduleAt(cb, scheduleTime.toJSDate())

		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([duration.toMillis()])
		o(cb.callCount).equals(0)("Not called earlier")

		assertNotNull(timeoutMock.scheduledAfter.get(duration.toMillis())).thunk()

		o(cb.callCount).equals(1)("Was called after timeout")
	})

	o("scheduleAt far", function () {
		const cb = o.spy()
		const duration = Duration.fromObject({milliseconds: SET_TIMEOUT_LIMIT + 2000})
		const scheduleTime = now.plus(duration)
		scheduler.scheduleAt(cb, scheduleTime.toJSDate())

		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([SET_TIMEOUT_LIMIT])
		o(cb.callCount).equals(0)("Not called earlier")

		const intermediateTimeout = assertNotNull(timeoutMock.scheduledAfter.get(SET_TIMEOUT_LIMIT))
		timeoutMock.scheduledAfter.clear()

		now = now.plus({milliseconds: SET_TIMEOUT_LIMIT})
		intermediateTimeout.thunk()
		// The remaining time
		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([2000])
		o(cb.callCount).equals(0)("Not called after later")

		const newTimeout = assertNotNull(timeoutMock.scheduledAfter.get(2000))
		newTimeout.thunk()

		o(cb.callCount).equals(1)("Was called after timeout")
	})

	o("scheduleAt far, cancelled intermediate timeout", function () {
		const cb = o.spy()
		const duration = Duration.fromObject({milliseconds: SET_TIMEOUT_LIMIT + 2000})
		const scheduleTime = now.plus(duration)
		const scheduledId = scheduler.scheduleAt(cb, scheduleTime.toJSDate())

		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([SET_TIMEOUT_LIMIT])
		o(cb.callCount).equals(0)("Not called earlier")

		const intermediateTimeout = assertNotNull(timeoutMock.scheduledAfter.get(SET_TIMEOUT_LIMIT))
		scheduler.unschedule(scheduledId)
		o(Array.from(timeoutMock.cancelled.values())).deepEquals([intermediateTimeout.id])
	})

	o("scheduleAt far, cancelled final timeout", function () {
		const cb = o.spy()
		const duration = Duration.fromObject({milliseconds: SET_TIMEOUT_LIMIT + 2000})
		const scheduleTime = now.plus(duration)

		const scheduledId = scheduler.scheduleAt(cb, scheduleTime.toJSDate())

		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([SET_TIMEOUT_LIMIT])
		o(cb.callCount).equals(0)("Not called earlier")

		const intermediateTimeout = assertNotNull(timeoutMock.scheduledAfter.get(SET_TIMEOUT_LIMIT))
		timeoutMock.scheduledAfter.clear()

		now = now.plus({milliseconds: SET_TIMEOUT_LIMIT})
		intermediateTimeout.thunk()
		// The remaining time
		o(Array.from(timeoutMock.scheduledAfter.keys())).deepEquals([2000])

		const newTimeout = assertNotNull(timeoutMock.scheduledAfter.get(2000))

		scheduler.unschedule(scheduledId)

		o(cb.callCount).equals(0)("Not called after later")
		o(Array.from(timeoutMock.cancelled)).deepEquals([newTimeout.id])
	})
})

type IdThunk = {id: ScheduledId, thunk: Thunk}

class TimeoutMock {
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

	setTimeout(callback, ms): ScheduledId {
		const id = this._incAlarmId()
		this.scheduledAfter.set(ms, {id, thunk: callback})
		return id
	}

	clearTimeout(id) {
		this.cancelled.add(id)
	}

	_incAlarmId() {
		return downcast<ScheduledId>(this.alarmId++)
	}
}