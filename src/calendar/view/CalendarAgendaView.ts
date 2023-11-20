import m, { Children, Component, Vnode } from "mithril"
import { incrementDate, lastThrow, neverNull } from "@tutao/tutanota-utils"
import { lang } from "../../misc/LanguageViewModel"
import { formatDate, formatDateWithWeekday } from "../../misc/Formatter"
import { getEventColor, getStartOfDayWithZone, getTimeZone } from "../date/CalendarUtils"
import { isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import type { GroupColors } from "./CalendarView"
import type { CalendarEventBubbleClickHandler } from "./CalendarViewModel"
import { getNextFourteenDays } from "./CalendarGuiUtils.js"
import { styles } from "../../gui/styles.js"
import { DateTime } from "luxon"
import { CalendarAgendaItemView } from "./CalendarAgendaItemView.js"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"
import { theme } from "../../gui/theme.js"
import { px, size } from "../../gui/size.js"
import { DaySelector } from "../date/DaySelector.js"

type Attrs = {
	selectedDate: Date
	/**
	 * maps start of day timestamp to events on that day
	 */
	eventsForDays: Map<number, Array<CalendarEvent>>
	amPmFormat: boolean
	onEventClicked: CalendarEventBubbleClickHandler
	groupColors: GroupColors
	hiddenCalendars: ReadonlySet<Id>
	startOfTheWeekOffset: number
	isDaySelectorExpanded: boolean
	/** when the user explicitly pressed on a day to show */
	onShowDate: (date: Date) => unknown
	/**  when the selected date was changed  */
	onDateSelected: (date: Date) => unknown
}

export class CalendarAgendaView implements Component<Attrs> {
	view({ attrs }: Vnode<Attrs>): Children {
		const selectedDate = attrs.selectedDate
		return m(".fill-absolute.flex.col.mlr-safe-inset", [
			this.renderDateSelector(attrs, selectedDate),
			styles.isDesktopLayout()
				? m(`.rel.flex-grow.content-bg`, [this.renderAgendaForDateRange(attrs)])
				: // if the scroll is not on the child but on the nested one it will overflow
				  m(`.rel.flex-grow.content-bg.scroll.border-radius-top-left-big.border-radius-top-right-big"`, [this.renderAgendaForDay(attrs)]),
		])
	}

	private renderDateSelector(attrs: Attrs, selectedDate: Date): Children {
		// This time width is used to create a container above the day slider
		// So the hidden dates "seems" to be following the same margin of the view
		const timeWidth = styles.isSingleColumnLayout() ? size.calendar_hour_width_mobile : size.calendar_hour_width
		return styles.isDesktopLayout()
			? null
			: m(
					".flex.full-width.items-center",
					m(
						".full-width.overflow-hidden",
						{
							style: {
								"margin-left": px(timeWidth),
							},
						},
						[
							m(
								".pb-s.full-width",

								m(DaySelector, {
									eventsForDays: attrs.eventsForDays,
									selectedDate: selectedDate,
									onDateSelected: (selectedDate: Date) => {
										attrs.onDateSelected(selectedDate)
									},
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
								}),
							),
						],
					),
			  )
	}

	private renderAgendaForDay(attrs: Attrs): Children {
		const events = (attrs.eventsForDays.get(attrs.selectedDate.getTime()) ?? []).filter((e) => !attrs.hiddenCalendars.has(neverNull(e._ownerGroup)))
		if (events.length === 0) {
			return m(ColumnEmptyMessageBox, {
				icon: BootIcons.Calendar,
				message: "noEntries_msg",
				color: theme.list_message_bg,
			})
		} else {
			return m(".pt-s.flex.mlr.mb-s.col", this.renderEventsForDay(events, attrs.selectedDate, getTimeZone(), attrs.groupColors, attrs.onEventClicked))
		}
	}

	private renderAgendaForDateRange(attrs: Attrs): Children {
		const now = new Date()
		const zone = getTimeZone()
		const today = getStartOfDayWithZone(now, zone)
		const tomorrow = incrementDate(new Date(today), 1)
		const days = getNextFourteenDays(today)
		const lastDay = lastThrow(days)

		const lastDayFormatted = formatDate(lastDay)
		return m(
			".scroll.pt-s",
			days
				.map((day: Date) => {
					let events = (attrs.eventsForDays.get(day.getTime()) || []).filter((e) => !attrs.hiddenCalendars.has(neverNull(e._ownerGroup)))

					if (day.getTime() === today.getTime()) {
						// only show future and currently running events
						events = events.filter((ev) => isAllDayEvent(ev) || attrs.selectedDate < ev.endTime)
					} else if (day.getTime() > tomorrow.getTime() && events.length === 0) {
						return null
					}

					const dateDescription =
						day.getTime() === today.getTime()
							? lang.get("today_label")
							: day.getTime() === tomorrow.getTime()
							? lang.get("tomorrow_label")
							: formatDateWithWeekday(day)
					return m(
						".flex.mlr-l.calendar-agenda-row.mb-s.col",
						{
							key: day.getTime(),
						},
						[
							m(
								"button.pb-s.b",
								{
									onclick: () => attrs.onShowDate(new Date(day)),
								},
								dateDescription,
							),
							m(
								".flex-grow",
								{
									style: {
										"max-width": "600px",
									},
								},
								this.renderEventsForDay(events, day, zone, attrs.groupColors, attrs.onEventClicked),
							),
						],
					)
				})
				.filter(Boolean) // mithril doesn't allow mixing keyed elements with null (for perf reasons it seems)
				.concat(
					m(
						".mlr-l",
						{
							key: "events_until",
						},
						lang.get("showingEventsUntil_msg", {
							"{untilDay}": lastDayFormatted,
						}),
					),
				),
		)
	}

	private renderEventsForDay(
		events: CalendarEvent[],
		day: Date,
		zone: string,
		colors: GroupColors,
		click: (event: CalendarEvent, domEvent: MouseEvent) => unknown,
	) {
		return events.length === 0
			? m(".mb-s", lang.get("noEntries_msg"))
			: m(
					".flex.col",
					{
						style: {
							gap: "3px",
						},
					},
					events.map((event) => {
						return m(
							"",
							// this causes mithril to crash on some days, not clear why yet
							// {
							// 	key: event._id.toString(),
							// },
							m(CalendarAgendaItemView, {
								event: event,
								color: getEventColor(event, colors),
								click: (domEvent) => click(event, domEvent),
								zone,
								day: day,
							}),
						)
					}),
			  )
	}
}
