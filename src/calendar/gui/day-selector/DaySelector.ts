import m, { Children, Component, Vnode } from "mithril"
import { assertNotNull, getStartOfDay, incrementDate, isSameDayOfDate, isToday } from "@tutao/tutanota-utils"
import { DateTime } from "luxon"
import type { CalendarDay, CalendarMonth } from "../../date/CalendarUtils.js"
import { CalendarSwipeHandler } from "../../../gui/base/CalendarSwipeHandler.js"
import { px } from "../../../gui/size.js"
import { DefaultAnimationTime } from "../../../gui/animation/Animations.js"
import { ExpanderPanel } from "../../../gui/base/Expander.js"
import { theme } from "../../../gui/theme.js"
import { hexToRGBAString } from "../../../gui/base/Color.js"
import { styles } from "../../../gui/styles.js"
import { DaysToEvents } from "../../date/CalendarEventsRepository.js"

import { getCalendarMonth } from "../CalendarGuiUtils.js"

export interface DaySelectorAttrs {
	selectedDate: Date | null
	onDateSelected?: (date: Date, dayClick: boolean) => unknown
	wide: boolean
	startOfTheWeekOffset: number
	isDaySelectorExpanded: boolean
	eventsForDays: DaysToEvents
	handleDayPickerSwipe: (isNext: boolean) => void
	showDaySelection: boolean
	highlightToday: boolean
	highlightSelectedWeek: boolean
	useNarrowWeekName: boolean
}

/**
 *  Expandable Date picker used on single/two column layouts.
 * Displays the week, and if expanded displays the month.
 */
export class DaySelector implements Component<DaySelectorAttrs> {
	private displayingDate: Date
	private lastSelectedDate: Date | null = null
	private containerDom: HTMLElement | null = null
	private swipeHandler!: CalendarSwipeHandler
	private handleDayPickerSwipe: DaySelectorAttrs["handleDayPickerSwipe"]

	constructor(vnode: Vnode<DaySelectorAttrs>) {
		this.handleDayPickerSwipe = vnode.attrs.handleDayPickerSwipe
		this.displayingDate = vnode.attrs.selectedDate || getStartOfDay(new Date())
	}

	view(vnode: Vnode<DaySelectorAttrs>): Children {
		this.handleDayPickerSwipe = vnode.attrs.handleDayPickerSwipe
		const selectedDate = vnode.attrs.selectedDate

		if (selectedDate && !isSameDayOfDate(this.lastSelectedDate, selectedDate)) {
			this.lastSelectedDate = selectedDate
			this.displayingDate = new Date(selectedDate)

			this.displayingDate.setDate(1)
		}

		let { weeks, weekdays } = getCalendarMonth(this.displayingDate, vnode.attrs.startOfTheWeekOffset, vnode.attrs.useNarrowWeekName)
		return m(".flex.flex-column", [
			m(".flex.flex-space-around", this.renderWeekDays(vnode.attrs.wide, weekdays)),
			m(
				".flex.flex-column.flex-space-around",
				{
					style: {
						fontSize: px(14),
						lineHeight: px(this.getElementSize(vnode.attrs)),
					},
				},
				this.renderDayPickerCarousel(vnode),
			),
		])
	}

	private getDatePickerSliderMargin = (attrs: DaySelectorAttrs) => {
		// We get the size of the slider minus the days container size multiplied by seven (Days of week) then we divide
		// by the number of empty spaces (6), so we get the size of our spacing
		// F: [sliderSize - (dayContainerSize * numberOfDays)] / (numberOfDays - 1)
		const daysSize = this.getElementSize(attrs)
		return this.containerDom ? (this.containerDom.offsetWidth - daysSize * 7) / 6 : daysSize / 2
	}

	private renderDayPickerCarousel(vnode: Vnode<DaySelectorAttrs>) {
		const isExpanded = vnode.attrs.isDaySelectorExpanded ?? true
		const date = vnode.attrs.selectedDate ?? new Date()
		// We need current/last/next month for the expanded date picker
		const currentMonth = getCalendarMonth(date, vnode.attrs.startOfTheWeekOffset, true)
		const lastMonth = getCalendarMonthShiftedBy(currentMonth, vnode.attrs.startOfTheWeekOffset, -1)
		const nextMonth = getCalendarMonthShiftedBy(currentMonth, vnode.attrs.startOfTheWeekOffset, 1)
		// We need current/last/next week for the collapsed date picker.
		// The week that we want to get depends on the month layout, so we are looking for it in the already computed months.
		const currentWeek = assertNotNull(findWeek(currentMonth, date))
		const beginningOfLastWeek = incrementDate(new Date(date), -7)
		// The week that we are looking for can be in both current month or the last/next one
		const lastWeek =
			beginningOfLastWeek < currentMonth.beginningOfMonth ? findWeek(lastMonth, beginningOfLastWeek) : findWeek(currentMonth, beginningOfLastWeek)
		const beginningOfNextWeek = incrementDate(new Date(date), 7)
		const nextWeek =
			beginningOfNextWeek < nextMonth.beginningOfMonth ? findWeek(currentMonth, beginningOfNextWeek) : findWeek(nextMonth, beginningOfNextWeek)

		return m(
			".rel",
			{
				oncreate: (swiperNode) => {
					this.containerDom = swiperNode.dom as HTMLElement
					this.swipeHandler = new CalendarSwipeHandler(this.containerDom!, (isNext: boolean) => this.handleDayPickerSwipe?.(isNext))
					this.swipeHandler?.attach()
				},
			},
			// visible view and two off-screen pages for scrolling
			[
				m(
					".abs",
					{
						"aria-hidden": "true",
						style: {
							// Set the display none until the containerDom is initialized
							// this prevents that this shows up to the user and been hidden until needed
							display: "none",
							...(this.containerDom &&
								this.containerDom.offsetWidth > 0 && {
									width: px(this.containerDom.offsetWidth),
									display: "block",
									// put it to the top of the view and not below
									top: 0,
									right: px(this.getDatePickerSliderMargin(vnode.attrs)),
									transform: `translateX(${-this.containerDom.offsetWidth}px)`,
								}),
						},
					},
					this.renderCarouselPage(isExpanded, vnode.attrs, lastWeek, lastMonth, true),
				),
				this.renderCarouselPage(isExpanded, vnode.attrs, currentWeek, currentMonth, false),
				m(
					".abs",
					{
						"aria-hidden": "true",
						style: {
							// Set the display none until the containerDom is initialized
							// this prevents that this shows up to the user and been hidden until needed
							display: "none",
							...(this.containerDom &&
								this.containerDom.offsetWidth > 0 && {
									width: px(this.containerDom.offsetWidth),
									display: "block",
									// put it to the top of the view and not below
									top: 0,
									left: px(this.getDatePickerSliderMargin(vnode.attrs)),
									transform: `translateX(${this.containerDom.offsetWidth}px)`,
								}),
						},
					},
					this.renderCarouselPage(isExpanded, vnode.attrs, nextWeek, nextMonth, true),
				),
			],
		)
	}

	private renderCarouselPage(isExpanded: boolean, attrs: DaySelectorAttrs, week: readonly CalendarDay[], month: CalendarMonth, hidden: boolean) {
		return m("", [
			m(
				"",
				{
					"aria-hidden": `${isExpanded}`,
					style: {
						height: isExpanded ? 0 : undefined,
						opacity: isExpanded ? 0 : 1,
						overflow: "clip",
						transition: `opacity ${1.5 * DefaultAnimationTime}ms ease-in-out`,
					},
				},
				this.renderExpandableWeek(week, attrs, false, attrs.isDaySelectorExpanded || hidden),
			),
			m(
				ExpanderPanel,
				{
					expanded: isExpanded,
				},
				this.renderExpandedMonth(month, attrs, hidden),
			),
		])
	}

	private renderExpandedMonth(calendarMonth: CalendarMonth, attrs: DaySelectorAttrs, hidden: boolean) {
		const { weeks } = calendarMonth
		let weekToHighlight = -1

		if (attrs.highlightSelectedWeek) {
			weekToHighlight = weeks.findIndex((week) => week.find((day) => day.date.getTime() === attrs.selectedDate?.getTime()))
		}

		return m("", [weeks.map((w, index) => this.renderExpandableWeek(w, attrs, weekToHighlight === index, attrs.isDaySelectorExpanded && hidden))])
	}

	private renderDay({ date, day, isPaddingDay }: CalendarDay, attrs: DaySelectorAttrs, hidden: boolean): Children {
		const eventForDay = attrs.eventsForDays?.get(date.getTime())
		const isSelectedDay = isSameDayOfDate(date, attrs.selectedDate)
		const hasEvent = eventForDay && eventForDay.length > 0
		let circleStyle
		let textStyle
		if (isSelectedDay && attrs.showDaySelection) {
			circleStyle = {
				backgroundColor: theme.content_accent,
				opacity: "0.20",
			}
			textStyle = {
				color: theme.content_accent,
				fontWeight: "bold",
			}
		} else if (isToday(date) && attrs.highlightToday) {
			circleStyle = {
				backgroundColor: theme.content_button,
				opacity: "0.25",
			}
			textStyle = {
				fontWeight: "bold",
			}
		} else {
			circleStyle = {}
			textStyle = {}
		}

		const size = this.getElementSize(attrs)

		return m(
			"button.rel.click.flex.items-center.justify-center.rel" + (isPaddingDay && attrs.isDaySelectorExpanded ? ".faded-day" : ""),
			{
				style: {
					height: px(size),
					width: px(size),
				},
				"aria-hidden": `${isPaddingDay && attrs.isDaySelectorExpanded}`,
				"aria-label": date.toLocaleDateString(),
				"aria-selected": `${isSelectedDay}`,
				role: "option",
				tabIndex: hidden ? -1 : 0,
				onclick: () => attrs.onDateSelected?.(date, true),
			},
			[
				m(".abs.z1.circle", {
					style: {
						...circleStyle,
						width: px(size * 0.625),
						height: px(size * 0.625),
					},
				}),
				m(
					".full-width.height-100p.center.z2",
					{
						style: {
							...textStyle,
							fontSize: px(attrs.wide ? 14 : 12),
						},
					},
					day,
				),
				hasEvent ? m(".day-events-indicator", { style: styles.isDesktopLayout() ? { width: "3px", height: "3px" } : {} }) : null,
			],
		)
	}

	private getElementSize(attrs: DaySelectorAttrs): number {
		return attrs.wide ? 40 : 30
	}

	private renderExpandableWeek(week: ReadonlyArray<CalendarDay>, attrs: DaySelectorAttrs, highlight: boolean, hidden: boolean): Children {
		let style

		if (highlight) {
			style = {
				backgroundColor: hexToRGBAString(theme.content_accent, 0.2),
				borderRadius: px(styles.isDesktopLayout() ? 19 : 25),
				height: px(styles.isDesktopLayout() ? 19 : 25),
				width: "95%",
			}
		} else {
			style = {}
		}

		return m(".flex.flex-space-around.rel.items-center", [
			m(".abs", {
				style,
			}),
			...week.map((d) => this.renderDay(d, attrs, hidden)),
		])
	}

	private renderWeekDays(wide: boolean, weekdays: readonly string[]): Children {
		const size = px(wide ? 40 : 24)
		const fontSize = px(14)
		return weekdays.map((wd) =>
			m(
				".center",
				{
					"aria-hidden": "true",
					style: {
						fontSize,
						fontWeight: "bold",
						height: "20px",
						width: size,
						lineHeight: "20px",
					},
				},
				wd,
			),
		)
	}
}

function findWeek(currentMonth: CalendarMonth, date: Date): readonly CalendarDay[] {
	return assertNotNull(currentMonth.weeks.find((w) => w.some((calendarDay) => date.getTime() === calendarDay.date.getTime())))
}

function getCalendarMonthShiftedBy(currentMonth: CalendarMonth, firstDayOfWeekFromOffset: number, plusMonths: number): CalendarMonth {
	const date = DateTime.fromJSDate(currentMonth.beginningOfMonth).plus({ month: plusMonths }).toJSDate()
	return getCalendarMonth(date, firstDayOfWeekFromOffset, true)
}
