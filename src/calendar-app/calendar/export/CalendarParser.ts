import { DAY_IN_MILLIS, filterInt, neverNull, Require } from "@tutao/tutanota-utils"
import { DateTime, Duration, IANAZone } from "luxon"
import type { CalendarEvent, EncryptedMailAddress } from "../../../common/api/entities/tutanota/TypeRefs.js"
import {
	CalendarEventAttendee,
	createCalendarEvent,
	createCalendarEventAttendee,
	createEncryptedMailAddress,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import type { DateWrapper, RepeatRule } from "../../../common/api/entities/sys/TypeRefs.js"
import { createDateWrapper, createRepeatRule } from "../../../common/api/entities/sys/TypeRefs.js"
import type { Parser } from "../../../common/misc/parsing/ParserCombinator"
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
} from "../../../common/misc/parsing/ParserCombinator"
import WindowsZones from "./WindowsZones"
import type { ParsedCalendarData } from "../../../common/calendar/import/CalendarImporter.js"
import { isMailAddress } from "../../../common/misc/FormatValidator"
import { CalendarAttendeeStatus, CalendarMethod, EndType, RepeatPeriod, reverse } from "../../../common/api/common/TutanotaConstants"
import { AlarmInterval, AlarmIntervalUnit } from "../../../common/calendar/date/CalendarUtils.js"
import { AlarmInfoTemplate } from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import { serializeAlarmInterval } from "../../../common/api/common/utils/CommonCalendarUtils.js"

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
	parsePropertyName,
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
	const values = valuesSeparatedBySemicolonParser(new StringIterator(data))
	const result: Record<string, string> = {}
	for (const [key, _eq, value] of values) {
		result[key] = value
	}
	return result
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
		// For absolute time we just convert the trigger to minutes. There might be a bigger unit that can express it but we don't have to take care about time
		// zones or daylight saving in this case and it's simpler this way.
		const triggerTime = parseTime(triggerValue).date
		const tillEvent = eventStart.getTime() - triggerTime.getTime()
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

export function parseRrule(rawRruleValue: string, tzId: string | null): RepeatRule {
	let rruleValue

	try {
		rruleValue = parsePropertyKeyValue(rawRruleValue)
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
	const repeatRule = createRepeatRule({
		endValue: until ? String(until.getTime()) : count ? String(count) : null,
		endType: endType,
		interval: String(interval),
		frequency: frequency,
		excludedDates: [],
		timeZone: "",
	})

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

export function parseRecurrenceId(recurrenceIdProp: Property, tzId: string | null): Date {
	const components = parseTimeIntoComponents(recurrenceIdProp.value)
	// rrule until is inclusive in ical but exclusive in Tutanota
	const filledComponents = components
	// if minute is not provided it is an all day date YYYYMMDD
	const allDay = !("minute" in components)
	// We don't use the zone from the components (RRULE) but the one from start time if it was given.
	// Don't ask me why but that's how it is.
	const effectiveZone = allDay ? "UTC" : components.zone ?? getTzId(recurrenceIdProp) ?? tzId ?? undefined
	delete filledComponents["zone"]
	const luxonDate = DateTime.fromObject(filledComponents, { zone: effectiveZone })
	return toValidJSDate(luxonDate, recurrenceIdProp.value, tzId)
}

/**
 * @returns new end time
 */
function parseEventDuration(durationValue: string, startTime: Date): Date {
	const duration = parseDuration(durationValue)
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

	return new Date(startTime.getTime() + durationInMillis)
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
	const methodProp = getProp(icalObject, "METHOD", true)
	const method = methodProp ? methodProp.value : CalendarMethod.PUBLISH
	const eventObjects = icalObject.children.filter((obj) => obj.type === "VEVENT")
	const contents = getContents(eventObjects, zone)

	return {
		method,
		contents,
	}
}

function getContents(eventObjects: ICalObject[], zone: string) {
	return eventObjects.map((eventObj, index) => {
		const startProp = getProp(eventObj, "DTSTART", false)
		const tzId = getTzId(startProp)
		const { date: startTime, allDay } = parseTime(startProp.value, tzId ?? undefined)

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
			// if we generated the UID, we have no way of knowing which event series this recurrenceId refers to.
			// in that case, we just don't add the recurrenceId and import the event as a standalone.
			recurrenceId = parseRecurrenceId(recurrenceIdProp, tzId)
		}

		const endTime = parseEndTime(eventObj, allDay, startTime, tzId, zone)

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
			repeatRule = parseRrule(rruleProp, tzId)
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

		const event = createCalendarEvent({
			description,
			startTime,
			endTime,
			uid,
			recurrenceId,
			summary,
			location,
			repeatRule,
			sequence,
			attendees,
			organizer,
			hashedUid: null,
			invitedConfidentially: null,
			alarmInfos: [],
		}) as Require<"uid", CalendarEvent>

		let alarms: AlarmInfoTemplate[] = []

		try {
			alarms = getAlarms(eventObj, startTime)
		} catch (e) {
			console.log("alarm is invalid for event: ", event.summary, event.startTime)
		}

		return {
			event,
			alarms,
		}
	})
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
		if (alarmChild.type === "VALARM") {
			const newAlarm = parseAlarm(alarmChild, startTime)
			if (newAlarm) alarms.push(newAlarm)
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

function parseEndTime(eventObj: ICalObject, allDay: boolean, startTime: Date, tzId: string | null, zone: string): Date {
	const endProp = getProp(eventObj, "DTEND", true)

	if (endProp) {
		if (typeof endProp.value !== "string") throw new ParserError("DTEND value is not a string")
		const endTzId = getTzId(endProp)
		const parsedEndTime = parseTime(endProp.value, typeof endTzId === "string" ? endTzId : undefined)
		const endTime = parsedEndTime.date
		if (endTime > startTime) return endTime

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
	} else {
		const durationValue = getPropStringValue(eventObj, "DURATION", true)

		if (durationValue) {
			return parseEventDuration(durationValue, startTime)
		} else {
			// >For cases where a "VEVENT" calendar component specifies a "DTSTART" property with a DATE value type but no "DTEND" nor
			// "DURATION" property, the event's duration is taken to be one day.
			//
			// https://tools.ietf.org/html/rfc5545#section-3.6.1
			return oneDayDurationEnd(startTime, allDay, tzId, zone)
		}
	}
}

type ICalDuration = {
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

/** parse a time */
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
const minuteDurationParser: Parser<[number, string]> = combineParsers(numberParser, makeCharacterParser("M"))
const hourDurationParser: Parser<[number, string]> = combineParsers(numberParser, makeCharacterParser("H"))
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
