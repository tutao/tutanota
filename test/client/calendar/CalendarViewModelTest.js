// @flow
import o from "ospec"
import {accountMailAddress, calendarGroupId, makeCalendarModel, makeEvent, makeUserController} from "./CalendarTestUtils"
import type {LoginController} from "../../../src/api/main/LoginController"
import {assertThrows} from "@tutao/tutanota-test-utils"
import {downcast, getStartOfDay, LazyLoaded, assertNotNull} from "@tutao/tutanota-utils"
import type {CalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {_TypeModel as CalendarEventTypeModel, createCalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {DateTime} from "luxon"
import {addDaysForEvent, getTimeZone} from "../../../src/calendar/date/CalendarUtils"
import type {CalendarInfo, CalendarModel} from "../../../src/calendar/model/CalendarModel"
import type {CreateCalendarEventViewModelFunction} from "../../../src/calendar/view/CalendarViewModel"
import {CalendarViewModel} from "../../../src/calendar/view/CalendarViewModel"
import {CalendarEventViewModel} from "../../../src/calendar/date/CalendarEventViewModel"
import {EntityClient} from "../../../src/api/common/EntityClient"
import {createEncryptedMailAddress} from "../../../src/api/entities/tutanota/EncryptedMailAddress"
import type {EntityUpdateData} from "../../../src/api/main/EventController"
import {EventController} from "../../../src/api/main/EventController"
import {ProgressTracker} from "../../../src/api/main/ProgressTracker"
import {DeviceConfig} from "../../../src/misc/DeviceConfig"
import {OperationType} from "../../../src/api/common/TutanotaConstants"
import {getElementId, getListId} from "../../../src/api/common/utils/EntityUtils"
import {EntityRestClientMock} from "../../api/worker/EntityRestClientMock"
import {ReceivedGroupInvitationsModel} from "../../../src/sharing/model/ReceivedGroupInvitationsModel"

let saveAndSendMock
let rescheduleEventMock
o.spec("CalendarViewModel", async function () {
	let entityClientMock: EntityRestClientMock

	function initCalendarViewModel(makeViewModelCallback: CreateCalendarEventViewModelFunction, eventController?): CalendarViewModel {
		if (eventController == null) {
			eventController = downcast({
				addEntityListener: () => Promise.resolve()
			})
		}
		const progressTracker: ProgressTracker = downcast({
			registerMonitor: () => Promise.resolve(),
			getMonitor: () => {
				return {
					workDone: () => Promise.resolve(),
					completed: () => Promise.resolve()
				}
			}
		})
		const deviceConfig: DeviceConfig = downcast({
				getHiddenCalendars: (Id) => []
			}
		)
		const calendarInvitations: ReceivedGroupInvitationsModel = downcast({})

		let calendarModel: CalendarModel = makeCalendarModel()
		const userController = makeUserController()
		const loginController: LoginController = downcast({
				getUserController: () => userController,
				isInternalUserLoggedIn: () => true,
			}
		)
		return new CalendarViewModel(loginController, makeViewModelCallback, calendarModel, new EntityClient(entityClientMock), eventController, progressTracker, deviceConfig, calendarInvitations)
	}

	function init(events) {

		const month = {
			start: new Date(2021, 0, 1),
			end: new Date(2021, 0, 30)
		}

		const eventsForDays = new Map()
		for (let event of events) {
			addDaysForEvent(eventsForDays, event, month)
		}

		return {
			days: [
				new Date(2021, 0, 1),
				new Date(2021, 0, 2),
				new Date(2021, 0, 3),
				new Date(2021, 0, 4),
				new Date(2021, 0, 5),
				new Date(2021, 0, 6),
				new Date(2021, 0, 7)
			],
			eventsForDays,
			month
		}
	}


	o.beforeEach(function () {
		entityClientMock = new EntityRestClientMock()
		saveAndSendMock = o.spy(() => Promise.resolve(true))
		rescheduleEventMock = o.spy(() => Promise.resolve())
	})

	o("Can init view model", function () {
		const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
		o(viewModel).notEquals(undefined)
		o(viewModel.selectedDate()).deepEquals(getStartOfDay(new Date()))
	})
	o.spec("edit event", async function () {
		o("move event", async function () {
			const testEvent = makeTestEvent()
			saveAndSendMock = o.spy(() => Promise.resolve(true))
			rescheduleEventMock = o.spy(() => Promise.resolve())
			const calendarEventViewModelCallback = o.spy(makeCalendarEventViewModel)
			const viewModel = initCalendarViewModel(calendarEventViewModelCallback)
			let newDate = new Date()
			await viewModel._moveEvent(testEvent, newDate)
			o(calendarEventViewModelCallback.callCount).equals(1)
			o(calendarEventViewModelCallback.args[0]).equals(testEvent)
			o(rescheduleEventMock.callCount).equals(1)
			o(rescheduleEventMock.args[0]).equals(newDate)
			o(saveAndSendMock.callCount).equals(1)
		})
	})

	o.spec("Dragging Events", function () {

		o("Start then drag then change mind is noop", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
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
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			let originalDate = new Date(2021, 8, 22)
			const event = makeEvent("event", originalDate, new Date(2021, 8, 23))


			simulateDrag(event, new Date(2021, 8, 24), viewModel)

			o(viewModel._draggedEvent?.eventClone.startTime.toISOString()).equals(new Date(2021, 8, 24).toISOString())
			o(viewModel._draggedEvent?.eventClone.endTime.toISOString()).equals(new Date(2021, 8, 25).toISOString())


			const temporaryEvent = viewModel._draggedEvent?.eventClone

			let diff = new Date(2021, 8, 25) - originalDate
			const endDragPromise = viewModel.onDragEnd(diff)

			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent])

			await endDragPromise

			// Don't reset yourself if there is no problems
			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent])

		})

		o("Complete drag and drop and saving fails", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModelThatFailsSaving)
			let originalDate = new Date(2021, 8, 22)
			const event = makeEvent("event", originalDate, new Date(2021, 8, 23))


			simulateDrag(event, new Date(2021, 8, 24), viewModel)

			await simulateEndDrag(originalDate, new Date(2021, 8, 25), viewModel)

			// The callback returned false, so we remove our event from transient events
			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([])
		})

		o("Complete drag and drop and saving does an error", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModelThatThrowsOnSaving)
			let originalDate = new Date(2021, 8, 22)
			const event = makeEvent("event", originalDate, new Date(2021, 8, 23))


			simulateDrag(event, new Date(2021, 8, 24), viewModel)

			let diff = new Date(2021, 8, 25) - originalDate
			const endDragPromise = viewModel.onDragEnd(diff)

			await assertThrows(Error, () => endDragPromise)

			// The callback threw, so we remove our event from transient events
			o(viewModel._draggedEvent?.eventClone).equals(undefined)
			o(viewModel._transientEvents).deepEquals([])
		})

		o("Drag while having temporary events should still work", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			let origStartDate1 = new Date(2021, 8, 22)
			const event1 = makeEvent("event1", origStartDate1, new Date(2021, 8, 23))
			let origStartDate2 = new Date(2021, 8, 22)
			const event2 = makeEvent("event2", origStartDate2, new Date(2021, 8, 23))

			//start first drag
			simulateDrag(event1, new Date(2021, 8, 24), viewModel)
			const temporaryEvent1 = viewModel._draggedEvent?.eventClone


			//star first drop
			let diff = new Date(2021, 8, 25) - origStartDate1
			const endDragPromise1 = viewModel.onDragEnd(diff)

			//start second drag
			simulateDrag(event2, new Date(2021, 8, 24), viewModel)
			const temporaryEvent2 = viewModel._draggedEvent?.eventClone

			//we have a temporary and a transient event
			o(viewModel._draggedEvent?.eventClone).equals(temporaryEvent2)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1])

			//start second drop
			diff = new Date(2021, 8, 25) - origStartDate2
			const endDragPromise2 = viewModel.onDragEnd(diff)

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
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			let origStartDate1 = new Date(2021, 8, 22)
			const event1 = makeEvent("event1", origStartDate1, new Date(2021, 8, 23), "uid1")
			let origStartDate2 = new Date(2021, 8, 22)
			const event2 = makeEvent("event2", origStartDate2, new Date(2021, 8, 23), "uid2")


			//start first drag
			simulateDrag(event1, new Date(2021, 8, 24), viewModel)
			const temporaryEvent1 = viewModel._draggedEvent?.eventClone

			//star first drop
			let diff = new Date(2021, 8, 25) - origStartDate1
			const endDragPromise1 = viewModel.onDragEnd(diff)

			//End first drop
			await endDragPromise1

			//start second drag
			simulateDrag(event2, new Date(2021, 8, 24), viewModel)
			const temporaryEvent2 = viewModel._draggedEvent?.eventClone


			o(viewModel._draggedEvent?.originalEvent).equals(event2)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1])

			//star second drop
			diff = new Date(2021, 8, 25) - origStartDate2
			//this will fail
			viewModel._createCalendarEventViewModelCallback = makeCalendarEventViewModelThatFailsSaving
			const endDragPromise2 = viewModel.onDragEnd(diff)

			// Now we have two transient events
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])

			await endDragPromise2

			// saving failed so we remove it from our temporary events
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1])
		})

		o("Drag while having temporary events and then the first update fails", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			let origStartDate1 = new Date(2021, 8, 22)
			const event1 = makeEvent("event1", origStartDate1, new Date(2021, 8, 23), "uid1")
			let origStartDate2 = new Date(2021, 8, 22)
			const event2 = makeEvent("event2", origStartDate2, new Date(2021, 8, 23), "uid2")

			//start first drag
			simulateDrag(event1, new Date(2021, 8, 24), viewModel)
			const temporaryEvent1 = viewModel._draggedEvent?.eventClone

			//start first drop
			let diff = new Date(2021, 8, 25) - origStartDate1
			//this will fail
			viewModel._createCalendarEventViewModelCallback = makeCalendarEventViewModelThatFailsSaving
			const endDragPromise1 = viewModel.onDragEnd(diff)

			//start second drag
			simulateDrag(event2, new Date(2021, 8, 24), viewModel)
			const temporaryEvent2 = viewModel._draggedEvent?.eventClone

			//now we have a temporary and a transient event
			o(viewModel._draggedEvent?.originalEvent).equals(event2)
			o(viewModel._draggedEvent?.eventClone).equals(temporaryEvent2)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1])

			//start second drop
			diff = new Date(2021, 8, 25) - origStartDate1
			//this will not fail
			viewModel._createCalendarEventViewModelCallback = makeCalendarEventViewModel
			const endDragPromise2 = viewModel.onDragEnd(diff)

			// Now we have two temporary events and we are not dragging anymore
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent1, temporaryEvent2])


			await endDragPromise1
			await endDragPromise2

			// the callback failed so we remove it from our temporary events
			o(viewModel._draggedEvent?.originalEvent).equals(undefined)
			o(viewModel._transientEvents).deepEquals([temporaryEvent2])
		})
	})


	o.spec("Filtering events", function () {
		o("Before drag, input events are all used", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			const inputEvents = [
				makeEvent("event1", new Date(2021, 0, 1), new Date(2021, 0, 2), "uid1"),
				makeEvent("event2", new Date(2021, 0, 1), new Date(2021, 0, 3), "uid2"),
				makeEvent("event3", new Date(2021, 0, 3, 13, 0), new Date(2021, 0, 3, 14, 30), "uid3")
			]
			const {days, eventsForDays} = init(inputEvents)

			const expected = {
				shortEvents: [
					[], [], [
						inputEvents[2]
					], [], [], [], []
				],
				longEvents: [
					inputEvents[0], inputEvents[1]
				],
			}

			viewModel._replaceEvents(eventsForDays)
			const {shortEvents, longEvents} = viewModel.getEventsOnDays(days)

			o({shortEvents, longEvents: Array.from(longEvents)}).deepEquals(expected)
		})

		o("During drag, temporary event overrides the original version", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			let originalDateForDraggedEvent = new Date(2021, 0, 3, 13, 0)
			const inputEvents = [
				makeEvent("event1", new Date(2021, 0, 1), new Date(2021, 0, 2), "uid1"),
				makeEvent("event2", new Date(2021, 0, 1), new Date(2021, 0, 3), "uid2"),
				makeEvent("event3", originalDateForDraggedEvent, new Date(2021, 0, 3, 14, 30), "uid3")
			]
			const {days, eventsForDays} = init(inputEvents)

			viewModel._replaceEvents(eventsForDays)


			//drag
			simulateDrag(inputEvents[2], new Date(2021, 0, 4, 13, 0), viewModel)

			const expected = {
				shortEvents: [
					[], [], [], [
						viewModel._draggedEvent?.eventClone
					], [], [], []
				],
				longEvents: [
					inputEvents[0], inputEvents[1]
				],
			}
			const {shortEvents, longEvents} = viewModel.getEventsOnDays(days)

			o({shortEvents, longEvents: Array.from(longEvents)}).deepEquals(expected)
		})

		o("After drop, before load", async function () {
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel)
			let originalDateForDraggedEvent = new Date(2021, 0, 3, 13, 0)
			const inputEvents = [
				makeEvent("event1", new Date(2021, 0, 1), new Date(2021, 0, 2), "uid1"),
				makeEvent("event2", new Date(2021, 0, 1), new Date(2021, 0, 3), "uid2"),
				makeEvent("event3", originalDateForDraggedEvent, new Date(2021, 0, 3, 14, 30), "uid3")
			]
			const {days, eventsForDays, month} = init(inputEvents)
			viewModel._replaceEvents(eventsForDays)

			//drag
			simulateDrag(inputEvents[2], new Date(2021, 0, 4, 13, 0), viewModel)

			//end drag
			await simulateEndDrag(originalDateForDraggedEvent, new Date(2021, 0, 5, 13, 0), viewModel)

			const expected = {
				shortEvents: [
					[], [], [], [], [
						viewModel._transientEvents[0]
					], [], []
				],
				longEvents: [
					inputEvents[0], inputEvents[1]
				],
			}

			const {shortEvents, longEvents} = viewModel.getEventsOnDays(days)
			o({shortEvents, longEvents: Array.from(longEvents)}).deepEquals(expected)
		})

	})

	o.spec("entityEventsReceived", function () {
		o("transient event is removed on update", async function () {
			const entityListeners = []
			const eventController: EventController = downcast({
				addEntityListener(listener) {
					entityListeners.push(listener)
				},
			})
			const viewModel = initCalendarViewModel(makeCalendarEventViewModel, eventController)
			const originalDateForDraggedEvent = new Date(2021, 0, 3, 13, 0)
			let eventToDrag = makeEvent("event3", originalDateForDraggedEvent, new Date(2021, 0, 3, 14, 30), "uid3")
			const inputEvents = [
				makeEvent("event1", new Date(2021, 0, 1), new Date(2021, 0, 2), "uid1"),
				makeEvent("event2", new Date(2021, 0, 1), new Date(2021, 0, 3), "uid2"),
				eventToDrag,
			]
			const {days, eventsForDays, month} = init(inputEvents)
			viewModel._replaceEvents(eventsForDays)

			//drag
			simulateDrag(inputEvents[2], new Date(2021, 0, 4, 13, 0), viewModel)

			//end drag
			const newData = new Date(2021, 0, 5, 13, 0)
			await simulateEndDrag(originalDateForDraggedEvent, newData, viewModel)

			o(viewModel.temporaryEvents.some(e => e.uid === eventToDrag.uid)).equals(true)("Has transient event")
			o(entityListeners.length).equals(1)("Listener was added")
			const entityUpdate: EntityUpdateData = {
				application: CalendarEventTypeModel.app,
				type: CalendarEventTypeModel.name,
				instanceListId: getListId(eventToDrag),
				instanceId: getElementId(eventToDrag),
				operation: OperationType.CREATE,
			}
			const updatedEventFromServer = makeEvent(getElementId(eventToDrag), newData, new Date(2021, 0, 5, 14, 30), assertNotNull(eventToDrag.uid))
			entityClientMock.addListInstances(updatedEventFromServer)
			await entityListeners[0]([entityUpdate], eventToDrag._ownerGroup)

			o(viewModel.temporaryEvents.some(e => e.uid === eventToDrag.uid)).equals(false)("Transient event removed")
		})
	})
})


function simulateDrag(originalEvent: CalendarEvent, newDate: Date, viewModel: CalendarViewModel) {
	let diff = newDate - originalEvent.startTime
	viewModel.onDragStart(originalEvent, diff)
	return diff
}


async function simulateEndDrag(originalDate: Date, newDate: Date, viewModel: CalendarViewModel) {
	let diff = newDate - originalDate
	await viewModel.onDragEnd(diff)
}

function makeTestEvent(): CalendarEvent {
	const zone = getTimeZone()
	const wrapEncIntoMailAddress = (address) => createEncryptedMailAddress({address})
	const encMailAddress = wrapEncIntoMailAddress(accountMailAddress)
	return createCalendarEvent({
		summary: "test event",
		startTime: DateTime.fromObject({year: 2020, month: 5, day: 26, hour: 12, zone}).toJSDate(),
		endTime: DateTime.fromObject({year: 2020, month: 5, day: 26, hour: 13, zone}).toJSDate(),
		description: "note",
		location: "location",
		_ownerGroup: calendarGroupId,
		organizer: encMailAddress,
	})
}

async function makeCalendarEventViewModel(existingEvent: CalendarEvent, calendars: LazyLoaded<Map<Id, CalendarInfo>>): Promise<CalendarEventViewModel> {
	return downcast({
		saveAndSend: saveAndSendMock,
		rescheduleEvent: rescheduleEventMock
	})
}

async function makeCalendarEventViewModelThatFailsSaving(existingEvent: CalendarEvent, calendars: LazyLoaded<Map<Id, CalendarInfo>>): Promise<CalendarEventViewModel> {
	return downcast({
		saveAndSend: () => Promise.resolve(false),
		rescheduleEvent: () => Promise.resolve(),
	})
}

async function makeCalendarEventViewModelThatThrowsOnSaving(existingEvent: CalendarEvent, calendars: LazyLoaded<Map<Id, CalendarInfo>>): Promise<CalendarEventViewModel> {
	return downcast({
		saveAndSend: () => Promise.reject(new Error("whoopsie")),
		rescheduleEvent: () => Promise.resolve(),
	})
}


