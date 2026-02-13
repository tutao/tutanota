import {
	AdvancedRepeatRule,
	CalendarEvent,
	CalendarEventAttendee,
	CalendarGroupRoot,
	CalendarRepeatRule,
	createAdvancedRepeatRule,
	createCalendarEvent,
	createCalendarEventAttendee,
	createCalendarRepeatRule,
	createEncryptedMailAddress,
	EncryptedMailAddress,
} from "../../api/entities/tutanota/TypeRefs.js"
import { AlarmInfoTemplate } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { assignEventId, CalendarEventValidity, checkEventValidity, getTimeZone } from "../date/CalendarUtils.js"
import { assertValidURL, deepEqual, getFromMap, groupBy, insertIntoSortedArray } from "@tutao/tutanota-utils"
import { generateEventElementId } from "../../api/common/utils/CommonCalendarUtils.js"
import { createDateWrapper, DateWrapper } from "../../api/entities/sys/TypeRefs.js"
import { parseCalendarEvents, parseICalendar } from "../../../calendar-app/calendar/export/CalendarParser.js"
import { lang, type TranslationKey } from "../../misc/LanguageViewModel.js"
import { getStrippedClone, Stripped, StrippedEntity } from "../../api/common/utils/EntityUtils"

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
	organizer: Stripped<EncryptedMailAddress> | null
}
export type ParsedEvent = {
	icsCalendarEvent: IcsCalendarEvent
	alarms: Array<AlarmInfoTemplate>
}
export type ParsedCalendarData = {
	method: string
	contents: Array<ParsedEvent>
}

export type StrippedCalendarEventAttendee = Stripped<
	Omit<CalendarEventAttendee, "address"> & {
		address: Stripped<EncryptedMailAddress>
	}
>

export type StrippedRepeatRule = Stripped<
	Omit<CalendarRepeatRule, "excludedDates" | "advancedRules"> & {
		excludedDates: Stripped<DateWrapper>[]
		advancedRules: Stripped<AdvancedRepeatRule>[]
	}
>

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

export function makeCalendarEventFromIcsCalendarEvent(icsCalendarEvent: Readonly<IcsCalendarEvent>): CalendarEvent {
	const rrule = icsCalendarEvent.repeatRule
	const repeatRule = rrule ? createCalendarRepeatRule(fromStrippedRepeatRule(rrule)) : null

	const attendees = icsCalendarEvent.attendees
		? icsCalendarEvent.attendees.map((attendee) => createCalendarEventAttendee(fromStrippedCalendarEventAttendee(attendee)))
		: []

	const organizer = icsCalendarEvent.organizer ? createEncryptedMailAddress(icsCalendarEvent.organizer) : null

	const additionalValues = {
		hashedUid: null,
		invitedConfidentially: false,
		sender: "",
		pendingInvitation: false,
		alarmInfos: [],
	}
	const calendarEvent: StrippedEntity<CalendarEvent> = Object.assign({}, icsCalendarEvent, additionalValues, {
		repeatRule,
		organizer,
		attendees,
	}) satisfies Stripped<CalendarEvent>

	return createCalendarEvent(calendarEvent)
}

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
	for (const [_, flatParsedEvents] of groupBy(parsedEvents, (e) => e.icsCalendarEvent.uid)) {
		let progenitor: { event: CalendarEvent; alarms: Array<AlarmInfoTemplate> } | null = null
		let alteredInstances: Array<{ event: CalendarEvent; alarms: Array<AlarmInfoTemplate> }> = []

		for (const { icsCalendarEvent, alarms } of flatParsedEvents) {
			if (flatParsedEvents.length > 1) console.warn("[ImportExportUtils] Found events with same uid: flatParsedEvents with more than one entry")

			for (let alarmInfo of alarms) {
				alarmInfo.alarmIdentifier = generateEventElementId(Date.now())
			}

			const calendarEvent = makeCalendarEventFromIcsCalendarEvent(icsCalendarEvent)
			if (progenitor?.event.repeatRule != null && calendarEvent.recurrenceId != null) {
				insertIntoSortedArray(
					createDateWrapper({ date: calendarEvent.recurrenceId }),
					progenitor.event.repeatRule.excludedDates,
					(left, right) => left.date.getTime() - right.date.getTime(),
					() => true,
				)
				if (!existingEvents.some((ev) => shallowIsSameEvent(ev, calendarEvent))) {
					alteredInstances.push({ event: calendarEvent, alarms })
				}
			} else if (calendarEvent.recurrenceId != null) {
				treatProgenitorExcludedDates(
					calendarEvent,
					getFromMap(rejectedEvents, EventImportRejectionReason.Duplicate, () => []),
				)

				if (!existingEvents.some((ev) => shallowIsSameEvent(ev, calendarEvent))) {
					alteredInstances.push({ event: calendarEvent, alarms })
				}
			}

			const rejectionReason = shouldBeSkipped(calendarEvent, instanceIdentifierToEventMap)
			if (rejectionReason != null) {
				getFromMap(rejectedEvents, rejectionReason, () => []).push(calendarEvent)
				continue
			}

			// hashedUid will be set later in calendarFacade to avoid importing the hash function here
			const repeatRule = calendarEvent.repeatRule
			calendarEvent._ownerGroup = calendarGroupRoot._id

			if (repeatRule != null && repeatRule.timeZone === "") {
				repeatRule.timeZone = getTimeZone()
			}

			assignEventId(calendarEvent, zone, calendarGroupRoot)
			if (calendarEvent.recurrenceId == null) {
				// the progenitor must be null here since we would have
				// rejected the second uid-progenitor event in shouldBeSkipped.
				progenitor = { event: calendarEvent, alarms }
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
		throw Error(`Tried to handle an excluded date without recurrence id`)
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

export function shallowIsSameEvent(eventA: CalendarEvent | IcsCalendarEvent, eventB: CalendarEvent | IcsCalendarEvent) {
	const sameUid = eventA.uid === eventB.uid
	const sameSequence = eventA.sequence === eventB.sequence
	const sameRecurrenceId = eventA.recurrenceId?.getTime() === eventB.recurrenceId?.getTime()

	return sameUid && sameSequence && sameRecurrenceId
}

export function eventHasSameFields(a: CalendarEvent, b: CalendarEvent) {
	const rruleA = a.repeatRule ? toStrippedRepeatRule(a.repeatRule) : null
	const rruleB = b.repeatRule ? toStrippedRepeatRule(b.repeatRule) : null
	const attendeesA = a.attendees.map(getStrippedClone)
	const attendeesB = b.attendees.map(getStrippedClone)
	const organizerA = a.organizer ? getStrippedClone(a.organizer) : null
	const organizerB = b.organizer ? getStrippedClone(b.organizer) : null

	return (
		a.startTime.valueOf() === b.startTime.valueOf() &&
		a.endTime.valueOf() === b.endTime.valueOf() &&
		deepEqual(attendeesA, attendeesB) &&
		a.summary === b.summary &&
		a.sequence === b.sequence &&
		a.location === b.location &&
		a.description === b.description &&
		deepEqual(organizerA, organizerB) &&
		deepEqual(rruleA, rruleB) &&
		a.recurrenceId?.valueOf() === b.recurrenceId?.valueOf()
	)
}

export function toStrippedRepeatRule(repeatRule: CalendarRepeatRule): StrippedRepeatRule {
	return {
		frequency: repeatRule.frequency ?? "",
		endType: repeatRule.endType ?? "",
		endValue: repeatRule.endValue ?? "",
		interval: repeatRule.interval ?? "",
		timeZone: repeatRule.timeZone ?? "",
		excludedDates: repeatRule.excludedDates.map(getStrippedClone),
		advancedRules: repeatRule.advancedRules.map(getStrippedClone),
	}
}
export function fromStrippedRepeatRule(repeatRule: StrippedRepeatRule): StrippedEntity<CalendarRepeatRule> {
	return {
		frequency: repeatRule.frequency ?? "",
		endType: repeatRule.endType ?? "",
		endValue: repeatRule.endValue ?? "",
		interval: repeatRule.interval ?? "",
		timeZone: repeatRule.timeZone ?? "",
		excludedDates: repeatRule.excludedDates.map(createDateWrapper),
		advancedRules: repeatRule.advancedRules.map(createAdvancedRepeatRule),
	}
}

export function fromStrippedCalendarEventAttendee(strippedCalendarEventAttendee: StrippedCalendarEventAttendee): StrippedEntity<CalendarEventAttendee> {
	return {
		address: createEncryptedMailAddress(strippedCalendarEventAttendee.address),
		status: strippedCalendarEventAttendee.status,
	}
}
