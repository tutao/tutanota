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
import {getCalendarMonth, getEndOfDay, getStartOfDay, getStartOfNextDay, incrementDate} from "../api/common/utils/DateUtils"
import {Dialog} from "../gui/base/Dialog"
import {TextFieldN} from "../gui/base/TextFieldN"
import {CalendarEventTypeRef, createCalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import {CalendarGroupRootTypeRef} from "../api/entities/tutanota/CalendarGroupRoot"
import {logins} from "../api/main/LoginController"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {getListId, isSameId, uint8arrayToCustomId} from "../api/common/EntityFunctions"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {OperationType} from "../api/common/TutanotaConstants"
import {locator} from "../api/main/MainLocator"
import {neverNull} from "../api/common/utils/Utils"
import {getFromMap} from "../api/common/utils/MapUtils"
import {concat, findAndRemove} from "../api/common/utils/ArrayUtils"
import {stringToUtf8Uint8Array} from "../api/common/utils/Encoding"
import {px, size} from "../gui/size"
import {modal} from "../gui/base/Modal"
import {displayOverlay} from "../gui/base/Overlay"
import {animations, opacity, transform} from "../gui/animation/Animations"
import {ease} from "../gui/animation/Easing"

type CalendarInfo = {
	groupRoot: CalendarGroupRoot,
	shortEvents: Array<CalendarEvent>,
	longEvents: Array<CalendarEvent>,
}

const weekDaysHeight = 30
const eventHeight = 22

export class CalendarView implements CurrentView {

	sidebarColumn: ViewColumn
	contentColumn: ViewColumn
	viewSlider: ViewSlider
	newAction: Button
	selectedDate: Stream<Date>
	_calendarEvents: Promise<Map<Id, CalendarInfo>>
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
		const canDisplay = weekHeight / eventHeight
		const sortedEvents = eventsForDay.slice().sort((l, r) => l.startTime.getTime() - r.startTime.getTime())
		const eventsToDisplay = sortedEvents.slice(0, canDisplay - 1)
		const notShown = eventsForDay.length - eventsToDisplay.length
		return m(".flex-grow.calendar-day", {
			onclick: () => this._newEvent(d.date),
		}, [
			m(".pl-s.pr-s.pt-s", String(d.day)),
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
		let color = "F0F8FF"
		if (this._calendarEvents.isFulfilled()) {
			const calInfo = this._calendarEvents.value().get(neverNull(event._ownerGroup))
			color = neverNull(calInfo).groupRoot.color
		}
		return m("", {
			style: {
				background: "#" + color,
				color: colourIsLight(color) ? "black" : "white",
				'border-radius': "2px",
				marginTop: "4px",
				margin: "2px 0",
				height: px(eventHeight),
				marginLeft: event.startTime < date.getTime() ? "" : px(size.hpad_small),
				marginRight: event.startTime + Number(event.duration) > getEndOfDay(date).getTime() ? "" : px(size.hpad_small),
			}
		}, event.summary)
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

	_newEvent(date: Date = getStartOfDay(new Date())) {
		const summary = stream("")
		this._calendarEvents.then(calendarEvents => {
			const calendars = Array.from(calendarEvents.values())
			const selectedCalendar = stream(calendars[0])
			const startDatePicker = new DatePicker("dateFrom_label", "emptyString_msg", true)
			startDatePicker.date(date)
			const endDatePicker = new DatePicker("dateTo_label", "emptyString_msg", true)
			endDatePicker.date(getEndOfDay(date))
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
					const endDate = getEndOfDay(endDatePicker.date() || getStartOfNextDay(calendarEvent.startTime))
					calendarEvent.description = ""
					calendarEvent.summary = summary()
					calendarEvent.duration = String(endDate.getTime() - calendarEvent.startTime.getTime())
					const groupRoot = selectedCalendar().groupRoot
					calendarEvent._ownerGroup = selectedCalendar().groupRoot._id
					calendarEvent._id = [groupRoot.shortEvents, makeEventElementId(calendarEvent.startTime.getTime())]

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
					shortEvents.forEach((e) => this._addDaysForEvent(e))
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

function makeEventElementId(timestampt: number): string {
	const randomBytes = new Uint8Array(8)
	crypto.getRandomValues(randomBytes)
	const idBytes = concat(stringToUtf8Uint8Array(String(timestampt)), randomBytes)
	return uint8arrayToCustomId(idBytes)
}



