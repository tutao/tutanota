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
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {Icons} from "../gui/base/icons/Icons"
import {createCalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import {erase, setup} from "../api/main/Entity"
import {getEventEnd, isAlllDayEvent, makeEventElementId, parseTimeTo, timeString} from "./CalendarUtils"
import {neverNull} from "../api/common/utils/Utils"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"

export function showCalendarEventDialog(date: Date, calendars: Map<Id, CalendarInfo>, event?: CalendarEvent) {
	const summary = stream(event && event.summary || "")
	const calendarArray = Array.from(calendars.values())
	const selectedCalendar = stream(event && calendars.get(neverNull(event._ownerGroup)) || calendarArray[0])
	const startDatePicker = new DatePicker("dateFrom_label", "emptyString_msg", true)
	startDatePicker.setDate(getStartOfDay(date))
	const endDatePicker = new DatePicker("dateTo_label", "emptyString_msg", true)
	const eventIsAllDay = event && isAlllDayEvent(event)
	if (event) {
		if (eventIsAllDay) {
			endDatePicker.setDate(incrementDate(getEventEnd(event), -1))
		} else {
			endDatePicker.setDate(getStartOfDay(getEventEnd(event)))
		}
	} else {
		endDatePicker.setDate(date)
	}
	const startTime = stream(timeString(date))
	const endTimeDate = new Date(date)
	endTimeDate.setHours(endTimeDate.getHours() + 1)

	const endTime = stream(timeString(endTimeDate))
	const allDay = stream(eventIsAllDay)
	const dialog = Dialog.showActionDialog({
		title: () => lang.get("createEvent_title"),
		child: () => [
			m(TextFieldN, {
				label: "title_placeholder",
				value: summary
			}),
			m(startDatePicker),
			m(endDatePicker),
			m(CheckboxN, {
				checked: allDay,
				label: () => lang.get("allDay_label"),
			}),
			allDay()
				? null
				: [
					m(TextFieldN, {
						label: "emptyString_msg",
						value: startTime
					}),
					m(TextFieldN, {
						label: "emptyString_msg",
						value: endTime
					})
				],
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
			const startDate = neverNull(startDatePicker.date())
			const parsedStartTime = parseTimeTo(startTime())
			const parsedEndTime = parseTimeTo(endTime())
			if (!allDay() && (!parsedStartTime || !parsedEndTime)) {
				Dialog.error("timeFormatInvalid_msg")
				return
			}
			if (!allDay() && parsedStartTime) {
				startDate.setHours(parsedStartTime.hours)
				startDate.setMinutes(parsedStartTime.minutes)
			}
			let endDate = endDatePicker.date() || calendarEvent.startTime
			// End date is never actually included in the event. For the whole day event the next day
			// is the boundary. For the timed one the end time is the boundary.
			if (!allDay() && parsedEndTime) {
				endDate.setHours(parsedEndTime.hours)
				endDate.setMinutes(parsedEndTime.minutes)
			} else {
				endDate = getStartOfNextDay(endDate)
			}

			calendarEvent.startTime = startDate

			calendarEvent.description = ""
			calendarEvent.summary = summary()
			calendarEvent.duration = String(endDate.getTime() - calendarEvent.startTime.getTime())
			const groupRoot = selectedCalendar().groupRoot
			calendarEvent._ownerGroup = selectedCalendar().groupRoot._id
			calendarEvent._id = [groupRoot.shortEvents, makeEventElementId(calendarEvent.startTime.getTime())]

			let p = event ? erase(event) : Promise.resolve()
			p.then(() => setup(groupRoot.shortEvents, calendarEvent))

			dialog.close()
		}
	})
}





