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

	static fromDateTime({ hour, minute }: { hour: number; minute: number }): Time {
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
		const hourMatch: string | undefined = matches[1] ?? matches[3]
		const minuteMatch: string | undefined = matches[2] ?? matches[4]
		const isAm = matches[5] === "a" || matches[5] === "A"
		const isPm = matches[5] === "p" || matches[5] === "P"
		const is12HourClock = isAm || isPm

		// Convert hours and minutes to integers
		let hour = parseInt(hourMatch, 10)
		let minute = minuteMatch ? parseInt(minuteMatch, 10) : 0
		if (!Number.isSafeInteger(hour) || !Number.isSafeInteger(minute) || hour < 0 || minute < 0) {
			throw new ProgrammingError(`Got unexpected hours match "${hourMatch}" and/or minute match "${minuteMatch}" from regex = ${regex}!`)
		}

		// Return null if hours or minutes are invalid
		if (hour > 23 || (is12HourClock && hour > 12) || minute > 59) {
			return null
		}

		if (is12HourClock) {
			hour = Time.convert12HourClockHourTo24HourClock(hour, isPm)
		}

		return new Time(hour, minute)
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

	equals(otherTime: Time): boolean {
		return this._hour === otherTime._hour && this._minute === otherTime._minute
	}

	to12HourString(withAmPmSuffix: boolean): string {
		let result = this.hourTo12HourClock().toString() + ":"
		if (this._minute < 10) {
			result += "0"
		}
		result += this._minute.toString()
		if (withAmPmSuffix) {
			result += this.isHourPm() ? " pm" : " am"
		}
		return result
	}

	to24HourString(): string {
		let result = ""
		if (this._hour < 10) {
			result += "0"
		}
		result += this._hour.toString() + ":"
		if (this._minute < 10) {
			result += "0"
		}
		return result + this._minute.toString()
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

	/** Returns true if this time is equal to otherTime. */
	isEqual(otherTime: Time) {
		return this._hour === otherTime._hour && this._minute === otherTime._minute
	}

	/**
	 * Checks if this is after {@link param}
	 *
	 * @param timeB - Time to compare this with
	 * @returns Whether this is after or not timeB
	 */
	isAfter(timeB: Time): boolean {
		return this.asMinutes() > timeB.asMinutes()
	}

	/**
	 * Checks if this is before {@link param}
	 *
	 * @param timeB - Time to compare this with
	 * @returns Whether this is before or not timeB
	 */
	isBefore(timeB: Time): boolean {
		return this.asMinutes() < timeB.asMinutes()
	}

	static fromMinutes(minutes: number) {
		const hour = minutes / 60
		const restMinutes = minutes % 60
		return new Time(hour, restMinutes)
	}

	private isHourPm() {
		return this._hour >= 12
	}

	private hourTo12HourClock(): number {
		let hour = this._hour
		if (this.isHourPm()) {
			hour -= 12
		}
		if (hour === 0) {
			hour = 12
		}
		return hour
	}

	private static convert12HourClockHourTo24HourClock(hour: number, isPm: boolean) {
		if (hour === 12) {
			hour = 0
		}
		if (isPm) {
			hour += 12
		}
		return hour
	}
}
