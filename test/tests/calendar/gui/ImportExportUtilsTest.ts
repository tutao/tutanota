import o from "@tutao/otest"
import {
	AdvancedRepeatRuleTypeRef,
	CalendarEvent,
	CalendarEventAttendeeTypeRef,
	CalendarEventTypeRef,
	CalendarRepeatRuleTypeRef,
	EncryptedMailAddressTypeRef,
} from "../../../../src/common/api/entities/tutanota/TypeRefs"
import { createTestEntity } from "../../TestUtils"
import { CalendarAttendeeStatus } from "../../../../src/common/api/common/TutanotaConstants"
import { eventHasSameFields } from "../../../../src/common/calendar/gui/ImportExportUtils"
import { clone } from "@tutao/tutanota-utils"
import { CalendarAdvancedRepeatRuleTypeRef, RepeatRuleTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs"

o.spec("ImportExportUtilsTest", function () {
	o.spec("calendar events have same fields", function () {
		let eventA: CalendarEvent
		let eventB: CalendarEvent
		o.beforeEach(() => {
			eventA = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "eventId"],
				uid: "someUid",
				startTime: new Date(),
				endTime: new Date(),
				description: "some description",
				summary: "v1",
				attendees: [
					createTestEntity(CalendarEventAttendeeTypeRef, {
						address: createTestEntity(EncryptedMailAddressTypeRef, {
							address: "guestAddress1",
							name: "guestName1",
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
					createTestEntity(CalendarEventAttendeeTypeRef, {
						address: createTestEntity(EncryptedMailAddressTypeRef, {
							address: "guestAddress2",
							name: "guestName2",
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
				],
				alarmInfos: [["listId", "elementId"]],
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
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
			eventA.repeatRule = createTestEntity(CalendarRepeatRuleTypeRef)
			eventA.repeatRule.advancedRules = [createTestEntity(AdvancedRepeatRuleTypeRef)]

			eventB.repeatRule = clone(eventA.repeatRule) // from tutanota
			eventB.repeatRule._type = RepeatRuleTypeRef // from sys
			eventB.repeatRule.advancedRules[0]._type = CalendarAdvancedRepeatRuleTypeRef // from sys
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
	})
})
