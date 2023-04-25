import { assertNotNull, DAY_IN_MILLIS, downcast, filterInt, neverNull } from "@tutao/tutanota-utils"
import { DateTime, IANAZone } from "luxon"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { CalendarEventAttendee, createCalendarEvent, createCalendarEventAttendee, createEncryptedMailAddress } from "../../api/entities/tutanota/TypeRefs.js"
import type { AlarmInfo, DateWrapper, RepeatRule } from "../../api/entities/sys/TypeRefs.js"
import { createAlarmInfo, createDateWrapper, createRepeatRule } from "../../api/entities/sys/TypeRefs.js"
import type { Parser } from "../../misc/parsing/ParserCombinator"
import {
	combineParsers,
	makeCharacterParser,
	makeEitherParser,
	makeNotCharacterParser,
	makeSeparatedByParser,
	makeZeroOrMoreParser,
	mapParser,
	maybeParse,
	numberParser,
	ParserError,
	StringIterator,
} from "../../misc/parsing/ParserCombinator"
import WindowsZones from "./WindowsZones"
import type { ParsedCalendarData } from "./CalendarImporter"
import { isMailAddress } from "../../misc/FormatValidator"
import { AlarmInterval, CalendarAttendeeStatus, CalendarMethod, EndType, RepeatPeriod, reverse } from "../../api/common/TutanotaConstants"

function parseDateString(dateString: string): {
	year: number
	month: number
	day: number
} {
	const year = parseInt(dateString.slice(0, 4))
	const month = parseInt(dateString.slice(4, 6))
	const day = parseInt(dateString.slice(6, 8))
	return {
		year,
		month,
		day,
	}
}

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

function getProp(obj: ICalObject, tag: string): Property {
	const prop = obj.properties.find((p) => p.name === tag)
	if (prop == null) throw new ParserError(`Missing prop ${tag}`)
	return prop
}

function getPropStringValue(obj: ICalObject, tag: string): string {
	const prop = getProp(obj, tag)
	if (typeof prop.value !== "string") throw new ParserError(`value of ${tag} is not of type string`)
	return prop.value
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
	parsePropertyName,
	makeCharacterParser("="),
	makeEitherParser(escapedStringValueParser, parameterStringValueParser),
)

const parsePropertyParameters = combineParsers(
	makeCharacterParser(";"),
	makeSeparatedByParser(/*separator*/ makeCharacterParser(";"), /*value*/ propertyParametersKeyValueParser),
)

export const iCalReplacements = {
	";": "\\;",
	"\\": "\\\\",
	"\n": "\\n",
}

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
 * Parses everything until the semicolon character
 */
const propertyStringValueParser: Parser<string> = (iterator) => {
	let value = ""

	let next
	while ((next = iterator.peek()) && /[;]/.test(next) === false) {
		value += neverNull(iterator.next().value)
	}

	return value
}

/**
 * Parses values separated by commas
 */
const separatedByCommaParser: Parser<Array<string>> = makeSeparatedByParser(
	makeCharacterParser(","),
	mapParser(makeZeroOrMoreParser(makeNotCharacterParser(",")), (arr) => arr.join("")),
)

/**
 * Parses the whole property (both sides)
 */
export const propertySequenceParser: Parser<[string, [string, Array<[string, string, string]>] | null, string, string]> = combineParsers(
	parsePropertyName,
	maybeParse(parsePropertyParameters),
	makeCharacterParser(":"),
	anyStringUnescapeParser,
)

export function parseProperty(data: string): Property {
	const sequence = propertySequenceParser(new StringIterator(data))
	const name = sequence[0]
	const params: Record<string, string> = {}

	if (sequence[1]) {
		sequence[1][1].forEach(([name, eq, value]) => {
			params[name] = value
		})
	}

	const value = sequence[3]
	return {
		name,
		params,
		value,
	}
}

/**
 * Parses single key=value pair on the right side of the semicolon (value side)
 */
const propertyKeyValueParser: Parser<[string, string, string]> = combineParsers(parsePropertyName, makeCharacterParser("="), propertyStringValueParser)

/**
 * Parses multiple key=value pair on the right side of the semicolon (value side)
 */
const valuesSeparatedBySemicolonParser: Parser<Array<[string, string, string]>> = makeSeparatedByParser(makeCharacterParser(";"), propertyKeyValueParser)

/**
 * Parses multiple key=value pair on the right side of the semicolon (value side)
 */
export function parsePropertyKeyValue(data: string): Record<string, string> {
	const value = valuesSeparatedBySemicolonParser(new StringIterator(data))
	const result: Record<string, string> = {}
	value.forEach(([key, eq, value]) => {
		result[key] = value
	})
	return result
}

function parseIcalObject(tag: string, iterator: Iterator<string>): ICalObject {
	let iteration = iterator.next()
	let properties: Property[] = []
	let children: ICalObject[] = []

	while (!iteration.done && iteration.value) {
		const property = parseProperty(iteration.value)

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
		.replace(/\r?\n\s/g, "")
		.split(/\r?\n/)
		.filter((e) => e !== "")
	const iterator = withFoldedLines.values()
	const firstLine = iterator.next()

	if (firstLine.value !== "BEGIN:VCALENDAR") {
		throw new ParserError("Not a VCALENDAR: " + String(firstLine.value))
	}

	return parseIcalObject("VCALENDAR", iterator)
}

function parseAlarm(alarmObject: ICalObject, event: CalendarEvent): AlarmInfo | null {
	const triggerProp = getProp(alarmObject, "TRIGGER")
	// Tutacalendar currently only supports the DISPLAY value for action
	const actionProp = {
		name: "ACTION",
		params: {},
		value: "DISPLAY",
	}
	const triggerValue = triggerProp.value
	if (typeof triggerValue !== "string") throw new ParserError("expected TRIGGER property to be a string: " + JSON.stringify(triggerProp))
	let trigger: AlarmInterval

	// Absolute time
	if (triggerValue.endsWith("Z")) {
		const triggerTime = parseTime(triggerValue).date
		const tillEvent = event.startTime.getTime() - triggerTime.getTime()

		if (tillEvent >= DAY_IN_MILLIS * 7) {
			trigger = AlarmInterval.ONE_WEEK
		} else if (tillEvent >= DAY_IN_MILLIS * 3) {
			trigger = AlarmInterval.THREE_DAYS
		} else if (tillEvent >= DAY_IN_MILLIS * 2) {
			trigger = AlarmInterval.TWO_DAYS
		} else if (tillEvent >= DAY_IN_MILLIS) {
			trigger = AlarmInterval.ONE_DAY
		} else if (tillEvent >= 60 * 60 * 1000) {
			trigger = AlarmInterval.ONE_HOUR
		} else if (tillEvent >= 30 * 60 * 1000) {
			trigger = AlarmInterval.THIRTY_MINUTES
		} else if (tillEvent >= 10 * 60 * 1000) {
			trigger = AlarmInterval.TEN_MINUTES
		} else if (tillEvent >= 0) {
			trigger = AlarmInterval.FIVE_MINUTES
		} else {
			return null
		}
	} else {
		const duration = parseDuration(triggerValue)

		if (duration.positive) {
			return null
		} else {
			if (duration.week) {
				trigger = AlarmInterval.ONE_WEEK
			} else if (duration.day) {
				if (duration.day >= 3) {
					trigger = AlarmInterval.THREE_DAYS
				} else if (duration.day === 2) {
					trigger = AlarmInterval.TWO_DAYS
				} else {
					trigger = AlarmInterval.ONE_DAY
				}
			} else if (duration.hour) {
				if (duration.hour > 1) {
					trigger = AlarmInterval.ONE_DAY
				} else {
					trigger = AlarmInterval.ONE_HOUR
				}
			} else if (duration.minute) {
				if (duration.minute > 30) {
					trigger = AlarmInterval.ONE_HOUR
				} else if (duration.minute > 10) {
					trigger = AlarmInterval.THIRTY_MINUTES
				} else if (duration.minute > 5) {
					trigger = AlarmInterval.TEN_MINUTES
				} else {
					trigger = AlarmInterval.FIVE_MINUTES
				}
			} else {
				trigger = AlarmInterval.THREE_DAYS
			}
		}
	}

	return Object.assign(createAlarmInfo(), {
		trigger,
	})
}

export function parseRrule(rruleProp: Property, tzId: string | null): RepeatRule {
	let rruleValue

	try {
		rruleValue = parsePropertyKeyValue(rruleProp.value)
	} catch (e) {
		if (e instanceof ParserError) {
			throw new ParserError("RRULE is not an object " + e.message)
		} else {
			throw e
		}
	}

	const frequency = icalFrequencyToRepeatPeriod(rruleValue["FREQ"])
	const until = rruleValue["UNTIL"] ? parseUntilRruleTime(rruleValue["UNTIL"], tzId) : null
	const count = rruleValue["COUNT"] ? parseInt(rruleValue["COUNT"]) : null
	const endType: EndType = until != null ? EndType.UntilDate : count != null ? EndType.Count : EndType.Never
	const interval = rruleValue["INTERVAL"] ? parseInt(rruleValue["INTERVAL"]) : 1
	const repeatRule = createRepeatRule()
	repeatRule.endValue = until ? String(until.getTime()) : count ? String(count) : null
	repeatRule.endType = endType
	repeatRule.interval = String(interval)
	repeatRule.frequency = frequency

	if (typeof tzId === "string") {
		repeatRule.timeZone = tzId
	}

	return repeatRule
}

export function parseExDates(excludedDatesProps: Property[]): DateWrapper[] {
	// it's possible that we have duplicated entries since this data comes from whereever, this deduplicates it.
	const allExDates: Map<number, DateWrapper> = new Map<number, DateWrapper>()
	for (let excludedDatesProp of excludedDatesProps) {
		const tzId = getTzId(excludedDatesProp)
		const values = separatedByCommaParser(new StringIterator(excludedDatesProp.value))
		for (let value of values) {
			const { date: exDate } = parseTime(value, tzId ?? undefined)
			allExDates.set(exDate.getTime(), createDateWrapper({ date: exDate }))
		}
	}
	return [...allExDates.values()].sort((dateWrapper1, dateWrapper2) => dateWrapper1.date.getTime() - dateWrapper2.date.getTime())
}

function parseEventDuration(durationProp: Property, event: CalendarEvent): void {
	if (typeof durationProp.value !== "string") throw new ParserError("DURATION value is not a string")
	const duration = parseDuration(durationProp.value)
	let durationInMillis = 0

	if (duration.week) {
		durationInMillis += DAY_IN_MILLIS * 7 * duration.week
	}

	if (duration.day) {
		durationInMillis += DAY_IN_MILLIS * duration.day
	}

	if (duration.hour) {
		durationInMillis += 1000 * 60 * 60 * duration.hour
	}

	if (duration.minute) {
		durationInMillis += 1000 * 60 * duration.minute
	}

	event.endTime = new Date(event.startTime.getTime() + durationInMillis)
}

function getTzId(prop: Property): string | null {
	let tzId: string | null = null
	const tzIdValue = prop.params["TZID"]

	if (tzIdValue) {
		if (IANAZone.isValidZone(tzIdValue)) {
			tzId = tzIdValue
		} else if (tzIdValue in WindowsZones) {
			tzId = WindowsZones[tzIdValue as keyof typeof WindowsZones]
		}
	}

	return tzId
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

export function parseCalendarEvents(icalObject: ICalObject, zone: string): ParsedCalendarData {
	const methodProp = icalObject.properties.find((prop) => prop.name === "METHOD")
	const method = methodProp ? methodProp.value : CalendarMethod.PUBLISH
	const eventObjects = icalObject.children.filter((obj) => obj.type === "VEVENT")
	const contents = eventObjects.map((eventObj, index) => {
		const event = createCalendarEvent()
		const startProp = getProp(eventObj, "DTSTART")
		if (typeof startProp.value !== "string") throw new ParserError("DTSTART value is not a string")
		const tzId = getTzId(startProp)
		const { date: startTime, allDay } = parseTime(startProp.value, tzId ?? undefined)
		event.startTime = startTime
		const endProp = eventObj.properties.find((p) => p.name === "DTEND")

		if (endProp) {
			if (typeof endProp.value !== "string") throw new ParserError("DTEND value is not a string")
			const endTzId = getTzId(endProp)
			const parsedEndTime = parseTime(endProp.value, typeof endTzId === "string" ? endTzId : undefined)
			event.endTime = parsedEndTime.date

			if (event.endTime <= event.startTime) {
				// as per RFC, these are _technically_ illegal: https://tools.ietf.org/html/rfc5545#section-3.8.2.2
				if (allDay) {
					// if the startTime indicates an all-day event, we want to preserve that.
					// we'll assume a 1-day duration.
					event.endTime = DateTime.fromJSDate(event.startTime).plus({ day: 1 }).toJSDate()
				} else {
					// we make a best effort to deliver alarms at the set interval before startTime and set the
					// event duration to be 1 second
					// as of now:
					// * this displays as ending the same minute it starts in the tutanota calendar
					// * gets exported with a duration of 1 second
					event.endTime = DateTime.fromJSDate(event.startTime).plus({ second: 1 }).toJSDate()
				}
			}
		} else {
			const durationProp = eventObj.properties.find((p) => p.name === "DURATION")

			if (durationProp) {
				parseEventDuration(durationProp, event)
			} else {
				// >For cases where a "VEVENT" calendar component specifies a "DTSTART" property with a DATE value type but no "DTEND" nor
				// "DURATION" property, the event's duration is taken to be one day.
				//
				// https://tools.ietf.org/html/rfc5545#section-3.6.1
				event.endTime = oneDayDurationEnd(startTime, allDay, tzId, zone)
			}
		}

		const summaryProp = eventObj.properties.find((p) => p.name === "SUMMARY")

		if (summaryProp && typeof summaryProp.value === "string") {
			event.summary = summaryProp.value
		}

		const locationProp = eventObj.properties.find((p) => p.name === "LOCATION")

		if (locationProp) {
			if (typeof locationProp.value !== "string") throw new ParserError("LOCATION value is not a string")
			event.location = locationProp.value
		}

		const rruleProp = eventObj.properties.find((p) => p.name === "RRULE")
		const excludedDateProps = eventObj.properties.filter((p) => p.name === "EXDATE")

		if (rruleProp != null) {
			event.repeatRule = parseRrule(rruleProp, tzId)
			event.repeatRule.excludedDates = parseExDates(excludedDateProps)
		}

		const descriptionProp = eventObj.properties.find((p) => p.name === "DESCRIPTION")

		if (descriptionProp) {
			if (typeof descriptionProp.value !== "string") throw new ParserError("DESCRIPTION value is not a string")
			event.description = descriptionProp.value
		}

		const sequenceProp = eventObj.properties.find((p) => p.name === "SEQUENCE")

		if (sequenceProp) {
			const sequenceNumber = filterInt(sequenceProp.value)

			if (Number.isNaN(sequenceNumber)) {
				throw new ParserError("SEQUENCE value is not a number")
			}

			// Convert it back to NumberString. Could use original one but this feels more robust.
			event.sequence = String(sequenceNumber)
		}

		const alarms: AlarmInfo[] = []
		eventObj.children.forEach((alarmChild) => {
			if (alarmChild.type === "VALARM") {
				const newAlarm = parseAlarm(alarmChild, event)
				if (newAlarm) alarms.push(newAlarm)
			}
		})
		let attendees: CalendarEventAttendee[] = []
		eventObj.properties.forEach((property) => {
			if (property.name === "ATTENDEE") {
				const attendeeAddress = parseMailtoValue(property.value)

				if (!attendeeAddress || !isMailAddress(attendeeAddress, false)) {
					console.log("attendee has no address or address is invalid, ignoring: ", attendeeAddress)
					return
				}

				const partStatString = property.params["PARTSTAT"]
				const status = partStatString ? parstatToCalendarAttendeeStatus[partStatString] : CalendarAttendeeStatus.NEEDS_ACTION

				if (!status) {
					console.log(`attendee has invalid partsat: ${partStatString}, ignoring`)
					return
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
		})
		event.attendees = attendees
		const organizerProp = eventObj.properties.find((p) => p.name === "ORGANIZER")

		if (organizerProp) {
			const organizerAddress = parseMailtoValue(organizerProp.value)

			if (organizerAddress && isMailAddress(organizerAddress, false)) {
				event.organizer = createEncryptedMailAddress({
					address: organizerAddress,
					name: organizerProp.params["name"] || "",
				})
			} else {
				console.log("organizer has no address or address is invalid, ignoring: ", organizerAddress)
			}
		}

		try {
			event.uid = getPropStringValue(eventObj, "UID")
		} catch (e) {
			if (e instanceof ParserError) {
				// Also parse event and create new UID if none is set
				event.uid = `import-${Date.now()}-${index}@tutanota.com`
			} else {
				throw e
			}
		}

		return {
			event,
			alarms,
		}
	})
	return {
		method,
		contents,
	}
}

type Duration = {
	positive: boolean
	day?: number
	week?: number
	hour?: number
	minute?: number
}

function icalFrequencyToRepeatPeriod(value: string): RepeatPeriod {
	const convertedValue = {
		DAILY: RepeatPeriod.DAILY,
		WEEKLY: RepeatPeriod.WEEKLY,
		MONTHLY: RepeatPeriod.MONTHLY,
		YEARLY: RepeatPeriod.ANNUALLY,
	}[value]
	if (convertedValue == null) {
		throw new ParserError("Invalid frequency: " + value)
	}
	return convertedValue
}

export function repeatPeriodToIcalFrequency(repeatPeriod: RepeatPeriod) {
	// Separate variable to declare mapping type
	const mapping: Record<RepeatPeriod, string> = {
		[RepeatPeriod.DAILY]: "DAILY",
		[RepeatPeriod.WEEKLY]: "WEEKLY",
		[RepeatPeriod.MONTHLY]: "MONTHLY",
		[RepeatPeriod.ANNUALLY]: "YEARLY",
	}
	return mapping[repeatPeriod]
}

type DateComponents = {
	year: number
	month: number
	day: number
	zone?: string
}
type TimeComponents = {
	hour: number
	minute: number
}
type DateTimeComponents = DateComponents & TimeComponents

export function parseTimeIntoComponents(value: string): DateComponents | DateTimeComponents {
	const trimmedValue = value.trim()

	if (/[0-9]{8}T[0-9]{6}Z/.test(trimmedValue)) {
		// date with time in UTC
		const { year, month, day } = parseDateString(trimmedValue)
		const hour = parseInt(trimmedValue.slice(9, 11))
		const minute = parseInt(trimmedValue.slice(11, 13))
		return {
			year,
			month,
			day,
			hour,
			minute,
			zone: "UTC",
		}
	} else if (/[0-9]{8}T[0-9]{6}/.test(trimmedValue)) {
		// date with time in local timezone
		const { year, month, day } = parseDateString(trimmedValue)
		const hour = parseInt(trimmedValue.slice(9, 11))
		const minute = parseInt(trimmedValue.slice(11, 13))
		return {
			year,
			month,
			day,
			hour,
			minute,
		}
	} else if (/[0-9]{8}/.test(trimmedValue)) {
		// all day events
		return Object.assign({}, parseDateString(trimmedValue))
	} else {
		throw new ParserError("Failed to parse time: " + trimmedValue)
	}
}

export function parseUntilRruleTime(value: string, zone: string | null): Date {
	const components = parseTimeIntoComponents(value)
	// rrule until is inclusive in ical but exclusive in Tutanota
	const filledComponents = components
	// if minute is not provided it is an all day date YYYYMMDD
	const allDay = !("minute" in components)
	// We don't use the zone from the components (RRULE) but the one from start time if it was given.
	// Don't ask me why but that's how it is.
	const effectiveZone = allDay ? "UTC" : zone ?? undefined
	delete filledComponents["zone"]
	const luxonDate = DateTime.fromObject(filledComponents, { zone: effectiveZone })
	const startOfNextDay = luxonDate
		.plus({
			day: 1,
		})
		.startOf("day")
	return toValidJSDate(startOfNextDay, value, zone)
}

/**
 * parse a ical time string and return a JS Date object along with a flag that determines
 * whether the time should be considered part of an all-day event
 * @param value {string} the time string to be parsed
 * @param zone {string} the time zone to use
 */
export function parseTime(
	value: string,
	zone?: string,
): {
	date: Date
	allDay: boolean
} {
	const components = parseTimeIntoComponents(value)
	// if minute is not provided it is an all day date YYYYMMDD
	const allDay = !("minute" in components)
	const effectiveZone = allDay ? "UTC" : components.zone ?? zone
	delete components["zone"]
	const filledComponents = Object.assign(
		{},
		allDay
			? {
					hour: 0,
					minute: 0,
					second: 0,
					millisecond: 0,
			  }
			: {},
		components,
	)

	try {
		const dateTime = DateTime.fromObject(filledComponents, { zone: effectiveZone })
		return { date: toValidJSDate(dateTime, value, zone ?? null), allDay }
	} catch (e) {
		if (e instanceof ParserError) {
			throw e
		}
		throw new ParserError(
			`failed to parse time from ${value} to ${JSON.stringify(filledComponents)}, effectiveZone: ${effectiveZone}, original error: ${e.message}`,
		)
	}
}

function toValidJSDate(dateTime: DateTime, value: string, zone: string | null): Date {
	if (!dateTime.isValid) {
		throw new ParserError(`Date value ${value} is invalid in zone ${String(zone)}`)
	}

	return dateTime.toJSDate()
}

function parsePropertyName(iterator: StringIterator): string {
	let text = ""

	let next
	while ((next = iterator.peek()) && /[a-zA-Z0-9-_]/.test(next)) {
		text += neverNull(iterator.next().value)
	}

	if (text === "") {
		throw new ParserError("could not parse property name: " + iterator.peek())
	}

	return text
}

const secondDurationParser: Parser<[number, string]> = combineParsers(numberParser, makeCharacterParser("S"))
const minuteDurationParser: Parser<[number, string, [number, string] | null]> = combineParsers(
	numberParser,
	makeCharacterParser("M"),
	maybeParse(secondDurationParser),
)
const hourDurationParser: Parser<[number, string, [number, string, [number, string] | null] | null]> = combineParsers(
	numberParser,
	makeCharacterParser("H"),
	maybeParse(minuteDurationParser),
)
type TimeDuration = {
	type: "time"
	hour?: number
	minute?: number
	second?: number
}
type DateDuration = {
	type: "date"
	day: number
	time: TimeDuration | null
}
type WeekDuration = {
	type: "week"
	week: number
}
const durationTimeParser: Parser<TimeDuration> = mapParser(
	combineParsers(makeCharacterParser("T"), makeEitherParser(hourDurationParser, makeEitherParser(minuteDurationParser, secondDurationParser))),
	([t, value]) => {
		let minuteTuple, secondTuple
		let hour, minute, second

		if (value[1] === "H") {
			hour = value[0]
			minuteTuple = downcast(value)[2]
		} else if (value[1] === "M") {
			minuteTuple = value
		} else if (value[1] === "S") {
			secondTuple = value
		}

		if (minuteTuple) {
			minute = minuteTuple[0]
			secondTuple = downcast(minuteTuple)[2]
		}

		if (secondTuple) {
			second = secondTuple[0]
		}

		return {
			type: "time",
			hour,
			minute,
			second,
		}
	},
)
const durationDayParser = combineParsers(numberParser, makeCharacterParser("D"))
const durationWeekParser: Parser<WeekDuration> = mapParser(combineParsers(numberParser, makeCharacterParser("W")), (parsed) => {
	return {
		type: "week",
		week: parsed[0],
	}
})
const durationDateParser: Parser<DateDuration> = mapParser(combineParsers(durationDayParser, maybeParse(durationTimeParser)), (parsed) => {
	return {
		type: "date",
		day: parsed[0][0],
		time: parsed[1],
	} as DateDuration
})
const durationParser = mapParser(
	combineParsers(
		maybeParse(makeEitherParser(makeCharacterParser("+"), makeCharacterParser("-"))),
		makeCharacterParser("P"),
		maybeParse(makeEitherParser(durationDateParser, makeEitherParser(durationTimeParser, durationWeekParser))),
	),
	([sign, p, durationValue]) => {
		const positive = sign !== "-"
		let day, timeDuration, week, hour, minute

		if (durationValue) {
			switch (durationValue.type) {
				case "date":
					day = durationValue.day
					timeDuration = durationValue.time
					break

				case "time":
					timeDuration = durationValue
					break

				case "week":
					week = durationValue.week
			}

			if (timeDuration) {
				hour = timeDuration.hour
				minute = timeDuration.minute
			}
		}

		return {
			positive,
			day,
			hour,
			minute,
			week,
		}
	},
)

export function parseDuration(value: string): Duration {
	const iterator = new StringIterator(value)
	const duration = durationParser(iterator)

	if (iterator.peek()) {
		throw new ParserError("Could not parse duration completely")
	}

	return duration
}
