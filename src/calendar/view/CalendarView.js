// @flow
import m from "mithril"
import {serviceRequestVoid, update} from "../../api/main/Entity"
import type {CurrentView} from "../../gui/base/Header"
import {ColumnType, ViewColumn} from "../../gui/base/ViewColumn"
import {lang} from "../../misc/LanguageViewModel"
import {ViewSlider} from "../../gui/base/ViewSlider"
import type {Shortcut} from "../../misc/KeyManager"
import {keyManager} from "../../misc/KeyManager"
import {Icons} from "../../gui/base/icons/Icons"
import {incrementDate} from "@tutao/tutanota-utils"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {CalendarEventTypeRef} from "../../api/entities/tutanota/CalendarEvent"
import {logins} from "../../api/main/LoginController"
import {HttpMethod} from "../../api/common/EntityFunctions"
import {defaultCalendarColor, GroupType, Keys, reverse, ShareCapability, TimeFormat} from "../../api/common/TutanotaConstants"
import {locator} from "../../api/main/MainLocator"
import {downcast, memoized} from "@tutao/tutanota-utils"
import {getEventStart, getStartOfTheWeekOffset, getStartOfWeek, getTimeZone, shouldDefaultToAmPmTimeFormat,} from "../date/CalendarUtils"
import {ButtonColors, ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {formatDateWithWeekday, formatDateWithWeekdayAndYearLong, formatMonthWithFullYear} from "../../misc/Formatter"
import {NavButtonN} from "../../gui/base/NavButtonN"
import {CalendarMonthView} from "./CalendarMonthView"
import {DateTime} from "luxon"
import {NotFoundError} from "../../api/common/error/RestError"
import {CalendarAgendaView} from "./CalendarAgendaView"
import type {GroupInfo} from "../../api/entities/sys/GroupInfo"
import {showEditCalendarDialog} from "./EditCalendarDialog"
import type {GroupSettings} from "../../api/entities/tutanota/GroupSettings"
import {createGroupSettings} from "../../api/entities/tutanota/GroupSettings"
import {TutanotaService} from "../../api/entities/tutanota/Services"
import {createCalendarDeleteData} from "../../api/entities/tutanota/CalendarDeleteData"
import {styles} from "../../gui/styles"
import {MultiDayCalendarView} from "./MultiDayCalendarView"
import {Dialog} from "../../gui/base/Dialog"
import {isApp} from "../../api/common/Env"
import type {UserSettingsGroupRoot} from "../../api/entities/tutanota/UserSettingsGroupRoot"
import {size} from "../../gui/size"
import {FolderColumnView} from "../../gui/base/FolderColumnView"
import {deviceConfig} from "../../misc/DeviceConfig"
import {exportCalendar, showCalendarImportDialog} from "../export/CalendarImporterDialog"
import {CalendarEventViewModel, createCalendarEventViewModel} from "../date/CalendarEventViewModel"
import {showNotAvailableForFreeDialog} from "../../misc/SubscriptionDialogs"
import {getSharedGroupName, hasCapabilityOnGroup, loadGroupMembers} from "../../sharing/GroupUtils"
import {showGroupSharingDialog} from "../../sharing/view/GroupSharingDialog"
import {GroupInvitationFolderRow} from "../../sharing/view/GroupInvitationFolderRow"
import {SidebarSection} from "../../gui/SidebarSection"
import type {HtmlSanitizer} from "../../misc/HtmlSanitizer"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"
import {ofClass} from "@tutao/tutanota-utils"
import {createMoreActionButtonAttrs} from "../../gui/base/GuiUtils"
import {renderCalendarSwitchLeftButton, renderCalendarSwitchRightButton} from "./CalendarGuiUtils"
import type {CalendarViewTypeEnum, MouseOrPointerEvent} from "./CalendarViewModel"
import {CalendarViewModel, CalendarViewType} from "./CalendarViewModel"
import {LazyLoaded} from "@tutao/tutanota-utils"
import {showCalendarEventDialog} from "./CalendarEventEditDialog"
import {CalendarEventPopup} from "./CalendarEventPopup"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import type {CalendarInfo} from "../model/CalendarModel"
import {ReceivedGroupInvitationsModel} from "../../sharing/model/ReceivedGroupInvitationsModel"
import {client} from "../../misc/ClientDetector"

export const SELECTED_DATE_INDICATOR_THICKNESS = 4

export type GroupColors = Map<Id, string>
const CalendarViewTypeByValue = reverse(CalendarViewType)

// noinspection JSUnusedGlobalSymbols
export class CalendarView implements CurrentView {

	sidebarColumn: ViewColumn
	contentColumn: ViewColumn
	viewSlider: ViewSlider
	_currentViewType: CalendarViewTypeEnum
	_calendarViewModel: CalendarViewModel

	// For sanitizing event descriptions, which get rendered as html in the CalendarEventPopup
	+_htmlSanitizer: Promise<HtmlSanitizer>
	oncreate: Function;
	onremove: Function;

	constructor() {
		const userId = logins.getUserController().user._id
		const calendarInvitations = new ReceivedGroupInvitationsModel(GroupType.Calendar, locator.eventController, locator.entityClient, logins)
		calendarInvitations.init()
		this._calendarViewModel = new CalendarViewModel(logins, this._createCalendarEventViewModel, locator.calendarModel, locator.entityClient, locator.eventController, locator.progressTracker, deviceConfig, calendarInvitations)
		this._currentViewType = deviceConfig.getDefaultCalendarView(userId) || CalendarViewType.MONTH
		this._htmlSanitizer = import("../../misc/HtmlSanitizer").then(m => m.htmlSanitizer)

		this.sidebarColumn = new ViewColumn({
				view: () => m(FolderColumnView, {
					button: styles.isUsingBottomNavigation()
						? null
						: {
							label: 'newEvent_action',
							click: () => this._createNewEventDialog(),
						},
					content: [
						m(SidebarSection, {
							name: "view_label",
							buttonAttrs: (this._currentViewType !== CalendarViewType.AGENDA)
								? {
									label: "today_label",
									click: () => {
										this._setUrl(m.route.param("view"), new Date())
									},
									colors: ButtonColors.Nav,
									type: ButtonType.Primary,
								}
								: null
						}, this._renderCalendarViewButtons()),
						m(SidebarSection, {
							name: "yourCalendars_label",
							buttonAttrs: {
								label: "addCalendar_action",
								colors: ButtonColors.Nav,
								click: () => this._onPressedAddCalendar(),
								icon: () => Icons.Add
							}
						}, this._renderCalendars(false)),
						m(SidebarSection, {name: "otherCalendars_label"}, this._renderCalendars(true)),
						this._calendarViewModel.calendarInvitations().length > 0
							? m(SidebarSection, {
								name: "calendarInvitations_label"
							}, this._calendarViewModel.calendarInvitations().map((invitation) => m(GroupInvitationFolderRow, {invitation})))
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
				acc.set(gc.group, gc.color)
				return acc
			}, new Map())
		})

		this.contentColumn = new ViewColumn({
			view: () => {
				const groupColors = getGroupColors(logins.getUserController().userSettingsGroupRoot)

				switch (this._currentViewType) {
					case CalendarViewType.MONTH:
						return m(CalendarMonthView, {
							temporaryEvents: this._calendarViewModel.temporaryEvents,
							eventsForDays: this._calendarViewModel.eventsForDays,
							getEventsOnDays: this._calendarViewModel.getEventsOnDays.bind(this._calendarViewModel),
							onEventClicked: (calendarEvent, domEvent) => this._onEventSelected(calendarEvent, domEvent, this._htmlSanitizer),
							onNewEvent: (date) => {
								this._createNewEventDialog(date)
							},
							selectedDate: this._calendarViewModel.selectedDate(),
							onDateSelected: (date, calendarViewType) => {
								this._setUrl(calendarViewType, date)
							},
							onChangeMonth: (next) => this._viewPeriod(next, CalendarViewType.MONTH),
							amPmFormat: logins.getUserController().userSettingsGroupRoot.timeFormat === TimeFormat.TWELVE_HOURS,
							startOfTheWeek: downcast(logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
							groupColors,
							hiddenCalendars: this._calendarViewModel.hiddenCalendars,
							dragHandlerCallbacks: this._calendarViewModel
						})
					case CalendarViewType.DAY:
						return m(MultiDayCalendarView, {
							temporaryEvents: this._calendarViewModel.temporaryEvents,
							getEventsOnDays: this._calendarViewModel.getEventsOnDays.bind(this._calendarViewModel),
							renderHeaderText: formatDateWithWeekdayAndYearLong,
							daysInPeriod: 1,
							onEventClicked: (event, domEvent) => this._onEventSelected(event, domEvent, this._htmlSanitizer),
							onNewEvent: (date) => {
								this._createNewEventDialog(date)
							},
							selectedDate: this._calendarViewModel.selectedDate(),
							onDateSelected: (date) => {
								this._calendarViewModel.selectedDate(date)
								m.redraw()
								this._setUrl(CalendarViewType.DAY, date)
							},
							groupColors,
							hiddenCalendars: this._calendarViewModel.hiddenCalendars,
							onChangeViewPeriod: (next) => this._viewPeriod(next, CalendarViewType.DAY),
							startOfTheWeek: downcast(logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
							dragHandlerCallbacks: this._calendarViewModel
						})
					case CalendarViewType.WEEK:
						return m(MultiDayCalendarView, {
							temporaryEvents: this._calendarViewModel.temporaryEvents,
							getEventsOnDays: this._calendarViewModel.getEventsOnDays.bind(this._calendarViewModel),
							daysInPeriod: 7,
							renderHeaderText: date => {
								const startOfTheWeekOffset = getStartOfTheWeekOffset(downcast(logins.getUserController().userSettingsGroupRoot.startOfTheWeek))
								const firstDate = getStartOfWeek(date, startOfTheWeekOffset)
								const lastDate = incrementDate(new Date(firstDate), 6)
								if (firstDate.getMonth() !== lastDate.getMonth()) {
									return `${lang.formats.monthLong.format(firstDate)} - ${lang.formats.monthLong.format(lastDate)} ${lang.formats.yearNumeric.format(firstDate)}`
								} else {
									return `${lang.formats.monthLong.format(firstDate)} ${lang.formats.yearNumeric.format(firstDate)}`
								}
							},
							onEventClicked: (event, domEvent) => this._onEventSelected(event, domEvent, this._htmlSanitizer),
							onNewEvent: (date) => {
								this._createNewEventDialog(date)
							},
							selectedDate: this._calendarViewModel.selectedDate(),
							onDateSelected: (date, viewType) => {
								this._setUrl(viewType ?? CalendarViewType.WEEK, date)
							},
							startOfTheWeek: downcast(logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
							groupColors,
							hiddenCalendars: this._calendarViewModel.hiddenCalendars,
							onChangeViewPeriod: (next) => this._viewPeriod(next, CalendarViewType.WEEK),
							dragHandlerCallbacks: this._calendarViewModel
						})
					case CalendarViewType.AGENDA:
						return m(CalendarAgendaView, {
							eventsForDays: this._calendarViewModel.eventsForDays,
							amPmFormat: shouldDefaultToAmPmTimeFormat(),
							onEventClicked: (event, domEvent) => this._onEventSelected(event, domEvent, this._htmlSanitizer),
							groupColors,
							hiddenCalendars: this._calendarViewModel.hiddenCalendars,
							onDateSelected: (date) => {
								this._setUrl(CalendarViewType.DAY, date)
							},
						})
					default:
						throw new ProgrammingError(`invalid CalendarViewType: "${this._currentViewType}"`)
				}
			},
		}, ColumnType.Background, size.second_col_min_width + size.third_col_min_width, size.third_col_max_width, () => {

			const left = (title) => renderCalendarSwitchLeftButton(title, () => this._viewPeriod(false, this._currentViewType))
			const right = (title) => renderCalendarSwitchRightButton(title, () => this._viewPeriod(true, this._currentViewType))

			return {
				[CalendarViewType.DAY]: {
					left: left("prevDay_label"),
					middle: formatDateWithWeekday(this._calendarViewModel.selectedDate()),
					right: right("nextDay_label")
				},
				// week view doesn't exist on mobile so we don't bother making buttons/title
				[CalendarViewType.WEEK]: "",
				[CalendarViewType.MONTH]: {
					left: left("prevMonth_label"),
					middle: formatMonthWithFullYear(this._calendarViewModel.selectedDate()),
					right: right("nextMonth_label")
				},
				[CalendarViewType.AGENDA]: lang.get("agenda_label")
			}[this._currentViewType]
		})

		this.viewSlider = new ViewSlider([this.sidebarColumn, this.contentColumn], "CalendarView")

		const shortcuts = this._setupShortcuts();

		const streamListeners = []
		this.oncreate = () => {
			keyManager.registerShortcuts(shortcuts)
			streamListeners.push(this._calendarViewModel.calendarInvitations.map(invitations => {
				m.redraw()
			}))
			streamListeners.push(this._calendarViewModel.redraw.map(m.redraw))
		}
		this.onremove = () => {
			keyManager.unregisterShortcuts(shortcuts)
			for (let listener of streamListeners) {
				listener.end(true)
			}
		}
	}


	_setupShortcuts(): Shortcut[] {
		return [
			{
				key: Keys.ONE,
				exec: () => this._setUrl(CalendarViewType.WEEK, this._calendarViewModel.selectedDate()),
				help: "switchWeekView_action"
			},
			{
				key: Keys.TWO,
				exec: () => this._setUrl(CalendarViewType.MONTH, this._calendarViewModel.selectedDate()),
				help: "switchMonthView_action"
			},
			{
				key: Keys.THREE,
				exec: () => this._setUrl(CalendarViewType.AGENDA, this._calendarViewModel.selectedDate()),
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
				exec: () => this._viewPeriod(true, this._currentViewType),
				help: "viewNextPeriod_action"
			},
			{
				key: Keys.K,
				enabled: () => this._currentViewType !== CalendarViewType.AGENDA,
				exec: () => this._viewPeriod(false, this._currentViewType),
				help: "viewPrevPeriod_action"
			},
			{
				key: Keys.N,
				exec: () => {
					this._createNewEventDialog()
				},
				help: "newEvent_action"
			}
		]
	}


	_createNewEventDialog(date?: ?Date) {
		const dateToUse = date ?? this._calendarViewModel.selectedDate()
		// Disallow creation of events when there is no existing calendar
		let calendarInfos = this._calendarViewModel.getCalendarInfosCreateIfNeeded()
		if (calendarInfos instanceof Promise) {
			calendarInfos = showProgressDialog("pleaseWait_msg", calendarInfos)
		}
		Promise.all([
			calendarInfos,
			locator.mailModel.getUserMailboxDetails()
		]).then(([calendars, mailboxDetails]) => showCalendarEventDialog(dateToUse, calendars, mailboxDetails))
	}


	_editEventDialog(event: CalendarEvent) {
		Promise.all([this._calendarViewModel.calendarInfos.getAsync(), locator.mailModel.getUserMailboxDetails()])
		       .then(([calendarInfos, mailboxDetails]) => {
			       let p = Promise.resolve(event)
			       if (event.repeatRule) {
				       // in case of a repeat rule we want to show the start event for now to indicate that we edit all events.
				       p = locator.entityClient.load(CalendarEventTypeRef, event._id)
			       }
			       p.then(e => showCalendarEventDialog(getEventStart(e, getTimeZone()), calendarInfos, mailboxDetails, e))
			        .catch(ofClass(NotFoundError, () => {
				        console.log("calendar event not found when clicking on the event")
			        }))
		       })
	}

	_viewPeriod(next: boolean, viewType: CalendarViewTypeEnum) {

		let duration, unit
		switch (viewType) {
			case CalendarViewType.MONTH:
				duration = {month: 1}
				unit = "month"
				break
			case CalendarViewType.WEEK:
				duration = {week: 1}
				unit = "week"
				break
			case CalendarViewType.DAY:
				duration = {day: 1}
				unit = "day"
				break
			default:
				throw new ProgrammingError("Invalid CalendarViewType: " + viewType)
		}

		const dateTime = DateTime.fromJSDate(this._calendarViewModel.selectedDate())
		const newDate = next
			? dateTime.plus(duration).startOf(unit).toJSDate()
			: dateTime.minus(duration).startOf(unit).toJSDate()
		this._calendarViewModel.selectedDate(newDate)
		m.redraw()
		this._setUrl(viewType, newDate)
	}

	_renderCalendarViewButtons(): Children {
		const calendarViewValues = [
			{name: lang.get("month_label"), value: CalendarViewType.MONTH, icon: Icons.Table, href: "/calendar/month"},
			{name: lang.get("agenda_label"), value: CalendarViewType.AGENDA, icon: Icons.ListUnordered, href: "/calendar/agenda"},
		]
		if (styles.isDesktopLayout()) {
			calendarViewValues.unshift(
				{name: lang.get("week_label"), value: CalendarViewType.WEEK, icon: Icons.TableColumns, href: "/calendar/week"}
			)
		}
		if (client.isDesktopDevice()) {
			calendarViewValues.unshift(
				{name: lang.get("day_label"), value: CalendarViewType.DAY, icon: Icons.TableSingle, href: "/calendar/day"},
			)
		}

		return calendarViewValues.map(viewType => m(".folder-row.flex-start.plr-l",
			// undo the padding of NavButton and prevent .folder-row > a from selecting NavButton
			m(".flex-grow.ml-negative-s", m(NavButtonN, {
				label: () => viewType.name,
				icon: () => viewType.icon,
				href: m.route.get(),
				isSelectedPrefix: viewType.href,
				colors: ButtonColors.Nav,
				// Close side menu
				click: () => {
					this._setUrl(viewType.value, this._calendarViewModel.selectedDate())
					this.viewSlider.focus(this.contentColumn)
				}
			}))
		))
	}

	headerRightView(): Children {
		return m(ButtonN, {
			label: 'newEvent_action',
			click: () => this._createNewEventDialog(),
			icon: () => Icons.Add,
			type: ButtonType.Action,
			colors: ButtonColors.Header
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
			import("../../misc/SubscriptionDialogs")
				.then((SubscriptionDialogUtils) => SubscriptionDialogUtils.checkPremiumSubscription(true))
				.then(ok => {
					if (ok) {
						this._showCreateCalendarDialog()
					}
				})
		}
	}

	_showCreateCalendarDialog() {
		showEditCalendarDialog({name: "", color: Math.random().toString(16).slice(-6)}, "add_action", false, (dialog, properties) => {
			locator.calendarModel.createCalendar(properties.name, properties.color)
			       .then(() => dialog.close())
		}, "save_action")
	}

	_renderCalendars(shared: boolean): Children {
		return this._calendarViewModel.calendarInfos.isLoaded() ?
			Array.from(this._calendarViewModel.calendarInfos.getLoaded().values())
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
									     const newHiddenCalendars = new Set(this._calendarViewModel.hiddenCalendars)
									     this._calendarViewModel.hiddenCalendars.has(groupRootId)
										     ? newHiddenCalendars.delete(groupRootId)
										     : newHiddenCalendars.add(groupRootId)
									     this._calendarViewModel.setHiddenCalendars(newHiddenCalendars)
								     },
								     style: {
									     "border-color": colorValue,
									     "background": this._calendarViewModel.hiddenCalendars.has(groupRootId) ? "" : colorValue,
									     "transition": "all 0.3s",
									     "cursor": "pointer",
								     }
							     }),
							     m(".pl-m.b.flex-grow.text-ellipsis", {style: {width: 0}}, getSharedGroupName(calendarInfo.groupInfo, shared))
						     ]),
						     this._createCalendarActionDropdown(calendarInfo, colorValue, existingGroupSettings, userSettingsGroupRoot, shared)
					     ])
			     })
			: null
	}


	_createCalendarActionDropdown(calendarInfo: CalendarInfo, colorValue: string, existingGroupSettings: ?GroupSettings, userSettingsGroupRoot: UserSettingsGroupRoot, sharedCalendar: boolean): Children {
		const {group, groupInfo, groupRoot} = calendarInfo
		return m(ButtonN, createMoreActionButtonAttrs(() => [
				{
					label: "edit_action",
					icon: () => Icons.Edit,
					click: () => this._onPressedEditCalendar(groupInfo, colorValue, existingGroupSettings, userSettingsGroupRoot, sharedCalendar),
				},
				{
					label: "sharing_label",
					icon: () => Icons.ContactImport,
					click: () => {
						if (logins.getUserController().isFreeAccount()) {
							showNotAvailableForFreeDialog(false)
						} else {
							showGroupSharingDialog(groupInfo, sharedCalendar)
						}
					},
				},
				isApp()
					? null
					: {
						label: "import_action",
						icon: () => Icons.Import,
						click: () => showCalendarImportDialog(groupRoot),
						isVisible: () => group.type === GroupType.Calendar
							&& hasCapabilityOnGroup(logins.getUserController().user, group, ShareCapability.Write),
					},
				isApp()
					? null
					: {
						label: "export_action",
						icon: () => Icons.Export,
						click: () => {
							const alarmInfoList = logins.getUserController().user.alarmInfoList
							alarmInfoList
							&& exportCalendar(getSharedGroupName(groupInfo, sharedCalendar), groupRoot, alarmInfoList.alarms, new Date(), getTimeZone())
						},
						isVisible: () => group.type === GroupType.Calendar
							&& hasCapabilityOnGroup(logins.getUserController().user, group, ShareCapability.Read),
					},
				{
					label: "delete_action",
					icon: () => Icons.Trash,
					click: () => this._confirmDeleteCalendar(calendarInfo),
					isVisible: () => !sharedCalendar,
				},
			].filter(Boolean)
		))
	}

	_confirmDeleteCalendar(calendarInfo: CalendarInfo) {
		const calendarName = getSharedGroupName(calendarInfo.groupInfo, false)
		loadGroupMembers(calendarInfo.group, locator.entityClient).then(members => {
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
							      .catch(ofClass(NotFoundError, () => console.log("Calendar to be deleted was not found.")))
					      }
				      }
			      )
		})
	}


	_onPressedEditCalendar(groupInfo: GroupInfo, colorValue: string, existingGroupSettings: ?GroupSettings, userSettingsGroupRoot: UserSettingsGroupRoot, shared: boolean) {
		showEditCalendarDialog({
			name: getSharedGroupName(groupInfo, shared),
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


	view(): Children {
		return m(".main-view", m(this.viewSlider))
	}

	updateUrl(args: Object) {
		if (!args.view) {
			this._setUrl(this._currentViewType, this._calendarViewModel.selectedDate(), true)
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
				if (this._calendarViewModel.selectedDate().getTime() !== date.getTime()) {
					this._calendarViewModel.selectedDate(date)
					m.redraw()
				}
			}
			deviceConfig.setDefaultCalendarView(logins.getUserController().user._id, this._currentViewType)
		}
	}

	getViewSlider(): ViewSlider {
		return this.viewSlider
	}

	_setUrl(view: string, date: Date, replace: boolean = false) {
		const dateString = DateTime.fromJSDate(date).toISODate()
		m.route.set("/calendar/:view/:date", {view, date: dateString}, {replace})
	}

	async _createCalendarEventViewModel(event: CalendarEvent, calendarInfo: LazyLoaded<Map<Id, CalendarInfo>>): Promise<CalendarEventViewModel> {
		const [mailboxDetails, calendarInfos] = await Promise.all([
			locator.mailModel.getUserMailboxDetails(),
			calendarInfo.getAsync(),
		])
		return createCalendarEventViewModel(getEventStart(event, getTimeZone()), calendarInfos, mailboxDetails,
			event, null, false)
	}

	async _onEventSelected(calendarEvent: CalendarEvent, domEvent: MouseOrPointerEvent, htmlSanitizerPromise: Promise<HtmlSanitizer>) {

		const domTarget = domEvent.currentTarget
		if (domTarget == null || !(domTarget instanceof HTMLElement)) {
			return
		}

		const x = domEvent.clientX
		const y = domEvent.clientY

		const [viewModel, htmlSanitizer] = await Promise.all([
			this._createCalendarEventViewModel(calendarEvent, this._calendarViewModel.calendarInfos),
			htmlSanitizerPromise
		])

		// We want the popup to show at the users mouse
		const rect = {
			bottom: y,
			height: 0,
			width: 0,
			top: y,
			left: x,
			right: x,
		}

		new CalendarEventPopup(
			calendarEvent,
			rect,
			htmlSanitizer,
			() => this._editEventDialog(calendarEvent),
			viewModel
		).show()
	}

}