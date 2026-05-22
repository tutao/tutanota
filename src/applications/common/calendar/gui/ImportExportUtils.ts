import { Stripped, StrippedEntity } from "@tutao/meta"
import { AlarmInfoTemplate } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { assignEventId, CalendarEventValidity, checkEventValidity } from "../date/CalendarUtils.js"
import { assertValidURL, deepEqual, groupBy } from "@tutao/utils"
import { generateEventElementId } from "../../api/common/utils/CommonCalendarUtils.js"
import { parseCalendarEvents, parseICalendar } from "../../../calendar-app/calendar/export/CalendarParser.js"
import { lang, type TranslationKey } from "../../../../ui/utils/LanguageViewModel.js"
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
} from "@tutao/entities/tutanota"
import { createDateWrapper, DateWrapper } from "@tutao/entities/sys"

export enum EventImportRejectionReason {
	Pre1970,
	Inversed,
	InvalidDate,
	Duplicate,
	DuplicateInIcs,
}

export type EventAlarmInfoTemplatesTuple = {
	event: CalendarEvent
	alarmInfoTemplates: ReadonlyArray<AlarmInfoTemplate>
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
export type ParsedEventAlarmTuple = {
	icsCalendarEvent: IcsCalendarEvent
	alarms: Array<AlarmInfoTemplate>
}
export type ParsedCalendarData = {
	method: string
	contents: Array<ParsedEventAlarmTuple>
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

/**
 * Check multiple conditions to try to determine a rejection reason.
 **/
function determineRejectionReason(
	event: CalendarEvent,
	parsedEventUidGroup: Array<ParsedEventAlarmTuple>,
	existingEventUidGroup: Array<CalendarEvent>,
): EventImportRejectionReason | null {
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

	const isExistingDuplicate = existingEventUidGroup.some((ev) => shallowIsSameEvent(ev, event))
	const isExistingParsedEventDuplicate = parsedEventUidGroup.some((ev) => shallowIsSameEvent(ev.icsCalendarEvent, event))
	if (isExistingDuplicate) {
		return EventImportRejectionReason.Duplicate
	} else if (isExistingParsedEventDuplicate) {
		return EventImportRejectionReason.DuplicateInIcs
	}

	return null
}

/**
 * Creates identifier as either:
 *
 * "event.uid-progenitor" OR
 * "event.uid-{recurrenceTime}"
 *
 * This is used while checking for duplicates.  An event will be considered a duplicate when
 * the uid and recurrence-id are identical (or if uid and "progenitor" status are identical)
 *
 * we try to enforce that each calendar only contains each uid once, but we need to take into consideration
 * that altered instances have the same uid as their progenitor.
 * */
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

type SortedParsedEvents = {
	rejectedEvents: RejectedEvents
	eventsForCreation: Array<EventAlarmInfoTemplatesTuple>
}

/** Sort parsed events into event to create and rejected events with a rejection reason
 *
 * This function will assign event id according to the calendarGroupRoot and the long/short event list
 **/
export function sortOutParsedEvents(
	parsedEventAlarmTuples: ParsedEventAlarmTuple[],
	existingEvents: Array<CalendarEvent>,
	calendarGroupRoot: CalendarGroupRoot,
	zone: string,
): SortedParsedEvents {
	const result: SortedParsedEvents = { rejectedEvents: new Map(), eventsForCreation: [] }

	const parsedEventsGroupedByUid = groupBy(parsedEventAlarmTuples, (e) => e.icsCalendarEvent.uid)
	const existingEventsGroupedByUid = groupBy(existingEvents, (e) => e.uid)

	for (const [uid, parsedEventUidGroup] of parsedEventsGroupedByUid) {
		const existingEventsWithSameUid = existingEventsGroupedByUid.get(uid) ?? []

		for (let i = 0; i < parsedEventUidGroup.length; i++) {
			const { icsCalendarEvent, alarms } = parsedEventUidGroup[i]
			const calendarEvent = makeCalendarEventFromIcsCalendarEvent(icsCalendarEvent)

			const rejectionReason = determineRejectionReason(calendarEvent, parsedEventUidGroup.slice(i + 1), existingEventsWithSameUid)
			if (rejectionReason != null) {
				const rejectedEventsForTheSameReason = result.rejectedEvents.get(rejectionReason) ?? []
				rejectedEventsForTheSameReason.push(calendarEvent)
				result.rejectedEvents.set(rejectionReason, rejectedEventsForTheSameReason)
				continue
			}

			for (let alarmInfo of alarms) {
				alarmInfo.alarmIdentifier = generateEventElementId(Date.now())
			}
			calendarEvent._ownerGroup = calendarGroupRoot._id
			assignEventId(calendarEvent, zone, calendarGroupRoot)
			result.eventsForCreation.push({ event: calendarEvent, alarmInfoTemplates: alarms })
		}
	}

	return result
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

export function createStrippedRepeatRule(repeatRule: CalendarRepeatRule | null): StrippedRepeatRule | null {
	if (!repeatRule) {
		return null
	}
	return {
		frequency: repeatRule.frequency,
		endType: repeatRule.endType,
		endValue: repeatRule.endValue,
		interval: repeatRule.interval,
		timeZone: repeatRule.timeZone,
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

export function fromStrippedRepeatRule(repeatRule: StrippedRepeatRule): StrippedEntity<CalendarRepeatRule> {
	return {
		frequency: repeatRule.frequency,
		endType: repeatRule.endType,
		endValue: repeatRule.endValue,
		interval: repeatRule.interval,
		timeZone: repeatRule.timeZone,
		excludedDates: repeatRule.excludedDates.map(function (values: StrippedEntity<DateWrapper>): DateWrapper {
			return createDateWrapper(values)
		}),
		advancedRules: repeatRule.advancedRules.map(function (values): AdvancedRepeatRule {
			return createAdvancedRepeatRule(values)
		}),
	}
}

export function fromStrippedCalendarEventAttendee(strippedCalendarEventAttendee: StrippedCalendarEventAttendee): StrippedEntity<CalendarEventAttendee> {
	return {
		address: createEncryptedMailAddress(strippedCalendarEventAttendee.address),
		status: strippedCalendarEventAttendee.status,
	}
}
