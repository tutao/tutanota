import m, { Children, ClassComponent, Vnode } from "mithril"
import { styles } from "../../gui/styles"
import { px, size } from "../../gui/size"
import { lang } from "../../misc/LanguageViewModel"
import { DaySelector, DaySelectorAttrs } from "../../../calendar-app/calendar/gui/day-selector/DaySelector"
import { getStartOfTheWeekOffset } from "../../misc/weekOffset"
import { WeekStart } from "../../api/common/TutanotaConstants"
import { DateTime } from "../../../../libs/luxon"
import { calendarWeek, getDayCircleClass } from "../../../calendar-app/calendar/gui/CalendarGuiUtils"
import { DurationLikeObject } from "luxon"
import { CalendarViewType } from "../../api/common/utils/CommonCalendarUtils"

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
			[
				styles.isDesktopLayout() && attrs.headerComponentAttrs
					? m(
							".b.text-center.calendar-day-indicator",
							{ style: { gridArea: "weekNumber" } },
							calendarWeek(attrs.headerComponentAttrs.selectedDate, attrs.headerComponentAttrs.startOfWeek ?? WeekStart.MONDAY),
						)
					: null,
				m("", { style: { gridArea: "timeColumn" } }, "timeColumn"),
				attrs.showWeekDays && attrs.headerComponentAttrs
					? m("", { style: { gridArea: "header" } }, m(HeaderComponent, { ...attrs.headerComponentAttrs } satisfies HeaderComponentAttrs))
					: null,
				m("", { style: { gridArea: "calendarGrid" } }, "calendarGrid"),
			],
		)
	}
}

interface HeaderComponentAttrs {
	/**
	 * Days for the current period
	 */
	dates: CalendarViewComponentAttrs["dates"]
	selectedDate: Date
	onDateClick: (date: Date, viewType?: CalendarViewType) => unknown
	isDaySelectorExpanded: boolean
	startOfWeek?: WeekStart
}

class HeaderComponent implements ClassComponent<HeaderComponentAttrs> {
	view({ attrs }: Vnode<HeaderComponentAttrs>) {
		if (styles.isDesktopLayout()) {
			return m(
				".grid.calendar-day-indicator",
				{
					style: {
						"grid-template-columns": `repeat(${attrs.dates.length}, 1fr)`,
					},
				},
				attrs.dates.map((date, index) => {
					return this.renderDay(attrs.onDateClick, date, attrs.selectedDate)
				}),
			)
		}
		return this.renderMobileHeader(attrs, false)
	}

	private renderDay(onClick: (arg0: Date) => unknown, day: Date, selectedDate: Date) {
		const dayCircleClasses = getDayCircleClass(day, selectedDate)

		return m(
			"",
			m(
				".flex.justify-center.b.items-center.gap-vpad-s",
				{
					onclick: () => onClick(day),
				},
				[
					m(".calendar-day-indicator.click", lang.formats.weekdayShort.format(day) + " "),
					m(
						".rel.flex.items-center.justify-center.click",
						{
							"aria-label": day.toLocaleDateString(),
						},
						[
							m(".abs.z1.circle", {
								class: dayCircleClasses.circle,
								style: {
									width: px(size.calendar_days_header_height),
									height: px(size.calendar_days_header_height),
								},
							}),
							m(
								".z2",
								{
									class: dayCircleClasses.text,
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
		)
	}

	private renderMobileHeader(attrs: HeaderComponentAttrs, isDayView: boolean): Children {
		const { dates, selectedDate, onDateClick, isDaySelectorExpanded, startOfWeek } = attrs
		return m(
			".header-bg.pb-s.overflow-hidden",
			m(DaySelector, {
				selectedDate,
				onDateSelected: (date) => attrs.onDateClick(date),
				wide: true,
				startOfTheWeekOffset: getStartOfTheWeekOffset(startOfWeek ?? WeekStart.MONDAY),
				isDaySelectorExpanded: isDaySelectorExpanded ?? false,
				handleDayPickerSwipe: (isNext: boolean) => {
					const sign = isNext ? 1 : -1
					const duration: DurationLikeObject = {
						month: sign * (isDaySelectorExpanded ? 1 : 0),
						days: sign * dates.length,
					}

					onDateClick(DateTime.fromJSDate(dates[0]).plus(duration).toJSDate())
				},
				showDaySelection: isDayView,
				highlightToday: true,
				highlightSelectedWeek: !isDayView,
				useNarrowWeekName: styles.isSingleColumnLayout(),
				hasEventOn: (date) => false,
			} satisfies DaySelectorAttrs),
		)
	}
}
