// @flow

import {AlarmInterval, EndType, RepeatPeriod} from "../api/common/TutanotaConstants"

export const MAX_SAFE_DATE = 8640000000000000
export const MAX_SAFE_DELAY = 2147483647
export const TRIGGER_TIMES_IN_MS = {
	[AlarmInterval.FIVE_MINUTES]: 1000 * 60 * 5,
	[AlarmInterval.TEN_MINUTES]: 1000 * 60 * 10,
	[AlarmInterval.THIRTY_MINUTES]: 1000 * 60 * 30,
	[AlarmInterval.ONE_HOUR]: 1000 * 60 * 60,
	[AlarmInterval.ONE_DAY]: 1000 * 60 * 60 * 24,
	[AlarmInterval.TWO_DAYS]: 1000 * 60 * 60 * 24 * 2,
	[AlarmInterval.THREE_DAYS]: 1000 * 60 * 60 * 24 * 3,
	[AlarmInterval.ONE_WEEK]: 1000 * 60 * 60 * 24 * 7,
}

export function scheduleAction(what: Function, when: number): TimeoutID {
	return setTimeout(what, when)
}

export function scheduleInterval(what: Function, interval: number): IntervalID {
	return setInterval(what, interval)
}

export function doAsync(what: Function): Object {
	return setImmediate(what)
}

/**
 * yield event occurrences according to the repeatRule contained in the AlarmNotification
 */
export function occurrenceIterator() {
	let maxOccurrences: number = 1
	let lastOccurrenceDate: Date = new Date(MAX_SAFE_DATE)
	let occurrenceIncrement = null
	let occurrenceInterval = null
	let firstOccurrence: Date = this.eventStart

	if (this.repeatRule) {
		if (this.repeatRule.endType === EndType.Never) {
			maxOccurrences = Infinity
		} else if (this.repeatRule.endType === EndType.Count) {
			maxOccurrences = this.repeatRule.endValue
		} else if (this.repeatRule.endType === EndType.UntilDate) {
			maxOccurrences = Infinity
			lastOccurrenceDate = new Date(parseInt(this.repeatRule.endValue))
		}
		occurrenceIncrement = this.repeatRule.frequency
		occurrenceInterval = parseInt(this.repeatRule.interval)
	}

	return {
		maxOccurrences,
		lastOccurrenceDate,
		occurrenceIncrement,
		occurrenceInterval,
		numYieldedOccurrences: 1,
		lastYieldedOccurrence: null,
		nextYieldedOccurrence: firstOccurrence,

		next: function () {
			let newOccurrence
			if (this.numYieldedOccurrences < maxOccurrences && !!this.nextYieldedOccurrence) {
				newOccurrence = new Date(this.nextYieldedOccurrence.getTime())
				switch (this.occurrenceIncrement) {
					case RepeatPeriod.DAILY:
						newOccurrence.setDate(newOccurrence.getDate() + this.occurrenceInterval)
						break
					case RepeatPeriod.WEEKLY:
						newOccurrence.setDate(newOccurrence.getDate() + this.occurrenceInterval * 7)
						break
					case RepeatPeriod.MONTHLY:
						newOccurrence.setMonth(newOccurrence.getMonth() + this.occurrenceInterval)
						break
					case RepeatPeriod.ANNUALLY:
						newOccurrence.setFullYear(newOccurrence.getFullYear() + this.occurrenceInterval)
						break
				}

				if (newOccurrence > this.lastOccurrenceDate) {
					newOccurrence = undefined
				}
			}

			this.lastYieldedOccurrence = this.nextYieldedOccurrence
			this.nextYieldedOccurrence = newOccurrence
			this.numYieldedOccurrences += 1
			return {value: this.lastYieldedOccurrence, done: !this.lastYieldedOccurrence}
		}
	}
}