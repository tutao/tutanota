//@flow
import {stringToCustomId} from "../api/common/EntityFunctions"
import {DAY_IN_MILLIS, getStartOfNextDay} from "../api/common/utils/DateUtils"
import {pad} from "../api/common/utils/StringUtils"

const DAYS_SHIFTED_MS = 15 * DAY_IN_MILLIS

export type CalendarMonthTimeRange = {
	start: Date,
	end: Date
}


export function generateEventElementId(timestamp: number): string {
	const randomDay = Math.floor((Math.random() * DAYS_SHIFTED_MS)) * 2
	return createEventElementId(timestamp, randomDay - DAYS_SHIFTED_MS)
}

function createEventElementId(timestamp: number, shiftDays: number): string {
	return stringToCustomId(String(timestamp + shiftDays))
}

export function geEventElementMaxId(timestamp: number): string {
	return createEventElementId(timestamp, DAYS_SHIFTED_MS)
}

export function getEventElementMinId(timestamp: number): string {
	return createEventElementId(timestamp, -DAYS_SHIFTED_MS)
}

export function eventStartsBefore(currentDate: Date, event: CalendarEvent): boolean {
	return getEventStart(event).getTime() < currentDate.getTime()
}

export function eventEndsAfterDay(currentDate: Date, event: CalendarEvent): boolean {
	return getEventEnd(event).getTime() > getStartOfNextDay(currentDate).getTime()
}

export function parseTimeTo(timeString: string): ?{hours: number, minutes: number} {
	if (!timeString.match(/^[0-2][0-9]:[0-5][0-9]$/)) {
		return null
	}
	const [hours, minutes] = timeString.split(":").map(Number)
	if (hours > 23 || minutes > 59) {
		return null
	}
	return {hours, minutes}
}


export function timeString(date: Date): string {
	let hours = pad(date.getHours(), 2)
	let minutes = pad(date.getMinutes(), 2)
	return hours + ":" + minutes
}

export function getEventEnd(event: CalendarEvent): Date {
	if (isAllDayEvent(event)) {
		return getAllDayDateLocal(event.endTime)
	} else {
		return event.endTime
	}
}

export function getEventStart(event: CalendarEvent): Date {
	if (isAllDayEvent(event)) {
		return getAllDayDateLocal(event.startTime)
	} else {
		return event.startTime
	}
}


export function getAllDayDateUTC(localDate: Date): Date {
	return new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 0, 0, 0, 0))
}

export function getAllDayDateLocal(utcDate: Date): Date {
	return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), 0, 0, 0, 0)
}


export function isAllDayEvent(event: CalendarEvent): boolean {
	const {startTime, endTime} = event
	return startTime.getUTCHours() === 0 && startTime.getUTCMinutes() === 0 && startTime.getUTCSeconds() === 0
		&& endTime.getUTCHours() === 0 && endTime.getUTCMinutes() === 0 && endTime.getUTCSeconds() === 0
}

export function isLongEvent(event: CalendarEvent): boolean {
	return getEventEnd(event).getTime() - getEventStart(event).getTime() > DAYS_SHIFTED_MS
}

export function getMonth(date: Date): CalendarMonthTimeRange {
	const start = new Date(date)
	start.setDate(1)
	start.setHours(0, 0, 0, 0)
	const end = new Date(start)
	end.setMonth(start.getMonth() + 1)
	return {start, end}
}
