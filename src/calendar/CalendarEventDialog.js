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

import {downcast, neverNull, noOp} from "../api/common/utils/Utils"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {EndTypeEnum, RepeatPeriodEnum} from "../api/common/TutanotaConstants"
import {EndType, RepeatPeriod, TimeFormat} from "../api/common/TutanotaConstants"
import {last, lastThrow, numberRange, remove} from "../api/common/utils/ArrayUtils"
import {incrementByRepeatPeriod} from "./CalendarModel"
import {DateTime} from "luxon"
import {createAlarmInfo} from "../api/entities/sys/AlarmInfo"
import {isSameId, listIdPart} from "../api/common/EntityFunctions"
import {logins} from "../api/main/LoginController"
import {UserAlarmInfoTypeRef} from "../api/entities/sys/UserAlarmInfo"
import {createRepeatRuleWithValues, getAllDayDateUTC, getCalendarName, parseTime, timeString, timeStringFromParts} from "./CalendarUtils"
import {generateEventElementId, getEventEnd, getEventStart, isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import {worker} from "../api/main/WorkerClient"
import {NotFoundError} from "../api/common/error/RestError"
import {TimePicker} from "../gui/base/TimePicker"
import {windowFacade} from "../misc/WindowFacade"
import {client} from "../misc/ClientDetector"

// allDay event consists of full UTC days. It always starts at 00:00:00.00 of its start day in UTC and ends at
// 0 of the next day in UTC. Full day event time is relative to the local timezone. So startTime and endTime of
// allDay event just points us to the correct date.
// e.g. there's an allDay event in Europe/Berlin at 2nd of may. We encode it as:
// {startTime: new Date(Date.UTC(2019, 04, 2, 0, 0, 0, 0)), {endTime: new Date(Date.UTC(2019, 04, 3, 0, 0, 0, 0))}}
// We check the condition with time == 0 and take a UTC date (which is [2-3) so full day on the 2nd of May). We
// interpret it as full day in Europe/Berlin, not in the UTC.
export function showCalendarEventDialog(date: Date, calendars: Map<Id, CalendarInfo>, existingEvent ?: CalendarEvent) {
	const summary = stream("")
	const calendarArray = Array.from(calendars.values())
	const selectedCalendar = stream(calendarArray[0])
	const startDatePicker = new DatePicker("dateFrom_label", "emptyString_msg", true)
	startDatePicker.setDate(date)
	const endDatePicker = new DatePicker("dateTo_label", "emptyString_msg", true)
	const amPmFormat = logins.getUserController().userSettingsGroupRoot.timeFormat === TimeFormat.TWELVE_HOURS
	const startTime = stream(timeString(date, amPmFormat))
	const endTime = stream()
	const allDay = stream(false)
	const locationValue = stream("")
	const notesValue = stream("")

	const repeatPickerAttrs = createRepeatingDatePicker()
	const repeatIntervalPickerAttrs = createIntervalPicker()
	const endTypePickerAttrs = createEndTypePicker()
	const repeatEndDatePicker = new DatePicker("emptyString_msg", "emptyString_msg", true)
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

	let loadedUserAlarmInfo: ?UserAlarmInfo = null
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
					lastThrow(alarmPickerAttrs).selectedValue(downcast(userAlarmInfo.alarmInfo.trigger))
					m.redraw()
				})
			}
		}

	} else {
		const endTimeDate = new Date(date)
		endTimeDate.setHours(endTimeDate.getHours() + 1)
		endDatePicker.setDate(date)
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


	function onStartTimeSelected(value) {
		startTime(value)
		let startDate = neverNull(startDatePicker.date())
		let endDate = neverNull(endDatePicker.date())
		if (startDate.getTime() !== endDate.getTime()) {
			return
		}
		const parsedStartTime = parseTime(startTime())
		const parsedEndTime = parseTime(endTime())
		if (!parsedStartTime || !parsedEndTime) {
			return
		}
		if (parsedEndTime.hours * 60 + parsedEndTime.minutes <= parsedStartTime.hours * 60 + parsedStartTime.minutes && parsedStartTime.hours < 23) {
			endTime(timeStringFromParts(parsedStartTime.hours + 1, parsedEndTime.minutes, amPmFormat))
			m.redraw()
		}
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
				}
			}),
			m(".flex", [
				m(".flex-grow.mr-s", m(startDatePicker)),
				!allDay()
					? m(".time-field", m(TimePicker, {
						value: startTime,
						onselected: onStartTimeSelected,
						amPmFormat: amPmFormat,
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
			m(".flex.col.mt.mb", alarmPickerAttrs.map((attrs) => m(DropDownSelectorN, attrs))),
			m(DropDownSelectorN, ({
				label: "calendar_label",
				items: calendarArray.map((calendarInfo) => {
					return {name: getCalendarName(calendarInfo.groupInfo.name), value: calendarInfo}
				}),
				selectedValue: selectedCalendar,
				icon: Icons.Edit,
			}: DropDownSelectorAttrs<CalendarInfo>)),
			m(TextFieldN, {
				label: "location_label",
				value: locationValue
			}),
			m(TextFieldN, {
				label: "description_label",
				value: notesValue,
				type: Type.Area
			}),
			existingEvent ? m(".mr-negative-s.float-right.flex-end-on-child", m(ButtonN, {
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
		okAction: () => {
			const newEvent = createCalendarEvent()
			let startDate = neverNull(startDatePicker.date())
			const parsedStartTime = parseTime(startTime())
			const parsedEndTime = parseTime(endTime())
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

			if (endDate.getTime() < startDate.getTime()) {
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
			const newAlarms = []
			for (let pickerAttrs of alarmPickerAttrs) {
				const alarmValue = pickerAttrs.selectedValue()
				if (alarmValue) {
					const newAlarm = createCalendarAlarm(generateEventElementId(Date.now()), alarmValue)
					newAlarms.push(newAlarm)
				}
			}
			worker.createCalendarEvent(groupRoot, newEvent, newAlarms, existingEvent)

			dialog.close()
		}
	})
}

function createCalendarAlarm(identifier: string, trigger: string): AlarmInfo {
	const calendarAlarmInfo = createAlarmInfo()
	calendarAlarmInfo.alarmIdentifier = identifier
	calendarAlarmInfo.trigger = trigger
	return calendarAlarmInfo
}


function createRepeatingDatePicker(): DropDownSelectorAttrs<?RepeatPeriodEnum> {
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

function createEndTypePicker(): DropDownSelectorAttrs<EndTypeEnum> {
	const stopConditionValues = [
		{name: lang.get("calendarRepeatStopConditionNever_label"), value: EndType.Never},
		{name: lang.get("calendarRepeatStopConditionOccurrences_label"), value: EndType.Count},
		{name: lang.get("calendarRepeatStopConditionDate_label"), value: EndType.UntilDate}
	]

	return {
		label: () => lang.get("calendarRepeatStopCondition_label"),
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





