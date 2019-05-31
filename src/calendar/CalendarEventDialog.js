//@flow
import {getStartOfDay, getStartOfNextDay, incrementDate} from "../api/common/utils/DateUtils"
import stream from "mithril/stream/stream.js"
import {DatePicker} from "../gui/base/DatePicker"
import {Dialog} from "../gui/base/Dialog"
import type {CalendarInfo} from "./CalendarView"
import m from "mithril"
import {TextFieldN} from "../gui/base/TextFieldN"
import {CheckboxN} from "../gui/base/CheckboxN"
import {lang} from "../misc/LanguageViewModel"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {Icons} from "../gui/base/icons/Icons"
import {createCalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import {erase, setup} from "../api/main/Entity"
import {generateEventElementId, getAllDayDateUTC, getEventEnd, getEventStart, isAllDayEvent, isLongEvent, parseTimeTo, timeString} from "./CalendarUtils"
import {downcast, neverNull} from "../api/common/utils/Utils"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {createRepeatRule} from "../api/entities/tutanota/RepeatRule"
import type {EndTypeEnum, RepeatPeriodEnum} from "../api/common/TutanotaConstants"
import {EndType, RepeatPeriod} from "../api/common/TutanotaConstants"
import {numberRange} from "../api/common/utils/ArrayUtils"

// allDay event consists of full UTC days. It always starts at 00:00:00.00 of its start day in UTC and ends at
// 0 of the next day in UTC. Full day event time is relative to the local timezone. So startTime and endTime of
// allDay event just points us to the correct date.
// e.g. there's an allDay event in Europe/Berlin at 2nd of may. We encode it as:
// {startTime: new Date(Date.UTC(2019, 04, 2, 0, 0, 0, 0)), {endTime: new Date(Date.UTC(2019, 04, 3, 0, 0, 0, 0))}}
// We check the condition with time == 0 and take a UTC date (which is [2-3) so full day on the 2nd of May). We
// interpret it as full day in Europe/Berlin, not in the UTC.
export function showCalendarEventDialog(date: Date, calendars: Map<Id, CalendarInfo>, event?: CalendarEvent) {
	const summary = stream(event && event.summary || "")
	const calendarArray = Array.from(calendars.values())
	const selectedCalendar = stream(event && calendars.get(neverNull(event._ownerGroup)) || calendarArray[0])
	const startDatePicker = new DatePicker("dateFrom_label", "emptyString_msg", true)
	startDatePicker.setDate(getStartOfDay(date))
	const endDatePicker = new DatePicker("dateTo_label", "emptyString_msg", true)
	const eventIsAllDay = event && isAllDayEvent(event)
	let endTimeDate
	if (event) {
		if (eventIsAllDay) {
			endDatePicker.setDate(incrementDate(getEventEnd(event), -1))
		} else {
			endDatePicker.setDate(getStartOfDay(getEventEnd(event)))
		}
		endTimeDate = getEventEnd(event)
	} else {
		endTimeDate = new Date()
		endTimeDate.setHours(endTimeDate.getHours() + 1)
		endDatePicker.setDate(date)
	}

	const startTime = stream(timeString(event && getEventStart(event) || new Date()))
	const endTime = stream(timeString(endTimeDate))
	const allDay = stream(eventIsAllDay)

	const repeatPickerAttrs = repeatingDatePicker()
	if (event && event.repeatRule) {
		repeatPickerAttrs.selectedValue(downcast(event.repeatRule.frequency))
	} else {
		repeatPickerAttrs.selectedValue(null)
	}

	const repeatIntervalPickerAttrs = intervalPicker()
	const stopConditionPickerAttrs = stopConditionPicker()

	const endOnDatePicker = new DatePicker("emptyString_msg", "emptyString_msg", true)
	const endCountPickerAttrs = endCountPicker()

	function renderStopConditiionValue(): Children {
		if (repeatPickerAttrs.selectedValue() == null || stopConditionPickerAttrs.selectedValue() === EndType.Never) {
			return null
		} else if (stopConditionPickerAttrs.selectedValue() === EndType.Count) {
			return m(DropDownSelectorN, endCountPickerAttrs)
		} else if (stopConditionPickerAttrs.selectedValue() === EndType.UntilDate) {
			return m(endOnDatePicker)
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
					m(".flex-grow", m(DropDownSelectorN, stopConditionPickerAttrs)),
					m(".flex-grow.ml-s", renderStopConditiionValue()),
				])
				: null,
			m(DropDownSelectorN, {
				label: "calendar_label",
				items: calendarArray.map((calendarInfo) => {
					return {name: calendarInfo.groupRoot.name || lang.get("privateCalendar_label"), value: calendarInfo}
				}),
				selectedValue: selectedCalendar,
				icon: Icons.Edit,
			}),
			event ? m(".mr-negative-s.float-right.flex-end-on-child", m(ButtonN, {
				label: "delete_action",
				type: ButtonType.Primary,
				click: () => {
					erase(event)
					dialog.close()
				}
			})) : null
		],
		okAction: () => {
			const calendarEvent = createCalendarEvent()
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


			calendarEvent.startTime = startDate
			calendarEvent.description = ""
			calendarEvent.summary = summary()
			calendarEvent.endTime = endDate
			const groupRoot = selectedCalendar().groupRoot
			calendarEvent._ownerGroup = selectedCalendar().groupRoot._id
			const repeatFrequency = repeatPickerAttrs.selectedValue()
			if (repeatFrequency == null) {
				calendarEvent.repeatRule = null
			} else {
				const interval = repeatIntervalPickerAttrs.selectedValue()
				const repeatRule = createRepeatRule()
				repeatRule.frequency = repeatFrequency
				repeatRule.interval = String(interval)
				calendarEvent.repeatRule = repeatRule

				const stopType = neverNull(stopConditionPickerAttrs.selectedValue())
				repeatRule.endType = stopType
				if (stopType === EndType.Count) {
					let count = stopConditionPickerAttrs.selectedValue()
					if (isNaN(count) || Number(count) < 1) {
						repeatRule.endType = EndType.Never
					} else {
						repeatRule.endValue = count
					}
				} else if (stopType === EndType.UntilDate) {
					const repeatEndDate = endDatePicker.date()
					if (repeatEndDate == null) {
						repeatRule.endType = EndType.Never
					} else {
						// Encode it as UTC date, like for full day events
						repeatRule.endValue = String(getAllDayDateUTC(repeatEndDate).getTime())
					}

				}
			}
			let p = event ? erase(event) : Promise.resolve()


			const listId = calendarEvent.repeatRule || isLongEvent(calendarEvent) ? groupRoot.longEvents : groupRoot.shortEvents
			calendarEvent._id = [listId, generateEventElementId(calendarEvent.startTime.getTime())]
			p.then(() => setup(listId, calendarEvent))

			dialog.close()
		}
	})
}


const repeatValues = [
	{name: "Do not repeat", value: null},
	{name: "Repeat daily", value: RepeatPeriod.DAILY},
	{name: "Weekly", value: RepeatPeriod.WEEKLY},
	{name: "Monthly", value: RepeatPeriod.MONTHLY},
	{name: "Annually", value: RepeatPeriod.ANNUALLY}
]

function repeatingDatePicker(): DropDownSelectorAttrs<?RepeatPeriodEnum> {
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


function intervalPicker(): DropDownSelectorAttrs<number> {
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

function stopConditionPicker(): DropDownSelectorAttrs<EndTypeEnum> {
	return {
		label: () => "Ends",
		items: stopConditionValues,
		selectedValue: stream(stopConditionValues[0].value),
		icon: Icons.Edit
	}
}

export function endCountPicker(): DropDownSelectorAttrs<number> {
	return {
		label: "emptyString_msg",
		items: intervalValues,
		selectedValue: stream(intervalValues[0].value),
		icon: Icons.Edit,
	}
}