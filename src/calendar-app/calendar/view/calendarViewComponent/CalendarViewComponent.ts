import m, { Children, ClassComponent, Vnode } from "mithril"
import { styles } from "../../../../common/gui/styles"
import { WeekStart } from "../../../../common/api/common/TutanotaConstants"
import { calendarWeek } from "../../gui/CalendarGuiUtils"
import { HeaderComponent, HeaderComponentAttrs } from "./HeaderComponent"
import { TimeColumn, TimeColumnAttrs } from "../../../../common/calendar/gui/TimeColumn"
import { Time } from "../../../../common/calendar/date/Time"
import { px, size } from "../../../../common/gui/size"
import { PageView } from "../../../../common/gui/base/PageView"
import { getSubRowAsMinutes, TimeRange, TimeScale, TimeView, TimeViewAttributes } from "../../../../common/calendar/gui/TimeView"
import { EventWrapper } from "../CalendarViewModel"
import { AllDaySection, AllDaySectionAttrs } from "../../../../common/calendar/gui/AllDaySection"

interface PageAttrs {
	/**
	 * Period start timestamp
	 */
	key: number
	dates: Array<Date>
	events: {
		short: Array<EventWrapper>
		long: Array<EventWrapper>
	}
}

interface BodyComponentAttrs {
	previous: PageAttrs
	current: PageAttrs
	next: PageAttrs
	onChangePage: (moveForward: boolean) => unknown
}

export interface CalendarViewComponentAttrs {
	headerComponentAttrs?: HeaderComponentAttrs
	bodyComponentAttrs: BodyComponentAttrs
	cellActionHandlers: TimeViewAttributes["cellActionHandlers"]
}

export class CalendarViewComponent implements ClassComponent<CalendarViewComponentAttrs> {
	private timeRowHeight = 0

	view({ attrs }: Vnode<CalendarViewComponentAttrs>) {
		const renderHeader = () => {
			const children: Children = []

			if (attrs.headerComponentAttrs) {
				children.push(
					m(
						".b.text-center.calendar-day-indicator",
						{ style: { gridArea: "weekNumber" } },
						styles.isDesktopLayout()
							? calendarWeek(attrs.headerComponentAttrs.selectedDate, attrs.headerComponentAttrs.startOfWeek ?? WeekStart.MONDAY)
							: null,
					),
				)

				if (attrs.headerComponentAttrs.showWeekDays) {
					children.push(
						m("", { style: { gridArea: "header" } }, m(HeaderComponent, { ...attrs.headerComponentAttrs } satisfies HeaderComponentAttrs)),
					)
				}
			}

			return m(
				".grid.py-core-8",
				{
					class: styles.isDesktopLayout() ? "content-bg" : "nav-bg",
					style: {
						gridColumn: "1/-1",
						gridTemplateColumns: "subgrid",
					} satisfies Partial<CSSStyleDeclaration>,
				},
				children,
			)
		}

		const renderBody = () => {
			const timeScale: TimeScale = 1 // FIXME add support to smooth/continuous zoom,
			const timeRange = {
				start: new Time(0, 0),
				end: new Time(23, 0),
			}
			const subRowAsMinutes = getSubRowAsMinutes(timeScale)

			return m(
				".grid.overflow-x-hidden.rel",
				{
					class: styles.isDesktopLayout() ? "border-top" : "",
					style: {
						gridColumn: "1/-1",
						gridTemplateColumns: "subgrid",
					} satisfies Partial<CSSStyleDeclaration>,
				},
				[
					m(
						".content-bg.border-radius-top-left-big",
						{ style: { gridArea: "timeColumn" } },
						m(TimeColumn, {
							baseDate: attrs.headerComponentAttrs?.selectedDate,
							timeRange,
							timeScale,
							width: styles.isDesktopLayout() ? size.calendar_hour_width : size.calendar_hour_width_mobile,
							onCellPressed: attrs.cellActionHandlers?.onCellPressed,
						} satisfies TimeColumnAttrs),
					),
					this.renderCurrentTimeIndicator(Time.fromDate(new Date()), timeRange, subRowAsMinutes, this.timeRowHeight),
					m(
						".content-bg.border-radius-top-right-big",
						{ style: { gridArea: "calendarGrid" } },
						m(PageView, {
							classes: "height-100p",
							previousPage: {
								key: attrs.bodyComponentAttrs.previous.key,
								nodes: this.renderEventGrid(
									timeRange,
									attrs.bodyComponentAttrs.previous.dates,
									attrs.bodyComponentAttrs.previous.events.short,
									attrs.cellActionHandlers,
								),
							},
							currentPage: {
								key: attrs.bodyComponentAttrs.current.key,
								nodes: this.renderEventGrid(
									timeRange,
									attrs.bodyComponentAttrs.current.dates,
									attrs.bodyComponentAttrs.current.events.short,
									attrs.cellActionHandlers,
								),
							},
							nextPage: {
								key: attrs.bodyComponentAttrs.next.key,
								nodes: this.renderEventGrid(
									timeRange,
									attrs.bodyComponentAttrs.next.dates,
									attrs.bodyComponentAttrs.next.events.short,
									attrs.cellActionHandlers,
								),
							},
							onChangePage: (next) => attrs.bodyComponentAttrs.onChangePage(next),
						}),
					),
				],
			)
		}

		const renderAllDaySection = () => {
			return m(
				".grid.overflow-x-hidden.rel",
				{
					style: {
						gridColumn: "1/-1",
						gridTemplateColumns: "subgrid",
					} satisfies Partial<CSSStyleDeclaration>,
				},
				[
					m(
						"",
						{
							style: {
								gridArea: "allDayGrid",
							} satisfies Partial<CSSStyleDeclaration>,
						},
						m(AllDaySection, {
							dates: attrs.bodyComponentAttrs.current.dates,
							allDayEventWrappers: attrs.bodyComponentAttrs.current.events.long,
						} satisfies AllDaySectionAttrs),
					),
				],
			)
		}

		const resolveClasses = (): string => {
			const classes = styles.isDesktopLayout() ? ["content-bg", "mr-l", "border-radius-big"] : ["mlr-safe-inset"]
			return classes.join(" ")
		}

		return m(
			".grid.height-100p.overflow-hidden",
			{
				class: resolveClasses(),
				style: {
					gridTemplateAreas: `'weekNumber 	header'
										'empty 			allDayGrid'
										'timeColumn 	calendarGrid'`,
					gridTemplateRows: "auto auto 1fr",
					gridTemplateColumns: "auto 1fr",
				} satisfies Partial<CSSStyleDeclaration>,
			},
			[renderHeader(), renderAllDaySection(), renderBody()],
		)
	}

	/**
	 * Renders a TimeIndicator line in the screen over the event grid
	 * @param timeRange Time range for the day, usually from 00:00 till 23:00
	 * @param subRowAsMinutes How many minutes a Grid row represents
	 * @param time Time where to position the indicator
	 * @param timeRowHeight
	 * @private
	 */
	private renderCurrentTimeIndicator(time: Time, timeRange: TimeRange, subRowAsMinutes: number, timeRowHeight?: number): Children {
		const startTimeSpan = timeRange.start.diff(time)
		const start = Math.floor(startTimeSpan / subRowAsMinutes)

		return m(".time-indicator.z3", {
			style: {
				top: px((timeRowHeight ?? 0) * start),
				display: timeRowHeight == null ? "none" : "initial",
				gridArea: "calendarGrid",
			} satisfies Partial<CSSStyleDeclaration>,
		})
	}

	private renderEventGrid(
		timeRange: TimeRange,
		dates: Array<Date>,
		events: Array<EventWrapper>,
		cellActionHandlers: TimeViewAttributes["cellActionHandlers"],
	) {
		return m(TimeView, {
			timeRange,
			timeScale: 1,
			dates,
			events,
			cellActionHandlers,
			timeRowHeight: this.timeRowHeight,
			setTimeRowHeight: (timeViewHeight: number) => (this.timeRowHeight = timeViewHeight),
		} satisfies TimeViewAttributes)
	}
}
