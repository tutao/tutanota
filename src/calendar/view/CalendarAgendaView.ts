import m, { Child, Children, Component, Vnode, VnodeDOM } from "mithril"
import { incrementDate, isSameDay } from "@tutao/tutanota-utils"
import { lang } from "../../misc/LanguageViewModel"
import { getTimeZone } from "../date/CalendarUtils"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import type { GroupColors } from "./CalendarView"
import type { CalendarEventBubbleClickHandler, CalendarEventBubbleKeyUpHandler } from "./CalendarViewModel"
import { styles } from "../../gui/styles.js"
import { DateTime } from "luxon"
import { CalendarAgendaItemView } from "./CalendarAgendaItemView.js"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"
import { theme } from "../../gui/theme.js"
import { px, size } from "../../gui/size.js"
import { DaySelector } from "../gui/day-selector/DaySelector.js"
import { CalendarEventPreviewViewModel } from "../gui/eventpopup/CalendarEventPreviewViewModel.js"
import { EventDetailsView } from "./EventDetailsView.js"
import { getElementId, getListId } from "../../api/common/utils/EntityUtils.js"
import { isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils.js"
import { CalendarTimeIndicator } from "./CalendarTimeIndicator.js"
import { Time } from "../date/Time.js"
import { DaysToEvents } from "../date/CalendarEventsRepository.js"

import { formatEventTimes, getEventColor, shouldDisplayEvent } from "../gui/CalendarGuiUtils.js"
import { PageView } from "../../gui/base/PageView.js"

export type CalendarAgendaViewAttrs = {
	selectedDate: Date
	selectedTime?: Time
	/**
	 * maps start of day timestamp to events on that day
	 */
	eventsForDays: DaysToEvents
	amPmFormat: boolean
	onEventClicked: CalendarEventBubbleClickHandler
	onEventKeyUp: CalendarEventBubbleKeyUpHandler
	groupColors: GroupColors
	hiddenCalendars: ReadonlySet<Id>
	startOfTheWeekOffset: number
	isDaySelectorExpanded: boolean
	/** when the user explicitly pressed on a day to show */
	onShowDate: (date: Date) => unknown
	/**  when the selected date was changed  */
	onDateSelected: (date: Date) => unknown
	eventPreviewModel: CalendarEventPreviewViewModel | null
}

export class CalendarAgendaView implements Component<CalendarAgendaViewAttrs> {
	private scrollPosition: number = 0

	private lastScrolledDate: Date | null = null
	private listDom: HTMLElement | null = null

	view({ attrs }: Vnode<CalendarAgendaViewAttrs>): Children {
		const isDesktopLayout = styles.isDesktopLayout()
		const selectedDate = attrs.selectedDate

		let containerStyle

		if (isDesktopLayout) {
			containerStyle = {
				marginLeft: "5px",
				marginBottom: px(size.hpad_large),
			}
		} else {
			containerStyle = {}
		}

		const agendaChildren = this.renderAgenda(attrs, isDesktopLayout)

		if (attrs.selectedTime && attrs.eventsForDays.size > 0 && this.lastScrolledDate != attrs.selectedDate) {
			this.lastScrolledDate = attrs.selectedDate
			requestAnimationFrame(() => {
				if (this.listDom) {
					this.listDom.scrollTop = this.scrollPosition
				}
			})
		}

		return m(".fill-absolute.flex.col", { class: isDesktopLayout ? "mlr-l height-100p" : "mlr-safe-inset", style: containerStyle }, [
			this.renderDateSelector(attrs, isDesktopLayout, selectedDate),
			m(
				".rel.flex-grow.flex.col",
				{
					class: isDesktopLayout ? "overflow-hidden" : "content-bg scroll border-radius-top-left-big border-radius-top-right-big",
					oncreate: (vnode: VnodeDOM) => {
						if (!isDesktopLayout) this.listDom = vnode.dom as HTMLElement
					},
				},
				agendaChildren,
			),
		])
	}

	private renderDateSelector(attrs: CalendarAgendaViewAttrs, isDesktopLayout: boolean, selectedDate: Date): Children {
		// This time width is used to create a container above the day slider
		// So the hidden dates "seems" to be following the same margin of the view
		const timeWidth = !isDesktopLayout ? size.calendar_hour_width_mobile : size.calendar_hour_width
		return isDesktopLayout
			? null
			: m(
					"",
					m(
						".header-bg.pb-s.overflow-hidden",
						{
							style: {
								"margin-left": px(size.calendar_hour_width_mobile),
							},
						},
						m(DaySelector, {
							selectedDate: selectedDate,
							onDateSelected: (selectedDate: Date) => attrs.onDateSelected(selectedDate),
							wide: true,
							startOfTheWeekOffset: attrs.startOfTheWeekOffset,
							isDaySelectorExpanded: attrs.isDaySelectorExpanded,
							handleDayPickerSwipe: (isNext: boolean) => {
								const sign = isNext ? 1 : -1
								const duration = {
									month: sign * (attrs.isDaySelectorExpanded ? 1 : 0),
									week: sign * (attrs.isDaySelectorExpanded ? 0 : 1),
								}

								attrs.onDateSelected(DateTime.fromJSDate(attrs.selectedDate).plus(duration).toJSDate())
							},
							showDaySelection: true,
							highlightToday: true,
							highlightSelectedWeek: false,
							useNarrowWeekName: styles.isSingleColumnLayout(),
							hasEventOn: (date) =>
								attrs.eventsForDays.get(date.getTime())?.some((event) => shouldDisplayEvent(event, attrs.hiddenCalendars)) ?? false,
						}),
					),
			  )
	}

	private renderDesktopEventList(attrs: CalendarAgendaViewAttrs): Children {
		const events = this.getEventsToRender(attrs.selectedDate, attrs)
		if (events.length === 0) {
			return m(ColumnEmptyMessageBox, {
				icon: BootIcons.Calendar,
				message: "noEntries_msg",
				color: theme.list_message_bg,
			})
		} else {
			return m(".flex.mb-s.col", this.renderEventsForDay(events, getTimeZone(), attrs.selectedDate, attrs))
		}
	}

	private renderMobileAgendaView(attrs: CalendarAgendaViewAttrs) {
		const day = attrs.selectedDate
		const previousDay = incrementDate(new Date(day), -1)
		const nextDay = incrementDate(new Date(day), 1)
		return m(PageView, {
			previousPage: {
				key: previousDay.getTime(),
				nodes: this.renderMobileEventList(previousDay, attrs),
			},
			currentPage: {
				key: day.getTime(),
				nodes: this.renderMobileEventList(day, attrs),
			},
			nextPage: {
				key: nextDay.getTime(),
				nodes: this.renderMobileEventList(nextDay, attrs),
			},
			onChangePage: (next) => attrs.onDateSelected(next ? nextDay : previousDay),
		})
	}

	private renderMobileEventList(day: Date, attrs: CalendarAgendaViewAttrs): Children {
		const events = this.getEventsToRender(day, attrs)
		if (events.length === 0) {
			return m(ColumnEmptyMessageBox, {
				icon: BootIcons.Calendar,
				message: "noEntries_msg",
				color: theme.list_message_bg,
			})
		} else {
			return m(
				".pt-s.flex.mb-s.col.overflow-y-scroll.height-100p",
				{ style: { marginLeft: px(size.calendar_hour_width_mobile) } },
				this.renderEventsForDay(events, getTimeZone(), day, attrs),
			)
		}
	}

	private getEventsToRender(day: Date, attrs: CalendarAgendaViewAttrs): readonly CalendarEvent[] {
		return (attrs.eventsForDays.get(day.getTime()) ?? []).filter((e) => {
			return shouldDisplayEvent(e, attrs.hiddenCalendars)
		})
	}

	private renderAgenda(attrs: CalendarAgendaViewAttrs, isDesktopLayout: boolean): Children {
		if (!isDesktopLayout) return this.renderMobileAgendaView(attrs)

		return m(".flex.flex-grow.height-100p", [
			m(
				".flex-grow.rel.overflow-y-scroll",
				{
					style: {
						"min-width": px(size.second_col_min_width),
						"max-width": px(size.second_col_max_width),
					},
					oncreate: (vnode: VnodeDOM) => (this.listDom = vnode.dom as HTMLElement),
				},
				[this.renderDesktopEventList(attrs)],
			),
			m(
				".ml-l.flex-grow.scroll",
				{
					style: {
						"min-width": px(size.third_col_min_width),
						"max-width": px(size.third_col_max_width),
					},
				},
				attrs.eventPreviewModel == null
					? m(
							".rel.flex-grow.height-100p",
							m(ColumnEmptyMessageBox, {
								icon: BootIcons.Calendar,
								message: () => lang.get("noEventSelect_msg"),
								color: theme.list_message_bg,
							}),
					  )
					: m(EventDetailsView, {
							eventPreviewModel: attrs.eventPreviewModel,
					  }),
			),
		])
	}

	private renderEventsForDay(events: readonly CalendarEvent[], zone: string, day: Date, attrs: CalendarAgendaViewAttrs) {
		const { groupColors: colors, onEventClicked: click, onEventKeyUp: keyUp, eventPreviewModel: modelPromise } = attrs
		const agendaItemHeight = 62
		const agendaGap = 3
		const currentTime = attrs.selectedTime?.toDate()
		let newScrollPosition = 0

		// Find what event to display a time indicator for; do this even if it is not the same day, as we might want to refresh the view when the date rolls over to this day
		const eventToShowTimeIndicator = earliestEventToShowTimeIndicator(events, new Date())
		// Flat list structure so that we don't have problems with keys
		let eventsNodes: Child[] = []
		for (const [eventIndex, event] of events.entries()) {
			if (eventToShowTimeIndicator === eventIndex && isSameDay(new Date(), event.startTime)) {
				eventsNodes.push(m(".mt-xs.mb-xs", { key: "timeIndicator" }, m(CalendarTimeIndicator, { circleLeftTangent: true })))
			}
			if (currentTime && event.startTime < currentTime) {
				newScrollPosition += agendaItemHeight + agendaGap
			}
			eventsNodes.push(
				m(CalendarAgendaItemView, {
					key: getListId(event) + getElementId(event) + event.startTime.toISOString(),
					event: event,
					color: getEventColor(event, colors),
					selected: event === modelPromise?.calendarEvent,
					click: (domEvent) => click(event, domEvent),
					keyUp: (domEvent) => keyUp(event, domEvent),
					zone,
					day: day,
					height: agendaItemHeight,
					timeText: formatEventTimes(day, event, zone),
				}),
			)
		}
		// one agenda item height needs to be removed to show the correct item
		this.scrollPosition = newScrollPosition - (agendaItemHeight + agendaGap)
		return events.length === 0
			? m(".mb-s", lang.get("noEntries_msg"))
			: m(
					".flex.col",
					{
						style: {
							gap: px(agendaGap),
						},
					},
					eventsNodes,
			  )
	}
}

/**
 * Calculate the next event to occur with a given date; all-day events will be ignored
 * @param events list of events to check
 * @param date date to use
 * @return the index, or null if there is no next event
 */
export function earliestEventToShowTimeIndicator(events: readonly CalendarEvent[], date: Date): number | null {
	// We do not want to show the time indicator above any all day events
	const firstNonAllDayEvent = events.findIndex((event) => !isAllDayEvent(event))
	if (firstNonAllDayEvent < 0) {
		return null
	}

	// Next, we want to locate the first event where the start time has yet to be reached
	const nonAllDayEvents = events.slice(firstNonAllDayEvent)
	const nextEvent = nonAllDayEvents.findIndex((event) => event.startTime > date)
	if (nextEvent < 0) {
		return null
	}

	return nextEvent + firstNonAllDayEvent
}
