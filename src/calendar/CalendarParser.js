//@flow
import {downcast, neverNull} from "../api/common/utils/Utils"
import {DateTime} from "luxon"
import {createCalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import type {AlarmIntervalEnum, EndTypeEnum, RepeatPeriodEnum} from "../api/common/TutanotaConstants"
import {AlarmInterval, EndType, RepeatPeriod} from "../api/common/TutanotaConstants"
import {createRepeatRule} from "../api/entities/sys/RepeatRule"
import {createAlarmInfo} from "../api/entities/sys/AlarmInfo"
import {DAY_IN_MILLIS, incrementDate} from "../api/common/utils/DateUtils"
import type {Parser} from "../misc/parsing"
import {combineParsers, mapParser, maybeParse, parseCharacter, parseEither, parseNumber, parseSeparatedBy, StringIterator} from "../misc/parsing"

function parseDateString(dateString: string): {year: number, month: number, day: number} {
	const year = parseInt(dateString.slice(0, 4))
	const month = parseInt(dateString.slice(4, 6))
	const day = parseInt(dateString.slice(6, 8))
	return {year, month, day}
}

type PropertyValue = {[string]: string} | Array<string> | string
type PropertyParamValue = Array<string> | string
type Property = {
	name: string,
	params: {[string]: PropertyParamValue},
	value: PropertyValue,
}
type ICalObject = {type: string, properties: Array<Property>, children: Array<ICalObject>}

function getProp(obj: ICalObject, tag: string): Property {
	const prop = obj.properties.find(p => p.name === tag)
	if (prop == null) throw new Error("Missing DTSTART")
	return prop
}

const parsePropertyKeyValue: Parser<[string, string, string]> =
	combineParsers(parsePropertyName, parseCharacter("="), parseStringValue)

const parsePropertyParameters = combineParsers(
	parseCharacter(";"),
	parseSeparatedBy(
		parseCharacter(";"),
		parsePropertyKeyValue,
	),
)

const parseValuesSeparatedBySemicolon: Parser<Array<[string, string, string]>> =
	parseSeparatedBy(parseCharacter(";"), parsePropertyKeyValue)

const parsePropertyValue: Parser<Array<[string, string, string]> | string> =
	parseEither(parseValuesSeparatedBySemicolon, parseStringValue)

export const parsePropertySequence: Parser<[
	string,
	?[string, Array<[string, string, string]>],
	string,
	Array<[string, string, string]> | string
	]> =
	combineParsers(
		parsePropertyName,
		maybeParse(parsePropertyParameters),
		parseCharacter(":"),
		parsePropertyValue
	)

export function parseProperty(data: string): Property {
	const sequence = parsePropertySequence(new StringIterator(data))
	const name = sequence[0]
	const params = {}
	if (sequence[1]) {
		sequence[1][1].forEach(([name, eq, value]) => {
			params[name] = value
		})
	}
	const valuePart = sequence[3]
	let value
	if (Array.isArray(valuePart)) {
		const dictValue = {}
		valuePart.forEach(([name, eq, propValue]) => {
			dictValue[name] = propValue
		})
		value = dictValue
	} else {
		value = valuePart
	}
	return {name, params, value}
}

function parseIcalObject(tag: string, iterator: Iterator<string>): ICalObject {
	let iteration = iterator.next()
	let properties = []
	let children = []
	while (!iteration.done && iteration.value) {
		const property = parseProperty(iteration.value)
		if (property.name === "END" && property.value === tag) {
			break
		}
		if (property.name === "BEGIN") {
			if (typeof property.value !== "string") throw new Error("BEGIN with array value")
			children.push(parseIcalObject(property.value, iterator))
		} else {
			properties.push(property)
		}

		iteration = iterator.next()
	}
	return {type: tag, properties, children}
}

export function parseICalendar(stringData: string): ICalObject {
	const iterator = stringData.split("\r\n").values()
	const firstLine = iterator.next()
	if (firstLine.value !== "BEGIN:VCALENDAR") {
		throw new Error("Not a VCALENDAR")
	}
	return parseIcalObject("VCALENDAR", iterator)
}

function parseAlarm(alarmObject: ICalObject): ?AlarmInfo {
	const triggerProp = getProp(alarmObject, "TRIGGER")
	if (typeof triggerProp.value !== "string") throw new Error("expected TRIGGER property to be a string: " + JSON.stringify(triggerProp))
	const duration = parseDuration(triggerProp.value)
	if (!duration.positive) {
		let trigger: AlarmIntervalEnum
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
		return Object.assign(createAlarmInfo(), {trigger})
	}
}

function parseRrule(rruleProp, tzId) {
	const rruleValue = rruleProp.value
	if (Array.isArray(rruleValue) || typeof rruleValue === "string") {
		throw new Error("RRULE value is not an object")
	}
	const frequency = parseFrequency(rruleValue["FREQ"])
	const until = rruleValue["UNTIL"] ? parseDateString(rruleValue["UNTIL"]) : null
	const count = rruleValue["COUNT"] ? parseInt(rruleValue["COUNT"]) : null
	const endType: EndTypeEnum = until != null
		? EndType.UntilDate
		: count != null
			? EndType.Count
			: EndType.Never
	const interval = rruleValue["INTERVAL"] ? parseInt(rruleValue["UNTIL"]) : 1

	const repeatRule = createRepeatRule()
	repeatRule.endValue = String(until
		? DateTime.fromObject({year: until.year, month: until.month, day: until.day}).toMillis()
		: count || 0)
	repeatRule.endType = endType
	repeatRule.interval = String(interval)
	repeatRule.frequency = frequency
	if (typeof tzId === "string") {
		repeatRule.timeZone = tzId
	}

	return repeatRule
}

function parseEventDuration(durationProp, event) {
	if (typeof durationProp.value !== "string") throw new Error("DURATION value is not a string")
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

export function parseIntoCalendarEvents(icalObject: ICalObject): Array<{event: CalendarEvent, alarms: Array<AlarmInfo>}> {
	const eventObjects = icalObject.children.filter((obj) => obj.type === "VEVENT")

	return eventObjects.map((eventObj) => {
		const event = createCalendarEvent()
		const startProp = getProp(eventObj, "DTSTART")
		if (typeof startProp.value !== "string") throw new Error("DTSTART value is not a string")
		const tzId = startProp.params["TZID"]
		event.startTime = parseTime(startProp.value, typeof tzId === "string" ? tzId : null)

		const endProp = eventObj.properties.find(p => p.name === "DTEND")
		if (endProp) {
			if (typeof endProp.value !== "string") throw new Error("DTEND value is not a string")
			const endTzId = startProp.params["TZID"]
			event.endTime = parseTime(endProp.value, typeof endTzId === "string" ? endTzId : null)
		} else {
			const durationProp = eventObj.properties.find(p => p.name === "DURATION")
			if (durationProp) {
				parseEventDuration(durationProp, event)
			} else {
				// If nothing else duration is one day.
				// We interpret it like that. Maybe it should be different for all-day events
				// It's not common to omit end date anyway.
				event.endTime = incrementDate(new Date(event.startTime), 1)
			}
		}


		const summaryProp = getProp(eventObj, "SUMMARY")
		if (typeof summaryProp.value !== "string") throw new Error("SUMAMRY value is not a string")
		event.summary = summaryProp.value

		const locationProp = eventObj.properties.find(p => p.name === "LOCATION")
		if (locationProp) {
			if (typeof locationProp.value !== "string") throw new Error("LOCATION value is not a string")
			event.location = locationProp.value
		}

		const rruleProp = eventObj.properties.find(p => p.name === "RRULE")
		if (rruleProp != null) {
			event.repeatRule = parseRrule(rruleProp, tzId)
		}

		const descriptionProp = eventObj.properties.find(p => p.name === "DESCRIPTION")
		if (descriptionProp) {
			if (typeof descriptionProp !== "string") throw new Error("DESCRIPTION value is not a string")
			event.description = descriptionProp.value
		}
		const alarms = []
		eventObj.children.forEach((alarmChild) => {
			if (alarmChild.type === "VALARM") {
				const newAlarm = parseAlarm(alarmChild)
				if (newAlarm) alarms.push(newAlarm)
			}
		})

		return {event, alarms}
	})
}

type Duration = {
	positive: boolean,
	day?: number,
	week?: number,
	hour?: number,
	minute?: number,
}


function parseFrequency(value: string): RepeatPeriodEnum {
	const map = {
		"DAILY": RepeatPeriod.DAILY,
		"WEEKLY": RepeatPeriod.WEEKLY,
		"MONTHLY": RepeatPeriod.MONTHLY,
		"YEARLY": RepeatPeriod.ANNUALLY,
	}
	return map[value]
}

export function parseTime(value: string, zone: ?string): Date {
	if (/[0-9]{8}T[0-9]{6}Z/.test(value)) {
		const {year, month, day} = parseDateString(value)
		const hour = parseInt(value.slice(9, 11))
		const minute = parseInt(value.slice(11, 13))
		return DateTime.fromObject({year, month, day, hour, minute, zone}).toJSDate()
	} else if (/[0-9]{8}T[0-9]{6}/.test(value)) {
		const {year, month, day} = parseDateString(value)
		const hour = parseInt(value.slice(9, 11))
		const minute = parseInt(value.slice(11, 13))
		return DateTime.fromObject({year, month, day, hour, minute, zone}).toJSDate()
	} else if (/[0-9]{8}/.test(value)) {
		const {year, month, day} = parseDateString(value)
		const date = new Date()
		date.setUTCFullYear(year, month, day)
		date.setUTCHours(0, 0, 0, 0)
		return date
	} else {
		throw new Error("Failed to parse time: " + value)
	}
}


function parsePropertyName(iterator: StringIterator): string {
	let text = ""
	while (iterator.peek() && /[a-zA-Z0-9-]/.test(iterator.peek())) {
		text += neverNull(iterator.next().value)
	}
	if (text === "") {
		throw new Error("could not parse property name: " + iterator.peek())
	}
	return text
}

function parseStringValue(iterator: StringIterator): string {
	let value = ""
	while (iterator.peek() && /[:;,]/.test(iterator.peek()) === false) {
		value += neverNull(iterator.next().value)
	}
	return value
}


const secondDurationParser: Parser<[number, string]> =
	combineParsers(parseNumber, parseCharacter("S"))
const minuteDurationParser: Parser<[number, string, ?[number, string]]> =
	combineParsers(parseNumber, parseCharacter("M"), maybeParse(secondDurationParser))
const hourDurationParser: Parser<[number, string, ?[number, string, ?[number, string]]]> =
	combineParsers(parseNumber, parseCharacter("H"), maybeParse(minuteDurationParser))

type TimeDuration = {
	type: "time",
	hour?: number,
	minute?: number,
	second?: number,
}
type DateDuration = {
	type: "date",
	day: number,
	time: ?TimeDuration,
}
type WeekDuration = {
	type: "week",
	week: number,
}
const parseDurationTime = mapParser(combineParsers(
	parseCharacter("T"),
	parseEither(
		hourDurationParser,
		parseEither(
			minuteDurationParser,
			secondDurationParser
		)
	)
), ([t, value]) => {
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
	return {type: "time", hour, minute, second}
})
const parseDurationDay = combineParsers(parseNumber, parseCharacter("D"))
const parseDurationWeek: Parser<WeekDuration> = mapParser(combineParsers(parseNumber, parseCharacter("W")), (parsed) => {
	return {type: "week", week: parsed[0]}
})
const parseDurationDate: Parser<DateDuration> = mapParser(combineParsers(parseDurationDay, maybeParse(parseDurationTime)), (parsed) => {
	return {type: "date", day: parsed[0][0], time: parsed[1]}
})

const durationParser = mapParser(combineParsers(
	maybeParse(
		parseEither(
			parseCharacter("+"),
			parseCharacter("-")
		)
	),
	parseCharacter("P"),
	parseEither(
		parseDurationDate,
		parseEither(
			parseDurationTime,
			parseDurationWeek
		)
	)
), ([sign, p, durationValue]) => {
	const positive = sign !== "-"
	let day, timeDuration, week, hour, minute
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
	return {positive, day, hour, minute, week}
})

export const parseDuration: (string) => Duration = (value) => {
	const iterator = new StringIterator(value)
	const duration = durationParser(iterator)
	if (iterator.peek()) {
		throw new Error("Could not parse duration completely")
	}
	return duration
}
