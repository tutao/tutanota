import { DAY_IN_MILLIS } from "@tutao/tutanota-utils"
import type { CalendarEvent } from "../../entities/tutanota/TypeRefs.js"
import { EncryptedMailAddress } from "../../entities/tutanota/TypeRefs.js"
import { stringToCustomId } from "./EntityUtils"
import type { AlarmInterval } from "../../../calendar/date/CalendarUtils.js"

export type CalendarEventTimes = Pick<CalendarEvent, "startTime" | "endTime">

/**
 * the time in ms that element ids for calendar events and alarms  get randomized by
 */
export const DAYS_SHIFTED_MS = 15 * DAY_IN_MILLIS

/*
 * convenience wrapper for isAllDayEventByTimes
 */
export function isAllDayEvent({ startTime, endTime }: CalendarEventTimes): boolean {
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
 * exported for testing
 * @param timestamp
 * @param shiftDays
 */
export function createEventElementId(timestamp: number, shiftDays: number): string {
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

/**
 * return a cleaned and comparable version of a mail address without leading/trailing whitespace or uppercase characters.
 */
export function cleanMailAddress(address: string): string {
	return address.trim().toLowerCase()
}

/**
 * get the first attendee from the list of attendees/guests that corresponds to one of the given recipient addresses, if there is one
 */
export function findAttendeeInAddresses<T extends { address: EncryptedMailAddress }>(attendees: ReadonlyArray<T>, addresses: ReadonlyArray<string>): T | null {
	// the filters are necessary because of #5147
	// we may get passed addresses and attendees that could not be decrypted and don't have addresses.
	const lowerCaseAddresses = addresses.filter(Boolean).map(cleanMailAddress)
	return attendees.find((a) => a.address.address != null && lowerCaseAddresses.includes(cleanMailAddress(a.address.address))) ?? null
}

/**
 * find the first of a list of recipients that have the given address assigned
 */
export function findRecipientWithAddress<T extends { address: string }>(recipients: ReadonlyArray<T>, address: string): T | null {
	const cleanAddress = cleanMailAddress(address)
	return recipients.find((r) => cleanMailAddress(r.address) === cleanAddress) ?? null
}

/**
 * get a date with the time set to the start of the next full half hour from the time this is called at
 * */
export function getNextHalfHour(): Date {
	let date: Date = new Date()

	return setNextHalfHour(date)
}

/**
 * set the given date to the start of the next full half hour from the time this is called at
 * */
export function setNextHalfHour(date: Date): Date {
	const timeNow = new Date()

	if (timeNow.getMinutes() > 30) {
		date.setHours(timeNow.getHours() + 1, 0)
	} else {
		date.setHours(timeNow.getHours(), 30)
	}

	return date
}

/**
 * get a partial calendar event with start time set to the passed value
 * (year, day, hours and minutes. seconds and milliseconds are zeroed.)
 * and an end time 30 minutes later than that.
 * @param startDate the start time to use for the event (defaults to the next full half hour)
 */
export function getEventWithDefaultTimes(startDate: Date = getNextHalfHour()): CalendarEventTimes {
	let endDate = new Date(startDate)
	return {
		startTime: new Date(startDate),
		endTime: new Date(endDate.setMinutes(endDate.getMinutes() + 30)),
	}
}

/**
 * Converts runtime representation of an alarm into a db one.
 */
export function serializeAlarmInterval(interval: AlarmInterval): string {
	return `${interval.value}${interval.unit}`
}

export enum CalendarViewType {
	DAY = "day",
	WEEK = "week",
	MONTH = "month",
	AGENDA = "agenda",
}
