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
import { DAY_IN_MILLIS, EndType, ProgrammingError, RepeatPeriod } from "@tutao/app-env"
import { reverse } from "../../../common/misc/EnumUtils"
import { AlarmInterval, AlarmIntervalUnit, BYRULE_MAP, daysInMonth, getTimeZone } from "../../../common/calendar/date/CalendarUtils.js"
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
	contents: Array<ParsedEventAlarmTuple>
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
		// For absolute time we just convert the trigger to minutes. There might be a bigger unit that can express it but we don't have to take care about time
		// zones or daylight saving in this case and it's simpler this way.
		const dtParseResult = parseDateTime(triggerValue)
		if (!dtParseResult.hasZSuffix) {
			throw new ProgrammingError(`triggerValue=${triggerValue} ends with Z but parseDateTime result has hasZSuffix===false!`)
		}
		const triggerTime = jsDateFromDateTimeParseResult(dtParseResult, "UTC")
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

export function parseRrule(rawRruleValue: string, startTzId: string | null): RepeatRule {
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
	const until = rruleValue["UNTIL"] ? parseUntilRruleTime(rruleValue["UNTIL"], startTzId) : null
	let count: number | null = null
	const countString = rruleValue["COUNT"]
	if (countString) {
		count = parsePositiveInt(countString)
		if (count === null) {
			throw new ParserError(`Invalid COUNT in repeat rule: RRULE:${rawRruleValue}`)
		}
	}
	const endType: EndType = until != null ? EndType.UntilDate : count != null ? EndType.Count : EndType.Never
	const interval = rruleValue["INTERVAL"] ? parseInt(rruleValue["INTERVAL"]) : 1
	const repeatRule = createRepeatRule({
		endValue: until ? String(until.getTime()) : count ? String(count) : null,
		endType: endType,
		interval: String(interval),
		frequency: frequency,
		excludedDates: [],
		timeZone: "",
		advancedRules: parseAdvancedRule(rruleValue),
	})

	if (typeof startTzId === "string") {
		repeatRule.timeZone = startTzId
	}

	return repeatRule
}

export function parseAdvancedRule(rrule: Record<string, string>): CalendarAdvancedRepeatRule[] {
	const advancedRepeatRules: CalendarAdvancedRepeatRule[] = []
	for (const rruleKey in rrule) {
		if (!BYRULE_MAP.has(rruleKey)) {
			continue
		}

		for (const interval of rrule[rruleKey].split(",")) {
			if (interval === "") {
				continue
			}

			advancedRepeatRules.push(
				createCalendarAdvancedRepeatRule({
					ruleType: BYRULE_MAP.get(rruleKey)!.toString(),
					interval,
				}),
			)
		}
	}
	return advancedRepeatRules
}

export function parseExDates(excludedDatesProps: Property[]): DateWrapper[] {
	// it's possible that we have duplicated entries since this data comes from whereever, we use the set to check for duplicates.
	const exclusionTimestamps = new Set<number>()
	const exclusionDates: DateWrapper[] = []
	for (let excludedDatesProp of excludedDatesProps) {
		const tzId: string | null = getTzId(excludedDatesProp)
		for (let value of excludedDatesProp.value.split(",")) {
			const dtParseResult = parseDateTime(value)

			// resolve the exclusion date time zone
			let zone: string | null
			const isAllDay = dtParseResult.hour === null && dtParseResult.minute === null
			if (isAllDay) {
				if (tzId) {
					console.warn(TAG + ` EXDATES date-time has all-day value ${value}, but also TZID=${tzId}. Ignoreing TZID!`)
				}
				zone = "UTC"
			} else if (dtParseResult.hasZSuffix) {
				if (tzId !== null && tzId !== "UTC") {
					throw new ParserError(`Invalid EXDATES date-time ${value} has both Z suffix in date-time value ${value} and non-UTC TZID=${tzId}!`)
				}
				zone = "UTC"
			} else if (tzId) {
				zone = tzId
			} else {
				zone = null
				console.warn(TAG + ` exclusion date-time ${value} has undefined time zone. The local time zone will be used! `)
			}

			const date = jsDateFromDateTimeParseResult(dtParseResult, zone)
			const timestamp = date.getTime()
			if (!exclusionTimestamps.has(timestamp)) {
				exclusionTimestamps.add(timestamp)
				exclusionDates.push(createDateWrapper({ date }))
			}
		}
	}
	return exclusionDates.sort((dateWrapper1, dateWrapper2) => dateWrapper1.date.getTime() - dateWrapper2.date.getTime())
}

export function parseRecurrenceId(recurrenceIdProp: Property, startTzId: string | null): Date {
	const value = recurrenceIdProp.value

	const dtParseResult = parseDateTime(value)

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
	const tzIdValue = prop.params["TZID"]
	if (!tzIdValue) {
		return null
	}

	if (availableIANATimeZones.includes(tzIdValue)) {
		return tzIdValue
	}
	// Implementations of Intl API understand the "UTC" time zone, but we don't include it in our list of
	// available IANA time zones, because we don't expect that users will want to select it
	if (tzIdValue === "UTC") {
		return "UTC"
	}

	const timeZoneFromWindowsMap = windowsToIANATimeZones[tzIdValue]
	if (timeZoneFromWindowsMap) {
		return timeZoneFromWindowsMap
	}

	try {
		return Intl.DateTimeFormat("en-US", { timeZone: tzIdValue }).resolvedOptions().timeZone
	} catch (e) {
		if (e instanceof RangeError) {
			throw new ParserError(`${TAG} Invalid timezone in property ${prop.name}=${tzIdValue}.`)
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
	const contents = getContents(eventObjects, userCalendarTimeZone)

	return {
		method,
		contents,
	}
}

function getContents(eventObjects: ICalObject[], zone: string): Array<ParsedEventAlarmTuple> {
	return eventObjects.map((eventObj, index) => {
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
	const dtParseResult = parseDateTime(value)

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

	const dtParseResult = parseDateTime(value)

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
	  }
	| {
			// YYYYMMDDThhmmss, i.e. date-time case
			year: number
			month: number
			day: number
			hour: number
			minute: number
			hasZSuffix: boolean
	  }

export function parseDateTime(value: string): DateTimeParseResult {
	value = value.trim()

	let offset = 0

	let year = parsePositiveFixedLenInt(value, offset, 4)
	if (year === null) {
		throw new ParserError(`No year in invalid date time string: ${value}!`)
	}
	offset += 4

	let month = parsePositiveFixedLenInt(value, offset, 2)
	if (month === null) {
		throw new ParserError(`No month in invalid date time string: ${value}!`)
	}
	if (month < 1 || month > 12) {
		throw new ParserError(`Invalid month=${month} in date time string "${value}"! Month must be between 1 and 12.`)
	}
	offset += 2

	let day = parsePositiveFixedLenInt(value, offset, 2)
	if (day === null) {
		throw new ParserError(`No day in invalid date time string: ${value}!`)
	}
	const maxDay = daysInMonth(year, month)
	if (day < 1 || day > maxDay) {
		throw new ParserError(`Invalid day=${day} in date time string "${value}"! Expected day between 1 and ${maxDay}.`)
	}
	offset += 2

	if (offset < value.length) {
		if (value[offset] !== "T") {
			throw new ParserError(`Invalid date time string "${value}"! Expected character 'T' between YYYYMMDD and hhmmss.`)
		}
		++offset
	}

	if (offset >= value.length) {
		// Case: `value` is just a date (YYYYMMDD) without any time (hhmmss)
		return { year, month, day, hour: null, minute: null, hasZSuffix: false }
	} else {
		// Case: `value` is a date-time (YYYYMMDDThhmmss)
		const hour = parsePositiveFixedLenInt(value, offset, 2)
		if (hour === null) {
			throw new ParserError(`No hour in invalid date time string: ${value}!`)
		}
		if (hour < 0 || hour > 24) {
			throw new ParserError(`Invalid hour=${hour} in date time string "${value}! Must be between 0 and 24.`)
		}
		offset += 2

		const minute = parsePositiveFixedLenInt(value, offset, 2)
		if (minute === null) {
			throw new ParserError(`No minute in invalid date time string: ${value}!`)
		}
		if (hour < 0 || hour > 59) {
			throw new ParserError(`Invalid minute=${minute} in date time string "${value}! Must be between 0 and 59.`)
		}
		offset += 2

		const seconds = parsePositiveFixedLenInt(value, offset, 2)
		if (seconds === null) {
			throw new ParserError(`No seconds in invalid date time string: ${value}!`)
		}
		if (seconds < 0 || seconds > 59) {
			throw new ParserError(`Invalid seconds=${seconds} in date time string "${value}! Must be between 0 and 59.`)
		}
		offset += 2

		if (hour === 24 && (minute !== 0 || seconds !== 0)) {
			throw new ParserError(`Invalid date time string "${value}": hour=24 so minute and seconds must be 0, but got ${minute} and ${seconds}.`)
		}

		const hasZSuffix = offset < value.length && value[offset] === "Z"
		if (hasZSuffix) {
			++offset
		}

		if (offset < value.length) {
			throw new ParserError(`Invalid characters at end of date time string: ${value}!`)
		}

		return { year, month, day, hour, minute, hasZSuffix }
	}
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
	const dtParseResult = parseDateTime(value)

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
 * Parse a positive integer from a string.
 *
 * Simpler and safer than to parseInt... no "helpful" edge-cases
 */
function parsePositiveInt(str: string): number | null {
	const MAX_SAFE_INTEGER_LEN = 15
	if (str.length > MAX_SAFE_INTEGER_LEN) {
		return null
	}
	return parsePositiveFixedLenInt(str, 0, str.length)
}

/**
 * Parse a positive integer with a fixed number of digits at a specified offset in a string.
 *
 * Simpler and safer than to parseInt... no "helpful" edge-cases
 *
 * @returns [boolean indicating success or failure,  the positive integer,  new offset after parsing]
 */
function parsePositiveFixedLenInt(str: string, offset: number, fixedLen: number): number | null {
	const end = offset + fixedLen
	if (end > str.length) {
		return null
	}
	let integer = 0
	for (let i = offset; i < end; ++i) {
		const digit = str.charCodeAt(i) - 0x30 // 0 has charCode 0X30
		if (digit < 0 || digit > 9) {
			return null
		}
		integer = 10 * integer + digit
	}
	return integer
}
