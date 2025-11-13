import { pad } from "@tutao/tutanota-utils"
import { DateTime } from "luxon"

/**
 * A wrapper around time handling for the calendar stuff, mostly for the CalendarEventWhenModel
 */
export class Time {
	private _hour: number = 0
	private _minute: number = 0

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

	constructor(hour: number, minute: number) {
		this.hour = hour
		this.minute = minute
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
		let suffix // am/pm indicator or undefined

		let hours // numeric hours

		let minutes // numeric minutes

		// See if the time includes a colon separating hh:mm
		let mt = timeString.match(/^(\d{1,2}):(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)?$/i)

		if (mt != null) {
			suffix = mt[3]
			hours = parseInt(mt[1], 10)
			minutes = parseInt(mt[2], 10)
		} else {
			// Interpret 127am as 1:27am or 2311 as 11:11pm, e.g.
			mt = timeString.match(/^(\d{1,4})\s*(am|pm|a\.m\.|p\.m\.)?$/i)

			if (mt != null) {
				suffix = mt[2]
				const digits = mt[1]

				// Hours only?
				if (digits.length <= 2) {
					hours = parseInt(digits, 10)
					minutes = 0
				} else {
					hours = parseInt(digits.substring(0, digits.length - 2), 10)
					minutes = parseInt(digits.slice(-2), 10)
				}
			} else {
				return null
			}
		}

		if (isNaN(hours) || isNaN(minutes) || minutes > 59) {
			return null
		}

		if (suffix) {
			suffix = suffix.toUpperCase()
		}

		if (suffix === "PM" || suffix === "P.M.") {
			if (hours > 12) return null
			if (hours !== 12) hours = hours + 12
		} else if (suffix === "AM" || suffix === "A.M.") {
			if (hours > 12) return null
			if (hours === 12) hours = 0
		} else if (hours > 23) {
			return null
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

	toString(amPmFormat: boolean): string {
		return amPmFormat ? this.to12HourString() : this.to24HourString()
	}

	to12HourString(): string {
		const minutesString = pad(this._minute, 2)

		if (this._hour === 0) {
			return `12:${minutesString} am`
		} else if (this._hour === 12) {
			return `12:${minutesString} pm`
		} else if (this._hour > 12) {
			return `${this._hour - 12}:${minutesString} pm`
		} else {
			return `${this._hour}:${minutesString} am`
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
	 * Finds the difference in minutes between this and the param.
	 * @param timeB
	 */
	diff(timeB: Time) {
		const timeBAsMinutes = timeB.asMinutes() === 0 ? 24 * 60 : timeB.asMinutes()
		const timeAAsMinutes = this.asMinutes()
		return timeAAsMinutes > timeBAsMinutes ? 24 * 60 - timeAAsMinutes + timeBAsMinutes : timeBAsMinutes - timeAAsMinutes
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
