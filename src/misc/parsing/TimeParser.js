// @flow


import {Time} from "../../api/common/utils/Time"

/**
 * Accepts 2, 2:30, 2:5, 02:05, 02:30, 24:30, 2430, 12:30pm, 12:30 p.m.
 */
export function parseTime(timeString: string): ?Time {
	let suffix  // am/pm indicator or undefined
	let hours   // numeric hours
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