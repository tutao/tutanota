// @flow


import {pad} from "@tutao/tutanota-utils"
import type {DateTime} from "luxon"

/**
 * A wrapper around time handling for the calendar stuff, mostly for the CalendarEventViewModel
 */
export class Time {

	+hours: number
	+minutes: number

	constructor(hours: number, minutes: number) {
		this.hours = Math.floor(hours) % 24
		this.minutes = Math.floor(minutes) % 60
	}

	static fromDate(date: Date): Time {
		return new Time(date.getHours(), date.getMinutes())
	}

	static fromDateTime({hour, minute}: DateTime): Time {
		return new Time(hour, minute)
	}


	/**
	 * convert into a date
	 * if base date is set it will use the date values from that,
	 * otherwise it will use the current date
	 */
	toDate(baseDate?: Date): Date {
		const date = baseDate ? new Date(baseDate) : new Date()
		date.setHours(this.hours)
		date.setMinutes(this.minutes)
		return date
	}

	equals(otherTime: Time): boolean {
		return this.hours === otherTime.hours && this.minutes === otherTime.minutes
	}

	toString(amPmFormat: boolean): string {
		return amPmFormat ? this.to12HourString() : this.to24HourString()
	}

	to12HourString(): string {
		const minutesString = pad(this.minutes, 2)
		if (this.hours === 0) {
			return `12:${minutesString} am`
		} else if (this.hours === 12) {
			return `12:${minutesString} pm`
		} else if (this.hours > 12) {
			return `${this.hours - 12}:${minutesString} pm`
		} else {
			return `${this.hours}:${minutesString} am`
		}
	}

	to24HourString(): string {
		const hours = pad(this.hours, 2)
		const minutes = pad(this.minutes, 2)
		return `${hours}:${minutes}`
	}

	toObject(): {hours: number, minutes: number} {
		return {
			hours: this.hours,
			minutes: this.minutes
		}
	}
}