//@flow
import {getStartOfDay, getStartOfNextDay, incrementDate} from "../api/common/utils/DateUtils"
import stream from "mithril/stream/stream.js"
import {DatePicker} from "../gui/base/DatePicker"
import {Dialog} from "../gui/base/Dialog"
import type {CalendarInfo} from "./CalendarView"
import {LIMIT_PAST_EVENTS_YEARS} from "./CalendarView"
import m from "mithril"
import {TextFieldN, Type} from "../gui/base/TextFieldN"
import {CheckboxN} from "../gui/base/CheckboxN"
import {lang} from "../misc/LanguageViewModel"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {Icons} from "../gui/base/icons/Icons"
import {createCalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import {erase, load} from "../api/main/Entity"

import {downcast, neverNull, noOp} from "../api/common/utils/Utils"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {AlarmIntervalEnum, EndTypeEnum, RepeatPeriodEnum} from "../api/common/TutanotaConstants"
import {AlarmInterval, EndType, RepeatPeriod, ShareCapability, TimeFormat} from "../api/common/TutanotaConstants"
import {last, lastThrow, numberRange, remove} from "../api/common/utils/ArrayUtils"
import {incrementByRepeatPeriod} from "./CalendarModel"
import {DateTime} from "luxon"
import {createAlarmInfo} from "../api/entities/sys/AlarmInfo"
import {isSameId, listIdPart} from "../api/common/EntityFunctions"
import {logins} from "../api/main/LoginController"
import {UserAlarmInfoTypeRef} from "../api/entities/sys/UserAlarmInfo"
import {
	createEventId,
	createRepeatRuleWithValues,
	generateUid,
	getCalendarName,
	getDiffInDays,
	getEventEnd,
	getEventStart,
	getStartOfTheWeekOffsetForUser,
	hasCapabilityOnGroup,
	parseTime,
	timeString,
	timeStringFromParts
} from "./CalendarUtils"
import {generateEventElementId, getAllDayDateUTC, isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import {worker} from "../api/main/WorkerClient"
import {NotFoundError} from "../api/common/error/RestError"
import {TimePicker} from "../gui/base/TimePicker"
import {windowFacade} from "../misc/WindowFacade"
import {client} from "../misc/ClientDetector"

const TIMESTAMP_ZERO_YEAR = 1970

// allDay event consists of full UTC days. It always starts at 00:00:00.00 of its start day in UTC and ends at
// 0 of the next day in UTC. Full day event time is relative to the local timezone. So startTime and endTime of
// allDay event just points us to the correct date.
// e.g. there's an allDay event in Europe/Berlin at 2nd of may. We encode it as:
// {startTime: new Date(Date.UTC(2019, 04, 2, 0, 0, 0, 0)), {endTime: new Date(Date.UTC(2019, 04, 3, 0, 0, 0, 0))}}
// We check the condition with time == 0 and take a UTC date (which is [2-3) so full day on the 2nd of May). We
function _repeatRulesEqual(repeatRule: ?CalendarRepeatRule, repeatRule2: ?CalendarRepeatRule): boolean {
	return (repeatRule == null && repeatRule2 == null) ||
		(repeatRule != null && repeatRule2 != null &&
			repeatRule.endType === repeatRule2.endType &&
			repeatRule.endValue === repeatRule2.endValue &&
			repeatRule.frequency === repeatRule2.frequency &&
			repeatRule.interval === repeatRule2.interval &&
			repeatRule.timeZone === repeatRule2.timeZone)
}

// interpret it as full day in Europe/Berlin, not in the UTC.
export function showCalendarEventDialog(date: Date, calendars: Map<Id, CalendarInfo>, existingEvent ?: CalendarEvent) {
	const summary = stream("")
	let calendarArray = Array.from(calendars.values())
	let readOnly = false
	if (!existingEvent) {
		calendarArray = calendarArray.filter(calendarInfo => hasCapabilityOnGroup(logins.getUserController().user, calendarInfo.group, ShareCapability.Write))
	} else {
		const calendarInfoForEvent = calendars.get(neverNull(existingEvent._ownerGroup))
		if (calendarInfoForEvent) {
			readOnly = !hasCapabilityOnGroup(logins.getUserController().user, calendarInfoForEvent.group, ShareCapability.Write)
		}
	}
	const selectedCalendar = stream(calendarArray[0])
	const startOfTheWeekOffset = getStartOfTheWeekOffsetForUser()
	const startDatePicker = new DatePicker(startOfTheWeekOffset, "dateFrom_label", "emptyString_msg", true, readOnly)
	startDatePicker.setDate(getStartOfDay(date))
	const endDatePicker = new DatePicker(startOfTheWeekOffset, "dateTo_label", "emptyString_msg", true, readOnly)
	const amPmFormat = logins.getUserController().userSettingsGroupRoot.timeFormat === TimeFormat.TWELVE_HOURS
	const startTime = stream(timeString(date, amPmFormat))
	const endTime = stream()
	const allDay = stream(false)
	const locationValue = stream("")
	const notesValue = stream("")

	const repeatPickerAttrs = createRepeatingDatePicker(readOnly)
	const repeatIntervalPickerAttrs = createIntervalPicker(readOnly)
	const endTypePickerAttrs = createEndTypePicker(readOnly)
	const repeatEndDatePicker = new DatePicker(startOfTheWeekOffset, "emptyString_msg", "emptyString_msg", true)
	const endCountPickerAttrs = createEndCountPicker()

	const alarmPickerAttrs = []

	const alarmIntervalItems = [
		{name: lang.get("comboBoxSelectionNone_msg"), value: null},
		{name: lang.get("calendarReminderIntervalFiveMinutes_label"), value: AlarmInterval.FIVE_MINUTES},
		{name: lang.get("calendarReminderIntervalTenMinutes_label"), value: AlarmInterval.TEN_MINUTES},
		{name: lang.get("calendarReminderIntervalThirtyMinutes_label"), value: AlarmInterval.THIRTY_MINUTES},
		{name: lang.get("calendarReminderIntervalOneHour_label"), value: AlarmInterval.ONE_HOUR},
		{name: lang.get("calendarReminderIntervalOneDay_label"), value: AlarmInterval.ONE_DAY},
		{name: lang.get("calendarReminderIntervalTwoDays_label"), value: AlarmInterval.TWO_DAYS},
		{name: lang.get("calendarReminderIntervalThreeDays_label"), value: AlarmInterval.THREE_DAYS},
		{name: lang.get("calendarReminderIntervalOneWeek_label"), value: AlarmInterval.ONE_WEEK}
	]

	function createAlarmPicker(): DropDownSelectorAttrs<?AlarmIntervalEnum> {
		const selectedValue = stream(null)
		const attrs = {
			label: () => lang.get("reminderBeforeEvent_label"),
			items: alarmIntervalItems,
			selectedValue,
			icon: Icons.Edit
		}
		selectedValue.map((v) => {
			const lastAttrs = last(alarmPickerAttrs)
			if (attrs === lastAttrs && selectedValue() != null) {
				alarmPickerAttrs.push(createAlarmPicker())
			} else if (v == null && alarmPickerAttrs.some(a => a !== attrs && a.selectedValue() == null)) {
				remove(alarmPickerAttrs, attrs)
			}
		})
		return attrs

	}

	alarmPickerAttrs.push(createAlarmPicker())

	const user = logins.getUserController().user

	if (existingEvent) {
		summary(existingEvent.summary)
		const calendarForGroup = calendars.get(neverNull(existingEvent._ownerGroup))
		if (calendarForGroup) {
			selectedCalendar(calendarForGroup)
		}
		startTime(timeString(getEventStart(existingEvent), amPmFormat))
		allDay(existingEvent && isAllDayEvent(existingEvent))
		if (allDay()) {
			endDatePicker.setDate(incrementDate(getEventEnd(existingEvent), -1))
		} else {
			endDatePicker.setDate(getStartOfDay(getEventEnd(existingEvent)))
		}
		endTime(timeString(getEventEnd(existingEvent), amPmFormat))
		if (existingEvent.repeatRule) {
			const existingRule = existingEvent.repeatRule
			repeatPickerAttrs.selectedValue(downcast(existingRule.frequency))
			repeatIntervalPickerAttrs.selectedValue(Number(existingRule.interval))
			endTypePickerAttrs.selectedValue(downcast(existingRule.endType))
			endCountPickerAttrs.selectedValue(existingRule.endType === EndType.Count ? Number(existingRule.endValue) : 1)
			repeatEndDatePicker.setDate(existingRule.endType
			=== EndType.UntilDate ? incrementDate(new Date(Number(existingRule.endValue)), -1) : null)
		} else {
			repeatPickerAttrs.selectedValue(null)
		}
		locationValue(existingEvent.location)
		notesValue(existingEvent.description)

		for (let alarmInfoId of existingEvent.alarmInfos) {
			if (isSameId(listIdPart(alarmInfoId), neverNull(user.alarmInfoList).alarms)) {
				load(UserAlarmInfoTypeRef, alarmInfoId).then((userAlarmInfo) => {
					lastThrow(alarmPickerAttrs).selectedValue(downcast(userAlarmInfo.alarmInfo.trigger))
					m.redraw()
				})
			}
		}

	} else {
		const endTimeDate = new Date(date)
		endTimeDate.setMinutes(endTimeDate.getMinutes() + 30)
		endDatePicker.setDate(getStartOfDay(date))
		endTime(timeString(endTimeDate, amPmFormat))
		m.redraw()
	}

	endTypePickerAttrs.selectedValue.map((endType) => {
		if (endType === EndType.UntilDate && !repeatEndDatePicker.date()) {
			const newRepeatEnd = incrementByRepeatPeriod(neverNull(startDatePicker.date()), neverNull(repeatPickerAttrs.selectedValue()),
				neverNull(repeatIntervalPickerAttrs.selectedValue()), DateTime.local().zoneName)
			repeatEndDatePicker.setDate(newRepeatEnd)
		}
	})

	let eventTooOld: boolean = false
	stream.scan((oldStartDate, startDate) => {
		// The custom ID for events is derived from the unix timestamp, and sorting the negative ids is a challenge we decided not to
		// tackle because it is a rare case.
		if (startDate && startDate.getFullYear() < TIMESTAMP_ZERO_YEAR) {
			const thisYear = (new Date()).getFullYear()
			let newDate = new Date(startDate)
			newDate.setFullYear(thisYear)
			startDatePicker.setDate(newDate)
			return newDate
		}
		const endDate = endDatePicker.date()
		eventTooOld = (!!startDate && -DateTime.fromJSDate(startDate).diffNow("year").years > LIMIT_PAST_EVENTS_YEARS)
		if (startDate && endDate) {
			const diff = getDiffInDays(endDate, neverNull(oldStartDate))
			endDatePicker.setDate(DateTime.fromJSDate(startDate).plus({days: diff}).toJSDate())
		}
		return startDate
	}, startDatePicker.date(), startDatePicker.date)

	let oldStartTime: string = startTime()

	function onStartTimeSelected(value) {
		oldStartTime = startTime()
		startTime(value)
		let startDate = neverNull(startDatePicker.date())
		let endDate = neverNull(endDatePicker.date())
		if (startDate.getTime() === endDate.getTime()) {
			fixTime()
		}
	}

	/**
	 * Check if the start time is after the end time and fix that
	 */
	function fixTime() {
		const parsedOldStartTime = oldStartTime && parseTime(oldStartTime)
		const parsedStartTime = parseTime(startTime())
		const parsedEndTime = parseTime(endTime())
		if (!parsedStartTime || !parsedEndTime || !parsedOldStartTime) {
			return
		}
		const endTotalMinutes = parsedEndTime.hours * 60 + parsedEndTime.minutes
		const startTotalMinutes = parsedStartTime.hours * 60 + parsedStartTime.minutes
		const diff = Math.abs(endTotalMinutes - parsedOldStartTime.hours * 60 - parsedOldStartTime.minutes)
		const newEndTotalMinutes = startTotalMinutes + diff
		let newEndHours = Math.floor(newEndTotalMinutes / 60)
		if (newEndHours > 23) {
			newEndHours = 23
		}
		const newEndMinutes = newEndTotalMinutes % 60
		endTime(timeStringFromParts(newEndHours, newEndMinutes, amPmFormat))
		m.redraw()
	}

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

	let windowCloseUnsubscribe
	const now = Date.now()

	const okAction = (dialog) => {
		const newEvent = createCalendarEvent()
		if (!startDatePicker.date() || !endDatePicker.date()) {
			Dialog.error("timeFormatInvalid_msg")
			return
		}
		let startDate = new Date(neverNull(startDatePicker.date()))
		let endDate = new Date(neverNull(endDatePicker.date()))

		if (allDay()) {
			startDate = getAllDayDateUTC(startDate)
			endDate = getAllDayDateUTC(getStartOfNextDay(endDate))
		} else {
			const parsedStartTime = parseTime(startTime())
			const parsedEndTime = parseTime(endTime())
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

		if (endDate.getTime() <= startDate.getTime()) {
			Dialog.error('startAfterEnd_label')
			return
		}
		newEvent.startTime = startDate
		newEvent.description = notesValue()
		newEvent.summary = summary()
		newEvent.location = locationValue()
		newEvent.endTime = endDate
		const groupRoot = selectedCalendar().groupRoot
		newEvent._ownerGroup = selectedCalendar().groupRoot._id
		newEvent.uid = existingEvent && existingEvent.uid ? existingEvent.uid : generateUid(newEvent, Date.now())
		const repeatFrequency = repeatPickerAttrs.selectedValue()
		if (repeatFrequency == null || eventTooOld) {
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
		const newAlarms = []
		for (let pickerAttrs of alarmPickerAttrs) {
			const alarmValue = pickerAttrs.selectedValue()
			if (alarmValue) {
				const newAlarm = createCalendarAlarm(generateEventElementId(Date.now()), alarmValue)
				newAlarms.push(newAlarm)
			}
		}


		if (existingEvent == null
			|| existingEvent._ownerGroup !== newEvent._ownerGroup // event has been moved to another calendar
			|| newEvent.startTime.getTime() !== existingEvent.startTime.getTime()
			|| !_repeatRulesEqual(newEvent.repeatRule, existingEvent.repeatRule)) {
			// if values of the existing events have changed that influence the alarm time then delete the old event and create a new one.
			createEventId(newEvent, groupRoot)
			worker.createCalendarEvent(newEvent, newAlarms, existingEvent)
		} else {
			worker.updateCalendarEvent(newEvent, newAlarms, existingEvent)
		}


		dialog.close()
	}

	const dialog = Dialog.showActionDialog({
		title: () => lang.get("createEvent_label"),
		child: () => m("", {
			oncreate: vnode => windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {}),
			onremove: vnode => windowCloseUnsubscribe()
		}, [
			m(TextFieldN, {
				label: "title_placeholder",
				value: summary,
				onfocus: (dom, input) => {
					if (client.isMobileDevice() && Date.now() - now < 1000) {
						input.blur()
					}
				},
				disabled: readOnly
			}),
			m(".flex", [
				m(".flex-grow.mr-s", m(startDatePicker)),
				!allDay()
					? m(".time-field", m(TimePicker, {
						value: startTime,
						onselected: onStartTimeSelected,
						amPmFormat: amPmFormat,
						disabled: readOnly
					}))
					: null
			]),
			m(".flex", [
				m(".flex-grow.mr-s", m(endDatePicker)),
				!allDay()
					? m(".time-field", m(TimePicker, {
						value: endTime,
						onselected: endTime,
						amPmFormat: amPmFormat,
						disabled: readOnly
					}))
					: null
			]),
			m(CheckboxN, {
				checked: allDay,
				disabled: readOnly,
				label: () => lang.get("allDay_label")
			}),
			eventTooOld
				? null
				: [
					m(".flex", [
						m(".flex-grow", m(DropDownSelectorN, repeatPickerAttrs)),
						m(".flex-grow.ml-s"
							+ (repeatPickerAttrs.selectedValue() ? "" : ".hidden"), m(DropDownSelectorN, repeatIntervalPickerAttrs)),
					]),
					repeatPickerAttrs.selectedValue()
						? m(".flex", [
							m(".flex-grow", m(DropDownSelectorN, endTypePickerAttrs)),
							m(".flex-grow.ml-s", renderStopConditionValue()),
						])
						: null
				],
			readOnly ? null : m(".flex.col.mt.mb", alarmPickerAttrs.map((attrs) => m(DropDownSelectorN, attrs))),
			m(DropDownSelectorN, ({
				label: "calendar_label",
				items: calendarArray.map((calendarInfo) => {
					return {name: getCalendarName(calendarInfo.groupInfo, calendarInfo.shared), value: calendarInfo}
				}),
				selectedValue: selectedCalendar,
				icon: Icons.Edit,
				disabled: readOnly
			}: DropDownSelectorAttrs<CalendarInfo>)),
			m(TextFieldN, {
				label: "location_label",
				value: locationValue,
				disabled: readOnly
			}),
			m(TextFieldN, {
				label: "description_label",
				value: notesValue,
				type: Type.Area,
				disabled: readOnly
			}),
			existingEvent && !readOnly ? m(".mr-negative-s.float-right.flex-end-on-child", m(ButtonN, {
				label: "delete_action",
				type: ButtonType.Primary,
				click: () => {
					let p = neverNull(existingEvent).repeatRule
						? Dialog.confirm("deleteRepeatingEventConfirmation_msg")
						: Promise.resolve(true)
					p.then((answer) => {
						if (answer) {
							erase(existingEvent).catch(NotFoundError, noOp)
							dialog.close()
						}
					})
				}
			})) : null,
		]),
		okAction: readOnly ? null : (dialog) => requestAnimationFrame(() => okAction(dialog))

	})
}

function createCalendarAlarm(identifier: string, trigger: string): AlarmInfo {
	const calendarAlarmInfo = createAlarmInfo()
	calendarAlarmInfo.alarmIdentifier = identifier
	calendarAlarmInfo.trigger = trigger
	return calendarAlarmInfo
}


function createRepeatingDatePicker(disabled: boolean): DropDownSelectorAttrs<?RepeatPeriodEnum> {
	const repeatValues = [
		{name: lang.get("calendarRepeatIntervalNoRepeat_label"), value: null},
		{name: lang.get("calendarRepeatIntervalDaily_label"), value: RepeatPeriod.DAILY},
		{name: lang.get("calendarRepeatIntervalWeekly_label"), value: RepeatPeriod.WEEKLY},
		{name: lang.get("calendarRepeatIntervalMonthly_label"), value: RepeatPeriod.MONTHLY},
		{name: lang.get("calendarRepeatIntervalAnnually_label"), value: RepeatPeriod.ANNUALLY}
	]

	return {
		label: "calendarRepeating_label",
		items: repeatValues,
		selectedValue: stream(repeatValues[0].value),
		icon: Icons.Edit,
		disabled
	}
}

const intervalValues = numberRange(1, 256).map(n => {
	return {name: String(n), value: n}
})


function createIntervalPicker(disabled: boolean): DropDownSelectorAttrs<number> {
	return {
		label: "interval_title",
		items: intervalValues,
		selectedValue: stream(intervalValues[0].value),
		icon: Icons.Edit,
		disabled
	}
}

function createEndTypePicker(disabled: boolean): DropDownSelectorAttrs<EndTypeEnum> {
	const stopConditionValues = [
		{name: lang.get("calendarRepeatStopConditionNever_label"), value: EndType.Never},
		{name: lang.get("calendarRepeatStopConditionOccurrences_label"), value: EndType.Count},
		{name: lang.get("calendarRepeatStopConditionDate_label"), value: EndType.UntilDate}
	]

	return {
		label: () => lang.get("calendarRepeatStopCondition_label"),
		items: stopConditionValues,
		selectedValue: stream(stopConditionValues[0].value),
		icon: Icons.Edit,
		disabled
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





