import o, { assertThrows } from "@tutao/otest"
import { CalendarModel } from "../../../../src/applications/calendar-app/calendar/model/CalendarModel"
import { EventSeriesResolver } from "../../../../src/applications/common/calendar/import/EventSeriesResolver"
import { CalendarEventTypeRef, CalendarRepeatRuleTypeRef } from "@tutao/entities/tutanota"
import { createTestEntity } from "../../TestUtils"
import { createDateWrapper } from "@tutao/entities/sys"
import { RepeatPeriod, TutanotaError } from "../../../../src/platform-kit/app-env"
import { clone } from "../../../../src/platform-kit/meta"
import { matchers, object, verify, when } from "testdouble"
import { DateTime } from "luxon"
import { CalendarEventAlteredInstance, CalendarEventProgenitor } from "../../../../src/applications/common/api/worker/facades/lazy/CalendarFacade"
import { DateProvider, first } from "../../../../src/platform-kit/utils"

const { anything } = matchers
o.spec("EventSeriesResolver", function () {
	let mockCalendarModel: CalendarModel
	let eventSeriesResolver: EventSeriesResolver

	const mockDateProvider: DateProvider = object({
		now(): number {
			return 0
		},
		timeZone(): string {
			return "Europe/Berlin"
		},
	})
	const calendarGroupId: string = "calendarGroupId"

	o.beforeEach(function () {
		mockCalendarModel = object()
		eventSeriesResolver = new EventSeriesResolver(mockCalendarModel, mockDateProvider)
	})

	o.spec("updateExistingProgenitorForNewAlteredInstances", function () {
		let existingProgenitor: CalendarEventProgenitor
		const startTime: DateTime = DateTime.fromObject({ year: 2026, month: 6, day: 1, hour: 10 }).setZone(mockDateProvider.timeZone())

		o.beforeEach(function () {
			existingProgenitor = createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarGroupId,
				uid: "progenitorUid",
				summary: "Event Series",
				startTime: startTime.toJSDate(),
				endTime: startTime.plus({ hour: 3 }).toJSDate(),
			}) as CalendarEventProgenitor
			existingProgenitor.repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				timeZone: mockDateProvider.timeZone(),
			})

			when(mockCalendarModel.resolveCalendarEventProgenitor({ uid: existingProgenitor.uid, _ownerGroup: existingProgenitor._ownerGroup })).thenResolve(
				existingProgenitor as CalendarEventProgenitor,
			)
		})

		o.test("should not update existing progenitor when there are no altered instances", async function () {
			const result = await eventSeriesResolver.updateExistingProgenitorForNewAlteredInstances([], calendarGroupId)
			verify(mockCalendarModel.doUpdateEvent(anything(), anything()), { times: 0 })
			o.check(result.length).equals(0)
		})

		o.test("should no-op when altered instance has no existing progenitor", async function () {
			const noProgenitorAlteredInstance = createTestEntity(CalendarEventTypeRef, {
				uid: "noProgenitor",
				recurrenceId: DateTime.fromJSDate(existingProgenitor.startTime).plus({ day: 1 }).toJSDate(),
			})

			const result = await eventSeriesResolver.updateExistingProgenitorForNewAlteredInstances([noProgenitorAlteredInstance], calendarGroupId)

			verify(mockCalendarModel.doUpdateEvent(anything(), anything()), { times: 0 })
			o.check(result.length).equals(0)
		})

		o.test("throws error if given altered instance with null uid", async function () {
			const nullUidAlteredInstance = createTestEntity(CalendarEventTypeRef, { uid: null }) as CalendarEventAlteredInstance

			await assertThrows(TutanotaError, () =>
				eventSeriesResolver.updateExistingProgenitorForNewAlteredInstances([nullUidAlteredInstance], calendarGroupId),
			)
		})

		o.test("throws error if no altered instances provided with progenitor uid", async function () {
			// if this ever happens something is very wrong with indexing or looking up in indexes
			const alteredInstance = createTestEntity(CalendarEventTypeRef, { uid: "normalUid" })
			when(mockCalendarModel.resolveCalendarEventProgenitor({ uid: alteredInstance.uid, _ownerGroup: calendarGroupId })).thenResolve(
				createTestEntity(CalendarEventTypeRef, { uid: "veryWrong" }) as CalendarEventProgenitor,
			)
			await assertThrows(Error, () => eventSeriesResolver.updateExistingProgenitorForNewAlteredInstances([alteredInstance], calendarGroupId))
		})

		o.test("should add altered instances as excluded dates and update progenitor", async function () {
			const holidayAlteredInstance: CalendarEventAlteredInstance = createTestEntity(CalendarEventTypeRef, {
				uid: existingProgenitor.uid,
				summary: "Holiday",
				recurrenceId: DateTime.fromJSDate(existingProgenitor.startTime).plus({ day: 1 }).toJSDate(),
			}) as CalendarEventAlteredInstance
			const specialMeetingAlteredInstance: CalendarEventAlteredInstance = createTestEntity(CalendarEventTypeRef, {
				uid: existingProgenitor.uid,
				summary: "Special Meeting",
				recurrenceId: DateTime.fromJSDate(existingProgenitor.startTime).plus({ day: 2 }).toJSDate(),
			}) as CalendarEventAlteredInstance
			const alteredInstances = [holidayAlteredInstance, specialMeetingAlteredInstance]

			const progenitorWithNewExcludedDates: CalendarEventProgenitor = clone(existingProgenitor) as CalendarEventProgenitor
			progenitorWithNewExcludedDates.repeatRule!.excludedDates = alteredInstances.map((alteredInstance) =>
				createDateWrapper({ date: alteredInstance.recurrenceId }),
			)
			when(mockCalendarModel.doUpdateEvent(existingProgenitor, progenitorWithNewExcludedDates)).thenResolve(progenitorWithNewExcludedDates)

			const updatedProgenitors = await eventSeriesResolver.updateExistingProgenitorForNewAlteredInstances(alteredInstances, calendarGroupId)

			verify(mockCalendarModel.doUpdateEvent(existingProgenitor, progenitorWithNewExcludedDates), { times: 1 })
			o.check(updatedProgenitors.length).equals(1)
			o.check(first(updatedProgenitors)).deepEquals(progenitorWithNewExcludedDates)
		})

		o.test("should add new altered instances to existing excluded dates and update progenitor", async function () {
			existingProgenitor.repeatRule!.excludedDates = [createDateWrapper({ date: existingProgenitor.startTime })]

			const holidayAlteredInstance: CalendarEventAlteredInstance = createTestEntity(CalendarEventTypeRef, {
				uid: existingProgenitor.uid,
				summary: "Holiday",
				recurrenceId: DateTime.fromJSDate(existingProgenitor.startTime).plus({ day: 1 }).toJSDate(),
			}) as CalendarEventAlteredInstance

			const progenitorWithNewExcludedDates: CalendarEventProgenitor = clone(existingProgenitor) as CalendarEventProgenitor
			progenitorWithNewExcludedDates.repeatRule!.excludedDates.push(createDateWrapper({ date: holidayAlteredInstance.recurrenceId }))
			when(mockCalendarModel.doUpdateEvent(existingProgenitor, progenitorWithNewExcludedDates)).thenResolve(progenitorWithNewExcludedDates)

			const updatedProgenitors = await eventSeriesResolver.updateExistingProgenitorForNewAlteredInstances([holidayAlteredInstance], calendarGroupId)

			verify(mockCalendarModel.doUpdateEvent(existingProgenitor, progenitorWithNewExcludedDates), { times: 1 })
			o.check(updatedProgenitors.length).equals(1)
			o.check(first(updatedProgenitors)).deepEquals(progenitorWithNewExcludedDates)
		})

		o.test("should add altered instances to its correct progenitor and update them", async function () {
			const existingProgenitor2 = clone(existingProgenitor)
			existingProgenitor2.uid = "existingProgenitor2Uid"

			const holidayAlteredInstance: CalendarEventAlteredInstance = createTestEntity(CalendarEventTypeRef, {
				uid: existingProgenitor.uid,
				summary: "Holiday",
				recurrenceId: DateTime.fromJSDate(existingProgenitor.startTime).plus({ day: 1 }).toJSDate(),
			}) as CalendarEventAlteredInstance

			const specialMeetingAlteredInstance: CalendarEventAlteredInstance = createTestEntity(CalendarEventTypeRef, {
				uid: existingProgenitor2.uid,
				summary: "Special Meeting",
				recurrenceId: DateTime.fromJSDate(existingProgenitor2.startTime).plus({ day: 2 }).toJSDate(),
			}) as CalendarEventAlteredInstance

			const alteredInstances = [holidayAlteredInstance, specialMeetingAlteredInstance]

			const progenitorWithNewExcludedDates: CalendarEventProgenitor = clone(existingProgenitor) as CalendarEventProgenitor
			progenitorWithNewExcludedDates.repeatRule!.excludedDates = [createDateWrapper({ date: holidayAlteredInstance.recurrenceId })]
			when(mockCalendarModel.doUpdateEvent(existingProgenitor, progenitorWithNewExcludedDates)).thenResolve(progenitorWithNewExcludedDates)

			const progenitor2WithNewExcludedDates: CalendarEventProgenitor = clone(existingProgenitor2) as CalendarEventProgenitor
			progenitor2WithNewExcludedDates.repeatRule!.excludedDates = [createDateWrapper({ date: specialMeetingAlteredInstance.recurrenceId })]
			when(mockCalendarModel.doUpdateEvent(existingProgenitor2, progenitor2WithNewExcludedDates)).thenResolve(progenitor2WithNewExcludedDates)

			when(mockCalendarModel.resolveCalendarEventProgenitor({ uid: existingProgenitor2.uid, _ownerGroup: existingProgenitor2._ownerGroup })).thenResolve(
				existingProgenitor2 as CalendarEventProgenitor,
			)

			const updatedProgenitors = await eventSeriesResolver.updateExistingProgenitorForNewAlteredInstances(alteredInstances, calendarGroupId)

			verify(mockCalendarModel.doUpdateEvent(existingProgenitor, progenitorWithNewExcludedDates), { times: 1 })
			verify(mockCalendarModel.doUpdateEvent(existingProgenitor2, progenitor2WithNewExcludedDates), { times: 1 })
			o.check(updatedProgenitors.length).equals(2)
			o.check(updatedProgenitors).deepEquals([progenitorWithNewExcludedDates, progenitor2WithNewExcludedDates])
		})
	})

	o.spec("resolveAllExcludedDatesForNewProgenitors", function () {
		o.test("should no-op when there are no new progenitors", async function () {
			const newAlteredInstance = createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarGroupId,
				recurrenceId: new Date(),
			}) as CalendarEventAlteredInstance

			await eventSeriesResolver.resolveAllExcludedDatesForNewProgenitors([], [newAlteredInstance], calendarGroupId)

			verify(mockCalendarModel.getEventsByUid(anything(), anything()), { times: 0 })
		})

		o.test("should no-op when new altered instances does not belong to new progenitors", async function () {
			const newProgenitor = createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarGroupId,
				uid: "progenitorUid",
				repeatRule: createTestEntity(CalendarRepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
					timeZone: mockDateProvider.timeZone(),
					excludedDates: [],
				}),
			}) as CalendarEventProgenitor
			const newAlteredInstance = createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarGroupId,
				uid: "differentUid",
				recurrenceId: new Date(),
			}) as CalendarEventAlteredInstance

			await eventSeriesResolver.resolveAllExcludedDatesForNewProgenitors([newProgenitor], [newAlteredInstance], calendarGroupId)

			verify(mockCalendarModel.getEventsByUid(newProgenitor.uid, calendarGroupId), { times: 1 })
			o.check(newProgenitor.repeatRule!.excludedDates.length).equals(0)
		})

		o.test("should add existing altered instance to new progenitor", async function () {
			const newProgenitor = createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarGroupId,
				uid: "progenitorUid",
				repeatRule: createTestEntity(CalendarRepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
					timeZone: mockDateProvider.timeZone(),
				}),
			}) as CalendarEventProgenitor
			const existingAlteredInstance = createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarGroupId,
				uid: newProgenitor.uid,
				recurrenceId: new Date(),
			}) as CalendarEventAlteredInstance

			when(mockCalendarModel.getEventsByUid(newProgenitor.uid, newProgenitor._ownerGroup!)).thenResolve({
				ownerGroup: calendarGroupId,
				progenitor: null,
				alteredInstances: [existingAlteredInstance],
			})

			await eventSeriesResolver.resolveAllExcludedDatesForNewProgenitors([newProgenitor], [], calendarGroupId)

			verify(mockCalendarModel.getEventsByUid(newProgenitor.uid, newProgenitor._ownerGroup!), { times: 1 })
			o.check(newProgenitor.repeatRule?.excludedDates).deepEquals([createDateWrapper({ date: existingAlteredInstance.recurrenceId })])
		})

		o.test("should add new altered instance to new progenitor", async function () {
			const newProgenitor = createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarGroupId,
				uid: "progenitorUid",
				repeatRule: createTestEntity(CalendarRepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
					timeZone: mockDateProvider.timeZone(),
				}),
			}) as CalendarEventProgenitor
			const newAlteredInstance = createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarGroupId,
				uid: newProgenitor.uid,
				recurrenceId: new Date(),
			}) as CalendarEventAlteredInstance

			when(mockCalendarModel.getEventsByUid(newProgenitor.uid, newProgenitor._ownerGroup!)).thenResolve(null)

			await eventSeriesResolver.resolveAllExcludedDatesForNewProgenitors([newProgenitor], [newAlteredInstance], calendarGroupId)

			verify(mockCalendarModel.getEventsByUid(newProgenitor.uid, newProgenitor._ownerGroup!), { times: 1 })
			o.check(newProgenitor.repeatRule?.excludedDates).deepEquals([createDateWrapper({ date: newAlteredInstance.recurrenceId })])
		})

		o.test("should merge new altered instance with existing altered instance", async function () {
			const newProgenitor = createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarGroupId,
				uid: "progenitorUid",
				repeatRule: createTestEntity(CalendarRepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
					timeZone: mockDateProvider.timeZone(),
				}),
			}) as CalendarEventProgenitor
			const existingAlteredInstance = createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarGroupId,
				uid: newProgenitor.uid,
				recurrenceId: new Date(2026, 5, 1),
			}) as CalendarEventAlteredInstance

			const newAlteredInstance = createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarGroupId,
				uid: newProgenitor.uid,
				recurrenceId: new Date(2026, 5, 2),
			}) as CalendarEventAlteredInstance

			when(mockCalendarModel.getEventsByUid(newProgenitor.uid, newProgenitor._ownerGroup!)).thenResolve({
				ownerGroup: calendarGroupId,
				progenitor: null,
				alteredInstances: [existingAlteredInstance],
			})

			await eventSeriesResolver.resolveAllExcludedDatesForNewProgenitors([newProgenitor], [newAlteredInstance], calendarGroupId)

			verify(mockCalendarModel.getEventsByUid(newProgenitor.uid, newProgenitor._ownerGroup!), { times: 1 })
			o.check(newProgenitor.repeatRule?.excludedDates).deepEquals([
				createDateWrapper({ date: existingAlteredInstance.recurrenceId }),
				createDateWrapper({ date: newAlteredInstance.recurrenceId }),
			])
		})

		o.test("should assign excluded dates to correct progenitors", async function () {
			const baseDate = DateTime.fromObject({ year: 1993, month: 5, day: 12, hour: 12 })

			const progenitor1 = createTestEntity(CalendarEventTypeRef, {
				uid: "uid1",
				_ownerGroup: calendarGroupId,
				startTime: baseDate.toJSDate(),
				endTime: clone(baseDate).plus({ hours: 1 }).toJSDate(),
				repeatRule: createTestEntity(CalendarRepeatRuleTypeRef, { frequency: RepeatPeriod.DAILY, interval: "1" }),
			}) as CalendarEventProgenitor
			const progenitor2 = clone(progenitor1)
			progenitor2.uid = "uid2"

			const iCalAlteredInstanceP1 = createTestEntity(CalendarEventTypeRef, {
				uid: progenitor1.uid,
				recurrenceId: clone(baseDate).plus({ day: 1 }).toJSDate(),
			}) as CalendarEventAlteredInstance

			const iCalAlteredInstanceP2 = createTestEntity(CalendarEventTypeRef, {
				uid: progenitor2.uid,
				recurrenceId: clone(baseDate).plus({ day: 1 }).toJSDate(),
			}) as CalendarEventAlteredInstance

			const dbAlteredInstanceP1 = createTestEntity(CalendarEventTypeRef, {
				uid: progenitor1.uid,
				recurrenceId: clone(baseDate).plus({ day: 2 }).toJSDate(),
			}) as CalendarEventAlteredInstance

			const dbAlteredInstanceP2 = createTestEntity(CalendarEventTypeRef, {
				uid: progenitor2.uid,
				recurrenceId: clone(baseDate).plus({ day: 2 }).toJSDate(),
			}) as CalendarEventAlteredInstance

			when(mockCalendarModel.getEventsByUid(progenitor1.uid, calendarGroupId)).thenResolve({
				ownerGroup: calendarGroupId,
				progenitor: null,
				alteredInstances: [dbAlteredInstanceP1],
			})

			when(mockCalendarModel.getEventsByUid(progenitor2.uid, calendarGroupId)).thenResolve({
				ownerGroup: calendarGroupId,
				progenitor: null,
				alteredInstances: [dbAlteredInstanceP2],
			})

			await eventSeriesResolver.resolveAllExcludedDatesForNewProgenitors(
				[progenitor1, progenitor2],
				[iCalAlteredInstanceP1, iCalAlteredInstanceP2],
				calendarGroupId,
			)

			const p1Dates = progenitor1.repeatRule!.excludedDates.map((dateWrapper) => dateWrapper.date.getTime())
			const p2Dates = progenitor2.repeatRule!.excludedDates.map((dateWrapper) => dateWrapper.date.getTime())

			o.check(p1Dates.length).equals(2)
			o.check(p2Dates.length).equals(2)

			o.check(p1Dates.includes(iCalAlteredInstanceP1.recurrenceId.getTime())).equals(true)
			o.check(p1Dates.includes(dbAlteredInstanceP1.recurrenceId.getTime())).equals(true)
			o.check(p2Dates.includes(iCalAlteredInstanceP2.recurrenceId.getTime())).equals(true)
			o.check(p2Dates.includes(dbAlteredInstanceP2.recurrenceId.getTime())).equals(true)
		})

		o.test("throws error if inputs contain multiple progenitors with same uid", async function () {
			const newProgenitor = createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarGroupId,
				uid: "progenitorUid",
				repeatRule: createTestEntity(CalendarRepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
					timeZone: mockDateProvider.timeZone(),
					excludedDates: [],
				}),
			}) as CalendarEventProgenitor

			const copyNewProgenitor = clone(newProgenitor)

			await assertThrows(TutanotaError, () =>
				eventSeriesResolver.resolveAllExcludedDatesForNewProgenitors([newProgenitor, copyNewProgenitor], [], calendarGroupId),
			)
			verify(mockCalendarModel.getEventsByUid(anything(), anything()), { times: 0 })
		})

		o.test("throws error if finds existing progenitor when trying to add new one", async function () {
			const newProgenitor = createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarGroupId,
				uid: "progenitorUid",
				repeatRule: createTestEntity(CalendarRepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
					timeZone: mockDateProvider.timeZone(),
					excludedDates: [],
				}),
			}) as CalendarEventProgenitor

			when(mockCalendarModel.getEventsByUid(newProgenitor.uid, calendarGroupId)).thenResolve({
				ownerGroup: calendarGroupId,
				progenitor: newProgenitor,
				alteredInstances: [],
			})

			await assertThrows(TutanotaError, () => eventSeriesResolver.resolveAllExcludedDatesForNewProgenitors([newProgenitor], [], calendarGroupId))
		})
	})
})
