import {
	AdvancedRepeatRuleParams,
	CalendarEventAttendee,
	createCalendarEventAttendee,
	createEncryptedMailAddress,
	EncryptedMailAddress,
	EncryptedMailAddressParams,
} from "@tutao/entities/tutanota"
import { CalendarAttendeeStatus, CalendarMethod } from "../../../../entities/tutanota/Utils"
import {
	CalendarAdvancedRepeatRule,
	createCalendarAdvancedRepeatRule,
	createDateWrapper,
	createRepeatRule,
	DateWrapper,
	DateWrapperParams,
	RepeatRule,
} from "@tutao/entities/sys"
import { filterInt, isMailAddress, neverNull, utf8Uint8ArrayToString } from "@tutao/utils"
import { DateTime, Duration } from "luxon"
import type { Parser } from "../../../common/misc/parsing/ParserCombinator"
import {
	combineParsers,
	makeCharacterParser,
	makeEitherParser,
	makeSeparatedByParser,
	mapParser,
	maybeParse,
	numberParser,
	ParserError,
	StringIterator,
} from "../../../common/misc/parsing/ParserCombinator"
import { EndType, ProgrammingError, RepeatPeriod, TimeConstants } from "@tutao/app-env"
import { reverse } from "../../../common/misc/EnumUtils"
import { AlarmInterval, AlarmIntervalUnit, ByRule, daysInMonth, getTimeZone } from "../../../common/calendar/date/CalendarUtils.js"
import { AlarmInfoTemplate } from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import { serializeAlarmInterval } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { DataFile } from "../../../../entities/tutanota/MailBundle"
import { availableIANATimeZones, windowsToIANATimeZones } from "../../../common/calendar/TimeZoneData"

const TAG = "[CalendarParser]"

type PropertyParamValue = string
type Property = {
	name: string
	params: Record<string, PropertyParamValue>
	value: string
}
type ICalObject = {
	type: string
	properties: Array<Property>
	children: Array<ICalObject>
}

/**
 * This type is based on {@link CalendarEvent} and should have the basic values to create one using values
 * from an ics file
 */
export type IcsCalendarEvent = {
	summary: string
	description: string
	startTime: Date
	endTime: Date
	location: string
	uid: string
	sequence: NumberString
	recurrenceId: null | Date
	repeatRule: StrippedRepeatRule | null
	attendees: Array<StrippedCalendarEventAttendee> | null
	organizer: EncryptedMailAddressParams | null
	startTimeZone: string | null
	endTimeZone: string | null
}
export type ParsedEventAlarmTuple = {
	icsCalendarEvent: IcsCalendarEvent
	alarms: Array<AlarmInfoTemplate>
}
export type ParsedCalendarData = {
	method: string
	contents: ParsedEventAlarmTuple[]
	parseEventErrors: ParserError[]
}
export type StrippedCalendarEventAttendee = {
	status: NumberString
	address: EncryptedMailAddressParams
}

export type StrippedRepeatRule = {
	frequency: NumberString
	endType: NumberString
	endValue: null | NumberString
	interval: NumberString
	timeZone: string

	excludedDates: DateWrapperParams[]
	advancedRules: AdvancedRepeatRuleParams[]
}

type ICalDuration = {
	positive: boolean
	day?: number
	week?: number
	hour?: number
	minute?: number
}

/**
 * Set of character codes needed during iCal parsing.
 *
 * By default, TypeScript inlines const enum members, if this is also the case with our config,
 * using these enum members should be efficient.
 */
const enum CharCode {
	// See ascii manpage: Run `man 7 ascii` in terminal
	tab = 0x09,
	verticalTab = 0x0b,
	space = 0x20,
	comma = 0x2c,
	minus = 0x2d,
	zero = 0x30,
	nine = 0x39,
	semicolon = 0x3b,
	equals = 0x3d,
	A = 0x41,
	T = 0x54,
	Z = 0x5a,
	underscore = 0x5f,
	a = 0x61,
	z = 0x7a,
}

/**
 * Bit-flags for terminators needed during iCal parsing that can be combined to a bit-set using binary or `|`.
 *
 * @VisibleForTesting
 */
export const enum Terminator {
	endOfString = 1,
	semicolon = 2,
	comma = 4,
}

function terminatorToString(terminator: Terminator): string {
	switch (terminator) {
		case Terminator.endOfString:
			return "END OF STRING"
		case Terminator.semicolon:
			return "';'"
		case Terminator.comma:
			return "','"
		default:
			return `INVALID TERMINATOR=${terminator}`
	}
}

function terminatorBitSetToString(terminatorBitSet: Terminator): string {
	let result = ""
	for (let i = 0; i < 32; ++i) {
		const bit = (1 << i) & 1
		if (bit === Terminator.endOfString || bit === Terminator.semicolon || bit === Terminator.comma) {
			if (result !== "") {
				result += ", "
			}
			result += terminatorToString(bit)
		}
	}
	return result
}

function matchTerminatorAt(str: string, offset: number, terminatorBitSet: Terminator): Terminator | 0 {
	if (offset >= str.length) {
		return terminatorBitSet & Terminator.endOfString
	}
	switch (str.charCodeAt(offset)) {
		case CharCode.semicolon:
			return terminatorBitSet & Terminator.semicolon
		case CharCode.comma:
			return terminatorBitSet & Terminator.comma
		default:
			return 0
	}
}

function findNextTerminator(str: string, offset: number, terminatorBitSet: Terminator): [Terminator | 0, number] {
	let terminator: Terminator | 0 = 0
	for (; terminator === 0 && offset <= str.length; ++offset) {
		terminator = matchTerminatorAt(str, offset, terminatorBitSet)
	}
	return [terminator, offset - 1]
}

function getProp(obj: ICalObject, tag: string, optional: false): Property
function getProp(obj: ICalObject, tag: string, optional: true): Property | null | undefined
function getProp(obj: ICalObject, tag: string, optional: boolean): Property | null | undefined
function getProp(obj: ICalObject, tag: string, optional: boolean): Property | null | undefined {
	const prop = obj.properties.find((p) => p.name === tag)
	if (!optional && prop == null) throw new ParserError(`Missing prop ${tag}`)
	return prop
}

function getPropStringValue(obj: ICalObject, tag: string, optional: false): string
function getPropStringValue(obj: ICalObject, tag: string, optional: true): string | null | undefined
function getPropStringValue(obj: ICalObject, tag: string, optional: boolean): string | null | undefined {
	const prop = getProp(obj, tag, optional)
	if (!optional && typeof prop?.value !== "string") throw new ParserError(`value of ${tag} is not of type string, got ${JSON.stringify(prop)}`)
	return prop?.value
}

// Left side of the semicolon
const parameterStringValueParser: Parser<string> = (iterator) => {
	let value = ""

	let next
	while ((next = iterator.peek()) && /[:;,]/.test(next) === false) {
		value += neverNull(iterator.next().value)
	}

	return value
}

const escapedStringValueParser: Parser<string> = (iterator: StringIterator) => {
	if (iterator.next().value !== '"') {
		throw new ParserError("Not a quoted value")
	}

	let value = ""

	while (iterator.peek() && iterator.peek() !== '"') {
		value += neverNull(iterator.next().value)
	}

	if (!(iterator.peek() === '"')) {
		throw new Error("Not a quoted value, does not end with quote: " + value)
	}

	iterator.next()
	return value
}

const propertyParametersKeyValueParser: Parser<[string, string, string]> = combineParsers(
	parsePropertyNameCombinator,
	makeCharacterParser("="),
	makeEitherParser(escapedStringValueParser, parameterStringValueParser),
)

const parsePropertyParameters = combineParsers(
	makeCharacterParser(";"),
	makeSeparatedByParser(/*separator*/ makeCharacterParser(";"), /*value*/ propertyParametersKeyValueParser),
)

// make sure the slashes are _always_ replaced first
// unless you're using an actual parser for this.
// otherwise we get fun stuff like ";\" -> "\;\" -> "\\;\\"
// instead of ";\" -> ";\\" -> "\;\\"
export const iCalReplacements = {
	"\\": "\\\\",
	";": "\\;",
	",": "\\,",
	"\n": "\\n",
}

const revICalReplacements = reverse(iCalReplacements)

// Right side of the semicolon

/**
 * Parses everything until the end of the string and unescapes what it should
 */
const anyStringUnescapeParser: Parser<string> = (iterator) => {
	let value = ""
	let lastCharacter: string | null = null

	while (iterator.peek()) {
		lastCharacter = iterator.next().value

		if (lastCharacter === "\\") {
			const next = iterator.peek()
			if (next != null && next in iCalReplacements) {
				continue
			} else if (iterator.peek() === "n") {
				iterator.next()
				value += "\n"
				continue
			}
		}

		value += neverNull(lastCharacter)
	}

	return value
}

/**
 * Parses the whole property (both sides)
 */
export const propertySequenceParser: Parser<[string, [string, Array<[string, string, string]>] | null, string, string]> = combineParsers(
	parsePropertyNameCombinator,
	maybeParse(parsePropertyParameters),
	makeCharacterParser(":"),
	anyStringUnescapeParser,
)

export function parseProperty(data: string): Property | null {
	try {
		const sequence = propertySequenceParser(new StringIterator(data))
		const name = sequence[0]
		const params: Record<string, string> = {}

		if (sequence[1]) {
			for (const [name, _eq, value] of sequence[1][1]) {
				params[name] = value
			}
		}

		const value = sequence[3]
		return {
			name,
			params,
			value,
		}
	} catch (e) {
		return null // Returning null to avoid raising parser errors so we can ignore the current broken data/property
	}
}

function parseIcalObject(tag: string, iterator: Iterator<string>): ICalObject {
	let iteration = iterator.next()
	let properties: Property[] = []
	let children: ICalObject[] = []

	while (!iteration.done && iteration.value) {
		const property = parseProperty(iteration.value)

		if (!property) {
			// Ignoring broken properties, if there is any mandatory properties missing the function getContents will raise an error later
			iteration = iterator.next()
			continue
		}

		if (property.name === "END" && property.value === tag) {
			return {
				type: tag,
				properties,
				children,
			}
		}

		if (property.name === "BEGIN") {
			if (typeof property.value !== "string") throw new ParserError("BEGIN with array value")
			children.push(parseIcalObject(property.value, iterator))
		} else {
			properties.push(property)
		}

		iteration = iterator.next()
	}

	throw new ParserError("no end for tag " + tag)
}

export function parseICalendar(stringData: string): ICalObject {
	const withFoldedLines = stringData
		.replace(/\r?\n[ \t]/g, "")
		.split(/\r?\n/)
		.filter((e) => e !== "")
	const iterator = withFoldedLines.values()
	const firstLine = iterator.next()

	if (firstLine.value !== "BEGIN:VCALENDAR") {
		throw new ParserError("Not a VCALENDAR: " + String(firstLine.value))
	}

	return parseIcalObject("VCALENDAR", iterator)
}

function parseAlarm(alarmObject: ICalObject, startTime: Date): AlarmInfoTemplate | null {
	const triggerValue = getPropStringValue(alarmObject, "TRIGGER", false)
	const alarmInterval: AlarmInterval | null = triggerToAlarmInterval(startTime, triggerValue)
	return alarmInterval != null
		? {
				trigger: serializeAlarmInterval(alarmInterval),
				alarmIdentifier: "",
			}
		: null
}

/** visible for testing */
export function triggerToAlarmInterval(eventStart: Date, triggerValue: string): AlarmInterval | null {
	// Absolute time
	if (triggerValue.endsWith("Z")) {
		const dtParseResult = parseDateTime(triggerValue, 0, Terminator.endOfString)
		if (!dtParseResult.hasZSuffix) {
			throw new ProgrammingError(`triggerValue=${triggerValue} ends with Z but parseDateTime result has hasZSuffix===false!`)
		}
		const triggerTime = jsDateFromDateTimeParseResult(dtParseResult, "UTC")
		const tillEvent = eventStart.getTime() - triggerTime.getTime()
		// For absolute time we just convert the trigger to minutes. There might be a bigger unit that can express it but we don't have to take care about time
		// zones or daylight saving in this case and it's simpler this way.
		const minutes = Duration.fromMillis(tillEvent).as("minutes")
		return { unit: AlarmIntervalUnit.MINUTE, value: minutes }
	} else {
		// If we have relative trigger expressed in units we want to find the smallest unit that will fit. Unlike iCal we do not support multiple units so
		// we have to pick one.
		const duration = parseDuration(triggerValue)

		if (duration.positive) {
			return null
		}

		let smallestUnit: AlarmIntervalUnit = AlarmIntervalUnit.MINUTE
		if (duration.week) {
			smallestUnit = AlarmIntervalUnit.WEEK
		}
		if (duration.day) {
			smallestUnit = AlarmIntervalUnit.DAY
		}
		if (duration.hour) {
			smallestUnit = AlarmIntervalUnit.HOUR
		}
		if (duration.minute) {
			smallestUnit = AlarmIntervalUnit.MINUTE
		}
		const luxonDuration = { week: duration.week, day: duration.day, minute: duration.minute, hour: duration.hour }
		let value
		switch (smallestUnit) {
			case AlarmIntervalUnit.WEEK:
				value = Duration.fromObject(luxonDuration).as("weeks")
				break
			case AlarmIntervalUnit.DAY:
				value = Duration.fromObject(luxonDuration).as("days")
				break
			case AlarmIntervalUnit.HOUR:
				value = Duration.fromObject(luxonDuration).as("hours")
				break
			case AlarmIntervalUnit.MINUTE:
				value = Duration.fromObject(luxonDuration).as("minutes")
				break
		}
		return { unit: smallestUnit, value }
	}
}

export function parseRrule(rawRruleValue: string, startTzId: string | null): RepeatRule {
	let frequency: RepeatPeriod | null = null
	let until: Date | null = null
	let count: number | null = null
	let interval: number | null = null
	const advancedRepeatRules: CalendarAdvancedRepeatRule[] = []

	let offset = 0
	let i = 0
	const MAX_COMPONENTS = 1000
	try {
		while (i < MAX_COMPONENTS) {
			const propertyName = parsePropertyName(rawRruleValue, offset)
			offset += propertyName.length
			if (offset >= rawRruleValue.length || rawRruleValue.charCodeAt(offset) !== CharCode.equals) {
				throw new ParserError(`Expected equals "=" after RRULE property name "${propertyName}"!`)
			}
			++offset

			let advancedByRule: ByRule | null = null
			let terminator: Terminator | ParseIntError = Terminator.endOfString
			let end: number
			switch (propertyName) {
				case "FREQ":
					;[terminator, end] = findNextTerminator(rawRruleValue, offset, Terminator.semicolon | Terminator.endOfString)
					frequency = icalFrequencyToRepeatPeriod(rawRruleValue.slice(offset, end))
					offset = end
					break
				case "UNTIL":
					;[terminator, end] = findNextTerminator(rawRruleValue, offset, Terminator.semicolon | Terminator.endOfString)
					until = parseUntilRruleTime(rawRruleValue.slice(offset, end), startTzId)
					offset = end
					break
				case "COUNT":
					;[terminator, count, offset] = parsePositiveInt(rawRruleValue, offset, 1, null, Terminator.semicolon | Terminator.endOfString)
					if (terminator < 0) {
						throw new ParserError("Invalid COUNT value!")
					}
					break
				case "INTERVAL":
					;[terminator, interval, offset] = parsePositiveInt(rawRruleValue, offset, 1, null, Terminator.semicolon | Terminator.endOfString)
					if (terminator < 0) {
						throw new ParserError("Invalid INTERVAL value!")
					}
					break

				case "BYMINUTE":
					advancedByRule = ByRule.BYMINUTE
					break
				case "BYHOUR":
					advancedByRule = ByRule.BYHOUR
					break
				case "BYDAY":
					advancedByRule = ByRule.BYDAY
					break
				case "BYMONTHDAY":
					advancedByRule = ByRule.BYMONTHDAY
					break
				case "BYYEARDAY":
					advancedByRule = ByRule.BYYEARDAY
					break
				case "BYWEEKNO":
					advancedByRule = ByRule.BYWEEKNO
					break
				case "BYMONTH":
					advancedByRule = ByRule.BYMONTH
					break
				case "BYSETPOS":
					advancedByRule = ByRule.BYSETPOS
					break
				case "WKST":
					advancedByRule = ByRule.WKST
					break
				default:
					;[terminator, end] = findNextTerminator(rawRruleValue, offset, Terminator.semicolon | Terminator.endOfString)
					console.warn(`${TAG} Ignoring unhandled RRULE property: ${propertyName}=${rawRruleValue.slice(offset, end)}!`)
					offset = end
					break
			}

			if (advancedByRule) {
				while (offset <= rawRruleValue.length) {
					;[terminator, end] = findNextTerminator(rawRruleValue, offset, Terminator.comma | Terminator.semicolon | Terminator.endOfString)
					if (end === offset) {
						console.warn(`${TAG} Ignoring empty advanced RRULE property ${propertyName}!`)
					} else {
						advancedRepeatRules.push(
							createCalendarAdvancedRepeatRule({
								ruleType: advancedByRule,
								interval: rawRruleValue.slice(offset, end),
							}),
						)
						offset = end
					}
					if (terminator === Terminator.comma) {
						++offset
					} else {
						break
					}
				}
			}

			if (terminator === Terminator.endOfString) {
				break
			} else if (terminator !== Terminator.semicolon) {
				throw new ParserError(`RRule "${propertyName}" has invalid value!`)
			}
			++offset

			++i
		}
	} catch (e) {
		if (e instanceof ParserError) {
			throw new ParserError(`Invalid RRULE:${rawRruleValue}: ` + e.message)
		} else {
			throw e
		}
	}
	if (i >= MAX_COMPONENTS) {
		throw new ParserError(
			`RRULE="${rawRruleValue.slice(0, 100)}..." too contains more than ${MAX_COMPONENTS} components: it's too complex, erroneous or malicious!`,
		)
	}

	if (frequency === null) {
		throw new ParserError(`RRULE=${rawRruleValue} missing FREQ!`)
	}

	const endType: EndType = until != null ? EndType.UntilDate : count != null ? EndType.Count : EndType.Never
	const repeatRule = createRepeatRule({
		endValue: until ? String(until.getTime()) : count ? String(count) : null,
		endType: endType,
		interval: interval ? interval.toString() : "1",
		frequency: frequency,
		excludedDates: [],
		timeZone: "",
		advancedRules: advancedRepeatRules,
	})

	if (typeof startTzId === "string") {
		repeatRule.timeZone = startTzId
	}

	return repeatRule
}

export function parseExDates(excludedDatesProps: Property[]): DateWrapper[] {
	const exclusionDates: Date[] = []
	for (let excludedDatesProp of excludedDatesProps) {
		const str = excludedDatesProp.value
		// Skip EXDATE props with empty values
		if (str.length === 0) {
			continue
		}
		const tzId: string | null = getTzId(excludedDatesProp)
		let offset = 0
		for (;;) {
			const dateTimeStart = offset
			const dtParseResult = parseDateTime(str, dateTimeStart, Terminator.comma | Terminator.endOfString)
			offset = dtParseResult.offset + 1

			// resolve the exclusion date time zone
			let zone: string | null
			const isAllDay = dtParseResult.hour === null && dtParseResult.minute === null
			if (isAllDay) {
				if (tzId) {
					console.warn(TAG + ` EXDATES date-time has all-day value ${str.slice(dateTimeStart, offset)}, but also TZID=${tzId}. Ignoreing TZID!`)
				}
				zone = "UTC"
			} else if (dtParseResult.hasZSuffix) {
				if (tzId !== null && tzId !== "UTC") {
					const dtStr = str.slice(dateTimeStart, offset)
					throw new ParserError(`Invalid EXDATES date-time ${dtStr} has both Z suffix in date-time value ${dtStr} and non-UTC TZID=${tzId}!`)
				}
				zone = "UTC"
			} else if (tzId) {
				zone = tzId
			} else {
				zone = null
				console.warn(TAG + ` exclusion date-time ${str.slice(dateTimeStart, offset)} has undefined time zone. The local time zone will be used! `)
			}

			exclusionDates.push(jsDateFromDateTimeParseResult(dtParseResult, zone))

			if (dtParseResult.terminator !== Terminator.comma) {
				break
			}
		}
	}

	// sort the exclusion dates
	exclusionDates.sort((date1, date2) => date1.getTime() - date2.getTime())

	// remove duplicates exclusion dates by dropping dates whenever the previous date's timestamp equals the current one's
	let dst = 0
	let prevTimestamp = -0x80000000 // a very small integer that should not match exclusion timestamps
	for (let src = 0; src < exclusionDates.length; ++src) {
		const date = exclusionDates[src]
		const currTimestamp = date.getTime()
		if (prevTimestamp !== currTimestamp) {
			exclusionDates[dst] = date
			++dst
		}
		prevTimestamp = currTimestamp
	}
	exclusionDates.length = dst

	return exclusionDates.map((date) => createDateWrapper({ date }))
}

export function parseRecurrenceId(recurrenceIdProp: Property, startTzId: string | null): Date {
	const value = recurrenceIdProp.value

	const dtParseResult = parseDateTime(value, 0, Terminator.endOfString)

	// resolve the recurrence ID time zone
	let zone: string | null
	const isAllDay = dtParseResult.hour === null && dtParseResult.minute === null
	if (isAllDay) {
		zone = "UTC"
	} else {
		const tzId = getTzId(recurrenceIdProp)
		if (dtParseResult.hasZSuffix) {
			if (tzId !== null && tzId !== "UTC") {
				throw new ParserError(`Invalid RECURRENCE-ID has both Z suffix in date-time value ${value} ` + `and non-UTC TZID=${tzId}!`)
			}
			zone = "UTC"
		} else if (tzId) {
			zone = tzId
		} else if (startTzId) {
			// If the recurrence ID prop does NOT have a time zone, but DTSTART DOES have a time zone, we use the start time zone
			zone = startTzId
		} else {
			zone = null
			console.warn(TAG + " RECURRENCE-ID time zone is undefined. The local time zone will be used, to match DTSTART behavior! ")
		}
	}

	const dateTime = luxonDateTimeFromDateTimeParseResult(dtParseResult, zone)
	return toValidJSDate(dateTime, recurrenceIdProp.value, startTzId)
}

/**
 * @returns new end time
 */
function parseEventDuration(durationValue: string, startTime: Date): Date {
	const duration = parseDuration(durationValue)
	let durationInMillis = 0

	if (duration.week) {
		durationInMillis += TimeConstants.DAY_IN_MILLIS * 7 * duration.week
	}

	if (duration.day) {
		durationInMillis += TimeConstants.DAY_IN_MILLIS * duration.day
	}

	if (duration.hour) {
		durationInMillis += 1000 * 60 * 60 * duration.hour
	}

	if (duration.minute) {
		durationInMillis += 1000 * 60 * duration.minute
	}

	return new Date(startTime.getTime() + durationInMillis)
}

function getTzId(prop: Property): string | null {
	let tzIdValue: string = prop.params["TZID"]
	if (!tzIdValue) {
		return null
	}
	tzIdValue = tzIdValue.trim()

	if (availableIANATimeZones.includes(tzIdValue)) {
		return tzIdValue
	}

	// Special-case handling for time zone IDs starting with GMT/UTC, followed by an optional offset: +/-h[h][mm]
	// We throw an error if the seconds value is non-zero, because we have no easy way to map them to an IANA time zone
	// using the Intl API.
	const threeCharPrefix = tzIdValue.length >= 3 ? tzIdValue.slice(0, 3).toUpperCase() : null
	if (threeCharPrefix !== null && (threeCharPrefix === "UTC" || threeCharPrefix === "GMT")) {
		if (tzIdValue.length === 3) {
			return "UTC"
		} else {
			const regexMatches = tzIdValue.slice(3).match(/^([+-]\d\d?)(\d\d)?$/)
			if (regexMatches === null) {
				throw new ParserError(`${TAG} Invalid GMT/UTC TZID parameter in property ${prop.name}: TZID=${tzIdValue}.`)
			}
			const [_, hourString, minuteString] = regexMatches
			let hour = parseInt(hourString)
			if (hour === 0) {
				return "UTC"
			}
			if (hour < -12 || hour > 14) {
				throw new ParserError(`${TAG} Invalid hour in GMT/UTC TZID parameter in property ${prop.name}: TZID=${tzIdValue}.`)
			}
			const minute = minuteString ? parseInt(minuteString) : 0
			if (minute !== 0) {
				// our system cannot currently handle minute offsets.
				throw new ParserError(`${TAG} Incompatible GMT/UTC TZID with minute offset in property ${prop.name}: TZID=${tzIdValue}.`)
			}
			// Etc/UTC is the reverse of normal UTC.  Same with GMT.  (See: https://data.iana.org/time-zones/tzdb/etcetera)
			return `Etc/GMT${hour < 0 ? "+" : "-"}${Math.abs(hour)}`
		}
	}

	const timeZoneFromWindowsMap = windowsToIANATimeZones[tzIdValue]
	if (timeZoneFromWindowsMap) {
		return timeZoneFromWindowsMap
	}

	try {
		return Intl.DateTimeFormat("en-US", { timeZone: tzIdValue }).resolvedOptions().timeZone
	} catch (e) {
		if (e instanceof RangeError) {
			throw new ParserError(`${TAG} Invalid timezone in property ${prop.name}: TZID=${tzIdValue}.`)
		} else {
			throw e
		}
	}
}

function oneDayDurationEnd(startTime: Date, allDay: boolean, tzId: string | null, zone: string): Date {
	return DateTime.fromJSDate(startTime, {
		zone: allDay ? "UTC" : tzId || zone,
	})
		.plus({
			day: 1,
		})
		.toJSDate()
}

const MAILTO_PREFIX_REGEX = /^mailto:(.*)/i

function parseMailtoValue(value: string) {
	const match = value.match(MAILTO_PREFIX_REGEX)
	return match && match[1]
}

export const calendarAttendeeStatusToParstat: Record<CalendarAttendeeStatus, string> = {
	// WE map ADDED to NEEDS-ACTION for sending out invites
	[CalendarAttendeeStatus.ADDED]: "NEEDS-ACTION",
	[CalendarAttendeeStatus.NEEDS_ACTION]: "NEEDS-ACTION",
	[CalendarAttendeeStatus.ACCEPTED]: "ACCEPTED",
	[CalendarAttendeeStatus.DECLINED]: "DECLINED",
	[CalendarAttendeeStatus.TENTATIVE]: "TENTATIVE",
}
const parstatToCalendarAttendeeStatus: Record<string, CalendarAttendeeStatus> = reverse(calendarAttendeeStatusToParstat)

export function parseCalendarStringData(value: string, userCalendarTimeZone: string): ParsedCalendarData {
	const tree = parseICalendar(value)
	return parseCalendarEvents(tree, userCalendarTimeZone)
}

/** given an ical datafile, get the parsed calendar events with their alarms as well as the ical method */
export function parseCalendarFile(file: DataFile): ParsedCalendarData {
	try {
		const stringData = utf8Uint8ArrayToString(file.data)
		return parseCalendarStringData(stringData, getTimeZone())
	} catch (e) {
		if (e instanceof ParserError) {
			throw new ParserError(e.message, file.name)
		} else {
			throw e
		}
	}
}

export function parseCalendarEvents(icalObject: ICalObject, userCalendarTimeZone: string): ParsedCalendarData {
	const methodProp = getProp(icalObject, "METHOD", true)
	const method = methodProp ? methodProp.value : CalendarMethod.PUBLISH
	const eventObjects = icalObject.children.filter((obj) => obj.type === "VEVENT")
	const [contents, parseEventErrors] = getContents(eventObjects, userCalendarTimeZone)

	return {
		method,
		contents,
		parseEventErrors,
	}
}

function getContents(eventObjects: ICalObject[], zone: string): [ParsedEventAlarmTuple[], ParserError[]] {
	const contents: ParsedEventAlarmTuple[] = []
	const errors: ParserError[] = []
	for (let i = 0; i < eventObjects.length; ++i) {
		try {
			contents.push(parseEventObject(eventObjects[i], i, zone))
		} catch (e) {
			if (e instanceof ParserError) {
				errors.push(e)
			} else {
				throw e
			}
		}
	}
	return [contents, errors]
}

function parseEventObject(eventObj: ICalObject, index: number, zone: string) {
	const startProp = getProp(eventObj, "DTSTART", false)
	const startTzId: string | null = getTzId(startProp)
	const { date: startTime, allDay } = parseDtStartValue(startProp.value, startTzId)

	// start time and tzid is sorted, so we can worry about event identity now before proceeding...
	let hasValidUid = false
	let uid: string | null = null
	try {
		uid = getPropStringValue(eventObj, "UID", false)
		hasValidUid = true
	} catch (e) {
		if (e instanceof ParserError) {
			// Also parse event and create new UID if none is set
			uid = `import-${Date.now()}-${index}@tuta.com`
		} else {
			throw e
		}
	}

	const recurrenceIdProp = getProp(eventObj, "RECURRENCE-ID", true)
	let recurrenceId: Date | null = null
	if (recurrenceIdProp != null && hasValidUid) {
		recurrenceId = parseRecurrenceId(recurrenceIdProp, startTzId)
	}
	// else
	//   if we generated the UID, we have no way of knowing which event series this recurrenceId refers to.
	//   in that case, we just don't add the recurrenceId and import the event as a standalone.

	let endTime: Date
	let endTzId: string | null = null
	const endProp = getProp(eventObj, "DTEND", true)
	if (endProp) {
		endTzId = endProp ? getTzId(endProp) : null
		endTime = parseDtEndValue(endProp.value, allDay, startTime, startTzId, endTzId)
	} else {
		const durationValue = getPropStringValue(eventObj, "DURATION", true)
		if (durationValue) {
			endTime = parseEventDuration(durationValue, startTime)
		} else {
			// >For cases where a "VEVENT" calendar component specifies a "DTSTART" property with a DATE value type but no "DTEND" nor
			// "DURATION" property, the event's duration is taken to be one day.
			//
			// https://tools.ietf.org/html/rfc5545#section-3.6.1
			endTime = oneDayDurationEnd(startTime, allDay, startTzId, zone)
		}
	}

	let summary: string = ""
	const maybeSummary = parseICalText(eventObj, "SUMMARY")
	if (maybeSummary) summary = maybeSummary

	let location: string = ""
	const maybeLocation = parseICalText(eventObj, "LOCATION")
	if (maybeLocation) location = maybeLocation

	const rruleProp = getPropStringValue(eventObj, "RRULE", true)
	const excludedDateProps = eventObj.properties.filter((p) => p.name === "EXDATE")

	let repeatRule: RepeatRule | null = null
	if (rruleProp != null) {
		repeatRule = parseRrule(rruleProp, startTzId)
		repeatRule.excludedDates = parseExDates(excludedDateProps)
	}

	const description = parseICalText(eventObj, "DESCRIPTION") ?? ""

	const sequenceProp = getProp(eventObj, "SEQUENCE", true)
	let sequence: string = "0"
	if (sequenceProp) {
		const sequenceNumber = filterInt(sequenceProp.value)

		if (Number.isNaN(sequenceNumber)) {
			throw new ParserError("SEQUENCE value is not a number")
		}

		// Convert it back to NumberString. Could use original one but this feels more robust.
		sequence = String(sequenceNumber)
	}

	const attendees = getAttendees(eventObj)

	const organizerProp = getProp(eventObj, "ORGANIZER", true)
	let organizer: EncryptedMailAddress | null = null
	if (organizerProp) {
		const organizerAddress = parseMailtoValue(organizerProp.value)

		if (organizerAddress && isMailAddress(organizerAddress, false)) {
			organizer = createEncryptedMailAddress({
				address: organizerAddress,
				name: organizerProp.params["name"] || "",
			})
		} else {
			console.log("organizer has no address or address is invalid, ignoring: ", organizerAddress)
		}
	}

	const icsCalendarEvent: IcsCalendarEvent = {
		summary,
		description,
		startTime,
		endTime,
		location,
		uid,
		sequence,
		recurrenceId,
		repeatRule,
		attendees,
		organizer,
		startTimeZone: allDay ? null : startTzId,
		endTimeZone: allDay ? null : endTzId,
	}

	let alarms: AlarmInfoTemplate[] = []

	try {
		alarms = getAlarms(eventObj, startTime)
	} catch (e) {
		console.log("alarm is invalid for event: ", icsCalendarEvent.summary, icsCalendarEvent.startTime)
	}

	return {
		icsCalendarEvent,
		alarms,
	}
}

function getAttendees(eventObj: ICalObject) {
	let attendees: CalendarEventAttendee[] = []
	for (const property of eventObj.properties) {
		if (property.name === "ATTENDEE") {
			const attendeeAddress = parseMailtoValue(property.value)

			if (!attendeeAddress || !isMailAddress(attendeeAddress, false)) {
				console.log("attendee has no address or address is invalid, ignoring: ", attendeeAddress)
				continue
			}

			const partStatString = property.params["PARTSTAT"]
			const status = partStatString ? parstatToCalendarAttendeeStatus[partStatString] : CalendarAttendeeStatus.NEEDS_ACTION

			if (!status) {
				console.log(`attendee has invalid partsat: ${partStatString}, ignoring`)
				continue
			}

			attendees.push(
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({
						address: attendeeAddress,
						name: property.params["CN"] || "",
					}),
					status,
				}),
			)
		}
	}
	return attendees
}

function getAlarms(eventObj: ICalObject, startTime: Date): AlarmInfoTemplate[] {
	const alarms: AlarmInfoTemplate[] = []
	for (const alarmChild of eventObj.children) {
		if (alarmChild.type !== "VALARM") continue

		const alarm = parseAlarm(alarmChild, startTime)
		if (!alarm) continue

		// Once we support other types of reminders, e.g via email, this has to be improved
		const isDuplicate = alarms.some((existing) => existing.trigger === alarm.trigger)

		if (!isDuplicate) {
			alarms.push(alarm)
		}
	}
	return alarms
}

/**
 * Parses text properties according to the iCal standard.
 * https://icalendar.org/iCalendar-RFC-5545/3-3-11-text.html
 * @param eventObj
 * @param tag
 */
function parseICalText(eventObj: ICalObject, tag: string) {
	let text = getPropStringValue(eventObj, tag, true)
	for (const rawEscape in revICalReplacements) {
		if (rawEscape === "\\n") {
			text = text?.replace("\\N", revICalReplacements[rawEscape])
		}
		text = text?.replace(rawEscape, revICalReplacements[rawEscape])
	}
	return text
}

export function parseDtStartValue(
	value: string,
	startTzId: string | null,
): {
	date: Date
	allDay: boolean
} {
	const dtParseResult = parseDateTime(value, 0, Terminator.endOfString)

	// resolve the start time zone
	let zone: string | null
	const isAllDay = dtParseResult.hour === null && dtParseResult.minute === null
	if (isAllDay) {
		if (startTzId) {
			console.warn(TAG + ` DTSTART has all-day value ${value}, but also TZID=${startTzId}. Ignoreing TZID!`)
		}
		zone = "UTC"
	} else if (dtParseResult.hasZSuffix) {
		if (startTzId !== null && startTzId !== "UTC") {
			throw new ParserError(`Invalid DTSTART has both Z suffix in date-time value ${value} and non-UTC TZID=${startTzId}!`)
		}
		zone = "UTC"
	} else if (startTzId) {
		zone = startTzId
	} else {
		zone = null
		console.warn(
			TAG +
				" DTSTART time zone is null. The local time zone will be used! " +
				"This means that the start time of the event will have the same wall-clock time, " +
				"no matter the time zone (which may be desired by the system generating the .ics file ¯\\(ツ)/¯).",
		)
	}

	return { date: jsDateFromDateTimeParseResult(dtParseResult, zone), allDay: isAllDay }
}

function parseDtEndValue(value: string, allDay: boolean, startTime: Date, startTzId: string | null, endTzId: string | null): Date {
	if (typeof value !== "string") {
		throw new ParserError("DTEND value is not a string")
	}

	const dtParseResult = parseDateTime(value, 0, Terminator.endOfString)

	let zone: string | null
	// resolve the end time zone
	const isAllDay = dtParseResult.hour === null && dtParseResult.minute === null
	if (isAllDay) {
		if (endTzId !== null && endTzId !== "UTC") {
			console.warn(TAG + ` DTEND has all-day value ${value}, but also TZID=${endTzId}. Ignoreing TZID!`)
		}
		zone = "UTC"
	} else {
		if (dtParseResult.hasZSuffix) {
			if (endTzId !== null && endTzId !== "UTC") {
				throw new ParserError(`Invalid DTEND has both Z suffix in date-time value ${value} and non-UTC TZID=${endTzId}!`)
			}
			zone = "UTC"
		} else if (endTzId) {
			zone = endTzId
		} else if (startTzId) {
			// If we do NOT have an end time zone, but DO have a start time zone, we use the start time zone
			zone = startTzId
		} else {
			zone = null
			console.warn(
				TAG +
					" DTEND time zone is undefined. The local time zone will be used! " +
					"This means that the end time of the event will have the same wall-clock time, " +
					"no matter the time zone (which may be desired by the system generating the .ics file ¯\\(ツ)/¯).",
			)
		}
	}

	const endTime = jsDateFromDateTimeParseResult(dtParseResult, zone)

	if (endTime > startTime) {
		return endTime
	}

	// as per RFC, these are _technically_ illegal: https://tools.ietf.org/html/rfc5545#section-3.8.2.2
	if (allDay) {
		// if the startTime indicates an all-day event, we want to preserve that.
		// we'll assume a 1-day duration.
		return DateTime.fromJSDate(startTime).plus({ day: 1 }).toJSDate()
	} else {
		// we make a best effort to deliver alarms at the set interval before startTime and set the
		// event duration to be 1 second
		// as of now:
		// * this displays as ending the same minute it starts in the tutanota calendar
		// * gets exported with a duration of 1 second
		return DateTime.fromJSDate(startTime).plus({ second: 1 }).toJSDate()
	}
}

function icalFrequencyToRepeatPeriod(value: string): RepeatPeriod {
	switch (value) {
		case "DAILY":
			return RepeatPeriod.DAILY
		case "WEEKLY":
			return RepeatPeriod.WEEKLY
		case "MONTHLY":
			return RepeatPeriod.MONTHLY
		case "YEARLY":
			return RepeatPeriod.ANNUALLY

		case "HOURLY":
		case "MINUTELY":
		case "SECONDLY":
			throw new ParserError("Unsupported ICal frequency: " + value)
		default:
			throw new ParserError("Invalid ICal frequency: " + value)
	}
}

export function repeatPeriodToIcalFrequency(repeatPeriod: RepeatPeriod) {
	switch (repeatPeriod) {
		case RepeatPeriod.DAILY:
			return "DAILY"
		case RepeatPeriod.WEEKLY:
			return "WEEKLY"
		case RepeatPeriod.MONTHLY:
			return "MONTHLY"
		case RepeatPeriod.ANNUALLY:
			return "YEARLY"
		default:
			throw new ProgrammingError(`Invalid RepeatPeriod=${repeatPeriod}!`)
	}
}

type DateTimeParseResult =
	| {
			// YYYYMMDD, i.e. date-only case
			year: number
			month: number
			day: number
			hour: null
			minute: null
			hasZSuffix: false
			offset: number
			terminator: Terminator
	  }
	| {
			// YYYYMMDDThhmmss, i.e. date-time case
			year: number
			month: number
			day: number
			hour: number
			minute: number
			hasZSuffix: boolean
			offset: number
			terminator: Terminator
	  }

export function parseDateTime(str: string, offset: number, terminatorBitSet: Terminator): DateTimeParseResult {
	// Refer to RFC 5545, Section 3.3.5 for specification of DATE-TIME
	// https://www.rfc-editor.org/info/rfc5545/#section-3.3.5

	// Refer to RFC 5545, Section 3.3.4 for specification of DATE
	// https://www.rfc-editor.org/info/rfc5545/#section-3.3.4

	let parseIntStatus: ParseIntError | Terminator
	let year: number
	let month: number
	let day: number
	let hour: number | null = null
	let minute: number | null = null
	let seconds: number
	let hasZSuffix: boolean = false
	let terminator: Terminator | 0

	offset = skipInlineWhitespace(str, offset)

	const dateTimeStart = offset

	;[parseIntStatus, year, offset] = parsePositiveInt(str, offset, 4, 4, null)
	if (parseIntStatus < 0) {
		throw new ParserError(`No year in invalid date time string "${str.slice(dateTimeStart, offset)}..."!`)
	}

	;[parseIntStatus, month, offset] = parsePositiveInt(str, offset, 2, 2, null)
	if (parseIntStatus < 0) {
		throw new ParserError(`No month in invalid date time string "${str.slice(dateTimeStart, offset)}..."!`)
	}
	if (month < 1 || month > 12) {
		throw new ParserError(`Invalid month=${month} in date time string "${str.slice(dateTimeStart, offset)}..."! Month must be between 1 and 12.`)
	}

	;[parseIntStatus, day, offset] = parsePositiveInt(str, offset, 2, 2, null)
	if (parseIntStatus < 0) {
		throw new ParserError(`No day in invalid date time string "${str.slice(dateTimeStart, offset)}..."!`)
	}
	const maxDay = daysInMonth(year, month)
	if (day < 1 || day > maxDay) {
		throw new ParserError(`Invalid day=${day} in date time string "${str.slice(dateTimeStart, offset)}..."! Expected day between 1 and ${maxDay}.`)
	}

	parseTimeIf: if (offset < str.length && str.charCodeAt(offset) === CharCode.T) {
		// Case: `value` is a date-time with optional Z-suffix for UTC (YYYYMMDDThhmmss[Z])

		++offset
		terminator = matchTerminatorAt(str, offset, terminatorBitSet)
		if (terminator) {
			// We support dates followed by 'T' without a time YYYYMMDDT, probably for compatibility buggy external calendars
			break parseTimeIf
		}

		// Refer to RFC 5545, Section 3.3.12 for specification of TIME
		// https://www.rfc-editor.org/info/rfc5545/#section-3.3.12[parseIntStatus, hour, offset] = parsePositiveInt(str, offset, 2, 2, null)

		;[parseIntStatus, hour, offset] = parsePositiveInt(str, offset, 2, 2, null)
		if (parseIntStatus < 0) {
			throw new ParserError(`No hour in invalid date time string: "${str.slice(dateTimeStart, offset)}..."!`)
		}
		// NOTE: This will break if some spec-non-compiliant calendars set hour=24, e.g. "...T240000"
		if (hour > 23) {
			throw new ParserError(`Invalid hour=${hour} in date time string "${str.slice(dateTimeStart, offset)}..."! Must be between 0 and 23.`)
		}
		// NOTE: `hour` cannot be less than 0 because parsePositiveFixedLenInt is used

		;[parseIntStatus, minute, offset] = parsePositiveInt(str, offset, 2, 2, null)
		if (parseIntStatus < 0) {
			throw new ParserError(`No minute in invalid date time string "${str.slice(dateTimeStart, offset)}..."!`)
		}
		const MAX_RECOVERABLE_MINUTE_DIST_TO_VALID = 5
		if (minute > 59) {
			if (minute > 59 + MAX_RECOVERABLE_MINUTE_DIST_TO_VALID) {
				throw new ParserError(`Invalid minute=${minute} >59 in date time string "${str.slice(dateTimeStart, offset)}..."! Must be between 0 and 59.`)
			}
			console.error(`Invalid minute=${minute} >59. Less than ${MAX_RECOVERABLE_MINUTE_DIST_TO_VALID} off from 59, so recovering by setting to 59`)
			minute = 59
		}
		// NOTE: `minute` cannot be less than 0 because parsePositiveFixedLenInt is used

		;[parseIntStatus, seconds, offset] = parsePositiveInt(str, offset, 2, 2, null)
		if (parseIntStatus < 0) {
			throw new ParserError(`No seconds in invalid date time string "${str.slice(dateTimeStart, offset)}..."!`)
		}
		const MAX_IGNORABLE_SECONDS_DIST_TO_VALID = 29
		if (seconds === 60) {
			// A value of 60 is allowed according to the RFC to interface with systems that count leap seconds.
			// See RFC 5545, Section 3.3.12 https://www.rfc-editor.org/info/rfc5545/#section-3.3.12
		} else if (seconds > 59) {
			if (seconds > 59 + MAX_IGNORABLE_SECONDS_DIST_TO_VALID) {
				throw new ParserError(`Invalid seconds=${seconds} >59 in date time string "${str.slice(dateTimeStart, offset)}..."! Must be between 0 and 59.`)
			}
			console.error(
				`Invalid seconds=${minute} >59 in date time string "${str.slice(dateTimeStart, offset)}...". Less than ${MAX_IGNORABLE_SECONDS_DIST_TO_VALID} off from 59, so ignoring`,
			)
		}
		// NOTE: `seconds` cannot be less than 0 because parsePositiveFixedLenInt is used

		hasZSuffix = offset < str.length && str.charCodeAt(offset) === CharCode.Z
		if (hasZSuffix) {
			++offset
		}
	}

	offset = skipInlineWhitespace(str, offset)
	terminator = matchTerminatorAt(str, offset, terminatorBitSet)
	if (!terminator) {
		throw new ParserError(
			`Unexpected ${offset >= str.length ? "end of string" : `'${str[offset]}'`} ` +
				`at end of date time string "${str.slice(dateTimeStart, offset + 1)}". ` +
				`Expected one of ${terminatorBitSetToString(terminatorBitSet)}!`,
		)
	}

	return { year, month, day, hour, minute, hasZSuffix, offset, terminator } as DateTimeParseResult
}

function jsDateFromDateTimeParseResult(dtParseResult: DateTimeParseResult, zone: string | null) {
	if (dtParseResult.hasZSuffix && zone !== "UTC") {
		throw new ParserError(
			`Attempted to use date time parse result ${JSON.stringify(dtParseResult)} with hasZSuffix=true with incompatible non-UTC time zone = ${zone}!`,
		)
	}

	if (dtParseResult.hour === null && dtParseResult.minute === null && !dtParseResult.hasZSuffix) {
		return new Date(Date.UTC(dtParseResult.year, dtParseResult.month - 1, dtParseResult.day))
	} else if (zone === "UTC") {
		return new Date(Date.UTC(dtParseResult.year, dtParseResult.month - 1, dtParseResult.day, dtParseResult.hour, dtParseResult.minute))
	} else {
		return DateTime.fromObject(
			{
				year: dtParseResult.year,
				month: dtParseResult.month,
				day: dtParseResult.day,
				hour: dtParseResult.hour,
				minute: dtParseResult.minute,
			},
			{ zone: zone ?? undefined },
		).toJSDate()
	}
}

function luxonDateTimeFromDateTimeParseResult(dtParseResult: DateTimeParseResult, zone: string | null) {
	if (dtParseResult.hasZSuffix && zone !== "UTC") {
		throw new ParserError(
			`Attempted to use date time parse result ${JSON.stringify(dtParseResult)} with hasZSuffix=true with incompatible non-UTC time zone = ${zone}!`,
		)
	}

	return DateTime.fromObject(
		{
			year: dtParseResult.year,
			month: dtParseResult.month,
			day: dtParseResult.day,
			hour: dtParseResult.hour ?? 0,
			minute: dtParseResult.minute ?? 0,
		},
		{ zone: zone ?? undefined },
	)
}

export function parseUntilRruleTime(value: string, startTzId: string | null): Date {
	const dtParseResult = parseDateTime(value, 0, Terminator.endOfString)

	// resolve the repeat rule time zone
	let zone: string | null
	const isAllDay = dtParseResult.hour === null && dtParseResult.minute === null
	if (isAllDay || dtParseResult.hasZSuffix) {
		zone = "UTC"
	} else if (startTzId) {
		// We don't use the zone from the components (RRULE) but the one from start time if it was given.
		// Don't ask me why but that's how it is.
		zone = startTzId
	} else {
		zone = null
		console.warn(
			TAG +
				" RRULE UNTIL time zone and start time zone are undefined. The local time zone will be used! " +
				"This means the UNTIL time will have the same wall-clock time, no matter the time zone " +
				"(which may be desired by the system generating the .ics file ¯\\(ツ)/¯).",
		)
	}

	let dateTime = luxonDateTimeFromDateTimeParseResult(dtParseResult, zone)
		.plus({ day: 1 }) // rrule until is inclusive in ical but exclusive in Tutanota
		.startOf("day")
	if (startTzId) {
		// If the value has a Z suffix, indicating it's a UTC date time, the time zone of parseDateTimeResult.dateTime
		// will be UTC. However, our current behavior expects the start of the day in the start time zone, so we
		// convert it here. This does not seem like the correct behavior and is likely A SOURCE OF BUGS, but we may
		// rely on it for view logic... TO BE INVESTIGATED!
		dateTime = dateTime.setZone(startTzId, { keepLocalTime: true })
	}
	return toValidJSDate(dateTime, value, startTzId)
}

function toValidJSDate(dateTime: DateTime, value: string, zone: string | null): Date {
	if (!dateTime.isValid) {
		throw new ParserError(`Date value ${value} is invalid in zone ${String(zone)}`)
	}

	return dateTime.toJSDate()
}

function parsePropertyName(str: string, offset: number): string {
	let end = offset
	while (end < str.length) {
		const charCode = str.charCodeAt(end)
		if (
			(charCode < CharCode.a || charCode > CharCode.z) &&
			(charCode < CharCode.A || charCode > CharCode.Z) &&
			(charCode < CharCode.zero || charCode > CharCode.nine) &&
			charCode !== CharCode.minus &&
			charCode !== CharCode.underscore
		) {
			break
		}
		++end
	}
	if (end === offset) {
		throw new ParserError("could not parse property name: " + str[offset])
	}
	return str.slice(offset, end)
}

function parsePropertyNameCombinator(iterator: StringIterator): string {
	const text = parsePropertyName(iterator.iteratee, iterator.position + 1)
	iterator.position += text.length
	return text
}

const secondDurationParser: Parser<[number, string]> = combineParsers(numberParser, makeCharacterParser("S"))
const minuteDurationParser: Parser<[number, string]> = combineParsers(numberParser, makeCharacterParser("M"))
const hourDurationParser: Parser<[number, string]> = combineParsers(numberParser, makeCharacterParser("H"))

const durationTimeParser = mapParser(
	combineParsers(makeCharacterParser("T"), maybeParse(hourDurationParser), maybeParse(minuteDurationParser), maybeParse(secondDurationParser)),
	(parsed) => {
		//Note: we parse for seconds in case they are there, but do not have that as an option, so they are ignored
		let hour, minute

		// the first item in parsed is T (if time is there)
		if (parsed[1]) {
			hour = parsed[1][0]
		}
		if (parsed[2]) {
			minute = parsed[2][0]
		}

		return {
			hour,
			minute,
		}
	},
)
const durationDayParser: Parser<[number, string]> = combineParsers(numberParser, makeCharacterParser("D"))
const durationWeekParser: Parser<[number, string]> = combineParsers(numberParser, makeCharacterParser("W"))
const durationParser = mapParser(
	combineParsers(
		maybeParse(makeEitherParser(makeCharacterParser("+"), makeCharacterParser("-"))),
		makeCharacterParser("P"),
		maybeParse(durationWeekParser),
		maybeParse(durationDayParser),
		maybeParse(durationTimeParser),
	),
	(parsed) => {
		const positive = parsed[0] !== "-"
		let week, day, hour, minute
		if (parsed[2]) {
			week = parsed[2][0]
		}
		if (parsed[3]) {
			day = parsed[3][0]
		}

		return {
			positive,
			week,
			day,
			hour: parsed[4]?.hour,
			minute: parsed[4]?.minute,
		}
	},
)

export function parseDuration(value: string): ICalDuration {
	const iterator = new StringIterator(value)
	const duration = durationParser(iterator)

	if (iterator.peek()) {
		throw new ParserError("Could not parse duration completely")
	}

	return duration
}

/**
 * Check whether the character at a specific offset in a string is a whitespace that is NOT a line break
 * (a.k.a., inline whitespace).
 */
function hasInlineWhitespaceAt(str: string, offset: number): boolean {
	const charCode = str.charCodeAt(offset)
	// RFC 5545 only specifies SPACE and HTAB as inline whitespace characters, but non-spec-compliant iCal software
	// could conceivably also use vertical tabs
	return charCode === CharCode.space || charCode === CharCode.tab || charCode === CharCode.verticalTab
}

/**
 * Skip zero or more whitespace characters that are NOT line breaks (a.k.a. inline).
 * @return The offset of the next character after the whitespace characters that were skipped.
 */
function skipInlineWhitespace(str: string, offset: number): number {
	while (offset < str.length && hasInlineWhitespaceAt(str, offset)) {
		++offset
	}
	return offset
}

const enum ParseIntError {
	NO_ERROR = 0,
	NOT_ENDED_BY_TERMINATOR = -1,
	INT_TOO_LARGE = -2,
	SMALLER_THAN_MIN_LEN = -3,
}

/**
 * Parse a positive integer from a string.
 *
 * Safer than to parseInt... no "helpful" edge-cases
 */
function parsePositiveInt(
	str: string,
	offset: number,
	minLen: number,
	maxLen: number | null,
	terminatorBitSet: Terminator | null,
): [Terminator | ParseIntError, number, number] {
	let status: Terminator | ParseIntError = ParseIntError.NO_ERROR
	let integer = 0
	let end = offset
	for (;;) {
		if (terminatorBitSet !== null) {
			status = matchTerminatorAt(str, end, terminatorBitSet)
			if (status) {
				break
			}
		}

		if (end >= str.length) {
			if (terminatorBitSet !== null) {
				status = ParseIntError.NOT_ENDED_BY_TERMINATOR
			}
			break
		}

		if (maxLen && end >= offset + maxLen) {
			if (terminatorBitSet !== null) {
				status = ParseIntError.NOT_ENDED_BY_TERMINATOR
			}
			break
		}

		const charCode = str.charCodeAt(end)
		if (terminatorBitSet && charCode === terminatorBitSet) {
			break
		}

		if (integer > 214748364 /* floor((2^31 - 1) / 10) */) {
			status = ParseIntError.INT_TOO_LARGE
		}

		const digit = charCode - CharCode.zero
		if (digit < 0 || digit > 9) {
			if (terminatorBitSet) {
				status = ParseIntError.NOT_ENDED_BY_TERMINATOR
			}
			break
		}

		integer = 10 * integer + (charCode - CharCode.zero)

		++end
	}

	if (end - offset < minLen) {
		status = ParseIntError.SMALLER_THAN_MIN_LEN
	}

	return [status, integer, end]
}
