import m, { Children, ClassComponent, Vnode } from "mithril"
import { theme } from "../../../../ui/theme"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { AriaRole } from "../../../../ui/AriaUtils"
import { TabIndex } from "@tutao/app-env"
import { Keys } from "../../../../ui/utils/KeyboardKeys"
import { isKeyPressed } from "../../../../ui/utils/KeyManager"
import { CalendarTimeColumn, CalendarTimeColumnAttrs } from "../../../common/calendar/gui/CalendarTimeColumn"
import {
	CalendarTimeGrid,
	CalendarTimeGridAttributes,
	getIntervalAsMinutes,
	SUBROWS_PER_INTERVAL,
	TimeRange,
	TimeScale,
} from "../../../common/calendar/gui/CalendarTimeGrid"
import { filterNull, getStartOfDay, getStartOfNextDay, isSameDay } from "@tutao/utils"
import { EventBannerAreas, InviteAgenda } from "./EventBannerImpl"
import { EventWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel"
import { layout_size, px, size } from "../../../../ui/size"
import { isAllDayEvent, isBefore } from "../../../common/api/common/utils/CommonCalendarUtils"
import { formatDateTime, formatTime } from "../../../../ui/utils/Formatter"
import { CalendarEvent } from "@tutao/entities/tutanota"
import { IcsCalendarEvent } from "../../../calendar-app/calendar/export/CalendarParser"
import { clone } from "@tutao/meta"
import { DateTime } from "luxon"
import { Time } from "../../../common/calendar/Time"
import { getCalendarEventDurationInMinutes } from "../../../common/calendar/date/CalendarUtils"
import { EventBannerIconVariant, EventBannerIconWithText } from "./EventBannerIconWithText"
import { ExpanderPanel } from "../../../../ui/base/Expander"
import { Styles } from "../../../../ui/styles"

export type TimeOverviewAttrs = {
	agenda: InviteAgenda | null
	amPm: boolean
}

type GridParams = {
	eventFocusBound: Date
	timeScale: TimeScale
	timeInterval: number
	/**
	 * Time range with inclusive end time
	 */
	timeRange: TimeRange
	intervals: Time[]
	rowCountForRange: number
}

/**
 * Time overview section of the {@link EventBanner}, a sneak peek into the users agenda
 *
 * It displays a small agenda around the event invitation, displaying maximum three events on the small time window
 * around the main event(invitation)
 */
export class TimeOverview implements ClassComponent<TimeOverviewAttrs> {
	private readonly gridRowHeight = 4

	private displayConflictingAgenda: boolean = false
	private timeColumnWidth: number = 0
	private gridParams: GridParams | null = null

	private eventWrappers: EventWrapper[] = []

	oninit({ attrs }: Vnode<TimeOverviewAttrs>) {
		this.displayConflictingAgenda = attrs.agenda?.conflictCount === 1

		if (attrs.agenda) {
			this.eventWrappers = filterNull([attrs.agenda.before, attrs.agenda.main, attrs.agenda.after])
			const { timeColumnWidth, gridParams } = this.getTimeOverviewParameters(attrs.agenda)
			this.timeColumnWidth = timeColumnWidth
			this.gridParams = gridParams
		}
	}

	view({ attrs }: Vnode<TimeOverviewAttrs>) {
		return m(
			".flex.flex-column.plr-16.pb-16.pt-8.justify-start.gap-8",
			{
				class: Styles.get().isSingleColumnLayout() ? "border-sm border-left-none border-right-none border-bottom-none" : "border-left-sm",
				style: {
					gridArea: EventBannerAreas.TimeOverview,
					"border-color": theme.surface_container_high,
					color: theme.on_surface,
				},
			},
			[this.renderConflictSummary(attrs.agenda), this.renderConflictDetails(attrs.agenda), this.renderConflictTimeGrid(attrs, this.gridParams)],
		)
	}

	private renderConflictSummary(agenda: InviteAgenda | null) {
		if (agenda) {
			if (agenda.conflictCount === 0) {
				return m(EventBannerIconWithText, {
					icon: Icons.SuccessFilled,
					text: lang.getTranslation("noSimultaneousEvents_msg").text,
					iconVariant: EventBannerIconVariant.Success,
				})
			} else if (agenda.conflictCount === 1) {
				return m(EventBannerIconWithText, {
					icon: Icons.ExclamationFilled,
					text: lang.getTranslation("conflict_label").text,
					iconVariant: EventBannerIconVariant.Warning,
				})
			} else if (agenda.conflictCount > 1) {
				return this.renderExpandableConflictSummary(agenda)
			} else {
				return null
			}
		} else {
			return m(EventBannerIconWithText, {
				icon: Icons.FailureFilled,
				text: "ERROR: Could not load the agenda for this day.",
				iconVariant: EventBannerIconVariant.Error,
			})
		}
	}

	private renderConflictDetails(agenda: InviteAgenda | null): Children {
		if (agenda && agenda.conflictCount > 0) {
			return m(
				"",
				{
					style: {
						"margin-left": px(size.icon_24 + size.spacing_4),
					},
				},
				[
					agenda.conflictCount > 1
						? m(
								ExpanderPanel,
								{
									expanded: this.displayConflictingAgenda,
								},
								this.conflictingAgenda(agenda),
							)
						: this.conflictingAgenda(agenda),
				],
			)
		} else {
			return null
		}
	}

	private renderConflictTimeGrid(attrs: TimeOverviewAttrs, gridParams: GridParams | null): Children {
		const { agenda, amPm } = attrs
		if (agenda && gridParams) {
			return m(".flex.rel", [
				m(CalendarTimeColumn, {
					intervals: gridParams.intervals,
					layout: {
						width: this.timeColumnWidth,
						subColumnCount: 1,
						rowCount: gridParams.rowCountForRange,
						gridRowHeight: this.gridRowHeight,
					},
					amPm: amPm,
				} satisfies CalendarTimeColumnAttrs),
				m(
					".full-width",
					m(CalendarTimeGrid, {
						events: TimeOverview.filterOutOfRangeEvents(
							gridParams.timeRange,
							this.eventWrappers,
							gridParams.eventFocusBound,
							gridParams.timeInterval,
						),
						timeScale: gridParams.timeScale,
						timeRange: gridParams.timeRange,
						dates: [getStartOfDay(agenda.main.event.startTime)],
						intervals: gridParams.intervals,
						layout: {
							gridRowHeight: this.gridRowHeight,
							rowCountForRange: gridParams.rowCountForRange,
							hideRightBorder: true,
							showLeftBorderAtFirstColumn: false,
						},
						showTimeZonesAtEventBubble: false,
					} satisfies CalendarTimeGridAttributes),
				),
			])
		} else {
			return null
		}
	}

	private renderExpandableConflictSummary(agenda: InviteAgenda): Children {
		return m(
			".flex.nav-button.gap-8",
			{
				role: AriaRole.Button,
				ariaExpanded: this.displayConflictingAgenda,
				tabIndex: TabIndex.Default,
				onclick: () => this.toggleConflictingAgenda(),
				onkeydown: (e: KeyboardEvent) => {
					if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
						this.toggleConflictingAgenda()
						e.preventDefault()
					}
				},
			},
			[
				m(EventBannerIconWithText, {
					icon: Icons.ExclamationFilled,
					text: lang.getTranslation("conflicts_label", { "{count}": agenda.conflictCount }).text,
					iconVariant: EventBannerIconVariant.Warning,
				}),
				m(Icon, {
					icon: Icons.ArrowDown,
					container: "div",
					class: `fit-content`,
					size: IconSize.PX24,
					style: {
						fill: theme.on_surface,
						rotate: this.displayConflictingAgenda ? "180deg" : "0deg",
					},
				}),
			],
		)
	}

	private toggleConflictingAgenda() {
		this.displayConflictingAgenda = !this.displayConflictingAgenda
	}

	private conflictingAgenda(agenda: InviteAgenda): m.Children {
		return m(".selectable", [
			agenda.regularEvents && agenda.regularEvents.length > 0
				? this.renderNormalConflictingEvents(agenda.main.event.startTime, agenda.regularEvents, agenda.conflictCount > 1)
				: null,
			agenda.allDayEvents.length > 0
				? this.renderAllDayConflictingEvents(agenda.main.event.startTime, agenda.allDayEvents, agenda.conflictCount > 1)
				: null,
		])
	}

	private renderAllDayConflictingEvents(referenceDate: Date, conflictingAllDayEvents: Array<EventWrapper>, showLabel: boolean) {
		return m("", [
			showLabel ? m("strong.small.content-fg", lang.getTranslationText("allDayEvents_label")) : null,
			conflictingAllDayEvents?.map((l) => this.buildConflictingEventInfoText(referenceDate, l, true)),
		])
	}

	private renderNormalConflictingEvents(referenceDate: Date, conflictingRegularEvents: Array<EventWrapper>, showLabel: boolean) {
		return m("", [
			showLabel ? m("strong.small.content-fg", lang.getTranslationText("simultaneousEvents_msg")) : null,
			conflictingRegularEvents?.map((l) => this.buildConflictingEventInfoText(referenceDate, l, false)),
		])
	}

	private buildConflictingEventInfoText(referenceDate: Date, eventWrapper: EventWrapper, isAllDay: boolean) {
		const timeText = !isAllDay ? this.getTimeParts(referenceDate, eventWrapper).join(" - ") : ""
		const eventTitle = eventWrapper.event.summary.trim() !== "" ? eventWrapper.event.summary : lang.getTranslationText("noTitle_label")
		return m(".small.selectable", `• ${eventTitle} ${timeText}`)
	}

	private getTimeParts(referenceDate: Date, eventWrapper: EventWrapper): Array<string> {
		if (isAllDayEvent(eventWrapper.event)) {
			return [lang.getTranslationText("allDay_label")]
		}

		const timeParts: Array<string> = []

		if (isSameDay(referenceDate, eventWrapper.event.startTime)) {
			timeParts.push(formatTime(eventWrapper.event.startTime))
		} else {
			timeParts.push(formatDateTime(eventWrapper.event.startTime))
		}

		if (isSameDay(referenceDate, eventWrapper.event.endTime)) {
			timeParts.push(formatTime(eventWrapper.event.endTime))
		} else {
			timeParts.push(formatDateTime(eventWrapper.event.endTime))
		}

		return timeParts
	}

	private getTimeOverviewParameters(agenda: InviteAgenda): { timeColumnWidth: number; gridParams: GridParams } {
		const mainEvent = agenda.main.event
		let eventFocusBound = mainEvent.startTime

		let shortestTimeFrame: number = this.findShortestDuration(mainEvent, mainEvent) // In this case we just get the event duration and later reevaluate
		if (agenda.before) {
			shortestTimeFrame = this.findShortestDuration(agenda.main.event, agenda.before.event)
		} else if (!agenda.before && agenda.after) {
			if (agenda.after?.flags?.isConflict) {
				// focuses on the start of the conflicting event, to show that it conflicts with the end of the main event.
				eventFocusBound = agenda.after.event.startTime
			}
			shortestTimeFrame = this.findShortestDuration(agenda.main.event, agenda.after.event)
		}

		const timeScale = 1
		const timeInterval = getIntervalAsMinutes(timeScale)
		const timeRange: TimeRange = TimeOverview.getTimeRange(eventFocusBound, timeInterval)

		const intervals = CalendarTimeColumn.createTimeColumnIntervals(timeScale, timeRange)
		const rowCountForRange = SUBROWS_PER_INTERVAL * intervals.length

		const timeColumnWidth = layout_size.calendar_hour_width_mobile + size.spacing_16
		return {
			timeColumnWidth,
			gridParams: {
				eventFocusBound,
				timeScale,
				timeInterval,
				timeRange,
				intervals,
				rowCountForRange,
			},
		}
	}

	private findShortestDuration(a: CalendarEvent | IcsCalendarEvent, b: CalendarEvent | IcsCalendarEvent): number {
		const durationA = getCalendarEventDurationInMinutes(a)
		const durationB = getCalendarEventDurationInMinutes(b)
		return durationA < durationB ? durationA : durationB
	}

	/**
	 * Creates the time range displayed in the TimeOverview around the focused event.
	 *
	 * The preferred range consists of three time slots:
	 * - one interval before the event,
	 * - the interval containing the event,
	 * - one interval after the event.
	 *
	 * If that range would extend beyond the current day, it is clamped so that it stays within the day's boundaries
	 * while still spanning three time slots.
	 *
	 * @param eventFocusBound The point in time that should be centered in the TimeOverview.
	 * @param timeInterval The duration of a single time slot, in minutes.
	 *
	 * @VisibleForTesting
	 */
	static getTimeRange(eventFocusBound: Date, timeInterval: number): TimeRange {
		let startDate = DateTime.fromJSDate(eventFocusBound).minus({ minutes: timeInterval }).toJSDate()
		let endDate = DateTime.fromJSDate(eventFocusBound).plus({ minutes: timeInterval }).toJSDate()

		// If the start date falls on the previous day, clamp the range to the start of the focused day while keeping
		// the total span at three intervals.
		if (isBefore(startDate, eventFocusBound, "date")) {
			startDate = getStartOfDay(eventFocusBound)
			endDate = DateTime.fromJSDate(startDate)
				.plus({ minutes: timeInterval * 2 }) // e.g. 00:00, 00:30, 01:00 (30-minute interval)
				.toJSDate()
		}
		// If the end date falls on the following day, clamp the range to the end of the focused day while keeping
		// the total span at three intervals.
		else if (isBefore(eventFocusBound, endDate, "date")) {
			endDate = DateTime.fromJSDate(eventFocusBound).startOf("day").plus({ day: 1 }).minus({ minutes: timeInterval }).toJSDate()

			startDate = DateTime.fromJSDate(endDate)
				.minus({ minutes: timeInterval * 2 }) // e.g. 22:30, 23:00, 23:30 (30-minute interval)
				.toJSDate()
		}

		return {
			start: Time.fromDate(startDate),
			end: Time.fromDate(endDate),
		}
	}

	/**
	 * Filters out events that do not overlap with the given time range.
	 *
	 * If extending the range by `timeInterval` would cause its end to fall on the following day,
	 * the effective end of the range is clipped to midnight of the next day.
	 * As a result, events occurring entirely after midnight are excluded,
	 * while events that overlap the range before midnight are kept.
	 *
	 * An event is included if it:
	 * - starts within the range,
	 * - ends within the range, or
	 * - completely spans through range.
	 *
	 * @param range The visible time range.
	 * @param events The events to filter.
	 * @param baseDate The date used to resolve the `Time` values in the range, usually the date when the invitation starts.
	 * @param timeInterval The interval, in minutes, used to compute the effective end of the range.
	 *
	 * @VisibleForTesting
	 */
	static filterOutOfRangeEvents(range: TimeRange, events: Array<EventWrapper>, baseDate: Date, timeInterval: number): Array<EventWrapper> {
		const rangeStartDate = range.start.toDate(baseDate)
		let rangeEndDate = clone(range.end).add({ minutes: timeInterval }).toDate(baseDate)

		if (rangeEndDate < rangeStartDate) {
			rangeEndDate = getStartOfNextDay(baseDate)
		}

		return events.flatMap((eventWrapper) => {
			if (
				(eventWrapper.event.endTime > rangeStartDate && eventWrapper.event.endTime <= rangeEndDate) || // Ends during inside range
				(eventWrapper.event.startTime >= rangeStartDate && eventWrapper.event.startTime < rangeEndDate) || // Starts inside range
				(eventWrapper.event.startTime <= rangeStartDate && eventWrapper.event.endTime >= rangeEndDate) // Completely overlaps range
			) {
				return [eventWrapper]
			}

			return []
		})
	}
}
