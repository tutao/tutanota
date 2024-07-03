import { CalendarEventTimes, getAllDayDateUTC, getEventWithDefaultTimes, isAllDayEvent } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import { Time } from "../../../../common/calendar/date/Time.js"
import { DateTime, DurationLikeObject } from "luxon"
import {
	areExcludedDatesEqual,
	areRepeatRulesEqual,
	getAllDayDateUTCFromZone,
	getEventEnd,
	getEventStart,
	getRepeatEndTimeForDisplay,
	getStartOfDayWithZone,
	getStartOfNextDayWithZone,
	incrementByRepeatPeriod,
} from "../../../../common/calendar/date/CalendarUtils.js"
import { assertNotNull, clone, filterInt, incrementDate, noOp, TIMESTAMP_ZERO_YEAR } from "@tutao/tutanota-utils"
import { CalendarEvent, CalendarRepeatRule } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import { Stripped } from "../../../../common/api/common/utils/EntityUtils.js"
import { EndType, RepeatPeriod } from "../../../../common/api/common/TutanotaConstants.js"
import { createDateWrapper, createRepeatRule, RepeatRule } from "../../../../common/api/entities/sys/TypeRefs.js"
import { UserError } from "../../../../common/api/main/UserError.js"

export type CalendarEventWhenModelResult = CalendarEventTimes & {
	repeatRule: CalendarRepeatRule | null
}

/*
 * start, end, repeat, exclusions, reschedulings
 */
export class CalendarEventWhenModel {
	private repeatRule: CalendarRepeatRule | null = null
	private _isAllDay: boolean

	/** represents the start of day of the start date in local time. */
	private _startDate: Date
	/** represents the start of day of the end date in local time. */
	private _endDate: Date

	/** we're setting time to null on all-day events to be able to have the default time set when someone unsets the all-day flag. */
	private _startTime: Time | null
	private _endTime: Time | null

	constructor(private readonly initialValues: Partial<Stripped<CalendarEvent>>, readonly zone: string, private readonly uiUpdateCallback: () => void = noOp) {
		let initialTimes: CalendarEventTimes
		if (initialValues.startTime == null || initialValues.endTime == null) {
			const defaultTimes = getEventWithDefaultTimes(initialValues.startTime)
			initialTimes = {
				startTime: initialValues.startTime ?? defaultTimes.startTime,
				endTime: initialValues.endTime ?? defaultTimes.endTime,
			}
		} else {
			initialTimes = {
				startTime: initialValues.startTime,
				endTime: initialValues.endTime,
			}
		}

		// zero out the second and millisecond part of start/end time. can't use the getters for startTime and endTime
		// because they depend on all-day status.
		initialTimes.startTime = DateTime.fromJSDate(initialTimes.startTime, { zone }).set({ second: 0, millisecond: 0 }).toJSDate()
		initialTimes.endTime = DateTime.fromJSDate(initialTimes.endTime, { zone }).set({ second: 0, millisecond: 0 }).toJSDate()

		this._isAllDay = isAllDayEvent(initialTimes)
		this.repeatRule = clone(initialValues.repeatRule ?? null)

		const start = getEventStart(initialTimes, this.zone)
		const end = getEventEnd(initialTimes, this.zone)
		if (this._isAllDay) {
			this._startTime = null
			this._endTime = null
			this._startDate = getStartOfDayWithZone(DateTime.fromJSDate(start, { zone }).toJSDate(), zone)
			this._endDate = incrementDate(end, -1)
		} else {
			this._startTime = Time.fromDateTime(DateTime.fromJSDate(start, { zone }))
			this._endTime = Time.fromDateTime(DateTime.fromJSDate(end, { zone }))
			this._startDate = getStartOfDayWithZone(DateTime.fromJSDate(start, { zone }).toJSDate(), zone)
			this._endDate = getStartOfDayWithZone(DateTime.fromJSDate(end, { zone }).toJSDate(), zone)
		}
	}

	/**
	 * set whether this event should be considered all-day
	 *
	 * will also modify the excluded dates if there are any to still exclude the
	 * same occurrence dates.
	 */
	set isAllDay(value: boolean) {
		if (this._isAllDay === value) return

		if ((!value && this._startTime == null) || this._endTime == null) {
			const defaultTimes = getEventWithDefaultTimes()
			this._startTime = Time.fromDateTime(DateTime.fromJSDate(defaultTimes.startTime, this))
			this._endTime = Time.fromDateTime(DateTime.fromJSDate(defaultTimes.endTime, this))
		}

		if (this.repeatRule == null) {
			this._isAllDay = value
		} else {
			const previousEndDate = this.repeatEndDateForDisplay
			this._isAllDay = value
			this.repeatEndDateForDisplay = previousEndDate

			if (value) {
				// we want to keep excluded dates if all we do is switching between all-day and normal event
				this.repeatRule.excludedDates = this.repeatRule.excludedDates.map(({ date }) => createDateWrapper({ date: getAllDayDateUTC(date) }))
			} else {
				const startTime = this.startTime
				this.repeatRule.excludedDates = this.repeatRule.excludedDates.map(({ date }) => createDateWrapper({ date: startTime.toDate(date) }))
			}
		}

		this.uiUpdateCallback()
	}

	get isAllDay() {
		return this._isAllDay
	}

	/**
	 * the current start time (hour:minutes) of the event in the local time zone.
	 * will return 00:00 for all-day events.
	 */
	get startTime(): Time {
		return this._isAllDay ? new Time(0, 0) : this._startTime!
	}

	/**
	 * set the time portion of the events start time. the date portion will not be modified.
	 * will also adjust the end time accordingly to keep the event length the same.
	 *  */
	set startTime(v: Time | null) {
		if (v == null || this._isAllDay) return
		const startTime = this._startTime!
		const delta = ((v.hour - startTime.hour) * 60 + (v.minute - startTime.minute)) * 60000
		if (delta === 0) return
		this.rescheduleEvent({ millisecond: delta })
		this.uiUpdateCallback()
	}

	/**
	 * the current end time (hour:minutes) of the event in the local time zone.
	 * will return 00:00 for all-day events independently of the time zone.
	 */
	get endTime(): Time {
		return this._isAllDay ? new Time(0, 0) : this._endTime!
	}

	/**
	 * set the time portion of the events end time. the date portion will not be modified.
	 *
	 */
	set endTime(v: Time | null) {
		if (v == null || this._isAllDay) return
		const startTime = this._startTime!
		const currentStart = startTime.toDate(this._startDate)
		const newEnd = v.toDate(this._endDate)
		if (newEnd < currentStart) return
		this._endTime = v
		this.uiUpdateCallback()
	}

	/** return the duration of the event in minutes */
	get duration(): { minutes: number } {
		const { startTime, endTime } = this.getTimes()
		const duration = DateTime.fromJSDate(endTime).diff(DateTime.fromJSDate(startTime))
		return { minutes: duration.as("minutes") }
	}

	/** set the duration of the event in minutes, effectively setting the endDate and endTime. */
	set duration(value: { minutes: number }) {
		if (value.minutes < 1) return
		const diff = { minutes: this.duration.minutes - value.minutes }
		const oldEndTime = this.endTime.toDateTime(this.endDate, this.zone)
		const newEndTime = oldEndTime.plus(diff)
		this._endDate = getStartOfDayWithZone(newEndTime.toJSDate(), this.zone)
		if (!this._isAllDay) {
			this._endTime = Time.fromDateTime(newEndTime)
		}
	}

	/**
	 * get the start time of the day this event currently starts in UTC, in local time
	 * for display purposes.
	 *
	 * will always be a start of day in local time.
	 */
	get startDate(): Date {
		return this._startDate
	}

	/**
	 * set the date portion of the events start time (value's time component is ignored)
	 * will also update the end date and move it the same amount of days as the start date was moved.
	 *
	 * setting a date before 1970 will result in the date being set to CURRENT_YEAR
	 * */
	set startDate(value: Date) {
		if (value.getTime() === this._startDate.getTime()) {
			return
		}

		// The custom ID for events is derived from the unix timestamp, and sorting
		// the negative ids is a challenge we decided not to
		// tackle because it is a rare case and only getting rarer.
		if (value.getTime() < TIMESTAMP_ZERO_YEAR) {
			const thisYear = new Date().getFullYear()
			value.setFullYear(thisYear)
		}
		const valueDateTime = DateTime.fromJSDate(value, { zone: this.zone })
		// asking for the rest in milliseconds causes luxon to give us an integer number of
		// days in the duration which is what we want.
		const diff = valueDateTime.diff(DateTime.fromJSDate(this._startDate, this), ["day", "millisecond"])
		if (diff.as("millisecond") === 0) return
		// we only want to add days, not milliseconds.
		this.rescheduleEvent({ days: diff.days })
		this.uiUpdateCallback()
	}

	/**
	 * for display purposes.
	 *
	 * will always be a start of day in local time.
	 */
	get endDate(): Date {
		return this._endDate
	}

	/**
	 * set the date portion of the events end time (value's time component is ignored)
	 *
	 * */
	set endDate(value: Date) {
		if (value.getTime() === this._endDate.getTime()) {
			return
		}
		const startTime = this._startTime ?? new Time(0, 0)
		const endTime = this._endTime ?? new Time(0, 0)
		const currentStart = startTime.toDate(this._startDate)
		const newEnd = endTime.toDate(value)
		if (newEnd < currentStart) {
			console.log("tried to set the end date to before the start date")
			return
		}
		this._endDate = DateTime.fromJSDate(value, this).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate()
		this.uiUpdateCallback()
	}

	get repeatPeriod(): RepeatPeriod | null {
		return this.repeatRule ? (this.repeatRule.frequency as RepeatPeriod) : null
	}

	set repeatPeriod(repeatPeriod: RepeatPeriod | null) {
		if (this.repeatRule?.frequency === repeatPeriod) {
			// repeat null => we will return if repeatPeriod is null
			// repeat not null => we return if the repeat period did not change.
			return
		} else if (repeatPeriod == null) {
			this.repeatRule = null
		} else if (this.repeatRule != null) {
			this.repeatRule.frequency = repeatPeriod
		} else {
			// new repeat rule, populate with default values.
			this.repeatRule = this.initialValues.repeatRule
				? clone(this.initialValues.repeatRule)
				: createRepeatRule({
						interval: "1",
						endType: EndType.Never,
						endValue: "1",
						frequency: RepeatPeriod.DAILY,
						excludedDates: [],
						timeZone: "",
				  })
			this.repeatRule.frequency = repeatPeriod
		}
		this.uiUpdateCallback()
	}

	/**
	 * get the current interval this series repeats in.
	 *
	 * if the event is not set to
	 */
	get repeatInterval(): number {
		if (!this.repeatRule?.interval) return 1
		return filterInt(this.repeatRule?.interval)
	}

	/**
	 * set the event to occur on every nth of its repeat period (ie every second, third, fourth day/month/year...).
	 * setting it to something less than 1 will set the interval to 1
	 * @param interval
	 */
	set repeatInterval(interval: number) {
		if (interval < 1) interval = 1
		const stringInterval = String(interval)
		if (this.repeatRule && this.repeatRule?.interval !== stringInterval) {
			this.repeatRule.interval = stringInterval
		}

		this.uiUpdateCallback()
	}

	/**
	 * get the current way for the event series to end.
	 */
	get repeatEndType(): EndType {
		return (this.repeatRule?.endType ?? EndType.Never) as EndType
	}

	/**
	 * set the way the event series will stop repeating. if this causes a change in the event,
	 * the endValue will be set to the default for the selected EndType.
	 *
	 * @param endType
	 */
	set repeatEndType(endType: EndType) {
		if (!this.repeatRule) {
			// event does not repeat, no changes necessary
			return
		}

		if (this.repeatRule.endType === endType) {
			// event series end is already set to the requested value
			return
		}

		this.repeatRule.endType = endType

		switch (endType) {
			case EndType.UntilDate:
				this.repeatRule.endValue = getDefaultEndDateEndValue({ startTime: this._startDate, endTime: this._endDate }, this.zone)
				return
			case EndType.Count:
			case EndType.Never:
				this.repeatRule.endValue = getDefaultEndCountValue()
		}

		this.uiUpdateCallback()
	}

	/**
	 * get the current maximum number of repeats. if the event is not set to repeat or
	 * end after number of occurrences, returns the default max repeat number.
	 */
	get repeatEndOccurrences(): number {
		if (this.repeatRule?.endType === EndType.Count && this.repeatRule?.endValue) {
			return filterInt(this.repeatRule?.endValue)
		} else {
			return filterInt(getDefaultEndCountValue())
		}
	}

	/**
	 * set the max number of repeats for the event series. if the event is not set to repeat or
	 * not set to repeat a maximum number of times, this is a no-op.
	 * @param endValue
	 */
	set repeatEndOccurrences(endValue: number) {
		const stringEndValue = String(endValue)
		if (this.repeatRule && this.repeatRule.endType === EndType.Count && this.repeatRule.endValue !== stringEndValue) {
			this.repeatRule.endValue = stringEndValue
		}
		this.uiUpdateCallback()
	}

	/**
	 * get the date after which the event series will stop repeating.
	 *
	 * returns the default value of a month after the start date if the event is not
	 * set to stop repeating after a certain date.
	 */
	get repeatEndDateForDisplay(): Date {
		if (this.repeatRule?.endType === EndType.UntilDate) {
			return getRepeatEndTimeForDisplay(this.repeatRule, this.isAllDay, this.zone)
		} else {
			return new Date(filterInt(getDefaultEndDateEndValue({ startTime: this._startDate, endTime: this._endDate }, this.zone)))
		}
	}

	/**
	 * set the date after which the event series ends. if the event does not repeat or the series is
	 * not set to end after a date, this is a no-op.
	 *
	 * @param newRepeatEndDate the new end date, as displayed in local time zone.
	 */
	set repeatEndDateForDisplay(newRepeatEndDate: Date) {
		if (this.repeatRule == null || this.repeatRule.endType !== EndType.UntilDate) {
			return
		}

		const repeatEndDate = incrementByRepeatPeriod(newRepeatEndDate, RepeatPeriod.DAILY, 1, this.zone)
		const times = this.getTimes()
		if (repeatEndDate < getEventStart(times, this.zone)) {
			throw new UserError("startAfterEnd_label")
		}

		// We have to save repeatEndDate in the same way we save start/end times because if one is timezone
		// dependent and one is not then we have interesting bugs in edge cases (event created in -11 could
		// end on another date in +12). So for all day events end date is UTC-encoded all day event and for
		// regular events it is just a timestamp.
		const numberEndDate = (this.isAllDay ? getAllDayDateUTCFromZone(repeatEndDate, this.zone) : repeatEndDate).getTime()
		this.repeatRule.endValue = String(numberEndDate)
		this.uiUpdateCallback()
	}

	get excludedDates(): ReadonlyArray<Date> {
		return this.repeatRule?.excludedDates.map(({ date }) => date) ?? []
	}

	/**
	 * calling this adds an exclusion for the event instance starting at dateToExclude to the repeat rule of the event,
	 * which will cause the instance to not be rendered or fire alarms.
	 * Exclusions are the start date/time of the event (as a utc timestamp)
	 *
	 * the list of exclusions is maintained sorted from earliest to latest.
	 */
	excludeDate(date: Date): void {
		if (this.repeatRule == null) {
			console.log("tried to add an exclusion for an event without a repeat rule. should probably delete the event.")
			return
		}
		const timeToInsert = date.getTime()
		let insertionIndex = -1
		for (const [index, { date }] of this.repeatRule.excludedDates.entries()) {
			// the date is already excluded, no need to do anything
			if (date.getTime() === timeToInsert) {
				return
			} else if (date.getTime() > timeToInsert) {
				insertionIndex = index
				break
			}
		}
		// as of now, our maximum repeat frequency is 1/day. this means that we could truncate this to the current day (no time)
		// but then we run into problems with time zones, since we'd like to delete the n-th occurrence of an event, but detect
		// if an event is excluded by the start of the utc day it falls on, which may depend on time zone if it's truncated to the local start of day
		// on which the exclusion is created.
		const wrapperToInsert = createDateWrapper({ date })
		if (insertionIndex < 0) {
			this.repeatRule.excludedDates.push(wrapperToInsert)
		} else {
			this.repeatRule.excludedDates.splice(insertionIndex, 0, wrapperToInsert)
		}
	}

	/**
	 * completely delete all exclusions. will cause the event to be rendered and fire alarms on all
	 * occurrences as dictated by its repeat rule.
	 */
	deleteExcludedDates(): void {
		if (!this.repeatRule) return
		this.repeatRule.excludedDates.length = 0
	}

	/**
	 * change start and end time and dates of the event by a fixed amount.
	 * @param diff an object containing a duration in luxons year/quarter/... format
	 */
	rescheduleEvent(diff: DurationLikeObject): void {
		const oldStartTime = this.startTime.toDateTime(this.startDate, this.zone)
		const oldEndTime = this.endTime.toDateTime(this.endDate, this.zone)
		const newStartDate = oldStartTime.plus(diff)
		const newEndDate = oldEndTime.plus(diff)

		this._startDate = getStartOfDayWithZone(newStartDate.toJSDate(), this.zone)
		this._endDate = getStartOfDayWithZone(newEndDate.toJSDate(), this.zone)
		if (!this._isAllDay) {
			this._startTime = Time.fromDateTime(newStartDate)
			this._endTime = Time.fromDateTime(newEndDate)
		}
	}

	get result(): CalendarEventWhenModelResult {
		// we got a stripped repeat rule, so we re-create a fresh one with all fields but overwrite it with our values.
		const repeatRule: RepeatRule | null = this.repeatRule
			? {
					...createRepeatRule({
						timeZone: "",
						excludedDates: [],
						endType: "0",
						endValue: null,
						interval: "0",
						frequency: "0",
					}),
					...this.repeatRule,
					timeZone: this.zone,
			  }
			: null
		this.deleteExcludedDatesIfNecessary(repeatRule)
		const { startTime, endTime } = this.getTimes()
		return { startTime, endTime, repeatRule }
	}

	/**
	 * get the JS dates where the event starts and ends as they would be saved on the server (display may vary)
	 * @param startDate base date to use for the start date
	 * @param endDate base date to use for the end date.
	 * @private
	 */
	private getTimes(
		{ startDate, endDate }: { startDate: Date; endDate: Date } = {
			startDate: this._startDate,
			endDate: this._endDate,
		},
	): CalendarEventTimes {
		if (this._isAllDay) {
			const startTime = getAllDayDateUTCFromZone(startDate, this.zone)
			const endTime = getAllDayDateUTCFromZone(getStartOfNextDayWithZone(endDate, this.zone), this.zone)
			return { startTime, endTime }
		} else {
			const startTime = this._startTime!.toDateTime(getStartOfDayWithZone(startDate, this.zone), this.zone).toJSDate()
			const endTime = this._endTime!.toDateTime(getStartOfDayWithZone(endDate, this.zone), this.zone).toJSDate()
			return { startTime, endTime }
		}
	}

	/**
	 * ideally, we want to delete exclusions after an edit operation only when necessary.
	 * @private
	 */
	private deleteExcludedDatesIfNecessary(newRepeat: RepeatRule | null) {
		if (newRepeat == null) return
		const oldRepeat = this.initialValues.repeatRule ?? null
		// if excluded dates have changed,
		if (!areRepeatRulesEqual(newRepeat, oldRepeat) && areExcludedDatesEqual(newRepeat?.excludedDates ?? [], oldRepeat?.excludedDates ?? [])) {
			newRepeat.excludedDates = []
			return
		}
		if (this.initialValues.startTime == null) {
			return
		}
		const { startTime } = this.getTimes()
		if (startTime.getTime() !== this.initialValues.startTime.getTime()) {
			newRepeat.excludedDates = []
			return
		}
	}
}

/**
 * create the default repeat end for an event series that ends on a date
 */
export function getDefaultEndDateEndValue({ startTime }: CalendarEventTimes, timeZone: string): string {
	// one month after the event's start time in the local time zone.
	return String(incrementByRepeatPeriod(startTime, RepeatPeriod.MONTHLY, 1, timeZone).getTime())
}

/**
 * get the default repeat end for an event series that ends after number of repeats
 */
export function getDefaultEndCountValue(): string {
	return "10"
}

export function repeatRuleWithExcludedAlteredInstances(progenitor: CalendarEvent, recurrenceIds: ReadonlyArray<Date>, timeZone: string): CalendarRepeatRule {
	const whenModel = new CalendarEventWhenModel(progenitor, timeZone)
	for (const recurrenceId of recurrenceIds) {
		whenModel.excludeDate(recurrenceId)
	}
	return assertNotNull(whenModel.result.repeatRule, "tried to exclude altered instance on progenitor without repeat rule!")
}
