import { AdvancedRepeatRule, CalendarEvent, CalendarEventParams, CalendarRepeatRule, createAdvancedRepeatRule } from "@tutao/entities/tutanota"
import { createDateWrapper, createRepeatRule, RepeatRule } from "@tutao/entities/sys"
import {
	CalendarEventTimes,
	getAllDayDateUTC,
	getEventWithDefaultTimes,
	isAllDayEvent,
	normalizeTime,
} from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import { Time } from "../../../../common/calendar/date/Time.js"
import { DateTime, DurationLikeObject } from "luxon"
import {
	areAllAdvancedRepeatRulesValid,
	areExcludedDatesEqual,
	areRepeatRulesEqual,
	ByRule,
	CalendarEventValidity,
	checkEventDateValidity,
	getAllDayDateUTCFromZone,
	getEventEnd,
	getEventStart,
	getRepeatEndTimeForDisplay,
	incrementByRepeatPeriod,
} from "../../../../common/calendar/date/CalendarUtils.js"
import { assertNotNull, filterInt, noOp } from "@tutao/utils"
import { clone } from "@tutao/meta"
import { EndType, ProgrammingError, RepeatPeriod, Weekday } from "@tutao/app-env"
import { UserError } from "../../../../common/api/main/UserError.js"
import m from "mithril"

/*
 * start, end, repeat, exclusions, reschedulings
 */
export class CalendarEventWhenModel {
	private repeatRule: CalendarRepeatRule | null = null
	private _isAllDay: boolean
	private useDefaultTimesWhenToggleAllDayOff: boolean = true

	private startDateTime: DateTime
	private endDateTime: DateTime

	private startTimeZone: string | null
	private endTimeZone: string | null

	constructor(
		private readonly initialValues: CalendarEventParams,
		public readonly calendarTimeZone: string,
		private readonly uiUpdateCallback: () => void = noOp,
	) {
		const defaultTimes = getEventWithDefaultTimes(initialValues.startTime)
		const initialTimes: CalendarEventTimes = {
			startTime: initialValues.startTime ? normalizeTime(initialValues.startTime) : normalizeTime(defaultTimes.startTime),
			endTime: initialValues.endTime ? normalizeTime(initialValues.endTime) : normalizeTime(defaultTimes.endTime),
		}

		this._isAllDay = isAllDayEvent(initialTimes)
		this.useDefaultTimesWhenToggleAllDayOff = this._isAllDay
		this.repeatRule = clone(initialValues.repeatRule ?? null)

		const eventStart = getEventStart(initialTimes, this.calendarTimeZone)
		const eventEnd = getEventEnd(initialTimes, this.calendarTimeZone)

		this.startTimeZone = initialValues.startTimeZone ?? null
		this.endTimeZone = initialValues.endTimeZone ?? initialValues.startTimeZone ?? null

		if (this._isAllDay) {
			this.startDateTime = DateTime.utc(eventStart.getFullYear(), eventStart.getMonth() + 1, eventStart.getDate())
			this.endDateTime = DateTime.utc(eventEnd.getFullYear(), eventEnd.getMonth() + 1, eventEnd.getDate()).minus({ day: 1 })
		} else {
			this.startDateTime = DateTime.fromJSDate(eventStart, { zone: this.startTimeZone ?? this.calendarTimeZone })
			this.endDateTime = DateTime.fromJSDate(eventEnd, { zone: this.endTimeZone ?? this.calendarTimeZone })
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

		this._isAllDay = value
		let newStartDateTimeZone: string
		let newEndDateTimeZone: string
		if (this._isAllDay) {
			// reset time zone if allDay is true (prevents bugs where timezone info is still shown for all day events)
			this.startTimeZone = null
			this.endTimeZone = null
			// Use UTC in start and end datetimes because all-day events are always in UTC
			newStartDateTimeZone = "UTC"
			newEndDateTimeZone = "UTC"
		} else {
			if (this.useDefaultTimesWhenToggleAllDayOff) {
				// set start & end times to default times
				const defaultTimes = getEventWithDefaultTimes()
				this.startDateTime = this.startDateTime.set({ hour: defaultTimes.startTime.getHours(), minute: defaultTimes.startTime.getMinutes() })
				this.endDateTime = this.endDateTime.minus({ day: 1 }).set({ hour: defaultTimes.endTime.getHours(), minute: defaultTimes.endTime.getMinutes() })

				this.useDefaultTimesWhenToggleAllDayOff = false
			}
			newStartDateTimeZone = this.startTimeZone ?? this.calendarTimeZone
			newEndDateTimeZone = this.endTimeZone ?? this.calendarTimeZone
		}
		this.startDateTime = this.startDateTime.setZone(newStartDateTimeZone, { keepLocalTime: true })
		this.endDateTime = this.endDateTime.setZone(newEndDateTimeZone, { keepLocalTime: true })

		if (this.repeatRule != null) {
			const previousEndDate = this.repeatEndDateForDisplay
			this.repeatEndDateForDisplay = previousEndDate
			if (this._isAllDay) {
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
	 * the current start time (hour:minutes) of the event in the start time zone.
	 * will return 00:00 for all-day events.
	 */
	get startTime(): Time {
		if (this._isAllDay) {
			return new Time(0, 0)
		}

		return new Time(this.startDateTime.hour, this.startDateTime.minute)
	}

	/**
	 * set the time portion of the events start time. the date portion will not be modified.
	 * will also adjust the end time accordingly to keep the event length the same.
	 *  */
	set startTime(v: Time | null) {
		if (v == null || this._isAllDay) {
			return
		}

		if (!this.hasValidStartBeforeEnd()) {
			// Allow the user to correct the invalid state by only changing the start time,
			// decoupled from the end time
			this.startDateTime = this.startDateTime.set({ hour: v.hour, minute: v.minute })
			return
		}

		// const startTime = this._startTime!
		const delta = ((v.hour - this.startDateTime.hour) * 60 + (v.minute - this.startDateTime.minute)) * 60000

		if (delta === 0) {
			return
		}

		this.shiftEvent({ millisecond: delta })
		this.uiUpdateCallback()
	}

	/**
	 * the current end time (hour:minutes) of the event in the end time zone.
	 * will return 00:00 for all-day events independently of the time zone.
	 */
	get endTime(): Time {
		if (this._isAllDay) {
			return new Time(0, 0)
		}

		return new Time(this.endDateTime.hour, this.endDateTime.minute)
	}

	/**
	 * set the time portion of the events end time. the date portion will not be modified.
	 *
	 */
	set endTime(newEndTime: Time | null) {
		if (newEndTime == null || this._isAllDay) {
			return
		}
		this.endDateTime = this.endDateTime.set({ hour: newEndTime.hour, minute: newEndTime.minute })
		this.uiUpdateCallback()
	}

	/** return the duration of the event in minutes */
	get duration(): { minutes: number } {
		return { minutes: this.startDateTime.diff(this.endDateTime).as("minutes") }
	}

	/** set the duration of the event in minutes, effectively setting the endDate and endTime. */
	set duration(duration: { minutes: number }) {
		if (duration.minutes < 0) {
			console.warn(`Attempted to set invalid negative event duration = ${duration.minutes}mins!`)
			return
		}
		this.endDateTime = this.startDateTime.plus(duration)
	}

	private validateAndCorrectInputDate(date: Date) {
		const validity = checkEventDateValidity(date)
		if (validity === CalendarEventValidity.InvalidDate) {
			throw new ProgrammingError("Attempted to set invalid date!")
		}
		if (validity === CalendarEventValidity.InvalidPre1970) {
			// The custom ID for events is derived from the unix timestamp, and sorting
			// the negative ids is a challenge we decided not to
			// tackle because it is a rare case and only getting rarer.

			const thisYear = new Date().getFullYear()
			console.warn(`User attempted to set date before 1970: '${date}' Overwriting year with current year = ${thisYear}!`)
			date.setFullYear(thisYear)
		}
	}

	/**
	 * get the start time of the day this event currently starts in UTC, in local time
	 * for display purposes.
	 *
	 * will always be a start of day in local time.
	 */
	get startDate(): Date {
		return new Date(this.startDateTime.year, this.startDateTime.month - 1, this.startDateTime.day)
	}

	/**
	 * moves the event to the provided date (time component is ignored)
	 * will also update the end date and move it the same amount of days as the start date was moved.
	 *
	 * setting a date before 1970 will result in the date being set to CURRENT_YEAR
	 * */
	rescheduleEventToDate(date: Date) {
		this.validateAndCorrectInputDate(date)

		const newYear = date.getFullYear()
		const newMonth = date.getMonth() + 1
		const newDay = date.getDate()
		if (newYear === this.startDateTime.year && newMonth === this.startDateTime.month && newDay === this.startDateTime.day) {
			return
		}
		const newStartDateTime = this.startDateTime.set({ year: newYear, month: newMonth, day: newDay })
		const diff = newStartDateTime.diff(this.startDateTime)
		this.startDateTime = this.startDateTime.plus(diff)
		this.endDateTime = this.endDateTime.plus(diff)
		this.uiUpdateCallback()
	}

	/**
	 * for display purposes.
	 *
	 * will always be a start of day in local time.
	 */
	get endDate(): Date {
		return new Date(this.endDateTime.year, this.endDateTime.month - 1, this.endDateTime.day)
	}

	/**
	 * set the date portion of the events end time (value's time component is ignored)
	 *
	 * */
	set endDate(value: Date) {
		this.validateAndCorrectInputDate(value)

		if (this._isAllDay) {
			value.setDate(value.getDate() + 1)
		}
		const newEndYear = value.getFullYear()
		const newEndMonth = value.getMonth() + 1
		let newEndDay = value.getDate()
		if (newEndYear === this.endDateTime.year && newEndMonth === this.endDateTime.month && newEndDay === this.endDateTime.day) {
			return
		}

		const startYear = this.startDateTime.year
		const startMonth = this.startDateTime.month
		const startDay = this.startDateTime.day

		let isBeforeStart: boolean
		if (newEndYear === startYear) {
			if (newEndMonth === startMonth) {
				isBeforeStart = newEndDay < startDay
			} else {
				isBeforeStart = newEndMonth < startMonth
			}
		} else {
			isBeforeStart = newEndYear < startYear
		}
		if (isBeforeStart) {
			console.log("tried to set the end date to before the start date")
			return
		}

		this.endDateTime = this.endDateTime.set({ year: newEndYear, month: newEndMonth, day: newEndDay })

		this.uiUpdateCallback()
	}

	get repeatPeriod(): RepeatPeriod | null {
		return this.repeatRule ? (this.repeatRule.frequency as RepeatPeriod) : null
	}

	get advancedRules(): AdvancedRepeatRule[] {
		return this.repeatRule?.advancedRules ?? []
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
						advancedRules: [],
					})
			this.repeatRule.frequency = repeatPeriod
		}
		this.uiUpdateCallback()
	}

	set advancedRules(advancedRules: AdvancedRepeatRule[]) {
		if (this.repeatRule && this.repeatRule.advancedRules !== advancedRules) {
			this.repeatRule.advancedRules = advancedRules
		}
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
				this.repeatRule.endValue = getDefaultEndDateEndValue(this.startDate, this.calendarTimeZone)
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
			return getRepeatEndTimeForDisplay(this.repeatRule, this.isAllDay, this.calendarTimeZone)
		} else {
			return new Date(filterInt(getDefaultEndDateEndValue(this.startDate, this.calendarTimeZone)))
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

		const repeatEndDate = incrementByRepeatPeriod(newRepeatEndDate, RepeatPeriod.DAILY, 1, this.endTimeZone ?? this.calendarTimeZone)
		// We pass this.calendarTimeZone because we use it to convert an all-day to local timezone.
		if (repeatEndDate < this.startDateTime.toJSDate()) {
			throw new UserError("startAfterEnd_label")
		}

		// We have to save repeatEndDate in the same way we save start/end times because if one is timezone
		// dependent and one is not then we have interesting bugs in edge cases (event created in -11 could
		// end on another date in +12). So for all day events end date is UTC-encoded. all day event and for
		// regular events it is just a timestamp.
		const numberEndDate = (this.isAllDay ? getAllDayDateUTCFromZone(repeatEndDate, this.calendarTimeZone) : repeatEndDate).getTime()
		this.repeatRule.endValue = String(numberEndDate)
		this.uiUpdateCallback()
	}

	get excludedDates(): ReadonlyArray<Date> {
		return this.repeatRule?.excludedDates.map(({ date }) => date) ?? []
	}

	allowsTimeZones() {
		return !this._isAllDay
	}

	setStartTimeZone(startTimeZone: string) {
		this.startTimeZone = startTimeZone
		this.startDateTime = this.startDateTime.setZone(this.startTimeZone, { keepLocalTime: true })
		this.uiUpdateCallback()
	}

	getStartTimeZone(): string | null {
		return this.startTimeZone
	}

	setEndTimeZone(endTimeZone: string) {
		this.endTimeZone = endTimeZone
		this.endDateTime = this.endDateTime.setZone(this.endTimeZone, { keepLocalTime: true })
		this.uiUpdateCallback()
	}

	getEndTimeZone(): string | null {
		return this.endTimeZone
	}

	hasSeparateStartAndEndTimeZone(): boolean {
		return this.startTimeZone !== this.endTimeZone
	}

	removeTimeZones() {
		this.startTimeZone = null
		this.endTimeZone = null

		let newDateTimeTimeZone: string
		if (this._isAllDay) {
			console.warn("Trying to unset time zones on all day event!")
			newDateTimeTimeZone = "UTC"
		} else {
			newDateTimeTimeZone = this.calendarTimeZone
		}
		this.startDateTime = this.startDateTime.setZone(newDateTimeTimeZone, { keepLocalTime: true })
		this.endDateTime = this.endDateTime.setZone(newDateTimeTimeZone, { keepLocalTime: true })
	}

	/**
	 * In case we change the Date within the EventEditor, or we Drag & Drop an event to another date, advanced repeat rules will become inconsistent.
	 * Monthly BYDAY Rules are bound to the weekday of the event date, so we have to change the advanced repeat rules accordingly.
	 * This should only be done for valid rules, if unsupported rules exist on the event, the User receives a warning and the rules are purged.
	 * @param date Date that the BYDAY rule shall be moved to
	 */
	resetMonthlyByDayRules(date: Date): void {
		if (areAllAdvancedRepeatRulesValid(this.advancedRules, this.repeatPeriod)) {
			const byDayRules = this.advancedRules.filter((rule) => rule.ruleType === ByRule.BYDAY)
			const weekday: Weekday = Object.values(Weekday)[DateTime.fromJSDate(date).weekday - 1]
			const regex = /^[+-]?\d/g // Regex for extracting the first digit from interval

			if (byDayRules[0]) {
				const interval = Array.from(byDayRules[0].interval.matchAll(regex)).flat()[0] // collect interval

				if (interval) {
					this.advancedRules = this.createAdvancedRulesFromWeekdays([weekday], parseInt(interval))
					m.redraw()
				} else {
					this.advancedRules = []
				}
			}
		} else {
			this.advancedRules = []
		}
	}

	/**
	 * Returns an Array of BYDAY Advanced Repeat Rules for a given set of weekdays.
	 * @param weekdays Either the weekdays a weekly event - or a singular weekday (first, second, ..., last) in a month that a monthly event should repeat on.
	 * @param interval will only be set if weekdays.length() == 1. In this case we are writing a BYDAY Rule for FREQ=MONTHLY, in which case
	 *    we only specify what weekday of the month this event repeats on. (Ex.: BYDAY=2TH = Repeats on second THURSDAY of every month)
	 *    In case weekdays.length() == 0 && interval == 0, no BYDAY Rule shall be written, as the event will repeat on the same DAY every month.
	 */
	createAdvancedRulesFromWeekdays(weekdays: Weekday[], interval?: number): AdvancedRepeatRule[] {
		if (weekdays.length === 0 || interval === 0) return []
		return weekdays.map((wd) => {
			return createAdvancedRepeatRule({
				interval: interval ? interval.toString() + wd : wd,
				ruleType: ByRule.BYDAY,
			})
		})
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
	 * @param duration an object containing a duration in luxons year/quarter/... format
	 */
	shiftEvent(duration: DurationLikeObject): void {
		this.startDateTime = this.startDateTime.plus(duration)
		this.endDateTime = this.endDateTime.plus(duration)
	}

	getRepeatRuleOrNull(): RepeatRule | null {
		if (this.repeatRule === null) {
			return null
		}
		// we got a stripped repeat rule, so we re-create a fresh one with all fields but overwrite it with our values.
		const repeatRule: RepeatRule = {
			...createRepeatRule({
				timeZone: "",
				excludedDates: [],
				endType: "0",
				endValue: null,
				interval: "0",
				frequency: "0",
				advancedRules: [],
			}),
			...this.repeatRule,
			timeZone: this.startTimeZone ?? this.calendarTimeZone,
		}
		this.deleteExcludedDatesIfNecessary(repeatRule)
		return repeatRule
	}

	getStartDateTime() {
		return this.startDateTime
	}

	getEndDateTime() {
		return this.endDateTime
	}

	hasValidStartBeforeEnd(): boolean {
		return this.startDateTime.diff(this.endDateTime).as("minutes") < 0
	}

	get result() {
		let startDateTime = this.startDateTime
		let endDateTime = this.endDateTime
		if (this._isAllDay) {
			startDateTime = startDateTime.set({ hour: 0, minute: 0, millisecond: 0 })
			endDateTime = endDateTime.set({ hour: 0, minute: 0, millisecond: 0 }).plus({ day: 1 })
		}

		return {
			startTime: startDateTime.toJSDate(),
			endTime: endDateTime.toJSDate(),
			repeatRule: this.getRepeatRuleOrNull(),
			startTimeZone: this.startTimeZone,
			endTimeZone: this.endTimeZone,
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

		if (this.startDateTime.toMillis() !== this.initialValues.startTime.getTime()) {
			newRepeat.excludedDates = []
			return
		}
	}

	assertHasAValidEndDateCondition() {
		const repeatRule = assertNotNull(this.repeatRule)
		if (repeatRule.endType !== EndType.UntilDate) {
			throw new Error("EndType is different from UntilDate")
		}
		if (!repeatRule.endValue) {
			throw new Error("Missing endValue for RepeatRule of type UntilDate")
		}
		return repeatRule
	}

	public removeRepeatRule() {
		this.repeatRule = null
	}
}

/**
 * Create the default repeat end date value for an event series.
 *
 * @param startTime - {@link CalendarEvent} start time
 * @param timeZone - IANA TimeZone to apply to {@link startTime}
 * @return string - Default end date timestamp one month after the event's start time
 */
export function getDefaultEndDateEndValue(startTime: Date, timeZone: string): string {
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
	return assertNotNull(whenModel.getRepeatRuleOrNull(), "tried to exclude altered instance on progenitor without repeat rule!")
}
