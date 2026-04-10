import o from "@tutao/otest"

import { createTestEntity } from "../../TestUtils"
import { CalendarAttendeeStatus, EndType, RepeatPeriod } from "@tutao/app-env"
import {
	eventHasSameFields,
	IcsCalendarEvent,
	makeCalendarEventFromIcsCalendarEvent,
	StrippedRepeatRule,
} from "../../../../src/common/calendar/gui/ImportExportUtils"
import { object } from "testdouble"
import { clone } from "@tutao/utils"
import { sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"

o.spec("ImportExportUtilsTest", function () {
	o.spec("makeCalendarEventFromIcsCalendarEvent", function () {
		let icsEvent: IcsCalendarEvent

		o.beforeEach(function () {
			icsEvent = {
				summary: "Summary",
				description: "",
				startTime: object<Date>(),
				endTime: object<Date>(),
				location: "place",
				uid: "uid",
				sequence: "0",
				recurrenceId: null,
				repeatRule: null,
				attendees: null,
				organizer: null,
			}
		})

		o.test("simple event", function () {
			const calendarEvent = makeCalendarEventFromIcsCalendarEvent(icsEvent)

			o.check(calendarEvent.summary).equals(icsEvent.summary)
			o.check(calendarEvent.description).equals(icsEvent.description)
			o.check(calendarEvent.startTime).equals(icsEvent.startTime)
			o.check(calendarEvent.endTime).equals(icsEvent.endTime)
			o.check(calendarEvent.location).equals(icsEvent.location)
			o.check(calendarEvent.uid).equals(icsEvent.uid)
			o.check(calendarEvent.sequence).equals(icsEvent.sequence)
			o.check(calendarEvent.recurrenceId).equals(icsEvent.recurrenceId)
			o.check(calendarEvent.repeatRule).equals(null)
			o.check(calendarEvent.attendees.length).equals(0) // attendees cannot be null on CalendarEvent
			o.check(calendarEvent.organizer).equals(null)
		})

		o.spec("events with repeat rules", function () {
			let strippedRepeatRule: StrippedRepeatRule

			o.beforeEach(function () {
				strippedRepeatRule = {
					frequency: RepeatPeriod.DAILY,
					endType: EndType.Never,
					endValue: null,
					interval: "1",
					timeZone: "", // ?? what is the valid format?
					excludedDates: [],
					advancedRules: [],
				}
			})

			o.test("event with simple repeat rule", function () {
				icsEvent.repeatRule = strippedRepeatRule

				const calendarEvent: tutanotaTypeRefs.CalendarEvent = makeCalendarEventFromIcsCalendarEvent(icsEvent)

				o.check(calendarEvent.repeatRule?.frequency).equals(RepeatPeriod.DAILY)
				o.check(calendarEvent.repeatRule?.endType).equals(EndType.Never)
				o.check(calendarEvent.repeatRule?.endValue).equals(null)
				o.check(calendarEvent.repeatRule?.interval).equals("1")
				o.check(calendarEvent.repeatRule?.timeZone).equals(strippedRepeatRule.timeZone)
				o.check(calendarEvent.repeatRule?.excludedDates.length).equals(0)
				o.check(calendarEvent.repeatRule?.advancedRules.length).equals(0)
			})
		})
	})

	o.spec("eventHasSameFields", function () {
		let eventA: tutanotaTypeRefs.CalendarEvent
		let eventB: tutanotaTypeRefs.CalendarEvent
		o.beforeEach(() => {
			eventA = createTestEntity(tutanotaTypeRefs.CalendarEventTypeRef, {
				_id: ["listId", "eventId"],
				uid: "someUid",
				startTime: new Date(),
				endTime: new Date(),
				description: "some description",
				summary: "v1",
				attendees: [
					createTestEntity(tutanotaTypeRefs.CalendarEventAttendeeTypeRef, {
						address: createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef, {
							address: "guestAddress1",
							name: "guestName1",
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
					createTestEntity(tutanotaTypeRefs.CalendarEventAttendeeTypeRef, {
						address: createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef, {
							address: "guestAddress2",
							name: "guestName2",
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
				],
				alarmInfos: [["listId", "elementId"]],
				organizer: createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef, {
					address: "organizerAddress",
					name: "organizerName3",
				}),
			})
			eventB = structuredClone(eventA)
		})
		o.test("calendar events A and B are identical", function () {
			o.check(eventHasSameFields(eventA, eventB)).equals(true)
		})
		o.test("calendar events A are B same if ids do not match", function () {
			eventA._id = ["listId", "elementId"]
			o.check(eventHasSameFields(eventA, eventB)).equals(true)
		})
		o.test("calendar events A are B same if _original do not match", function () {
			const originalA = structuredClone(eventA)
			originalA.uid = "differentUid"
			const originalB = structuredClone(eventB)
			eventA._original = originalA
			eventB._original = originalB
			o.check(eventHasSameFields(eventA, eventB)).equals(true)
		})
		o.test("calendar events A are B same if _errors do not match", function () {
			eventA._errors = { someErrorKey: "someError" }
			eventB._errors = { someErrorKey: "someError" }
			o.check(eventHasSameFields(eventA, eventB)).equals(true)
		})
		o.test("calendar events A are B same if aggregatedIds do not match", function () {
			eventA.organizer!._id = "newId"
			eventB.attendees.map((attendee) => {
				attendee._id = "newId"
			})
			o.check(eventHasSameFields(eventA, eventB)).equals(true)
		})

		o.test("calendar events are the same even if aggregated _type for nested aggregates do not match", function () {
			eventA.repeatRule = createTestEntity(tutanotaTypeRefs.CalendarRepeatRuleTypeRef)
			eventA.repeatRule.advancedRules = [createTestEntity(tutanotaTypeRefs.AdvancedRepeatRuleTypeRef)]

			eventB.repeatRule = clone(eventA.repeatRule)
			eventB.repeatRule._type = sysTypeRefs.RepeatRuleTypeRef
			eventB.repeatRule.advancedRules[0]._type = sysTypeRefs.CalendarAdvancedRepeatRuleTypeRef
			o.check(eventHasSameFields(eventA, eventB)).equals(true)
		})

		o.test("calendar events A are B NOT same if attendees sorting is different", function () {
			eventB.attendees = eventB.attendees.reverse()
			o.check(eventHasSameFields(eventA, eventB)).equals(false)
		})
		o.test("calendar events A and B are NOT same if non technical field organizer name changes", function () {
			eventA.organizer!.name = "newName"
			o.check(eventHasSameFields(eventA, eventB)).equals(false)
		})
		o.test("calendar events A and B are NOT same if non technical field attendees status changes", function () {
			eventB.attendees.map((attendee) => {
				attendee.status = CalendarAttendeeStatus.ADDED
			})
			o.check(eventHasSameFields(eventA, eventB)).equals(false)
		})
		o.test("calendar events A and B are NOT same if non technical field summary changes", function () {
			eventB.summary = "newSummary"
			o.check(eventHasSameFields(eventA, eventB)).equals(false)
		})
		o.test("calendar events A and B are NOT same if non technical field startTime changes", function () {
			const newStartTime = new Date()
			newStartTime.setTime(122342)
			eventB.startTime = newStartTime
			o.check(eventHasSameFields(eventA, eventB)).equals(false)
		})
		o.test("calendar events A and B are NOT same if non technical field endTime changes", function () {
			const newEndTime = new Date()
			newEndTime.setTime(122342)
			eventA.endTime = newEndTime
			o.check(eventHasSameFields(eventA, eventB)).equals(false)
		})
		o.spec("repeatRule comparisons", function () {
			let repeatRule: tutanotaTypeRefs.CalendarRepeatRule

			o.beforeEach(function () {
				repeatRule = {
					frequency: RepeatPeriod.DAILY,
					endType: EndType.Never,
					endValue: null,
					interval: "1",
					timeZone: "",
					excludedDates: [],
					advancedRules: [],
					_id: object(),
					_original: object(),
					_type: tutanotaTypeRefs.CalendarRepeatRuleTypeRef,
				}
			})

			o.test("comparing events with identical simple repeat rules returns true", function () {
				eventA.repeatRule = Object.assign({}, repeatRule)
				eventB.repeatRule = Object.assign({}, repeatRule)

				o.check(eventHasSameFields(eventA, eventB)).equals(true)
			})
		})
	})
})
