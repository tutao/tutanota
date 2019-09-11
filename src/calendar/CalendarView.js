// @flow
import m from "mithril"
import {load, loadAll, serviceRequestVoid, update} from "../api/main/Entity"
import stream from "mithril/stream/stream.js"
import type {CurrentView} from "../gui/base/Header"
import {ColumnType, ViewColumn} from "../gui/base/ViewColumn"
import {lang} from "../misc/LanguageViewModel"
import {ViewSlider} from "../gui/base/ViewSlider"
import {Icons} from "../gui/base/icons/Icons"
import {theme} from "../gui/theme"
import {DAY_IN_MILLIS, getStartOfDay} from "../api/common/utils/DateUtils"
import {CalendarEventTypeRef} from "../api/entities/tutanota/CalendarEvent"
import {CalendarGroupRootTypeRef} from "../api/entities/tutanota/CalendarGroupRoot"
import {logins} from "../api/main/LoginController"
import {_loadReverseRangeBetween, getListId, HttpMethod, isSameId} from "../api/common/EntityFunctions"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {defaultCalendarColor, GroupType, OperationType, reverse, TimeFormat} from "../api/common/TutanotaConstants"
import {locator} from "../api/main/MainLocator"
import {downcast, neverNull, noOp} from "../api/common/utils/Utils"
import type {CalendarMonthTimeRange} from "./CalendarUtils"
import {getCalendarName, getEventStart, getMonth, getTimeZone, shouldDefaultToAmPmTimeFormat} from "./CalendarUtils"
import {showCalendarEventDialog} from "./CalendarEventDialog"
import {worker} from "../api/main/WorkerClient"
import {ButtonColors, ButtonN, ButtonType} from "../gui/base/ButtonN"
import {addDaysForEvent, addDaysForLongEvent, addDaysForRecurringEvent} from "./CalendarModel"
import {findAllAndRemove, findAndRemove} from "../api/common/utils/ArrayUtils"
import {formatDateWithWeekday, formatMonthWithFullYear} from "../misc/Formatter"
import {NavButtonN} from "../gui/base/NavButtonN"
import {CalendarMonthView} from "./CalendarMonthView"
import {CalendarDayView} from "./CalendarDayView"
import {geEventElementMaxId, getEventElementMinId} from "../api/common/utils/CommonCalendarUtils"
import {UserTypeRef} from "../api/entities/sys/User"
import {DateTime} from "luxon"
import {NotFoundError} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {CalendarAgendaView} from "./CalendarAgendaView"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {showEditCalendarDialog} from "./EditCalendarDialog"
import {createGroupColor} from "../api/entities/tutanota/GroupColor"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import {attachDropdown} from "../gui/base/DropdownN"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {createCalendarDeleteData} from "../api/entities/tutanota/CalendarDeleteData"
import {styles} from "../gui/styles"
import {CalendarWeekView} from "./CalendarWeekView"
import {getSafeAreaInsetLeft} from "../gui/HtmlUtils"
import {exportCalendar, showCalendarImportDialog} from "./CalendarImporter"
import {Dialog} from "../gui/base/Dialog"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {isApp} from "../api/Env"
import {showCalendarSharingDialog} from "./CalendarSharingDialog"
import {UserGroupRootTypeRef} from "../api/entities/sys/UserGroupRoot"
import {IncomingInviteTypeRef} from "../api/entities/sys/IncomingInvite"
import {showCalendarSharingDialog} from "./CalendarSharingDialog"
import {UserGroupRootTypeRef} from "../api/entities/sys/UserGroupRoot"
import {IncomingInviteTypeRef} from "../api/entities/sys/IncomingInvite"


export type CalendarInfo = {
	groupRoot: CalendarGroupRoot,
	shortEvents: Array<CalendarEvent>,
	longEvents: Array<CalendarEvent>,
	groupInfo: GroupInfo,
}

export const CalendarViewType = Object.freeze({
	DAY: "day",
	WEEK: "week",
	MONTH: "month",
	AGENDA: "agenda"
})
const CalendarViewTypeByValue = reverse(CalendarViewType)

export type CalendarViewTypeEnum = $Values<typeof CalendarViewType>

type CalendarInvitation = {
	invite: IncomingInvite,
	name: string
}

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
	_hiddenCalendars: Set<Id>

	_calendarInvitations: Array<CalendarInvitation>

	constructor() {
		const calendarViewValues = [
			{name: lang.get("month_label"), value: CalendarViewType.MONTH, icon: Icons.Table, href: "/calendar/month"},
			{name: lang.get("agenda_label"), value: CalendarViewType.AGENDA, icon: Icons.ListUnordered, href: "/calendar/agenda"},
		]


		this._currentViewType = styles.isDesktopLayout() ? CalendarViewType.MONTH : CalendarViewType.AGENDA
		this._loadedMonths = new Set()
		this._eventsForDays = new Map()
		this._hiddenCalendars = new Set()
		this.selectedDate = stream(getStartOfDay(new Date()))

		this.sidebarColumn = new ViewColumn({
			view: () => m(".folder-column.scroll.overflow-x-hidden.flex.col", {
				style: {
					paddingLeft: getSafeAreaInsetLeft()
				}
			}, [
				m(".folders.pt-s", [
					m(".folder-row.flex-space-between.button-height.plr-l", [
						m("small.b.align-self-center.ml-negative-xs",
							{style: {color: theme.navigation_button}},
							lang.get("view_label").toLocaleUpperCase()),
						(this._currentViewType !== CalendarViewType.AGENDA) ? m(ButtonN, {
							label: "today_label",
							click: () => {
								this._setUrl(m.route.param("view"), new Date())
							},
							colors: ButtonColors.Nav,
							type: ButtonType.Primary,
						}) : null
					]),
					m(".folder-row.plr-l", calendarViewValues.map(viewType => {
						return m(NavButtonN, {
							label: () => viewType.name,
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
						m(".folder-row.flex-space-between.button-height.plr-l", [
							m("small.b.align-self-center.ml-negative-xs",
								lang.get("yourCalendars_label").toLocaleUpperCase()),
							m(ButtonN, {
								label: "addCalendar_action",
								click: () => this._onPressedAddCalendar(),
								icon: () => Icons.Add
							})
						]),
						this._renderCalendars()
					]),
				m(".folders", {style: {color: theme.navigation_button}}, [
					m(".folder-row.flex-space-between.button-height.plr-l", [
						m("small.b.align-self-center.ml-negative-xs",
							lang.get("sharedCalendars_label").toLocaleUpperCase())
					]),
					//this._renderCalendars()
				]),
				this._calendarInvitations.length > 0
					? m(".folders", {style: {color: theme.navigation_button}}, [
						m(".folder-row.flex-space-between.button-height.plr-l", [
							m("small.b.align-self-center.ml-negative-xs",
								lang.get("calendarInvitations_label").toLocaleUpperCase())
						]),
						this._renderCalendarInvitations()
					])
					: null,

			])
		}, ColumnType.Foreground, 200, 300, () => this._currentViewType === CalendarViewType.WEEK
			? lang.get("month_label")
			: lang.get("calendar_label"))


		this.contentColumn = new ViewColumn({
			view: () => {
				const groupColors = logins.getUserController().userSettingsGroupRoot.groupColors.reduce((acc, gc) => {
					acc[gc.group] = gc.color
					return acc
				}, {})

				switch (this._currentViewType) {
					case CalendarViewType.MONTH:
						return m(CalendarMonthView, {
							eventsForDays: this._eventsForDays,
							onEventClicked: (event) => this._onEventSelected(event),
							onNewEvent: (date) => {
								this._newEvent(date)
							},
							selectedDate: this.selectedDate(),
							onDateSelected: (date) => {
								const viewType = styles.isDesktopLayout() ? CalendarViewType.WEEK : CalendarViewType.DAY
								this._setUrl(viewType, date)
							},
							onChangeMonth: (next) => {
								let newDate = new Date(this.selectedDate().getTime())
								newDate.setMonth(newDate.getMonth() + (next ? +1 : -1))
								// set date explicitly here and trigger a redraw manually to avoid flickering of calendar events when using swipe gesture in android web view.
								// There might be another animation frame in between setUrl and updateUrl in which the PageSwipeHandler resets the swipe
								// transformation. If then the selected date is not updated the PageView shows the previous page for a short time.
								this.selectedDate(newDate)
								m.redraw()
								this._setUrl(CalendarViewType.MONTH, newDate)
							},
							amPmFormat: logins.getUserController().userSettingsGroupRoot.timeFormat === TimeFormat.TWELVE_HOURS,
							startOfTheWeek: downcast(logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
							groupColors,
							hiddenCalendars: this._hiddenCalendars,
						})
					case CalendarViewType.DAY:
						return m(CalendarDayView, {
							eventsForDays: this._eventsForDays,
							onEventClicked: (event) => this._onEventSelected(event),
							onNewEvent: (date) => {
								this._newEvent(date)
							},
							selectedDate: this.selectedDate(),
							onDateSelected: (date) => {
								this.selectedDate(date)
								m.redraw()
								this._setUrl(CalendarViewType.DAY, date)
							},
							groupColors,
							hiddenCalendars: this._hiddenCalendars,
						})
					case CalendarViewType.WEEK:
						return m(CalendarWeekView, {
							eventsForDays: this._eventsForDays,
							onEventClicked: (event) => this._onEventSelected(event),
							onNewEvent: (date) => {
								this._newEvent(date)
							},
							selectedDate: this.selectedDate(),
							onDateSelected: (date) => {
								this._setUrl(CalendarViewType.DAY, date)
							},
							startOfTheWeek: downcast(logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
							groupColors,
							hiddenCalendars: this._hiddenCalendars,
							onChangeWeek: (next) => {
								let newDate = new Date(this.selectedDate().getTime())
								newDate.setDate(newDate.getDate() + (next ? 7 : -7))
								this.selectedDate(newDate)
								m.redraw()
								this._setUrl(CalendarViewType.WEEK, newDate)
							}
						})
					case CalendarViewType.AGENDA:
						return m(CalendarAgendaView, {
							eventsForDays: this._eventsForDays,
							amPmFormat: shouldDefaultToAmPmTimeFormat(),
							onEventClicked: (event) => this._onEventSelected(event),
							groupColors,
							hiddenCalendars: this._hiddenCalendars,
							onDateSelected: (date) => {
								this._setUrl(CalendarViewType.DAY, date)
							},
						})

				}
			},
		}, ColumnType.Background, 1024, 2000, () => {
			if (this._currentViewType === CalendarViewType.MONTH) {
				return formatMonthWithFullYear(this.selectedDate())
			} else if (this._currentViewType === CalendarViewType.DAY) {
				return formatDateWithWeekday(this.selectedDate())
			} else if (this._currentViewType === CalendarViewType.AGENDA) {
				return lang.get("agenda_label")
			} else {
				return ""
			}
		})

		this.viewSlider = new ViewSlider([this.sidebarColumn, this.contentColumn], "CalendarView")


		// load all calendars. if there is no calendar yet, create one
		this._calendarInfos = this._loadGroupRoots().then(calendarInfos => {
			if (calendarInfos.size === 0) {
				return worker.addCalendar("").then(() => this._loadGroupRoots())
			} else {
				return calendarInfos
			}
		})


		this._calendarInvitations = []
		this._updateCalendarInvitations()

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

	_updateCalendarInvitations(): Promise<void> {
		return load(UserGroupRootTypeRef, logins.getUserController().userGroupInfo.group).then(userGroupRoot => {
			return loadAll(IncomingInviteTypeRef, userGroupRoot.invites).then(calendarInvitations => {
				return Promise.map(calendarInvitations, (invitation) => {
					return load(GroupInfoTypeRef, invitation.groupInfo).then(groupInfo => {
						return {
							invite: invitation,
							name: getCalendarName(groupInfo.name)
						}
					})
				}).then(invitations => {
					this._calendarInvitations = invitations
					m.redraw()
				})
			})
		})
	}


	handleBackButton(): boolean {
		const route = m.route.get()
		if (route.startsWith("/calendar/day")) {
			m.route.set(route.replace("day", "month"))
			return true
		} else if (route.startsWith("/calendar/week")) {
			m.route.set(route.replace("week", "month"))
			return true
		} else {
			return false
		}
	}

	backButtonLabelShown(): boolean {
		return true
	}

	_onPressedAddCalendar() {
		if (logins.getUserController().getCalendarMemberships().length === 0) {
			this._showCreateCalendarDialog()
		} else if (logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog(true)
		} else {
			load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then((customer) => {
				if (customer.canceledPremiumAccount) {
					return Dialog.error("subscriptionCancelledMessage_msg")
				} else {
					this._showCreateCalendarDialog()
				}
			})
		}
	}

	_showCreateCalendarDialog() {
		showEditCalendarDialog({name: "", color: Math.random().toString(16).slice(-6)}, false, (dialog, properties) => {
			dialog.close()
			worker.addCalendar(properties.name)
			      .then((group) => {
				      const {userSettingsGroupRoot} = logins.getUserController()
				      const newGroupColor = Object.assign(createGroupColor(), {
					      group: group._id,
					      color: properties.color
				      })
				      userSettingsGroupRoot.groupColors.push(newGroupColor)
				      update(userSettingsGroupRoot)
			      })
		})
	}

	_renderCalendarInvitations(): Children {
		return this._calendarInvitations.map((invitation) => m(".folder-row.flex-start.plr-l", [
			m(".flex.flex-grow.center-vertically.button-height", m(".pl-m.b", invitation.name)),
			m(ButtonN, attachDropdown({
					label: "more_label",
					click: noOp,
					icon: () => Icons.More
				}, () => [
					{
						label: "accept_action",
						click: () => this._acceptInvite(invitation),
						type: ButtonType.Dropdown,
					},
					{
						label: "decline_action",
						click: () => this._denyInvite(invitation),
						type: ButtonType.Dropdown,
					}
				].filter(Boolean)
			))
		]))
	}

	_acceptInvite(invitation: CalendarInvitation) {

	}

	_denyInvite(invitation: CalendarInvitation) {

	}


	_renderCalendars(): Children {
		return this._calendarInfos.isFulfilled() ?
			Array.from(this._calendarInfos.value().values()).map(({groupRoot, groupInfo}) => {
				const {userSettingsGroupRoot} = logins.getUserController()
				const existingGroupColor = userSettingsGroupRoot.groupColors.find((gc) => gc.group === groupInfo.group)
				const colorValue = "#" + (existingGroupColor ? existingGroupColor.color : defaultCalendarColor)
				return m(".folder-row.flex-start.plr-l",
					[
						m(".flex.flex-grow.center-vertically.button-height", [
							m(".calendar-checkbox", {
								onclick: () => this._hiddenCalendars.has(groupRoot._id)
									? this._hiddenCalendars.delete(groupRoot._id)
									: this._hiddenCalendars.add(groupRoot._id),
								style: {
									"border-color": colorValue,
									"background": this._hiddenCalendars.has(groupRoot._id) ? "" : colorValue,
									"margin-left": "-4px", // .folder-row > a adds -10px margin to other items but it has 6px padding
									"transition": "all 0.3s",
									"cursor": "pointer",
								}
							}),
							m(".pl-m.b.flex-grow.text-ellipsis", {style: {width: 0}}, getCalendarName(groupInfo.name))
						]),
						m(ButtonN, attachDropdown({
								label: "more_label",
								click: noOp,
								icon: () => Icons.More
							}, () => [
								{
									label: "edit_action",
									icon: () => Icons.Edit,
									click: () => this._onPressedEditCalendar(groupInfo, colorValue, existingGroupColor, userSettingsGroupRoot),
									type: ButtonType.Dropdown,
								},
								{
									label: "sharing_label",
									icon: () => Icons.ContactImport,
									click: () => showCalendarSharingDialog(groupInfo),
									type: ButtonType.Dropdown,
								},
								isApp()
									? null
									: {
										label: "import_action",
										icon: () => Icons.Import,
										click: () => showCalendarImportDialog(groupRoot),
										type: ButtonType.Dropdown,
									},
								isApp()
									? null
									: {
										label: "export_action",
										icon: () => Icons.Export,
										click: () => {
											const alarmInfoList = logins.getUserController().user.alarmInfoList
											alarmInfoList && exportCalendar(getCalendarName(groupInfo.name), groupRoot, alarmInfoList.alarms)
										},
										type: ButtonType.Dropdown,
									},
								{
									label: "delete_action",
									icon: () => Icons.Trash,
									click: () => {
										Dialog.confirm(() => lang.get("deleteCalendarConfirm_msg", {"{calendar}": getCalendarName(groupInfo.name)}))
										      .then((confirmed) => {
											      if (confirmed) {
												      serviceRequestVoid(TutanotaService.CalendarService, HttpMethod.DELETE, createCalendarDeleteData({
													      groupRootId: groupRoot._id
												      }))
											      }
										      })
									},
									type: ButtonType.Dropdown,
								},
							].filter(Boolean)
						)),
					])
			})
			: null
	}

	_onPressedEditCalendar(groupInfo: GroupInfo, colorValue: string, existingGroupColor: ?GroupColor, userSettingsGroupRoot: UserSettingsGroupRoot) {
		showEditCalendarDialog({
			name: getCalendarName(groupInfo.name),
			color: colorValue.substring(1)
		}, true, (dialog, properties) => {
			groupInfo.name = properties.name
			update(groupInfo)
			// color always set for existing calendar
			if (existingGroupColor) {
				existingGroupColor.color = properties.color
			} else {
				const newGroupColor = Object.assign(createGroupColor(), {
					group: groupInfo.group,
					color: properties.color
				})
				userSettingsGroupRoot.groupColors.push(newGroupColor)
			}
			update(userSettingsGroupRoot)
			dialog.close()
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

	updateUrl(args: Object) {
		if (!args.view) {
			this._setUrl(this._currentViewType, this.selectedDate(), true)
		} else {
			this._currentViewType = CalendarViewTypeByValue[args.view] ? args.view : CalendarViewType.MONTH
			const urlDateParam = args.date
			if (urlDateParam && this._currentViewType !== CalendarViewType.AGENDA) {
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
			return Promise.map(calendarInfos.values(), ({groupRoot, groupInfo, longEvents}) => {
				return Promise.all([
					_loadReverseRangeBetween(CalendarEventTypeRef, groupRoot.shortEvents, endId, startId, worker, 200),
					longEvents.length === 0 ? loadAll(CalendarEventTypeRef, groupRoot.longEvents, null) : longEvents,
				]).then(([shortEventsResult, longEvents]) => {
					shortEventsResult.elements
					                 .filter(e => e.startTime.getTime() >= month.start.getTime() && e.startTime.getTime()
						                 < month.end.getTime()) // only events for the loaded month
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
							groupInfo,
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
				const notFoundMemberships = []
				return Promise
					.map(calendarMemberships, (membership) => Promise
						.all([
							load(CalendarGroupRootTypeRef, membership.group), load(GroupInfoTypeRef, membership.groupInfo)
						])
						.catch(NotFoundError, () => {
							notFoundMemberships.push(membership)
							return null
						})
					)
					.then((groupRoots) => {
						const calendarInfos: Map<Id, CalendarInfo> = new Map()
						groupRoots.filter(Boolean)
						          .forEach(([groupRoot, groupInfo]) => {
							          calendarInfos.set(groupRoot._id, {groupRoot, groupInfo, shortEvents: [], longEvents: []})
						          })
						// TODO: remove notFoundMemberships from the user
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
							// Hide events for calendars we no longer have membership in
							calendarInfos.forEach((ci, group) => {
								if (calendarMemberships.every((mb) => group !== mb.group)) {
									this._hiddenCalendars.add(group)
								}
							})
							if (calendarMemberships.length !== calendarInfos.size) {
								console.log("detected update of calendar memberships")
								this._calendarInfos = this._loadGroupRoots()
							}
						})
					}
				} else if (isUpdateForTypeRef(IncomingInviteTypeRef, update)) {
					if (update.operation === OperationType.CREATE) {
						load(IncomingInviteTypeRef, [update.instanceListId, update.instanceId]).then(invite => {
							return load(GroupInfoTypeRef, invite.groupInfo).then(groupInfo => {
								this._calendarInvitations.push({
									invite: invite,
									name: getCalendarName(groupInfo.name)
								})
								m.redraw()
							})
						})
					} else if (update.operation === OperationType.DELETE) {
						const found = findAndRemove(this._calendarInvitations, (invitation) => {
							isSameId(invitation.invite._id, [update.instanceListId, update.instanceId])
						})
						if (found) {
							m.redraw()
						}
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
				// If the month is not loaded, we don't want to put it into events.
				// We will put it there when we load the month
				if (!this._loadedMonths.has(eventMonth.start.getTime())) {
					return
				}
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
		addDaysForRecurringEvent(this._eventsForDays, event, month, getTimeZone())
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



