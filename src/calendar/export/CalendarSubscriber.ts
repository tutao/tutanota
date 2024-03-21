import { parseCalendarStringData, ParsedEvent } from "./CalendarImporter.js"
import { ParserError } from "../../misc/parsing/ParserCombinator.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { CalendarEventTypeRef, CalendarGroupRoot } from "../../api/entities/tutanota/TypeRefs.js"
import { getTimeZone } from "../date/CalendarUtils.js"
import { sortOutParsedEvents } from "./CalendarImporterDialog.js"
import { locator } from "../../api/main/MainLocator.js"

export async function updateICalSubscriptionCalendar(calendarGroupRoot: CalendarGroupRoot): Promise<void> {
	const parsedEvents: ParsedEvent[] = await downloadAndParseICalSubscriptionFile("test")
	if (parsedEvents.length === 0) return

	// we want to override all events, therefore we erase all events first
	// FIXME we should probably add a deleteMultiple to the CalendarService
	await eraseAllEvents(calendarGroupRoot)

	const zone = getTimeZone()
	const { rejectedEvents, eventsForCreation } = sortOutParsedEvents(parsedEvents, [], calendarGroupRoot, zone)

	const operation = locator.operationProgressTracker.startNewOperation()
	return await locator.calendarFacade.saveImportedCalendarEvents(eventsForCreation, operation.id).finally(operation.done)
}

// FIXME Add ical file sanitization
async function downloadAndParseICalSubscriptionFile(iCalSubscriptionUrl: string): Promise<ParsedEvent[]> {
	try {
		return fetch(iCalSubscriptionUrl)
			.then((response) => response.text())
			.then((text) => parseCalendarStringData(text, getTimeZone()).contents)
			.then((parsedEvent) => parsedEvent.flat())
	} catch (e) {
		if (e instanceof ParserError) {
			console.log("Failed to parse file", e)
			Dialog.message(() => lang.get("importReadFileError_msg", { "{filename}": e.filename }))
			return []
		} else {
			throw e
		}
	}
}

async function eraseAllEvents(groupRoot: CalendarGroupRoot): Promise<void[]> {
	const longEvents = await locator.entityClient.loadAll(CalendarEventTypeRef, groupRoot.longEvents)
	const shortEvents = await locator.entityClient.loadAll(CalendarEventTypeRef, groupRoot.shortEvents)
	const allEvents = shortEvents.concat(longEvents)
	return Promise.all(allEvents.map((calendarEvent) => locator.entityClient.erase(calendarEvent)))
}
