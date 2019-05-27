//@flow
import {concat} from "../api/common/utils/ArrayUtils"
import {stringToUtf8Uint8Array} from "../api/common/utils/Encoding"
import {uint8arrayToCustomId} from "../api/common/EntityFunctions"
import {getStartOfNextDay, isStartOfDay} from "../api/common/utils/DateUtils"
import {pad} from "../api/common/utils/StringUtils"


export const CALENDARID_RANDOM_PART_MIN_ID = Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0])
export const CALENDARID_RANDOM_PART_MAX_ID = Uint8Array.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF])
export const CALENDARID_RANDOM_PART_LENGTH = 8
const CALENDARID_DAYS_SHIFTED = 30

export function generateEventElementId(timestamp: number): string {
	return createEventElementId(timestamp, Math.floor(Math.random() * 60 - CALENDARID_DAYS_SHIFTED), getRandomBytes(CALENDARID_RANDOM_PART_LENGTH))
}

function createEventElementId(timestamp: number, shiftDays: number, randomPart: Uint8Array): string {
	const d = new Date(timestamp)
	d.setDate(d.getDate() + shiftDays)
	const idTimestampPart = "" + d.getFullYear() + pad(d.getMonth(), 2) + pad(d.getDate(), 2)
	const idBytes = concat(stringToUtf8Uint8Array(idTimestampPart), randomPart)
	return uint8arrayToCustomId(idBytes)
}

export function geEventElementMaxId(timestamp: number): string {
	return createEventElementId(timestamp, CALENDARID_DAYS_SHIFTED, CALENDARID_RANDOM_PART_MAX_ID)
}

export function getEventElementMinId(timestamp: number): string {
	return createEventElementId(timestamp, -CALENDARID_DAYS_SHIFTED, CALENDARID_RANDOM_PART_MIN_ID)
}

function getRandomBytes(bytes): Uint8Array {
	const randomBytes = new Uint8Array(bytes)
	crypto.getRandomValues(randomBytes)
	return randomBytes
}

export function eventStartsBefore(currentDate: Date, event: CalendarEvent): boolean {
	// currentDate is alread start of day
	return event.startTime.getTime() < currentDate.getTime()
}

export function eventEndsAfterDay(currentDate: Date, event: CalendarEvent): boolean {
	return getEventEnd(event).getTime() > getStartOfNextDay(currentDate).getTime()
}

export function parseTimeTo(timeString: string): ?{hours: number, minutes: number} {
	if (!timeString.match(/^[0-2][0-9]:[0-5][05]$/)) {
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
	return event.endTime
}

export function isAlllDayEvent(event: CalendarEvent): boolean {
	return isStartOfDay(event.startTime) && isStartOfDay(getEventEnd(event))
}

export const RepeatPeriod = Object.freeze({
	NEVER: "0",
	DAILY: "1",
	WEEKLY: "2",
	MONTHLY: "3",
	ANNUALLY: "4",
})
export type RepeatPeriodEnum = $Values<typeof RepeatPeriod>

export function getMonth(date: Date): {start: Date, end: Date} {
	const start = new Date(date)
	start.setDate(1)
	start.setHours(0, 0, 0, 0)
	const end = new Date(start)
	end.setMonth(start.getMonth() + 1)
	return {start, end}
}
