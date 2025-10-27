import { CalendarViewType } from "../../../../common/api/common/utils/CommonCalendarUtils"
import { WeekStart } from "../../../../common/api/common/TutanotaConstants"
import m, { Children, ClassComponent, Vnode } from "mithril"
import { styles } from "../../../../common/gui/styles"
import { getDayCircleClass } from "../../gui/CalendarGuiUtils"
import { lang } from "../../../../common/misc/LanguageViewModel"
import { px, size } from "../../../../common/gui/size"
import { DaySelector, DaySelectorAttrs } from "../../gui/day-selector/DaySelector"
import { getStartOfTheWeekOffset } from "../../../../common/misc/weekOffset"
import { DurationLikeObject } from "luxon"
import { DateTime } from "../../../../../libs/luxon"

export enum HeaderVariant {
	NORMAL,
	SWIPEABLE,
}

export interface HeaderComponentAttrs {
	/**
	 * Days for the current period
	 */
	dates: Array<Date>
	selectedDate: Date
	onDateClick: (date: Date, viewType?: CalendarViewType) => unknown
	isDaySelectorExpanded: boolean
	variant: HeaderVariant
	startOfWeek?: WeekStart
	showWeekDays?: boolean
}

export class HeaderComponent implements ClassComponent<HeaderComponentAttrs> {
	view({ attrs }: Vnode<HeaderComponentAttrs>) {
		if (attrs.variant === HeaderVariant.NORMAL) {
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

		return this.renderMobileHeader(attrs)
	}

	private renderDay(onClick: (arg0: Date) => unknown, day: Date, selectedDate: Date) {
		const dayCircleClasses = getDayCircleClass(day, selectedDate)

		return m(
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
		)
	}

	private renderMobileHeader(attrs: HeaderComponentAttrs): Children {
		const { dates, selectedDate, onDateClick, isDaySelectorExpanded, startOfWeek } = attrs
		return m(
			".header-bg.overflow-hidden",
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
						days: sign * (isDaySelectorExpanded ? 0 : 7),
					}

					onDateClick(DateTime.fromJSDate(dates[0]).plus(duration).toJSDate()) // FIXME Swipe day by day depending on the speed
				},
				showDaySelection: true,
				highlightToday: true,
				highlightSelectedWeek: dates.length === 7,
				useNarrowWeekName: styles.isSingleColumnLayout(),
				hasEventOn: (date) => false,
			} satisfies DaySelectorAttrs),
		)
	}
}
