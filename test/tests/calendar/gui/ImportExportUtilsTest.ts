import o from "@tutao/otest"
import {
	CalendarEvent,
	CalendarEventAttendeeTypeRef,
	CalendarEventTypeRef,
	EncryptedMailAddressTypeRef,
} from "../../../../src/common/api/entities/tutanota/TypeRefs"
import { createTestEntity } from "../../TestUtils"
import { CalendarAttendeeStatus } from "../../../../src/common/api/common/TutanotaConstants"
import { eventHasSameFields } from "../../../../src/common/calendar/gui/ImportExportUtils"

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
		o.test("calendar events A are B same if aggregatedIds do not match", function () {
			eventA.organizer!._id = "newId"
			eventB.attendees.map((attendee) => {
				attendee._id = "newId"
			})
			o.check(eventHasSameFields(eventA, eventB)).equals(true)
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
