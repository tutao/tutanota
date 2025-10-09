import m, { ClassComponent, Vnode } from "mithril"
import { styles } from "../../../../common/gui/styles"
import { WeekStart } from "../../../../common/api/common/TutanotaConstants"
import { calendarWeek } from "../../gui/CalendarGuiUtils"
import { HeaderComponent, HeaderComponentAttrs } from "./HeaderComponent"
import { TimeColumn, TimeColumnAttrs } from "../../../../common/calendar/gui/TimeColumn"
import { Time } from "../../../../common/calendar/date/Time"
import { size } from "../../../../common/gui/size"

export interface CalendarViewComponentAttrs {
	/**
	 * Days to render events
	 */
	dates: Array<Date>
	/**
	 * Define header attrs
	 */
	headerComponentAttrs?: HeaderComponentAttrs
	showWeekDays?: boolean
}

export class CalendarViewComponent implements ClassComponent<CalendarViewComponentAttrs> {
	view({ attrs }: Vnode<CalendarViewComponentAttrs>) {
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

				if (attrs.showWeekDays) {
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
					m(".content-bg.border-radius-top-right-big", { style: { gridArea: "calendarGrid" } }, "calendarGrid"),
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
}
