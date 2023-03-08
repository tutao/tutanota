import { AlarmScheduler, AlarmSchedulerImpl } from "../../../src/calendar/date/AlarmScheduler.js"
import o from "ospec"
import { DateTime } from "luxon"
import { createAlarmInfo, createDateWrapper, createRepeatRule } from "../../../src/api/entities/sys/TypeRefs.js"
import { EndType, RepeatPeriod } from "../../../src/api/common/TutanotaConstants.js"
import { DateProvider } from "../../../src/api/common/DateProvider.js"
import { SchedulerMock } from "../TestUtils.js"

o.spec("AlarmScheduler", function () {
	let alarmScheduler: AlarmSchedulerImpl
	let scheduler: SchedulerMock
	let now: DateTime
	const dateProvider: DateProvider = {
		now: () => now.toMillis(),
		timeZone: () => "Europe/Berlin",
	}
	o.beforeEach(function () {
		now = DateTime.fromISO("2021-04-20T20:00Z")
		scheduler = new SchedulerMock()
		alarmScheduler = new AlarmSchedulerImpl(dateProvider, scheduler)
	})
	o.spec("scheduleAlarm", function () {
		o("non-repeating", function () {
			const eventInfo = {
				startTime: DateTime.fromISO("2021-04-21T20:00:00Z").toJSDate(),
				endTime: DateTime.fromISO("2021-04-21T20:30Z").toJSDate(),
				summary: "summary",
			}
			const alarmInfo = createAlarmInfo({
				trigger: "10M",
			})
			const notificationSender = o.spy()
			alarmScheduler.scheduleAlarm(eventInfo, alarmInfo, null, notificationSender)
			const expectedAlarmTime = DateTime.fromISO("2021-04-21T19:50Z").toMillis()
			const scheduled = scheduler.scheduledAt.get(expectedAlarmTime)

			if (scheduled == null) {
				throw new Error("Did not schedule, " + Array.from(scheduler.scheduledAt.keys()).map(Date).join(","))
			}

			scheduled.thunk()
			o(notificationSender.callCount).equals(1)
		})
		o("repeating daily 3 times", function () {
			const eventInfo = {
				startTime: DateTime.fromISO("2021-04-21T20:00:00Z").toJSDate(),
				endTime: DateTime.fromISO("2021-04-21T20:30Z").toJSDate(),
				summary: "summary",
			}
			const alarmInfo = createAlarmInfo({
				trigger: "30M",
			})
			const repeatRule = createRepeatRule({
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endType: EndType.Count,
				endValue: "3",
				timeZone: "Europe/Berlin",
			})
			const notificationSender = o.spy()
			alarmScheduler.scheduleAlarm(eventInfo, alarmInfo, repeatRule, notificationSender)
			const expectedTimes = [DateTime.fromISO("2021-04-21T19:30Z"), DateTime.fromISO("2021-04-22T19:30Z"), DateTime.fromISO("2021-04-23T19:30Z")]

			for (const time of expectedTimes) {
				const scheduled = scheduler.scheduledAt.get(time.toMillis())

				if (scheduled == null) {
					const got = Array.from(scheduler.scheduledAt.keys()).map((t) => DateTime.fromMillis(t).toISO())
					throw new Error(`Did not schedule at ${time.toISO()}, but ${got.join(",")}`)
				}

				now = now.plus({
					days: 1,
				})
				scheduled.thunk()
				o(notificationSender.callCount).equals(1)
				// @ts-ignore
				notificationSender.callCount = 0
			}
		})
		o("repeating with exclusions", function () {
			const eventInfo = {
				startTime: DateTime.fromISO("2021-04-21T20:00:00Z").toJSDate(),
				endTime: DateTime.fromISO("2021-04-21T20:30Z").toJSDate(),
				summary: "summary",
			}
			const alarmInfo = createAlarmInfo({
				trigger: "30M",
			})
			const repeatRule = createRepeatRule({
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endType: EndType.Count,
				endValue: "3",
				timeZone: "Europe/Berlin",
				excludedDates: [createDateWrapper({ date: DateTime.fromISO("2021-04-22T20:00Z").toJSDate() })],
			})
			const notificationSender = o.spy()
			alarmScheduler.scheduleAlarm(eventInfo, alarmInfo, repeatRule, notificationSender)
			const expectedTimes = [DateTime.fromISO("2021-04-21T19:30Z"), DateTime.fromISO("2021-04-23T19:30Z")]

			for (const time of expectedTimes) {
				const scheduled = scheduler.scheduledAt.get(time.toMillis())

				if (scheduled == null) {
					const got = Array.from(scheduler.scheduledAt.keys()).map((t) => DateTime.fromMillis(t).toISO())
					throw new Error(`Did not schedule at ${time.toISO()}, but ${got.join(",")}`)
				}

				now = now.plus({
					days: 1,
				})
				scheduled.thunk()
				o(notificationSender.callCount).equals(1)
				// @ts-ignore
				notificationSender.callCount = 0
			}
		})
	})
	o.spec("cancel alarm", function () {
		o("single", function () {
			const eventInfo = {
				startTime: DateTime.fromISO("2021-04-21T20:00:00Z").toJSDate(),
				endTime: DateTime.fromISO("2021-04-21T20:30Z").toJSDate(),
				summary: "summary",
			}
			const alarmInfo = createAlarmInfo({
				trigger: "10M",
				alarmIdentifier: "identifier",
			})
			const notificationSender = o.spy()
			alarmScheduler.scheduleAlarm(eventInfo, alarmInfo, null, notificationSender)
			const expectedAlarmTime = DateTime.fromISO("2021-04-21T19:50Z").toMillis()
			const scheduled = scheduler.scheduledAt.get(expectedAlarmTime)

			if (scheduled == null) {
				throw new Error("Did not schedule, " + Array.from(scheduler.scheduledAt.keys()).map(Date).join(","))
			}

			alarmScheduler.cancelAlarm(alarmInfo.alarmIdentifier)
			o(scheduler.cancelledAt.has(scheduled.id)).equals(true)("was unscheduled")
		})
		o("repeating", function () {
			const eventInfo = {
				startTime: DateTime.fromISO("2021-04-21T20:00:00Z").toJSDate(),
				endTime: DateTime.fromISO("2021-04-21T20:30Z").toJSDate(),
				summary: "summary",
			}
			const alarmInfo = createAlarmInfo({
				trigger: "30M",
			})
			const repeatRule = createRepeatRule({
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endType: EndType.Count,
				endValue: "3",
				timeZone: "Europe/Berlin",
			})
			const notificationSender = o.spy()
			alarmScheduler.scheduleAlarm(eventInfo, alarmInfo, repeatRule, notificationSender)
			const scheduled = Array.from(scheduler.scheduledAt.values()).map((idThunk) => idThunk.id)
			o(scheduled.length).equals(1)
			alarmScheduler.cancelAlarm(alarmInfo.alarmIdentifier)
			o(Array.from(scheduler.cancelledAt)).deepEquals(scheduled)
		})
	})
})
