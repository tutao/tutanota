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
import {logins} from "../api/main/LoginController"
import {_loadReverseRangeBetween, getListId, isSameId} from "../api/common/EntityFunctions"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {defaultCalendarColor, GroupType, OperationType} from "../api/common/TutanotaConstants"
import {locator} from "../api/main/MainLocator"
import {neverNull} from "../api/common/utils/Utils"
import type {CalendarMonthTimeRange} from "./CalendarUtils"
import {getMonth, shouldDefaultToAmPmTimeFormat} from "./CalendarUtils"
import {showCalendarEventDialog} from "./CalendarEventDialog"
import {worker} from "../api/main/WorkerClient"
import {ButtonColors, ButtonN, ButtonType} from "../gui/base/ButtonN"
import {addDaysForEvent, addDaysForLongEvent, addDaysForRecurringEvent} from "./CalendarModel"
import {findAllAndRemove, findAndRemove} from "../api/common/utils/ArrayUtils"
import {formatDateWithWeekday, formatMonthWithYear} from "../misc/Formatter"
import {NavButtonN} from "../gui/base/NavButtonN"
import {CalendarMonthView} from "./CalendarMonthView"
import {CalendarDayView} from "./CalendarDayView"
import {geEventElementMaxId, getEventElementMinId, getEventStart} from "../api/common/utils/CommonCalendarUtils"
import {px, size as sizes} from "../gui/size"
import {UserTypeRef} from "../api/entities/sys/User"
import {DateTime} from "luxon"
import {NotFoundError} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/base/ProgressDialog"

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
	// Should not be changed directly but only through the URL
	selectedDate: Stream<Date>
	_calendarInfos: Promise<Map<Id, CalendarInfo>>
	_eventsForDays: Map<number, Array<CalendarEvent>>
	_loadedMonths: Set<number> // first ms of the month
	_currentViewType: CalendarViewTypeEnum

	constructor() {
		const calendarViewValues = [
			{name: lang.get("day_label"), value: CalendarViewType.DAY, icon: Icons.ListAlt, href: "/calendar/day"},
			{name: lang.get("month_label"), value: CalendarViewType.MONTH, icon: Icons.Table, href: "/calendar/month"},
		]

		this._currentViewType = CalendarViewType.MONTH
		this._loadedMonths = new Set()
		this._eventsForDays = new Map()
		this.selectedDate = stream(getStartOfDay(new Date()))

		this.sidebarColumn = new ViewColumn({
			view: () => m(".folder-column.scroll.overflow-x-hidden.flex.col.plr-l", [
				m(".folders.pt", [
					m(VisualDatePicker, {
						onDateSelected: (newDate, dayClicked) => {
							if (dayClicked) {
								this._setUrl(CalendarViewType.DAY, newDate)
								this.viewSlider.focus(this.contentColumn)
							} else {
								this._setUrl(this._currentViewType, newDate)
							}
						},
						selectedDate: this.selectedDate(),
						wide: false
					})
				]),
				m(".folders", [
					m(".folder-row.flex-space-between", [
						m("small.b.align-self-center.ml-negative-xs",
							{style: {color: theme.navigation_button}},
							lang.get("view_label").toLocaleUpperCase()),
						m(ButtonN, {
							label: "today_label",
							click: () => {
								this._setUrl(m.route.param("view"), new Date())
							},
							colors: ButtonColors.Nav,
							type: ButtonType.Primary,
						})
					]),
					m(".folder-row", calendarViewValues.map(viewType => {
						return m(NavButtonN, {
							label: viewType.name,
							icon: () => viewType.icon,
							href: m.route.get(),
							isSelectedPrefix: viewType.href,
							// Close side menu
							click: () => {
								this._setUrl(viewType.value, this.selectedDate())
								this.viewSlider.focus(this.contentColumn)
							}
						})
					})),
				]),
				m(".folders",
					{style: {color: theme.navigation_button}},
					[
						m(".folder-row.flex-space-between", {
							style: {height: px(sizes.button_height)}
						}, [
							m("small.b.align-self-center.ml-negative-xs",
								lang.get("yourCalendars_label").toLocaleUpperCase()),
							// m(ButtonN, {
							// 	label: () => "add calendar",
							// 	click: () => {},
							// 	icon: () => Icons.Add
							// })
						]),
						m(".folder-row.flex-start",
							m(".flex.flex-grow..center-vertically.button-height", [
								m(".calendar-checkbox", {
									style: {
										"border-color": "#" + defaultCalendarColor,
										"background": "#" + defaultCalendarColor,
										"margin-left": "-4px" // .folder-row > a adds -10px margin to other itmes but it has 6px padding
									}
								}),
								m(".pl-m.b", lang.get("privateCalendar_label"))
							]))
					])
			])
		}, ColumnType.Foreground, 200, 300, () => lang.get("calendar_label"))


		this.contentColumn = new ViewColumn({
			view: () => this._currentViewType === CalendarViewType.MONTH
				? m(CalendarMonthView, {
					eventsForDays: this._eventsForDays,
					onEventClicked: (event) => this._onEventSelected(event),
					onNewEvent: (date) => {
						this._newEvent(date)
					},
					selectedDate: this.selectedDate(),
					onDateSelected: (date) => {
						this._setUrl(CalendarViewType.DAY, date)
					},
					onChangeMonthGesture: (next) => {
						let newDate = new Date(this.selectedDate().getTime())
						newDate.setMonth(newDate.getMonth() + (next ? +1 : -1))
						this._setUrl(CalendarViewType.MONTH, newDate)
					},
					amPmFormat: shouldDefaultToAmPmTimeFormat(),
				})
				: m(CalendarDayView, {
					eventsForDays: this._eventsForDays,
					onEventClicked: (event) => this._onEventSelected(event),
					onNewEvent: (date) => {
						this._newEvent(date)
					},
					selectedDate: this.selectedDate(),
					onDateSelected: (date) => {
						this._setUrl(CalendarViewType.DAY, date)
					},
					amPmFormat: shouldDefaultToAmPmTimeFormat(),
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


		// load all calendars. if there is no calendar yet, create one
		this._calendarInfos = this._loadGroupRoots().then(calendarInfos => {
			if (calendarInfos.size === 0) {
				return worker.addCalendar().then(() => this._loadGroupRoots())
			} else {
				return calendarInfos
			}
		})

		this.selectedDate.map((d) => {
			const previousMonthDate = new Date(d)
			previousMonthDate.setMonth(d.getMonth() - 1)

			const nextMonthDate = new Date(d)
			nextMonthDate.setMonth(d.getMonth() + 1)

			this._loadMonthIfNeeded(d)
			    .then(() => this._loadMonthIfNeeded(nextMonthDate))
			    .then(() => this._loadMonthIfNeeded(previousMonthDate))
		})

		locator.eventController.addEntityListener((updates, eventOwnerGroupId) => {
			this.entityEventReceived(updates, eventOwnerGroupId)
		})
	}

	_onEventSelected(event: CalendarEvent) {
		this._calendarInfos.then((calendarInfos) => {
			let p = Promise.resolve(event)
			if (event.repeatRule) {
				// in case of a repeat rule we want to show the start event for now to indicate that we edit all events.
				p = load(CalendarEventTypeRef, event._id)
			}
			p.then(e => showCalendarEventDialog(getEventStart(e), calendarInfos, e))
			 .catch(NotFoundError, () => {
				 console.log("calendar event not found when clicking on the event")
			 })
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


	_newEvent(date?: ?Date) {
		let p = this._calendarInfos.isFulfilled() ? this._calendarInfos : showProgressDialog("pleaseWait_msg", this._calendarInfos)
		p.then(calendars => showCalendarEventDialog(date || this.selectedDate(), calendars))
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
			this._setUrl(this._currentViewType, this.selectedDate(), true)
		} else {
			this._currentViewType = args.view === CalendarViewType.DAY ? CalendarViewType.DAY : CalendarViewType.MONTH
			const urlDateParam = args.date
			if (urlDateParam) {
				// Unlike JS Luxon assumes local time zone when parsing and not UTC. That's what we want
				const date = DateTime.fromISO(urlDateParam).toJSDate()
				if (this.selectedDate().getTime() !== date.getTime()) {
					this.selectedDate(date)
					m.redraw()
				}
			}
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

	_loadGroupRoots(): Promise<Map<Id, CalendarInfo>> {
		return load(UserTypeRef, logins.getUserController().user._id)
			.then(user => {
				const calendarMemberships = user.memberships.filter(m => m.groupType === GroupType.Calendar);
				return Promise
					.map(calendarMemberships, (membership) => load(CalendarGroupRootTypeRef, membership.group))
					.then((groupRoots) => {
						const calendarInfos: Map<Id, CalendarInfo> = new Map()
						groupRoots.forEach((groupRoot) => {
							calendarInfos.set(groupRoot._id, {groupRoot, shortEvents: [], longEvents: []})
						})
						return calendarInfos
					})
			})
			.tap(() => m.redraw())
	}

	entityEventReceived<T>(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): void {
		this._calendarInfos.then((calendarEvents) => {
			updates.forEach(update => {
				if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
					if (update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) {
						load(CalendarEventTypeRef, [update.instanceListId, update.instanceId])
							.then((event) => {
								this.addOrUpdateEvent(calendarEvents.get(neverNull(event._ownerGroup)), event)
								m.redraw()
							})
							.catch(NotFoundError, (e) => {
								console.log("Not found event in entityEventsReceived of view", e)
							})
					} else if (update.operation === OperationType.DELETE) {
						this._removeDaysForEvent([update.instanceListId, update.instanceId], eventOwnerGroupId)
						m.redraw()
					}
				} else if (isUpdateForTypeRef(UserTypeRef, update) 	// only process update event received for the user group - to not process user update from admin membership.
					&& isSameId(eventOwnerGroupId, logins.getUserController().user.userGroup.group)) {
					if (update.operation === OperationType.UPDATE) {
						const calendarMemberships = logins.getUserController().getCalendarMemberships()
						this._calendarInfos.then(calendarInfos => {
							if (calendarMemberships.length !== calendarInfos.size) {
								console.log("detected update of calendar memberships")
								this._calendarInfos = this._loadGroupRoots()
							}
						})
					}
				}
			})
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

	_removeDaysForEvent(id: IdTuple, ownerGroupId: Id) {
		this._eventsForDays.forEach((dayEvents) =>
			findAllAndRemove(dayEvents, (e) => isSameId(e._id, id)))
		if (this._calendarInfos.isFulfilled()) {
			const infos = this._calendarInfos.value()
			const info = infos.get(ownerGroupId)
			if (info) {
				const removedFromShort = findAndRemove(info.shortEvents, (e) => isSameId(e._id, id))
				if (!removedFromShort) {
					findAndRemove(info.longEvents, (e) => isSameId(e._id, id))
				}
			}
		}
	}

	_addDaysForLongEvent(event: CalendarEvent, month: CalendarMonthTimeRange) {
		addDaysForLongEvent(this._eventsForDays, event, month)
	}

	getViewSlider() {
		return this.viewSlider
	}

	_setUrl(view: string, date: Date, replace: boolean = false) {
		const dateString = DateTime.fromJSDate(date).toISODate()
		m.route.set("/calendar/:view/:date", {view, date: dateString}, {replace})
	}
}



