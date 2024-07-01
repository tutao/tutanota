import { parseCalendarEvents, parseICalendar } from "./CalendarParser.js"
import { DataFile } from "../../../common/api/common/DataFile.js"
import { Require, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { getTimeZone } from "../date/CalendarUtils.js"
import { ParserError } from "../../../common/misc/parsing/ParserCombinator.js"
import { CalendarEvent } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { AlarmInfoTemplate } from "../../../common/api/worker/facades/lazy/CalendarFacade.js"

export type ParsedEvent = {
	event: Require<"uid", CalendarEvent>
	alarms: Array<AlarmInfoTemplate>
}
export type ParsedCalendarData = {
	method: string
	contents: Array<ParsedEvent>
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

/** importer internals exported for testing */
export function parseCalendarStringData(value: string, zone: string): ParsedCalendarData {
	const tree = parseICalendar(value)
	return parseCalendarEvents(tree, zone)
}
