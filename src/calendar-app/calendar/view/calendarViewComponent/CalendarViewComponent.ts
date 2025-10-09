import m, { ClassComponent, Vnode } from "mithril"
import { styles } from "../../../../common/gui/styles"
import { WeekStart } from "../../../../common/api/common/TutanotaConstants"
import { calendarWeek } from "../../gui/CalendarGuiUtils"
import { HeaderComponent, HeaderComponentAttrs } from "./HeaderComponent"
import { TimeColumn, TimeColumnAttrs } from "../../../../common/calendar/gui/TimeColumn"
import { Time } from "../../../../common/calendar/date/Time"
import { size } from "../../../../common/gui/size"
import { PageView } from "../../../../common/gui/base/PageView"
import { EventConflictRenderPolicy, TimeView, TimeViewAttributes, TimeViewEventWrapper } from "../../../../common/calendar/gui/TimeView"

interface PageAttrs {
	/**
	 * Period start timestamp
	 */
	key: number
	dates: Array<Date>
	events: {
		short: Array<TimeViewEventWrapper>
		long: Array<TimeViewEventWrapper>
	}
}

interface BodyComponentAttrs {
	previous: PageAttrs
	current: PageAttrs
	next: PageAttrs
	onChangePage: (moveForward: boolean) => unknown
}

export interface CalendarViewComponentAttrs {
	/**
	 * Define header attrs
	 */
	headerComponentAttrs?: HeaderComponentAttrs
	bodyComponentAttrs: BodyComponentAttrs
}

export class CalendarViewComponent implements ClassComponent<CalendarViewComponentAttrs> {
	view({ attrs }: Vnode<CalendarViewComponentAttrs>) {
		console.log("Evs", {
			current: attrs.bodyComponentAttrs.current,
			previous: attrs.bodyComponentAttrs.previous,
			next: attrs.bodyComponentAttrs.next,
		})
		const classes = [styles.isDesktopLayout() ? "content-bg" : "nav-bg", styles.isDesktopLayout() ? "border-bottom" : ""].join(" ")
		const renderHeader = () => {
			const children = []

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
					class: classes,
					style: {
						gridColumn: "1/-1",
						gridTemplateColumns: "subgrid",
					} satisfies Partial<CSSStyleDeclaration>,
				},
				children,
			)
		}

		const renderBody = () => {
			return m(
				".grid.overflow-x-hidden",
				{
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
							timeRange: {
								start: new Time(0, 0),
								end: new Time(23, 0),
							},
							timeScale: 1, // FIXME add support to smooth/continuous zoom,
							width: styles.isDesktopLayout() ? size.calendar_hour_width : size.calendar_hour_width_mobile,
						} satisfies TimeColumnAttrs),
					),
					m(
						".content-bg.border-radius-top-right-big",
						{ style: { gridArea: "calendarGrid" } },
						m(PageView, {
							previousPage: {
								key: attrs.bodyComponentAttrs.previous.key,
								nodes: this.renderEventGrid(attrs.bodyComponentAttrs.previous.dates, attrs.bodyComponentAttrs.previous.events.short),
							},
							currentPage: {
								key: attrs.bodyComponentAttrs.current.key,
								nodes: this.renderEventGrid(attrs.bodyComponentAttrs.current.dates, attrs.bodyComponentAttrs.current.events.short),
							},
							nextPage: {
								key: attrs.bodyComponentAttrs.next.key,
								nodes: this.renderEventGrid(attrs.bodyComponentAttrs.next.dates, attrs.bodyComponentAttrs.next.events.short),
							},
							onChangePage: (next) => attrs.bodyComponentAttrs.onChangePage(next),
						}),
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
										'empty 			calendarGrid'
										'timeColumn 	calendarGrid'`,
					gridTemplateRows: "auto auto 1fr",
					gridTemplateColumns: "auto 1fr",
				} satisfies Partial<CSSStyleDeclaration>,
			},
			[renderHeader(), renderBody()],
		)
	}

	private renderEventGrid(dates: Array<Date>, events: Array<TimeViewEventWrapper>) {
		return m(TimeView, {
			timeRange: {
				start: new Time(0, 0),
				end: new Time(23, 0),
			},
			timeScale: 1,
			dates,
			conflictRenderPolicy: EventConflictRenderPolicy.PARALLEL,
			events,
		} satisfies TimeViewAttributes)
	}
}
