//@flow
import {getStartOfDay, getStartOfNextDay, incrementDate} from "../api/common/utils/DateUtils"
import stream from "mithril/stream/stream.js"
import {DatePicker} from "../gui/base/DatePicker"
import {Dialog} from "../gui/base/Dialog"
import type {CalendarInfo} from "./CalendarView"
import m from "mithril"
import {TextFieldN, Type} from "../gui/base/TextFieldN"
import {CheckboxN} from "../gui/base/CheckboxN"
import {lang} from "../misc/LanguageViewModel"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {Icons} from "../gui/base/icons/Icons"
import {createCalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import {erase, load} from "../api/main/Entity"

import {downcast, neverNull} from "../api/common/utils/Utils"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {EndTypeEnum, RepeatPeriodEnum} from "../api/common/TutanotaConstants"
import {EndType, RepeatPeriod} from "../api/common/TutanotaConstants"
import {numberRange} from "../api/common/utils/ArrayUtils"
import {incrementByRepeatPeriod} from "./CalendarModel"
import {DateTime} from "luxon"
import {createAlarmInfo} from "../api/entities/sys/AlarmInfo"
import {elementIdPart, isSameId, listIdPart} from "../api/common/EntityFunctions"
import {logins} from "../api/main/LoginController"
import {UserAlarmInfoTypeRef} from "../api/entities/sys/UserAlarmInfo"
import {createRepeatRuleWithValues, getAllDayDateUTC, parseTimeTo, timeString} from "./CalendarUtils"
import {generateEventElementId, getEventEnd, getEventStart, isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import {worker} from "../api/main/WorkerClient"

// allDay event consists of full UTC days. It always starts at 00:00:00.00 of its start day in UTC and ends at
// 0 of the next day in UTC. Full day event time is relative to the local timezone. So startTime and endTime of
// allDay event just points us to the correct date.
// e.g. there's an allDay event in Europe/Berlin at 2nd of may. We encode it as:
// {startTime: new Date(Date.UTC(2019, 04, 2, 0, 0, 0, 0)), {endTime: new Date(Date.UTC(2019, 04, 3, 0, 0, 0, 0))}}
// We check the condition with time == 0 and take a UTC date (which is [2-3) so full day on the 2nd of May). We
// interpret it as full day in Europe/Berlin, not in the UTC.
export function showCalendarEventDialog(date: Date, calendars: Map<Id, CalendarInfo>, existingEvent?: CalendarEvent) {
	const summary = stream("")
	const calendarArray = Array.from(calendars.values())
	const selectedCalendar = stream(calendarArray[0])
	const startDatePicker = new DatePicker("dateFrom_label", "emptyString_msg", true)
	startDatePicker.setDate(date)
	const endDatePicker = new DatePicker("dateTo_label", "emptyString_msg", true)
	const startTime = stream(timeString(date))
	const endTime = stream()
	const allDay = stream(false)
	const locationValue = stream("")
	const notesValue = stream("")

	const repeatPickerAttrs = createRepeatingDatePicker()
	const repeatIntervalPickerAttrs = createIntervalPicker()
	const endTypePickerAttrs = createEndTypePicker()
	const repeatEndDatePicker = new DatePicker("emptyString_msg", "emptyString_msg", true)
	const endCountPickerAttrs = createEndCountPicker()
	const alarmPickerAttrs = createAlarmrPicker()

	let loadedUserAlarmInfo: ?UserAlarmInfo = null
	const user = logins.getUserController().user

	if (existingEvent) {
		summary(existingEvent.summary)
		const calendarForGroup = calendars.get(neverNull(existingEvent._ownerGroup))
		if (calendarForGroup) {
			selectedCalendar(calendarForGroup)
		}
		startTime(timeString(getEventStart(existingEvent)))
		allDay(existingEvent && isAllDayEvent(existingEvent))
		if (allDay()) {
			endDatePicker.setDate(incrementDate(getEventEnd(existingEvent), -1))
		} else {
			endDatePicker.setDate(getStartOfDay(getEventEnd(existingEvent)))
		}
		endTime(timeString(getEventEnd(existingEvent)))
		if (existingEvent.repeatRule) {
			const existingRule = existingEvent.repeatRule
			repeatPickerAttrs.selectedValue(downcast(existingRule.frequency))
			repeatIntervalPickerAttrs.selectedValue(Number(existingRule.interval))
			endTypePickerAttrs.selectedValue(downcast(existingRule.endType))
			endCountPickerAttrs.selectedValue(existingRule.endType === EndType.Count ? Number(existingRule.endValue) : 1)
			repeatEndDatePicker.setDate(existingRule.endType === EndType.UntilDate ? incrementDate(new Date(Number(existingRule.endValue)), -1) : null)
		} else {
			repeatPickerAttrs.selectedValue(null)
		}
		locationValue(existingEvent.location)
		notesValue(existingEvent.description)

		for (let alarmInfoId of existingEvent.alarmInfos) {
			if (isSameId(listIdPart(alarmInfoId), neverNull(user.alarmInfoList).alarms)) {
				load(UserAlarmInfoTypeRef, alarmInfoId).then((userAlarmInfo) => {
					loadedUserAlarmInfo = userAlarmInfo
					alarmPickerAttrs.selectedValue(downcast(userAlarmInfo.alarmInfo.trigger))
					m.redraw()
				})
				break
			}
		}

	} else {
		const endTimeDate = new Date(date)
		endTimeDate.setHours(endTimeDate.getHours() + 1)
		endDatePicker.setDate(date)
		endTime(timeString(endTimeDate))
	}

	endTypePickerAttrs.selectedValue.map((endType) => {
		if (endType === EndType.UntilDate && !repeatEndDatePicker.date()) {
			const newRepeatEnd = incrementByRepeatPeriod(neverNull(startDatePicker.date()), neverNull(repeatPickerAttrs.selectedValue()),
				neverNull(repeatIntervalPickerAttrs.selectedValue()), DateTime.local().zoneName)
			repeatEndDatePicker.setDate(newRepeatEnd)
		}
	})

	function renderStopConditionValue(): Children {
		if (repeatPickerAttrs.selectedValue() == null || endTypePickerAttrs.selectedValue() === EndType.Never) {
			return null
		} else if (endTypePickerAttrs.selectedValue() === EndType.Count) {
			return m(DropDownSelectorN, endCountPickerAttrs)
		} else if (endTypePickerAttrs.selectedValue() === EndType.UntilDate) {
			return m(repeatEndDatePicker)
		} else {
			return null
		}
	}

	const dialog = Dialog.showActionDialog({
		title: () => lang.get("createEvent_title"),
		child: () => [
			m(TextFieldN, {
				label: "title_placeholder",
				value: summary
			}),
			m(".flex", [
				m(".flex-grow.mr-s", m(startDatePicker)),
				!allDay()
					? m(".time-field", m(TextFieldN, {
						label: "emptyString_msg",
						value: startTime
					}))
					: null
			]),
			m(".flex", [
				m(".flex-grow.mr-s", m(endDatePicker)),
				!allDay()
					? m(".time-field", m(TextFieldN, {
						label: "emptyString_msg",
						value: endTime
					}))
					: null
			]),
			m(CheckboxN, {
				checked: allDay,
				label: () => lang.get("allDay_label"),
			}),
			m(".flex", [
				m(".flex-grow", m(DropDownSelectorN, repeatPickerAttrs)),
				m(".flex-grow.ml-s" + (repeatPickerAttrs.selectedValue() ? "" : ".hidden"), m(DropDownSelectorN, repeatIntervalPickerAttrs)),
			]),
			repeatPickerAttrs.selectedValue()
				? m(".flex", [
					m(".flex-grow", m(DropDownSelectorN, endTypePickerAttrs)),
					m(".flex-grow.ml-s", renderStopConditionValue()),
				])
				: null,
			m(DropDownSelectorN, alarmPickerAttrs),
			m(DropDownSelectorN, ({
				label: "calendar_label",
				items: calendarArray.map((calendarInfo) => {
					return {name: calendarInfo.groupRoot.name || lang.get("privateCalendar_label"), value: calendarInfo}
				}),
				selectedValue: selectedCalendar,
				icon: Icons.Edit,
			}: DropDownSelectorAttrs<CalendarInfo>)),
			m(TextFieldN, {
				label: () => "Location",
				value: locationValue
			}),
			m(TextFieldN, {
				label: () => "Notes",
				value: notesValue,
				type: Type.Area
			}),
			existingEvent ? m(".mr-negative-s.float-right.flex-end-on-child", m(ButtonN, {
				label: "delete_action",
				type: ButtonType.Primary,
				click: () => {
					erase(existingEvent)
					dialog.close()
				}
			})) : null,
		],
		okAction: () => {
			const newEvent = createCalendarEvent()
			let startDate = neverNull(startDatePicker.date())
			const parsedStartTime = parseTimeTo(startTime())
			const parsedEndTime = parseTimeTo(endTime())
			let endDate = neverNull(endDatePicker.date())

			if (allDay()) {
				startDate = getAllDayDateUTC(startDate)
				endDate = getAllDayDateUTC(getStartOfNextDay(endDate))
			} else {
				if (!parsedStartTime || !parsedEndTime) {
					Dialog.error("timeFormatInvalid_msg")
					return
				}
				startDate.setHours(parsedStartTime.hours)
				startDate.setMinutes(parsedStartTime.minutes)

				// End date is never actually included in the event. For the whole day event the next day
				// is the boundary. For the timed one the end time is the boundary.
				endDate.setHours(parsedEndTime.hours)
				endDate.setMinutes(parsedEndTime.minutes)
			}

			newEvent.startTime = startDate
			newEvent.description = notesValue()
			newEvent.summary = summary()
			newEvent.location = locationValue()
			newEvent.endTime = endDate
			const groupRoot = selectedCalendar().groupRoot
			newEvent._ownerGroup = selectedCalendar().groupRoot._id
			const repeatFrequency = repeatPickerAttrs.selectedValue()
			if (repeatFrequency == null) {
				newEvent.repeatRule = null
			} else {
				const interval = repeatIntervalPickerAttrs.selectedValue() || 1
				const repeatRule = createRepeatRuleWithValues(repeatFrequency, interval)
				newEvent.repeatRule = repeatRule

				const stopType = neverNull(endTypePickerAttrs.selectedValue())
				repeatRule.endType = stopType
				if (stopType === EndType.Count) {
					let count = endCountPickerAttrs.selectedValue()
					if (isNaN(count) || Number(count) < 1) {
						repeatRule.endType = EndType.Never
					} else {
						repeatRule.endValue = String(count)
					}
				} else if (stopType === EndType.UntilDate) {
					const repeatEndDate = getStartOfNextDay(neverNull(repeatEndDatePicker.date()))
					if (repeatEndDate.getTime() < getEventStart(newEvent)) {
						Dialog.error("startAfterEnd_label")
						return
					} else {
						// We have to save repeatEndDate in the same way we save start/end times because if one is timzone
						// dependent and one is not then we have interesting bugs in edge cases (event created in -11 could
						// end on another date in +12). So for all day events end date is UTC-encoded all day event and for
						// regular events it is just a timestamp.
						repeatRule.endValue = String((allDay() ? getAllDayDateUTC(repeatEndDate) : repeatEndDate).getTime())
					}
				}
			}
			const alarmValue = alarmPickerAttrs.selectedValue()
			const newAlarm = alarmValue
				&& createCalendarAlarm(generateEventElementId(Date.now()), alarmValue)
			worker.createCalendarEvent(groupRoot, newEvent, newAlarm, existingEvent, loadedUserAlarmInfo)

			dialog.close()
		}
	})
}

function createCalendarAlarm(identifier: string, trigger: string): AlarmInfo {
	const calendarAlarmInfo = createAlarmInfo()
	calendarAlarmInfo.identifier = identifier
	calendarAlarmInfo.trigger = trigger
	return calendarAlarmInfo
}

const repeatValues = [
	{name: "Do not repeat", value: null},
	{name: "Repeat daily", value: RepeatPeriod.DAILY},
	{name: "Weekly", value: RepeatPeriod.WEEKLY},
	{name: "Monthly", value: RepeatPeriod.MONTHLY},
	{name: "Annually", value: RepeatPeriod.ANNUALLY}
]

function createRepeatingDatePicker(): DropDownSelectorAttrs<?RepeatPeriodEnum> {
	return {
		label: () => "Repeating",
		items: repeatValues,
		selectedValue: stream(repeatValues[0].value),
		icon: Icons.Edit,
	}
}

const intervalValues = numberRange(1, 256).map(n => {
	return {name: String(n), value: n}
})


function createIntervalPicker(): DropDownSelectorAttrs<number> {
	return {
		label: "interval_title",
		items: intervalValues,
		selectedValue: stream(intervalValues[0].value),
		icon: Icons.Edit,
	}
}

const stopConditionValues = [
	{name: "Never", value: EndType.Never},
	{name: "After occurences", value: EndType.Count},
	{name: "On", value: EndType.UntilDate}
]

function createEndTypePicker(): DropDownSelectorAttrs<EndTypeEnum> {
	return {
		label: () => "Ends",
		items: stopConditionValues,
		selectedValue: stream(stopConditionValues[0].value),
		icon: Icons.Edit
	}
}

export function createEndCountPicker(): DropDownSelectorAttrs<number> {
	return {
		label: "emptyString_msg",
		items: intervalValues,
		selectedValue: stream(intervalValues[0].value),
		icon: Icons.Edit,
	}
}

const AlarmInterval = Object.freeze({
	FIVE_MINUTES: "5M",
	TEN_MINUTES: "10M",
	THIRTY_MINUTES: "30M",
	ONE_HOUR: "1H",
	ONE_DAY: "1D",
	TWO_DAYS: "2D",
	THREE_DAYS: "3D",
	ONE_WEEK: "1W",
})
type AlarmIntervalEnum = $Values<typeof AlarmInterval>

const alarmIntervalItems = [
	{name: "None", value: null},
	{name: "5 minutes", value: AlarmInterval.FIVE_MINUTES},
	{name: "10 minutes", value: AlarmInterval.TEN_MINUTES},
	{name: "30 minutes", value: AlarmInterval.THIRTY_MINUTES},
	{name: "1 hour", value: AlarmInterval.ONE_HOUR},
	{name: "1 day", value: AlarmInterval.ONE_DAY},
	{name: "2 days", value: AlarmInterval.TWO_DAYS},
	{name: "3 days", value: AlarmInterval.THREE_DAYS},
	{name: "1 week", value: AlarmInterval.ONE_WEEK}
]

function createAlarmrPicker(): DropDownSelectorAttrs<?AlarmIntervalEnum> {
	return {
		label: () => "Reminder",
		items: alarmIntervalItems,
		selectedValue: stream(null),
		icon: Icons.Edit
	}
}

function decrementByAlarmInterval(date: Date, interval: AlarmIntervalEnum): Date {
	let diff
	switch (interval) {
		case AlarmInterval.FIVE_MINUTES:
			diff = {minutes: 5}
			break
		case AlarmInterval.TEN_MINUTES:
			diff = {minutes: 10}
			break
		case AlarmInterval.THIRTY_MINUTES:
			diff = {minutes: 30}
			break
		case AlarmInterval.ONE_HOUR:
			diff = {hours: 1}
			break
		case AlarmInterval.ONE_DAY:
			diff = {days: 1}
			break
		case AlarmInterval.TWO_DAYS:
			diff = {days: 1}
			break
		case AlarmInterval.THREE_DAYS:
			diff = {days: 3}
			break
		case AlarmInterval.ONE_WEEK:
			diff = {weeks: 1}
			break
		default:
			diff = {}
	}
	return DateTime.fromJSDate(date).minus(diff).toJSDate()
}