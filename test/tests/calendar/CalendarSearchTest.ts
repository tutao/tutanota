import o from "@tutao/otest"
import { createTestEntity } from "../TestUtils"
import { CalendarEvent, CalendarEventTypeRef } from "@tutao/entities/tutanota"
import { SearchModel, SearchQuery } from "../../../src/applications/mail-app/search/model/SearchModel"
import { matchers, object, when } from "testdouble"
import { CalendarEventsRepository, DaysToEvents } from "../../../src/applications/common/calendar/date/CalendarEventsRepository"
import { SearchFacade } from "../../../src/applications/mail-app/workerUtils/index/SearchFacade"
import { EventController } from "../../../src/applications/common/api/main/EventController"
import { EntityClient } from "../../../src/platform-kit/network/EntityClient"
import { ProgressTracker } from "../../../src/applications/common/api/main/ProgressTracker"
import { SearchCategoryType, SearchRestriction } from "../../../src/applications/common/api/worker/search/SearchTypes"
import { ProgressMonitorInterface } from "../../../src/platform-kit/network/ProgressMonitorInterface"
import { EventWrapper } from "../../../src/applications/calendar-app/calendar/view/CalendarViewModel"
import { getStartOfDay } from "../../../src/platform-kit/utils"
import Stream from "mithril/stream"
import stream from "mithril/stream"

o.spec("CalendarSearch", function () {
	let search: SearchModel
	let searchFacade: SearchFacade
	let eventController: EventController
	let entityClient: EntityClient
	let calendarEventsRepository: CalendarEventsRepository
	let progressTracker: ProgressTracker
	let abort: AbortController

	o.beforeEach(function () {
		searchFacade = object()
		eventController = object()
		entityClient = object()
		calendarEventsRepository = object()

		progressTracker = object()
		const progressMonitorInterface: ProgressMonitorInterface = object()
		when(progressTracker.getMonitor(matchers.anything())).thenReturn(progressMonitorInterface)

		abort = new AbortController()

		search = new SearchModel(searchFacade, eventController, entityClient, async () => calendarEventsRepository, progressTracker)
	})
	o.spec("Event Search", function () {
		o.test("searching an event should return all the events that contain query in summary or description", async function () {
			const eventStartDate = new Date(2026, 7, 27)
			const eventEndDate = new Date(2026, 7, 28)
			const event1 = createTestEntity(CalendarEventTypeRef, {
				summary: "test event",
				description: "",
				startTime: eventStartDate,
				endTime: eventEndDate,
			})
			event1._id = ["ListID", "Event1ID"]
			const event2 = createTestEntity(CalendarEventTypeRef, {
				summary: "no summary",
				description: "test event",
				startTime: eventStartDate,
				endTime: eventEndDate,
			})
			event2._id = ["ListID", "Event2ID"]

			const rangeStart = new Date(2026, 7, 20)
			const rangeEnd = new Date(2026, 8, 1)

			const restriction: SearchRestriction = {
				start: rangeStart.getTime(),
				end: rangeEnd.getTime(),
				folderIds: [],
				attributeIds: null,
				eventSeries: null,
				field: null,
				type: SearchCategoryType.calendar,
			}

			const query: SearchQuery = {
				query: "event",
				restriction,
				maxResults: null,
			}

			when(calendarEventsRepository.getDaysToEvents()).thenReturn(makeDaysToEvents(event1, event2))

			const { resultItems } = await search.runCalendarSearch(query, abort.signal)
			o(resultItems).deepEquals([event1, event2])
		})

		o.test("a query that does not match description or summary of any event should return an empty array in the search result", async function () {
			const eventStartDate = new Date(2026, 7, 27)
			const eventEndDate = new Date(2026, 7, 28)
			const event1 = createTestEntity(CalendarEventTypeRef, {
				summary: "test event",
				description: "",
				startTime: eventStartDate,
				endTime: eventEndDate,
			})
			event1._id = ["ListID", "Event1ID"]
			const event2 = createTestEntity(CalendarEventTypeRef, {
				summary: "no summary",
				description: "test event",
				startTime: eventStartDate,
				endTime: eventEndDate,
			})
			event2._id = ["ListID", "Event2ID"]

			const rangeStart = new Date(2026, 7, 20)
			const rangeEnd = new Date(2026, 8, 1)

			const restriction: SearchRestriction = {
				start: rangeStart.getTime(),
				end: rangeEnd.getTime(),
				folderIds: [],
				attributeIds: null,
				eventSeries: null,
				field: null,
				type: SearchCategoryType.calendar,
			}

			const query: SearchQuery = {
				query: "tuta",
				restriction,
				maxResults: null,
			}

			when(calendarEventsRepository.getDaysToEvents()).thenReturn(makeDaysToEvents(event1, event2))

			const { resultItems } = await search.runCalendarSearch(query, abort.signal)
			o(resultItems).deepEquals([])
		})
		o.test("", async function () {})
	})
})

function makeDaysToEvents(...events: CalendarEvent[]): Stream<DaysToEvents> {
	const daysToEventsMap: Map<number, EventWrapper[]> = new Map()

	for (const event of events) {
		const startOfDay = getStartOfDay(event.startTime).getTime()
		if (!daysToEventsMap.has(startOfDay)) {
			daysToEventsMap.set(startOfDay, [])
		}
		const a = daysToEventsMap.get(startOfDay)
		a?.push({ event, flags: { isAlteredInstance: false, hasAlarms: false }, color: "whatever" })
	}

	return stream(daysToEventsMap)
}
