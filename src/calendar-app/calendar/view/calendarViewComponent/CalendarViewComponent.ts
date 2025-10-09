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
			if (attrs.headerComponentAttrs) {
				return m.fragment({}, [
					styles.isDesktopLayout()
						? m(
								".b.text-center.calendar-day-indicator",
								{ style: { gridArea: "weekNumber" } },
								calendarWeek(attrs.headerComponentAttrs.selectedDate, attrs.headerComponentAttrs.startOfWeek ?? WeekStart.MONDAY),
							)
						: null,
					attrs.showWeekDays
						? m("", { style: { gridArea: "header" } }, m(HeaderComponent, { ...attrs.headerComponentAttrs } satisfies HeaderComponentAttrs))
						: null,
				])
			}
			return null
		}

		return m(
			".grid.height-100p",
			{
				style: {
					gridTemplateAreas: `'weekNumber 	header'
										'empty 			calendarGrid'
										'timeColumn 	calendarGrid'`,
					gridTemplateRows: "auto auto 1fr",
					gridTemplateColumns: "auto 1fr",
				} satisfies Partial<CSSStyleDeclaration>,
			},
			[renderHeader(), m("", { style: { gridArea: "timeColumn" } }, "timeColumn"), m("", { style: { gridArea: "calendarGrid" } }, "calendarGrid")],
		)
	}
}
