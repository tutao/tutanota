import {DAY_IN_MILLIS} from "@tutao/tutanota-utils"
import type {CalendarEvent} from "../../entities/tutanota/TypeRefs.js"
import {stringToCustomId} from "./EntityUtils"

/**
 * the time in ms that element ids for calendar events and alarms  get randomized by
 */
export const DAYS_SHIFTED_MS = 15 * DAY_IN_MILLIS

/*
 * convenience wrapper for isAllDayEventByTimes
 */
export function isAllDayEvent({startTime, endTime}: CalendarEvent): boolean {
	return isAllDayEventByTimes(startTime, endTime)
}

/**
 * determine if an event with the given start and end times would be an all-day event
 */
export function isAllDayEventByTimes(startTime: Date, endTime: Date): boolean {
	return (
		startTime.getUTCHours() === 0 &&
		startTime.getUTCMinutes() === 0 &&
		startTime.getUTCSeconds() === 0 &&
		endTime.getUTCHours() === 0 &&
		endTime.getUTCMinutes() === 0 &&
		endTime.getUTCSeconds() === 0
	)
}

/**
 * @param localDate
 * @returns {Date} a Date with a unix timestamp corresponding to 00:00 UTC for localDate's Day in the local time zone
 */
export function getAllDayDateUTC(localDate: Date): Date {
	return new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 0, 0, 0, 0))
}

/**
 * @param utcDate a Date with a unix timestamp corresponding to 00:00 UTC for a given Day
 * @returns {Date} a Date with a unix timestamp corresponding to 00:00 for that day in the local time zone
 */
export function getAllDayDateLocal(utcDate: Date): Date {
	return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())
}


/**
 * generate a semi-randomized element id for a calendar event or an alarm
 * @param timestamp the start time of the event or the creation time of the alarm
 */
export function generateEventElementId(timestamp: number): string {
	// the id is based on either the event start time or the alarm creation time
	// we add a random shift between -DAYS_SHIFTED_MS and +DAYS_SHIFTED_MS to the event
	// id to prevent the server from knowing the exact time but still being able to
	// approximately sort them.
	const randomDay = Math.floor(Math.random() * DAYS_SHIFTED_MS) * 2
	return createEventElementId(timestamp, randomDay - DAYS_SHIFTED_MS)
}


/**
 * https://262.ecma-international.org/5.1/#sec-15.9.1.1
 * * ECMAScript Number values can represent all integers from –9,007,199,254,740,992 to 9,007,199,254,740,992
 * * The actual range of times supported by ECMAScript Date objects is slightly smaller: a range of +-8,640,000,000,000,000 milliseconds
 * -> this makes the element Id a string of between 1 and 17 number characters (the shiftDays are negligible)
 *
 * @param timestamp
 * @param shiftDays
 */
function createEventElementId(timestamp: number, shiftDays: number): string {
	return stringToCustomId(String(timestamp + shiftDays))
}

/**
 * the maximum id an event with a given start time could have based on its
 * randomization.
 * @param timestamp
 */
export function geEventElementMaxId(timestamp: number): string {
	return createEventElementId(timestamp, DAYS_SHIFTED_MS)
}

/**
 * the minimum an event with a given start time could have based on its
 * randomization.
 * @param timestamp
 */
export function getEventElementMinId(timestamp: number): string {
	return createEventElementId(timestamp, -DAYS_SHIFTED_MS)
}