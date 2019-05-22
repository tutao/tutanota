// @flow
import m from "mithril"
import {load, loadAll} from "../api/main/Entity"
import stream from "mithril/stream/stream.js"
import type {CurrentView} from "../gui/base/Header"
import {ColumnType, ViewColumn} from "../gui/base/ViewColumn"
import {lang} from "../misc/LanguageViewModel"
import {ViewSlider} from "../gui/base/ViewSlider"
import {Button, ButtonType} from "../gui/base/Button"
import {Icons} from "../gui/base/icons/Icons"
import {VisualDatePicker} from "../gui/base/DatePicker"
import {theme} from "../gui/theme"
import type {CalendarDay} from "../api/common/utils/DateUtils"
import {getCalendarMonth} from "../api/common/utils/DateUtils"
import {Dialog} from "../gui/base/Dialog"
import {TextFieldN} from "../gui/base/TextFieldN"
import {CalendarEventTypeRef, createCalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import {CalendarGroupRootTypeRef} from "../api/entities/tutanota/CalendarGroupRoot"
import {logins} from "../api/main/LoginController"

export class CalendarView implements CurrentView {

	sidebarColumn: ViewColumn
	contentColumn: ViewColumn
	viewSlider: ViewSlider
	newAction: Button
	selectedDate: Stream<Date>
	_calendarGroupRoot: Promise<CalendarGroupRoot>
	_events: Array<CalendarEvent>

	constructor() {
		this._events = []

		this.selectedDate = stream(new Date())
		this.sidebarColumn = new ViewColumn({
			view: () => m(".folder-column.scroll.overflow-x-hidden.flex.col.plr-l", [
				m(VisualDatePicker, {
					onDateSelected: this.selectedDate,
					selectedDate: this.selectedDate(),
					wide: false
				}),
				m(".folder-row.flex-space-between", [
					m("small.b.pt-s.align-self-center.ml-negative-xs",
						{style: {color: theme.navigation_button}},
						lang.get("yourCalendars_label").toLocaleUpperCase()),
				]),
				m(".folders",
					m(".folder-row.flex-start",
						m(".flex.flex-grow..center-vertically.button-height", [
							m(".calendar-checkbox", {
								style: {"border-color": "blue"}
							}),
							m(".pl-m", lang.get("privateCalendar_label"))
						])))
			])
		}, ColumnType.Foreground, 200, 300, () => lang.get("folderTitle_label"))


		this.contentColumn = new ViewColumn({
			view: () => this._renderMonth()
		}, ColumnType.Background, 300, 2000, () => {
			return "monthly"
		})

		this.viewSlider = new ViewSlider([this.sidebarColumn, this.contentColumn], "CalendarView")
		this.newAction = new Button('newEvent_action', () => this._newEvent(), () => Icons.Add)
			.setType(ButtonType.Floating)

		this._load()
	}


	view() {
		return m(".main-view", [
			m(this.viewSlider),
			m(this.newAction)
		])
	}

	_renderMonth(): Children {
		const {weekdays, weeks} = getCalendarMonth(this.selectedDate())
		return m(".fill-absolute.flex.col",
			[
				m(".flex.pt-s.pb-s", {
					style: {'border-bottom': '1px solid lightgrey'}
				}, weekdays.map((wd) => m(".flex-grow", m(".b.small.pl-s", wd))))
			].concat(weeks.map((week) => {
				return m(".flex.flex-grow", week.map(d => this._renderDay(d)))
			})))
	}

	_renderDay(d: CalendarDay): Children {
		return m(".flex-grow.calendar-day", [
			String(d.day),
			this._events.map((e) => m("", e.summary))
		])
	}

	updateUrl() {

	}

	_newEvent() {
		const summary = stream("")
		const dialog = Dialog.showActionDialog({
			title: () => "NEWWWWW EVVVVEEENT",
			child: () => m(TextFieldN, {
				label: () => "EVENT SUMMARY",
				value: summary
			}),
			okAction: () => {
				const calendarEvent = createCalendarEvent()
				calendarEvent.startTime = new Date()
				calendarEvent.description = ""
				calendarEvent.summary = summary()
				calendarEvent.duration = String(60 * 1000 * 1000)

				dialog.close()
			}
		})
	}

	_load() {
		const calendarMemberships = logins.getUserController().getCalendarMemberships()
		calendarMemberships.map(({group}) => {
			this._calendarGroupRoot = load(CalendarGroupRootTypeRef, group)
			this._calendarGroupRoot
			    .then((root) => loadAll(CalendarEventTypeRef, root.shortEvents, null))
			    .then((shortEvents) => {
				    this._events = shortEvents
			    })
		})
	}
}




