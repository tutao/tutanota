import m, { Child } from "mithril"
import type { TranslationKey } from "../../misc/LanguageViewModel.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { ButtonType } from "../../gui/base/Button.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { Dialog } from "../../gui/base/Dialog.js"
import type { MousePosAndBounds } from "../../gui/base/GuiUtils.js"
import { Time } from "../date/Time.js"
import { assert, clamp, getStartOfDay, incrementDate, isSameDay, isSameDayOfDate, numberRange, typedValues } from "@tutao/tutanota-utils"
import { IconButton } from "../../gui/base/IconButton.js"
import { formatDateTime, formatDateWithMonth, formatDateWithWeekday, formatMonthWithFullYear, formatTime, timeStringFromParts } from "../../misc/Formatter.js"
import {
	AlarmInterval,
	alarmIntervalToLuxonDurationLikeObject,
	AlarmIntervalUnit,
	CalendarDay,
	CalendarMonth,
	eventEndsAfterDay,
	eventStartsBefore,
	getEndOfDayWithZone,
	getEventEnd,
	getEventStart,
	getStartOfTheWeekOffset,
	getStartOfWeek,
	getTimeZone,
	getWeekNumber,
	incrementByRepeatPeriod,
	StandardAlarmInterval,
} from "../date/CalendarUtils.js"
import { CalendarAttendeeStatus, EndType, EventTextTimeOption, RepeatPeriod, WeekStart } from "../../api/common/TutanotaConstants.js"
import { AllIcons } from "../../gui/base/Icon.js"
import { SelectorItemList } from "../../gui/base/DropDownSelector.js"
import { DateTime, Duration } from "luxon"
import { CalendarEventTimes, isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils.js"
import { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"

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

export enum CalendarViewType {
	DAY = "day",
	WEEK = "week",
	MONTH = "month",
	AGENDA = "agenda",
}

export function calendarNavConfiguration(
	viewType: CalendarViewType,
	date: Date,
	weekStart: WeekStart,
	titleType: "short" | "detailed",
	switcher: (viewType: CalendarViewType, next: boolean) => unknown,
): CalendarNavConfiguration {
	const onBack = () => switcher(viewType, false)
	const onForward = () => switcher(viewType, true)
	switch (viewType) {
		case CalendarViewType.DAY:
			return {
				back: renderCalendarSwitchLeftButton("prevDay_label", onBack),
				forward: renderCalendarSwitchRightButton("nextDay_label", onForward),
				title: titleType === "short" ? formatMonthWithFullYear(date) : formatDateWithWeekday(date),
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
				title: titleType === "short" ? formatMonthWithFullYear(date) : weekTitle(date, weekStart),
				week: calendarWeek(date, weekStart),
			}
		case CalendarViewType.AGENDA:
			return {
				back: renderCalendarSwitchLeftButton("prevWeek_label", onBack),
				forward: renderCalendarSwitchRightButton("nextWeek_label", onForward),
				title: titleType === "short" ? formatMonthWithFullYear(date) : formatDateWithWeekday(date),
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

export function getIconForViewType(viewType: CalendarViewType): AllIcons {
	const lookupTable: Record<CalendarViewType, AllIcons> = {
		[CalendarViewType.DAY]: Icons.TableSingle,
		[CalendarViewType.WEEK]: Icons.TableColumns,
		[CalendarViewType.MONTH]: Icons.Table,
		[CalendarViewType.AGENDA]: Icons.ListUnordered,
	}
	return lookupTable[viewType]
}

export function shouldDefaultToAmPmTimeFormat(): boolean {
	return lang.code === "en"
}

/**
 * get an object representing the calendar month the given date is in.
 */
export function getCalendarMonth(date: Date, firstDayOfWeekFromOffset: number, weekdayNarrowFormat: boolean): CalendarMonth {
	const weeks: Array<Array<CalendarDay>> = [[]]
	const calculationDate = getStartOfDay(date)
	calculationDate.setDate(1)
	const beginningOfMonth = new Date(calculationDate)
	let currentYear = calculationDate.getFullYear()
	let month = calculationDate.getMonth()
	// add "padding" days
	// getDay returns the day of the week (from 0 to 6) for the specified date (with first one being Sunday)
	let firstDay

	if (firstDayOfWeekFromOffset > calculationDate.getDay()) {
		firstDay = calculationDate.getDay() + 7 - firstDayOfWeekFromOffset
	} else {
		firstDay = calculationDate.getDay() - firstDayOfWeekFromOffset
	}

	let dayCount
	incrementDate(calculationDate, -firstDay)

	for (dayCount = 0; dayCount < firstDay; dayCount++) {
		weeks[0].push({
			date: new Date(calculationDate),
			day: calculationDate.getDate(),
			month: calculationDate.getMonth(),
			year: calculationDate.getFullYear(),
			isPaddingDay: true,
		})
		incrementDate(calculationDate, 1)
	}

	// add actual days
	while (calculationDate.getMonth() === month) {
		if (weeks[0].length && dayCount % 7 === 0) {
			// start new week
			weeks.push([])
		}

		const dayInfo = {
			date: new Date(currentYear, month, calculationDate.getDate()),
			year: currentYear,
			month: month,
			day: calculationDate.getDate(),
			isPaddingDay: false,
		}
		weeks[weeks.length - 1].push(dayInfo)
		incrementDate(calculationDate, 1)
		dayCount++
	}

	// add remaining "padding" days
	while (dayCount < 42) {
		if (dayCount % 7 === 0) {
			weeks.push([])
		}

		weeks[weeks.length - 1].push({
			day: calculationDate.getDate(),
			year: calculationDate.getFullYear(),
			month: calculationDate.getMonth(),
			date: new Date(calculationDate),
			isPaddingDay: true,
		})
		incrementDate(calculationDate, 1)
		dayCount++
	}

	const weekdays: string[] = []
	const weekdaysDate = new Date()
	incrementDate(weekdaysDate, -weekdaysDate.getDay() + firstDayOfWeekFromOffset) // get first day of week

	for (let i = 0; i < 7; i++) {
		weekdays.push(weekdayNarrowFormat ? lang.formats.weekdayNarrow.format(weekdaysDate) : lang.formats.weekdayShort.format(weekdaysDate))
		incrementDate(weekdaysDate, 1)
	}

	return {
		beginningOfMonth,
		weekdays,
		weeks,
	}
}

export function formatEventDuration(event: CalendarEventTimes, zone: string, includeTimezone: boolean): string {
	if (isAllDayEvent(event)) {
		const startTime = getEventStart(event, zone)
		const startString = formatDateWithMonth(startTime)
		const endTime = incrementByRepeatPeriod(getEventEnd(event, zone), RepeatPeriod.DAILY, -1, zone)

		if (isSameDayOfDate(startTime, endTime)) {
			return `${lang.get("allDay_label")}, ${startString}`
		} else {
			return `${lang.get("allDay_label")}, ${startString} - ${formatDateWithMonth(endTime)}`
		}
	} else {
		const startString = formatDateTime(event.startTime)
		let endString

		if (isSameDay(event.startTime, event.endTime)) {
			endString = formatTime(event.endTime)
		} else {
			endString = formatDateTime(event.endTime)
		}

		return `${startString} - ${endString} ${includeTimezone ? getTimeZone() : ""}`
	}
}

export const createRepeatRuleFrequencyValues = (): SelectorItemList<RepeatPeriod | null> => {
	return [
		{
			name: lang.get("calendarRepeatIntervalNoRepeat_label"),
			value: null,
		},
		{
			name: lang.get("calendarRepeatIntervalDaily_label"),
			value: RepeatPeriod.DAILY,
		},
		{
			name: lang.get("calendarRepeatIntervalWeekly_label"),
			value: RepeatPeriod.WEEKLY,
		},
		{
			name: lang.get("calendarRepeatIntervalMonthly_label"),
			value: RepeatPeriod.MONTHLY,
		},
		{
			name: lang.get("calendarRepeatIntervalAnnually_label"),
			value: RepeatPeriod.ANNUALLY,
		},
	]
}
export const createRepeatRuleEndTypeValues = (): SelectorItemList<EndType> => {
	return [
		{
			name: lang.get("calendarRepeatStopConditionNever_label"),
			value: EndType.Never,
		},
		{
			name: lang.get("calendarRepeatStopConditionOccurrences_label"),
			value: EndType.Count,
		},
		{
			name: lang.get("calendarRepeatStopConditionDate_label"),
			value: EndType.UntilDate,
		},
	]
}
export const createIntervalValues = (): SelectorItemList<number> => numberRange(1, 256).map((n) => ({ name: String(n), value: n }))

export function humanDescriptionForAlarmInterval<P>(value: AlarmInterval, locale: string): string {
	if (value.value === 0) return lang.get("calendarReminderIntervalAtEventStart_label")

	return Duration.fromObject(alarmIntervalToLuxonDurationLikeObject(value)).reconfigure({ locale: locale }).toHuman()
}

export const createAlarmIntervalItems = (locale: string): SelectorItemList<AlarmInterval> =>
	typedValues(StandardAlarmInterval).map((value) => {
		return {
			value,
			name: humanDescriptionForAlarmInterval(value, locale),
		}
	})
export const createAttendingItems = (): SelectorItemList<CalendarAttendeeStatus> => [
	{
		name: lang.get("yes_label"),
		value: CalendarAttendeeStatus.ACCEPTED,
	},
	{
		name: lang.get("maybe_label"),
		value: CalendarAttendeeStatus.TENTATIVE,
	},
	{
		name: lang.get("no_label"),
		value: CalendarAttendeeStatus.DECLINED,
	},
	{
		name: lang.get("pending_label"),
		value: CalendarAttendeeStatus.NEEDS_ACTION,
		selectable: false,
	},
]

export function humanDescriptionForAlarmIntervalUnit(unit: AlarmIntervalUnit): string {
	switch (unit) {
		case AlarmIntervalUnit.MINUTE:
			return lang.get("calendarReminderIntervalUnitMinutes_label")
		case AlarmIntervalUnit.HOUR:
			return lang.get("calendarReminderIntervalUnitHours_label")
		case AlarmIntervalUnit.DAY:
			return lang.get("calendarReminderIntervalUnitDays_label")
		case AlarmIntervalUnit.WEEK:
			return lang.get("calendarReminderIntervalUnitWeeks_label")
	}
}

export function timeString(date: Date, amPm: boolean): string {
	return timeStringFromParts(date.getHours(), date.getMinutes(), amPm)
}

export function timeStringInZone(date: Date, amPm: boolean, zone: string): string {
	const { hour, minute } = DateTime.fromJSDate(date, {
		zone,
	})
	return timeStringFromParts(hour, minute, amPm)
}

export function formatEventTime({ endTime, startTime }: CalendarEventTimes, showTime: EventTextTimeOption): string {
	switch (showTime) {
		case EventTextTimeOption.START_TIME:
			return formatTime(startTime)

		case EventTextTimeOption.END_TIME:
			return ` - ${formatTime(endTime)}`

		case EventTextTimeOption.START_END_TIME:
			return `${formatTime(startTime)} - ${formatTime(endTime)}`

		default:
			throw new ProgrammingError(`Unknown time option: ${showTime}`)
	}
}

export function formatEventTimes(day: Date, event: CalendarEvent, zone: string): string {
	if (isAllDayEvent(event)) {
		return lang.get("allDay_label")
	} else {
		const startsBefore = eventStartsBefore(day, zone, event)
		const endsAfter = eventEndsAfterDay(day, zone, event)
		if (startsBefore && endsAfter) {
			return lang.get("allDay_label")
		} else {
			const startTime: Date = startsBefore ? day : event.startTime
			const endTime: Date = endsAfter ? getEndOfDayWithZone(day, zone) : event.endTime
			return formatEventTime({ startTime, endTime }, EventTextTimeOption.START_END_TIME)
		}
	}
}

export const createCustomRepeatRuleUnitValues = (): SelectorItemList<AlarmIntervalUnit | null> => {
	return [
		{
			name: humanDescriptionForAlarmIntervalUnit(AlarmIntervalUnit.MINUTE),
			value: AlarmIntervalUnit.MINUTE,
		},
		{
			name: humanDescriptionForAlarmIntervalUnit(AlarmIntervalUnit.HOUR),
			value: AlarmIntervalUnit.HOUR,
		},
		{
			name: humanDescriptionForAlarmIntervalUnit(AlarmIntervalUnit.DAY),
			value: AlarmIntervalUnit.DAY,
		},
		{
			name: humanDescriptionForAlarmIntervalUnit(AlarmIntervalUnit.WEEK),
			value: AlarmIntervalUnit.WEEK,
		},
	]
}
