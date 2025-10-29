import {
	AdvancedRepeatRule,
	CalendarEvent,
	CalendarEventAttendee,
	CalendarGroupRoot,
	CalendarRepeatRule,
	EncryptedMailAddress,
} from "../../api/entities/tutanota/TypeRefs.js"
import type { AlarmInfoTemplate } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { assignEventId, CalendarEventValidity, checkEventValidity, getTimeZone } from "../date/CalendarUtils.js"
import { ParsedCalendarData, ParsedEvent } from "./CalendarImporter.js"
import { assertValidURL, deepEqual, getFromMap, groupBy, insertIntoSortedArray } from "@tutao/tutanota-utils"
import { generateEventElementId } from "../../api/common/utils/CommonCalendarUtils.js"
import { createDateWrapper, DateWrapper } from "../../api/entities/sys/TypeRefs.js"
import { parseCalendarEvents, parseICalendar } from "../../../calendar-app/calendar/export/CalendarParser.js"
import { lang, type TranslationKey } from "../../misc/LanguageViewModel.js"
import { Stripped } from "../../api/common/utils/EntityUtils"

export enum EventImportRejectionReason {
	Pre1970,
	Inversed,
	InvalidDate,
	Duplicate,
}

export type EventAlarmsTuple = {
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
	eventsForCreation: Array<EventAlarmsTuple>
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
	if (!hasValidProtocol(assertResult, ["https:", "webcal:", "webcals:"])) return "invalidURLProtocol_msg"
	return assertResult
}

export function hasValidProtocol(url: URL, validProtocols: string[]) {
	return validProtocols.includes(url.protocol)
}

/**
 * Normalizes calendar URLs by converting webcal/webcals protocols to https.
 * webcal:// and webcals:// are calendar subscription protocols that should be fetched over HTTPS.
 */
export function normalizeCalendarUrl(url: string): string {
	return url.replace(/^webcal[s]?:\/\//, "https://")
}

export function shallowIsSameEvent(eventA: CalendarEvent, eventB: CalendarEvent) {
	const sameUid = eventA.uid === eventB.uid
	const sameSequence = eventA.sequence === eventB.sequence
	const sameRecurrenceId = eventA.recurrenceId?.getTime() === eventB.recurrenceId?.getTime()

	return sameUid && sameSequence && sameRecurrenceId
}

export function eventHasSameFields(a: CalendarEvent, b: CalendarEvent) {
	const rruleA = createStrippedRepeatRule(a.repeatRule)
	const rruleB = createStrippedRepeatRule(b.repeatRule)
	const attendeesA = createStrippedAttendees(a.attendees)
	const attendeesB = createStrippedAttendees(b.attendees)
	const organizerA = createStrippedMailAddress(a.organizer)
	const organizerB = createStrippedMailAddress(b.organizer)

	return (
		a.startTime.valueOf() === b.startTime.valueOf() &&
		a.endTime.valueOf() === b.endTime.valueOf() &&
		deepEqual({ ...attendeesA }, { ...attendeesB }) &&
		a.summary === b.summary &&
		a.sequence === b.sequence &&
		a.location === b.location &&
		a.description === b.description &&
		deepEqual(organizerA, organizerB) &&
		deepEqual(rruleA, rruleB) &&
		a.recurrenceId?.valueOf() === b.recurrenceId?.valueOf()
	)
}

export type StrippedRepeatRule = Stripped<
	Omit<CalendarRepeatRule, "excludedDates" | "advancedRules"> & {
		excludedDates: Stripped<DateWrapper>[]
		advancedRules: Stripped<AdvancedRepeatRule>[]
	}
>

export function createStrippedRepeatRule(repeatRule: CalendarRepeatRule | null): StrippedRepeatRule | null {
	if (!repeatRule) {
		return null
	}
	return {
		frequency: repeatRule.frequency ?? "",
		endType: repeatRule.endType ?? "",
		endValue: repeatRule.endValue ?? "",
		interval: repeatRule.interval ?? "",
		timeZone: repeatRule.timeZone ?? "",
		excludedDates: repeatRule.excludedDates
			? repeatRule.excludedDates.map((ex) => ({
					date: ex.date,
				}))
			: [],
		advancedRules: repeatRule.advancedRules
			? repeatRule.advancedRules.map((rule) => ({
					ruleType: rule.ruleType,
					interval: rule.interval,
				}))
			: [],
	}
}

export type StrippedCalendarEventAttendee = Stripped<
	Omit<CalendarEventAttendee, "address"> & {
		address: Stripped<EncryptedMailAddress>
	}
>

export function createStrippedAttendees(attendees: CalendarEventAttendee[]): StrippedCalendarEventAttendee[] {
	return attendees.map((attendee: CalendarEventAttendee) => {
		return {
			status: attendee.status,
			address: createStrippedMailAddress(attendee.address)!,
		}
	})
}

export function createStrippedMailAddress(mailAddress: EncryptedMailAddress | null): Stripped<EncryptedMailAddress> | null {
	if (!mailAddress) {
		return null
	}

	return {
		address: mailAddress.address,
		name: mailAddress.name,
	}
}
