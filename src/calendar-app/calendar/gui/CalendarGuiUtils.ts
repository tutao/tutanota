import m, { Child, ChildArray, Children } from "mithril"
import type { TranslationKey } from "../../../common/misc/LanguageViewModel.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { ButtonType } from "../../../common/gui/base/Button.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import type { MousePosAndBounds } from "../../../common/gui/base/GuiUtils.js"
import { Time } from "../../../common/calendar/date/Time.js"
import {
	assert,
	assertNotNull,
	clamp,
	clone,
	getFromMap,
	getStartOfDay,
	incrementDate,
	isNotEmpty,
	isSameDay,
	isSameDayOfDate,
	memoized,
	numberRange,
	typedValues,
} from "@tutao/tutanota-utils"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import {
	formatDateTime,
	formatDateWithMonth,
	formatDateWithWeekday,
	formatMonthWithFullYear,
	formatTime,
	timeStringFromParts,
} from "../../../common/misc/Formatter.js"
import {
	AlarmInterval,
	alarmIntervalToLuxonDurationLikeObject,
	AlarmIntervalUnit,
	CalendarDay,
	CalendarMonth,
	eventEndsAfterDay,
	eventStartsBefore,
	getAllDayDateForTimezone,
	getEndOfDayWithZone,
	getEventEnd,
	getEventStart,
	getStartOfDayWithZone,
	getStartOfNextDayWithZone,
	getStartOfTheWeekOffset,
	getStartOfWeek,
	getTimeZone,
	getWeekNumber,
	incrementByRepeatPeriod,
	StandardAlarmInterval,
} from "../../../common/calendar/date/CalendarUtils.js"
import {
	AccountType,
	CalendarAttendeeStatus,
	defaultCalendarColor,
	EndType,
	EventTextTimeOption,
	RepeatPeriod,
	ShareCapability,
	WeekStart,
} from "../../../common/api/common/TutanotaConstants.js"
import { AllIcons } from "../../../common/gui/base/Icon.js"
import { SelectorItemList } from "../../../common/gui/base/DropDownSelector.js"
import { DateTime, Duration } from "luxon"
import { CalendarEventTimes, CalendarViewType, cleanMailAddress, isAllDayEvent } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { CalendarEvent, UserSettingsGroupRoot } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { size } from "../../../common/gui/size.js"
import { isColorLight, isValidColorCode } from "../../../common/gui/base/Color.js"
import { GroupColors } from "../view/CalendarView.js"
import { CalendarInfo } from "../model/CalendarModel.js"
import { EventType } from "./eventeditor-model/CalendarEventModel.js"
import { hasCapabilityOnGroup } from "../../../common/sharing/GroupUtils.js"
import { EventsOnDays } from "../view/CalendarViewModel.js"
import { CalendarEventPreviewViewModel } from "./eventpopup/CalendarEventPreviewViewModel.js"
import { createAsyncDropdown } from "../../../common/gui/base/Dropdown.js"
import { UserController } from "../../../common/api/main/UserController.js"

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
			return `${lang.formats.monthShortWithFullYear.format(firstDate)} - ${lang.formats.monthShortWithFullYear.format(lastDate)}`
		}
		return `${lang.formats.monthShort.format(firstDate)} - ${lang.formats.monthShort.format(lastDate)} ${lang.formats.yearNumeric.format(firstDate)}`
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

export type CalendarNavConfiguration = { back: Child; title: string; forward: Child }

export function calendarWeek(date: Date, weekStart: WeekStart) {
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
			}
		case CalendarViewType.MONTH:
			return {
				back: renderCalendarSwitchLeftButton("prevMonth_label", onBack),
				forward: renderCalendarSwitchRightButton("nextMonth_label", onForward),
				title: formatMonthWithFullYear(date),
			}
		case CalendarViewType.WEEK:
			return {
				back: renderCalendarSwitchLeftButton("prevWeek_label", onBack),
				forward: renderCalendarSwitchRightButton("nextWeek_label", onForward),
				title: titleType === "short" ? formatMonthWithFullYear(date) : weekTitle(date, weekStart),
			}
		case CalendarViewType.AGENDA:
			return {
				back: renderCalendarSwitchLeftButton("prevWeek_label", onBack),
				forward: renderCalendarSwitchRightButton("nextWeek_label", onForward),
				title: titleType === "short" ? formatMonthWithFullYear(date) : formatDateWithWeekday(date),
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
export const CALENDAR_EVENT_HEIGHT: number = size.calendar_line_height + 2
export const TEMPORARY_EVENT_OPACITY = 0.7

export function colorForBg(color: string): string {
	return isColorLight(color) ? "black" : "white"
}

export const enum EventLayoutMode {
	/** Take event start and end times into account when laying out. */
	TimeBasedColumn,
	/** Each event is treated as if it would take the whole day when laying out. */
	DayBasedColumn,
}

/**
 * Function which sorts events into the "columns" and "rows" and renders them using {@param renderer}.
 * Columns are abstract and can be actually the rows. A single column progresses in time while multiple columns can happen in parallel.
 * in one column on a single day (it will "stretch" events from the day start until the next day).
 */
export function layOutEvents(
	events: Array<CalendarEvent>,
	zone: string,
	renderer: (columns: Array<Array<CalendarEvent>>) => ChildArray,
	layoutMode: EventLayoutMode,
): ChildArray {
	events.sort((e1, e2) => {
		const e1Start = getEventStart(e1, zone)
		const e2Start = getEventStart(e2, zone)
		if (e1Start < e2Start) return -1
		if (e1Start > e2Start) return 1
		const e1End = getEventEnd(e1, zone)
		const e2End = getEventEnd(e2, zone)
		if (e1End < e2End) return -1
		if (e1End > e2End) return 1
		return 0
	})
	let lastEventEnding: Date | null = null
	let lastEventStart: Date | null = null
	let columns: Array<Array<CalendarEvent>> = []
	const children: Array<Children> = []
	// Cache for calculation events
	const calcEvents = new Map()
	for (const e of events) {
		const calcEvent = getFromMap(calcEvents, e, () => getCalculationEvent(e, zone, layoutMode))
		// Check if a new event group needs to be started
		if (
			lastEventEnding != null &&
			lastEventStart != null &&
			lastEventEnding <= calcEvent.startTime.getTime() &&
			(layoutMode === EventLayoutMode.DayBasedColumn || !visuallyOverlaps(lastEventStart, lastEventEnding, calcEvent.startTime))
		) {
			// The latest event is later than any of the event in the
			// current group. There is no overlap. Output the current
			// event group and start a new event group.
			children.push(...renderer(columns))
			columns = [] // This starts new event group.

			lastEventEnding = null
			lastEventStart = null
		}

		// Try to place the event inside the existing columns
		let placed = false

		for (let i = 0; i < columns.length; i++) {
			const col = columns[i]
			const lastEvent = col[col.length - 1]
			const lastCalcEvent = getFromMap(calcEvents, lastEvent, () => getCalculationEvent(lastEvent, zone, layoutMode))

			if (
				!collidesWith(lastCalcEvent, calcEvent) &&
				(layoutMode === EventLayoutMode.DayBasedColumn || !visuallyOverlaps(lastCalcEvent.startTime, lastCalcEvent.endTime, calcEvent.startTime))
			) {
				col.push(e) // push real event here not calc event

				placed = true
				break
			}
		}

		// It was not possible to place the event. Add a new column
		// for the current event group.
		if (!placed) {
			columns.push([e])
		}

		// Remember the latest event end time and start time of the current group.
		// This is later used to determine if a new groups starts.
		if (lastEventEnding == null || lastEventEnding.getTime() < calcEvent.endTime.getTime()) {
			lastEventEnding = calcEvent.endTime
		}
		if (lastEventStart == null || lastEventStart.getTime() < calcEvent.startTime.getTime()) {
			lastEventStart = calcEvent.startTime
		}
	}
	children.push(...renderer(columns))
	return children
}

/** get an event that can be rendered to the screen. in day view, the event is returned as-is, otherwise it's stretched to cover each day
 * it occurs on completely. */
function getCalculationEvent(event: CalendarEvent, zone: string, eventLayoutMode: EventLayoutMode): CalendarEvent {
	if (eventLayoutMode === EventLayoutMode.DayBasedColumn) {
		const calcEvent = clone(event)

		if (isAllDayEvent(event)) {
			calcEvent.startTime = getAllDayDateForTimezone(event.startTime, zone)
			calcEvent.endTime = getAllDayDateForTimezone(event.endTime, zone)
		} else {
			calcEvent.startTime = getStartOfDayWithZone(event.startTime, zone)
			calcEvent.endTime = getStartOfNextDayWithZone(event.endTime, zone)
		}

		return calcEvent
	} else {
		return event
	}
}

/**
 * This function checks whether two events collide based on their start and end time
 * Assuming vertical columns with time going top-to-bottom, this would be true in these cases:
 *
 * case 1:
 * +-----------+
 * |           |
 * |           |   +----------+
 * +-----------+   |          |
 *                 |          |
 *                 +----------+
 * case 2:
 * +-----------+
 * |           |   +----------+
 * |           |   |          |
 * |           |   +----------+
 * +-----------+
 *
 * There could be a case where they are flipped vertically, but we don't have them because earlier events will be always first. so the "left" top edge will
 * always be "above" the "right" top edge.
 */
function collidesWith(a: CalendarEvent, b: CalendarEvent): boolean {
	return a.endTime.getTime() > b.startTime.getTime() && a.startTime.getTime() < b.endTime.getTime()
}

/**
 * Due to the minimum height for events they overlap if a short event is directly followed by another event,
 * therefore, we check whether the event height is less than the minimum height.
 *
 * This does not cover all the cases but handles the case when the second event starts right after the first one.
 */
function visuallyOverlaps(firstEventStart: Date, firstEventEnd: Date, secondEventStart: Date): boolean {
	// We are only interested in the height on the last day of the event because an event ending later will take up the whole column until the next day anyway.
	const firstEventStartOnSameDay = isSameDay(firstEventStart, firstEventEnd) ? firstEventStart.getTime() : getStartOfDay(firstEventEnd).getTime()
	const eventDurationMs = firstEventEnd.getTime() - firstEventStartOnSameDay
	const eventDurationHours = eventDurationMs / (1000 * 60 * 60)
	const height = eventDurationHours * size.calendar_hour_height - size.calendar_event_border
	return firstEventEnd.getTime() === secondEventStart.getTime() && height < size.calendar_line_height
}

export function expandEvent(ev: CalendarEvent, columnIndex: number, columns: Array<Array<CalendarEvent>>): number {
	let colSpan = 1

	for (let i = columnIndex + 1; i < columns.length; i++) {
		let col = columns[i]

		for (let j = 0; j < col.length; j++) {
			let ev1 = col[j]

			if (collidesWith(ev, ev1) || visuallyOverlaps(ev.startTime, ev.endTime, ev1.startTime)) {
				return colSpan
			}
		}

		colSpan++
	}

	return colSpan
}

export function getEventColor(event: CalendarEvent, groupColors: GroupColors): string {
	return (event._ownerGroup && groupColors.get(event._ownerGroup)) ?? defaultCalendarColor
}

export function calendarAttendeeStatusSymbol(status: CalendarAttendeeStatus): string {
	switch (status) {
		case CalendarAttendeeStatus.ADDED:
		case CalendarAttendeeStatus.NEEDS_ACTION:
			return ""

		case CalendarAttendeeStatus.TENTATIVE:
			return "?"

		case CalendarAttendeeStatus.ACCEPTED:
			return "✓"

		case CalendarAttendeeStatus.DECLINED:
			return "❌"

		default:
			throw new Error("Unknown calendar attendee status: " + status)
	}
}

export const iconForAttendeeStatus: Record<CalendarAttendeeStatus, AllIcons> = Object.freeze({
	[CalendarAttendeeStatus.ACCEPTED]: Icons.CircleCheckmark,
	[CalendarAttendeeStatus.TENTATIVE]: Icons.CircleHelp,
	[CalendarAttendeeStatus.DECLINED]: Icons.CircleReject,
	[CalendarAttendeeStatus.NEEDS_ACTION]: Icons.CircleEmpty,
	[CalendarAttendeeStatus.ADDED]: Icons.CircleEmpty,
})
export const getGroupColors = memoized((userSettingsGroupRoot: UserSettingsGroupRoot) => {
	return userSettingsGroupRoot.groupSettings.reduce((acc, { group, color }) => {
		if (!isValidColorCode("#" + color)) {
			color = defaultCalendarColor
		}
		acc.set(group, color)
		return acc
	}, new Map())
})

/**
 *  find out how we ended up with this event, which determines the capabilities we have with it.
 *  for shared events in calendar where we have read-write access, we can still only view events that have
 *  attendees, because we could not send updates after we edit something
 * @param existingEvent the event in question.
 * @param calendars a list of calendars that this user has access to.
 * @param ownMailAddresses the list of mail addresses this user might be using.
 * @param userController
 */
export function getEventType(
	existingEvent: Partial<CalendarEvent>,
	calendars: ReadonlyMap<Id, CalendarInfo>,
	ownMailAddresses: ReadonlyArray<string>,
	userController: UserController,
): EventType {
	const { user, userSettingsGroupRoot } = userController

	if (user.accountType === AccountType.EXTERNAL) {
		return EventType.EXTERNAL
	}

	const existingOrganizer = existingEvent.organizer
	const isOrganizer = existingOrganizer != null && ownMailAddresses.some((a) => cleanMailAddress(a) === existingOrganizer.address)

	if (existingEvent._ownerGroup == null) {
		if (existingOrganizer != null && !isOrganizer) {
			// OwnerGroup is not set for events from file, but we also require an organizer to treat it as an invite.
			return EventType.INVITE
		} else {
			// either the organizer exists and it's us, or the organizer does not exist and we can treat this as our event,
			// like for newly created events.
			return EventType.OWN
		}
	}

	const calendarInfoForEvent = calendars.get(existingEvent._ownerGroup) ?? null
	if (calendarInfoForEvent == null || calendarInfoForEvent.isExternal) {
		// event has an ownergroup, but it's not in one of our calendars. this might actually be an error.
		return EventType.SHARED_RO
	}

	/**
	 * if the event has a _ownerGroup, it means there is a calendar set to it
	 * so, if the user is the owner of said calendar they are free to manage the event however they want
	 **/
	if ((isOrganizer || existingOrganizer === null) && calendarInfoForEvent.userIsOwner) {
		return EventType.OWN
	}

	if (calendarInfoForEvent.shared) {
		const canWrite = hasCapabilityOnGroup(user, calendarInfoForEvent.group, ShareCapability.Write)
		if (canWrite) {
			const organizerAddress = cleanMailAddress(existingOrganizer?.address ?? "")
			const wouldRequireUpdates: boolean =
				existingEvent.attendees != null && existingEvent.attendees.some((a) => cleanMailAddress(a.address.address) !== organizerAddress)
			return wouldRequireUpdates ? EventType.LOCKED : EventType.SHARED_RW
		} else {
			return EventType.SHARED_RO
		}
	}

	//For an event in a personal calendar there are 3 options
	if (existingOrganizer == null || existingEvent.attendees?.length === 0 || isOrganizer) {
		// 1. we are the organizer of the event or the event does not have an organizer yet
		// 2. we are not the organizer and the event does not have guests. it was created by someone we shared our calendar with (also considered our own event)
		return EventType.OWN
	} else {
		// 3. the event is an invitation that has another organizer and/or attendees.
		return EventType.INVITE
	}
}

export function shouldDisplayEvent(e: CalendarEvent, hiddenCalendars: ReadonlySet<Id>): boolean {
	return !hiddenCalendars.has(assertNotNull(e._ownerGroup, "event without ownerGroup in getEventsOnDays"))
}

export function daysHaveEvents(eventsOnDays: EventsOnDays): boolean {
	return eventsOnDays.shortEventsPerDay.some(isNotEmpty) || isNotEmpty(eventsOnDays.longEvents)
}

/**
 * A handler for `onwheel` to move to a forwards or previous view based on mouse wheel movement
 * @returns a function to be used by `onwheel`
 */
export function changePeriodOnWheel(callback: (isNext: boolean) => unknown): (event: WheelEvent) => void {
	return (event: WheelEvent) => {
		// Go to the next period if scrolling down or right
		callback(event.deltaY > 0 || event.deltaX > 0)
	}
}

export async function showDeletePopup(model: CalendarEventPreviewViewModel, ev: MouseEvent, receiver: HTMLElement, onClose?: () => unknown) {
	if (await model.isRepeatingForDeleting()) {
		createAsyncDropdown({
			lazyButtons: () =>
				Promise.resolve([
					{
						label: "deleteSingleEventRecurrence_action",
						click: async () => {
							await model.deleteSingle()
							onClose?.()
						},
					},
					{
						label: "deleteAllEventRecurrence_action",
						click: () => confirmDeleteClose(model, onClose),
					},
				]),
			width: 300,
		})(ev, receiver)
	} else {
		// noinspection JSIgnoredPromiseFromCall
		confirmDeleteClose(model, onClose)
	}
}

async function confirmDeleteClose(model: CalendarEventPreviewViewModel, onClose?: () => unknown): Promise<void> {
	if (!(await Dialog.confirm("deleteEventConfirmation_msg"))) return
	await model.deleteAll()
	onClose?.()
}

export function getDisplayEventTitle(title: string): string {
	return title ?? title !== "" ? title : lang.get("noTitle_label")
}

export type ColorString = string

export function generateRandomColor(withHashtag: boolean = false): ColorString {
	return (withHashtag ? "#" : "") + Math.random().toString(16).slice(-6)
}

export function renderCalendarColor(selectedCalendar: CalendarInfo | null, groupColors: Map<Id, string>) {
	const color = selectedCalendar ? groupColors.get(selectedCalendar.groupInfo.group) ?? defaultCalendarColor : null
	return m(".mt-xs", {
		style: {
			width: "100px",
			height: "10px",
			background: color ? "#" + color : "transparent",
		},
	})
}
