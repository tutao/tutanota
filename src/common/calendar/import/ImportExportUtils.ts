import { CalendarEvent, CalendarGroupRoot } from "../../api/entities/tutanota/TypeRefs.js"
import type { AlarmInfoTemplate } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { assignEventId, CalendarEventValidity, checkEventValidity, getTimeZone } from "../date/CalendarUtils.js"
import { ParsedCalendarData, ParsedEvent } from "./CalendarImporter.js"
import { getFromMap, groupBy, insertIntoSortedArray } from "@tutao/tutanota-utils"
import { generateEventElementId } from "../../api/common/utils/CommonCalendarUtils.js"
import { createDateWrapper } from "../../api/entities/sys/TypeRefs.js"
import { parseCalendarEvents, parseICalendar } from "../../../calendar-app/calendar/export/CalendarParser.js"
import { lang, type TranslationKey } from "../../misc/LanguageViewModel.js"
import { assertValidURL } from "@tutao/tutanota-utils/dist/Utils.js"

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
 * and if necessary adds excluded dates to the parsed progenitor. This function will assign event id according to
 * the calendarGroupRoot and the long/short event status */
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

	// We need to sort existingEvents to move all the progenitors to the beginning of the list
	// So they can be processed before their alteredInstances
	existingEvents.sort((a, b) => {
		if (a.recurrenceId != null && b.recurrenceId == null) {
			return 1
		} else if (a.recurrenceId == null && b.recurrenceId != null) {
			return -1
		}

		return 0
	})

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
			if (flatParsedEvents.length > 1) console.warn("[ImportExportUtils] Found events with same uid: flatParsedEvents with more than one entry")

			for (let alarmInfo of alarms) {
				alarmInfo.alarmIdentifier = generateEventElementId(Date.now())
			}

			if (progenitor?.event.repeatRule != null && event.recurrenceId != null) {
				insertIntoSortedArray(
					createDateWrapper({ date: event.recurrenceId }),
					progenitor.event.repeatRule.excludedDates,
					(left, right) => left.date.getTime() - right.date.getTime(),
					() => true,
				)
				if (!existingEvents.some((ev) => shallowIsSameEvent(ev, event))) {
					alteredInstances.push({ event, alarms })
				}
			} else if (event.recurrenceId != null) {
				treatProgenitorExcludedDates(
					event,
					getFromMap(rejectedEvents, EventImportRejectionReason.Duplicate, () => []),
				)

				if (!existingEvents.some((ev) => shallowIsSameEvent(ev, event))) {
					alteredInstances.push({ event, alarms })
				}
			}

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

			assignEventId(event, zone, calendarGroupRoot)
			if (event.recurrenceId == null) {
				// the progenitor must be null here since we would have
				// rejected the second uid-progenitor event in shouldBeSkipped.
				progenitor = { event, alarms }
			}
		}
		if (progenitor != null) eventsForCreation.push(progenitor)
		eventsForCreation.push(...alteredInstances)
	}

	return { rejectedEvents, eventsForCreation }
}

/*
 * Looks for the progenitor of an altered instance inside a given event list and
 * updates only the progenitor in place with the excluded instance.
 */
function treatProgenitorExcludedDates(alteredInstance: CalendarEvent, events: CalendarEvent[]) {
	if (alteredInstance.recurrenceId == null) {
		throw Error(`Tried to handle an excluded date without recurrence id, event ${alteredInstance._id}`)
	}

	const event = events.find((ev) => ev.uid === alteredInstance.uid && ev.repeatRule != null && ev.recurrenceId == null)
	event?.repeatRule?.excludedDates.push(createDateWrapper({ date: alteredInstance.recurrenceId }))
}

/** importer internals exported for testing */
export function parseCalendarStringData(value: string, zone: string): ParsedCalendarData {
	const tree = parseICalendar(value)
	return parseCalendarEvents(tree, zone)
}

export function isIcal(iCalStr: string): boolean {
	return iCalStr.trimStart().split(/\r?\n/, 1)[0] === "BEGIN:VCALENDAR"
}

export function getExternalCalendarName(iCalStr: string): string {
	let calName = iCalStr.match(/X-WR-CALNAME:(.*)\r?\n/)
	const name = calName ? calName[1] : iCalStr.match(/PRODID:-\/\/(.*)\/\//)?.[1]!
	return name ?? lang.get("noTitle_label")
}

export const enum SyncStatus {
	Failed = "Failed",
	Success = "Success",
}

export function checkURLString(url: string): TranslationKey | URL {
	const assertResult = assertValidURL(url)
	if (!assertResult) return "invalidURL_msg"
	if (!hasValidProtocol(assertResult, ["https:"])) return "invalidURLProtocol_msg"
	return assertResult
}

export function hasValidProtocol(url: URL, validProtocols: string[]) {
	return validProtocols.includes(url.protocol)
}

export function shallowIsSameEvent(eventA: CalendarEvent, eventB: CalendarEvent) {
	const sameUid = eventA.uid === eventB.uid
	const sameSequence = eventA.sequence == eventB.sequence
	const sameRecurrenceId = eventA.recurrenceId?.getTime() === eventB.recurrenceId?.getTime()

	return sameUid && sameSequence && sameRecurrenceId
}
