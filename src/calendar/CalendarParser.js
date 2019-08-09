//@flow
import {downcast, neverNull} from "../api/common/utils/Utils"
import {DateTime} from "luxon"
import {createCalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import type {EndTypeEnum, RepeatPeriodEnum} from "../api/common/TutanotaConstants"
import {EndType, RepeatPeriod} from "../api/common/TutanotaConstants"
import {createRepeatRule} from "../api/entities/sys/RepeatRule"

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


function parse(tag: string, iterator: Iterator<string>): ICalObject {
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
			children.push(parse(property.value, iterator))
		} else {
			properties.push(property)
		}

		iteration = iterator.next()
	}
	return {type: tag, properties, children}
}

export function parseIntoTree(stringData: string): ICalObject {
	const iterator = stringData.split("\r\n").values()
	const firstLine = iterator.next()
	if (firstLine.value !== "BEGIN:VCALENDAR") {
		throw new Error("Not a VCALENDAR")
	}
	return parse("VCALENDAR", iterator)
}

export function parseIntoCalendarEvents(icalObject: ICalObject): Array<CalendarEvent> {
	const eventObjects = icalObject.children.filter((obj) => obj.type === "VEVENT")

	function getProp(obj: ICalObject, tag: string): Property {
		const prop = obj.properties.find(p => p.name === tag)
		if (prop == null) throw new Error("Missing DTSTART")
		return prop
	}

	return eventObjects.map((eventObj) => {
		const event = createCalendarEvent()
		const startProp = getProp(eventObj, "DTSTART")
		if (typeof startProp.value !== "string") throw new Error("DTSTART value is not a string")
		const tzId = startProp.params["TZID"]
		event.startTime = parseTime(startProp.value, typeof tzId === "string" ? tzId : null)


		// TODO: end might be missing, then we must assume ending on the same day
		const endProp = getProp(eventObj, "DTEND")
		if (typeof endProp.value !== "string") throw new Error("DTEND value is not a string")
		const endTzId = startProp.params["TZID"]
		event.endTime = parseTime(endProp.value, typeof endTzId === "string" ? endTzId : null)

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
			const rruleValue = rruleProp.value
			if (rruleValue) {
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

				event.repeatRule = repeatRule
			}
		}


		return event
	})
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
		return DateTime.fromObject({year, month, day, hour: 0, minute: 0, second: 0, zone}).toJSDate()
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

type Parser<T> = (StringIterator) => T
const combineParsers: (<A, B>(Parser<A>, Parser<B>) => Parser<[A, B]>)
	& ((<A, B, C>(Parser<A>, Parser<B>, Parser<C>) => Parser<[A, B, C]>))
	& ((<A, B, C, D>(Parser<A>, Parser<B>, Parser<C>, Parser<D>) => Parser<[A, B, C, D]>))
	& ((<A, B, C, D, E>(Parser<A>, Parser<B>, Parser<C>, Parser<D>, Parser<E>) => Parser<[A, B, C, D, E]>))
	= downcast((...parsers) => (iterator) => parsers.map(p => p(iterator)))

const characterParser = (character: string) => (iterator: StringIterator) => {
	let value = iterator.peek()
	if (value === character) {
		iterator.next()
		return value
	}
	throw new Error("expected character " + character)
}

const repeatedParser = <T>(anotherParser: Parser<T>): Parser<Array<T>> => (iterator: StringIterator) => {
	const result = []
	try {
		let parseResult = anotherParser(iterator)
		while (true) {
			result.push(parseResult)
			parseResult = anotherParser(iterator)
		}
	} catch (e) {
	}
	return result
}


const optionalParser = <T>(parser: Parser<T>): Parser<?T> => (iterator) => {
	try {
		return parser(iterator)
	} catch (e) {
		return null
	}
}

const separatedBy = <T, S>(separatorParser: Parser<S>, valueParser: Parser<T>): Parser<Array<T>> => {
	return (iterator) => {
		const result = []
		while (true) {
			result.push(valueParser(iterator))
			try {
				separatorParser(iterator)
			} catch (e) {
				return result
			}
		}
		throw new Error("Did not match separated")
	}
}

const parseEither: <A, B>(Parser<A>, Parser<B>) => Parser<A | B> = (parserA, parserB) => (iterator) => {
	const iteratorPosition = iterator.position
	try {
		return parserA(iterator)
	} catch (e) {
		iterator.position = iteratorPosition
		return parserB(iterator)
	}
}

const propertyKeyValueParser = combineParsers(parsePropertyName, characterParser("="), parseStringValue)

const parsePropertyParameters = combineParsers(
	characterParser(";"),
	separatedBy(
		characterParser(";"),
		propertyKeyValueParser,
	),
)

const parsePropertyValue = parseEither(separatedBy(characterParser(";"), propertyKeyValueParser), parseStringValue)

export const parsePropertySequence: Parser<[
	string,
	?[string, Array<[string, string, string]>],
	string,
	string | Array<[string, string, string]>
	]> =
	combineParsers(
		parsePropertyName,
		optionalParser(parsePropertyParameters),
		characterParser(":"),
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

export class StringIterator {
	iteratee: string
	position = -1

	constructor(iteratee: string) {
		this.iteratee = iteratee
	}

	next(): {value: ?string, done: boolean} {
		const value = this.iteratee[++this.position]
		const done = this.position >= this.iteratee.length
		return {value, done}
	}

	peek(): string {
		return this.iteratee[this.position + 1]
	}
}
