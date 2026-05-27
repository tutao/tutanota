import { AlarmInfoTemplate } from "../../api/worker/facades/lazy/CalendarFacade.js"
import {
	AdvancedRepeatRule,
	CalendarEvent,
	CalendarEventAttendee,
	CalendarRepeatRule,
	createAdvancedRepeatRule,
	createCalendarEvent,
	createCalendarEventAttendee,
	createCalendarRepeatRule,
	createEncryptedMailAddress,
	EncryptedMailAddress,
} from "@tutao/entities/tutanota"
import { Stripped, StrippedEntity } from "@tutao/meta"
import { createDateWrapper, DateWrapper } from "@tutao/entities/sys"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { assertValidURL, deepEqual } from "@tutao/utils"
import { IcsCalendarEvent, StrippedCalendarEventAttendee, StrippedRepeatRule } from "../../../calendar-app/calendar/export/CalendarParser"

export type EventAlarmInfoTemplatesTuple = {
	event: CalendarEvent
	alarmInfoTemplates: ReadonlyArray<AlarmInfoTemplate>
}

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
