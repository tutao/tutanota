//@flow
import type {CalendarMonthTimeRange} from "./CalendarUtils"
import {getAllDayDateUTC, getEventEnd, getEventStart, isAllDayEvent, isLongEvent} from "./CalendarUtils"
import {getStartOfDay, incrementDate} from "../api/common/utils/DateUtils"
import {getFromMap} from "../api/common/utils/MapUtils"
import {clone, downcast} from "../api/common/utils/Utils"
import type {RepeatPeriodEnum} from "../api/common/TutanotaConstants"
import {EndType, RepeatPeriod} from "../api/common/TutanotaConstants"
import {DateTime} from "luxon"

export function addDaysForEvent(events: Map<number, Array<CalendarEvent>>, event: CalendarEvent, month: CalendarMonthTimeRange) {
	const calculationDate = getStartOfDay(getEventStart(event))
	const eventEndDate = getEventEnd(event);

	// only add events when the start time is inside this month
	if (getEventStart(event).getTime() < month.start.getTime() || getEventStart(event).getTime() >= month.end.getTime()) {
		return
	}

	// if start time is in current month then also add events for subsequent months until event ends
	while (calculationDate.getTime() < eventEndDate.getTime()) {
		if (eventEndDate.getTime() >= month.start.getTime()) {
			getFromMap(events, calculationDate.getTime(), () => []).push(event)
		}
		incrementDate(calculationDate, 1)
	}
}

export function addDaysForRecurringEvent(events: Map<number, Array<CalendarEvent>>, event: CalendarEvent, month: CalendarMonthTimeRange) {
	const repeatRule = event.repeatRule
	if (repeatRule == null) {
		throw new Error("Invalid argument: event doesn't have a repeatRule" + JSON.stringify(event))
	}
	const frequency: RepeatPeriodEnum = downcast(repeatRule.frequency)
	const interval = Number(repeatRule.interval)
	const isLong = isLongEvent(event)
	let eventStartTime = new Date(getEventStart(event))
	let eventEndTime = new Date(getEventEnd(event))
	// Loop by the frequency step
	let endTime = null
	let endOccurrences = null
	if (repeatRule.endType === EndType.Count) {
		endOccurrences = Number(repeatRule.endValue)
	} else if (repeatRule.endType === EndType.UntilDate) {
		endTime = new Date(Number(repeatRule.endValue))
	}
	let calcStartTime = eventStartTime
	let calcEndTime = eventEndTime
	let iteration = 1
	while ((endOccurrences == null || iteration <= endOccurrences)
	&& (endTime == null || calcStartTime.getTime() < endTime)
	&& calcStartTime.getTime() < month.end.getTime()) {
		if (calcEndTime.getTime() >= month.start.getTime()) {
			const eventClone = clone(event)
			if (isAllDayEvent(event)) {
				eventClone.startTime = getAllDayDateUTC(calcStartTime)
				eventClone.endTime = getAllDayDateUTC(calcEndTime)
			} else {
				eventClone.startTime = new Date(calcStartTime)
				eventClone.endTime = new Date(calcEndTime)
			}
			if (isLong) {
				addDaysForLongEvent(events, eventClone, month)
			} else {
				addDaysForEvent(events, eventClone, month)
			}
		}
		calcStartTime = incrementByRepeatPeriod(eventStartTime, frequency, interval * iteration, repeatRule.timeZone)
		calcEndTime = incrementByRepeatPeriod(eventEndTime, frequency, interval * iteration, repeatRule.timeZone)
		iteration++
	}
}

export function addDaysForLongEvent(events: Map<number, Array<CalendarEvent>>, event: CalendarEvent, month: CalendarMonthTimeRange) {
	// for long running events we create events for the month only

	// first start of event is inside month
	const eventStart = getEventStart(event).getTime()
	const eventEnd = getEventEnd(event).getTime()

	let calculationDate
	let eventEndInMonth

	if (eventStart >= month.start.getTime() && eventStart < month.end.getTime()) { // first: start of event is inside month
		calculationDate = getStartOfDay(new Date(eventStart))
		//eventEndInMonth = new Date(eventStart)
	} else if (eventStart < month.start.getTime()) { // start is before month
		calculationDate = new Date(month.start)
	} else {
		return // start date is after month end
	}

	if (eventEnd > month.start.getTime() && eventEnd <= month.end.getTime()) { //end is inside month
		eventEndInMonth = new Date(eventEnd)
	} else if (eventEnd > month.end.getTime()) { // end is after month end
		eventEndInMonth = new Date(month.end)
	} else {
		return // end is before start of month
	}

	while (calculationDate.getTime() < eventEndInMonth) {
		getFromMap(events, calculationDate.getTime(), () => []).push(event)
		incrementDate(calculationDate, 1)
	}

}


export function incrementByRepeatPeriod(date: Date, repeatPeriod: RepeatPeriodEnum, interval: number, ianaTimeZone: string): Date {
	const calculationDate = new Date(date)
	switch (repeatPeriod) {
		case RepeatPeriod.DAILY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({days: interval}).toJSDate()
		case RepeatPeriod.WEEKLY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({weeks: interval}).toJSDate()
		case RepeatPeriod.MONTHLY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({months: interval}).toJSDate()
		case RepeatPeriod.ANNUALLY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({years: interval}).toJSDate()
	}
	return calculationDate
}



