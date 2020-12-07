// @flow
import m from "mithril"
import {load, loadAll, serviceRequestVoid, update} from "../api/main/Entity"
import stream from "mithril/stream/stream.js"
import type {CurrentView} from "../gui/base/Header"
import {ColumnType, ViewColumn} from "../gui/base/ViewColumn"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {ViewSlider} from "../gui/base/ViewSlider"
import type {Shortcut} from "../misc/KeyManager"
import {keyManager} from "../misc/KeyManager"
import {Icons} from "../gui/base/icons/Icons"
import {theme} from "../gui/theme"
import {DAY_IN_MILLIS, getHourOfDay, getStartOfDay, isSameDay} from "../api/common/utils/DateUtils"
import type {CalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import {CalendarEventTypeRef} from "../api/entities/tutanota/CalendarEvent"
import type {CalendarGroupRoot} from "../api/entities/tutanota/CalendarGroupRoot"
import {logins} from "../api/main/LoginController"
import {_loadReverseRangeBetween, getListId, HttpMethod, isSameId, listIdPart} from "../api/common/EntityFunctions"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {defaultCalendarColor, Keys, OperationType, reverse, ShareCapability, TimeFormat} from "../api/common/TutanotaConstants"
import {locator} from "../api/main/MainLocator"
import {downcast, freezeMap, memoized, neverNull, noOp} from "../api/common/utils/Utils"
import type {CalendarMonthTimeRange} from "./CalendarUtils"
import {
	getCalendarName,
	getCapabilityText,
	getEventStart,
	getMonth,
	getNextHalfHour,
	getStartOfTheWeekOffset,
	getStartOfWeek,
	getTimeZone,
	hasCapabilityOnGroup,
	isSameEvent,
	shouldDefaultToAmPmTimeFormat,
} from "./CalendarUtils"
import {showCalendarEventDialog} from "./CalendarEventEditDialog"
import {worker} from "../api/main/WorkerClient"
import type {ButtonAttrs} from "../gui/base/ButtonN"
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
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {showEditCalendarDialog} from "./EditCalendarDialog"
import type {GroupSettings} from "../api/entities/tutanota/GroupSettings"
import {createGroupSettings} from "../api/entities/tutanota/GroupSettings"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import {attachDropdown} from "../gui/base/DropdownN"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {createCalendarDeleteData} from "../api/entities/tutanota/CalendarDeleteData"
import {styles} from "../gui/styles"
import {CalendarWeekView} from "./CalendarWeekView"
import {exportCalendar, showCalendarImportDialog} from "./CalendarImporter"
import {Dialog} from "../gui/base/Dialog"
import {isApp} from "../api/Env"
import {showCalendarSharingDialog} from "./CalendarSharingDialog"
import type {ReceivedGroupInvitation} from "../api/entities/sys/ReceivedGroupInvitation"
import {ReceivedGroupInvitationTypeRef} from "../api/entities/sys/ReceivedGroupInvitation"
import type {Group} from "../api/entities/sys/Group"
import type {UserSettingsGroupRoot} from "../api/entities/tutanota/UserSettingsGroupRoot"
import {UserSettingsGroupRootTypeRef} from "../api/entities/tutanota/UserSettingsGroupRoot"
import {getDisplayText} from "../mail/MailUtils"
import {UserGroupRootTypeRef} from "../api/entities/sys/UserGroupRoot"
import {showInvitationDialog} from "./CalendarInvitationDialog"
import {loadGroupMembers} from "./CalendarSharingUtils"
import {size} from "../gui/size"
import {FolderColumnView} from "../gui/base/FolderColumnView"
import {deviceConfig} from "../misc/DeviceConfig"
import {premiumSubscriptionActive} from "../subscription/PriceUtils"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {CalendarEventPopup} from "./CalendarEventPopup"
import {NoopProgressMonitor} from "../api/common/utils/ProgressMonitor"

export const LIMIT_PAST_EVENTS_YEARS = 100
export const DEFAULT_HOUR_OF_DAY = 6

export type CalendarInfo = {
	groupRoot: CalendarGroupRoot,
	// We use LazyLoaded so that we don't get races for loading these events which is
	// 1. Good because loading them twice is not optimal
	// 2. Event identity is required by some functions (e.g. when determining week events)
	longEvents: LazyLoaded<Array<CalendarEvent>>,
	groupInfo: GroupInfo,
	group: Group,
	shared: boolean
}

export const CalendarViewType = Object.freeze({
	DAY: "day",
	WEEK: "week",
	MONTH: "month",
	AGENDA: "agenda"
})
const CalendarViewTypeByValue = reverse(CalendarViewType)

export type CalendarViewTypeEnum = $Values<typeof CalendarViewType>
type EventsForDays = Map<number, Array<CalendarEvent>>

// noinspection JSUnusedGlobalSymbols
export class CalendarView implements CurrentView {

	sidebarColumn: ViewColumn
	contentColumn: ViewColumn
	viewSlider: ViewSlider
	// Should not be changed directly but only through the URL
	selectedDate: Stream<Date>
	_calendarInfos: Promise<Map<Id, CalendarInfo>>
	_eventsForDays: EventsForDays
	_loadedMonths: Set<number> // first ms of the month
	_currentViewType: CalendarViewTypeEnum
	_hiddenCalendars: Set<Id>

	_calendarInvitations: Array<ReceivedGroupInvitation>

	oncreate: Function;
	onremove: Function;

	constructor() {
		const userId = logins.getUserController().user._id
		this._currentViewType = deviceConfig.getDefaultCalendarView(userId) || CalendarViewType.MONTH
		this._loadedMonths = new Set()
		this._eventsForDays = freezeMap(new Map())
		this._hiddenCalendars = new Set(deviceConfig.getHiddenCalendars(userId))
		this.selectedDate = stream(getStartOfDay(new Date()))

		this.sidebarColumn = new ViewColumn({
				view: () => m(FolderColumnView, {
					button: styles.isUsingBottomNavigation()
						? null
						: {
							label: 'newEvent_action',
							click: () => this._newEvent(),
						},
					content: [
						this._renderCalendarViewButtons(),
						this._renderSidebarSection("yourCalendars_label", {
							label: "addCalendar_action",
							colors: ButtonColors.Nav,
							click: () => this._onPressedAddCalendar(),
							icon: () => Icons.Add
						}, this._renderCalendars(false)),
						this._renderSidebarSection("otherCalendars_label", null, this._renderCalendars(true)),
						this._calendarInvitations.length > 0
							? this._renderSidebarSection("calendarInvitations_label", null, this._renderCalendarInvitations())
							: null,
					],
					ariaLabel: "calendar_label"
				})

			},
			ColumnType.Foreground, size.first_col_min_width, size.first_col_max_width, () => this._currentViewType === CalendarViewType.WEEK
				? lang.get("month_label")
				: lang.get("calendar_label")
		)

		const getGroupColors = memoized((userSettingsGroupRoot: UserSettingsGroupRoot) => {
			return userSettingsGroupRoot.groupSettings.reduce((acc, gc) => {
				acc[gc.group] = gc.color
				return acc
			}, {})
		})

		this.contentColumn = new ViewColumn({
			view: () => {
				const groupColors = getGroupColors(logins.getUserController().userSettingsGroupRoot)

				switch (this._currentViewType) {
					case CalendarViewType.MONTH:
						return m(CalendarMonthView, {
							eventsForDays: this._eventsForDays,
							onEventClicked: (calendarEvent, domEvent) => this._onEventSelected(calendarEvent, domEvent),
							onNewEvent: (date) => {
								this._newEvent(date)
							},
							selectedDate: this.selectedDate(),
							onDateSelected: (date) => {
								const viewType = styles.isDesktopLayout() ? CalendarViewType.WEEK : CalendarViewType.DAY
								this._setUrl(viewType, date)
							},
							onChangeMonth: (next) => this._viewPeriod(next),
							amPmFormat: logins.getUserController().userSettingsGroupRoot.timeFormat === TimeFormat.TWELVE_HOURS,
							startOfTheWeek: downcast(logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
							groupColors,
							hiddenCalendars: this._hiddenCalendars,
						})
					case CalendarViewType.DAY:
						return m(CalendarDayView, {
							eventsForDays: this._eventsForDays,
							onEventClicked: (event, domEvent) => this._onEventSelected(event, domEvent),
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
							onEventClicked: (event, domEvent) => this._onEventSelected(event, domEvent),
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
							onChangeWeek: (next) => this._viewPeriod(next)
						})
					case CalendarViewType.AGENDA:
						return m(CalendarAgendaView, {
							eventsForDays: this._eventsForDays,
							amPmFormat: shouldDefaultToAmPmTimeFormat(),
							onEventClicked: (event, domEvent) => this._onEventSelected(event, domEvent),
							groupColors,
							hiddenCalendars: this._hiddenCalendars,
							onDateSelected: (date) => {
								this._setUrl(CalendarViewType.DAY, date)
							},
						})

				}
			},
		}, ColumnType.Background, size.second_col_min_width + size.third_col_min_width, size.third_col_max_width, () => {
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


		// we load three instances per calendar / CalendarGroupRoot / GroupInfo / Group + 3
		// for each calendar we load short events for three months +3
		const workPerCalendar = 3 + 3
		const totalWork = logins.getUserController().getCalendarMemberships().length * workPerCalendar
		const monitorHandle = locator.progressTracker.registerMonitor(totalWork)
		const progressMonitor = neverNull(locator.progressTracker.getMonitor(monitorHandle))
		this._calendarInfos = locator.calendarModel.loadOrCreateCalendarInfo(progressMonitor).tap(m.redraw)

		this._calendarInvitations = []
		this._updateCalendarInvitations()

		this.selectedDate.map((d) => {
			const previousMonthDate = new Date(d)
			previousMonthDate.setMonth(d.getMonth() - 1)

			const nextMonthDate = new Date(d)
			nextMonthDate.setMonth(d.getMonth() + 1)

			this._loadMonthIfNeeded(d)
			    .then(() => progressMonitor.workDone(1))
			    .then(() => this._loadMonthIfNeeded(nextMonthDate))
			    .then(() => progressMonitor.workDone(1))
			    .then(() => this._loadMonthIfNeeded(previousMonthDate))
			    .finally(() => progressMonitor.completed())
		})

		this._setupShortcuts();

		locator.eventController.addEntityListener((updates, eventOwnerGroupId) => {
			return this.entityEventReceived(updates, eventOwnerGroupId)
		})
	}

	_setupShortcuts() {
		let shortcuts: Shortcut[] = [
			{
				key: Keys.ONE,
				exec: () => this._setUrl(CalendarViewType.WEEK, this.selectedDate()),
				help: "switchWeekView_action"
			},
			{
				key: Keys.TWO,
				exec: () => this._setUrl(CalendarViewType.MONTH, this.selectedDate()),
				help: "switchMonthView_action"
			},
			{
				key: Keys.THREE,
				exec: () => this._setUrl(CalendarViewType.AGENDA, this.selectedDate()),
				help: "switchAgendaView_action"
			},
			{
				key: Keys.T,
				exec: () => this._setUrl(m.route.param("view"), new Date()),
				help: "viewToday_action"
			},
			{
				key: Keys.J,
				enabled: () => this._currentViewType !== CalendarViewType.AGENDA,
				exec: () => this._viewPeriod(true),
				help: "viewNextPeriod_action"
			},
			{
				key: Keys.K,
				enabled: () => this._currentViewType !== CalendarViewType.AGENDA,
				exec: () => this._viewPeriod(false),
				help: "viewPrevPeriod_action"
			},
			{
				key: Keys.N,
				exec: () => this._newEvent(this.selectedDate()),
				help: "newEvent_action"
			}
		]

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)
		this.onremove = () => keyManager.unregisterShortcuts(shortcuts)
	}

	_viewPeriod(next: boolean) {
		switch (this._currentViewType) {
			case CalendarViewType.MONTH: {
				const dateTime = DateTime.fromJSDate(this.selectedDate())
				let newDate
				if (next) {
					newDate = dateTime.plus({month: 1}).toJSDate()
				} else {
					newDate = dateTime.minus({month: 1}).toJSDate()
				}
				this.selectedDate(newDate)
				m.redraw()
				this._setUrl(CalendarViewType.MONTH, newDate)
				break;
			}
			case CalendarViewType.WEEK: {
				const dateTime = DateTime.fromJSDate(this.selectedDate())
				let newDate
				if (next) {
					newDate = dateTime.plus({week: 1}).toJSDate()
				} else {
					newDate = dateTime.minus({week: 1}).toJSDate()
				}
				this.selectedDate(newDate)
				m.redraw()
				this._setUrl(CalendarViewType.WEEK, newDate)
				break;
			}
		}
	}

	_renderSidebarSection(label: TranslationKey, button: ?ButtonAttrs, content: Children): Children {
		return m(".folders", {style: {color: theme.navigation_button}}, [
			m(".folder-row.flex-space-between.button-height.plr-l", [
				m("small.b.align-self-center.ml-negative-xs",
					lang.get(label).toLocaleUpperCase()),
				button ? m(ButtonN, button) : null
			]),
			content
		])
	}

	_renderCalendarViewButtons(): Children {
		const calendarViewValues = [
			{name: lang.get("month_label"), value: CalendarViewType.MONTH, icon: Icons.Table, href: "/calendar/month"},
			{name: lang.get("agenda_label"), value: CalendarViewType.AGENDA, icon: Icons.ListUnordered, href: "/calendar/agenda"},
		]
		return m(".folders.pt-s", [
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
					colors: ButtonColors.Nav,
					// Close side menu
					click: () => {
						this._setUrl(viewType.value, this.selectedDate())
						this.viewSlider.focus(this.contentColumn)
					}
				})
			})),
		])
	}

	headerRightView(): Children {
		return m(ButtonN, {
			label: 'newEvent_action',
			click: () => {
				this._newEvent()
			},
			icon: () => Icons.Add,
			type: ButtonType.Action,
			colors: ButtonColors.Header
		})
	}

	_updateCalendarInvitations(): Promise<void> {
		return load(UserGroupRootTypeRef, logins.getUserController().userGroupInfo.group).then(userGroupRoot => {
			return loadAll(ReceivedGroupInvitationTypeRef, userGroupRoot.invitations).then(calendarInvitations => {
				this._calendarInvitations = calendarInvitations
				m.redraw()
			})
		}).catch(NotFoundError, (e) => {
			// user doesn't have UserGroupRoot, only created when receiving calendar invitations, so this is empty.
			this._calendarInvitations = []
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

	overrideBackIcon(): boolean {
		return this._currentViewType === CalendarViewType.WEEK || this._currentViewType === CalendarViewType.DAY
	}

	_onPressedAddCalendar() {
		if (logins.getUserController().getCalendarMemberships().length === 0) {
			this._showCreateCalendarDialog()
		} else {
			premiumSubscriptionActive(true).then(ok => {
				if (ok) {
					this._showCreateCalendarDialog()
				}
			})
		}
	}

	_showCreateCalendarDialog() {
		showEditCalendarDialog({name: "", color: Math.random().toString(16).slice(-6)}, "add_action", false, (dialog, properties) => {
			dialog.close()
			worker.addCalendar(properties.name)
			      .then((group) => {
				      const {userSettingsGroupRoot} = logins.getUserController()
				      const newGroupSettings = Object.assign(createGroupSettings(), {
					      group: group._id,
					      color: properties.color
				      })
				      userSettingsGroupRoot.groupSettings.push(newGroupSettings)
				      update(userSettingsGroupRoot)
			      })
		}, "save_action")
	}

	_renderCalendarInvitations(): Children {
		return this._calendarInvitations
		           .map((invitation) => [
				           m(".folder-row.flex-start.plr-l", [
					           m(".flex-v-center.flex-grow.button-height", {
						           style: {
							           // It's kinda hard to tell this element to not eat up all the row and truncate text instead because it
							           // is vertical flex. With this it will stop at 80% of what it could be and that's enough for the button.
							           "max-width": `calc(100% - ${size.button_height}px)`
						           }
					           }, [
						           m(".b.text-ellipsis", {title: getCapabilityText(downcast(invitation.capability))}, invitation.sharedGroupName),
						           m(".small.text-ellipsis", {title: invitation.inviterMailAddress},
							           (getDisplayText(invitation.inviterName, invitation.inviterMailAddress, true)))
					           ]),
					           m(ButtonN, {
						           label: "show_action",
						           click: () => showInvitationDialog(invitation),
						           icon: () => Icons.Eye
					           })
				           ])
			           ]
		           )
	}


	_renderCalendars(shared: boolean): Children {
		return this._calendarInfos.isFulfilled() ?
			Array.from(this._calendarInfos.value().values())
			     .filter(calendarInfo => calendarInfo.shared === shared)
			     .map((calendarInfo) => {
				     const {userSettingsGroupRoot} = logins.getUserController()
				     const existingGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group
					     === calendarInfo.groupInfo.group)
				     const colorValue = "#" + (existingGroupSettings
					     ? existingGroupSettings.color : defaultCalendarColor)
				     const groupRootId = calendarInfo.groupRoot._id
				     return m(".folder-row.flex-start.plr-l",
					     [
						     m(".flex.flex-grow.center-vertically.button-height", [
							     m(".calendar-checkbox", {
								     onclick: () => {
									     const newHiddenCalendars = new Set(this._hiddenCalendars)
									     this._hiddenCalendars.has(groupRootId)
										     ? newHiddenCalendars.delete(groupRootId)
										     : newHiddenCalendars.add(groupRootId)
									     this._setHiddenCalendars(newHiddenCalendars)
								     },
								     style: {
									     "border-color": colorValue,
									     "background": this._hiddenCalendars.has(groupRootId) ? "" : colorValue,
									     "margin-left": "-4px", // .folder-row > a adds -10px margin to other items but it has 6px padding
									     "transition": "all 0.3s",
									     "cursor": "pointer",
								     }
							     }),
							     m(".pl-m.b.flex-grow.text-ellipsis", {style: {width: 0}}, getCalendarName(calendarInfo.groupInfo, shared))
						     ]),
						     this._createCalendarActionDropdown(calendarInfo, colorValue, existingGroupSettings, userSettingsGroupRoot, shared)
					     ])
			     })
			: null
	}

	_setHiddenCalendars(newHiddenCalendars: Set<Id>) {
		this._hiddenCalendars = newHiddenCalendars
		deviceConfig.setHiddenCalendars(logins.getUserController().user._id, [...newHiddenCalendars])
	}

	_createCalendarActionDropdown(calendarInfo: CalendarInfo, colorValue: string, existingGroupSettings: ?GroupSettings, userSettingsGroupRoot: UserSettingsGroupRoot, sharedCalendar: boolean): Children {
		const {group, groupInfo, groupRoot} = calendarInfo
		return m(ButtonN, attachDropdown({
				label: "more_label",
				colors: ButtonColors.Nav, click: noOp,
				icon: () => Icons.More
			}, () => [
				{
					label: "edit_action",
					icon: () => Icons.Edit,
					click: () => this._onPressedEditCalendar(groupInfo, colorValue, existingGroupSettings, userSettingsGroupRoot, sharedCalendar),
					type: ButtonType.Dropdown,
				},
				{
					label: "sharing_label",
					icon: () => Icons.ContactImport,
					click: () => {
						if (logins.getUserController().isFreeAccount()) {
							showNotAvailableForFreeDialog(false)
						} else {
							showCalendarSharingDialog(groupInfo, sharedCalendar)
						}
					},
					type: ButtonType.Dropdown,
				},
				isApp()
					? null
					: {
						label: "import_action",
						icon: () => Icons.Import,
						click: () => showCalendarImportDialog(groupRoot),
						isVisible: () => hasCapabilityOnGroup(logins.getUserController().user, group, ShareCapability.Write),
						type: ButtonType.Dropdown,
					},
				isApp()
					? null
					: {
						label: "export_action",
						icon: () => Icons.Export,
						click: () => {
							const alarmInfoList = logins.getUserController().user.alarmInfoList
							alarmInfoList
							&& exportCalendar(getCalendarName(groupInfo, sharedCalendar), groupRoot, alarmInfoList.alarms, new Date(), getTimeZone())
						},
						isVisible: () => hasCapabilityOnGroup(logins.getUserController().user, group, ShareCapability.Read),
						type: ButtonType.Dropdown,
					},
				{
					label: "delete_action",
					icon: () => Icons.Trash,
					click: () => this._confirmDeleteCalendar(calendarInfo),
					isVisible: () => !sharedCalendar,
					type: ButtonType.Dropdown,
				},
			].filter(Boolean)
		))
	}

	_confirmDeleteCalendar(calendarInfo: CalendarInfo) {
		const calendarName = getCalendarName(calendarInfo.groupInfo, false)
		loadGroupMembers(calendarInfo.group).then(members => {
			const ownerMail = logins.getUserController().userGroupInfo.mailAddress
			const otherMembers = members.filter(member => member.info.mailAddress !== ownerMail)
			Dialog.confirm(() => (otherMembers.length > 0
				? lang.get("deleteSharedCalendarConfirm_msg", {"{calendar}": calendarName}) + " "
				: "") + lang.get("deleteCalendarConfirm_msg", {"{calendar}": calendarName}))
			      .then((confirmed) => {
					      if (confirmed) {
						      serviceRequestVoid(TutanotaService.CalendarService, HttpMethod.DELETE, createCalendarDeleteData({
							      groupRootId: calendarInfo.groupRoot._id
						      }))
							      .catch(NotFoundError, () => console.log("Calendar to be deleted was not found."))
					      }
				      }
			      )
		})
	}


	_onPressedEditCalendar(groupInfo: GroupInfo, colorValue: string, existingGroupSettings: ?GroupSettings, userSettingsGroupRoot: UserSettingsGroupRoot, shared: boolean) {
		showEditCalendarDialog({
			name: getCalendarName(groupInfo, shared),
			color: colorValue.substring(1),

		}, "edit_action", shared, (dialog, properties) => {
			if (!shared) {
				groupInfo.name = properties.name
				update(groupInfo)
			}
			// color always set for existing calendar
			if (existingGroupSettings) {
				existingGroupSettings.color = properties.color
				existingGroupSettings.name = (shared && properties.name !== groupInfo.name) ? properties.name : null
			} else {
				const newGroupSettings = Object.assign(createGroupSettings(), {
					group: groupInfo.group,
					color: properties.color,
					name: (shared && properties.name !== groupInfo.name) ? properties.name : null
				})
				userSettingsGroupRoot.groupSettings.push(newGroupSettings)
			}
			update(userSettingsGroupRoot)
			dialog.close()
		}, "save_action")
	}

	_onEventSelected(calendarEvent: CalendarEvent, domEvent: Event) {
		const domTarget = domEvent.currentTarget
		if (domTarget == null || !(domTarget instanceof HTMLElement)) {
			return
		}
		Promise.all([
			locator.mailModel.getUserMailboxDetails(),
			this._calendarInfos
		]).then(([mailboxDetails, calendarInfos]) => {
				new CalendarEventPopup(
					calendarEvent,
					calendarInfos,
					mailboxDetails,
					domTarget.getBoundingClientRect(),
					() => this._editEvent(calendarEvent)
				).show()
			}
		)
	}

	_editEvent(event: CalendarEvent) {
		Promise.all([this._calendarInfos, locator.mailModel.getUserMailboxDetails()])
		       .then(([calendarInfos, mailboxDetails]) => {
			       let p = Promise.resolve(event)
			       if (event.repeatRule) {
				       // in case of a repeat rule we want to show the start event for now to indicate that we edit all events.
				       p = load(CalendarEventTypeRef, event._id)
			       }
			       p.then(e => showCalendarEventDialog(getEventStart(e, getTimeZone()), calendarInfos, mailboxDetails, e))
			        .catch(NotFoundError, () => {
				        console.log("calendar event not found when clicking on the event")
			        })
		       })
	}

	_loadMonthIfNeeded(dayInMonth: Date): Promise<void> {
		const month = getMonth(dayInMonth, getTimeZone())
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
		let dateToUse: Date
		if (date == null) {
			switch (this._currentViewType) {
				case CalendarViewType.AGENDA:
					dateToUse = getNextHalfHour()
					break
				case CalendarViewType.MONTH:
					// use the current day if it is visible in the displayed month, otherwise use the start of the month
					let currentDayStartOfMonth = getMonth(new Date(), getTimeZone()).start
					let visibleStartOfMonth = getMonth(this.selectedDate(), getTimeZone()).start
					dateToUse = this._getNewEventStartDate(currentDayStartOfMonth, visibleStartOfMonth)
					break
				case CalendarViewType.WEEK:
					// use the current day if it is visible in the displayed week, otherwise use the start of the week
					const startOfTheWeekOffset = getStartOfTheWeekOffset(downcast(logins.getUserController().userSettingsGroupRoot.startOfTheWeek))
					let currentDayStartOfTheWeek = getStartOfWeek(new Date(), startOfTheWeekOffset)
					let visibleStartOfTheWeek = getStartOfWeek(this.selectedDate(), startOfTheWeekOffset)
					dateToUse = this._getNewEventStartDate(currentDayStartOfTheWeek, visibleStartOfTheWeek)
					break
				default: // DAY
					dateToUse = this._getNewEventStartDate(new Date(), this.selectedDate())
					break
			}
		} else {
			dateToUse = date
		}
		Promise.all([
			this._calendarInfos.isFulfilled() ? this._calendarInfos : showProgressDialog("pleaseWait_msg", this._calendarInfos),
			locator.mailModel.getUserMailboxDetails()
		]).then(([calendars, mailboxDetails]) => showCalendarEventDialog(dateToUse, calendars, mailboxDetails))
	}

	/**
	 * Provides the start date for a new event created with the new date button (no pre-selected time). Provides the next half hour if
	 * that time is on the current day and if the current day is visible in the current view, otherwise provides 6:00 on the first day of
	 * the visible view.
	 * @param currentDayStartOfView The start of the visible time period type (month, week, day) for the current day,
	 * e.g. if the month view is visible, the start of the current day's month
	 * @param visibleStartOfView The start of the visible time period
	 */
	_getNewEventStartDate(currentDayStartOfView: Date, visibleStartOfView: Date): Date {
		if (isSameDay(currentDayStartOfView, visibleStartOfView)) {
			let nextHalfHour = getNextHalfHour()
			// only use the next half hour if it is not already on the next day, i.e. the current time is <= 23:30
			if (isSameDay(nextHalfHour, new Date())) {
				return nextHalfHour
			}
		}
		return getHourOfDay(visibleStartOfView, DEFAULT_HOUR_OF_DAY)
	}

	view(): Children {
		return m(".main-view", m(this.viewSlider))
	}

	updateUrl(args: Object) {
		if (!args.view) {
			this._setUrl(this._currentViewType, this.selectedDate(), true)
		} else {
			this._currentViewType = CalendarViewTypeByValue[args.view]
				? args.view
				: CalendarViewType.MONTH
			const urlDateParam = args.date
			if (urlDateParam && this._currentViewType !== CalendarViewType.AGENDA) {
				// Unlike JS Luxon assumes local time zone when parsing and not UTC. That's what we want
				const luxonDate = DateTime.fromISO(urlDateParam)
				let date = new Date()
				if (luxonDate.isValid) {
					date = luxonDate.toJSDate()
				}
				if (this.selectedDate().getTime() !== date.getTime()) {
					this.selectedDate(date)
					m.redraw()
				}
			}
			deviceConfig.setDefaultCalendarView(logins.getUserController().user._id, this._currentViewType)
		}
	}

	_loadEvents(month: CalendarMonthTimeRange): Promise<*> {
		return this._calendarInfos.then((calendarInfos) => {
			// Because of the timezones and all day events, we might not load an event which we need to display.
			// So we add a margin on 24 hours to be sure we load everything we need. We will filter matching
			// events anyway.
			const startId = getEventElementMinId(month.start.getTime() - DAY_IN_MILLIS)
			const endId = geEventElementMaxId(month.end.getTime() + DAY_IN_MILLIS)
			// We collect events from all calendars together and then replace map synchronously.
			// This is important to replace the map synchronously to not get race conditions because we load different months in parallel.
			// We could replace map more often instead of aggregating events but this would mean creating even more (cals * months) maps.
			//
			// Note: there may be issues if we get entity update before other calendars finish loading but the chance is low and we do not
			// take care of this now.
			const aggregateShortEvents = []
			const aggregateLongEvents = []
			return Promise.each(calendarInfos.values(), (calendarInfo) => {
				const {groupRoot, longEvents} = calendarInfo
				return Promise.all([
					_loadReverseRangeBetween(CalendarEventTypeRef, groupRoot.shortEvents, endId, startId, worker, 200),
					longEvents.getAsync(),
				]).then(([shortEventsResult, longEvents]) => {
					aggregateShortEvents.push(...shortEventsResult.elements)
					aggregateLongEvents.push(...longEvents)
				})
			}).then(() => {
				const newEvents = this._cloneEvents()
				aggregateShortEvents
					.filter(e => {
						const eventStart = getEventStart(e, getTimeZone()).getTime()
						return eventStart >= month.start.getTime() && eventStart < month.end.getTime()
					}) // only events for the loaded month
					.forEach((e) => {
						addDaysForEvent(newEvents, e, month)
					})
				const zone = getTimeZone()
				aggregateLongEvents.forEach((e) => {
					if (e.repeatRule) {
						addDaysForRecurringEvent(newEvents, e, month, zone)
					} else {
						// Event through we get the same set of long events for each month we have to invoke this for each month
						// because addDaysForLongEvent adds days only for the specified month.
						addDaysForLongEvent(newEvents, e, month, zone)
					}
				})
				this._replaceEvents(newEvents)
			})
		})
	}

	entityEventReceived<T>(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		return this._calendarInfos.then((calendarEvents) => {
			return Promise.each(updates, update => {
				if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
					m.redraw()
				}

				if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
					if (update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) {
						return load(CalendarEventTypeRef, [update.instanceListId, update.instanceId])
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
						return this._calendarInfos.then(calendarInfos => {
							// Remove calendars we no longer have membership in
							calendarInfos.forEach((ci, group) => {
								if (calendarMemberships.every((mb) => group !== mb.group)) {
									this._hiddenCalendars.delete(group)
								}
							})
							if (calendarMemberships.length !== calendarInfos.size) {
								this._loadedMonths.clear()
								this._replaceEvents(new Map())
								this._calendarInfos = locator.calendarModel.loadCalendarInfos(new NoopProgressMonitor())
								return this._calendarInfos.then(() => {
									const selectedDate = this.selectedDate()
									const previousMonthDate = new Date(selectedDate)
									previousMonthDate.setMonth(selectedDate.getMonth() - 1)

									const nextMonthDate = new Date(selectedDate)
									nextMonthDate.setMonth(selectedDate.getMonth() + 1)
									return this._loadMonthIfNeeded(selectedDate)
									           .then(() => this._loadMonthIfNeeded(nextMonthDate))
									           .then(() => this._loadMonthIfNeeded(previousMonthDate))
								}).tap(() => m.redraw())
							}
						})
					}
				} else if (isUpdateForTypeRef(ReceivedGroupInvitationTypeRef, update)) {
					if (update.operation === OperationType.CREATE) {
						return load(ReceivedGroupInvitationTypeRef, [update.instanceListId, update.instanceId]).then(invitation => {
							this._calendarInvitations.push(invitation)
							m.redraw()
						})
					} else if (update.operation === OperationType.DELETE) {
						const found = findAndRemove(this._calendarInvitations, (invitation) => {
							return isSameId(invitation._id, [update.instanceListId, update.instanceId])
						})
						if (found) {
							m.redraw()
						}
					}

				} else if (isUpdateForTypeRef(GroupInfoTypeRef, update)) {
					this._calendarInfos.then(calendarInfos => {
						const calendarInfo = calendarInfos.get(eventOwnerGroupId) // ensure that it is a GroupInfo update for a calendar group.
						if (calendarInfo) {
							return load(GroupInfoTypeRef, [update.instanceListId, update.instanceId]).then(groupInfo => {
								calendarInfo.groupInfo = groupInfo;
								m.redraw()
							})
						}
					})

				}
			}).return()
		})
	}

	addOrUpdateEvent(calendarInfo: ?CalendarInfo, event: CalendarEvent) {
		const zone = getTimeZone()
		if (calendarInfo) {
			const eventListId = getListId(event)
			const eventMonth = getMonth(getEventStart(event, zone), zone)
			if (isSameId(calendarInfo.groupRoot.shortEvents, eventListId)) {
				// If the month is not loaded, we don't want to put it into events.
				// We will put it there when we load the month
				if (!this._loadedMonths.has(eventMonth.start.getTime())) {
					return
				}
				this._addDaysForEvent(event, eventMonth)
			} else if (isSameId(calendarInfo.groupRoot.longEvents, eventListId)) {
				this._removeExistingEvent(calendarInfo.longEvents.getLoaded(), event)
				calendarInfo.longEvents.getLoaded().push(event)
				this._loadedMonths.forEach(firstDayTimestamp => {
					const loadedMonth = getMonth(new Date(firstDayTimestamp), zone)
					if (event.repeatRule) {
						this._addDaysForRecurringEvent(event, loadedMonth)
					} else {
						this._addDaysForLongEvent(event, loadedMonth)
					}
				})
			}
		}
	}

	/**
	 * Removes existing event from {@param events} and also from {@code this._eventsForDays} if end time does not match
	 */
	_removeExistingEvent(events: Array<CalendarEvent>, newEvent: CalendarEvent) {
		const indexOfOldEvent = events.findIndex((el) => isSameEvent(el, newEvent))
		if (indexOfOldEvent !== -1) {
			const oldEvent = events[indexOfOldEvent]
			// If the old and new event end times do not match, we need to remove all occurrences of old event, otherwise iterating
			// occurrences of new event won't replace all occurrences of old event. Changes of start or repeat rule already change
			// ID of the event so it is not a problem.
			if (oldEvent.endTime.getTime() !== newEvent.endTime.getTime()) {
				const newMap = this._cloneEvents()
				newMap.forEach((dayEvents) =>
					// finding all because event can overlap with itself so a day can have multiple occurrences of the same event in it
					findAllAndRemove(dayEvents, (e) => isSameId(e._id, oldEvent._id)))
				this._replaceEvents(newMap)
			}
			events.splice(indexOfOldEvent, 1)
		}
	}

	_addDaysForEvent(event: CalendarEvent, month: CalendarMonthTimeRange) {
		const newMap = this._cloneEvents()
		addDaysForEvent(newMap, event, month)
		this._replaceEvents(newMap)
	}

	_replaceEvents(newMap: EventsForDays) {
		this._eventsForDays = freezeMap(newMap)
	}

	_cloneEvents(): EventsForDays {
		return new Map(this._eventsForDays)
	}

	_addDaysForRecurringEvent(event: CalendarEvent, month: CalendarMonthTimeRange) {
		if (-DateTime.fromJSDate(event.startTime).diffNow("year").years > LIMIT_PAST_EVENTS_YEARS) {
			console.log("repeating event is too far into the past", event)
			return
		}
		const newMap = this._cloneEvents()
		addDaysForRecurringEvent(newMap, event, month, getTimeZone())
		this._replaceEvents(newMap)
	}

	_removeDaysForEvent(id: IdTuple, ownerGroupId: Id) {
		const newMap = this._cloneEvents()
		newMap.forEach((dayEvents) =>
			findAllAndRemove(dayEvents, (e) => isSameId(e._id, id)))
		this._replaceEvents(newMap)
		if (this._calendarInfos.isFulfilled()) {
			const infos = this._calendarInfos.value()
			const info = infos.get(ownerGroupId)
			if (info) {
				if (isSameId(listIdPart(id), info.groupRoot.longEvents)) {
					findAndRemove(info.longEvents.getLoaded(), (e) => isSameId(e._id, id))
				}
			}
		}
	}

	_addDaysForLongEvent(event: CalendarEvent, month: CalendarMonthTimeRange) {
		const newMap = this._cloneEvents()
		addDaysForLongEvent(newMap, event, month)
		this._replaceEvents(newMap)
	}

	getViewSlider(): ViewSlider {
		return this.viewSlider
	}

	_setUrl(view: string, date: Date, replace: boolean = false) {
		const dateString = DateTime.fromJSDate(date).toISODate()
		m.route.set("/calendar/:view/:date", {view, date: dateString}, {replace})
	}
}