//@flow
import {concat} from "../api/common/utils/ArrayUtils"
import {stringToUtf8Uint8Array} from "../api/common/utils/Encoding"
import {uint8arrayToCustomId} from "../api/common/EntityFunctions"
import {getStartOfNextDay, isStartOfDay} from "../api/common/utils/DateUtils"
import {pad} from "../api/common/utils/StringUtils"

export function makeEventElementId(timestampt: number, randomBytes: Uint8Array = getRandomBytes(8)): string {
	const idBytes = concat(stringToUtf8Uint8Array(String(timestampt)), randomBytes)
	return uint8arrayToCustomId(idBytes)
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
	return (event.startTime.getTime() + Number(event.duration)) > getStartOfNextDay(currentDate).getTime()
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
	return new Date(event.startTime.getTime() + Number(event.duration))
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