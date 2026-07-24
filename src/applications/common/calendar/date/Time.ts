import { pad } from "@tutao/utils"
import { DateTime } from "luxon"
import { ProgrammingError } from "@tutao/app-env"

/**
 * A wrapper around time handling for the calendar stuff, mostly for the CalendarEventWhenModel
 */
export class Time {
	private _hour: number = 0
	private _minute: number = 0

	constructor(hour: number, minute: number) {
		this.hour = hour
		this.minute = minute
	}

	get hour() {
		return this._hour
	}

	private set hour(h: number) {
		const hour = Math.abs(h)
		this._hour = Math.floor(hour) % 24
	}

	get minute() {
		return this._minute
	}

	private set minute(m: number) {
		const minutes = Math.abs(m)
		this._minute = Math.floor(minutes) % 60
	}

	/**
	 * create a time by extracting hour and minute from a date object.
	 * @param date the date to extract the time from
	 * NOTE: all calculations are done in local time.
	 */
	static fromDate(date: Date): Time {
		return new Time(date.getHours(), date.getMinutes())
	}

	static fromDateTime({ hour, minute }: DateTime): Time {
		return new Time(hour, minute)
	}

	/**
	 * Accepts 2, 2:30, 2:5, 02:05, 02:30, 24:30, 2430, 12:30pm, 12:30 p.m.
	 */
	static parseFromString(timeString: string): Time | null {
		// Parse timeString using regex
		const regex = /^(?:(\d\d?):(\d\d?)|(\d\d?)(\d\d)?)\s*(?:([ap])(?:m|\.m\.))?$/i
		let matches = timeString.match(regex)
		if (!matches) {
			return null
		}
		const hoursMatch: string | undefined = matches[1] ?? matches[3]
		const minutesMatch: string | undefined = matches[2] ?? matches[4]
		const isAM = matches[5] === "a" || matches[5] === "A"
		const isPM = matches[5] === "p" || matches[5] === "P"
		const is12HourClock = isAM || isPM

		// Convert hours and minutes to integers
		let hours = parseInt(hoursMatch, 10)
		let minutes = minutesMatch ? parseInt(minutesMatch, 10) : 0
		if (!Number.isSafeInteger(hours) || !Number.isSafeInteger(minutes) || hours < 0 || minutes < 0) {
			throw new ProgrammingError(`Got unexpected hours match "${hoursMatch}" and/or minute match "${minutesMatch}" from regex = ${regex}!`)
		}

		// Return null if hours or minutes are invalid
		if (hours > 23 || (is12HourClock && hours > 12) || minutes > 59) {
			return null
		}

		// Convert 12-hour clock hours value to 24-hour clock value
		if (is12HourClock) {
			if (hours === 12) {
				hours = 0
			}
			if (isPM) {
				hours += 12
			}
		}

		return new Time(hours, minutes)
	}

	/**
	 * convert into a date
	 * if base date is set it will use the date values from that,
	 * otherwise it will use the current date.
	 *
	 * NOTE: calculations are done in the local time.
	 */
	toDate(baseDate?: Date): Date {
		const date = baseDate ? new Date(baseDate) : new Date()
		date.setHours(this._hour, this._minute)
		return date
	}

	toDateTime(baseDate: Date, zone: string): DateTime {
		return DateTime.fromJSDate(baseDate, { zone }).set({ hour: this._hour, minute: this._minute })
	}

	equals(otherTime: Time): boolean {
		return this._hour === otherTime._hour && this._minute === otherTime._minute
	}

	toString(amPmFormat?: { withAmPmSuffix: boolean }): string {
		return amPmFormat ? this.to12HourString(amPmFormat.withAmPmSuffix) : this.to24HourString()
	}

	to12HourString(withAmPmSuffix: boolean): string {
		const minutesString = pad(this._minute, 2)

		if (this._hour === 0) {
			return `12:${minutesString}${withAmPmSuffix ? " am" : ""}`
		} else if (this._hour === 12) {
			return `12:${minutesString}${withAmPmSuffix ? " pm" : ""}`
		} else if (this._hour > 12) {
			return `${this._hour - 12}:${minutesString}${withAmPmSuffix ? " pm" : ""}`
		} else {
			return `${this._hour}:${minutesString}${withAmPmSuffix ? " am" : ""}`
		}
	}

	to24HourString(): string {
		const hours = pad(this._hour, 2)
		const minutes = pad(this._minute, 2)
		return `${hours}:${minutes}`
	}

	toObject(): {
		hours: number
		minutes: number
	} {
		return {
			hours: this._hour,
			minutes: this._minute,
		}
	}

	asMinutes(): number {
		return this._hour * 60 + this._minute
	}

	/**
	 * Finds the forward difference in minutes from this time to timeB,
	 * in the range [0, 24*60-1]. Same times => 0.
	 * Examples:
	 *  - 23:30.diff(00:15) => 45
	 *  - 10:00.diff(09:00) => 1380
	 */
	diff(timeB: Time): number {
		const minutesA = this.asMinutes()
		const minutesB = timeB.asMinutes()
		const day = 24 * 60
		return (minutesB - minutesA + day) % day
	}

	/**
	 * In place addition operation.
	 *
	 * Adds hours and/or minutes to the current time instance.
	 *
	 * @param {Object} param - Adjustment parameters.
	 * @param {number} [param.hours=0] - Hours to add (optional, defaults to 0).
	 * @param {number} [param.minutes=0] - Minutes to add (optional, defaults to 0).
	 * @returns {this} The same instance after adding the time.
	 */
	add(param: { hours?: number; minutes?: number }) {
		const totalMinutes = this._minute + (param.minutes ?? 0)
		this.minute = totalMinutes % 60

		let restHours = totalMinutes / 60
		this.hour = this._hour + (param.hours ?? 0) + restHours
		return this
	}

	/**
	 * In place subtract operation.
	 *
	 * Subtract hours and/or minutes to the current time instance.
	 *
	 * @param {Object} param - Adjustment parameters.
	 * @param {number} [param.hours=0] - Hours to subtract (optional, defaults to 0).
	 * @param {number} [param.minutes=0] - Minutes to subtract (optional, defaults to 0).
	 * @returns {this} The same instance after subtracting the time.
	 */
	sub(param: { hours?: number; minutes?: number }) {
		const totalMinutes = this._minute - (param.minutes ?? 0)
		this.minute = totalMinutes < 0 ? 60 + (totalMinutes % 60) : totalMinutes

		// We need to borrow one hour so we need to subtract this borrowed hour from the total
		const minutesCorrectionFactor = totalMinutes % 60 !== 0 && totalMinutes < 0 ? 1 : 0
		const restHoursToSubtract = Math.floor(Math.abs(totalMinutes / 60))
		const newHour = this._hour - (param.hours ?? 0) - restHoursToSubtract - minutesCorrectionFactor

		this.hour = newHour < 0 ? 24 + (newHour % 24) : newHour

		return this
	}

	/*
	 * Checks if this is after {@link param}
	 *
	 * @param {Time} timeB - Time to compare this with
	 * @returns {boolean} Whether this is after or not timeB
	 */
	isAfter(timeB: Time) {
		return this.asMinutes() > timeB.asMinutes()
	}

	/*
	 * Checks if this is before {@link param}
	 *
	 * @param {Time} timeB - Time to compare this with
	 * @returns {boolean} Whether this is before or not timeB
	 */
	isBefore(timeB: Time) {
		return this.asMinutes() < timeB.asMinutes()
	}

	static fromMinutes(minutes: number) {
		const hour = minutes / 60
		const restMinutes = minutes % 60
		return new Time(hour, restMinutes)
	}
}
