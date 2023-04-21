import m, { Child } from "mithril"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { ButtonType } from "../../gui/base/Button.js"
import { Icons } from "../../gui/base/icons/Icons"
import { Dialog } from "../../gui/base/Dialog"
import type { MousePosAndBounds } from "../../gui/base/GuiUtils"
import { Time } from "../../api/common/utils/Time"
import { assert, clamp, incrementDate, lastThrow } from "@tutao/tutanota-utils"
import { CalendarViewType } from "./CalendarViewModel.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { formatDateWithWeekday, formatMonthWithFullYear } from "../../misc/Formatter.js"
import { getStartOfTheWeekOffset, getStartOfWeek, getWeekNumber } from "../date/CalendarUtils.js"
import { WeekStart } from "../../api/common/TutanotaConstants.js"

export function renderCalendarSwitchLeftButton(label: TranslationKey, click: () => unknown): Child {
	return m(IconButton, {
		title: label,
		icon: Icons.ArrowBackward,
		click,
	})
}

export function renderCalendarSwitchRightButton(label: TranslationKey, click: () => unknown): Child {
	return m(IconButton, {
		title: label,
		icon: Icons.ArrowForward,
		click,
	})
}

function weekTitle(date: Date, weekStart: WeekStart): string {
	const startOfTheWeekOffset = getStartOfTheWeekOffset(weekStart)
	const firstDate = getStartOfWeek(date, startOfTheWeekOffset)
	const lastDate = incrementDate(new Date(firstDate), 6)

	if (firstDate.getMonth() !== lastDate.getMonth()) {
		if (firstDate.getFullYear() !== lastDate.getFullYear()) {
			return `${lang.formats.monthLong.format(firstDate)} ${lang.formats.yearNumeric.format(firstDate)} -
											${lang.formats.monthLong.format(lastDate)} ${lang.formats.yearNumeric.format(lastDate)}`
		}
		return `${lang.formats.monthLong.format(firstDate)} - ${lang.formats.monthLong.format(lastDate)} ${lang.formats.yearNumeric.format(firstDate)}`
	} else {
		return `${lang.formats.monthLong.format(firstDate)} ${lang.formats.yearNumeric.format(firstDate)}`
	}
}

export function getNextFourteenDays(startOfToday: Date): Array<Date> {
	let calculationDate = new Date(startOfToday)
	const days: Date[] = []

	for (let i = 0; i < 14; i++) {
		days.push(new Date(calculationDate.getTime()))
		calculationDate = incrementDate(calculationDate, 1)
	}

	return days
}

function agendaTitle(date: Date): string {
	const days = getNextFourteenDays(date)
	const lastDay = lastThrow(days)
	const dateRangeText =
		days[0].getFullYear() === lastDay.getFullYear()
			? `${lang.formats.dateWithWeekday.format(days[0])} - ${lang.formats.dateWithWeekdayAndYear.format(lastDay)}`
			: `${lang.formats.dateWithWeekdayAndYear.format(days[0])} - ${lang.formats.dateWithWeekdayAndYear.format(lastDay)}`
	return `${lang.get("agenda_label")} ${dateRangeText}`
}

export type CalendarNavConfiguration = { back: Child; title: string; forward: Child; week: string | null }

function calendarWeek(date: Date, weekStart: WeekStart) {
	// According to ISO 8601, weeks always start on Monday. Week numbering systems for
	// weeks that do not start on Monday are not strictly defined, so we only display
	// a week number if the user's client is configured to start weeks on Monday
	if (weekStart !== WeekStart.MONDAY) {
		return null
	}

	return lang.get("weekNumber_label", {
		"{week}": String(getWeekNumber(date)),
	})
}

export function calendarNavConfiguration(
	viewType: CalendarViewType,
	date: Date,
	weekStart: WeekStart,
	switcher: (viewType: CalendarViewType, next: boolean) => unknown,
): CalendarNavConfiguration {
	const onBack = () => switcher(viewType, false)
	const onForward = () => switcher(viewType, true)
	switch (viewType) {
		case CalendarViewType.DAY:
			return {
				back: renderCalendarSwitchLeftButton("prevDay_label", onBack),
				forward: renderCalendarSwitchRightButton("nextDay_label", onForward),
				title: formatDateWithWeekday(date),
				week: calendarWeek(date, weekStart),
			}
		case CalendarViewType.MONTH:
			return {
				back: renderCalendarSwitchLeftButton("prevMonth_label", onBack),
				forward: renderCalendarSwitchRightButton("nextMonth_label", onForward),
				title: formatMonthWithFullYear(date),
				week: null,
			}
		case CalendarViewType.WEEK:
			return {
				back: renderCalendarSwitchLeftButton("prevWeek_label", onBack),
				forward: renderCalendarSwitchRightButton("nextWeek_label", onForward),
				title: weekTitle(date, weekStart),
				week: calendarWeek(date, weekStart),
			}
		case CalendarViewType.AGENDA:
			return {
				back: null,
				forward: null,
				title: agendaTitle(date),
				week: null,
			}
	}
}

export function askIfShouldSendCalendarUpdatesToAttendees(): Promise<"yes" | "no" | "cancel"> {
	return new Promise((resolve) => {
		let alertDialog: Dialog
		const cancelButton = {
			label: "cancel_action",
			click: () => {
				resolve("cancel")
				alertDialog.close()
			},
			type: ButtonType.Secondary,
		} as const
		const noButton = {
			label: "no_label",
			click: () => {
				resolve("no")
				alertDialog.close()
			},
			type: ButtonType.Secondary,
		} as const
		const yesButton = {
			label: "yes_label",
			click: () => {
				resolve("yes")
				alertDialog.close()
			},
			type: ButtonType.Primary,
		} as const

		const onclose = (positive: boolean) => (positive ? resolve("yes") : resolve("cancel"))

		alertDialog = Dialog.confirmMultiple("sendUpdates_msg", [cancelButton, noButton, yesButton], onclose)
	})
}

/**
 * Map the location of a mouse click on an element to a give date, given a list of weeks
 * there should be neither zero weeks, nor zero length weeks
 */
export function getDateFromMousePos({ x, y, targetWidth, targetHeight }: MousePosAndBounds, weeks: Array<Array<Date>>): Date {
	assert(weeks.length > 0, "Weeks must not be zero length")
	const unitHeight = targetHeight / weeks.length
	const currentSquareY = Math.floor(y / unitHeight)
	const week = weeks[clamp(currentSquareY, 0, weeks.length - 1)]
	assert(week.length > 0, "Week must not be zero length")
	const unitWidth = targetWidth / week.length
	const currentSquareX = Math.floor(x / unitWidth)
	return week[clamp(currentSquareX, 0, week.length - 1)]
}

/**
 * Map the vertical position of a mouse click on an element to a time of day
 * @param y
 * @param targetHeight
 * @param hourDivision: how many times to divide the hour
 */
export function getTimeFromMousePos({ y, targetHeight }: MousePosAndBounds, hourDivision: number): Time {
	const sectionHeight = targetHeight / 24
	const hour = y / sectionHeight
	const hourRounded = Math.floor(hour)
	const minutesInc = 60 / hourDivision
	const minute = Math.floor((hour - hourRounded) * hourDivision) * minutesInc
	return new Time(hourRounded, minute)
}

export const SELECTED_DATE_INDICATOR_THICKNESS = 4
