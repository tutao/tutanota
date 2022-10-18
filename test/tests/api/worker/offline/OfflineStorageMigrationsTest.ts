import o from "ospec"
import {OfflineStorage} from "../../../../../src/api/worker/offline/OfflineStorage.js"
import {object, when, matchers} from "testdouble"
import {GiftCard, GiftCardTypeRef} from "../../../../../src/api/entities/sys/TypeRefs.js"
import {booleanToNumberValue, migrateAllListElements, renameAttribute} from "../../../../../src/api/worker/offline/StandardMigrations.js"
import {verify} from "@tutao/tutanota-test-utils"
import {CalendarEvent, CalendarEventTypeRef, createCalendarEvent} from "../../../../../src/api/entities/tutanota/TypeRefs"
import {repair1} from "../../../../../src/api/worker/offline/migrations/repair-v1"

const {anything} = matchers

o.spec("OfflineStorageMigrations", function () {
	o.spec("migrateAllListElements", function () {
		o("should run migrations in the correct order on all entities", async function () {
			const storageMock = object<OfflineStorage>()

			when(storageMock.getListElementsOfType(GiftCardTypeRef)).thenResolve([
				{message: "A"},
				{message: "B"},
				{message: "C"},
			] as GiftCard[])

			await migrateAllListElements(GiftCardTypeRef, storageMock, [
				(card) => {
					card.message = card.message + "1"
					return card
				},
				(card) => {
					card.message = card.message + "2"
					return card
				},
				(card) => {
					card.message = card.message + "3"
					return card
				},
			])

			verify(storageMock.put({message: "A123"} as GiftCard))
			verify(storageMock.put({message: "B123"} as GiftCard))
			verify(storageMock.put({message: "C123"} as GiftCard))

		})

	})
	o.spec("migrations", function () {
		o("should rename 'oldAttribute' to 'newAttribute' and ignore other attributes", function () {
			o(renameAttribute<any>("oldAttribute", "newAttribute")({oldAttribute: "value of attribute", ignoreMe: "doing nothing"}))
				.deepEquals({newAttribute: "value of attribute", ignoreMe: "doing nothing"})
		})

		o("should convert true to '1' and ignore other attributes", function () {
			o(booleanToNumberValue<any>("attr")({attr: true, ignoreMe: "doing nothing"}))
				.deepEquals({attr: '1', ignoreMe: "doing nothing"})
		})

		o("should convert false to '0' and ignore other attributes", function () {
			o(booleanToNumberValue<any>("attr")({attr: false, ignoreMe: "doing nothing"}))
				.deepEquals({attr: '0', ignoreMe: "doing nothing"})
		})
	})
	o.spec("repairMigrations", function () {
		o("calendar only contains events after 1970, therefor no migrations is needed", async function () {
			let storageMock: OfflineStorage = object()
			const normalEvent: CalendarEvent = createCalendarEvent({
				startTime: new Date("1971"),
				endTime: new Date("1990"),
				_id: ["validListID", "someEventID"]
			})
			when(storageMock.getListElementsOfType(
				CalendarEventTypeRef
			)).thenResolve([normalEvent])
			await repair1.migrate(storageMock)

			verify(storageMock.deleteRange(
				anything(),
				anything()
			), {times: 0})
		})
		o("calendar contains edge case event with 1970 as start date and should be migrated", async function () {
			let storageMock: OfflineStorage = object()
			const invalidEvent: CalendarEvent = createCalendarEvent({
				startTime: new Date("1970"),
				endTime: new Date("1990"),
				_id: ["invalidListID", "someEventID"]
			})
			when(storageMock.getListElementsOfType(
				CalendarEventTypeRef
			)).thenResolve([invalidEvent])
			await repair1.migrate(storageMock)

			verify(storageMock.deleteRange(
				CalendarEventTypeRef,
				"invalidListID"
			), {times: 1})
		})
		o("two listIDs, one with valid events the other one with invalid events -> only one list should be deleted", async function () {
			let storageMock: OfflineStorage = object()
			const normalEvent: CalendarEvent = createCalendarEvent({
				startTime: new Date("1971"),
				endTime: new Date("1990"),
				_id: ["invalidListID", "someEventID"]
			})
			const invalidEvent: CalendarEvent = createCalendarEvent({
				startTime: new Date("1970"),
				endTime: new Date("1970"),
				_id: ["invalidListID", "otherEventID"]
			})
			const normalEvent2: CalendarEvent = createCalendarEvent({
				startTime: new Date("2000"),
				endTime: new Date("2022"),
				_id: ["validListID", "EventID"]
			})
			when(storageMock.getListElementsOfType(
				CalendarEventTypeRef
			)).thenResolve([normalEvent, invalidEvent, normalEvent2])
			await repair1.migrate(storageMock)

			verify(storageMock.deleteRange(
				CalendarEventTypeRef,
				"invalidListID"
			), {times: 1})
			verify(storageMock.deleteRange(
				CalendarEventTypeRef,
				"validListID"
			), {times: 0})
		})
	})
})
