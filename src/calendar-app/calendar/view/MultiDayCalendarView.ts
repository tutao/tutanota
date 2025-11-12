import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { deduplicate, identity, incrementDate } from "@tutao/tutanota-utils"
import { getRangeOfDays, getStartOfWeek, isSameEventInstance } from "../../../common/calendar/date/CalendarUtils"
import { WeekStart } from "../../../common/api/common/TutanotaConstants"
import type { EventDragHandlerCallbacks } from "./EventDragHandler"
import { styles } from "../../../common/gui/styles"
import type { CalendarEventBubbleClickHandler, CalendarEventBubbleKeyDownHandler, EventsOnDays, ScrollByListener } from "./CalendarViewModel"
import { CalendarViewType } from "../../../common/api/common/utils/CommonCalendarUtils"
import { Time } from "../../../common/calendar/date/Time.js"
import { getStartOfTheWeekOffset } from "../../../common/misc/weekOffset"
import { CalendarViewComponent, CalendarViewComponentAttrs, CalendarViewPageAttrs } from "./calendarViewComponent/CalendarViewComponent"
import { HeaderVariant } from "./calendarViewComponent/WeekDaysComponent"
import { CellActionHandler } from "../../../common/calendar/gui/CalendarTimeGrid"

export type MultiDayCalendarViewAttrs = {
	selectedDate: Date
	/** Number of days to display (1 for single day, 3 for three-day, 7 for week) */
	daysInPeriod: number
	onDateSelected: (date: Date, calendarViewTypeToShow?: CalendarViewType) => unknown
	/** Function to fetch events for a given date range */
	getEventsOnDays: (range: Array<Date>) => EventsOnDays
	onNewEvent: (date: Date | null) => unknown
	onEventClicked: CalendarEventBubbleClickHandler
	/** Callback for keyboard interactions on event bubbles */
	onEventKeyDown: CalendarEventBubbleKeyDownHandler
	startOfTheWeek: WeekStart
	/** Callback when navigating to next/previous period */
	onChangeViewPeriod: (next: boolean) => unknown
	dragHandlerCallbacks: EventDragHandlerCallbacks
	isDaySelectorExpanded: boolean
	currentViewType: CalendarViewType
	onViewChanged: (vnode: VnodeDOM) => unknown
	showWeekDaysSection: boolean
	smoothScroll: boolean
	registerScrollByListener: (listener: ScrollByListener) => void
	removeScrollByListener: () => void
}

type PageViewData = { previous: CalendarViewPageAttrs; current: CalendarViewPageAttrs; next: CalendarViewPageAttrs }

/**
 * Multi-day calendar view component that displays events across multiple days (Single day, 3-day or week view).
 *
 * Manages a sliding window of three periods (previous, current, next) to enable smooth
 * navigation and swipe gestures. Events are deduplicated across period boundaries.
 *
 * @example
 * m(MultiDayCalendarView, {
 *   selectedDate: new Date(),
 *   daysInPeriod: 7,  // or 3 for three-day view
 *   startOfTheWeek: WeekStart.MONDAY,
 *   // ... other props
 * })
 */
export class MultiDayCalendarView implements Component<MultiDayCalendarViewAttrs> {
	// Cache ranges used in the PageView
	private cachedDateRanges?: {
		key: string
		ranges: { previous: Date[]; current: Date[]; next: Date[] }
	}

	onremove(vnode: VnodeDOM<MultiDayCalendarViewAttrs>): any {
		vnode.attrs.removeScrollByListener()
	}

	view({ attrs }: Vnode<MultiDayCalendarViewAttrs>): Children {
		const { previous, current, next } = this.getPeriods(attrs.selectedDate, attrs.daysInPeriod, attrs.startOfTheWeek, attrs.getEventsOnDays)

		const newEventHandler: CellActionHandler = (baseDate: Date, time: Time) => {
			const newDate = new Date(baseDate)
			newDate.setHours(time.hour, time.minute)
			attrs.onNewEvent(newDate)
			attrs.onDateSelected(new Date(baseDate))
		}

		return m(CalendarViewComponent, {
			headerComponentAttrs: {
				dates: getRangeOfDays(new Date(current.key), attrs.daysInPeriod),
				selectedDate: attrs.selectedDate,
				onDateClick: attrs.onDateSelected,
				startOfWeek: attrs.startOfTheWeek,
				isDaySelectorExpanded: attrs.isDaySelectorExpanded,
				variant: styles.isDesktopLayout() || attrs.currentViewType === CalendarViewType.THREE_DAY ? HeaderVariant.NORMAL : HeaderVariant.SWIPEABLE,
				showWeekDays: attrs.showWeekDaysSection,
			},
			bodyComponentAttrs: {
				previous,
				current,
				next,
				onChangePage: attrs.onChangeViewPeriod,
				smoothScroll: attrs.smoothScroll,
				registerListener: attrs.registerScrollByListener,
				onViewChanged: attrs.onViewChanged,
			},
			cellActionHandlers: {
				onCellPressed: newEventHandler,
				onCellContextMenuPressed: newEventHandler,
			},
			eventBubbleHandlers: {
				click: attrs.onEventClicked,
				keyDown: attrs.onEventKeyDown,
			},
			dragHandlerCallbacks: attrs.dragHandlerCallbacks,
		} satisfies CalendarViewComponentAttrs)
	}

	private getPeriods(baseDate: Date, daysInPeriod: number, startOfTheWeek: WeekStart, getEventsFunction: (range: Date[]) => EventsOnDays): PageViewData {
		const cacheKey = `${baseDate.getTime()}-${daysInPeriod}-${startOfTheWeek}`

		if (!this.cachedDateRanges || this.cachedDateRanges.key !== cacheKey) {
			const startOfPeriods = this.getStartOfPeriods(baseDate, daysInPeriod, startOfTheWeek)
			this.cachedDateRanges = {
				key: cacheKey,
				ranges: {
					previous: getRangeOfDays(startOfPeriods.previous, daysInPeriod),
					current: getRangeOfDays(startOfPeriods.current, daysInPeriod),
					next: getRangeOfDays(startOfPeriods.next, daysInPeriod),
				},
			}
		}

		return {
			previous: this.buildPeriodDataFromRange(this.cachedDateRanges.ranges.previous, getEventsFunction),
			current: this.buildPeriodDataFromRange(this.cachedDateRanges.ranges.current, getEventsFunction),
			next: this.buildPeriodDataFromRange(this.cachedDateRanges.ranges.next, getEventsFunction),
		}
	}

	private getStartOfPeriods(baseDate: Date, daysInPeriod: number, startOfWeek: WeekStart) {
		const startOfThisPeriod = daysInPeriod === 7 ? getStartOfWeek(baseDate, getStartOfTheWeekOffset(startOfWeek)) : baseDate
		const startOfPreviousPeriod = incrementDate(new Date(startOfThisPeriod), -daysInPeriod)
		const startOfNextPeriod = incrementDate(new Date(startOfThisPeriod), daysInPeriod)

		return { previous: startOfPreviousPeriod, current: startOfThisPeriod, next: startOfNextPeriod }
	}

	private buildPeriodDataFromRange(dateRange: Date[], getEventsFunction: (range: Date[]) => EventsOnDays): CalendarViewPageAttrs {
		const startDate = dateRange[0]
		const eventsInPeriod = getEventsFunction(dateRange)
		return {
			key: startDate.getTime(),
			dates: eventsInPeriod.days,
			events: {
				short: deduplicate(eventsInPeriod.shortEventsPerDay.flatMap(identity), isSameEventInstance),
				long: deduplicate(eventsInPeriod.longEvents, isSameEventInstance),
			},
		}
	}
}
