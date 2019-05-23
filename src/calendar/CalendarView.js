// @flow
import m from "mithril"
import {load, loadAll, setup} from "../api/main/Entity"
import stream from "mithril/stream/stream.js"
import type {CurrentView} from "../gui/base/Header"
import {ColumnType, ViewColumn} from "../gui/base/ViewColumn"
import {lang} from "../misc/LanguageViewModel"
import {ViewSlider} from "../gui/base/ViewSlider"
import {Button, ButtonType} from "../gui/base/Button"
import {Icons} from "../gui/base/icons/Icons"
import {DatePicker, VisualDatePicker} from "../gui/base/DatePicker"
import {theme} from "../gui/theme"
import type {CalendarDay} from "../api/common/utils/DateUtils"
import {getCalendarMonth, getStartOfDay, getStartOfNextDay, incrementDate} from "../api/common/utils/DateUtils"
import {Dialog} from "../gui/base/Dialog"
import {TextFieldN} from "../gui/base/TextFieldN"
import {CalendarEventTypeRef, createCalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import {CalendarGroupRootTypeRef} from "../api/entities/tutanota/CalendarGroupRoot"
import {logins} from "../api/main/LoginController"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {getListId, isSameId, stringToCustomId} from "../api/common/EntityFunctions"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {OperationType} from "../api/common/TutanotaConstants"
import {locator} from "../api/main/MainLocator"
import {neverNull} from "../api/common/utils/Utils"
import {getFromMap} from "../api/common/utils/MapUtils"

type CalendarInfo = {
	groupRoot: CalendarGroupRoot,
	shortEvents: Array<CalendarEvent>,
	longEvents: Array<CalendarEvent>,
}

export class CalendarView implements CurrentView {

	sidebarColumn: ViewColumn
	contentColumn: ViewColumn
	viewSlider: ViewSlider
	newAction: Button
	selectedDate: Stream<Date>
	_calendarEvents: Promise<Map<Id, CalendarInfo>>
	_eventsForDays: Map<number, Array<CalendarEvent>>

	constructor() {
		this._eventsForDays = new Map()
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
		}, ColumnType.Background, 500, 2000, () => {
			return "monthly"
		})

		this.viewSlider = new ViewSlider([this.sidebarColumn, this.contentColumn], "CalendarView")
		this.newAction = new Button('newEvent_action', () => this._newEvent(), () => Icons.Add)
			.setType(ButtonType.Floating)

		this._load()


		locator.eventController.addEntityListener((updates) => {
			this.entityEventReceived(updates)
		})
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
		const eventsForDay = getFromMap(this._eventsForDays, d.date.getTime(), () => [])
		return m(".flex-grow.calendar-day", [
			String(d.day),
			eventsForDay.map((e) => m("", e.summary))
		])
	}

	updateUrl() {

	}

	_newEvent() {
		const summary = stream("")
		this._calendarEvents.then(calendarEvents => {
			const calendars = Array.from(calendarEvents.values())
			const selectedCalendar = stream(calendars[0])
			const startDatePicker = new DatePicker("dateFrom_label", "emptyString_msg", true)
			const endDatePicker = new DatePicker("dateTo_label", "emptyString_msg", true)
			const dialog = Dialog.showActionDialog({
				title: () => "NEWWWWW EVVVVEEENT",
				child: () => [
					m(TextFieldN, {
						label: () => "EVENT SUMMARY",
						value: summary
					}),
					m(startDatePicker),
					m(endDatePicker),
					m(DropDownSelectorN, {
						label: "calendar_label",
						items: calendars.map((calendarInfo) => {
							return {name: calendarInfo.groupRoot.name || lang.get("privateCalendar_label"), value: calendarInfo}
						}),
						selectedValue: selectedCalendar,
						icon: Icons.Edit,
					})
				],
				okAction: () => {
					const calendarEvent = createCalendarEvent()
					calendarEvent.startTime = startDatePicker.date() || new Date()
					const endDate = getStartOfNextDay(endDatePicker.date() || getStartOfNextDay(calendarEvent.startTime))
					calendarEvent.description = ""
					calendarEvent.summary = summary()
					calendarEvent.duration = String(endDate.getTime() - calendarEvent.startTime.getTime())
					const groupRoot = selectedCalendar().groupRoot
					calendarEvent._ownerGroup = selectedCalendar().groupRoot._id
					calendarEvent._id = [groupRoot.shortEvents, stringToCustomId(String(calendarEvent.startTime.getTime()))]
					setup(groupRoot.shortEvents, calendarEvent)

					dialog.close()
				}
			})

		})

	}

	_load() {
		const calendarEvents = new Map()
		const calendarMemberships = logins.getUserController().getCalendarMemberships()
		this._calendarEvents = Promise.map(calendarMemberships, (membership) => {
			return load(CalendarGroupRootTypeRef, membership.group)
				.then((root) => Promise.all([
					loadAll(CalendarEventTypeRef, root.shortEvents, null),
					loadAll(CalendarEventTypeRef, root.longEvents, null),
					root
				])).then(([shortEvents, longEvents, groupRoot]) => {
					calendarEvents.set(membership.group, {
							groupRoot,
							shortEvents,
							longEvents
						}
					)
				})
		}).return(calendarEvents)
	}


	entityEventReceived<T>(updates: $ReadOnlyArray<EntityUpdateData>): void {
		this._calendarEvents.then((calendarEvents) => {
			updates.forEach(update => {
				if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
					if (update.operation === OperationType.CREATE) {
						load(CalendarEventTypeRef, [update.instanceListId, update.instanceId])
							.then((event) => {
								this.addOrUpdateEvent(calendarEvents.get(neverNull(event._ownerGroup)), event)
							})
					} else if (update.operation == OperationType.DELETE) {

					} else if (update.operation == OperationType.UPDATE) {

					}
					m.redraw()
				}
			})
		})

	}

	addOrUpdateEvent(calendarInfo: ?CalendarInfo, event: CalendarEvent) {
		if (calendarInfo) {
			const eventListId = getListId(event);
			if (isSameId(calendarInfo.groupRoot.shortEvents, eventListId)) {
				const calculationDate = getStartOfDay(event.startTime)
				const endDate = new Date(event.startTime.getTime() + Number(event.duration));
				while (calculationDate.getTime() < endDate.getTime()) {
					getFromMap(this._eventsForDays, calculationDate.getTime(), () => []).push(event)
					incrementDate(calculationDate, 1)
				}
				calendarInfo.shortEvents.push(event)
			} else if (isSameId(calendarInfo.groupRoot.longEvents, eventListId)) {
				calendarInfo.longEvents.push(event)
			}
		}
	}


}




