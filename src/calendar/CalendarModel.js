//@flow
import type {CalendarMonthTimeRange} from "./CalendarUtils"
import {getAllDayDateLocal, getAllDayDateUTC, getEventEnd, getEventStart, isAllDayEvent, isLongEvent} from "./CalendarUtils"
import {getStartOfDay, incrementDate} from "../api/common/utils/DateUtils"
import {getFromMap} from "../api/common/utils/MapUtils"
import {clone, downcast} from "../api/common/utils/Utils"
import type {RepeatPeriodEnum} from "../api/common/TutanotaConstants"
import {EndType, RepeatPeriod} from "../api/common/TutanotaConstants"
import {endCountPicker} from "./CalendarEventDialog"

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
	let endTime = NaN
	let endOccurrences = NaN
	if (repeatRule.endType === EndType.Count) {
		endOccurrences = Number(repeatRule.endValue)
	} else if (repeatRule.endType === EndType.UntilDate) {
		endTime = getAllDayDateLocal(new Date(Number(repeatRule.endType)))
	}
	while (eventStartTime.getTime() < month.end.getTime()) {
		if (eventEndTime.getTime() >= month.start.getTime()) {
			const eventClone = clone(event)
			if (isAllDayEvent(event)) {
				eventClone.startTime = getAllDayDateUTC(eventStartTime)
				eventClone.endTime = getAllDayDateUTC(eventEndTime)
			} else {
				eventClone.startTime = new Date(eventStartTime)
				eventClone.endTime = new Date(eventEndTime)
			}
			if (isLong) {
				addDaysForLongEvent(events, eventClone, month)
			} else {
				addDaysForEvent(events, eventClone, month)
			}
		}
		incrementByRepeatPeriod(eventStartTime, frequency, interval)
		incrementByRepeatPeriod(eventEndTime, frequency, interval)
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


function incrementByRepeatPeriod(date: Date, repeatPeriod: RepeatPeriodEnum, interval: number) {
	switch (repeatPeriod) {
		case RepeatPeriod.DAILY:
			date.setDate(date.getDate() + interval)
			break
		case RepeatPeriod.WEEKLY:
			date.setDate(date.getDate() + 7 * interval)
			break
		case RepeatPeriod.MONTHLY:
			date.setMonth(date.getMonth() + interval)
			break
		case RepeatPeriod.ANNUALLY:
			date.setFullYear(date.getFullYear() + interval)
			break
	}
}
