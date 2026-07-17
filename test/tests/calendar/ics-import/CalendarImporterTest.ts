import o from "@tutao/otest"
import { IcsCalendarEvent, ParsedEventAlarmTuple } from "../../../../src/applications/calendar-app/calendar/export/CalendarParser"
import { getDateInZone, zone } from "../CalendarTestUtils"
import { createTestEntity } from "../../TestUtils"
import { CalendarEvent, CalendarGroupRoot, CalendarGroupRootTypeRef, CalendarRepeatRule } from "@tutao/entities/tutanota"
import { CalendarImporter, EventImportRejectionReason, EventsClassifier } from "../../../../src/applications/common/calendar/import/CalendarImporter"
import {
	EventAlarmInfoTemplatesTuple,
	makeCalendarEventFromIcsCalendarEvent,
	shallowIsSameEvent,
} from "../../../../src/applications/common/calendar/import/ImportExportUtils"
import { ImportInteractionHandler } from "../../../../src/applications/common/calendar/gui/ImportInteractionHandler"
import { matchers, object, verify, when } from "testdouble"
import { CalendarInfoBase, CalendarModel } from "../../../../src/applications/calendar-app/calendar/model/CalendarModel"
import { OperationProgressTracker } from "../../../../src/applications/common/api/main/OperationProgressTracker"
import { assignEventId, CalendarType } from "../../../../src/applications/common/calendar/date/CalendarUtils"
import { DateTime } from "luxon"
import { clone, elementIdToId } from "../../../../src/platform-kit/meta"
import { first, incrementDate, noOp } from "../../../../src/platform-kit/utils"
import { EventSeriesResolver } from "../../../../src/applications/common/calendar/import/EventSeriesResolver"
import { RepeatRuleTypeRef } from "@tutao/entities/sys"
import { RepeatPeriod } from "../../../../src/platform-kit/app-env"
import {
	AlarmInfoTemplate,
	CalendarEventAlteredInstance,
	CalendarEventProgenitor,
} from "../../../../src/applications/common/api/worker/facades/lazy/CalendarFacade"

const { anything } = matchers
o.spec("CalendarImporter", function () {
	const timezone = "Europe/Berlin"

	let mockCalendarModel: CalendarModel
	let calendarImporter: CalendarImporter
	let mockImportInteractionHandler: ImportInteractionHandler
	let mockOperationProgressTracker: OperationProgressTracker
	let mockEventSeriesResolver: EventSeriesResolver

	let calendarGroupRoot: CalendarGroupRoot
	let calendarInfoBase: CalendarInfoBase

	function makeIcsEvent(overrides?: { uid?: string; repeatRule?: CalendarRepeatRule; recurrenceId?: Date }): IcsCalendarEvent {
		const startTime = DateTime.fromObject({ year: 1993, month: 5, day: 12, hour: 12 })
		return {
			summary: "TestEvent",
			description: "",
			startTime: startTime.toJSDate(),
			endTime: clone(startTime).plus({ hour: 1 }).toJSDate(),
			location: "Location",
			uid: overrides?.uid ?? "ics-event-uid",
			sequence: "1",
			recurrenceId: overrides?.recurrenceId ?? null,
			repeatRule: overrides?.repeatRule ?? null,
			attendees: null,
			organizer: null,
			startTimeZone: overrides?.repeatRule?.timeZone ?? null,
			endTimeZone: overrides?.repeatRule?.timeZone ?? null,
		}
	}

	function mockImportDialogConfirmation(expectedSuccessfulEvents: CalendarEvent[]) {
		when(mockImportInteractionHandler.showImportSummaryDialog("importEvents_label", expectedSuccessfulEvents, anything(), calendarInfoBase)).thenDo(
			async (label, calendarEvents, onConfirmAction, calendarInfoBase) => {
				await onConfirmAction(object())
			},
		)
		when(mockImportInteractionHandler.doActionWithProgressDialog("importCalendar_label", anything(), anything())).thenDo(
			async (label, deferedActionPromise, operation) => {
				await deferedActionPromise
			},
		)
	}

	o.spec("import", function () {
		o.beforeEach(function () {
			calendarGroupRoot = createTestEntity(CalendarGroupRootTypeRef, { shortEvents: "shortEventsListId", longEvents: "longEventsListId" })
			calendarInfoBase = { id: elementIdToId(calendarGroupRoot._id), name: "Calendar Name", type: CalendarType.Private, color: "#ffffff" }

			mockImportInteractionHandler = object()
			mockOperationProgressTracker = object()
			mockCalendarModel = object()
			mockEventSeriesResolver = object()

			calendarImporter = new CalendarImporter(
				mockCalendarModel,
				mockImportInteractionHandler,
				mockOperationProgressTracker,
				mockEventSeriesResolver,
				timezone,
			)

			when(mockOperationProgressTracker.startNewOperation()).thenReturn({ id: 1, progress: object(), done: noOp })
			when(mockOperationProgressTracker.onProgress(anything(), anything())).thenResolve()

			when(mockCalendarModel.loadAllEvents(calendarGroupRoot)).thenResolve([])
		})

		o.spec("Canceled operations", function () {
			o.test("should show empty file message when no events are provided", async function () {
				await calendarImporter.import(calendarGroupRoot, calendarInfoBase, [], CalendarImporter.classifyImportedEvents, calendarInfoBase.type)
				verify(mockImportInteractionHandler.showEmptyFileMessage(), { times: 1 })
			})

			o.test("does not create events when the user cancels a partial import", async function () {
				const icsCalendarEvent = makeIcsEvent()

				const parsedEventAlarmTuple: ParsedEventAlarmTuple = { icsCalendarEvent, alarms: [] }
				const parsedEventAlarmTuples = [parsedEventAlarmTuple, parsedEventAlarmTuple]
				const calendarEvent = makeCalendarEventFromIcsCalendarEvent(icsCalendarEvent)

				when(
					mockImportInteractionHandler.confirmPartialImport(
						new Map([[EventImportRejectionReason.DuplicateInIcs, [calendarEvent]]]),
						parsedEventAlarmTuples,
					),
				).thenResolve(false)

				await calendarImporter.import(calendarGroupRoot, calendarInfoBase, parsedEventAlarmTuples, CalendarImporter.classifyImportedEvents)

				verify(mockCalendarModel.doUpdateEvent(anything(), anything()), { times: 0 })
				verify(mockCalendarModel.createCalendarEvents(anything(), anything()), { times: 0 })
			})
		})

		o.spec("Successful imports", function () {
			o.test("imports a new event into an empty calendar", async function () {
				const icsCalendarEvent = makeIcsEvent()
				const parsedEventAlarmTuples = [{ icsCalendarEvent, alarms: [] }]
				const calendarEvent = makeCalendarEventFromIcsCalendarEvent(icsCalendarEvent)
				calendarEvent._ownerGroup = elementIdToId(calendarGroupRoot._id)
				assignEventId(calendarEvent, timezone, calendarGroupRoot)

				const eventAlarmInfoTemplatesTuple: EventAlarmInfoTemplatesTuple = {
					event: calendarEvent,
					alarmInfoTemplates: [],
				}

				when(mockImportInteractionHandler.confirmPartialImport(new Map(), parsedEventAlarmTuples)).thenResolve(true)
				when(mockImportInteractionHandler.showImportSummaryDialog("importEvents_label", [calendarEvent], anything(), calendarInfoBase)).thenDo(
					async (label, calendarEvents, onConfirmAction, calendarInfoBase) => {
						await onConfirmAction(object())
					},
				)
				when(mockImportInteractionHandler.doActionWithProgressDialog("importCalendar_label", anything(), anything())).thenDo(
					async (label, deferedActionPromise, operation) => {
						await deferedActionPromise
					},
				)

				when(mockCalendarModel.createCalendarEvents([eventAlarmInfoTemplatesTuple], anything())).thenResolve({
					failedAlarmErrors: [],
					failedAlarms: [],
					failedEventErrors: [],
					failedEvents: [],
					successfulEvents: [calendarEvent],
				})

				const classifyEventsStub = () => ({
					rejectedEvents: new Map(),
					eventsForCreationTuples: [eventAlarmInfoTemplatesTuple],
				})

				const results = await calendarImporter.import(calendarGroupRoot, calendarInfoBase, [{ icsCalendarEvent, alarms: [] }], classifyEventsStub)

				o.check(results!.successfulEvents.length).equals(1)
				o.check(shallowIsSameEvent(first(results!.successfulEvents)!, calendarEvent)).equals(true)
			})

			o.test("imports new series with altered instance", async function () {
				const progenitorIcsEvent = makeIcsEvent({ repeatRule: createTestEntity(RepeatRuleTypeRef, { frequency: RepeatPeriod.DAILY, interval: "1" }) })
				const progenitorCalendarEvent = makeCalendarEventFromIcsCalendarEvent(progenitorIcsEvent) as CalendarEventProgenitor
				const progenitorTemplatesTuple: EventAlarmInfoTemplatesTuple = {
					event: progenitorCalendarEvent,
					alarmInfoTemplates: [],
				}

				const alteredInstanceIcsEvent = makeIcsEvent({ recurrenceId: incrementDate(new Date(progenitorIcsEvent.startTime), 1) })
				const alteredInstanceCalendarEvent = makeCalendarEventFromIcsCalendarEvent(alteredInstanceIcsEvent) as CalendarEventAlteredInstance
				const alteredInstanceTemplatesTuple: EventAlarmInfoTemplatesTuple = {
					event: alteredInstanceCalendarEvent,
					alarmInfoTemplates: [],
				}

				const inputTuples: ParsedEventAlarmTuple[] = [
					{ icsCalendarEvent: progenitorIcsEvent, alarms: [] },
					{ icsCalendarEvent: alteredInstanceIcsEvent, alarms: [] },
				]

				const eventsForCreationTuples = [progenitorTemplatesTuple, alteredInstanceTemplatesTuple]

				const classifyEventsStub = () => ({
					rejectedEvents: new Map(),
					eventsForCreationTuples,
				})

				when(mockImportInteractionHandler.confirmPartialImport(new Map(), inputTuples)).thenResolve(true)

				const expectedSuccessfulEvents = [progenitorCalendarEvent, alteredInstanceCalendarEvent]
				mockImportDialogConfirmation(expectedSuccessfulEvents)

				when(mockCalendarModel.createCalendarEvents(eventsForCreationTuples, anything())).thenResolve({
					failedAlarmErrors: [],
					failedAlarms: [],
					failedEventErrors: [],
					failedEvents: [],
					successfulEvents: expectedSuccessfulEvents,
				})

				const result = await calendarImporter.import(calendarGroupRoot, calendarInfoBase, inputTuples, classifyEventsStub)

				verify(
					mockEventSeriesResolver.updateExistingProgenitorForNewAlteredInstances(
						[alteredInstanceCalendarEvent],
						elementIdToId(calendarGroupRoot._id),
					),
				)
				verify(
					mockEventSeriesResolver.resolveAllExcludedDatesForNewProgenitors(
						[progenitorCalendarEvent],
						[alteredInstanceCalendarEvent],
						elementIdToId(calendarGroupRoot._id),
					),
				)
				o.check(result).deepEquals({
					successfulEvents: expectedSuccessfulEvents,
					failedAlarmErrors: [],
					failedAlarms: [],
					failedEventErrors: [],
					failedEvents: [],
				})
			})

			o.test("partial imports can succeed when confirmed by user", async function () {
				const icsCalendarEvent = makeIcsEvent()
				const calendarEvent = makeCalendarEventFromIcsCalendarEvent(icsCalendarEvent)
				calendarEvent._ownerGroup = elementIdToId(calendarGroupRoot._id)
				assignEventId(calendarEvent, timezone, calendarGroupRoot)

				const eventAlarmInfoTemplatesTuple: EventAlarmInfoTemplatesTuple = {
					event: calendarEvent,
					alarmInfoTemplates: [],
				}

				const parsedEventAlarmTuples = [
					{ icsCalendarEvent, alarms: [] },
					{ icsCalendarEvent, alarms: [] },
				]
				const duplicateCalendarEvent = clone(calendarEvent)
				const rejectedEvents = new Map([[EventImportRejectionReason.DuplicateInIcs, [duplicateCalendarEvent]]])

				const classifyEventsStub: EventsClassifier = () => ({
					rejectedEvents: rejectedEvents,
					eventsForCreationTuples: [eventAlarmInfoTemplatesTuple],
				})

				when(mockImportInteractionHandler.confirmPartialImport(rejectedEvents, parsedEventAlarmTuples)).thenResolve(true)
				mockImportDialogConfirmation([calendarEvent])

				when(mockCalendarModel.createCalendarEvents([eventAlarmInfoTemplatesTuple], anything())).thenResolve({
					failedAlarmErrors: [],
					failedAlarms: [],
					failedEventErrors: [],
					failedEvents: [],
					successfulEvents: [calendarEvent],
				})

				const results = await calendarImporter.import(
					calendarGroupRoot,
					calendarInfoBase,
					[
						{ icsCalendarEvent, alarms: [] },
						{ icsCalendarEvent, alarms: [] },
					],
					classifyEventsStub,
				)

				o.check(results!.successfulEvents.length).equals(1)
				o.check(shallowIsSameEvent(first(results!.successfulEvents)!, calendarEvent)).equals(true)
			})
		})

		o.spec("Failure case", function () {
			let icsCalendarEvent: IcsCalendarEvent
			let calendarEvent: CalendarEvent
			let alarmInfoTemplate: AlarmInfoTemplate
			let eventAlarmInfoTemplatesTuple: EventAlarmInfoTemplatesTuple
			let classifyEventsStub: EventsClassifier

			o.beforeEach(function () {
				icsCalendarEvent = makeIcsEvent()
				calendarEvent = makeCalendarEventFromIcsCalendarEvent(icsCalendarEvent)
				alarmInfoTemplate = {
					alarmIdentifier: "my-alarm",
					trigger: "1D",
				}
				eventAlarmInfoTemplatesTuple = {
					event: calendarEvent,
					alarmInfoTemplates: [alarmInfoTemplate],
				}

				when(mockImportInteractionHandler.confirmPartialImport(anything(), anything())).thenResolve(true)

				classifyEventsStub = () => ({
					rejectedEvents: new Map(),
					eventsForCreationTuples: [eventAlarmInfoTemplatesTuple],
				})
				mockImportDialogConfirmation([calendarEvent])
			})

			o.test("returns null when event creation fails", async function () {
				when(mockCalendarModel.createCalendarEvents(anything(), anything())).thenResolve({
					failedAlarmErrors: [],
					failedAlarms: [],
					failedEventErrors: [new Error("Failed to create events")],
					failedEvents: [calendarEvent],
					successfulEvents: [],
				})

				const result = await calendarImporter.import(calendarGroupRoot, calendarInfoBase, [{ icsCalendarEvent, alarms: [] }], classifyEventsStub)

				o.check(result).equals(null)
				verify(mockImportInteractionHandler.showImportEventsError(anything(), anything()), { times: 1 })
			})

			o.test("returns null when event alarms fails", async function () {
				when(mockCalendarModel.createCalendarEvents(anything(), anything())).thenResolve({
					failedAlarmErrors: [new Error("Failed to create some alarms for imported events")],
					failedAlarms: [eventAlarmInfoTemplatesTuple],
					failedEventErrors: [],
					failedEvents: [],
					successfulEvents: [calendarEvent],
				})

				const result = await calendarImporter.import(calendarGroupRoot, calendarInfoBase, [{ icsCalendarEvent, alarms: [] }], classifyEventsStub)

				o.check(result).equals(null)
				verify(mockImportInteractionHandler.showImportAlarmsError(anything()), { times: 1 })
			})
		})
	})

	o.spec("classifyImportedEvents", function () {
		o("repeated progenitors in ics file are skipped", function () {
			const duplicateProgenitor: IcsCalendarEvent = {
				uid: "hello",
				startTime: getDateInZone("2023-01-02T13:00"),
				endTime: getDateInZone("2023-01-02T13:05"),
				summary: "",
				description: "",
				location: "",
				sequence: "0",
				recurrenceId: null,
				repeatRule: null,
				attendees: null,
				organizer: null,
				startTimeZone: null,
				endTimeZone: null,
			}
			const newProgenitor: IcsCalendarEvent = {
				uid: "hello",
				startTime: getDateInZone("2023-01-01T13:00"),
				endTime: getDateInZone("2023-01-01T13:05"),
				summary: "",
				description: "",
				location: "",
				sequence: "0",
				recurrenceId: null,
				repeatRule: null,
				attendees: null,
				organizer: null,
				startTimeZone: null,
				endTimeZone: null,
			}
			const calendarGroupRoot = createTestEntity(CalendarGroupRootTypeRef)

			const { rejectedEvents, eventsForCreationTuples } = CalendarImporter.classifyImportedEvents(
				[
					{ icsCalendarEvent: duplicateProgenitor, alarms: [] },
					{ icsCalendarEvent: newProgenitor, alarms: [] },
				],
				[],
				calendarGroupRoot,
				zone,
			)

			const expectedRejectedProgenitor = makeCalendarEventFromIcsCalendarEvent(duplicateProgenitor)

			const expectedCreatedProgenitor = makeCalendarEventFromIcsCalendarEvent(newProgenitor)
			expectedCreatedProgenitor._ownerGroup = elementIdToId(calendarGroupRoot._id)
			expectedCreatedProgenitor._id = eventsForCreationTuples[0].event._id

			o(eventsForCreationTuples[0].event).deepEquals(expectedCreatedProgenitor)
			o(eventsForCreationTuples.length === 1)
			o(rejectedEvents.get(EventImportRejectionReason.DuplicateInIcs)?.[0]).deepEquals(expectedRejectedProgenitor)
		})

		o("repeated progenitors that already exist in user calendar are skipped", function () {
			const newProgenitorIcs: IcsCalendarEvent = {
				uid: "hello",
				startTime: getDateInZone("2023-01-02T13:00"),
				endTime: getDateInZone("2023-01-02T13:05"),
				summary: "",
				description: "",
				location: "",
				sequence: "0",
				recurrenceId: null,
				repeatRule: null,
				attendees: null,
				organizer: null,
				startTimeZone: null,
				endTimeZone: null,
			}
			const existingProgenitorIcs: IcsCalendarEvent = {
				uid: "hello_existing",
				startTime: getDateInZone("2023-01-01T13:00"),
				endTime: getDateInZone("2023-01-01T13:05"),
				summary: "",
				description: "",
				location: "",
				sequence: "0",
				recurrenceId: null,
				repeatRule: null,
				attendees: null,
				organizer: null,
				startTimeZone: null,
				endTimeZone: null,
			}
			const calendarGroupRoot = createTestEntity(CalendarGroupRootTypeRef)

			const expectedRejectedProgenitor = makeCalendarEventFromIcsCalendarEvent(existingProgenitorIcs)

			const { rejectedEvents, eventsForCreationTuples } = CalendarImporter.classifyImportedEvents(
				[
					{ icsCalendarEvent: newProgenitorIcs, alarms: [] },
					{ icsCalendarEvent: existingProgenitorIcs, alarms: [] },
				],
				[expectedRejectedProgenitor],
				calendarGroupRoot,
				zone,
			)

			const expectedCreatedProgenitor = makeCalendarEventFromIcsCalendarEvent(newProgenitorIcs)

			expectedCreatedProgenitor._ownerGroup = elementIdToId(calendarGroupRoot._id)
			expectedCreatedProgenitor._id = eventsForCreationTuples[0].event._id

			o(eventsForCreationTuples[0].event).deepEquals(expectedCreatedProgenitor)
			o(eventsForCreationTuples.length === 1)
			o(rejectedEvents.get(EventImportRejectionReason.Duplicate)?.[0]).deepEquals(expectedRejectedProgenitor)
		})

		o("when sorting duplicates present in the parsed events, only accept first occurrence and reject the rest", function () {
			const parsedProgenitor: IcsCalendarEvent = {
				summary: "s",
				description: "",
				startTime: getDateInZone("2023-01-02T13:00"),
				endTime: getDateInZone("2023-01-02T13:05"),
				location: "",
				uid: "hello",
				sequence: "0",
				recurrenceId: null,
				repeatRule: null,
				attendees: [],
				organizer: null,
				startTimeZone: null,
				endTimeZone: null,
			}

			const { rejectedEvents, eventsForCreationTuples } = CalendarImporter.classifyImportedEvents(
				[
					{ icsCalendarEvent: parsedProgenitor, alarms: [] },
					{ icsCalendarEvent: parsedProgenitor, alarms: [] },
				],
				[],
				createTestEntity(CalendarGroupRootTypeRef),
				zone,
			)

			o(rejectedEvents.size).equals(1)
			o(eventsForCreationTuples.length).equals(1)
		})
	})
})
