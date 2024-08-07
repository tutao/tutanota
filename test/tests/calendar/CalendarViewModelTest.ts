import o from "@tutao/otest"
import { getDateInZone, makeEvent, makeUserController, zone } from "./CalendarTestUtils.js"
import type { LoginController } from "../../../src/common/api/main/LoginController.js"
import { assertThrows, spy } from "@tutao/tutanota-test-utils"
import { assertNotNull, downcast, getStartOfDay, neverNull, noOp } from "@tutao/tutanota-utils"
import { CalendarEvent } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { EventController } from "../../../src/common/api/main/EventController.js"
import { ProgressTracker } from "../../../src/common/api/main/ProgressTracker.js"
import { DeviceConfig } from "../../../src/common/misc/DeviceConfig.js"
import { GroupType, OperationType } from "../../../src/common/api/common/TutanotaConstants.js"
import { getElementId, getListId } from "../../../src/common/api/common/utils/EntityUtils.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import { ReceivedGroupInvitationsModel } from "../../../src/common/sharing/model/ReceivedGroupInvitationsModel.js"
import { ProgressMonitor } from "../../../src/common/api/common/utils/ProgressMonitor.js"
import { object, when } from "testdouble"
import { EntityUpdateData } from "../../../src/common/api/common/utils/EntityUpdateUtils.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {
	CalendarEventEditModelsFactory,
	CalendarEventPreviewModelFactory,
	CalendarViewModel,
} from "../../../src/calendar-app/calendar/view/CalendarViewModel.js"
import { CalendarInfo, CalendarModel } from "../../../src/calendar-app/calendar/model/CalendarModel.js"
import { CalendarEventsRepository, DaysToEvents } from "../../../src/common/calendar/date/CalendarEventsRepository.js"
import { MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { addDaysForEventInstance, getMonthRange } from "../../../src/common/calendar/date/CalendarUtils.js"
import { CalendarEventModel, CalendarOperation, EventSaveResult } from "../../../src/calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"

let saveAndSendMock
let rescheduleEventMock
o.spec("CalendarViewModel", function () {
	let entityClientMock: EntityRestClientMock

	function initCalendarViewModel(
		makeViewModelCallback: CalendarEventEditModelsFactory,
		eventController?,
	): {
		viewModel: CalendarViewModel
		calendarModel: CalendarModel
		eventsRepository: CalendarEventsRepository
	} {
		if (eventController == null) {
			eventController = downcast({
				addEntityListener: () => Promise.resolve(),
			})
		}

		const progressTracker: ProgressTracker = {
			registerMonitorSync: () => 1,
			getMonitor: () => {
				return new ProgressMonitor(100, noOp)
			},
		} as Partial<ProgressTracker> as ProgressTracker
		const deviceConfig: DeviceConfig = downcast({
			getHiddenCalendars: (Id) => [],
		})
		const calendarInvitations: ReceivedGroupInvitationsModel<GroupType.Calendar> = downcast({
			init() {
				noOp()
			},
		})
		const calendarModel: CalendarModel = object()
		const eventMapStream: Stream<DaysToEvents> = stream(new Map())
		const calendarInfosStream: Stream<ReadonlyMap<Id, CalendarInfo>> = stream(new Map())
		const eventsRepository: CalendarEventsRepository = object()
		when(eventsRepository.getEventsForMonths()).thenReturn(eventMapStream)
		when(calendarModel.getCalendarInfosStream()).thenReturn(calendarInfosStream)
		const userController = makeUserController()
		const loginController: LoginController = downcast({
			getUserController: () => userController,
			isInternalUserLoggedIn: () => true,
		})
		const mailboxModel: MailboxModel = object()
		const previewModelFactory: CalendarEventPreviewModelFactory = async () => object()
		const viewModel = new CalendarViewModel(
			loginController,
			makeViewModelCallback,
			previewModelFactory,
			calendarModel,
			eventsRepository,
			new EntityClient(entityClientMock),
			eventController,
			progressTracker,
			deviceConfig,
			calendarInvitations,
			zone,
			mailboxModel,
		)
		viewModel.allowDrag = () => true
		return { viewModel, calendarModel, eventsRepository }
	}

	function init(events) {
		const month = getMonthRange(getDateInZone("2021-01-01"), zone)
		const eventsForDays = new Map()

		for (let event of events) {
			addDaysForEventInstance(eventsForDays, event, month, zone)
		}

		return {
			days: [
				getDateInZone("2021-01-01"),
				getDateInZone("2021-01-02"),
				getDateInZone("2021-01-03"),
				getDateInZone("2021-01-04"),
				getDateInZone("2021-01-05"),
				getDateInZone("2021-01-06"),
				getDateInZone("2021-01-07"),
			],
			eventsForDays,
			month,
		}
	}

	o.beforeEach(function () {
		entityClientMock = new EntityRestClientMock()
		saveAndSendMock = spy(() => Promise.resolve(true))
		rescheduleEventMock = spy(() => Promise.resolve())
	})
	o("Can init view model", function () {
		const { viewModel } = initCalendarViewModel(makeCalendarEventModel)
		o(viewModel).notEquals(undefined)
		o(viewModel.selectedDate()).deepEquals(getStartOfDay(new Date()))
	})
	o.spec("Dragging Events", function () {
		o("Start then drag then change mind is noop", async function () {
			const { viewModel } = initCalendarViewModel(makeCalendarEventModel)
			let originalEventStartTime = new Date(2021, 8, 22)
			const event = makeEvent("event", originalEventStartTime, new Date(2021, 8, 23))
			// Dragged a bit
			simulateDrag(event, new Date(2021, 8, 21), viewModel)
			// Went back to original date
			await simulateEndDrag(originalEventStartTime, new Date(2021, 8, 22), viewModel)
			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([])
		})
		o("A good drag and drop run", async function () {
			const { viewModel } = initCalendarViewModel(makeCalendarEventModel)
			let originalDate = new Date(2021, 8, 22)
			const event = makeEvent("event", originalDate, new Date(2021, 8, 23))
			simulateDrag(event, new Date(2021, 8, 24), viewModel)
			o(viewModel._draggedEvent?.eventClone.startTime.toISOString()).equals(new Date(2021, 8, 24).toISOString())
			o(viewModel._draggedEvent?.eventClone.endTime.toISOString()).equals(new Date(2021, 8, 25).toISOString())
			const temporaryEvent = neverNull(viewModel._draggedEvent?.eventClone)
			let diff = new Date(2021, 8, 25).getTime() - originalDate.getTime()
			const endDragPromise = viewModel.onDragEnd(CalendarOperation.EditAll, diff)
			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent])
			await endDragPromise
			// Don't reset yourself if there is no problems
			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent])
		})
		o("Complete drag and drop and saving fails", async function () {
			const { viewModel } = initCalendarViewModel(makeCalendarEventEditModelThatFailsSaving)
			let originalDate = new Date(2021, 8, 22)
			const event = makeEvent("event", originalDate, new Date(2021, 8, 23))
			simulateDrag(event, new Date(2021, 8, 24), viewModel)
			await simulateEndDrag(originalDate, new Date(2021, 8, 25), viewModel)
			// The callback returned false, so we remove our event from transient events
			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([])
		})
		o("Complete drag and drop and saving does an error", async function () {
			const { viewModel } = initCalendarViewModel(makeCalendarEventEditModelThatThrowsOnSaving)
			let originalDate = new Date(2021, 8, 22)
			const event = makeEvent("event", originalDate, new Date(2021, 8, 23))
			simulateDrag(event, new Date(2021, 8, 24), viewModel)
			let diff = new Date(2021, 8, 25).getTime() - originalDate.getTime()
			const endDragPromise = viewModel.onDragEnd(CalendarOperation.EditAll, diff)
			await assertThrows(Error, () => endDragPromise)
			// The callback threw, so we remove our event from transient events
			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([])
		})
		o("Drag while having temporary events should still work", async function () {
			const { viewModel } = initCalendarViewModel(makeCalendarEventModel)
			let origStartDate1 = new Date(2021, 8, 22)
			const event1 = makeEvent("event1", origStartDate1, new Date(2021, 8, 23))
			let origStartDate2 = new Date(2021, 8, 22)
			const event2 = makeEvent("event2", origStartDate2, new Date(2021, 8, 23))
			//start first drag
			simulateDrag(event1, new Date(2021, 8, 24), viewModel)
			const temporaryEvent1 = neverNull(viewModel._draggedEvent?.eventClone)
			//star first drop
			let diff = new Date(2021, 8, 25).getTime() - origStartDate1.getTime()
			const endDragPromise1 = viewModel.onDragEnd(CalendarOperation.EditAll, diff)
			//start second drag
			simulateDrag(event2, new Date(2021, 8, 24), viewModel)
			const temporaryEvent2 = neverNull(viewModel._draggedEvent?.eventClone)
			//we have a temporary and a transient event
			o(viewModel._draggedEvent?.eventClone).equals(temporaryEvent2)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1])
			//start second drop
			diff = new Date(2021, 8, 25).getTime() - origStartDate2.getTime()
			const endDragPromise2 = viewModel.onDragEnd(CalendarOperation.EditAll, diff)
			// Now we have two transient events
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])
			//end first drop
			await endDragPromise1
			//end second drop
			await endDragPromise2
			// the callback was successful so we keep it in temporary events
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])
		})
		o("Drag while having temporary events but the second update failed", async function () {
			// testdouble seems to have difficulty with multiple arguments on .thenResolve
			let tryCount = 0
			const { viewModel } = initCalendarViewModel(async () => {
				const eventModel: CalendarEventModel = object()
				when(eventModel.apply()).thenDo(() => {
					tryCount++
					if (tryCount === 1) {
						return EventSaveResult.Saved
					} else {
						return EventSaveResult.Failed
					}
				})
				return eventModel
			})
			let origStartDate1 = new Date(2021, 8, 22)
			const event1 = makeEvent("event1", origStartDate1, new Date(2021, 8, 23), "uid1")
			let origStartDate2 = new Date(2021, 8, 22)
			const event2 = makeEvent("event2", origStartDate2, new Date(2021, 8, 23), "uid2")
			//start first drag
			simulateDrag(event1, new Date(2021, 8, 24), viewModel)
			const temporaryEvent1 = neverNull(viewModel._draggedEvent?.eventClone)
			//star first drop
			let diff = new Date(2021, 8, 25).getTime() - origStartDate1.getTime()
			const endDragPromise1 = viewModel.onDragEnd(CalendarOperation.EditAll, diff)
			//End first drop
			await endDragPromise1
			//start second drag
			simulateDrag(event2, new Date(2021, 8, 24), viewModel)
			const temporaryEvent2 = neverNull(viewModel._draggedEvent?.eventClone)
			o(viewModel._draggedEvent?.originalEvent).equals(event2)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1])
			//star second drop
			diff = new Date(2021, 8, 25).getTime() - origStartDate2.getTime()
			const endDragPromise2 = viewModel.onDragEnd(CalendarOperation.EditAll, diff)
			// Now we have two transient events
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])
			await endDragPromise2
			// saving failed so we remove it from our temporary events
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1])
		})
		o("Drag while having temporary events and then the first update fails", async function () {
			// testdouble seems to have difficulty with multiple arguments on .thenResolve
			let tryCount = 0
			const { viewModel } = initCalendarViewModel(async () => {
				const saveModel: CalendarEventModel = object()
				when(saveModel.apply()).thenDo(() => {
					tryCount++
					if (tryCount === 1) {
						return EventSaveResult.Failed
					} else {
						return EventSaveResult.Saved
					}
				})
				return saveModel
			})
			let origStartDate1 = new Date(2021, 8, 22)
			const event1 = makeEvent("event1", origStartDate1, new Date(2021, 8, 23), "uid1")
			let origStartDate2 = new Date(2021, 8, 22)
			const event2 = makeEvent("event2", origStartDate2, new Date(2021, 8, 23), "uid2")
			//start first drag
			simulateDrag(event1, new Date(2021, 8, 24), viewModel)
			const temporaryEvent1 = assertNotNull(viewModel._draggedEvent?.eventClone, "temporary 1 was null")
			//start first drop
			let diff = new Date(2021, 8, 25).getTime() - origStartDate1.getTime()
			const endDragPromise1 = viewModel.onDragEnd(CalendarOperation.EditAll, diff)
			//start second drag
			simulateDrag(event2, new Date(2021, 8, 24), viewModel)
			const temporaryEvent2 = assertNotNull(viewModel._draggedEvent?.eventClone, "temporary 2 was null")
			//now we have a temporary and a transient event
			o(viewModel._draggedEvent?.originalEvent).equals(event2)
			o(viewModel._draggedEvent?.eventClone).equals(temporaryEvent2)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1])
			//start second drop
			diff = new Date(2021, 8, 25).getTime() - origStartDate1.getTime()
			//this will not fail
			const endDragPromise2 = viewModel.onDragEnd(CalendarOperation.EditAll, diff)
			// Now we have two temporary events and we are not dragging anymore
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])
			await endDragPromise1
			await endDragPromise2
			// the callback failed so we remove it from our temporary events
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent2])
		})
		o("Block user from dragging non-editable events", async function () {
			const { viewModel } = initCalendarViewModel(makeCalendarEventModel)
			let originalEventStartTime = new Date(2021, 8, 22)
			const event = makeEvent("event", originalEventStartTime, new Date(2021, 8, 23))

			// Try to drag
			viewModel.allowDrag = () => false
			simulateDrag(event, new Date(2021, 8, 24), viewModel)

			o(viewModel._draggedEvent?.eventClone).equals(undefined)
		})
	})
	o.spec("Filtering events", function () {
		o("Before drag, input events are all used", async function () {
			const { viewModel, eventsRepository } = initCalendarViewModel(makeCalendarEventModel)

			const inputEvents = [
				makeEvent("event1", getDateInZone("2021-01-01"), getDateInZone("2021-01-02"), "uid1"),
				makeEvent("event2", getDateInZone("2021-01-01"), getDateInZone("2021-01-03"), "uid2"),
				makeEvent("event3", getDateInZone("2021-01-03T13:00"), getDateInZone("2021-01-03T14:30"), "uid3"),
			]
			const { days, eventsForDays } = init(inputEvents)
			const expected = {
				shortEventsPerDay: [[], [], [inputEvents[2]], [], [], [], []],
				longEvents: [inputEvents[0], inputEvents[1]],
			}

			eventsRepository.getEventsForMonths()(eventsForDays)

			const { shortEventsPerDay, longEvents } = viewModel.getEventsOnDaysToRender(days)
			o({
				shortEventsPerDay,
				longEvents: Array.from(longEvents),
			}).deepEquals(expected)
		})

		o("During drag, temporary event overrides the original version", async function () {
			const { viewModel, eventsRepository } = initCalendarViewModel(makeCalendarEventModel)
			const inputEvents = [
				makeEvent("event1", getDateInZone("2021-01-01"), getDateInZone("2021-01-02"), "uid1"),
				makeEvent("event2", getDateInZone("2021-01-01"), getDateInZone("2021-01-03"), "uid2"),
				makeEvent("event3", getDateInZone("2021-01-03T13:00"), getDateInZone("2021-01-03T14:30"), "uid3"),
			]
			const { days, eventsForDays } = init(inputEvents)

			eventsRepository.getEventsForMonths()(eventsForDays)

			simulateDrag(inputEvents[2], getDateInZone("2021-01-04T13:00"), viewModel)
			const expected = {
				shortEvents: [[], [], [], [viewModel._draggedEvent?.eventClone], [], [], []],
				longEvents: [inputEvents[0], inputEvents[1]],
			} as any
			const { shortEventsPerDay, longEvents } = viewModel.getEventsOnDaysToRender(days)
			o(shortEventsPerDay).deepEquals(expected.shortEvents)
			o(Array.from(longEvents)).deepEquals(expected.longEvents)
		})
		o("After drop, before load", async function () {
			const { viewModel, eventsRepository } = initCalendarViewModel(makeCalendarEventModel)
			let originalDateForDraggedEvent = getDateInZone("2021-01-03T13:00")
			const inputEvents = [
				makeEvent("event1", getDateInZone("2021-01-01"), getDateInZone("2021-01-02"), "uid1"),
				makeEvent("event2", getDateInZone("2021-01-01"), getDateInZone("2021-01-03"), "uid2"),
				makeEvent("event3", originalDateForDraggedEvent, getDateInZone("2021-01-03T14:30"), "uid3"),
			]
			const { days, eventsForDays } = init(inputEvents)

			eventsRepository.getEventsForMonths()(eventsForDays)

			//drag 2nd event to the 4th
			simulateDrag(inputEvents[2], getDateInZone("2021-01-04T13:00"), viewModel)
			//end drag with dropping the event on the 5th?
			await simulateEndDrag(originalDateForDraggedEvent, getDateInZone("2021-01-05T13:00"), viewModel)
			const expected = {
				shortEvents: [[], [], [], [], [viewModel._transientEvents[0]], [], []],
				longEvents: [inputEvents[0], inputEvents[1]],
			}
			const { shortEventsPerDay, longEvents } = viewModel.getEventsOnDaysToRender(days)
			o(shortEventsPerDay).deepEquals(expected.shortEvents)
			o(Array.from(longEvents)).deepEquals(expected.longEvents)
		})
	})
	o.spec("entityEventsReceived", function () {
		o("transient event is removed on update", async function () {
			const entityListeners: any[] = []
			const eventController: EventController = downcast({
				addEntityListener(listener) {
					entityListeners.push(listener)
				},
			})
			const { viewModel, eventsRepository } = initCalendarViewModel(makeCalendarEventModel, eventController)
			const originalDateForDraggedEvent = new Date(2021, 0, 3, 13, 0)
			let eventToDrag = makeEvent("event3", originalDateForDraggedEvent, new Date(2021, 0, 3, 14, 30), "uid3")
			const inputEvents = [
				makeEvent("event1", new Date(2021, 0, 1), new Date(2021, 0, 2), "uid1"),
				makeEvent("event2", new Date(2021, 0, 1), new Date(2021, 0, 3), "uid2"),
				eventToDrag,
			]
			const { days, eventsForDays, month } = init(inputEvents)

			eventsRepository.getEventsForMonths()(eventsForDays)

			//drag
			simulateDrag(inputEvents[2], new Date(2021, 0, 4, 13, 0), viewModel)
			//end drag
			const newData = new Date(2021, 0, 5, 13, 0)
			await simulateEndDrag(originalDateForDraggedEvent, newData, viewModel)
			o(viewModel.temporaryEvents.some((e) => e.uid === eventToDrag.uid)).equals(true)("Has transient event")
			o(entityListeners.length).equals(1)("Listener was added")
			const entityUpdate: EntityUpdateData = {
				application: "tutanota",
				type: "CalendarEvent",
				instanceListId: getListId(eventToDrag),
				instanceId: getElementId(eventToDrag),
				operation: OperationType.CREATE,
			}
			const updatedEventFromServer = makeEvent(getElementId(eventToDrag), newData, new Date(2021, 0, 5, 14, 30), assertNotNull(eventToDrag.uid))
			entityClientMock.addListInstances(updatedEventFromServer)
			await entityListeners[0]([entityUpdate], eventToDrag._ownerGroup)
			o(viewModel.temporaryEvents.some((e) => e.uid === eventToDrag.uid)).equals(false)("Transient event removed")
		})
	})
})

function simulateDrag(originalEvent: CalendarEvent, newDate: Date, viewModel: CalendarViewModel) {
	let diff = newDate.getTime() - originalEvent.startTime.getTime()
	viewModel.onDragStart(originalEvent, diff)
	return diff
}

async function simulateEndDrag(originalDate: Date, newDate: Date, viewModel: CalendarViewModel) {
	let diff = newDate.getTime() - originalDate.getTime()
	await viewModel.onDragEnd(diff, CalendarOperation.EditAll)
}

async function makeCalendarEventModel(mode: CalendarOperation, existingEvent: CalendarEvent): Promise<CalendarEventModel> {
	const eventModel: CalendarEventModel = object()
	when(eventModel.apply()).thenResolve(EventSaveResult.Saved)
	return eventModel
}

async function makeCalendarEventEditModelThatFailsSaving(mode: CalendarOperation, existingEvent: CalendarEvent): Promise<CalendarEventModel> {
	const eventModel: CalendarEventModel = object()
	when(eventModel.apply()).thenResolve(EventSaveResult.Failed)
	return eventModel
}

async function makeCalendarEventEditModelThatThrowsOnSaving(mode: CalendarOperation, existingEvent: CalendarEvent): Promise<CalendarEventModel> {
	const eventModel: CalendarEventModel = object()
	when(eventModel.apply()).thenReject(new Error("whoopsie"))
	return eventModel
}
