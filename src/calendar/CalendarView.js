// @flow
import m from "mithril"
import {load, loadAll} from "../api/main/Entity"
import stream from "mithril/stream/stream.js"
import type {CurrentView} from "../gui/base/Header"
import {ColumnType, ViewColumn} from "../gui/base/ViewColumn"
import {lang} from "../misc/LanguageViewModel"
import {ViewSlider} from "../gui/base/ViewSlider"
import {Icons} from "../gui/base/icons/Icons"
import {VisualDatePicker} from "../gui/base/DatePicker"
import {theme} from "../gui/theme"
import {DAY_IN_MILLIS, getStartOfDay} from "../api/common/utils/DateUtils"
import {CalendarEventTypeRef} from "../api/entities/tutanota/CalendarEvent"
import {CalendarGroupRootTypeRef} from "../api/entities/tutanota/CalendarGroupRoot"
import {LoginController} from "../api/main/LoginController"
import {_loadReverseRangeBetween, getListId, isSameId} from "../api/common/EntityFunctions"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {defaultCalendarColor, OperationType} from "../api/common/TutanotaConstants"
import {locator} from "../api/main/MainLocator"
import {neverNull} from "../api/common/utils/Utils"
import type {CalendarMonthTimeRange} from "./CalendarUtils"
import {showCalendarEventDialog} from "./CalendarEventDialog"
import {worker} from "../api/main/WorkerClient"
import {ButtonColors, ButtonN, ButtonType} from "../gui/base/ButtonN"
import {addDaysForEvent, addDaysForLongEvent, addDaysForRecurringEvent} from "./CalendarModel"
import {findAllAndRemove} from "../api/common/utils/ArrayUtils"
import {formatDateWithWeekday, formatMonthWithYear} from "../misc/Formatter"
import {NavButtonN} from "../gui/base/NavButtonN"
import {CalendarMonthView} from "./CalendarMonthView"
import {CalendarDayView} from "./CalendarDayView"
import {geEventElementMaxId, getEventElementMinId, getEventStart} from "../api/common/utils/CommonCalendarUtils"
import {getMonth} from "./CalendarUtils"

export type CalendarInfo = {
	groupRoot: CalendarGroupRoot,
	shortEvents: Array<CalendarEvent>,
	longEvents: Array<CalendarEvent>,
}

export const CalendarViewType = Object.freeze({
	DAY: "day",
	MONTH: "month"
})
export type CalendarViewTypeEnum = $Values<typeof CalendarViewType>

export class CalendarView implements CurrentView {

	sidebarColumn: ViewColumn
	contentColumn: ViewColumn
	viewSlider: ViewSlider
	selectedDate: Stream<Date>
	_calendarInfos: Promise<Map<Id, CalendarInfo>>
	_eventsForDays: Map<number, Array<CalendarEvent>>
	_loadedMonths: Set<number> // first ms of the month
	_currentViewType: CalendarViewTypeEnum

	constructor(loginController: LoginController) {
		const calendarViewValues = [
			{name: lang.get("calendarViewDay_title"), value: CalendarViewType.DAY, icon: Icons.ListAlt, href: "/calendar/day"},
			{name: lang.get("calendarViewMonth_title"), value: CalendarViewType.MONTH, icon: Icons.Table, href: "/calendar/month"},
		]

		this._loadedMonths = new Set()
		this._eventsForDays = new Map()
		this.selectedDate = stream(getStartOfDay(new Date()))

		this.sidebarColumn = new ViewColumn({
			view: () => m(".folder-column.scroll.overflow-x-hidden.flex.col.plr-l", [
				m(".folders.pt", [
					m(VisualDatePicker, {
						onDateSelected: this.selectedDate,
						selectedDate: this.selectedDate(),
						wide: false
					})
				]),
				m(".folders", [
					m(".folder-row.flex-space-between", [
						m("small.b.align-self-center.ml-negative-xs",
							{style: {color: theme.navigation_button}},
							"view".toLocaleUpperCase()),
						m(ButtonN, {
							label: "today_label",
							click: () => {
								this.selectedDate(new Date())
							},
							colors: ButtonColors.Nav,
							type: ButtonType.Primary,
						})
					]),
					m(".folder-row", calendarViewValues.map(viewType => {
						return m(NavButtonN, {
							label: viewType.name,
							icon: () => viewType.icon,
							href: viewType.href,
							isSelectedPrefix: viewType.href
						})
					})),
				]),
				m(".folders",
					m(".folder-row.flex-space-between", [
						m("small.b.align-self-center.ml-negative-xs",
							{style: {color: theme.navigation_button}},
							lang.get("yourCalendars_label").toLocaleUpperCase()),
						m(ButtonN, {
							label: () => "add calendar",
							click: () => {},
							icon: () => Icons.Add
						})
					]),
					m(".folder-row.flex-start",
						m(".flex.flex-grow..center-vertically.button-height", [
							m(".calendar-checkbox", {
								style: {"border-color": "#" + defaultCalendarColor}
							}),
							m(".pl-m", lang.get("privateCalendar_label"))
						])))
			])
		}, ColumnType.Foreground, 200, 300, () => lang.get("calendar_label"))


		this.contentColumn = new ViewColumn({
			view: () => this._currentViewType === CalendarViewType.MONTH
				? m(CalendarMonthView, {
					eventsForDays: this._eventsForDays,
					onEventClicked: (event) => {
						this._calendarInfos.then((calendarInfos) => {
							showCalendarEventDialog(getEventStart(event), calendarInfos, event)
						})
					},
					onNewEvent: (date) => {
						this._calendarInfos.then((calendarInfos) => {
							showCalendarEventDialog(date || new Date(), calendarInfos)
						})
					},
					selectedDate: this.selectedDate,
				})
				: m(CalendarDayView, {
					eventsForDays: this._eventsForDays,
					onEventClicked: (event) => {
						this._calendarInfos.then((calendarInfos) => {
							showCalendarEventDialog(getEventStart(event), calendarInfos, event)
						})
					},
					onNewEvent: (date) => {
						this._calendarInfos.then((calendarInfos) => {
							showCalendarEventDialog(date || new Date(), calendarInfos)
						})
					},
					selectedDate: this.selectedDate,
				})
		}, ColumnType.Background, 700, 2000, () => {
			if (this._currentViewType === CalendarViewType.MONTH) {
				return formatMonthWithYear(this.selectedDate())
			} else if (this._currentViewType === CalendarViewType.DAY) {
				return formatDateWithWeekday(this.selectedDate())
			} else {
				return ""
			}
		})

		this.viewSlider = new ViewSlider([this.sidebarColumn, this.contentColumn], "CalendarView")

		this._calendarInfos = this._loadGroupRoots(loginController)
		                          .tap(() => m.redraw())

		this.selectedDate.map((d) => {
			const previousMonthDate = new Date(d)
			previousMonthDate.setMonth(d.getMonth() - 1)

			const nextMonthDate = new Date(d)
			nextMonthDate.setMonth(d.getMonth() + 1)

			this._loadMonthIfNeeded(d)
			    .then(() => this._loadMonthIfNeeded(nextMonthDate))
			    .then(() => this._loadMonthIfNeeded(previousMonthDate))
		})

		locator.eventController.addEntityListener((updates) => {
			this.entityEventReceived(updates)
		})
	}


	_getSelectedView(): CalendarViewTypeEnum {
		return m.route.get().match("/calendar/month") ? CalendarViewType.MONTH : CalendarViewType.DAY
	}

	_loadMonthIfNeeded(dayInMonth: Date): Promise<void> {
		const month = getMonth(dayInMonth)
		if (!this._loadedMonths.has(month.start.getTime())) {
			this._loadedMonths.add(month.start.getTime())
			return this._loadEvents(month).catch((e) => {
				this._loadedMonths.delete(month.start.getTime())
				throw e
			}).tap(() => m.redraw())
		}
		return Promise.resolve()
	}


	_newEvent(date?: Date) {
		this._calendarInfos.then(calendars => showCalendarEventDialog(date || new Date(), calendars))
	}

	view() {
		return m(".main-view", [
			m(this.viewSlider),
			m(ButtonN, {
				label: 'newEvent_action',
				click: () => this._newEvent(),
				icon: () => Icons.Add,
				type: ButtonType.Floating
			})
		])
	}


	// _showFullDayEvents(e: any, d: CalendarDay, events: Array<CalendarEvent>) {
	// 	const animtaionOpts = {duration: 100, easing: ease.in}
	// 	let dom
	// 	const dayModal = {
	// 		oncreate: (vnode) => {
	// 			dom = vnode.dom
	// 			animations.add(dom, [transform('scale', 0.5, 1)], animtaionOpts)
	// 		},
	// 		view: (vnode) => {
	// 			return m(".content-bg.abs", {
	// 				style: {
	// 					"max-width": "400px",
	// 					"min-width": "300px",
	// 					top: px(e.clientY),
	// 					left: px(e.clientX),
	// 					padding: px(size.hpad_small),
	// 				}
	// 			}, [
	// 				m(".center.b", String(d.day)),
	// 				events.map((e) => this._renderEvent(e, d.date)),
	// 			])
	// 		},
	// 		hideAnimation: () => dom && animations.add(dom, [opacity(1, 0, true), transform('scale', 1, 0.5)], animtaionOpts),
	// 		backgroundClick: () => {modal.remove(dayModal)},
	// 		onClose: () => {modal.remove(dayModal)},
	// 		shortcuts: () => []
	// 	}
	// 	modal.displayUnique(dayModal)
	// }


	updateUrl(args: Object) {
		if (!args.view) {
			m.route.set("/calendar/month", args, {replace: true})
		} else {
			this._currentViewType = args.view === CalendarViewType.DAY ? CalendarViewType.DAY : CalendarViewType.MONTH
		}
	}

	_loadEvents(month: CalendarMonthTimeRange): Promise<*> {
		return this._calendarInfos.then((calendarInfos) => {
			// Because of the timezones and all day events, we might not load an event which we need to display.
			// So we add a margin on 24 hours to be sure we load everything we need. We will filter matching
			// events anyway.
			const startId = getEventElementMinId(month.start.getTime() - DAY_IN_MILLIS)
			const endId = geEventElementMaxId(month.end.getTime() + DAY_IN_MILLIS)
			return Promise.map(calendarInfos.values(), ({groupRoot, longEvents}) => {
				return Promise.all([
					_loadReverseRangeBetween(CalendarEventTypeRef, groupRoot.shortEvents, endId, startId, worker, 200),
					longEvents.length === 0 ? loadAll(CalendarEventTypeRef, groupRoot.longEvents, null) : longEvents,
				]).then(([shortEventsResult, longEvents]) => {
					shortEventsResult.elements
					                 .filter(e => e.startTime.getTime() >= month.start.getTime() && e.startTime.getTime() < month.end.getTime()) // only events for the loaded month
					                 .forEach((e) => this._addDaysForEvent(e, month))
					longEvents.forEach((e) => {
						if (e.repeatRule) {
							this._addDaysForRecurringEvent(e, month)
						} else {
							this._addDaysForLongEvent(e, month)
						}
					})
					calendarInfos.set(groupRoot._id, {
							groupRoot,
							shortEvents: shortEventsResult.elements,
							longEvents
						}
					)
				})
			})
		})
	}


	_loadGroupRoots(loginController: LoginController): Promise<Map<Id, CalendarInfo>> {
		const calendarMemberships = loginController.getUserController().getCalendarMemberships()

		return Promise
			.map(calendarMemberships, (membership) => load(CalendarGroupRootTypeRef, membership.group))
			.then((groupRoots) => {
				const calendarInfos: Map<Id, CalendarInfo> = new Map()
				groupRoots.forEach((groupRoot) => {
					calendarInfos.set(groupRoot._id, {groupRoot, shortEvents: [], longEvents: []})
				})
				return calendarInfos
			})
	}

	entityEventReceived<T>(updates: $ReadOnlyArray<EntityUpdateData>): void {
		this._calendarInfos.then((calendarEvents) => {
			updates.forEach(update => {
				if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
					if (update.operation === OperationType.CREATE) {
						load(CalendarEventTypeRef, [update.instanceListId, update.instanceId])
							.then((event) => {
								this.addOrUpdateEvent(calendarEvents.get(neverNull(event._ownerGroup)), event)
							})
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
			const eventMonth = getMonth(getEventStart(event))
			if (isSameId(calendarInfo.groupRoot.shortEvents, eventListId)) {
				calendarInfo.shortEvents.push(event)
				this._addDaysForEvent(event, eventMonth)
			} else if (isSameId(calendarInfo.groupRoot.longEvents, eventListId)) {
				calendarInfo.longEvents.push(event)
				this._loadedMonths.forEach(firstDayTimestamp => {
					const loadedMonth = getMonth(new Date(firstDayTimestamp))
					if (event.repeatRule) {
						this._addDaysForRecurringEvent(event, loadedMonth)
					} else {
						this._addDaysForLongEvent(event, loadedMonth)
					}
				})
			}
		}
	}

	_addDaysForEvent(event: CalendarEvent, month: CalendarMonthTimeRange) {
		addDaysForEvent(this._eventsForDays, event, month)
	}

	_addDaysForRecurringEvent(event: CalendarEvent, month: CalendarMonthTimeRange) {
		addDaysForRecurringEvent(this._eventsForDays, event, month)
	}

	_removeDaysForEvent(id: IdTuple) {
		this._eventsForDays.forEach((dayEvents) =>
			findAllAndRemove(dayEvents, (e) => isSameId(e._id, id)))
	}

	_addDaysForLongEvent(event: CalendarEvent, month: CalendarMonthTimeRange) {
		addDaysForLongEvent(this._eventsForDays, event, month)
	}

	getViewSlider() {
		return this.viewSlider
	}
}



