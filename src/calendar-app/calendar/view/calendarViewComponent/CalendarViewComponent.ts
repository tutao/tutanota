import m, { ClassComponent, Vnode } from "mithril"
import { styles } from "../../../../common/gui/styles"
import { WeekStart } from "../../../../common/api/common/TutanotaConstants"
import { calendarWeek } from "../../gui/CalendarGuiUtils"
import { HeaderComponent, HeaderComponentAttrs } from "./HeaderComponent"

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
		const renderHeader = () => {
			const children = []
			if (attrs.headerComponentAttrs) {
				if (styles.isDesktopLayout()) {
					children.push(
						m(
							".b.text-center.calendar-day-indicator.py-core-4",
							{ style: { gridArea: "weekNumber" } },
							calendarWeek(attrs.headerComponentAttrs.selectedDate, attrs.headerComponentAttrs.startOfWeek ?? WeekStart.MONDAY),
						),
					)
				}
				if (attrs.showWeekDays) {
					children.push(
						m(
							".py-core-4",
							{ style: { gridArea: "header" } },
							m(HeaderComponent, { ...attrs.headerComponentAttrs } satisfies HeaderComponentAttrs),
						),
					)
				}
			}
			return children
		}

		const resolveClasses = (): string => {
			const classes = styles.isDesktopLayout() ? ["content-bg", "mr-l", "border-radius-big"] : ["mlr-safe-inset"]
			return classes.join(" ")
		}

		return m(
			".grid.height-100p",
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
			[
				renderHeader(),
				m(".content-bg.border-radius-top-left-big", { style: { gridArea: "timeColumn" } }, "timeColumn"),
				m(".content-bg.border-radius-top-right-big", { style: { gridArea: "calendarGrid" } }, "calendarGrid"),
			],
		)
	}
}
