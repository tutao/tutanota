import { pad } from "@tutao/tutanota-utils"
import { DateTime } from "luxon"

/**
 * A wrapper around time handling for the calendar stuff, mostly for the CalendarEventWhenModel
 */
export class Time {
	readonly hour: number
	readonly minute: number

	constructor(hour: number, minute: number) {
		this.hour = Math.floor(hour) % 24
		this.minute = Math.floor(minute) % 60
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
					hours = parseInt(digits.substr(0, digits.length - 2), 10)
					minutes = parseInt(digits.substr(-2, 2), 10)
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
		date.setHours(this.hour)
		date.setMinutes(this.minute)
		date.setSeconds(0)
		date.setMilliseconds(0)
		return date
	}

	toDateTime(baseDate: Date, zone: string): DateTime {
		return DateTime.fromJSDate(baseDate, { zone }).set(this)
	}

	equals(otherTime: Time): boolean {
		return this.hour === otherTime.hour && this.minute === otherTime.minute
	}

	toString(amPmFormat: boolean): string {
		return amPmFormat ? this.to12HourString() : this.to24HourString()
	}

	to12HourString(): string {
		const minutesString = pad(this.minute, 2)

		if (this.hour === 0) {
			return `12:${minutesString} am`
		} else if (this.hour === 12) {
			return `12:${minutesString} pm`
		} else if (this.hour > 12) {
			return `${this.hour - 12}:${minutesString} pm`
		} else {
			return `${this.hour}:${minutesString} am`
		}
	}

	to24HourString(): string {
		const hours = pad(this.hour, 2)
		const minutes = pad(this.minute, 2)
		return `${hours}:${minutes}`
	}

	toObject(): {
		hours: number
		minutes: number
	} {
		return {
			hours: this.hour,
			minutes: this.minute,
		}
	}
}
