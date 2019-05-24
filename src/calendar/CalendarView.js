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
import {getCalendarMonth, getStartOfDay, incrementDate} from "../api/common/utils/DateUtils"
import {CalendarEventTypeRef} from "../api/entities/tutanota/CalendarEvent"
import {CalendarGroupRootTypeRef} from "../api/entities/tutanota/CalendarGroupRoot"
import {logins} from "../api/main/LoginController"
import {getListId, isSameId} from "../api/common/EntityFunctions"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {OperationType} from "../api/common/TutanotaConstants"
import {locator} from "../api/main/MainLocator"
import {neverNull} from "../api/common/utils/Utils"
import {getFromMap} from "../api/common/utils/MapUtils"
import {findAndRemove} from "../api/common/utils/ArrayUtils"
import {px, size} from "../gui/size"
import {modal} from "../gui/base/Modal"
import {animations, opacity, transform} from "../gui/animation/Animations"
import {ease} from "../gui/animation/Easing"
import {eventEndsAfterDay, eventStartsBefore, isAlllDayEvent, timeString} from "./CalendarUtils"
import {showCalendarEventDialog} from "./CalendarEventDialog"

export type CalendarInfo = {
	groupRoot: CalendarGroupRoot,
	shortEvents: Array<CalendarEvent>,
	longEvents: Array<CalendarEvent>,
}

const weekDaysHeight = 30
const defaultCalendarColor = "2196f3"

export class CalendarView implements CurrentView {

	sidebarColumn: ViewColumn
	contentColumn: ViewColumn
	viewSlider: ViewSlider
	newAction: Button
	selectedDate: Stream<Date>
	_calendarInfos: Promise<Map<Id, CalendarInfo>>
	_eventsForDays: Map<number, Array<CalendarEvent>>
	_monthDom: ?HTMLElement

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
								style: {"border-color": "#" + defaultCalendarColor}
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

		this._calendarInfos = this._load()
		this._calendarInfos.then(() => m.redraw())


		locator.eventController.addEntityListener((updates) => {
			this.entityEventReceived(updates)
		})
	}


	_newEvent(date?: Date) {
		this._calendarInfos.then(calendars => showCalendarEventDialog(date || new Date(), calendars))
	}

	view() {
		return m(".main-view", [
			m(this.viewSlider),
			m(this.newAction)
		])
	}

	_renderMonth(): Children {
		const {weekdays, weeks} = getCalendarMonth(this.selectedDate())
		return m(".fill-absolute.flex.col", {
				oncreate: (vnode) => {
					this._monthDom = vnode.dom
				}
			},
			[
				m(".flex.pt-s.pb-s", {
					style: {
						'border-bottom': '1px solid lightgrey',
						height: px(weekDaysHeight)
					}
				}, weekdays.map((wd) => m(".flex-grow", m(".b.small.pl-s", wd))))
			].concat(weeks.map((week) => {
				return m(".flex.flex-grow", week.map(d => this._renderDay(d)))
			})))
	}

	_renderDay(d: CalendarDay): Children {
		const eventsForDay = getFromMap(this._eventsForDays, d.date.getTime(), () => [])
		const weekHeight = this._getHeightForWeek()
		const canDisplay = weekHeight / size.calendar_line_height
		const sortedEvents = eventsForDay.slice().sort((l, r) => l.startTime.getTime() - r.startTime.getTime())
		const eventsToDisplay = sortedEvents.slice(0, canDisplay - 1)
		const notShown = eventsForDay.length - eventsToDisplay.length
		return m(".calendar-day-wrapper.flex-grow.rel", {
			onclick: () => this._newEvent(d.date),
		}, [
			m(".day-with-border.calendar-day.fill-absolute", m(".pl-s.pr-s.pt-s", String(d.day))),
			m(".day-with-events.events.pt-l.rel", [
				eventsToDisplay.map((e) => this._renderEvent(e, d.date)),
				notShown > 0
					? m("", {
						onclick: (e) => {
							this._showFullDayEvents(e, d, eventsForDay)
							e.stopPropagation()
						}
					}, "+" + notShown)
					: null
			])
		])
	}

	_showFullDayEvents(e: any, d: CalendarDay, events: Array<CalendarEvent>) {
		const animtaionOpts = {duration: 100, easing: ease.in}
		let dom
		const dayModal = {
			oncreate: (vnode) => {
				dom = vnode.dom
				animations.add(dom, [transform('scale', 0.5, 1)], animtaionOpts)
			},
			view: (vnode) => {
				return m(".content-bg.abs", {
					style: {
						"max-width": "400px",
						"min-width": "300px",
						top: px(e.clientY),
						left: px(e.clientX),
						padding: px(size.hpad_small),
					}
				}, [
					m(".center.b", String(d.day)),
					events.map((e) => this._renderEvent(e, d.date)),
				])
			},
			hideAnimation: () => dom && animations.add(dom, [opacity(1, 0, true), transform('scale', 1, 0.5)], animtaionOpts),
			backgroundClick: () => {modal.remove(dayModal)},
			onClose: () => {modal.remove(dayModal)},
			shortcuts: () => []
		}
		modal.displayUnique(dayModal)
	}

	_renderEvent(event: CalendarEvent, date: Date): Children {
		let color = defaultCalendarColor
		return m(".calendar-event.small"
			+ (eventStartsBefore(date, event) ? ".event-continues-left" : "")
			+ (eventEndsAfterDay(date, event) ? ".event-continues-right" : ""), {
			style: {
				background: "#" + color,
				color: colourIsLight(color) ? "black" : "white",
			},
			onclick: (e) => {
				e.stopPropagation()
				this._calendarInfos.then((calendarInfos) => {
					showCalendarEventDialog(event.startTime, calendarInfos, event)
				})
			}
		}, (date.getDay() === 0 || !eventStartsBefore(date, event)) ? this._getEventText(event) : "")
	}

	_getEventText(event: CalendarEvent): string {
		if (isAlllDayEvent(event)) {
			return event.summary
		} else {
			return timeString(event.startTime) + " " + event.summary
		}
	}

	_getHeightForWeek(): number {
		if (!this._monthDom) {
			return 1
		}
		const monthDomHeight = this._monthDom.scrollHeight
		const weeksHeight = monthDomHeight - weekDaysHeight
		return weeksHeight / 6
	}

	updateUrl() {

	}


	_load(): Promise<Map<Id, CalendarInfo>> {
		const calendarInfos = new Map()
		const calendarMemberships = logins.getUserController().getCalendarMemberships()
		return Promise.map(calendarMemberships, (membership) => {
			return load(CalendarGroupRootTypeRef, membership.group)
				.then((root) => Promise.all([
					loadAll(CalendarEventTypeRef, root.shortEvents, null),
					loadAll(CalendarEventTypeRef, root.longEvents, null),
					root
				])).then(([shortEvents, longEvents, groupRoot]) => {
					shortEvents.forEach((e) => this._addDaysForEvent(e))
					calendarInfos.set(membership.group, {
							groupRoot,
							shortEvents,
							longEvents
						}
					)
				})
		}).return(calendarInfos)
	}


	entityEventReceived<T>(updates: $ReadOnlyArray<EntityUpdateData>): void {
		this._calendarInfos.then((calendarEvents) => {
			updates.forEach(update => {
				if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
					if (update.operation === OperationType.CREATE) {
						load(CalendarEventTypeRef, [update.instanceListId, update.instanceId])
							.then((event) => this.addOrUpdateEvent(calendarEvents.get(neverNull(event._ownerGroup)), event))
					} else if (update.operation === OperationType.DELETE) {
						this._removeDaysForEvent([update.instanceListId, update.instanceId])
					} else if (update.operation === OperationType.UPDATE) {

					}
				}
			})
			m.redraw()
		})
	}

	addOrUpdateEvent(calendarInfo: ?CalendarInfo, event: CalendarEvent) {
		if (calendarInfo) {
			const eventListId = getListId(event);
			if (isSameId(calendarInfo.groupRoot.shortEvents, eventListId)) {
				calendarInfo.shortEvents.push(event)
				this._addDaysForEvent(event)
			} else if (isSameId(calendarInfo.groupRoot.longEvents, eventListId)) {
				calendarInfo.longEvents.push(event)
			}
		}
	}

	_addDaysForEvent(event: CalendarEvent) {
		const calculationDate = getStartOfDay(event.startTime)
		const endDate = new Date(event.startTime.getTime() + Number(event.duration));
		while (calculationDate.getTime() < endDate.getTime()) {
			getFromMap(this._eventsForDays, calculationDate.getTime(), () => []).push(event)
			incrementDate(calculationDate, 1)
		}
	}

	_removeDaysForEvent(id: IdTuple) {
		this._eventsForDays.forEach((dayEvents) =>
			findAndRemove(dayEvents, (e) => isSameId(e._id, id)))
	}
}

function colourIsLight(c: string) {
	const rgb = parseInt(c, 16);   // convert rrggbb to decimal
	const r = (rgb >> 16) & 0xff;  // extract red
	const g = (rgb >> 8) & 0xff;  // extract green
	const b = (rgb >> 0) & 0xff;  // extract blue

	// Counting the perceptive luminance
	// human eye favors green color...
	const a = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return (a < 0.5);
}



