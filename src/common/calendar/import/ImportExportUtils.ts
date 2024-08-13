import { CalendarEvent, CalendarGroupRoot } from "../../api/entities/tutanota/TypeRefs.js"
import type { AlarmInfoTemplate } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { assignEventId, CalendarEventValidity, CalendarType, checkEventValidity, getTimeZone } from "../date/CalendarUtils.js"
import { ParsedCalendarData, ParsedEvent } from "./CalendarImporter.js"
import { getFromMap, groupBy, insertIntoSortedArray } from "@tutao/tutanota-utils"
import { generateEventElementId } from "../../api/common/utils/CommonCalendarUtils.js"
import { createDateWrapper } from "../../api/entities/sys/TypeRefs.js"
import { parseCalendarEvents, parseICalendar } from "../../../calendar-app/calendar/export/CalendarParser.js"

export enum EventImportRejectionReason {
	Pre1970,
	Inversed,
	InvalidDate,
	Duplicate,
}

export type EventWrapper = {
	event: CalendarEvent
	alarms: ReadonlyArray<AlarmInfoTemplate>
}

/** check if the event should be skipped because it's invalid or already imported. if not, add it to the map. */
function shouldBeSkipped(event: CalendarEvent, instanceIdentifierToEventMap: Map<string, CalendarEvent>): EventImportRejectionReason | null {
	if (!event.uid) {
		// should not happen because calendar parser will generate uids if they do not exist
		throw new Error("Uid is not set for imported event")
	}

	switch (checkEventValidity(event)) {
		case CalendarEventValidity.InvalidContainsInvalidDate:
			return EventImportRejectionReason.InvalidDate
		case CalendarEventValidity.InvalidEndBeforeStart:
			return EventImportRejectionReason.Inversed
		case CalendarEventValidity.InvalidPre1970:
			return EventImportRejectionReason.Pre1970
	}
	const instanceIdentifier = makeInstanceIdentifier(event)
	if (!instanceIdentifierToEventMap.has(instanceIdentifier)) {
		instanceIdentifierToEventMap.set(instanceIdentifier, event)
		return null
	} else {
		return EventImportRejectionReason.Duplicate
	}
}

/** we try to enforce that each calendar only contains each uid once, but we need to take into consideration
 * that altered instances have the same uid as their progenitor.*/
function makeInstanceIdentifier(event: CalendarEvent): string {
	return `${event.uid}-${event.recurrenceId?.getTime() ?? "progenitor"}`
}

export type RejectedEvents = Map<EventImportRejectionReason, Array<CalendarEvent>>

/** sort the parsed events into the ones we want to create and the ones we want to reject (stating a rejection reason)
 * will assign event id according to the calendarGroupRoot and the long/short event status */
export function sortOutParsedEvents(
	parsedEvents: ParsedEvent[],
	existingEvents: Array<CalendarEvent>,
	calendarGroupRoot: CalendarGroupRoot,
	zone: string,
): {
	rejectedEvents: RejectedEvents
	eventsForCreation: Array<EventWrapper>
} {
	const instanceIdentifierToEventMap = new Map()
	for (const existingEvent of existingEvents) {
		if (existingEvent.uid == null) continue
		instanceIdentifierToEventMap.set(makeInstanceIdentifier(existingEvent), existingEvent)
	}

	const rejectedEvents: RejectedEvents = new Map()
	const eventsForCreation: Array<{ event: CalendarEvent; alarms: Array<AlarmInfoTemplate> }> = []
	for (const [_, flatParsedEvents] of groupBy(parsedEvents, (e) => e.event.uid)) {
		let progenitor: { event: CalendarEvent; alarms: Array<AlarmInfoTemplate> } | null = null
		let alteredInstances: Array<{ event: CalendarEvent; alarms: Array<AlarmInfoTemplate> }> = []

		for (const { event, alarms } of flatParsedEvents) {
			if (flatParsedEvents.length > 1)
				console.warn("[ImportExportUtils] Found events with same uid: flatParsedEvents with more than one entry", { flatParsedEvents })
			const rejectionReason = shouldBeSkipped(event, instanceIdentifierToEventMap)
			if (rejectionReason != null) {
				getFromMap(rejectedEvents, rejectionReason, () => []).push(event)
				continue
			}

			// hashedUid will be set later in calendarFacade to avoid importing the hash function here
			const repeatRule = event.repeatRule
			event._ownerGroup = calendarGroupRoot._id

			if (repeatRule != null && repeatRule.timeZone === "") {
				repeatRule.timeZone = getTimeZone()
			}

			for (let alarmInfo of alarms) {
				alarmInfo.alarmIdentifier = generateEventElementId(Date.now())
			}

			assignEventId(event, zone, calendarGroupRoot)
			if (event.recurrenceId == null) {
				// the progenitor must be null here since we would have
				// rejected the second uid-progenitor event in shouldBeSkipped.
				progenitor = { event, alarms }
			} else {
				if (progenitor?.event.repeatRule != null) {
					insertIntoSortedArray(
						createDateWrapper({ date: event.recurrenceId }),
						progenitor.event.repeatRule.excludedDates,
						(left, right) => left.date.getTime() - right.date.getTime(),
						() => true,
					)
				}
				alteredInstances.push({ event, alarms })
			}
		}
		if (progenitor != null) eventsForCreation.push(progenitor)
		eventsForCreation.push(...alteredInstances)
	}

	return { rejectedEvents, eventsForCreation }
}

export function isExternalCalendar(calendarType: CalendarType) {
	return calendarType === CalendarType.URL
}

/** importer internals exported for testing */
export function parseCalendarStringData(value: string, zone: string): ParsedCalendarData {
	const tree = parseICalendar(value)
	return parseCalendarEvents(tree, zone)
}
