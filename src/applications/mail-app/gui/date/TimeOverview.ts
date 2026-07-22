import m, { Child, ClassComponent, Vnode } from "mithril"
import { theme } from "../../../../ui/theme"
import { styles } from "../../../../ui/styles"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { AriaRole } from "../../../../ui/AriaUtils"
import { Keys, TabIndex } from "@tutao/app-env"
import { isKeyPressed } from "../../../../ui/utils/KeyManager"
import { ExpanderPanel } from "../../../../ui/base/Expander"
import { CalendarTimeColumn, CalendarTimeColumnAttrs } from "../../../common/calendar/gui/CalendarTimeColumn"
import {
	CalendarTimeGrid,
	CalendarTimeGridAttributes,
	getIntervalAsMinutes,
	SUBROWS_PER_INTERVAL,
	TIME_SCALE_BASE_VALUE,
	TimeRange,
	TimeScale,
	TimeScaleTuple,
} from "../../../common/calendar/gui/CalendarTimeGrid"
import { filterNull, getStartOfDay, getStartOfNextDay, isSameDay } from "@tutao/utils"
import { InviteAgenda } from "./EventBannerImpl"
import { EventWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel"
import { layout_size, px, size } from "../../../../ui/size"
import { isAllDayEvent, isBefore } from "../../../common/api/common/utils/CommonCalendarUtils"
import { formatDateTime, formatTime } from "../../../../ui/utils/Formatter"
import { CalendarEvent } from "@tutao/entities/tutanota"
import { IcsCalendarEvent } from "../../../calendar-app/calendar/export/CalendarParser"
import { clone } from "@tutao/meta"
import { DateTime } from "luxon"
import { Time } from "../../../common/calendar/date/Time"
import { getCalendarEventDurationInMinutes } from "../../../common/calendar/date/CalendarUtils"

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

	private hasConflicts: boolean = false
	private displayConflictingAgenda: boolean = false
	private timeColumnWidth: number = 0
	private gridParams: GridParams | null = null

	private eventWrappers: EventWrapper[] = []

	oninit({ attrs }: Vnode<TimeOverviewAttrs>) {
		this.hasConflicts = attrs.agenda?.conflictCount! > 0
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
			".flex.flex-column.plr-16.pb-16.pt-16.justify-start",
			{
				class: styles.isSingleColumnLayout() ? "border-sm border-left-none border-right-none border-bottom-none" : "border-left-sm",
				style: {
					"border-color": theme.surface_container_high,
					color: theme.on_surface,
				},
			},
			[
				m(".flex.flex-column.mb-8", [
					m(".flex.items-center.gap-4", [
						m(Icon, {
							icon: Icons.ClockOutlines,
							container: "div",
							style: { fill: theme.on_surface },
							size: IconSize.PX24,
						}),
						m("span.b.h5", lang.getTranslation("timeOverview_title").text),
					]),
					attrs.agenda ? this.renderConflictSummary(attrs.agenda) : this.renderMisingAgendaError(),
				]),
				attrs.agenda && this.gridParams
					? m(".flex.rel", [
							m(CalendarTimeColumn, {
								intervals: this.gridParams.intervals,
								layout: {
									width: this.timeColumnWidth,
									subColumnCount: 1,
									rowCount: this.gridParams.rowCountForRange,
									gridRowHeight: this.gridRowHeight,
								},
								amPm: attrs.amPm,
							} satisfies CalendarTimeColumnAttrs),
							m(
								".full-width",
								m(CalendarTimeGrid, {
									events: TimeOverview.filterOutOfRangeEvents(
										this.gridParams.timeRange,
										this.eventWrappers,
										this.gridParams.eventFocusBound,
										this.gridParams.timeInterval,
									),
									timeScale: this.gridParams.timeScale,
									timeRange: this.gridParams.timeRange,
									dates: [getStartOfDay(attrs.agenda.main.event.startTime)],
									intervals: this.gridParams.intervals,
									layout: {
										gridRowHeight: this.gridRowHeight,
										rowCountForRange: this.gridParams.rowCountForRange,
										hideRightBorder: true,
										showLeftBorderAtFirstColumn: false,
									},
									showTimeZonesAtEventBubble: false,
								} satisfies CalendarTimeGridAttributes),
							),
						])
					: null,
			],
		)
	}

	private renderConflictSummary(agenda: InviteAgenda) {
		return m(".mb-8", [
			m(
				".flex.mt-4.fit-content",
				agenda.conflictCount > 1
					? {
							class: "nav-button",
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
						}
					: {},
				[
					m(Icon, {
						icon: this.hasConflicts ? Icons.ExclamationFilled : Icons.SuccessFilled,
						container: "div",
						class: "mr-4",
						style: {
							fill: this.hasConflicts ? theme.warning : theme.success,
						},
						size: IconSize.PX24,
					}),
					this.renderConflictInfoText(agenda.regularEvents.length, agenda.allDayEvents.length),
				],
			),
			agenda.conflictCount > 0
				? m(
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
				: null,
		])
	}

	private toggleConflictingAgenda() {
		this.displayConflictingAgenda = !this.displayConflictingAgenda
	}

	private renderConflictInfoText(normalEventsConflictCount: number, allDayEventsConflictCount: number) {
		const totalConflicts = allDayEventsConflictCount + normalEventsConflictCount
		const stringParts: Array<string> = []

		if (totalConflicts === 0) {
			stringParts.push(lang.getTranslation("noSimultaneousEvents_msg").text)
		} else if (totalConflicts === 1) {
			stringParts.push(lang.getTranslation("conflict_label").text)
		} else {
			stringParts.push(lang.getTranslation("conflicts_label", { "{count}": totalConflicts }).text)
		}

		return m(
			".small.flex.gap-8.items-center.fit-content",
			{
				style: {
					"line-height": px(19.5),
				},
			},
			[
				m("span", { class: totalConflicts > 0 ? "b" : "" }, stringParts.join(" ")),
				totalConflicts > 1
					? m(Icon, {
							icon: Icons.ArrowDown,
							container: "div",
							class: `fit-content`,
							size: IconSize.PX24,
							style: {
								fill: theme.on_surface,
								rotate: this.displayConflictingAgenda ? "180deg" : "0deg",
							},
						})
					: null,
			],
		)
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

	private renderMisingAgendaError(): Child {
		return m(".mb-8", [
			m(
				".flex.mt-4.fit-content",
				{
					style: {
						color: theme.error,
					},
				},
				[
					m(Icon, {
						icon: Icons.FailureFilled,
						container: "div",
						class: "mr-4",
						style: {
							fill: theme.error,
						},
						size: IconSize.PX24,
					}),
					"ERROR: Could not load the agenda for this day.",
				],
			),
		])
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
				eventFocusBound = agenda.after.event.startTime
			}
			shortestTimeFrame = this.findShortestDuration(agenda.main.event, agenda.after.event)
		}

		const timeScale = this.getTimeScaleAccordingToEventDuration(shortestTimeFrame)
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
	 * Creates a time range bounded to the day when the main event occurs
	 *
	 * @param eventFocusBound
	 * @param timeInterval {number} - Interval in minutes used to create the time column

	 * @VisibleForTesting
	 */
	static getTimeRange(eventFocusBound: Date, timeInterval: number): TimeRange {
		let startDate = DateTime.fromJSDate(eventFocusBound).minus({ minutes: timeInterval }).toJSDate()
		let endDate = DateTime.fromJSDate(eventFocusBound).plus({ minutes: timeInterval }).toJSDate()

		if (isBefore(startDate, eventFocusBound, "date")) {
			startDate = getStartOfDay(eventFocusBound)
			endDate = DateTime.fromJSDate(startDate)
				.plus({ minutes: timeInterval * 2 }) // E.g 00:00 -> 01:00 (in a 30 min interval this means 00:00, 00:30, 01:00)
				.toJSDate()
		} else if (isBefore(eventFocusBound, endDate, "date")) {
			endDate = DateTime.fromJSDate(eventFocusBound).startOf("day").plus({ day: 1 }).minus({ minutes: timeInterval }).toJSDate()
			startDate = DateTime.fromJSDate(endDate)
				.minus({ minutes: timeInterval * 2 }) // E.g 21:30 -> 23:30 (in a 30 min interval this means 21:30, 23:00, 23:30)
				.toJSDate()
		}

		return {
			start: Time.fromDate(startDate),
			end: Time.fromDate(endDate),
		}
	}

	/**
	 * @param eventDuration - Duration in minutes
	 * @private
	 */
	private getTimeScaleAccordingToEventDuration(eventDuration: number): TimeScale {
		const scalesInMinutes: Array<TimeScaleTuple> = [
			[1, TIME_SCALE_BASE_VALUE],
			[2, TIME_SCALE_BASE_VALUE / 2],
			[4, TIME_SCALE_BASE_VALUE / 4],
		]
		const entry = scalesInMinutes.reduce((smallestScale, currentScale) => {
			const [_, scaleInMinutes] = currentScale
			if (eventDuration <= scaleInMinutes) return currentScale
			return smallestScale
		}, scalesInMinutes[0])
		return (entry ? entry[0] : 1) as TimeScale
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
