import m, { Child, ChildArray, Children, Component, Vnode, VnodeDOM } from "mithril"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { Time } from "../date/Time"
import { clone, deepMemoized, downcast, getStartOfNextDay } from "@tutao/tutanota-utils"
import { px, size } from "../../gui/size.js"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { theme } from "../../gui/theme.js"
import { colorForBg } from "../../gui/base/GuiUtils.js"
import { formatTime } from "../../misc/Formatter.js"
import { getTimeZone } from "../date/CalendarUtils"
import { EventRenderWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel.js"
import { DateTime } from "../../../../libs/luxon.js"
import { CalendarViewType } from "../../api/common/utils/CommonCalendarUtils"
import { styles } from "../../gui/styles"
import { lang } from "../../misc/LanguageViewModel"
import { DaySelector, DaySelectorAttrs } from "../../../calendar-app/calendar/gui/day-selector/DaySelector"
import { getStartOfTheWeekOffset } from "../../misc/weekOffset"
import { WeekStart } from "../../api/common/TutanotaConstants"

export interface TimeViewEventWrapper {
	event: EventRenderWrapper
	conflictsWithMainEvent: boolean
	/**
	 * Color applied to the event bubble background
	 */
	color: string
	/**
	 * Applies special style, color border and shows success or warning icon before event title
	 */
	featured: boolean
}

export const TIME_SCALE_BASE_VALUE = 60 // 60 minutes
/**
 * {@link TIME_SCALE_BASE_VALUE} / {@link TimeScale} = Time interval applied to the agenda time column
 * @example
 * const timeScale1: TimeScale = 1
 * const intervalOf60Minutes = TIME_SCALE_BASE_VALUE / timeScale1
 *
 * const timeScale2: TimeScale = 2
 * const intervalOf30Minutes = TIME_SCALE_BASE_VALUE / timeScale2
 *
 * const timeScale4: TimeScale = 4
 * const intervalOf15Minutes = TIME_SCALE_BASE_VALUE / timeScale4
 * */
export type TimeScale = 1 | 2 | 4
/**
 * Tuple of {@link TimeScale} and timeScaleInMinutes
 * @example
 * const scale = 4
 * const timeScaleInMinutes = TIME_SCALE_BASE_VALUE / scale
 * const myTuple: TimeScaleTuple = [scale, timeScaleInMinutes]
 */
export type TimeScaleTuple = [TimeScale, number]
export type TimeRange = {
	start: Time
	end: Time
}

export enum EventConflictRenderPolicy {
	OVERLAP,
	PARALLEL,
}

export type TimeHeaderProps = {
	onDateClick: (date: Date) => unknown
	isDaySelectorExpanded: boolean
}

export interface TimeViewAttributes {
	/**
	 * Days to render events
	 */
	dates: Array<Date>
	events: Array<TimeViewEventWrapper>
	/**
	 * {@link TimeScale} applied to this TimeView
	 */
	timeScale: TimeScale
	/**
	 * {@link TimeRange} used to generate the Time column and the number of time intervals/slots to position the events
	 *
	 * 0 <= start < end < 24:00
	 *
	 * End time is inclusive and is considered the beginning of the last interval
	 */
	timeRange: TimeRange
	conflictRenderPolicy: EventConflictRenderPolicy
	timeIndicator?: Time
	hasAnyConflict?: boolean
	headerProps?: TimeHeaderProps
	startOfWeek?: WeekStart
}

export class TimeView implements Component<TimeViewAttributes> {
	private timeRowHeight?: number

	/*
	 * Must filter the array to get events using the same logic from conflict detection
	 * But instead of event start and end we use range start end
	 */
	view({ attrs }: Vnode<TimeViewAttributes>) {
		const { timeScale, timeRange, events, conflictRenderPolicy, dates, timeIndicator, hasAnyConflict } = attrs
		const timeColumnIntervals = this.createTimeColumnIntervals(timeScale, timeRange)

		const subRowCount = 12 * timeColumnIntervals.length
		const subRowAsMinutes = TIME_SCALE_BASE_VALUE / timeScale / 12

		return m(
			".grid",
			{
				style: {
					"overflow-x": "hidden",
					"grid-template-columns": `auto repeat(${dates.length}, 1fr)`,
					"grid-template-rows": `auto 1fr`,
				},
				oninit: (vnode: VnodeDOM) => {
					if (this.timeRowHeight == null) {
						window.requestAnimationFrame(() => {
							this.timeRowHeight = Number.parseFloat(window.getComputedStyle(vnode.dom).height.replaceAll("px", "")) / subRowCount
							m.redraw()
						})
					}
				},
			},
			[
				m("", { style: { "grid-row-start": 1 } }),
				m(
					"",
					{
						style: {
							"grid-row-start": 1,
							"grid-column-start": 2,
							"grid-column-end": -1,
							position: "sticky",
						},
					},
					styles.isDesktopLayout()
						? dates.map((date) => {
								return this.renderDayHeader(
									() => null,
									date,
									false,
									() => ({ circle: "", text: "" }),
								)
							})
						: this.renderDateSelector(attrs, false),
				),
				this.buildTimeColumn(timeColumnIntervals), // Time column
				dates.map((date) => {
					return m(
						".grid.plr-unit.gap.z1.grid-auto-columns.rel",
						{
							oncreate(vnode): any {
								;(vnode.dom as HTMLElement).style.gridTemplateRows = `repeat(${subRowCount}, 1fr)`
							},
						},
						[
							this.buildTimeIndicator(timeRange, subRowAsMinutes, timeIndicator),
							this.buildEventsColumn(events, timeRange, subRowAsMinutes, conflictRenderPolicy, subRowCount, timeScale, date, hasAnyConflict),
						],
					)
				}),
			],
		)
	}

	private renderDateSelector(attrs: TimeViewAttributes, isDayView: boolean): Children {
		return m("", [
			m(
				".header-bg.pb-s.overflow-hidden",
				m(DaySelector, {
					selectedDate: attrs.dates[0],
					onDateSelected: (date) => attrs.headerProps?.onDateClick(date),
					wide: true,
					startOfTheWeekOffset: getStartOfTheWeekOffset(attrs.startOfWeek ?? WeekStart.MONDAY),
					isDaySelectorExpanded: attrs.headerProps?.isDaySelectorExpanded ?? false,
					handleDayPickerSwipe: (isNext: boolean) => {
						const sign = isNext ? 1 : -1
						const duration = {
							month: sign * (attrs.headerProps?.isDaySelectorExpanded ? 1 : 0),
							days: sign * attrs.dates.length,
						}

						attrs.headerProps?.onDateClick(DateTime.fromJSDate(attrs.dates[0]).plus(duration).toJSDate())
					},
					showDaySelection: isDayView,
					highlightToday: true,
					highlightSelectedWeek: !isDayView,
					useNarrowWeekName: styles.isSingleColumnLayout(),
					hasEventOn: (date) => false,
				} satisfies DaySelectorAttrs),
			),
		])
	}

	private renderDayHeader(
		onDateSelected: (arg0: Date, arg1: CalendarViewType) => unknown,
		day: Date,
		shouldShowEventIndicator: boolean,
		getCircleClass: (date: Date) => {
			circle: string
			text: string
		},
	) {
		const onclick = () => onDateSelected(day, CalendarViewType.DAY)
		const classes = getCircleClass(day)

		return m(
			".flex.flex-column.center-horizontally.items-center.text-center.b",
			{
				"grid-row-start": 1,
			},
			[
				m(
					".flex.center-horizontally.flex-grow.center.b.items-center",
					{
						class: !styles.isDesktopLayout() && shouldShowEventIndicator ? "mb-s" : "",
					},
					[
						m(
							".calendar-day-indicator.clickable",
							{
								onclick,
								style: {
									"padding-right": px(4),
								},
							},
							lang.formats.weekdayShort.format(day) + " ",
						),
						m(
							".rel.click.flex.items-center.justify-center.rel.ml-hpad_small",
							{
								"aria-label": day.toLocaleDateString(),
								onclick,
							},
							[
								m(".abs.z1.circle", {
									class: classes.circle,
									style: {
										width: px(size.calendar_days_header_height),
										height: px(size.calendar_days_header_height),
									},
								}),
								m(
									".full-width.height-100p.center.z2",
									{
										class: classes.text,
										style: {
											fontSize: px(14),
											lineHeight: px(size.calendar_days_header_height),
										},
									},
									day.getDate(),
								),
							],
						),
					],
				),
				!styles.isDesktopLayout() && shouldShowEventIndicator
					? m(".day-events-indicator", {
							style: styles.isDesktopLayout()
								? {
										width: "3px",
										height: "3px",
									}
								: {},
						})
					: null,
			],
		)
	}

	private buildTimeIndicator(timeRange: TimeRange, subRowAsMinutes: number, time?: Time): Children {
		if (!time) {
			return null
		}

		const startTimeSpan = timeRange.start.diff(time)
		const start = Math.floor(startTimeSpan / subRowAsMinutes)

		return m(".time-indicator", {
			style: {
				top: px((this.timeRowHeight ?? 0) * start),
				display: this.timeRowHeight == null ? "none" : "initial",
			},
		})
	}

	private createTimeColumnIntervals(timeScale: TimeScale, timeRange: TimeRange): Array<string> {
		let timeInterval = TIME_SCALE_BASE_VALUE / timeScale
		const numberOfIntervals = (timeRange.start.diff(timeRange.end) + timeInterval) / timeInterval
		const timeKeys: Array<string> = []

		for (let i = 0; i < numberOfIntervals; i++) {
			const agendaRowTime = clone(timeRange.start).add({ minutes: timeInterval * i })

			timeKeys.push(formatTime(agendaRowTime.toDate()))
		}

		return timeKeys
	}

	private buildTimeColumn = deepMemoized((times: Array<string>): Child => {
		return m(
			".grid",
			{
				style: {
					"grid-template-rows": `repeat(${times.length}, 1fr)`,
					"grid-row-start": 2,
				},
			},
			times.map((time, index) =>
				m(
					".flex.ptb-button-double.small.pr-vpad-s.border-right.rel.items-center",
					{
						class: index !== times.length - 1 ? "after-as-border-bottom" : "",
					},
					time,
				),
			),
		)
	})

	private buildEventsColumn = deepMemoized(
		(
			agendaEntries: Array<TimeViewEventWrapper>,
			timeRange: TimeRange,
			subRowAsMinutes: number,
			conflictRenderPolicy: EventConflictRenderPolicy,
			subRowCount: number,
			timeScale: TimeScale,
			baseDate: Date,
			hasAnyConflict: boolean = false,
		): Children => {
			const interval = TIME_SCALE_BASE_VALUE / timeScale
			const timeRangeAsDate = {
				start: timeRange.start.toDate(baseDate),
				/**
				 * We sum one more interval because it is inclusive
				 * @see TimeViewAttributes.timeRange
				 */
				end: timeRange.end.toDateTime(baseDate, getTimeZone()).plus({ minute: interval }).toJSDate(),
			}
			return agendaEntries.flatMap((event) => {
				const passesThroughToday =
					event.event.event.startTime.getTime() < timeRangeAsDate.start.getTime() &&
					event.event.event.endTime.getTime() > timeRangeAsDate.end.getTime()
				const startsToday =
					event.event.event.startTime.getTime() >= timeRangeAsDate.start.getTime() &&
					event.event.event.startTime.getTime() <= timeRangeAsDate.end.getTime()
				const endsToday =
					event.event.event.endTime.getTime() >= timeRangeAsDate.start.getTime() &&
					event.event.event.endTime.getTime() <= timeRangeAsDate.end.getTime()

				if (!(passesThroughToday || startsToday || endsToday)) {
					return []
				}

				const { start, end } = this.getRowBounds(event.event.event, timeRange, subRowAsMinutes, subRowCount, timeScale, baseDate)

				return [
					m(
						// EventBubble
						".border-radius.text-ellipsis-multi-line.p-xsm.on-success-container-color.small",
						{
							style: {
								"min-height": px(0),
								"min-width": px(0),
								"grid-column": conflictRenderPolicy === EventConflictRenderPolicy.OVERLAP ? 1 : undefined,
								background: event.color,
								color: !event.featured ? colorForBg(event.color) : undefined,
								"grid-row": `${start} / ${end}`,
								"border-top-left-radius": event.event.event.startTime < timeRangeAsDate.start ? "0" : undefined,
								"border-top-right-radius": event.event.event.startTime < timeRangeAsDate.start ? "0" : undefined,
								"border-bottom-left-radius": event.event.event.endTime > timeRangeAsDate.end ? "0" : undefined,
								"border-bottom-right-radius": event.event.event.endTime > timeRangeAsDate.end ? "0" : undefined,
								border: event.featured ? `1.5px dashed ${hasAnyConflict ? theme.on_warning_container : theme.on_success_container}` : "none",
								"border-top": event.event.event.startTime < timeRangeAsDate.start ? "none" : undefined,
								"border-bottom": event.event.event.endTime > timeRangeAsDate.end ? "none" : undefined,
								"-webkit-line-clamp": 2,
							},
						},
						event.featured
							? m(".flex.items-start", [
									m(Icon, {
										icon: hasAnyConflict ? Icons.AlertCircle : Icons.Checkmark,
										container: "div",
										class: "mr-xxs",
										size: IconSize.Normal,
										style: {
											fill: hasAnyConflict ? theme.on_warning_container : theme.on_success_container,
										},
									}),
									m(
										".break-word.b.text-ellipsis-multi-line.lh",
										{
											style: {
												"-webkit-line-clamp": 2,
												color: hasAnyConflict ? theme.on_warning_container : theme.on_success_container,
											},
										},
										event.event.event.summary,
									),
								])
							: event.event.event.summary, // FIXME for god sake, we need to get rid of those event.event.event
					),
				]
			}) as ChildArray
		},
	)

	private getRowBounds(event: CalendarEvent, timeRange: TimeRange, subRowAsMinutes: number, subRowCount: number, timeScale: TimeScale, baseDate: Date) {
		const interval = TIME_SCALE_BASE_VALUE / timeScale
		const diffFromRangeStartToEventStart = timeRange.start.diff(Time.fromDate(event.startTime))

		const eventStartsBeforeRange = event.startTime < baseDate || Time.fromDate(event.startTime).isBefore(timeRange.start)
		const start = eventStartsBeforeRange ? 1 : Math.floor(diffFromRangeStartToEventStart / subRowAsMinutes) + 1

		const dateParts = {
			year: baseDate.getFullYear(),
			month: baseDate.getMonth() + 1,
			day: baseDate.getDate(),
			hour: timeRange.end.hour,
			minute: timeRange.end.minute,
		}

		// FIXME remove downcast
		const diff = DateTime.fromJSDate(event.endTime).diff(DateTime.fromObject(downcast(dateParts)).plus({ minutes: interval }), "minutes").minutes

		const diffFromRangeStartToEventEnd = timeRange.start.diff(Time.fromDate(event.endTime))
		const eventEndsAfterRange = event.endTime > getStartOfNextDay(baseDate) || diff > 0
		const end = eventEndsAfterRange ? -1 : Math.floor(diffFromRangeStartToEventEnd / subRowAsMinutes) + 1

		return { start, end }
	}
}
