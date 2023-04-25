import m, { Children, Component, Vnode } from "mithril"
import { AppHeaderAttrs, Header } from "../../gui/Header.js"
import { ColumnType, ViewColumn } from "../../gui/base/ViewColumn"
import { lang } from "../../misc/LanguageViewModel"
import { ViewSlider } from "../../gui/nav/ViewSlider.js"
import type { Shortcut } from "../../misc/KeyManager"
import { keyManager } from "../../misc/KeyManager"
import { Icons } from "../../gui/base/icons/Icons"
import { downcast, getStartOfDay, memoized, ofClass } from "@tutao/tutanota-utils"
import type { CalendarEvent, CalendarEventAttendee, GroupSettings, UserSettingsGroupRoot } from "../../api/entities/tutanota/TypeRefs.js"
import { createGroupSettings } from "../../api/entities/tutanota/TypeRefs.js"
import { defaultCalendarColor, FeatureType, GroupType, Keys, reverse, ShareCapability, TimeFormat } from "../../api/common/TutanotaConstants"
import { locator } from "../../api/main/MainLocator"
import { getEventType, getTimeZone, shouldDefaultToAmPmTimeFormat } from "../date/CalendarUtils"
import { Button, ButtonColor, ButtonType } from "../../gui/base/Button.js"
import { NavButton, NavButtonColor } from "../../gui/base/NavButton.js"
import { CalendarMonthView } from "./CalendarMonthView"
import { DateTime } from "luxon"
import { NotFoundError } from "../../api/common/error/RestError"
import { CalendarAgendaView } from "./CalendarAgendaView"
import type { GroupInfo } from "../../api/entities/sys/TypeRefs.js"
import { showEditCalendarDialog } from "./EditCalendarDialog"
import { styles } from "../../gui/styles"
import { MultiDayCalendarView } from "./MultiDayCalendarView"
import { Dialog } from "../../gui/base/Dialog"
import { isApp } from "../../api/common/Env"
import { px, size } from "../../gui/size"
import { FolderColumnView } from "../../gui/FolderColumnView.js"
import { deviceConfig } from "../../misc/DeviceConfig"
import { exportCalendar, showCalendarImportDialog } from "../export/CalendarImporterDialog"
import { showNotAvailableForFreeDialog } from "../../misc/SubscriptionDialogs"
import { getSharedGroupName, hasCapabilityOnGroup, loadGroupMembers } from "../../sharing/GroupUtils"
import { showGroupSharingDialog } from "../../sharing/view/GroupSharingDialog"
import { GroupInvitationFolderRow } from "../../sharing/view/GroupInvitationFolderRow"
import { SidebarSection } from "../../gui/SidebarSection"
import type { HtmlSanitizer } from "../../misc/HtmlSanitizer"
import { ProgrammingError } from "../../api/common/error/ProgrammingError"
import { calendarNavConfiguration, CalendarViewType } from "./CalendarGuiUtils"
import { CalendarViewModel, MouseOrPointerEvent, resolveCalendarEventProgenitor } from "./CalendarViewModel"
import { CalendarEventEditMode, showNewCalendarEventEditDialog } from "./eventeditor/CalendarEventEditDialog.js"
import { CalendarEventPopup } from "./eventpopup/CalendarEventPopup.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import type { CalendarInfo } from "../model/CalendarModel"
import { client } from "../../misc/ClientDetector"
import type Stream from "mithril/stream"
import { IconButton } from "../../gui/base/IconButton.js"
import { createDropdown } from "../../gui/base/Dropdown.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { BottomNav } from "../../gui/nav/BottomNav.js"
import { DrawerMenuAttrs } from "../../gui/nav/DrawerMenu.js"
import { BaseTopLevelView } from "../../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { getEnabledMailAddressesWithUser } from "../../mail/model/MailUtils.js"
import { CalendarEventPopupViewModel } from "./eventpopup/CalendarEventPopupViewModel.js"
import { isCustomizationEnabledForCustomer } from "../../api/common/utils/Utils.js"
import { findAttendeeInAddresses, getEventWithDefaultTimes } from "../../api/common/utils/CommonCalendarUtils.js"
import { BackgroundColumnLayout } from "../../gui/BackgroundColumnLayout.js"
import { theme } from "../../gui/theme.js"
import { CalendarMobileHeader } from "./CalendarMobileHeader.js"
import { CalendarDesktopToolbar } from "./CalendarDesktopToolbar.js"

export type GroupColors = Map<Id, string>

export interface CalendarViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	calendarViewModel: CalendarViewModel
}

const CalendarViewTypeByValue = reverse(CalendarViewType)

export class CalendarView extends BaseTopLevelView implements TopLevelView<CalendarViewAttrs> {
	private readonly sidebarColumn: ViewColumn
	private readonly contentColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	private currentViewType: CalendarViewType
	private readonly viewModel: CalendarViewModel
	// For sanitizing event descriptions, which get rendered as html in the CalendarEventPopup
	private readonly htmlSanitizer: Promise<HtmlSanitizer>
	oncreate: Component["oncreate"]
	onremove: Component["onremove"]

	constructor(vnode: Vnode<CalendarViewAttrs>) {
		super()
		const userId = locator.logins.getUserController().user._id

		this.viewModel = vnode.attrs.calendarViewModel
		this.currentViewType = deviceConfig.getDefaultCalendarView(userId) || CalendarViewType.MONTH
		this.htmlSanitizer = import("../../misc/HtmlSanitizer").then((m) => m.htmlSanitizer)
		this.sidebarColumn = new ViewColumn(
			{
				view: () =>
					m(FolderColumnView, {
						drawer: vnode.attrs.drawerAttrs,
						button: styles.isUsingBottomNavigation()
							? null
							: {
									type: ButtonType.FolderColumnHeader,
									label: "newEvent_action",
									click: () => this._createNewEventDialog(),
							  },
						content: [
							m(
								SidebarSection,
								{
									name: "view_label",
									button:
										this.currentViewType !== CalendarViewType.AGENDA
											? m(Button, {
													label: "today_label",
													click: () => {
														this._setUrl(m.route.param("view"), new Date())
														this.viewSlider.focus(this.contentColumn)
													},
													colors: ButtonColor.Nav,
													type: ButtonType.Primary,
											  })
											: null,
								},
								this._renderCalendarViewButtons(),
							),
							m(
								SidebarSection,
								{
									name: "yourCalendars_label",
									button: m(IconButton, {
										title: "addCalendar_action",
										colors: ButtonColor.Nav,
										click: () => this._onPressedAddCalendar(),
										icon: Icons.Add,
										size: ButtonSize.Compact,
									}),
								},
								this._renderCalendars(false),
							),
							m(
								SidebarSection,
								{
									name: "otherCalendars_label",
								},
								this._renderCalendars(true),
							),
							this.viewModel.calendarInvitations().length > 0
								? m(
										SidebarSection,
										{
											name: "calendarInvitations_label",
										},
										this.viewModel.calendarInvitations().map((invitation) =>
											m(GroupInvitationFolderRow, {
												invitation,
											}),
										),
								  )
								: null,
						],
						ariaLabel: "calendar_label",
					}),
			},
			ColumnType.Foreground,
			size.first_col_min_width,
			size.first_col_max_width,
			() => (this.currentViewType === CalendarViewType.WEEK ? lang.get("month_label") : lang.get("calendar_label")),
		)
		const getGroupColors = memoized((userSettingsGroupRoot: UserSettingsGroupRoot) => {
			return userSettingsGroupRoot.groupSettings.reduce((acc, gc) => {
				acc.set(gc.group, gc.color)
				return acc
			}, new Map())
		})
		this.contentColumn = new ViewColumn(
			{
				view: () => {
					const groupColors = getGroupColors(locator.logins.getUserController().userSettingsGroupRoot)

					switch (this.currentViewType) {
						case CalendarViewType.MONTH:
							return m(BackgroundColumnLayout, {
								backgroundColor: theme.navigation_bg,
								desktopToolbar: () => this.renderDesktopToolbar(),
								mobileHeader: () => this.renderMobileHeader(vnode.attrs.header),
								columnLayout: m(CalendarMonthView, {
									temporaryEvents: this.viewModel.temporaryEvents,
									eventsForDays: this.viewModel.eventsForDays,
									getEventsOnDays: this.viewModel.getEventsOnDays.bind(this.viewModel),
									onEventClicked: (calendarEvent, domEvent) => this._onEventSelected(calendarEvent, domEvent, this.htmlSanitizer),
									onNewEvent: (date) => {
										this._createNewEventDialog(date)
									},
									selectedDate: this.viewModel.selectedDate(),
									onDateSelected: (date, calendarViewType) => {
										this._setUrl(calendarViewType, date)
									},
									onChangeMonth: (next) => this._viewPeriod(CalendarViewType.MONTH, next),
									amPmFormat: locator.logins.getUserController().userSettingsGroupRoot.timeFormat === TimeFormat.TWELVE_HOURS,
									startOfTheWeek: downcast(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
									groupColors,
									hiddenCalendars: this.viewModel.hiddenCalendars,
									dragHandlerCallbacks: this.viewModel,
								}),
							})
						case CalendarViewType.DAY:
							return m(BackgroundColumnLayout, {
								backgroundColor: theme.navigation_bg,
								desktopToolbar: () => this.renderDesktopToolbar(),
								mobileHeader: () => this.renderMobileHeader(vnode.attrs.header),
								columnLayout: m(MultiDayCalendarView, {
									temporaryEvents: this.viewModel.temporaryEvents,
									getEventsOnDays: this.viewModel.getEventsOnDays.bind(this.viewModel),
									daysInPeriod: 1,
									onEventClicked: (event, domEvent) => this._onEventSelected(event, domEvent, this.htmlSanitizer),
									onNewEvent: (date) => {
										this._createNewEventDialog(date)
									},
									selectedDate: this.viewModel.selectedDate(),
									onDateSelected: (date) => {
										this.viewModel.selectedDate(date)

										m.redraw()

										this._setUrl(CalendarViewType.DAY, date)
									},
									groupColors,
									hiddenCalendars: this.viewModel.hiddenCalendars,
									onChangeViewPeriod: (next) => this._viewPeriod(CalendarViewType.DAY, next),
									startOfTheWeek: downcast(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
									dragHandlerCallbacks: this.viewModel,
								}),
							})

						case CalendarViewType.WEEK:
							return m(BackgroundColumnLayout, {
								backgroundColor: theme.navigation_bg,
								desktopToolbar: () => this.renderDesktopToolbar(),
								mobileHeader: () => this.renderMobileHeader(vnode.attrs.header),
								columnLayout: m(MultiDayCalendarView, {
									temporaryEvents: this.viewModel.temporaryEvents,
									getEventsOnDays: this.viewModel.getEventsOnDays.bind(this.viewModel),
									daysInPeriod: 7,
									onEventClicked: (event, domEvent) => this._onEventSelected(event, domEvent, this.htmlSanitizer),
									onNewEvent: (date) => {
										this._createNewEventDialog(date)
									},
									selectedDate: this.viewModel.selectedDate(),
									onDateSelected: (date, viewType) => {
										this._setUrl(viewType ?? CalendarViewType.WEEK, date)
									},
									startOfTheWeek: downcast(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
									groupColors,
									hiddenCalendars: this.viewModel.hiddenCalendars,
									onChangeViewPeriod: (next) => this._viewPeriod(CalendarViewType.WEEK, next),
									dragHandlerCallbacks: this.viewModel,
								}),
							})

						case CalendarViewType.AGENDA:
							return m(BackgroundColumnLayout, {
								backgroundColor: theme.navigation_bg,
								desktopToolbar: () => this.renderDesktopToolbar(),
								mobileHeader: () => this.renderMobileHeader(vnode.attrs.header),
								columnLayout: m(CalendarAgendaView, {
									eventsForDays: this.viewModel.eventsForDays,
									amPmFormat: shouldDefaultToAmPmTimeFormat(),
									onEventClicked: (event, domEvent) => this._onEventSelected(event, domEvent, this.htmlSanitizer),
									groupColors,
									hiddenCalendars: this.viewModel.hiddenCalendars,
									onDateSelected: (date) => {
										this._setUrl(CalendarViewType.DAY, date)
									},
								}),
							})

						default:
							throw new ProgrammingError(`invalid CalendarViewType: "${this.currentViewType}"`)
					}
				},
			},
			ColumnType.Background,
			size.second_col_min_width + size.third_col_min_width,
			size.third_col_max_width,
		)
		this.viewSlider = new ViewSlider([this.sidebarColumn, this.contentColumn], "CalendarView")

		const shortcuts = this._setupShortcuts()

		const streamListeners: Stream<void>[] = []

		this.oncreate = () => {
			keyManager.registerShortcuts(shortcuts)
			streamListeners.push(
				this.viewModel.calendarInvitations.map(() => {
					m.redraw()
				}),
			)
			streamListeners.push(this.viewModel.redraw.map(m.redraw))
		}

		this.onremove = () => {
			keyManager.unregisterShortcuts(shortcuts)

			for (let listener of streamListeners) {
				listener.end(true)
			}
		}
	}

	private renderDesktopToolbar(): Children {
		const navConfig = calendarNavConfiguration(this.currentViewType, this.viewModel.selectedDate(), this.viewModel.weekStart, (viewType, next) =>
			this._viewPeriod(viewType, next),
		)
		return m(CalendarDesktopToolbar, { navConfig })
	}

	private renderMobileHeader(header: AppHeaderAttrs) {
		return m(CalendarMobileHeader, {
			...header,
			viewType: this.currentViewType,
			viewSlider: this.viewSlider,
			navConfiguration: calendarNavConfiguration(this.currentViewType, this.viewModel.selectedDate(), this.viewModel.weekStart, (viewType, next) =>
				this._viewPeriod(viewType, next),
			),
			onCreateEvent: () => this._createNewEventDialog(),
			onBack: () => this.handleBackButton(),
		})
	}

	_setupShortcuts(): Shortcut[] {
		return [
			{
				key: Keys.ONE,
				exec: () => this._setUrl(CalendarViewType.WEEK, this.viewModel.selectedDate()),
				help: "switchWeekView_action",
			},
			{
				key: Keys.TWO,
				exec: () => this._setUrl(CalendarViewType.MONTH, this.viewModel.selectedDate()),
				help: "switchMonthView_action",
			},
			{
				key: Keys.THREE,
				exec: () => this._setUrl(CalendarViewType.AGENDA, this.viewModel.selectedDate()),
				help: "switchAgendaView_action",
			},
			{
				key: Keys.T,
				exec: () => this._setUrl(m.route.param("view"), new Date()),
				help: "viewToday_action",
			},
			{
				key: Keys.J,
				enabled: () => this.currentViewType !== CalendarViewType.AGENDA,
				exec: () => this._viewPeriod(this.currentViewType, true),
				help: "viewNextPeriod_action",
			},
			{
				key: Keys.K,
				enabled: () => this.currentViewType !== CalendarViewType.AGENDA,
				exec: () => this._viewPeriod(this.currentViewType, false),
				help: "viewPrevPeriod_action",
			},
			{
				key: Keys.N,
				exec: () => {
					this._createNewEventDialog()
				},
				help: "newEvent_action",
			},
		]
	}

	async _createNewEventDialog(date: Date | null = null): Promise<void> {
		let dateToUse: Date
		if (date != null) {
			dateToUse = date
		} else {
			// in agenda view, we always show today as the current date, so new event should be created today instead of the (invisibly) selected date in the model.
			dateToUse = this.currentViewType === CalendarViewType.AGENDA ? getStartOfDay(new Date()) : this.viewModel.selectedDate()
		}

		// Disallow creation of events when there is no existing calendar
		let calendarInfos = this.viewModel.getCalendarInfosCreateIfNeeded()

		if (calendarInfos instanceof Promise) {
			await showProgressDialog("pleaseWait_msg", calendarInfos)
		}

		const mailboxDetails = await locator.mailModel.getUserMailboxDetails()
		const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		const model = await locator.calendarEventModel(getEventWithDefaultTimes(dateToUse), mailboxDetails, mailboxProperties, null)
		await showNewCalendarEventEditDialog(model)
	}

	_viewPeriod(viewType: CalendarViewType, next: boolean) {
		let duration
		let unit: "day" | "week" | "month"

		switch (viewType) {
			case CalendarViewType.MONTH:
				duration = {
					month: 1,
				}
				unit = "month"
				break

			case CalendarViewType.WEEK:
				duration = {
					week: 1,
				}
				unit = "week"
				break

			case CalendarViewType.DAY:
				duration = {
					day: 1,
				}
				unit = "day"
				break

			default:
				throw new ProgrammingError("Invalid CalendarViewType: " + viewType)
		}

		const dateTime = DateTime.fromJSDate(this.viewModel.selectedDate())
		const newDate = next ? dateTime.plus(duration).startOf(unit).toJSDate() : dateTime.minus(duration).startOf(unit).toJSDate()

		this.viewModel.selectedDate(newDate)

		m.redraw()

		this._setUrl(viewType, newDate)
	}

	_renderCalendarViewButtons(): Children {
		const calendarViewValues: Array<{ name: string; value: CalendarViewType; icon: Icons; href: string }> = [
			{
				name: lang.get("month_label"),
				value: CalendarViewType.MONTH,
				icon: Icons.Table,
				href: "/calendar/month",
			},
			{
				name: lang.get("agenda_label"),
				value: CalendarViewType.AGENDA,
				icon: Icons.ListUnordered,
				href: "/calendar/agenda",
			},
		]

		if (styles.isDesktopLayout()) {
			calendarViewValues.unshift({
				name: lang.get("week_label"),
				value: CalendarViewType.WEEK,
				icon: Icons.TableColumns,
				href: "/calendar/week",
			})
		}

		if (client.isDesktopDevice()) {
			calendarViewValues.unshift({
				name: lang.get("day_label"),
				value: CalendarViewType.DAY,
				icon: Icons.TableSingle,
				href: "/calendar/day",
			})
		}

		return calendarViewValues.map((viewType) =>
			m(
				".folder-row.flex.flex-row", // undo the padding of NavButton and prevent .folder-row > a from selecting NavButton
				m(
					".flex-grow.mlr-button",
					m(NavButton, {
						label: () => viewType.name,
						icon: () => viewType.icon,
						href: m.route.get(),
						isSelectedPrefix: viewType.href,
						colors: NavButtonColor.Nav,
						// Close side menu
						click: () => {
							this._setUrl(viewType.value, this.viewModel.selectedDate())

							this.viewSlider.focus(this.contentColumn)
						},
						persistentBackground: true,
					}),
				),
			),
		)
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

	_onPressedAddCalendar() {
		if (locator.logins.getUserController().getCalendarMemberships().length === 0) {
			this._showCreateCalendarDialog()
		} else {
			import("../../misc/SubscriptionDialogs")
				.then((SubscriptionDialogUtils) => SubscriptionDialogUtils.checkPremiumSubscription())
				.then((ok) => {
					if (ok) {
						this._showCreateCalendarDialog()
					}
				})
		}
	}

	_showCreateCalendarDialog() {
		showEditCalendarDialog(
			{
				name: "",
				color: Math.random().toString(16).slice(-6),
			},
			"add_action",
			false,
			(dialog, properties) => {
				locator.calendarModel.createCalendar(properties.name, properties.color).then(() => dialog.close())
			},
			"save_action",
		)
	}

	_renderCalendars(shared: boolean): Children {
		return this.viewModel.calendarInfos.isLoaded()
			? Array.from(this.viewModel.calendarInfos.getLoaded().values())
					.filter((calendarInfo) => calendarInfo.shared === shared)
					.map((calendarInfo) => {
						const { userSettingsGroupRoot } = locator.logins.getUserController()
						const existingGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group === calendarInfo.groupInfo.group) ?? null
						const colorValue = "#" + (existingGroupSettings ? existingGroupSettings.color : defaultCalendarColor)
						const groupRootId = calendarInfo.groupRoot._id
						return m(".folder-row.flex-start.plr-button", [
							m(".flex.flex-grow.center-vertically.button-height", [
								m(".calendar-checkbox", {
									onclick: () => {
										const newHiddenCalendars = new Set(this.viewModel.hiddenCalendars)
										this.viewModel.hiddenCalendars.has(groupRootId)
											? newHiddenCalendars.delete(groupRootId)
											: newHiddenCalendars.add(groupRootId)

										this.viewModel.setHiddenCalendars(newHiddenCalendars)
									},
									style: {
										"border-color": colorValue,
										background: this.viewModel.hiddenCalendars.has(groupRootId) ? "" : colorValue,
										transition: "all 0.3s",
										cursor: "pointer",
										marginLeft: px(size.hpad_button),
									},
								}),
								m(
									".pl-m.b.flex-grow.text-ellipsis",
									{
										style: {
											width: 0,
										},
									},
									getSharedGroupName(calendarInfo.groupInfo, locator.logins.getUserController(), shared),
								),
							]),
							this._createCalendarActionDropdown(calendarInfo, colorValue, existingGroupSettings, userSettingsGroupRoot, shared),
						])
					})
			: null
	}

	_createCalendarActionDropdown(
		calendarInfo: CalendarInfo,
		colorValue: string,
		existingGroupSettings: GroupSettings | null,
		userSettingsGroupRoot: UserSettingsGroupRoot,
		sharedCalendar: boolean,
	): Children {
		const { group, groupInfo, groupRoot } = calendarInfo
		const user = locator.logins.getUserController().user
		return m(IconButton, {
			title: "more_label",
			colors: ButtonColor.Nav,
			icon: Icons.More,
			size: ButtonSize.Compact,
			click: createDropdown({
				lazyButtons: () => [
					{
						label: "edit_action",
						icon: Icons.Edit,
						size: ButtonSize.Compact,
						click: () => this._onPressedEditCalendar(groupInfo, colorValue, existingGroupSettings, userSettingsGroupRoot, sharedCalendar),
					},
					{
						label: "sharing_label",
						icon: Icons.ContactImport,
						click: () => {
							if (locator.logins.getUserController().isFreeAccount()) {
								showNotAvailableForFreeDialog()
							} else {
								showGroupSharingDialog(groupInfo, sharedCalendar)
							}
						},
					},
					!isApp() && group.type === GroupType.Calendar && hasCapabilityOnGroup(user, group, ShareCapability.Write)
						? {
								label: "import_action",
								icon: Icons.Import,
								click: () => showCalendarImportDialog(groupRoot),
						  }
						: null,
					!isApp() && group.type === GroupType.Calendar && hasCapabilityOnGroup(user, group, ShareCapability.Read)
						? {
								label: "export_action",
								icon: Icons.Export,
								click: () => {
									const alarmInfoList = user.alarmInfoList
									alarmInfoList &&
										exportCalendar(
											getSharedGroupName(groupInfo, locator.logins.getUserController(), sharedCalendar),
											groupRoot,
											alarmInfoList.alarms,
											new Date(),
											getTimeZone(),
										)
								},
						  }
						: null,
					!sharedCalendar
						? {
								label: "delete_action",
								icon: Icons.Trash,
								click: () => this._confirmDeleteCalendar(calendarInfo),
						  }
						: null,
				],
			}),
		})
	}

	_confirmDeleteCalendar(calendarInfo: CalendarInfo) {
		const calendarName = getSharedGroupName(calendarInfo.groupInfo, locator.logins.getUserController(), false)
		loadGroupMembers(calendarInfo.group, locator.entityClient).then((members) => {
			const ownerMail = locator.logins.getUserController().userGroupInfo.mailAddress
			const otherMembers = members.filter((member) => member.info.mailAddress !== ownerMail)
			Dialog.confirm(
				() =>
					(otherMembers.length > 0
						? lang.get("deleteSharedCalendarConfirm_msg", {
								"{calendar}": calendarName,
						  }) + " "
						: "") +
					lang.get("deleteCalendarConfirm_msg", {
						"{calendar}": calendarName,
					}),
			).then((confirmed) => {
				if (confirmed) {
					this.viewModel.deleteCalendar(calendarInfo).catch(ofClass(NotFoundError, () => console.log("Calendar to be deleted was not found.")))
				}
			})
		})
	}

	_onPressedEditCalendar(
		groupInfo: GroupInfo,
		colorValue: string,
		existingGroupSettings: GroupSettings | null,
		userSettingsGroupRoot: UserSettingsGroupRoot,
		shared: boolean,
	) {
		showEditCalendarDialog(
			{
				name: getSharedGroupName(groupInfo, locator.logins.getUserController(), shared),
				color: colorValue.substring(1),
			},
			"edit_action",
			shared,
			(dialog, properties) => {
				if (!shared) {
					groupInfo.name = properties.name
					locator.entityClient.update(groupInfo)
				}

				// color always set for existing calendar
				if (existingGroupSettings) {
					existingGroupSettings.color = properties.color
					existingGroupSettings.name = shared && properties.name !== groupInfo.name ? properties.name : null
				} else {
					const newGroupSettings = Object.assign(createGroupSettings(), {
						group: groupInfo.group,
						color: properties.color,
						name: shared && properties.name !== groupInfo.name ? properties.name : null,
					})
					userSettingsGroupRoot.groupSettings.push(newGroupSettings)
				}

				locator.entityClient.update(userSettingsGroupRoot)
				dialog.close()
			},
			"save_action",
		)
	}

	view({ attrs }: Vnode<CalendarViewAttrs>): Children {
		return m(
			".main-view",
			m(this.viewSlider, {
				header: m(Header, {
					handleBackPress: () => this.handleBackButton(),
					...attrs.header,
				}),
				bottomNav: m(BottomNav),
			}),
		)
	}

	onNewUrl(args: Record<string, any>) {
		if (!args.view) {
			this._setUrl(this.currentViewType, this.viewModel.selectedDate(), true)
		} else {
			// @ts-ignore
			this.currentViewType = CalendarViewTypeByValue[args.view] ? args.view : CalendarViewType.MONTH
			const urlDateParam = args.date

			if (urlDateParam && this.currentViewType !== CalendarViewType.AGENDA) {
				// Unlike JS Luxon assumes local time zone when parsing and not UTC. That's what we want
				const luxonDate = DateTime.fromISO(urlDateParam)
				let date = new Date()

				if (luxonDate.isValid) {
					date = luxonDate.toJSDate()
				}

				if (this.viewModel.selectedDate().getTime() !== date.getTime()) {
					this.viewModel.selectedDate(date)

					m.redraw()
				}
			}

			deviceConfig.setDefaultCalendarView(locator.logins.getUserController().user._id, this.currentViewType)
		}
	}

	getViewSlider(): ViewSlider {
		return this.viewSlider
	}

	_setUrl(view: string, date: Date, replace: boolean = false) {
		const dateString = DateTime.fromJSDate(date).toISODate()
		m.route.set(
			"/calendar/:view/:date",
			{
				view,
				date: dateString,
			},
			{
				replace,
			},
		)
	}

	async _onEventSelected(selectedEvent: CalendarEvent, domEvent: MouseOrPointerEvent, htmlSanitizerPromise: Promise<HtmlSanitizer>) {
		const domTarget = domEvent.currentTarget

		if (domTarget == null || !(domTarget instanceof HTMLElement)) {
			return
		}

		const x = domEvent.clientX
		const y = domEvent.clientY
		const [calendars, mailboxDetails, htmlSanitizer] = await Promise.all([
			this.viewModel.calendarInfos.getAsync(),
			locator.mailModel.getUserMailboxDetails(),
			htmlSanitizerPromise,
		])
		const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		// We want the popup to show at the users mouse
		const rect = {
			bottom: y,
			height: 0,
			width: 0,
			top: y,
			left: x,
			right: x,
		}
		const userController = locator.logins.getUserController()
		const customer = await userController.loadCustomer()
		const ownMailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, userController.userGroupInfo)
		const ownAttendee: CalendarEventAttendee | null = findAttendeeInAddresses(selectedEvent.attendees, ownMailAddresses)
		const eventType = getEventType(selectedEvent, calendars, ownMailAddresses, userController.user)
		const hasBusinessFeature = isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled) || (await userController.isNewPaidPlan())
		const popupModel = new CalendarEventPopupViewModel(
			selectedEvent,
			locator.calendarModel,
			eventType,
			hasBusinessFeature,
			ownAttendee,
			async (mode: CalendarEventEditMode) => {
				if (mode === CalendarEventEditMode.All) {
					return locator.calendarEventModel(
						await resolveCalendarEventProgenitor(selectedEvent, locator.entityClient),
						mailboxDetails,
						mailboxProperties,
						null,
					)
				} else {
					return locator.calendarEventModel(selectedEvent, mailboxDetails, mailboxProperties, null)
				}
			},
		)
		new CalendarEventPopup(popupModel, rect, htmlSanitizer).show()
	}
}
