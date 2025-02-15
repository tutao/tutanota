import { TIMESTAMP_ZERO_YEAR, assertNotNull, clone, filterInt, incrementDate, noOp, pad } from "./dist2-chunk.js";
import { EndType, RepeatPeriod } from "./TutanotaConstants-chunk.js";
import { DateTime } from "./luxon-chunk.js";
import { getAllDayDateUTC, getEventWithDefaultTimes, isAllDayEvent } from "./CommonCalendarUtils-chunk.js";
import { createDateWrapper, createRepeatRule } from "./TypeRefs2-chunk.js";
import { areExcludedDatesEqual, areRepeatRulesEqual, getAllDayDateUTCFromZone, getEventEnd, getEventStart, getRepeatEndTimeForDisplay, getStartOfDayWithZone, getStartOfNextDayWithZone, incrementByRepeatPeriod } from "./CalendarUtils-chunk.js";
import { UserError } from "./UserError-chunk.js";

//#region src/common/calendar/date/Time.ts
var Time = class Time {
	hour;
	minute;
	constructor(hour, minute) {
		this.hour = Math.floor(hour) % 24;
		this.minute = Math.floor(minute) % 60;
	}
	/**
	* create a time by extracting hour and minute from a date object.
	* @param date the date to extract the time from
	* NOTE: all calculations are done in local time.
	*/
	static fromDate(date) {
		return new Time(date.getHours(), date.getMinutes());
	}
	static fromDateTime({ hour, minute }) {
		return new Time(hour, minute);
	}
	/**
	* Accepts 2, 2:30, 2:5, 02:05, 02:30, 24:30, 2430, 12:30pm, 12:30 p.m.
	*/
	static parseFromString(timeString) {
		let suffix;
		let hours;
		let minutes;
		let mt = timeString.match(/^(\d{1,2}):(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)?$/i);
		if (mt != null) {
			suffix = mt[3];
			hours = parseInt(mt[1], 10);
			minutes = parseInt(mt[2], 10);
		} else {
			mt = timeString.match(/^(\d{1,4})\s*(am|pm|a\.m\.|p\.m\.)?$/i);
			if (mt != null) {
				suffix = mt[2];
				const digits = mt[1];
				if (digits.length <= 2) {
					hours = parseInt(digits, 10);
					minutes = 0;
				} else {
					hours = parseInt(digits.substring(0, digits.length - 2), 10);
					minutes = parseInt(digits.slice(-2), 10);
				}
			} else return null;
		}
		if (isNaN(hours) || isNaN(minutes) || minutes > 59) return null;
		if (suffix) suffix = suffix.toUpperCase();
		if (suffix === "PM" || suffix === "P.M.") {
			if (hours > 12) return null;
			if (hours !== 12) hours = hours + 12;
		} else if (suffix === "AM" || suffix === "A.M.") {
			if (hours > 12) return null;
			if (hours === 12) hours = 0;
		} else if (hours > 23) return null;
		return new Time(hours, minutes);
	}
	/**
	* convert into a date
	* if base date is set it will use the date values from that,
	* otherwise it will use the current date.
	*
	* NOTE: calculations are done in the local time.
	*/
	toDate(baseDate) {
		const date = baseDate ? new Date(baseDate) : new Date();
		date.setHours(this.hour);
		date.setMinutes(this.minute);
		date.setSeconds(0);
		date.setMilliseconds(0);
		return date;
	}
	toDateTime(baseDate, zone) {
		return DateTime.fromJSDate(baseDate, { zone }).set(this);
	}
	equals(otherTime) {
		return this.hour === otherTime.hour && this.minute === otherTime.minute;
	}
	toString(amPmFormat) {
		return amPmFormat ? this.to12HourString() : this.to24HourString();
	}
	to12HourString() {
		const minutesString = pad(this.minute, 2);
		if (this.hour === 0) return `12:${minutesString} am`;
else if (this.hour === 12) return `12:${minutesString} pm`;
else if (this.hour > 12) return `${this.hour - 12}:${minutesString} pm`;
else return `${this.hour}:${minutesString} am`;
	}
	to24HourString() {
		const hours = pad(this.hour, 2);
		const minutes = pad(this.minute, 2);
		return `${hours}:${minutes}`;
	}
	toObject() {
		return {
			hours: this.hour,
			minutes: this.minute
		};
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/eventeditor-model/CalendarEventWhenModel.ts
var CalendarEventWhenModel = class {
	repeatRule = null;
	_isAllDay;
	/** represents the start of day of the start date in local time. */
	_startDate;
	/** represents the start of day of the end date in local time. */
	_endDate;
	/** we're setting time to null on all-day events to be able to have the default time set when someone unsets the all-day flag. */
	_startTime;
	_endTime;
	constructor(initialValues, zone, uiUpdateCallback = noOp) {
		this.initialValues = initialValues;
		this.zone = zone;
		this.uiUpdateCallback = uiUpdateCallback;
		let initialTimes;
		if (initialValues.startTime == null || initialValues.endTime == null) {
			const defaultTimes = getEventWithDefaultTimes(initialValues.startTime);
			initialTimes = {
				startTime: initialValues.startTime ?? defaultTimes.startTime,
				endTime: initialValues.endTime ?? defaultTimes.endTime
			};
		} else initialTimes = {
			startTime: initialValues.startTime,
			endTime: initialValues.endTime
		};
		initialTimes.startTime = DateTime.fromJSDate(initialTimes.startTime, { zone }).set({
			second: 0,
			millisecond: 0
		}).toJSDate();
		initialTimes.endTime = DateTime.fromJSDate(initialTimes.endTime, { zone }).set({
			second: 0,
			millisecond: 0
		}).toJSDate();
		this._isAllDay = isAllDayEvent(initialTimes);
		this.repeatRule = clone(initialValues.repeatRule ?? null);
		const start = getEventStart(initialTimes, this.zone);
		const end = getEventEnd(initialTimes, this.zone);
		if (this._isAllDay) {
			this._startTime = null;
			this._endTime = null;
			this._startDate = getStartOfDayWithZone(DateTime.fromJSDate(start, { zone }).toJSDate(), zone);
			this._endDate = incrementDate(end, -1);
		} else {
			this._startTime = Time.fromDateTime(DateTime.fromJSDate(start, { zone }));
			this._endTime = Time.fromDateTime(DateTime.fromJSDate(end, { zone }));
			this._startDate = getStartOfDayWithZone(DateTime.fromJSDate(start, { zone }).toJSDate(), zone);
			this._endDate = getStartOfDayWithZone(DateTime.fromJSDate(end, { zone }).toJSDate(), zone);
		}
	}
	/**
	* set whether this event should be considered all-day
	*
	* will also modify the excluded dates if there are any to still exclude the
	* same occurrence dates.
	*/
	set isAllDay(value) {
		if (this._isAllDay === value) return;
		if (!value && this._startTime == null || this._endTime == null) {
			const defaultTimes = getEventWithDefaultTimes();
			this._startTime = Time.fromDateTime(DateTime.fromJSDate(defaultTimes.startTime, this));
			this._endTime = Time.fromDateTime(DateTime.fromJSDate(defaultTimes.endTime, this));
		}
		if (this.repeatRule == null) this._isAllDay = value;
else {
			const previousEndDate = this.repeatEndDateForDisplay;
			this._isAllDay = value;
			this.repeatEndDateForDisplay = previousEndDate;
			if (value) this.repeatRule.excludedDates = this.repeatRule.excludedDates.map(({ date }) => createDateWrapper({ date: getAllDayDateUTC(date) }));
else {
				const startTime = this.startTime;
				this.repeatRule.excludedDates = this.repeatRule.excludedDates.map(({ date }) => createDateWrapper({ date: startTime.toDate(date) }));
			}
		}
		this.uiUpdateCallback();
	}
	get isAllDay() {
		return this._isAllDay;
	}
	/**
	* the current start time (hour:minutes) of the event in the local time zone.
	* will return 00:00 for all-day events.
	*/
	get startTime() {
		return this._isAllDay ? new Time(0, 0) : this._startTime;
	}
	/**
	* set the time portion of the events start time. the date portion will not be modified.
	* will also adjust the end time accordingly to keep the event length the same.
	*  */
	set startTime(v) {
		if (v == null || this._isAllDay) return;
		const startTime = this._startTime;
		const delta = ((v.hour - startTime.hour) * 60 + (v.minute - startTime.minute)) * 6e4;
		if (delta === 0) return;
		this.rescheduleEvent({ millisecond: delta });
		this.uiUpdateCallback();
	}
	/**
	* the current end time (hour:minutes) of the event in the local time zone.
	* will return 00:00 for all-day events independently of the time zone.
	*/
	get endTime() {
		return this._isAllDay ? new Time(0, 0) : this._endTime;
	}
	/**
	* set the time portion of the events end time. the date portion will not be modified.
	*
	*/
	set endTime(v) {
		if (v == null || this._isAllDay) return;
		const startTime = this._startTime;
		const currentStart = startTime.toDate(this._startDate);
		const newEnd = v.toDate(this._endDate);
		if (newEnd < currentStart) return;
		this._endTime = v;
		this.uiUpdateCallback();
	}
	/** return the duration of the event in minutes */
	get duration() {
		const { startTime, endTime } = this.getTimes();
		const duration = DateTime.fromJSDate(endTime).diff(DateTime.fromJSDate(startTime));
		return { minutes: duration.as("minutes") };
	}
	/** set the duration of the event in minutes, effectively setting the endDate and endTime. */
	set duration(value) {
		if (value.minutes < 1) return;
		const diff = { minutes: this.duration.minutes - value.minutes };
		const oldEndTime = this.endTime.toDateTime(this.endDate, this.zone);
		const newEndTime = oldEndTime.plus(diff);
		this._endDate = getStartOfDayWithZone(newEndTime.toJSDate(), this.zone);
		if (!this._isAllDay) this._endTime = Time.fromDateTime(newEndTime);
	}
	/**
	* get the start time of the day this event currently starts in UTC, in local time
	* for display purposes.
	*
	* will always be a start of day in local time.
	*/
	get startDate() {
		return this._startDate;
	}
	/**
	* set the date portion of the events start time (value's time component is ignored)
	* will also update the end date and move it the same amount of days as the start date was moved.
	*
	* setting a date before 1970 will result in the date being set to CURRENT_YEAR
	* */
	set startDate(value) {
		if (value.getTime() === this._startDate.getTime()) return;
		if (value.getTime() < TIMESTAMP_ZERO_YEAR) {
			const thisYear = new Date().getFullYear();
			value.setFullYear(thisYear);
		}
		const valueDateTime = DateTime.fromJSDate(value, { zone: this.zone });
		const diff = valueDateTime.diff(DateTime.fromJSDate(this._startDate, this), ["day", "millisecond"]);
		if (diff.as("millisecond") === 0) return;
		this.rescheduleEvent({ days: diff.days });
		this.uiUpdateCallback();
	}
	/**
	* for display purposes.
	*
	* will always be a start of day in local time.
	*/
	get endDate() {
		return this._endDate;
	}
	/**
	* set the date portion of the events end time (value's time component is ignored)
	*
	* */
	set endDate(value) {
		if (value.getTime() === this._endDate.getTime()) return;
		const startTime = this._startTime ?? new Time(0, 0);
		const endTime = this._endTime ?? new Time(0, 0);
		const currentStart = startTime.toDate(this._startDate);
		const newEnd = endTime.toDate(value);
		if (newEnd < currentStart) {
			console.log("tried to set the end date to before the start date");
			return;
		}
		this._endDate = DateTime.fromJSDate(value, this).set({
			hour: 0,
			minute: 0,
			second: 0,
			millisecond: 0
		}).toJSDate();
		this.uiUpdateCallback();
	}
	get repeatPeriod() {
		return this.repeatRule ? this.repeatRule.frequency : null;
	}
	set repeatPeriod(repeatPeriod) {
		if (this.repeatRule?.frequency === repeatPeriod) return;
else if (repeatPeriod == null) this.repeatRule = null;
else if (this.repeatRule != null) this.repeatRule.frequency = repeatPeriod;
else {
			this.repeatRule = this.initialValues.repeatRule ? clone(this.initialValues.repeatRule) : createRepeatRule({
				interval: "1",
				endType: EndType.Never,
				endValue: "1",
				frequency: RepeatPeriod.DAILY,
				excludedDates: [],
				timeZone: "",
				advancedRules: []
			});
			this.repeatRule.frequency = repeatPeriod;
		}
		this.uiUpdateCallback();
	}
	/**
	* get the current interval this series repeats in.
	*
	* if the event is not set to
	*/
	get repeatInterval() {
		if (!this.repeatRule?.interval) return 1;
		return filterInt(this.repeatRule?.interval);
	}
	/**
	* set the event to occur on every nth of its repeat period (ie every second, third, fourth day/month/year...).
	* setting it to something less than 1 will set the interval to 1
	* @param interval
	*/
	set repeatInterval(interval) {
		if (interval < 1) interval = 1;
		const stringInterval = String(interval);
		if (this.repeatRule && this.repeatRule?.interval !== stringInterval) this.repeatRule.interval = stringInterval;
		this.uiUpdateCallback();
	}
	/**
	* get the current way for the event series to end.
	*/
	get repeatEndType() {
		return this.repeatRule?.endType ?? EndType.Never;
	}
	/**
	* set the way the event series will stop repeating. if this causes a change in the event,
	* the endValue will be set to the default for the selected EndType.
	*
	* @param endType
	*/
	set repeatEndType(endType) {
		if (!this.repeatRule) return;
		if (this.repeatRule.endType === endType) return;
		this.repeatRule.endType = endType;
		switch (endType) {
			case EndType.UntilDate:
				this.repeatRule.endValue = getDefaultEndDateEndValue({
					startTime: this._startDate,
					endTime: this._endDate
				}, this.zone);
				return;
			case EndType.Count:
			case EndType.Never: this.repeatRule.endValue = getDefaultEndCountValue();
		}
		this.uiUpdateCallback();
	}
	/**
	* get the current maximum number of repeats. if the event is not set to repeat or
	* end after number of occurrences, returns the default max repeat number.
	*/
	get repeatEndOccurrences() {
		if (this.repeatRule?.endType === EndType.Count && this.repeatRule?.endValue) return filterInt(this.repeatRule?.endValue);
else return filterInt(getDefaultEndCountValue());
	}
	/**
	* set the max number of repeats for the event series. if the event is not set to repeat or
	* not set to repeat a maximum number of times, this is a no-op.
	* @param endValue
	*/
	set repeatEndOccurrences(endValue) {
		const stringEndValue = String(endValue);
		if (this.repeatRule && this.repeatRule.endType === EndType.Count && this.repeatRule.endValue !== stringEndValue) this.repeatRule.endValue = stringEndValue;
		this.uiUpdateCallback();
	}
	/**
	* get the date after which the event series will stop repeating.
	*
	* returns the default value of a month after the start date if the event is not
	* set to stop repeating after a certain date.
	*/
	get repeatEndDateForDisplay() {
		if (this.repeatRule?.endType === EndType.UntilDate) return getRepeatEndTimeForDisplay(this.repeatRule, this.isAllDay, this.zone);
else return new Date(filterInt(getDefaultEndDateEndValue({
			startTime: this._startDate,
			endTime: this._endDate
		}, this.zone)));
	}
	/**
	* set the date after which the event series ends. if the event does not repeat or the series is
	* not set to end after a date, this is a no-op.
	*
	* @param newRepeatEndDate the new end date, as displayed in local time zone.
	*/
	set repeatEndDateForDisplay(newRepeatEndDate) {
		if (this.repeatRule == null || this.repeatRule.endType !== EndType.UntilDate) return;
		const repeatEndDate = incrementByRepeatPeriod(newRepeatEndDate, RepeatPeriod.DAILY, 1, this.zone);
		const times = this.getTimes();
		if (repeatEndDate < getEventStart(times, this.zone)) throw new UserError("startAfterEnd_label");
		const numberEndDate = (this.isAllDay ? getAllDayDateUTCFromZone(repeatEndDate, this.zone) : repeatEndDate).getTime();
		this.repeatRule.endValue = String(numberEndDate);
		this.uiUpdateCallback();
	}
	get excludedDates() {
		return this.repeatRule?.excludedDates.map(({ date }) => date) ?? [];
	}
	/**
	* calling this adds an exclusion for the event instance starting at dateToExclude to the repeat rule of the event,
	* which will cause the instance to not be rendered or fire alarms.
	* Exclusions are the start date/time of the event (as a utc timestamp)
	*
	* the list of exclusions is maintained sorted from earliest to latest.
	*/
	excludeDate(date) {
		if (this.repeatRule == null) {
			console.log("tried to add an exclusion for an event without a repeat rule. should probably delete the event.");
			return;
		}
		const timeToInsert = date.getTime();
		let insertionIndex = -1;
		for (const [index, { date: date$1 }] of this.repeatRule.excludedDates.entries()) if (date$1.getTime() === timeToInsert) return;
else if (date$1.getTime() > timeToInsert) {
			insertionIndex = index;
			break;
		}
		const wrapperToInsert = createDateWrapper({ date });
		if (insertionIndex < 0) this.repeatRule.excludedDates.push(wrapperToInsert);
else this.repeatRule.excludedDates.splice(insertionIndex, 0, wrapperToInsert);
	}
	/**
	* completely delete all exclusions. will cause the event to be rendered and fire alarms on all
	* occurrences as dictated by its repeat rule.
	*/
	deleteExcludedDates() {
		if (!this.repeatRule) return;
		this.repeatRule.excludedDates.length = 0;
	}
	/**
	* change start and end time and dates of the event by a fixed amount.
	* @param diff an object containing a duration in luxons year/quarter/... format
	*/
	rescheduleEvent(diff) {
		const oldStartTime = this.startTime.toDateTime(this.startDate, this.zone);
		const oldEndTime = this.endTime.toDateTime(this.endDate, this.zone);
		const newStartDate = oldStartTime.plus(diff);
		const newEndDate = oldEndTime.plus(diff);
		this._startDate = getStartOfDayWithZone(newStartDate.toJSDate(), this.zone);
		this._endDate = getStartOfDayWithZone(newEndDate.toJSDate(), this.zone);
		if (!this._isAllDay) {
			this._startTime = Time.fromDateTime(newStartDate);
			this._endTime = Time.fromDateTime(newEndDate);
		}
	}
	get result() {
		const repeatRule = this.repeatRule ? {
			...createRepeatRule({
				timeZone: "",
				excludedDates: [],
				endType: "0",
				endValue: null,
				interval: "0",
				frequency: "0",
				advancedRules: []
			}),
			...this.repeatRule,
			timeZone: this.zone
		} : null;
		this.deleteExcludedDatesIfNecessary(repeatRule);
		const { startTime, endTime } = this.getTimes();
		return {
			startTime,
			endTime,
			repeatRule
		};
	}
	/**
	* get the JS dates where the event starts and ends as they would be saved on the server (display may vary)
	* @param startDate base date to use for the start date
	* @param endDate base date to use for the end date.
	* @private
	*/
	getTimes({ startDate, endDate } = {
		startDate: this._startDate,
		endDate: this._endDate
	}) {
		if (this._isAllDay) {
			const startTime = getAllDayDateUTCFromZone(startDate, this.zone);
			const endTime = getAllDayDateUTCFromZone(getStartOfNextDayWithZone(endDate, this.zone), this.zone);
			return {
				startTime,
				endTime
			};
		} else {
			const startTime = this._startTime.toDateTime(getStartOfDayWithZone(startDate, this.zone), this.zone).toJSDate();
			const endTime = this._endTime.toDateTime(getStartOfDayWithZone(endDate, this.zone), this.zone).toJSDate();
			return {
				startTime,
				endTime
			};
		}
	}
	/**
	* ideally, we want to delete exclusions after an edit operation only when necessary.
	* @private
	*/
	deleteExcludedDatesIfNecessary(newRepeat) {
		if (newRepeat == null) return;
		const oldRepeat = this.initialValues.repeatRule ?? null;
		if (!areRepeatRulesEqual(newRepeat, oldRepeat) && areExcludedDatesEqual(newRepeat?.excludedDates ?? [], oldRepeat?.excludedDates ?? [])) {
			newRepeat.excludedDates = [];
			return;
		}
		if (this.initialValues.startTime == null) return;
		const { startTime } = this.getTimes();
		if (startTime.getTime() !== this.initialValues.startTime.getTime()) {
			newRepeat.excludedDates = [];
			return;
		}
	}
};
function getDefaultEndDateEndValue({ startTime }, timeZone) {
	return String(incrementByRepeatPeriod(startTime, RepeatPeriod.MONTHLY, 1, timeZone).getTime());
}
function getDefaultEndCountValue() {
	return "10";
}
function repeatRuleWithExcludedAlteredInstances(progenitor, recurrenceIds, timeZone) {
	const whenModel = new CalendarEventWhenModel(progenitor, timeZone);
	for (const recurrenceId of recurrenceIds) whenModel.excludeDate(recurrenceId);
	return assertNotNull(whenModel.result.repeatRule, "tried to exclude altered instance on progenitor without repeat rule!");
}

//#endregion
export { CalendarEventWhenModel, Time, getDefaultEndCountValue, getDefaultEndDateEndValue, repeatRuleWithExcludedAlteredInstances };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FsZW5kYXJFdmVudFdoZW5Nb2RlbC1jaHVuay5qcyIsIm5hbWVzIjpbImhvdXI6IG51bWJlciIsIm1pbnV0ZTogbnVtYmVyIiwiZGF0ZTogRGF0ZSIsInRpbWVTdHJpbmc6IHN0cmluZyIsImJhc2VEYXRlPzogRGF0ZSIsImJhc2VEYXRlOiBEYXRlIiwiem9uZTogc3RyaW5nIiwib3RoZXJUaW1lOiBUaW1lIiwiYW1QbUZvcm1hdDogYm9vbGVhbiIsImluaXRpYWxWYWx1ZXM6IFBhcnRpYWw8U3RyaXBwZWQ8Q2FsZW5kYXJFdmVudD4+Iiwiem9uZTogc3RyaW5nIiwidWlVcGRhdGVDYWxsYmFjazogKCkgPT4gdm9pZCIsImluaXRpYWxUaW1lczogQ2FsZW5kYXJFdmVudFRpbWVzIiwidmFsdWU6IGJvb2xlYW4iLCJ2OiBUaW1lIHwgbnVsbCIsInZhbHVlOiB7IG1pbnV0ZXM6IG51bWJlciB9IiwidmFsdWU6IERhdGUiLCJyZXBlYXRQZXJpb2Q6IFJlcGVhdFBlcmlvZCB8IG51bGwiLCJpbnRlcnZhbDogbnVtYmVyIiwiZW5kVHlwZTogRW5kVHlwZSIsImVuZFZhbHVlOiBudW1iZXIiLCJuZXdSZXBlYXRFbmREYXRlOiBEYXRlIiwiZGF0ZTogRGF0ZSIsImRpZmY6IER1cmF0aW9uTGlrZU9iamVjdCIsInJlcGVhdFJ1bGU6IFJlcGVhdFJ1bGUgfCBudWxsIiwibmV3UmVwZWF0OiBSZXBlYXRSdWxlIHwgbnVsbCIsInRpbWVab25lOiBzdHJpbmciLCJwcm9nZW5pdG9yOiBDYWxlbmRhckV2ZW50IiwicmVjdXJyZW5jZUlkczogUmVhZG9ubHlBcnJheTxEYXRlPiJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vY2FsZW5kYXIvZGF0ZS9UaW1lLnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9ndWkvZXZlbnRlZGl0b3ItbW9kZWwvQ2FsZW5kYXJFdmVudFdoZW5Nb2RlbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwYWQgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IERhdGVUaW1lIH0gZnJvbSBcImx1eG9uXCJcblxuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIHRpbWUgaGFuZGxpbmcgZm9yIHRoZSBjYWxlbmRhciBzdHVmZiwgbW9zdGx5IGZvciB0aGUgQ2FsZW5kYXJFdmVudFdoZW5Nb2RlbFxuICovXG5leHBvcnQgY2xhc3MgVGltZSB7XG5cdHJlYWRvbmx5IGhvdXI6IG51bWJlclxuXHRyZWFkb25seSBtaW51dGU6IG51bWJlclxuXG5cdGNvbnN0cnVjdG9yKGhvdXI6IG51bWJlciwgbWludXRlOiBudW1iZXIpIHtcblx0XHR0aGlzLmhvdXIgPSBNYXRoLmZsb29yKGhvdXIpICUgMjRcblx0XHR0aGlzLm1pbnV0ZSA9IE1hdGguZmxvb3IobWludXRlKSAlIDYwXG5cdH1cblxuXHQvKipcblx0ICogY3JlYXRlIGEgdGltZSBieSBleHRyYWN0aW5nIGhvdXIgYW5kIG1pbnV0ZSBmcm9tIGEgZGF0ZSBvYmplY3QuXG5cdCAqIEBwYXJhbSBkYXRlIHRoZSBkYXRlIHRvIGV4dHJhY3QgdGhlIHRpbWUgZnJvbVxuXHQgKiBOT1RFOiBhbGwgY2FsY3VsYXRpb25zIGFyZSBkb25lIGluIGxvY2FsIHRpbWUuXG5cdCAqL1xuXHRzdGF0aWMgZnJvbURhdGUoZGF0ZTogRGF0ZSk6IFRpbWUge1xuXHRcdHJldHVybiBuZXcgVGltZShkYXRlLmdldEhvdXJzKCksIGRhdGUuZ2V0TWludXRlcygpKVxuXHR9XG5cblx0c3RhdGljIGZyb21EYXRlVGltZSh7IGhvdXIsIG1pbnV0ZSB9OiBEYXRlVGltZSk6IFRpbWUge1xuXHRcdHJldHVybiBuZXcgVGltZShob3VyLCBtaW51dGUpXG5cdH1cblxuXHQvKipcblx0ICogQWNjZXB0cyAyLCAyOjMwLCAyOjUsIDAyOjA1LCAwMjozMCwgMjQ6MzAsIDI0MzAsIDEyOjMwcG0sIDEyOjMwIHAubS5cblx0ICovXG5cdHN0YXRpYyBwYXJzZUZyb21TdHJpbmcodGltZVN0cmluZzogc3RyaW5nKTogVGltZSB8IG51bGwge1xuXHRcdGxldCBzdWZmaXggLy8gYW0vcG0gaW5kaWNhdG9yIG9yIHVuZGVmaW5lZFxuXG5cdFx0bGV0IGhvdXJzIC8vIG51bWVyaWMgaG91cnNcblxuXHRcdGxldCBtaW51dGVzIC8vIG51bWVyaWMgbWludXRlc1xuXG5cdFx0Ly8gU2VlIGlmIHRoZSB0aW1lIGluY2x1ZGVzIGEgY29sb24gc2VwYXJhdGluZyBoaDptbVxuXHRcdGxldCBtdCA9IHRpbWVTdHJpbmcubWF0Y2goL14oXFxkezEsMn0pOihcXGR7MSwyfSlcXHMqKGFtfHBtfGFcXC5tXFwufHBcXC5tXFwuKT8kL2kpXG5cblx0XHRpZiAobXQgIT0gbnVsbCkge1xuXHRcdFx0c3VmZml4ID0gbXRbM11cblx0XHRcdGhvdXJzID0gcGFyc2VJbnQobXRbMV0sIDEwKVxuXHRcdFx0bWludXRlcyA9IHBhcnNlSW50KG10WzJdLCAxMClcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gSW50ZXJwcmV0IDEyN2FtIGFzIDE6MjdhbSBvciAyMzExIGFzIDExOjExcG0sIGUuZy5cblx0XHRcdG10ID0gdGltZVN0cmluZy5tYXRjaCgvXihcXGR7MSw0fSlcXHMqKGFtfHBtfGFcXC5tXFwufHBcXC5tXFwuKT8kL2kpXG5cblx0XHRcdGlmIChtdCAhPSBudWxsKSB7XG5cdFx0XHRcdHN1ZmZpeCA9IG10WzJdXG5cdFx0XHRcdGNvbnN0IGRpZ2l0cyA9IG10WzFdXG5cblx0XHRcdFx0Ly8gSG91cnMgb25seT9cblx0XHRcdFx0aWYgKGRpZ2l0cy5sZW5ndGggPD0gMikge1xuXHRcdFx0XHRcdGhvdXJzID0gcGFyc2VJbnQoZGlnaXRzLCAxMClcblx0XHRcdFx0XHRtaW51dGVzID0gMFxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGhvdXJzID0gcGFyc2VJbnQoZGlnaXRzLnN1YnN0cmluZygwLCBkaWdpdHMubGVuZ3RoIC0gMiksIDEwKVxuXHRcdFx0XHRcdG1pbnV0ZXMgPSBwYXJzZUludChkaWdpdHMuc2xpY2UoLTIpLCAxMClcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoaXNOYU4oaG91cnMpIHx8IGlzTmFOKG1pbnV0ZXMpIHx8IG1pbnV0ZXMgPiA1OSkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cblx0XHRpZiAoc3VmZml4KSB7XG5cdFx0XHRzdWZmaXggPSBzdWZmaXgudG9VcHBlckNhc2UoKVxuXHRcdH1cblxuXHRcdGlmIChzdWZmaXggPT09IFwiUE1cIiB8fCBzdWZmaXggPT09IFwiUC5NLlwiKSB7XG5cdFx0XHRpZiAoaG91cnMgPiAxMikgcmV0dXJuIG51bGxcblx0XHRcdGlmIChob3VycyAhPT0gMTIpIGhvdXJzID0gaG91cnMgKyAxMlxuXHRcdH0gZWxzZSBpZiAoc3VmZml4ID09PSBcIkFNXCIgfHwgc3VmZml4ID09PSBcIkEuTS5cIikge1xuXHRcdFx0aWYgKGhvdXJzID4gMTIpIHJldHVybiBudWxsXG5cdFx0XHRpZiAoaG91cnMgPT09IDEyKSBob3VycyA9IDBcblx0XHR9IGVsc2UgaWYgKGhvdXJzID4gMjMpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG5ldyBUaW1lKGhvdXJzLCBtaW51dGVzKVxuXHR9XG5cblx0LyoqXG5cdCAqIGNvbnZlcnQgaW50byBhIGRhdGVcblx0ICogaWYgYmFzZSBkYXRlIGlzIHNldCBpdCB3aWxsIHVzZSB0aGUgZGF0ZSB2YWx1ZXMgZnJvbSB0aGF0LFxuXHQgKiBvdGhlcndpc2UgaXQgd2lsbCB1c2UgdGhlIGN1cnJlbnQgZGF0ZS5cblx0ICpcblx0ICogTk9URTogY2FsY3VsYXRpb25zIGFyZSBkb25lIGluIHRoZSBsb2NhbCB0aW1lLlxuXHQgKi9cblx0dG9EYXRlKGJhc2VEYXRlPzogRGF0ZSk6IERhdGUge1xuXHRcdGNvbnN0IGRhdGUgPSBiYXNlRGF0ZSA/IG5ldyBEYXRlKGJhc2VEYXRlKSA6IG5ldyBEYXRlKClcblx0XHRkYXRlLnNldEhvdXJzKHRoaXMuaG91cilcblx0XHRkYXRlLnNldE1pbnV0ZXModGhpcy5taW51dGUpXG5cdFx0ZGF0ZS5zZXRTZWNvbmRzKDApXG5cdFx0ZGF0ZS5zZXRNaWxsaXNlY29uZHMoMClcblx0XHRyZXR1cm4gZGF0ZVxuXHR9XG5cblx0dG9EYXRlVGltZShiYXNlRGF0ZTogRGF0ZSwgem9uZTogc3RyaW5nKTogRGF0ZVRpbWUge1xuXHRcdHJldHVybiBEYXRlVGltZS5mcm9tSlNEYXRlKGJhc2VEYXRlLCB7IHpvbmUgfSkuc2V0KHRoaXMpXG5cdH1cblxuXHRlcXVhbHMob3RoZXJUaW1lOiBUaW1lKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuaG91ciA9PT0gb3RoZXJUaW1lLmhvdXIgJiYgdGhpcy5taW51dGUgPT09IG90aGVyVGltZS5taW51dGVcblx0fVxuXG5cdHRvU3RyaW5nKGFtUG1Gb3JtYXQ6IGJvb2xlYW4pOiBzdHJpbmcge1xuXHRcdHJldHVybiBhbVBtRm9ybWF0ID8gdGhpcy50bzEySG91clN0cmluZygpIDogdGhpcy50bzI0SG91clN0cmluZygpXG5cdH1cblxuXHR0bzEySG91clN0cmluZygpOiBzdHJpbmcge1xuXHRcdGNvbnN0IG1pbnV0ZXNTdHJpbmcgPSBwYWQodGhpcy5taW51dGUsIDIpXG5cblx0XHRpZiAodGhpcy5ob3VyID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gYDEyOiR7bWludXRlc1N0cmluZ30gYW1gXG5cdFx0fSBlbHNlIGlmICh0aGlzLmhvdXIgPT09IDEyKSB7XG5cdFx0XHRyZXR1cm4gYDEyOiR7bWludXRlc1N0cmluZ30gcG1gXG5cdFx0fSBlbHNlIGlmICh0aGlzLmhvdXIgPiAxMikge1xuXHRcdFx0cmV0dXJuIGAke3RoaXMuaG91ciAtIDEyfToke21pbnV0ZXNTdHJpbmd9IHBtYFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gYCR7dGhpcy5ob3VyfToke21pbnV0ZXNTdHJpbmd9IGFtYFxuXHRcdH1cblx0fVxuXG5cdHRvMjRIb3VyU3RyaW5nKCk6IHN0cmluZyB7XG5cdFx0Y29uc3QgaG91cnMgPSBwYWQodGhpcy5ob3VyLCAyKVxuXHRcdGNvbnN0IG1pbnV0ZXMgPSBwYWQodGhpcy5taW51dGUsIDIpXG5cdFx0cmV0dXJuIGAke2hvdXJzfToke21pbnV0ZXN9YFxuXHR9XG5cblx0dG9PYmplY3QoKToge1xuXHRcdGhvdXJzOiBudW1iZXJcblx0XHRtaW51dGVzOiBudW1iZXJcblx0fSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGhvdXJzOiB0aGlzLmhvdXIsXG5cdFx0XHRtaW51dGVzOiB0aGlzLm1pbnV0ZSxcblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCB7IENhbGVuZGFyRXZlbnRUaW1lcywgZ2V0QWxsRGF5RGF0ZVVUQywgZ2V0RXZlbnRXaXRoRGVmYXVsdFRpbWVzLCBpc0FsbERheUV2ZW50IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0NvbW1vbkNhbGVuZGFyVXRpbHMuanNcIlxuaW1wb3J0IHsgVGltZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9UaW1lLmpzXCJcbmltcG9ydCB7IERhdGVUaW1lLCBEdXJhdGlvbkxpa2VPYmplY3QgfSBmcm9tIFwibHV4b25cIlxuaW1wb3J0IHtcblx0YXJlRXhjbHVkZWREYXRlc0VxdWFsLFxuXHRhcmVSZXBlYXRSdWxlc0VxdWFsLFxuXHRnZXRBbGxEYXlEYXRlVVRDRnJvbVpvbmUsXG5cdGdldEV2ZW50RW5kLFxuXHRnZXRFdmVudFN0YXJ0LFxuXHRnZXRSZXBlYXRFbmRUaW1lRm9yRGlzcGxheSxcblx0Z2V0U3RhcnRPZkRheVdpdGhab25lLFxuXHRnZXRTdGFydE9mTmV4dERheVdpdGhab25lLFxuXHRpbmNyZW1lbnRCeVJlcGVhdFBlcmlvZCxcbn0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyVXRpbHMuanNcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCwgY2xvbmUsIGZpbHRlckludCwgaW5jcmVtZW50RGF0ZSwgbm9PcCwgVElNRVNUQU1QX1pFUk9fWUVBUiB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudCwgQ2FsZW5kYXJSZXBlYXRSdWxlIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgU3RyaXBwZWQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgRW5kVHlwZSwgUmVwZWF0UGVyaW9kIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IGNyZWF0ZURhdGVXcmFwcGVyLCBjcmVhdGVSZXBlYXRSdWxlLCBSZXBlYXRSdWxlIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IFVzZXJFcnJvciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL21haW4vVXNlckVycm9yLmpzXCJcblxuZXhwb3J0IHR5cGUgQ2FsZW5kYXJFdmVudFdoZW5Nb2RlbFJlc3VsdCA9IENhbGVuZGFyRXZlbnRUaW1lcyAmIHtcblx0cmVwZWF0UnVsZTogQ2FsZW5kYXJSZXBlYXRSdWxlIHwgbnVsbFxufVxuXG4vKlxuICogc3RhcnQsIGVuZCwgcmVwZWF0LCBleGNsdXNpb25zLCByZXNjaGVkdWxpbmdzXG4gKi9cbmV4cG9ydCBjbGFzcyBDYWxlbmRhckV2ZW50V2hlbk1vZGVsIHtcblx0cHJpdmF0ZSByZXBlYXRSdWxlOiBDYWxlbmRhclJlcGVhdFJ1bGUgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIF9pc0FsbERheTogYm9vbGVhblxuXG5cdC8qKiByZXByZXNlbnRzIHRoZSBzdGFydCBvZiBkYXkgb2YgdGhlIHN0YXJ0IGRhdGUgaW4gbG9jYWwgdGltZS4gKi9cblx0cHJpdmF0ZSBfc3RhcnREYXRlOiBEYXRlXG5cdC8qKiByZXByZXNlbnRzIHRoZSBzdGFydCBvZiBkYXkgb2YgdGhlIGVuZCBkYXRlIGluIGxvY2FsIHRpbWUuICovXG5cdHByaXZhdGUgX2VuZERhdGU6IERhdGVcblxuXHQvKiogd2UncmUgc2V0dGluZyB0aW1lIHRvIG51bGwgb24gYWxsLWRheSBldmVudHMgdG8gYmUgYWJsZSB0byBoYXZlIHRoZSBkZWZhdWx0IHRpbWUgc2V0IHdoZW4gc29tZW9uZSB1bnNldHMgdGhlIGFsbC1kYXkgZmxhZy4gKi9cblx0cHJpdmF0ZSBfc3RhcnRUaW1lOiBUaW1lIHwgbnVsbFxuXHRwcml2YXRlIF9lbmRUaW1lOiBUaW1lIHwgbnVsbFxuXG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgaW5pdGlhbFZhbHVlczogUGFydGlhbDxTdHJpcHBlZDxDYWxlbmRhckV2ZW50Pj4sIHJlYWRvbmx5IHpvbmU6IHN0cmluZywgcHJpdmF0ZSByZWFkb25seSB1aVVwZGF0ZUNhbGxiYWNrOiAoKSA9PiB2b2lkID0gbm9PcCkge1xuXHRcdGxldCBpbml0aWFsVGltZXM6IENhbGVuZGFyRXZlbnRUaW1lc1xuXHRcdGlmIChpbml0aWFsVmFsdWVzLnN0YXJ0VGltZSA9PSBudWxsIHx8IGluaXRpYWxWYWx1ZXMuZW5kVGltZSA9PSBudWxsKSB7XG5cdFx0XHRjb25zdCBkZWZhdWx0VGltZXMgPSBnZXRFdmVudFdpdGhEZWZhdWx0VGltZXMoaW5pdGlhbFZhbHVlcy5zdGFydFRpbWUpXG5cdFx0XHRpbml0aWFsVGltZXMgPSB7XG5cdFx0XHRcdHN0YXJ0VGltZTogaW5pdGlhbFZhbHVlcy5zdGFydFRpbWUgPz8gZGVmYXVsdFRpbWVzLnN0YXJ0VGltZSxcblx0XHRcdFx0ZW5kVGltZTogaW5pdGlhbFZhbHVlcy5lbmRUaW1lID8/IGRlZmF1bHRUaW1lcy5lbmRUaW1lLFxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpbml0aWFsVGltZXMgPSB7XG5cdFx0XHRcdHN0YXJ0VGltZTogaW5pdGlhbFZhbHVlcy5zdGFydFRpbWUsXG5cdFx0XHRcdGVuZFRpbWU6IGluaXRpYWxWYWx1ZXMuZW5kVGltZSxcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyB6ZXJvIG91dCB0aGUgc2Vjb25kIGFuZCBtaWxsaXNlY29uZCBwYXJ0IG9mIHN0YXJ0L2VuZCB0aW1lLiBjYW4ndCB1c2UgdGhlIGdldHRlcnMgZm9yIHN0YXJ0VGltZSBhbmQgZW5kVGltZVxuXHRcdC8vIGJlY2F1c2UgdGhleSBkZXBlbmQgb24gYWxsLWRheSBzdGF0dXMuXG5cdFx0aW5pdGlhbFRpbWVzLnN0YXJ0VGltZSA9IERhdGVUaW1lLmZyb21KU0RhdGUoaW5pdGlhbFRpbWVzLnN0YXJ0VGltZSwgeyB6b25lIH0pLnNldCh7IHNlY29uZDogMCwgbWlsbGlzZWNvbmQ6IDAgfSkudG9KU0RhdGUoKVxuXHRcdGluaXRpYWxUaW1lcy5lbmRUaW1lID0gRGF0ZVRpbWUuZnJvbUpTRGF0ZShpbml0aWFsVGltZXMuZW5kVGltZSwgeyB6b25lIH0pLnNldCh7IHNlY29uZDogMCwgbWlsbGlzZWNvbmQ6IDAgfSkudG9KU0RhdGUoKVxuXG5cdFx0dGhpcy5faXNBbGxEYXkgPSBpc0FsbERheUV2ZW50KGluaXRpYWxUaW1lcylcblx0XHR0aGlzLnJlcGVhdFJ1bGUgPSBjbG9uZShpbml0aWFsVmFsdWVzLnJlcGVhdFJ1bGUgPz8gbnVsbClcblxuXHRcdGNvbnN0IHN0YXJ0ID0gZ2V0RXZlbnRTdGFydChpbml0aWFsVGltZXMsIHRoaXMuem9uZSlcblx0XHRjb25zdCBlbmQgPSBnZXRFdmVudEVuZChpbml0aWFsVGltZXMsIHRoaXMuem9uZSlcblx0XHRpZiAodGhpcy5faXNBbGxEYXkpIHtcblx0XHRcdHRoaXMuX3N0YXJ0VGltZSA9IG51bGxcblx0XHRcdHRoaXMuX2VuZFRpbWUgPSBudWxsXG5cdFx0XHR0aGlzLl9zdGFydERhdGUgPSBnZXRTdGFydE9mRGF5V2l0aFpvbmUoRGF0ZVRpbWUuZnJvbUpTRGF0ZShzdGFydCwgeyB6b25lIH0pLnRvSlNEYXRlKCksIHpvbmUpXG5cdFx0XHR0aGlzLl9lbmREYXRlID0gaW5jcmVtZW50RGF0ZShlbmQsIC0xKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLl9zdGFydFRpbWUgPSBUaW1lLmZyb21EYXRlVGltZShEYXRlVGltZS5mcm9tSlNEYXRlKHN0YXJ0LCB7IHpvbmUgfSkpXG5cdFx0XHR0aGlzLl9lbmRUaW1lID0gVGltZS5mcm9tRGF0ZVRpbWUoRGF0ZVRpbWUuZnJvbUpTRGF0ZShlbmQsIHsgem9uZSB9KSlcblx0XHRcdHRoaXMuX3N0YXJ0RGF0ZSA9IGdldFN0YXJ0T2ZEYXlXaXRoWm9uZShEYXRlVGltZS5mcm9tSlNEYXRlKHN0YXJ0LCB7IHpvbmUgfSkudG9KU0RhdGUoKSwgem9uZSlcblx0XHRcdHRoaXMuX2VuZERhdGUgPSBnZXRTdGFydE9mRGF5V2l0aFpvbmUoRGF0ZVRpbWUuZnJvbUpTRGF0ZShlbmQsIHsgem9uZSB9KS50b0pTRGF0ZSgpLCB6b25lKVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBzZXQgd2hldGhlciB0aGlzIGV2ZW50IHNob3VsZCBiZSBjb25zaWRlcmVkIGFsbC1kYXlcblx0ICpcblx0ICogd2lsbCBhbHNvIG1vZGlmeSB0aGUgZXhjbHVkZWQgZGF0ZXMgaWYgdGhlcmUgYXJlIGFueSB0byBzdGlsbCBleGNsdWRlIHRoZVxuXHQgKiBzYW1lIG9jY3VycmVuY2UgZGF0ZXMuXG5cdCAqL1xuXHRzZXQgaXNBbGxEYXkodmFsdWU6IGJvb2xlYW4pIHtcblx0XHRpZiAodGhpcy5faXNBbGxEYXkgPT09IHZhbHVlKSByZXR1cm5cblxuXHRcdGlmICgoIXZhbHVlICYmIHRoaXMuX3N0YXJ0VGltZSA9PSBudWxsKSB8fCB0aGlzLl9lbmRUaW1lID09IG51bGwpIHtcblx0XHRcdGNvbnN0IGRlZmF1bHRUaW1lcyA9IGdldEV2ZW50V2l0aERlZmF1bHRUaW1lcygpXG5cdFx0XHR0aGlzLl9zdGFydFRpbWUgPSBUaW1lLmZyb21EYXRlVGltZShEYXRlVGltZS5mcm9tSlNEYXRlKGRlZmF1bHRUaW1lcy5zdGFydFRpbWUsIHRoaXMpKVxuXHRcdFx0dGhpcy5fZW5kVGltZSA9IFRpbWUuZnJvbURhdGVUaW1lKERhdGVUaW1lLmZyb21KU0RhdGUoZGVmYXVsdFRpbWVzLmVuZFRpbWUsIHRoaXMpKVxuXHRcdH1cblxuXHRcdGlmICh0aGlzLnJlcGVhdFJ1bGUgPT0gbnVsbCkge1xuXHRcdFx0dGhpcy5faXNBbGxEYXkgPSB2YWx1ZVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBwcmV2aW91c0VuZERhdGUgPSB0aGlzLnJlcGVhdEVuZERhdGVGb3JEaXNwbGF5XG5cdFx0XHR0aGlzLl9pc0FsbERheSA9IHZhbHVlXG5cdFx0XHR0aGlzLnJlcGVhdEVuZERhdGVGb3JEaXNwbGF5ID0gcHJldmlvdXNFbmREYXRlXG5cblx0XHRcdGlmICh2YWx1ZSkge1xuXHRcdFx0XHQvLyB3ZSB3YW50IHRvIGtlZXAgZXhjbHVkZWQgZGF0ZXMgaWYgYWxsIHdlIGRvIGlzIHN3aXRjaGluZyBiZXR3ZWVuIGFsbC1kYXkgYW5kIG5vcm1hbCBldmVudFxuXHRcdFx0XHR0aGlzLnJlcGVhdFJ1bGUuZXhjbHVkZWREYXRlcyA9IHRoaXMucmVwZWF0UnVsZS5leGNsdWRlZERhdGVzLm1hcCgoeyBkYXRlIH0pID0+IGNyZWF0ZURhdGVXcmFwcGVyKHsgZGF0ZTogZ2V0QWxsRGF5RGF0ZVVUQyhkYXRlKSB9KSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IHN0YXJ0VGltZSA9IHRoaXMuc3RhcnRUaW1lXG5cdFx0XHRcdHRoaXMucmVwZWF0UnVsZS5leGNsdWRlZERhdGVzID0gdGhpcy5yZXBlYXRSdWxlLmV4Y2x1ZGVkRGF0ZXMubWFwKCh7IGRhdGUgfSkgPT4gY3JlYXRlRGF0ZVdyYXBwZXIoeyBkYXRlOiBzdGFydFRpbWUudG9EYXRlKGRhdGUpIH0pKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMudWlVcGRhdGVDYWxsYmFjaygpXG5cdH1cblxuXHRnZXQgaXNBbGxEYXkoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2lzQWxsRGF5XG5cdH1cblxuXHQvKipcblx0ICogdGhlIGN1cnJlbnQgc3RhcnQgdGltZSAoaG91cjptaW51dGVzKSBvZiB0aGUgZXZlbnQgaW4gdGhlIGxvY2FsIHRpbWUgem9uZS5cblx0ICogd2lsbCByZXR1cm4gMDA6MDAgZm9yIGFsbC1kYXkgZXZlbnRzLlxuXHQgKi9cblx0Z2V0IHN0YXJ0VGltZSgpOiBUaW1lIHtcblx0XHRyZXR1cm4gdGhpcy5faXNBbGxEYXkgPyBuZXcgVGltZSgwLCAwKSA6IHRoaXMuX3N0YXJ0VGltZSFcblx0fVxuXG5cdC8qKlxuXHQgKiBzZXQgdGhlIHRpbWUgcG9ydGlvbiBvZiB0aGUgZXZlbnRzIHN0YXJ0IHRpbWUuIHRoZSBkYXRlIHBvcnRpb24gd2lsbCBub3QgYmUgbW9kaWZpZWQuXG5cdCAqIHdpbGwgYWxzbyBhZGp1c3QgdGhlIGVuZCB0aW1lIGFjY29yZGluZ2x5IHRvIGtlZXAgdGhlIGV2ZW50IGxlbmd0aCB0aGUgc2FtZS5cblx0ICogICovXG5cdHNldCBzdGFydFRpbWUodjogVGltZSB8IG51bGwpIHtcblx0XHRpZiAodiA9PSBudWxsIHx8IHRoaXMuX2lzQWxsRGF5KSByZXR1cm5cblx0XHRjb25zdCBzdGFydFRpbWUgPSB0aGlzLl9zdGFydFRpbWUhXG5cdFx0Y29uc3QgZGVsdGEgPSAoKHYuaG91ciAtIHN0YXJ0VGltZS5ob3VyKSAqIDYwICsgKHYubWludXRlIC0gc3RhcnRUaW1lLm1pbnV0ZSkpICogNjAwMDBcblx0XHRpZiAoZGVsdGEgPT09IDApIHJldHVyblxuXHRcdHRoaXMucmVzY2hlZHVsZUV2ZW50KHsgbWlsbGlzZWNvbmQ6IGRlbHRhIH0pXG5cdFx0dGhpcy51aVVwZGF0ZUNhbGxiYWNrKClcblx0fVxuXG5cdC8qKlxuXHQgKiB0aGUgY3VycmVudCBlbmQgdGltZSAoaG91cjptaW51dGVzKSBvZiB0aGUgZXZlbnQgaW4gdGhlIGxvY2FsIHRpbWUgem9uZS5cblx0ICogd2lsbCByZXR1cm4gMDA6MDAgZm9yIGFsbC1kYXkgZXZlbnRzIGluZGVwZW5kZW50bHkgb2YgdGhlIHRpbWUgem9uZS5cblx0ICovXG5cdGdldCBlbmRUaW1lKCk6IFRpbWUge1xuXHRcdHJldHVybiB0aGlzLl9pc0FsbERheSA/IG5ldyBUaW1lKDAsIDApIDogdGhpcy5fZW5kVGltZSFcblx0fVxuXG5cdC8qKlxuXHQgKiBzZXQgdGhlIHRpbWUgcG9ydGlvbiBvZiB0aGUgZXZlbnRzIGVuZCB0aW1lLiB0aGUgZGF0ZSBwb3J0aW9uIHdpbGwgbm90IGJlIG1vZGlmaWVkLlxuXHQgKlxuXHQgKi9cblx0c2V0IGVuZFRpbWUodjogVGltZSB8IG51bGwpIHtcblx0XHRpZiAodiA9PSBudWxsIHx8IHRoaXMuX2lzQWxsRGF5KSByZXR1cm5cblx0XHRjb25zdCBzdGFydFRpbWUgPSB0aGlzLl9zdGFydFRpbWUhXG5cdFx0Y29uc3QgY3VycmVudFN0YXJ0ID0gc3RhcnRUaW1lLnRvRGF0ZSh0aGlzLl9zdGFydERhdGUpXG5cdFx0Y29uc3QgbmV3RW5kID0gdi50b0RhdGUodGhpcy5fZW5kRGF0ZSlcblx0XHRpZiAobmV3RW5kIDwgY3VycmVudFN0YXJ0KSByZXR1cm5cblx0XHR0aGlzLl9lbmRUaW1lID0gdlxuXHRcdHRoaXMudWlVcGRhdGVDYWxsYmFjaygpXG5cdH1cblxuXHQvKiogcmV0dXJuIHRoZSBkdXJhdGlvbiBvZiB0aGUgZXZlbnQgaW4gbWludXRlcyAqL1xuXHRnZXQgZHVyYXRpb24oKTogeyBtaW51dGVzOiBudW1iZXIgfSB7XG5cdFx0Y29uc3QgeyBzdGFydFRpbWUsIGVuZFRpbWUgfSA9IHRoaXMuZ2V0VGltZXMoKVxuXHRcdGNvbnN0IGR1cmF0aW9uID0gRGF0ZVRpbWUuZnJvbUpTRGF0ZShlbmRUaW1lKS5kaWZmKERhdGVUaW1lLmZyb21KU0RhdGUoc3RhcnRUaW1lKSlcblx0XHRyZXR1cm4geyBtaW51dGVzOiBkdXJhdGlvbi5hcyhcIm1pbnV0ZXNcIikgfVxuXHR9XG5cblx0LyoqIHNldCB0aGUgZHVyYXRpb24gb2YgdGhlIGV2ZW50IGluIG1pbnV0ZXMsIGVmZmVjdGl2ZWx5IHNldHRpbmcgdGhlIGVuZERhdGUgYW5kIGVuZFRpbWUuICovXG5cdHNldCBkdXJhdGlvbih2YWx1ZTogeyBtaW51dGVzOiBudW1iZXIgfSkge1xuXHRcdGlmICh2YWx1ZS5taW51dGVzIDwgMSkgcmV0dXJuXG5cdFx0Y29uc3QgZGlmZiA9IHsgbWludXRlczogdGhpcy5kdXJhdGlvbi5taW51dGVzIC0gdmFsdWUubWludXRlcyB9XG5cdFx0Y29uc3Qgb2xkRW5kVGltZSA9IHRoaXMuZW5kVGltZS50b0RhdGVUaW1lKHRoaXMuZW5kRGF0ZSwgdGhpcy56b25lKVxuXHRcdGNvbnN0IG5ld0VuZFRpbWUgPSBvbGRFbmRUaW1lLnBsdXMoZGlmZilcblx0XHR0aGlzLl9lbmREYXRlID0gZ2V0U3RhcnRPZkRheVdpdGhab25lKG5ld0VuZFRpbWUudG9KU0RhdGUoKSwgdGhpcy56b25lKVxuXHRcdGlmICghdGhpcy5faXNBbGxEYXkpIHtcblx0XHRcdHRoaXMuX2VuZFRpbWUgPSBUaW1lLmZyb21EYXRlVGltZShuZXdFbmRUaW1lKVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBnZXQgdGhlIHN0YXJ0IHRpbWUgb2YgdGhlIGRheSB0aGlzIGV2ZW50IGN1cnJlbnRseSBzdGFydHMgaW4gVVRDLCBpbiBsb2NhbCB0aW1lXG5cdCAqIGZvciBkaXNwbGF5IHB1cnBvc2VzLlxuXHQgKlxuXHQgKiB3aWxsIGFsd2F5cyBiZSBhIHN0YXJ0IG9mIGRheSBpbiBsb2NhbCB0aW1lLlxuXHQgKi9cblx0Z2V0IHN0YXJ0RGF0ZSgpOiBEYXRlIHtcblx0XHRyZXR1cm4gdGhpcy5fc3RhcnREYXRlXG5cdH1cblxuXHQvKipcblx0ICogc2V0IHRoZSBkYXRlIHBvcnRpb24gb2YgdGhlIGV2ZW50cyBzdGFydCB0aW1lICh2YWx1ZSdzIHRpbWUgY29tcG9uZW50IGlzIGlnbm9yZWQpXG5cdCAqIHdpbGwgYWxzbyB1cGRhdGUgdGhlIGVuZCBkYXRlIGFuZCBtb3ZlIGl0IHRoZSBzYW1lIGFtb3VudCBvZiBkYXlzIGFzIHRoZSBzdGFydCBkYXRlIHdhcyBtb3ZlZC5cblx0ICpcblx0ICogc2V0dGluZyBhIGRhdGUgYmVmb3JlIDE5NzAgd2lsbCByZXN1bHQgaW4gdGhlIGRhdGUgYmVpbmcgc2V0IHRvIENVUlJFTlRfWUVBUlxuXHQgKiAqL1xuXHRzZXQgc3RhcnREYXRlKHZhbHVlOiBEYXRlKSB7XG5cdFx0aWYgKHZhbHVlLmdldFRpbWUoKSA9PT0gdGhpcy5fc3RhcnREYXRlLmdldFRpbWUoKSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Ly8gVGhlIGN1c3RvbSBJRCBmb3IgZXZlbnRzIGlzIGRlcml2ZWQgZnJvbSB0aGUgdW5peCB0aW1lc3RhbXAsIGFuZCBzb3J0aW5nXG5cdFx0Ly8gdGhlIG5lZ2F0aXZlIGlkcyBpcyBhIGNoYWxsZW5nZSB3ZSBkZWNpZGVkIG5vdCB0b1xuXHRcdC8vIHRhY2tsZSBiZWNhdXNlIGl0IGlzIGEgcmFyZSBjYXNlIGFuZCBvbmx5IGdldHRpbmcgcmFyZXIuXG5cdFx0aWYgKHZhbHVlLmdldFRpbWUoKSA8IFRJTUVTVEFNUF9aRVJPX1lFQVIpIHtcblx0XHRcdGNvbnN0IHRoaXNZZWFyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpXG5cdFx0XHR2YWx1ZS5zZXRGdWxsWWVhcih0aGlzWWVhcilcblx0XHR9XG5cdFx0Y29uc3QgdmFsdWVEYXRlVGltZSA9IERhdGVUaW1lLmZyb21KU0RhdGUodmFsdWUsIHsgem9uZTogdGhpcy56b25lIH0pXG5cdFx0Ly8gYXNraW5nIGZvciB0aGUgcmVzdCBpbiBtaWxsaXNlY29uZHMgY2F1c2VzIGx1eG9uIHRvIGdpdmUgdXMgYW4gaW50ZWdlciBudW1iZXIgb2Zcblx0XHQvLyBkYXlzIGluIHRoZSBkdXJhdGlvbiB3aGljaCBpcyB3aGF0IHdlIHdhbnQuXG5cdFx0Y29uc3QgZGlmZiA9IHZhbHVlRGF0ZVRpbWUuZGlmZihEYXRlVGltZS5mcm9tSlNEYXRlKHRoaXMuX3N0YXJ0RGF0ZSwgdGhpcyksIFtcImRheVwiLCBcIm1pbGxpc2Vjb25kXCJdKVxuXHRcdGlmIChkaWZmLmFzKFwibWlsbGlzZWNvbmRcIikgPT09IDApIHJldHVyblxuXHRcdC8vIHdlIG9ubHkgd2FudCB0byBhZGQgZGF5cywgbm90IG1pbGxpc2Vjb25kcy5cblx0XHR0aGlzLnJlc2NoZWR1bGVFdmVudCh7IGRheXM6IGRpZmYuZGF5cyB9KVxuXHRcdHRoaXMudWlVcGRhdGVDYWxsYmFjaygpXG5cdH1cblxuXHQvKipcblx0ICogZm9yIGRpc3BsYXkgcHVycG9zZXMuXG5cdCAqXG5cdCAqIHdpbGwgYWx3YXlzIGJlIGEgc3RhcnQgb2YgZGF5IGluIGxvY2FsIHRpbWUuXG5cdCAqL1xuXHRnZXQgZW5kRGF0ZSgpOiBEYXRlIHtcblx0XHRyZXR1cm4gdGhpcy5fZW5kRGF0ZVxuXHR9XG5cblx0LyoqXG5cdCAqIHNldCB0aGUgZGF0ZSBwb3J0aW9uIG9mIHRoZSBldmVudHMgZW5kIHRpbWUgKHZhbHVlJ3MgdGltZSBjb21wb25lbnQgaXMgaWdub3JlZClcblx0ICpcblx0ICogKi9cblx0c2V0IGVuZERhdGUodmFsdWU6IERhdGUpIHtcblx0XHRpZiAodmFsdWUuZ2V0VGltZSgpID09PSB0aGlzLl9lbmREYXRlLmdldFRpbWUoKSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdGNvbnN0IHN0YXJ0VGltZSA9IHRoaXMuX3N0YXJ0VGltZSA/PyBuZXcgVGltZSgwLCAwKVxuXHRcdGNvbnN0IGVuZFRpbWUgPSB0aGlzLl9lbmRUaW1lID8/IG5ldyBUaW1lKDAsIDApXG5cdFx0Y29uc3QgY3VycmVudFN0YXJ0ID0gc3RhcnRUaW1lLnRvRGF0ZSh0aGlzLl9zdGFydERhdGUpXG5cdFx0Y29uc3QgbmV3RW5kID0gZW5kVGltZS50b0RhdGUodmFsdWUpXG5cdFx0aWYgKG5ld0VuZCA8IGN1cnJlbnRTdGFydCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJ0cmllZCB0byBzZXQgdGhlIGVuZCBkYXRlIHRvIGJlZm9yZSB0aGUgc3RhcnQgZGF0ZVwiKVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdHRoaXMuX2VuZERhdGUgPSBEYXRlVGltZS5mcm9tSlNEYXRlKHZhbHVlLCB0aGlzKS5zZXQoeyBob3VyOiAwLCBtaW51dGU6IDAsIHNlY29uZDogMCwgbWlsbGlzZWNvbmQ6IDAgfSkudG9KU0RhdGUoKVxuXHRcdHRoaXMudWlVcGRhdGVDYWxsYmFjaygpXG5cdH1cblxuXHRnZXQgcmVwZWF0UGVyaW9kKCk6IFJlcGVhdFBlcmlvZCB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLnJlcGVhdFJ1bGUgPyAodGhpcy5yZXBlYXRSdWxlLmZyZXF1ZW5jeSBhcyBSZXBlYXRQZXJpb2QpIDogbnVsbFxuXHR9XG5cblx0c2V0IHJlcGVhdFBlcmlvZChyZXBlYXRQZXJpb2Q6IFJlcGVhdFBlcmlvZCB8IG51bGwpIHtcblx0XHRpZiAodGhpcy5yZXBlYXRSdWxlPy5mcmVxdWVuY3kgPT09IHJlcGVhdFBlcmlvZCkge1xuXHRcdFx0Ly8gcmVwZWF0IG51bGwgPT4gd2Ugd2lsbCByZXR1cm4gaWYgcmVwZWF0UGVyaW9kIGlzIG51bGxcblx0XHRcdC8vIHJlcGVhdCBub3QgbnVsbCA9PiB3ZSByZXR1cm4gaWYgdGhlIHJlcGVhdCBwZXJpb2QgZGlkIG5vdCBjaGFuZ2UuXG5cdFx0XHRyZXR1cm5cblx0XHR9IGVsc2UgaWYgKHJlcGVhdFBlcmlvZCA9PSBudWxsKSB7XG5cdFx0XHR0aGlzLnJlcGVhdFJ1bGUgPSBudWxsXG5cdFx0fSBlbHNlIGlmICh0aGlzLnJlcGVhdFJ1bGUgIT0gbnVsbCkge1xuXHRcdFx0dGhpcy5yZXBlYXRSdWxlLmZyZXF1ZW5jeSA9IHJlcGVhdFBlcmlvZFxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBuZXcgcmVwZWF0IHJ1bGUsIHBvcHVsYXRlIHdpdGggZGVmYXVsdCB2YWx1ZXMuXG5cdFx0XHR0aGlzLnJlcGVhdFJ1bGUgPSB0aGlzLmluaXRpYWxWYWx1ZXMucmVwZWF0UnVsZVxuXHRcdFx0XHQ/IGNsb25lKHRoaXMuaW5pdGlhbFZhbHVlcy5yZXBlYXRSdWxlKVxuXHRcdFx0XHQ6IGNyZWF0ZVJlcGVhdFJ1bGUoe1xuXHRcdFx0XHRcdFx0aW50ZXJ2YWw6IFwiMVwiLFxuXHRcdFx0XHRcdFx0ZW5kVHlwZTogRW5kVHlwZS5OZXZlcixcblx0XHRcdFx0XHRcdGVuZFZhbHVlOiBcIjFcIixcblx0XHRcdFx0XHRcdGZyZXF1ZW5jeTogUmVwZWF0UGVyaW9kLkRBSUxZLFxuXHRcdFx0XHRcdFx0ZXhjbHVkZWREYXRlczogW10sXG5cdFx0XHRcdFx0XHR0aW1lWm9uZTogXCJcIixcblx0XHRcdFx0XHRcdGFkdmFuY2VkUnVsZXM6IFtdLFxuXHRcdFx0XHQgIH0pXG5cdFx0XHR0aGlzLnJlcGVhdFJ1bGUuZnJlcXVlbmN5ID0gcmVwZWF0UGVyaW9kXG5cdFx0fVxuXHRcdHRoaXMudWlVcGRhdGVDYWxsYmFjaygpXG5cdH1cblxuXHQvKipcblx0ICogZ2V0IHRoZSBjdXJyZW50IGludGVydmFsIHRoaXMgc2VyaWVzIHJlcGVhdHMgaW4uXG5cdCAqXG5cdCAqIGlmIHRoZSBldmVudCBpcyBub3Qgc2V0IHRvXG5cdCAqL1xuXHRnZXQgcmVwZWF0SW50ZXJ2YWwoKTogbnVtYmVyIHtcblx0XHRpZiAoIXRoaXMucmVwZWF0UnVsZT8uaW50ZXJ2YWwpIHJldHVybiAxXG5cdFx0cmV0dXJuIGZpbHRlckludCh0aGlzLnJlcGVhdFJ1bGU/LmludGVydmFsKVxuXHR9XG5cblx0LyoqXG5cdCAqIHNldCB0aGUgZXZlbnQgdG8gb2NjdXIgb24gZXZlcnkgbnRoIG9mIGl0cyByZXBlYXQgcGVyaW9kIChpZSBldmVyeSBzZWNvbmQsIHRoaXJkLCBmb3VydGggZGF5L21vbnRoL3llYXIuLi4pLlxuXHQgKiBzZXR0aW5nIGl0IHRvIHNvbWV0aGluZyBsZXNzIHRoYW4gMSB3aWxsIHNldCB0aGUgaW50ZXJ2YWwgdG8gMVxuXHQgKiBAcGFyYW0gaW50ZXJ2YWxcblx0ICovXG5cdHNldCByZXBlYXRJbnRlcnZhbChpbnRlcnZhbDogbnVtYmVyKSB7XG5cdFx0aWYgKGludGVydmFsIDwgMSkgaW50ZXJ2YWwgPSAxXG5cdFx0Y29uc3Qgc3RyaW5nSW50ZXJ2YWwgPSBTdHJpbmcoaW50ZXJ2YWwpXG5cdFx0aWYgKHRoaXMucmVwZWF0UnVsZSAmJiB0aGlzLnJlcGVhdFJ1bGU/LmludGVydmFsICE9PSBzdHJpbmdJbnRlcnZhbCkge1xuXHRcdFx0dGhpcy5yZXBlYXRSdWxlLmludGVydmFsID0gc3RyaW5nSW50ZXJ2YWxcblx0XHR9XG5cblx0XHR0aGlzLnVpVXBkYXRlQ2FsbGJhY2soKVxuXHR9XG5cblx0LyoqXG5cdCAqIGdldCB0aGUgY3VycmVudCB3YXkgZm9yIHRoZSBldmVudCBzZXJpZXMgdG8gZW5kLlxuXHQgKi9cblx0Z2V0IHJlcGVhdEVuZFR5cGUoKTogRW5kVHlwZSB7XG5cdFx0cmV0dXJuICh0aGlzLnJlcGVhdFJ1bGU/LmVuZFR5cGUgPz8gRW5kVHlwZS5OZXZlcikgYXMgRW5kVHlwZVxuXHR9XG5cblx0LyoqXG5cdCAqIHNldCB0aGUgd2F5IHRoZSBldmVudCBzZXJpZXMgd2lsbCBzdG9wIHJlcGVhdGluZy4gaWYgdGhpcyBjYXVzZXMgYSBjaGFuZ2UgaW4gdGhlIGV2ZW50LFxuXHQgKiB0aGUgZW5kVmFsdWUgd2lsbCBiZSBzZXQgdG8gdGhlIGRlZmF1bHQgZm9yIHRoZSBzZWxlY3RlZCBFbmRUeXBlLlxuXHQgKlxuXHQgKiBAcGFyYW0gZW5kVHlwZVxuXHQgKi9cblx0c2V0IHJlcGVhdEVuZFR5cGUoZW5kVHlwZTogRW5kVHlwZSkge1xuXHRcdGlmICghdGhpcy5yZXBlYXRSdWxlKSB7XG5cdFx0XHQvLyBldmVudCBkb2VzIG5vdCByZXBlYXQsIG5vIGNoYW5nZXMgbmVjZXNzYXJ5XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHRpZiAodGhpcy5yZXBlYXRSdWxlLmVuZFR5cGUgPT09IGVuZFR5cGUpIHtcblx0XHRcdC8vIGV2ZW50IHNlcmllcyBlbmQgaXMgYWxyZWFkeSBzZXQgdG8gdGhlIHJlcXVlc3RlZCB2YWx1ZVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0dGhpcy5yZXBlYXRSdWxlLmVuZFR5cGUgPSBlbmRUeXBlXG5cblx0XHRzd2l0Y2ggKGVuZFR5cGUpIHtcblx0XHRcdGNhc2UgRW5kVHlwZS5VbnRpbERhdGU6XG5cdFx0XHRcdHRoaXMucmVwZWF0UnVsZS5lbmRWYWx1ZSA9IGdldERlZmF1bHRFbmREYXRlRW5kVmFsdWUoeyBzdGFydFRpbWU6IHRoaXMuX3N0YXJ0RGF0ZSwgZW5kVGltZTogdGhpcy5fZW5kRGF0ZSB9LCB0aGlzLnpvbmUpXG5cdFx0XHRcdHJldHVyblxuXHRcdFx0Y2FzZSBFbmRUeXBlLkNvdW50OlxuXHRcdFx0Y2FzZSBFbmRUeXBlLk5ldmVyOlxuXHRcdFx0XHR0aGlzLnJlcGVhdFJ1bGUuZW5kVmFsdWUgPSBnZXREZWZhdWx0RW5kQ291bnRWYWx1ZSgpXG5cdFx0fVxuXG5cdFx0dGhpcy51aVVwZGF0ZUNhbGxiYWNrKClcblx0fVxuXG5cdC8qKlxuXHQgKiBnZXQgdGhlIGN1cnJlbnQgbWF4aW11bSBudW1iZXIgb2YgcmVwZWF0cy4gaWYgdGhlIGV2ZW50IGlzIG5vdCBzZXQgdG8gcmVwZWF0IG9yXG5cdCAqIGVuZCBhZnRlciBudW1iZXIgb2Ygb2NjdXJyZW5jZXMsIHJldHVybnMgdGhlIGRlZmF1bHQgbWF4IHJlcGVhdCBudW1iZXIuXG5cdCAqL1xuXHRnZXQgcmVwZWF0RW5kT2NjdXJyZW5jZXMoKTogbnVtYmVyIHtcblx0XHRpZiAodGhpcy5yZXBlYXRSdWxlPy5lbmRUeXBlID09PSBFbmRUeXBlLkNvdW50ICYmIHRoaXMucmVwZWF0UnVsZT8uZW5kVmFsdWUpIHtcblx0XHRcdHJldHVybiBmaWx0ZXJJbnQodGhpcy5yZXBlYXRSdWxlPy5lbmRWYWx1ZSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZpbHRlckludChnZXREZWZhdWx0RW5kQ291bnRWYWx1ZSgpKVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBzZXQgdGhlIG1heCBudW1iZXIgb2YgcmVwZWF0cyBmb3IgdGhlIGV2ZW50IHNlcmllcy4gaWYgdGhlIGV2ZW50IGlzIG5vdCBzZXQgdG8gcmVwZWF0IG9yXG5cdCAqIG5vdCBzZXQgdG8gcmVwZWF0IGEgbWF4aW11bSBudW1iZXIgb2YgdGltZXMsIHRoaXMgaXMgYSBuby1vcC5cblx0ICogQHBhcmFtIGVuZFZhbHVlXG5cdCAqL1xuXHRzZXQgcmVwZWF0RW5kT2NjdXJyZW5jZXMoZW5kVmFsdWU6IG51bWJlcikge1xuXHRcdGNvbnN0IHN0cmluZ0VuZFZhbHVlID0gU3RyaW5nKGVuZFZhbHVlKVxuXHRcdGlmICh0aGlzLnJlcGVhdFJ1bGUgJiYgdGhpcy5yZXBlYXRSdWxlLmVuZFR5cGUgPT09IEVuZFR5cGUuQ291bnQgJiYgdGhpcy5yZXBlYXRSdWxlLmVuZFZhbHVlICE9PSBzdHJpbmdFbmRWYWx1ZSkge1xuXHRcdFx0dGhpcy5yZXBlYXRSdWxlLmVuZFZhbHVlID0gc3RyaW5nRW5kVmFsdWVcblx0XHR9XG5cdFx0dGhpcy51aVVwZGF0ZUNhbGxiYWNrKClcblx0fVxuXG5cdC8qKlxuXHQgKiBnZXQgdGhlIGRhdGUgYWZ0ZXIgd2hpY2ggdGhlIGV2ZW50IHNlcmllcyB3aWxsIHN0b3AgcmVwZWF0aW5nLlxuXHQgKlxuXHQgKiByZXR1cm5zIHRoZSBkZWZhdWx0IHZhbHVlIG9mIGEgbW9udGggYWZ0ZXIgdGhlIHN0YXJ0IGRhdGUgaWYgdGhlIGV2ZW50IGlzIG5vdFxuXHQgKiBzZXQgdG8gc3RvcCByZXBlYXRpbmcgYWZ0ZXIgYSBjZXJ0YWluIGRhdGUuXG5cdCAqL1xuXHRnZXQgcmVwZWF0RW5kRGF0ZUZvckRpc3BsYXkoKTogRGF0ZSB7XG5cdFx0aWYgKHRoaXMucmVwZWF0UnVsZT8uZW5kVHlwZSA9PT0gRW5kVHlwZS5VbnRpbERhdGUpIHtcblx0XHRcdHJldHVybiBnZXRSZXBlYXRFbmRUaW1lRm9yRGlzcGxheSh0aGlzLnJlcGVhdFJ1bGUsIHRoaXMuaXNBbGxEYXksIHRoaXMuem9uZSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG5ldyBEYXRlKGZpbHRlckludChnZXREZWZhdWx0RW5kRGF0ZUVuZFZhbHVlKHsgc3RhcnRUaW1lOiB0aGlzLl9zdGFydERhdGUsIGVuZFRpbWU6IHRoaXMuX2VuZERhdGUgfSwgdGhpcy56b25lKSkpXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIHNldCB0aGUgZGF0ZSBhZnRlciB3aGljaCB0aGUgZXZlbnQgc2VyaWVzIGVuZHMuIGlmIHRoZSBldmVudCBkb2VzIG5vdCByZXBlYXQgb3IgdGhlIHNlcmllcyBpc1xuXHQgKiBub3Qgc2V0IHRvIGVuZCBhZnRlciBhIGRhdGUsIHRoaXMgaXMgYSBuby1vcC5cblx0ICpcblx0ICogQHBhcmFtIG5ld1JlcGVhdEVuZERhdGUgdGhlIG5ldyBlbmQgZGF0ZSwgYXMgZGlzcGxheWVkIGluIGxvY2FsIHRpbWUgem9uZS5cblx0ICovXG5cdHNldCByZXBlYXRFbmREYXRlRm9yRGlzcGxheShuZXdSZXBlYXRFbmREYXRlOiBEYXRlKSB7XG5cdFx0aWYgKHRoaXMucmVwZWF0UnVsZSA9PSBudWxsIHx8IHRoaXMucmVwZWF0UnVsZS5lbmRUeXBlICE9PSBFbmRUeXBlLlVudGlsRGF0ZSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVwZWF0RW5kRGF0ZSA9IGluY3JlbWVudEJ5UmVwZWF0UGVyaW9kKG5ld1JlcGVhdEVuZERhdGUsIFJlcGVhdFBlcmlvZC5EQUlMWSwgMSwgdGhpcy56b25lKVxuXHRcdGNvbnN0IHRpbWVzID0gdGhpcy5nZXRUaW1lcygpXG5cdFx0aWYgKHJlcGVhdEVuZERhdGUgPCBnZXRFdmVudFN0YXJ0KHRpbWVzLCB0aGlzLnpvbmUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwic3RhcnRBZnRlckVuZF9sYWJlbFwiKVxuXHRcdH1cblxuXHRcdC8vIFdlIGhhdmUgdG8gc2F2ZSByZXBlYXRFbmREYXRlIGluIHRoZSBzYW1lIHdheSB3ZSBzYXZlIHN0YXJ0L2VuZCB0aW1lcyBiZWNhdXNlIGlmIG9uZSBpcyB0aW1lem9uZVxuXHRcdC8vIGRlcGVuZGVudCBhbmQgb25lIGlzIG5vdCB0aGVuIHdlIGhhdmUgaW50ZXJlc3RpbmcgYnVncyBpbiBlZGdlIGNhc2VzIChldmVudCBjcmVhdGVkIGluIC0xMSBjb3VsZFxuXHRcdC8vIGVuZCBvbiBhbm90aGVyIGRhdGUgaW4gKzEyKS4gU28gZm9yIGFsbCBkYXkgZXZlbnRzIGVuZCBkYXRlIGlzIFVUQy1lbmNvZGVkIGFsbCBkYXkgZXZlbnQgYW5kIGZvclxuXHRcdC8vIHJlZ3VsYXIgZXZlbnRzIGl0IGlzIGp1c3QgYSB0aW1lc3RhbXAuXG5cdFx0Y29uc3QgbnVtYmVyRW5kRGF0ZSA9ICh0aGlzLmlzQWxsRGF5ID8gZ2V0QWxsRGF5RGF0ZVVUQ0Zyb21ab25lKHJlcGVhdEVuZERhdGUsIHRoaXMuem9uZSkgOiByZXBlYXRFbmREYXRlKS5nZXRUaW1lKClcblx0XHR0aGlzLnJlcGVhdFJ1bGUuZW5kVmFsdWUgPSBTdHJpbmcobnVtYmVyRW5kRGF0ZSlcblx0XHR0aGlzLnVpVXBkYXRlQ2FsbGJhY2soKVxuXHR9XG5cblx0Z2V0IGV4Y2x1ZGVkRGF0ZXMoKTogUmVhZG9ubHlBcnJheTxEYXRlPiB7XG5cdFx0cmV0dXJuIHRoaXMucmVwZWF0UnVsZT8uZXhjbHVkZWREYXRlcy5tYXAoKHsgZGF0ZSB9KSA9PiBkYXRlKSA/PyBbXVxuXHR9XG5cblx0LyoqXG5cdCAqIGNhbGxpbmcgdGhpcyBhZGRzIGFuIGV4Y2x1c2lvbiBmb3IgdGhlIGV2ZW50IGluc3RhbmNlIHN0YXJ0aW5nIGF0IGRhdGVUb0V4Y2x1ZGUgdG8gdGhlIHJlcGVhdCBydWxlIG9mIHRoZSBldmVudCxcblx0ICogd2hpY2ggd2lsbCBjYXVzZSB0aGUgaW5zdGFuY2UgdG8gbm90IGJlIHJlbmRlcmVkIG9yIGZpcmUgYWxhcm1zLlxuXHQgKiBFeGNsdXNpb25zIGFyZSB0aGUgc3RhcnQgZGF0ZS90aW1lIG9mIHRoZSBldmVudCAoYXMgYSB1dGMgdGltZXN0YW1wKVxuXHQgKlxuXHQgKiB0aGUgbGlzdCBvZiBleGNsdXNpb25zIGlzIG1haW50YWluZWQgc29ydGVkIGZyb20gZWFybGllc3QgdG8gbGF0ZXN0LlxuXHQgKi9cblx0ZXhjbHVkZURhdGUoZGF0ZTogRGF0ZSk6IHZvaWQge1xuXHRcdGlmICh0aGlzLnJlcGVhdFJ1bGUgPT0gbnVsbCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJ0cmllZCB0byBhZGQgYW4gZXhjbHVzaW9uIGZvciBhbiBldmVudCB3aXRob3V0IGEgcmVwZWF0IHJ1bGUuIHNob3VsZCBwcm9iYWJseSBkZWxldGUgdGhlIGV2ZW50LlwiKVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdGNvbnN0IHRpbWVUb0luc2VydCA9IGRhdGUuZ2V0VGltZSgpXG5cdFx0bGV0IGluc2VydGlvbkluZGV4ID0gLTFcblx0XHRmb3IgKGNvbnN0IFtpbmRleCwgeyBkYXRlIH1dIG9mIHRoaXMucmVwZWF0UnVsZS5leGNsdWRlZERhdGVzLmVudHJpZXMoKSkge1xuXHRcdFx0Ly8gdGhlIGRhdGUgaXMgYWxyZWFkeSBleGNsdWRlZCwgbm8gbmVlZCB0byBkbyBhbnl0aGluZ1xuXHRcdFx0aWYgKGRhdGUuZ2V0VGltZSgpID09PSB0aW1lVG9JbnNlcnQpIHtcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9IGVsc2UgaWYgKGRhdGUuZ2V0VGltZSgpID4gdGltZVRvSW5zZXJ0KSB7XG5cdFx0XHRcdGluc2VydGlvbkluZGV4ID0gaW5kZXhcblx0XHRcdFx0YnJlYWtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gYXMgb2Ygbm93LCBvdXIgbWF4aW11bSByZXBlYXQgZnJlcXVlbmN5IGlzIDEvZGF5LiB0aGlzIG1lYW5zIHRoYXQgd2UgY291bGQgdHJ1bmNhdGUgdGhpcyB0byB0aGUgY3VycmVudCBkYXkgKG5vIHRpbWUpXG5cdFx0Ly8gYnV0IHRoZW4gd2UgcnVuIGludG8gcHJvYmxlbXMgd2l0aCB0aW1lIHpvbmVzLCBzaW5jZSB3ZSdkIGxpa2UgdG8gZGVsZXRlIHRoZSBuLXRoIG9jY3VycmVuY2Ugb2YgYW4gZXZlbnQsIGJ1dCBkZXRlY3Rcblx0XHQvLyBpZiBhbiBldmVudCBpcyBleGNsdWRlZCBieSB0aGUgc3RhcnQgb2YgdGhlIHV0YyBkYXkgaXQgZmFsbHMgb24sIHdoaWNoIG1heSBkZXBlbmQgb24gdGltZSB6b25lIGlmIGl0J3MgdHJ1bmNhdGVkIHRvIHRoZSBsb2NhbCBzdGFydCBvZiBkYXlcblx0XHQvLyBvbiB3aGljaCB0aGUgZXhjbHVzaW9uIGlzIGNyZWF0ZWQuXG5cdFx0Y29uc3Qgd3JhcHBlclRvSW5zZXJ0ID0gY3JlYXRlRGF0ZVdyYXBwZXIoeyBkYXRlIH0pXG5cdFx0aWYgKGluc2VydGlvbkluZGV4IDwgMCkge1xuXHRcdFx0dGhpcy5yZXBlYXRSdWxlLmV4Y2x1ZGVkRGF0ZXMucHVzaCh3cmFwcGVyVG9JbnNlcnQpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucmVwZWF0UnVsZS5leGNsdWRlZERhdGVzLnNwbGljZShpbnNlcnRpb25JbmRleCwgMCwgd3JhcHBlclRvSW5zZXJ0KVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBjb21wbGV0ZWx5IGRlbGV0ZSBhbGwgZXhjbHVzaW9ucy4gd2lsbCBjYXVzZSB0aGUgZXZlbnQgdG8gYmUgcmVuZGVyZWQgYW5kIGZpcmUgYWxhcm1zIG9uIGFsbFxuXHQgKiBvY2N1cnJlbmNlcyBhcyBkaWN0YXRlZCBieSBpdHMgcmVwZWF0IHJ1bGUuXG5cdCAqL1xuXHRkZWxldGVFeGNsdWRlZERhdGVzKCk6IHZvaWQge1xuXHRcdGlmICghdGhpcy5yZXBlYXRSdWxlKSByZXR1cm5cblx0XHR0aGlzLnJlcGVhdFJ1bGUuZXhjbHVkZWREYXRlcy5sZW5ndGggPSAwXG5cdH1cblxuXHQvKipcblx0ICogY2hhbmdlIHN0YXJ0IGFuZCBlbmQgdGltZSBhbmQgZGF0ZXMgb2YgdGhlIGV2ZW50IGJ5IGEgZml4ZWQgYW1vdW50LlxuXHQgKiBAcGFyYW0gZGlmZiBhbiBvYmplY3QgY29udGFpbmluZyBhIGR1cmF0aW9uIGluIGx1eG9ucyB5ZWFyL3F1YXJ0ZXIvLi4uIGZvcm1hdFxuXHQgKi9cblx0cmVzY2hlZHVsZUV2ZW50KGRpZmY6IER1cmF0aW9uTGlrZU9iamVjdCk6IHZvaWQge1xuXHRcdGNvbnN0IG9sZFN0YXJ0VGltZSA9IHRoaXMuc3RhcnRUaW1lLnRvRGF0ZVRpbWUodGhpcy5zdGFydERhdGUsIHRoaXMuem9uZSlcblx0XHRjb25zdCBvbGRFbmRUaW1lID0gdGhpcy5lbmRUaW1lLnRvRGF0ZVRpbWUodGhpcy5lbmREYXRlLCB0aGlzLnpvbmUpXG5cdFx0Y29uc3QgbmV3U3RhcnREYXRlID0gb2xkU3RhcnRUaW1lLnBsdXMoZGlmZilcblx0XHRjb25zdCBuZXdFbmREYXRlID0gb2xkRW5kVGltZS5wbHVzKGRpZmYpXG5cblx0XHR0aGlzLl9zdGFydERhdGUgPSBnZXRTdGFydE9mRGF5V2l0aFpvbmUobmV3U3RhcnREYXRlLnRvSlNEYXRlKCksIHRoaXMuem9uZSlcblx0XHR0aGlzLl9lbmREYXRlID0gZ2V0U3RhcnRPZkRheVdpdGhab25lKG5ld0VuZERhdGUudG9KU0RhdGUoKSwgdGhpcy56b25lKVxuXHRcdGlmICghdGhpcy5faXNBbGxEYXkpIHtcblx0XHRcdHRoaXMuX3N0YXJ0VGltZSA9IFRpbWUuZnJvbURhdGVUaW1lKG5ld1N0YXJ0RGF0ZSlcblx0XHRcdHRoaXMuX2VuZFRpbWUgPSBUaW1lLmZyb21EYXRlVGltZShuZXdFbmREYXRlKVxuXHRcdH1cblx0fVxuXG5cdGdldCByZXN1bHQoKTogQ2FsZW5kYXJFdmVudFdoZW5Nb2RlbFJlc3VsdCB7XG5cdFx0Ly8gd2UgZ290IGEgc3RyaXBwZWQgcmVwZWF0IHJ1bGUsIHNvIHdlIHJlLWNyZWF0ZSBhIGZyZXNoIG9uZSB3aXRoIGFsbCBmaWVsZHMgYnV0IG92ZXJ3cml0ZSBpdCB3aXRoIG91ciB2YWx1ZXMuXG5cdFx0Y29uc3QgcmVwZWF0UnVsZTogUmVwZWF0UnVsZSB8IG51bGwgPSB0aGlzLnJlcGVhdFJ1bGVcblx0XHRcdD8ge1xuXHRcdFx0XHRcdC4uLmNyZWF0ZVJlcGVhdFJ1bGUoe1xuXHRcdFx0XHRcdFx0dGltZVpvbmU6IFwiXCIsXG5cdFx0XHRcdFx0XHRleGNsdWRlZERhdGVzOiBbXSxcblx0XHRcdFx0XHRcdGVuZFR5cGU6IFwiMFwiLFxuXHRcdFx0XHRcdFx0ZW5kVmFsdWU6IG51bGwsXG5cdFx0XHRcdFx0XHRpbnRlcnZhbDogXCIwXCIsXG5cdFx0XHRcdFx0XHRmcmVxdWVuY3k6IFwiMFwiLFxuXHRcdFx0XHRcdFx0YWR2YW5jZWRSdWxlczogW10sXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0Li4udGhpcy5yZXBlYXRSdWxlLFxuXHRcdFx0XHRcdHRpbWVab25lOiB0aGlzLnpvbmUsXG5cdFx0XHQgIH1cblx0XHRcdDogbnVsbFxuXHRcdHRoaXMuZGVsZXRlRXhjbHVkZWREYXRlc0lmTmVjZXNzYXJ5KHJlcGVhdFJ1bGUpXG5cdFx0Y29uc3QgeyBzdGFydFRpbWUsIGVuZFRpbWUgfSA9IHRoaXMuZ2V0VGltZXMoKVxuXHRcdHJldHVybiB7IHN0YXJ0VGltZSwgZW5kVGltZSwgcmVwZWF0UnVsZSB9XG5cdH1cblxuXHQvKipcblx0ICogZ2V0IHRoZSBKUyBkYXRlcyB3aGVyZSB0aGUgZXZlbnQgc3RhcnRzIGFuZCBlbmRzIGFzIHRoZXkgd291bGQgYmUgc2F2ZWQgb24gdGhlIHNlcnZlciAoZGlzcGxheSBtYXkgdmFyeSlcblx0ICogQHBhcmFtIHN0YXJ0RGF0ZSBiYXNlIGRhdGUgdG8gdXNlIGZvciB0aGUgc3RhcnQgZGF0ZVxuXHQgKiBAcGFyYW0gZW5kRGF0ZSBiYXNlIGRhdGUgdG8gdXNlIGZvciB0aGUgZW5kIGRhdGUuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRwcml2YXRlIGdldFRpbWVzKFxuXHRcdHsgc3RhcnREYXRlLCBlbmREYXRlIH06IHsgc3RhcnREYXRlOiBEYXRlOyBlbmREYXRlOiBEYXRlIH0gPSB7XG5cdFx0XHRzdGFydERhdGU6IHRoaXMuX3N0YXJ0RGF0ZSxcblx0XHRcdGVuZERhdGU6IHRoaXMuX2VuZERhdGUsXG5cdFx0fSxcblx0KTogQ2FsZW5kYXJFdmVudFRpbWVzIHtcblx0XHRpZiAodGhpcy5faXNBbGxEYXkpIHtcblx0XHRcdGNvbnN0IHN0YXJ0VGltZSA9IGdldEFsbERheURhdGVVVENGcm9tWm9uZShzdGFydERhdGUsIHRoaXMuem9uZSlcblx0XHRcdGNvbnN0IGVuZFRpbWUgPSBnZXRBbGxEYXlEYXRlVVRDRnJvbVpvbmUoZ2V0U3RhcnRPZk5leHREYXlXaXRoWm9uZShlbmREYXRlLCB0aGlzLnpvbmUpLCB0aGlzLnpvbmUpXG5cdFx0XHRyZXR1cm4geyBzdGFydFRpbWUsIGVuZFRpbWUgfVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBzdGFydFRpbWUgPSB0aGlzLl9zdGFydFRpbWUhLnRvRGF0ZVRpbWUoZ2V0U3RhcnRPZkRheVdpdGhab25lKHN0YXJ0RGF0ZSwgdGhpcy56b25lKSwgdGhpcy56b25lKS50b0pTRGF0ZSgpXG5cdFx0XHRjb25zdCBlbmRUaW1lID0gdGhpcy5fZW5kVGltZSEudG9EYXRlVGltZShnZXRTdGFydE9mRGF5V2l0aFpvbmUoZW5kRGF0ZSwgdGhpcy56b25lKSwgdGhpcy56b25lKS50b0pTRGF0ZSgpXG5cdFx0XHRyZXR1cm4geyBzdGFydFRpbWUsIGVuZFRpbWUgfVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBpZGVhbGx5LCB3ZSB3YW50IHRvIGRlbGV0ZSBleGNsdXNpb25zIGFmdGVyIGFuIGVkaXQgb3BlcmF0aW9uIG9ubHkgd2hlbiBuZWNlc3NhcnkuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRwcml2YXRlIGRlbGV0ZUV4Y2x1ZGVkRGF0ZXNJZk5lY2Vzc2FyeShuZXdSZXBlYXQ6IFJlcGVhdFJ1bGUgfCBudWxsKSB7XG5cdFx0aWYgKG5ld1JlcGVhdCA9PSBudWxsKSByZXR1cm5cblx0XHRjb25zdCBvbGRSZXBlYXQgPSB0aGlzLmluaXRpYWxWYWx1ZXMucmVwZWF0UnVsZSA/PyBudWxsXG5cdFx0Ly8gaWYgZXhjbHVkZWQgZGF0ZXMgaGF2ZSBjaGFuZ2VkLFxuXHRcdGlmICghYXJlUmVwZWF0UnVsZXNFcXVhbChuZXdSZXBlYXQsIG9sZFJlcGVhdCkgJiYgYXJlRXhjbHVkZWREYXRlc0VxdWFsKG5ld1JlcGVhdD8uZXhjbHVkZWREYXRlcyA/PyBbXSwgb2xkUmVwZWF0Py5leGNsdWRlZERhdGVzID8/IFtdKSkge1xuXHRcdFx0bmV3UmVwZWF0LmV4Y2x1ZGVkRGF0ZXMgPSBbXVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdGlmICh0aGlzLmluaXRpYWxWYWx1ZXMuc3RhcnRUaW1lID09IG51bGwpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHRjb25zdCB7IHN0YXJ0VGltZSB9ID0gdGhpcy5nZXRUaW1lcygpXG5cdFx0aWYgKHN0YXJ0VGltZS5nZXRUaW1lKCkgIT09IHRoaXMuaW5pdGlhbFZhbHVlcy5zdGFydFRpbWUuZ2V0VGltZSgpKSB7XG5cdFx0XHRuZXdSZXBlYXQuZXhjbHVkZWREYXRlcyA9IFtdXG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBjcmVhdGUgdGhlIGRlZmF1bHQgcmVwZWF0IGVuZCBmb3IgYW4gZXZlbnQgc2VyaWVzIHRoYXQgZW5kcyBvbiBhIGRhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRFbmREYXRlRW5kVmFsdWUoeyBzdGFydFRpbWUgfTogQ2FsZW5kYXJFdmVudFRpbWVzLCB0aW1lWm9uZTogc3RyaW5nKTogc3RyaW5nIHtcblx0Ly8gb25lIG1vbnRoIGFmdGVyIHRoZSBldmVudCdzIHN0YXJ0IHRpbWUgaW4gdGhlIGxvY2FsIHRpbWUgem9uZS5cblx0cmV0dXJuIFN0cmluZyhpbmNyZW1lbnRCeVJlcGVhdFBlcmlvZChzdGFydFRpbWUsIFJlcGVhdFBlcmlvZC5NT05USExZLCAxLCB0aW1lWm9uZSkuZ2V0VGltZSgpKVxufVxuXG4vKipcbiAqIGdldCB0aGUgZGVmYXVsdCByZXBlYXQgZW5kIGZvciBhbiBldmVudCBzZXJpZXMgdGhhdCBlbmRzIGFmdGVyIG51bWJlciBvZiByZXBlYXRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0RW5kQ291bnRWYWx1ZSgpOiBzdHJpbmcge1xuXHRyZXR1cm4gXCIxMFwiXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXBlYXRSdWxlV2l0aEV4Y2x1ZGVkQWx0ZXJlZEluc3RhbmNlcyhwcm9nZW5pdG9yOiBDYWxlbmRhckV2ZW50LCByZWN1cnJlbmNlSWRzOiBSZWFkb25seUFycmF5PERhdGU+LCB0aW1lWm9uZTogc3RyaW5nKTogQ2FsZW5kYXJSZXBlYXRSdWxlIHtcblx0Y29uc3Qgd2hlbk1vZGVsID0gbmV3IENhbGVuZGFyRXZlbnRXaGVuTW9kZWwocHJvZ2VuaXRvciwgdGltZVpvbmUpXG5cdGZvciAoY29uc3QgcmVjdXJyZW5jZUlkIG9mIHJlY3VycmVuY2VJZHMpIHtcblx0XHR3aGVuTW9kZWwuZXhjbHVkZURhdGUocmVjdXJyZW5jZUlkKVxuXHR9XG5cdHJldHVybiBhc3NlcnROb3ROdWxsKHdoZW5Nb2RlbC5yZXN1bHQucmVwZWF0UnVsZSwgXCJ0cmllZCB0byBleGNsdWRlIGFsdGVyZWQgaW5zdGFuY2Ugb24gcHJvZ2VuaXRvciB3aXRob3V0IHJlcGVhdCBydWxlIVwiKVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7SUFNYSxPQUFOLE1BQU0sS0FBSztDQUNqQixBQUFTO0NBQ1QsQUFBUztDQUVULFlBQVlBLE1BQWNDLFFBQWdCO0FBQ3pDLE9BQUssT0FBTyxLQUFLLE1BQU0sS0FBSyxHQUFHO0FBQy9CLE9BQUssU0FBUyxLQUFLLE1BQU0sT0FBTyxHQUFHO0NBQ25DOzs7Ozs7Q0FPRCxPQUFPLFNBQVNDLE1BQWtCO0FBQ2pDLFNBQU8sSUFBSSxLQUFLLEtBQUssVUFBVSxFQUFFLEtBQUssWUFBWTtDQUNsRDtDQUVELE9BQU8sYUFBYSxFQUFFLE1BQU0sUUFBa0IsRUFBUTtBQUNyRCxTQUFPLElBQUksS0FBSyxNQUFNO0NBQ3RCOzs7O0NBS0QsT0FBTyxnQkFBZ0JDLFlB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