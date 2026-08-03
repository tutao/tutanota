import stream from "mithril/stream"
import Stream from "mithril/stream"
import { getElementId, isSameId, listIdPart } from "../../../../platform-kit/meta"
import { assertMainOrNode, CancelledError, NOTHING_INDEXED_TIMESTAMP } from "../../../../platform-kit/app-env"
import { SearchIndexStateInfo, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import {
	assertNonNull,
	assertNotNull,
	incrementMonth,
	isNotEmpty,
	lastIndex,
	lazyAsync,
	remove,
	stringToBase64,
	tokenize,
} from "../../../../platform-kit/utils"
import { ProgressTracker } from "../../../common/api/main/ProgressTracker.js"
import { CalendarEventsRepository } from "../../../common/calendar/date/CalendarEventsRepository.js"

import { ProgressMonitorInterface } from "../../../../platform-kit/network/ProgressMonitorInterface"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef } from "@tutao/entities/tutanota"
import { EventController } from "../../../common/api/main/EventController"
import { EntityUpdateData, isUpdateForTypeRef, OnEntityUpdateReceivedPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { encodeCalendarSearchKey } from "../../calendar/search/model/SearchUtils"
import { LiveSearchResult, SearchQuery } from "../../../common/search/SearchUtils"

assertMainOrNode()

export class CalendarSearchModel {
	indexState: Stream<SearchIndexStateInfo>
	indexingSupported: boolean

	private readonly liveResults: LiveSearchResult<unknown>[] = []

	constructor(
		private readonly eventController: EventController,
		private readonly calendarEventsRepository: lazyAsync<CalendarEventsRepository>,
		private readonly progressTracker: ProgressTracker,
	) {
		this.indexingSupported = true
		this.indexState = stream<SearchIndexStateInfo>({
			initializing: true,
			mailIndexEnabled: false,
			progress: 0,
			currentMailIndexTimestamp: NOTHING_INDEXED_TIMESTAMP,
			aimedMailIndexTimestamp: NOTHING_INDEXED_TIMESTAMP,
			indexedMailCount: 0,
			failedIndexingUpTo: null,
		})

		this.eventController.addEntityListener({
			onEntityUpdatesReceived: async (updates, eventOwnerGroupId, isInitialSyncDone) => {
				for (const liveResult of this.liveResults) {
					await liveResult.entityEventsReceived(updates)
				}
			},
			// receive updates after models
			priority: OnEntityUpdateReceivedPriority.LOW,
		})
	}

	async coolNewSearchCalendar(searchQuery: SearchQuery, abortSignal: AbortSignal): Promise<LiveSearchResult<CalendarEvent>> {
		const { tokens, resultItems } = await this.runCalendarSearch(searchQuery, abortSignal)

		const searchResult: SearchResult = {
			// data that is relevant to calendar search
			matchWordOrder: false,
			restriction: searchQuery.restriction,
			results: resultItems.map((item) => item._id),
			query: searchQuery.query,
			tokens: tokens.map((t) => {
				return { token: t, exact: false }
			}),
			// index related, keep empty
			currentIndexTimestamp: 0,
			moreResults: [],
			moreResultsEntries: [],
			lastReadSearchIndexRow: [],
		}
		let loadedUntil = Math.min(searchQuery.maxResults ?? resultItems.length, resultItems.length)
		// const initialEvents = resultItems.slice(0, searchQuery.maxResults ?? resultItems.length)
		const liveResult: LiveSearchResult<CalendarEvent> = {
			searchResult,
			get items() {
				return resultItems.slice(0, loadedUntil)
			},
			loadMoreResults: async (count) => {
				const oldLoadedUntil = loadedUntil
				loadedUntil = Math.min(loadedUntil + count, resultItems.length)
				return resultItems.slice(oldLoadedUntil, loadedUntil)
			},
			get hasMoreResults() {
				return isNotEmpty(resultItems) && loadedUntil < lastIndex(resultItems)
			},
			updates: stream(),
			dispose: () => {
				remove(this.liveResults, liveResult)
				liveResult.updates.end(true)
			},
			extendResults: (extendEnd) => {},
			entityEventsReceived: async (updates) => {
				for (const update of updates) {
					if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
						const updateId: IdTuple = [update.instanceListId, update.instanceId]
						const isItemInList = resultItems.some((item) => isSameId(updateId, item._id))
						if (isItemInList) {
							resultItems.splice(0, resultItems.length)
							const { resultItems: newItems } = await this.runCalendarSearch(searchQuery, abortSignal)
							resultItems.push(...newItems)
							searchResult.results = resultItems.map((item) => item._id)
							liveResult.updates({ type: "reset" })
						}
					} else if (isUpdateForTypeRef(ContactTypeRef, update) && this.isPossibleBirthdayContactUpdate(resultItems, update)) {
						const calendarModel = await this.calendarEventsRepository()
						await calendarModel.handleContactEvent(update.operation, [update.instanceListId, update.instanceId])

						resultItems.splice(0, resultItems.length)
						const { resultItems: newItems } = await this.runCalendarSearch(searchQuery, abortSignal)
						resultItems.push(...newItems)
						searchResult.results = resultItems.map((item) => item._id)
						liveResult.updates({ type: "reset" })
					}
				}
			},
		}
		this.liveResults.push(liveResult)
		return liveResult
	}
	private isPossibleBirthdayContactUpdate(items: readonly CalendarEvent[], update: EntityUpdateData<Contact>): boolean {
		const { instanceListId, instanceId } = update
		const encodedContactId = stringToBase64(`${instanceListId}/${instanceId}`)
		return items.some((searchEntry) => getElementId(searchEntry).endsWith(encodedContactId))
	}

	async runCalendarSearch(searchQuery: SearchQuery, abortSignal: AbortSignal): Promise<{ tokens: string[]; resultItems: CalendarEvent[] }> {
		const calendarEventsRepository = await this.calendarEventsRepository()

		const query = searchQuery.query
		const tokens = tokenize(query.trim())
		const restriction = searchQuery.restriction

		// we interpret restriction.start as the start of the first day of the first month we want to search
		// restriction.end is the end of the last day of the last month we want to search
		const startDate = new Date(assertNotNull(restriction.start))
		const endDate = new Date(assertNotNull(restriction.end))
		const daysInMonths: Date[] = []

		let currentDate = startDate
		while (currentDate.getTime() <= endDate.getTime()) {
			daysInMonths.push(currentDate)
			currentDate = incrementMonth(currentDate, 1)
		}

		const monitorHandle = this.progressTracker.registerMonitorSync(daysInMonths.length)
		const monitor: ProgressMonitorInterface = assertNotNull(this.progressTracker.getMonitor(monitorHandle))

		if (abortSignal.aborted) {
			throw new CancelledError("search cancelled")
		}

		const resultItems: CalendarEvent[] = []

		const canLoadBirthdaysCalendar = await calendarEventsRepository.canLoadBirthdaysCalendar()
		if (canLoadBirthdaysCalendar) {
			await calendarEventsRepository.loadContactsBirthdays()
		}

		await calendarEventsRepository.loadMonthsIfNeeded(daysInMonths, abortSignal, monitor)
		monitor.completed()

		const daysToEvents = calendarEventsRepository.getDaysToEvents()()

		// This is taken over from the previous implementation, but these should always
		// be non-null unless due to some weird side effects. Do we need to keep these checks?
		assertNonNull(restriction.start)
		assertNonNull(restriction.end)

		// we want event instances that occur on multiple days to only appear once, but want
		// separate instances of event series to occur on their own.
		const alreadyAdded: Set<string> = new Set()

		if (abortSignal.aborted) {
			throw new CancelledError("search cancelled")
		}

		const shouldIncludeEvent = (key: string, event: CalendarEvent) => {
			if (alreadyAdded.has(key)) {
				// we only need the first event in the series, the view will load & then generate
				// the series for the searched time range.
				return false
			}

			if (restriction.folderIds.length > 0 && !restriction.folderIds.includes(listIdPart(event._id))) {
				// check that the event is in the searched calendar.
				return false
			}

			if (restriction.eventSeries === false && event.repeatRule != null) {
				// applied "repeating" search filter
				return false
			}

			for (const token of tokens) {
				if (event.summary.toLowerCase().includes(token)) {
					return true
				}
			}
			// check description last because it's a bit more expensive
			const description = event.description.replaceAll(/(<[^>]+>)/gi, " ").toLowerCase()
			for (const token of tokens) {
				if (description.includes(token)) {
					return true
				}
			}

			return false
		}

		if (tokens.length > 0) {
			// we're iterating by event first to only have to sanitize the description once.
			// that's a smaller savings than one might think because for the vast majority of
			// events we're probably not matching and looking into the description anyway.
			for (const [startOfDay, eventsOnDay] of daysToEvents) {
				for (const wrapper of eventsOnDay) {
					if (!(startOfDay >= restriction.start && startOfDay <= restriction.end)) {
						continue
					}

					const key = encodeCalendarSearchKey(wrapper.event)

					if (shouldIncludeEvent(key, wrapper.event)) {
						alreadyAdded.add(key)
						resultItems.push(wrapper.event)
					}

					if (abortSignal.aborted) {
						throw new CancelledError("search cancelled")
					}
				}
			}
		}

		return { tokens, resultItems }
	}
}
