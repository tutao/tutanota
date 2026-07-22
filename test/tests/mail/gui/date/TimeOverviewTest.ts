import o from "@tutao/otest"
import { TimeOverview } from "../../../../../src/applications/mail-app/gui/date/TimeOverview"
import { Time } from "../../../../../src/applications/common/calendar/date/Time"
import { makeEvent } from "../../../calendar/CalendarTestUtils"
import { incrementDate } from "../../../../../src/platform-kit/utils"

o.spec("TimeOverview", function () {
	const interval = 30
	const baseDate = new Date(2026, 6, 22)

	function makeDate(hour: number, minute: number) {
		return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour, minute)
	}

	o.spec("getTimeRange", function () {
		o.test("normal middle-of-day event", function () {
			const focus = makeDate(12, 45)

			const range = TimeOverview.getTimeRange(focus, interval)

			o.check(range.start).deepEquals(new Time(12, 15))
			o.check(range.end).deepEquals(new Time(13, 15))
		})

		o.test("event close to midnight should clip range to beginning of day", function () {
			const focus = makeDate(0, 15)

			const range = TimeOverview.getTimeRange(focus, interval)

			o.check(range.start).deepEquals(new Time(0, 0))
			o.check(range.end).deepEquals(new Time(1, 0))
		})

		o.test("event close to end of day should clip to end of day", function () {
			const focus = makeDate(23, 45)

			const range = TimeOverview.getTimeRange(focus, interval)

			o.check(range.start).deepEquals(new Time(22, 30))
			o.check(range.end).deepEquals(new Time(23, 30))
		})
	})

	o.spec("filterOutOfRangeEvents", function () {
		const eventId = "normal-event"

		const range = {
			start: new Time(12, 0),
			end: new Time(13, 0),
		}

		o.spec("Valid events", function () {
			o.test("completely inside the range", function () {
				const event = makeEvent(eventId, makeDate(12, 15), makeDate(12, 45))
				const result = TimeOverview.filterOutOfRangeEvents(range, [event], baseDate, interval)
				o.check(result).deepEquals([event])
			})

			o.test("overlaps range start", function () {
				const event = makeEvent(eventId, makeDate(11, 45), makeDate(12, 15))
				const result = TimeOverview.filterOutOfRangeEvents(range, [event], baseDate, interval)
				o.check(result).deepEquals([event])
			})

			o.test("overlaps range end", function () {
				const event = makeEvent(eventId, makeDate(12, 45), makeDate(13, 15))
				const result = TimeOverview.filterOutOfRangeEvents(range, [event], baseDate, interval)
				o.check(result).deepEquals([event])
			})

			o.test("completely overlaps the given range", function () {
				const event = makeEvent(eventId, makeDate(11, 30), makeDate(13, 45))
				const result = TimeOverview.filterOutOfRangeEvents(range, [event], baseDate, interval)
				o.check(result).deepEquals([event])
			})
		})

		o.test("events completely outside the range should be filtered out", function () {
			const beforeRange = makeEvent(eventId, makeDate(10, 0), makeDate(11, 0))
			const afterRange = makeEvent(eventId, makeDate(14, 0), makeDate(15, 0))
			const result = TimeOverview.filterOutOfRangeEvents(range, [beforeRange, afterRange], baseDate, interval)
			o.check(result).deepEquals([])
		})

		o.test("range ending on next day is clipped to midnight", function () {
			const overnightRange = {
				start: new Time(23, 30),
				end: new Time(0, 30),
			}

			const beforeMidnight = makeEvent(eventId, makeDate(23, 45), makeDate(23, 55))

			const crossesMidnight = makeEvent(eventId, makeDate(23, 45), makeDate(1, 55))
			crossesMidnight.event.endTime = incrementDate(crossesMidnight.event.endTime, 1)

			const afterMidnight = makeEvent(eventId, makeDate(0, 45), makeDate(1, 55))
			afterMidnight.event.startTime = incrementDate(afterMidnight.event.startTime, 1)
			afterMidnight.event.endTime = incrementDate(afterMidnight.event.endTime, 1)

			const result = TimeOverview.filterOutOfRangeEvents(overnightRange, [beforeMidnight, crossesMidnight, afterMidnight], baseDate, interval)

			o.check(result).deepEquals([beforeMidnight, crossesMidnight])
		})
	})
})
