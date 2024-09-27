import m, { Children, Component, redraw, Vnode } from "mithril"
import { AppHeaderAttrs, Header } from "../../../common/gui/Header.js"
import { ColumnType, ViewColumn } from "../../../common/gui/base/ViewColumn"
import { lang } from "../../../common/misc/LanguageViewModel"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider.js"
import type { Key, Shortcut } from "../../../common/misc/KeyManager"
import { isKeyPressed, keyManager } from "../../../common/misc/KeyManager"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { downcast, getStartOfDay, isSameDayOfDate, noOp, ofClass } from "@tutao/tutanota-utils"
import {
	CalendarEvent,
	CalendarGroupRootTypeRef,
	createDefaultAlarmInfo,
	createGroupSettings,
	GroupSettings,
	UserSettingsGroupRoot,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import {
	defaultCalendarColor,
	GroupType,
	Keys,
	NewPaidPlans,
	reverse,
	ShareCapability,
	TabIndex,
	TimeFormat,
	WeekStart,
} from "../../../common/api/common/TutanotaConstants"
import { locator } from "../../../common/api/main/CommonLocator"
import {
	CalendarType,
	findFirstPrivateCalendar,
	getStartOfTheWeekOffset,
	getStartOfTheWeekOffsetForUser,
	getTimeZone,
	getWeekNumber,
	parseAlarmInterval,
} from "../../../common/calendar/date/CalendarUtils"
import { ButtonColor } from "../../../common/gui/base/Button.js"
import { CalendarMonthView } from "./CalendarMonthView"
import { DateTime } from "luxon"
import { NotFoundError } from "../../../common/api/common/error/RestError"
import { CalendarAgendaView, CalendarAgendaViewAttrs } from "./CalendarAgendaView"
import { type CalendarProperties, handleUrlSubscription, showCreateEditCalendarDialog } from "../gui/EditCalendarDialog.js"
import { styles } from "../../../common/gui/styles"
import { MultiDayCalendarView } from "./MultiDayCalendarView"
import { Dialog } from "../../../common/gui/base/Dialog"
import { isApp, isDesktop } from "../../../common/api/common/Env"
import { px, size } from "../../../common/gui/size"
import { FolderColumnView } from "../../../common/gui/FolderColumnView.js"
import { deviceConfig } from "../../../common/misc/DeviceConfig"
import { exportCalendar, handleCalendarImport } from "../../../common/calendar/import/CalendarImporterDialog.js"
import { showNotAvailableForFreeDialog, showPlanUpgradeRequiredDialog } from "../../../common/misc/SubscriptionDialogs"
import { getSharedGroupName, hasCapabilityOnGroup, loadGroupMembers } from "../../../common/sharing/GroupUtils"
import { showGroupSharingDialog } from "../../../common/sharing/view/GroupSharingDialog"
import { GroupInvitationFolderRow } from "../../../common/sharing/view/GroupInvitationFolderRow"
import { SidebarSection } from "../../../common/gui/SidebarSection"
import type { HtmlSanitizer } from "../../../common/misc/HtmlSanitizer"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"
import {
	calendarNavConfiguration,
	calendarWeek,
	daysHaveEvents,
	getGroupColors,
	shouldDefaultToAmPmTimeFormat,
	showDeletePopup,
} from "../gui/CalendarGuiUtils.js"
import { CalendarEventBubbleKeyDownHandler, CalendarViewModel, MouseOrPointerEvent } from "./CalendarViewModel"
import { showNewCalendarEventEditDialog } from "../gui/eventeditor-view/CalendarEventEditDialog.js"
import { CalendarEventPopup } from "../gui/eventpopup/CalendarEventPopup.js"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { CalendarInfo, CalendarModel } from "../model/CalendarModel"
import type Stream from "mithril/stream"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { createDropdown, PosRect } from "../../../common/gui/base/Dropdown.js"
import { ButtonSize } from "../../../common/gui/base/ButtonSize.js"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu.js"
import { BaseTopLevelView } from "../../../common/gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../../TopLevelView.js"
import {
	CalendarViewType,
	getEventWithDefaultTimes,
	getNextHalfHour,
	serializeAlarmInterval,
	setNextHalfHour,
} from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { BackgroundColumnLayout } from "../../../common/gui/BackgroundColumnLayout.js"
import { theme } from "../../../common/gui/theme.js"
import { CalendarMobileHeader } from "./CalendarMobileHeader.js"
import { CalendarDesktopToolbar } from "./CalendarDesktopToolbar.js"
import { Time } from "../../../common/calendar/date/Time.js"
import { DaySelectorSidebar } from "../gui/day-selector/DaySelectorSidebar.js"
import { CalendarOperation } from "../gui/eventeditor-model/CalendarEventModel.js"
import { DaySelectorPopup } from "../gui/day-selector/DaySelectorPopup.js"
import { CalendarEventPreviewViewModel } from "../gui/eventpopup/CalendarEventPreviewViewModel.js"
import { client } from "../../../common/misc/ClientDetector.js"
import { FloatingActionButton } from "../../gui/FloatingActionButton.js"
import { Icon, IconSize } from "../../../common/gui/base/Icon.js"
import { Group, GroupInfo, User } from "../../../common/api/entities/sys/TypeRefs.js"
import { formatDate, formatTime } from "../../../common/misc/Formatter.js"
import { getExternalCalendarName, hasSourceUrl, parseCalendarStringData, SyncStatus } from "../../../common/calendar/import/ImportExportUtils.js"
import type { ParsedEvent } from "../../../common/calendar/import/CalendarImporter.js"
import { showSnackBar } from "../../../common/gui/base/SnackBar.js"

export type GroupColors = Map<Id, string>

export interface CalendarViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	calendarViewModel: CalendarViewModel
	bottomNav?: () => Children
	lazySearchBar: () => Children
}

const CalendarViewTypeByValue = reverse(CalendarViewType)

enum RenderType {
	Private,
	Shared,
	External,
}

export class CalendarView extends BaseTopLevelView implements TopLevelView<CalendarViewAttrs> {
	private readonly sidebarColumn: ViewColumn
	private readonly contentColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	private currentViewType: CalendarViewType
	private readonly viewModel: CalendarViewModel
	// For sanitizing event descriptions, which get rendered as html in the CalendarEventPopup
	private readonly htmlSanitizer: Promise<HtmlSanitizer>
	private redrawIntervalId: number | null = null
	private redrawTimeoutId: number | null = null
	oncreate: Component["oncreate"]
	onremove: Component["onremove"]

	constructor({ attrs }: Vnode<CalendarViewAttrs>) {
		super()
		const userId = locator.logins.getUserController().user._id

		this.viewModel = attrs.calendarViewModel
		this.currentViewType = deviceConfig.getDefaultCalendarView(userId) || CalendarViewType.MONTH
		this.htmlSanitizer = import("../../../common/misc/HtmlSanitizer").then((m) => m.htmlSanitizer)
		this.sidebarColumn = new ViewColumn(
			{
				view: () =>
					m(FolderColumnView, {
						drawer: attrs.drawerAttrs,
						button: styles.isDesktopLayout()
							? {
									label: "newEvent_action",
									click: () => this.createNewEventDialog(getNextHalfHour()),
							  }
							: null,
						content: [
							styles.isDesktopLayout()
								? m(DaySelectorSidebar, {
										selectedDate: this.viewModel.selectedDate(),
										onDateSelected: (date) => {
											this.setUrl(this.currentViewType, date)
											m.redraw()
										},
										startOfTheWeekOffset: getStartOfTheWeekOffset(
											downcast(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
										),
										showDaySelection: this.currentViewType !== CalendarViewType.MONTH && this.currentViewType !== CalendarViewType.WEEK,
										highlightToday: true,
										highlightSelectedWeek: this.currentViewType === CalendarViewType.WEEK,
										hasEventsOn: (date) => this.hasEventsOn(date),
								  })
								: null,
							m(
								SidebarSection,
								{
									name: "yourCalendars_label",
									button: m(IconButton, {
										title: "addCalendar_action",
										colors: ButtonColor.Nav,
										click:
											(isApp() || isDesktop()) && findFirstPrivateCalendar(attrs.calendarViewModel.calendarInfos)
												? createDropdown({
														lazyButtons: () => [
															{
																label: "addCalendar_action",
																colors: ButtonColor.Nav,
																click: () => this.onPressedAddCalendar(CalendarType.NORMAL),
																icon: Icons.Add,
																size: ButtonSize.Compact,
															},
															{
																label: "addCalendarFromURL_action",
																icon: Icons.Link,
																size: ButtonSize.Compact,
																click: () => this.onPressedAddCalendar(CalendarType.URL),
															},
														],
												  })
												: () => this.onPressedAddCalendar(CalendarType.NORMAL),
										icon: Icons.Add,
										size: ButtonSize.Compact,
									}),
									hideIfEmpty: true,
								},
								this.renderCalendars([RenderType.Private]),
							),
							m(
								SidebarSection,
								{
									name: "calendarShared_label",
									hideIfEmpty: true,
								},
								this.renderCalendars([RenderType.Shared]),
							),
							m(
								SidebarSection,
								{
									name: "calendarSubscriptions_label",
									hideIfEmpty: true,
								},
								this.renderCalendars([RenderType.External]),
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
			{
				minWidth: size.calendar_first_col_min_width,
				maxWidth: size.first_col_max_width,
				headerCenter: () => (this.currentViewType === CalendarViewType.WEEK ? lang.get("month_label") : lang.get("calendar_label")),
			},
		)

		this.contentColumn = new ViewColumn(
			{
				view: () => {
					const groupColors = getGroupColors(locator.logins.getUserController().userSettingsGroupRoot)

					switch (this.currentViewType) {
						case CalendarViewType.MONTH:
							return m(BackgroundColumnLayout, {
								backgroundColor: theme.navigation_bg,
								desktopToolbar: () => this.renderDesktopToolbar(),
								mobileHeader: () => this.renderMobileHeader(attrs.header),
								columnLayout: m(CalendarMonthView, {
									temporaryEvents: this.viewModel.temporaryEvents,
									eventsForDays: this.viewModel.eventsForDays,
									getEventsOnDaysToRender: this.viewModel.getEventsOnDaysToRender.bind(this.viewModel),
									onEventClicked: (calendarEvent, domEvent) => this.onEventSelected(calendarEvent, domEvent, this.htmlSanitizer),
									onEventKeyDown: this.handleEventKeyDown(),
									onNewEvent: (date) => {
										this.createNewEventDialog(date)
									},
									selectedDate: this.viewModel.selectedDate(),
									onDateSelected: (date, calendarViewType) => {
										this.setUrl(calendarViewType, date, true)
									},
									onChangeMonth: (next) => this.viewPeriod(CalendarViewType.MONTH, next),
									amPmFormat: locator.logins.getUserController().userSettingsGroupRoot.timeFormat === TimeFormat.TWELVE_HOURS,
									startOfTheWeek: downcast(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
									groupColors,
									hiddenCalendars: this.viewModel.hiddenCalendars,
									dragHandlerCallbacks: this.viewModel,
								}),
								floatingActionButton: this.renderFab.bind(this),
							})
						case CalendarViewType.DAY:
							return m(BackgroundColumnLayout, {
								backgroundColor: theme.navigation_bg,
								desktopToolbar: () => this.renderDesktopToolbar(),
								mobileHeader: () => this.renderMobileHeader(attrs.header),
								columnLayout: m(MultiDayCalendarView, {
									temporaryEvents: this.viewModel.temporaryEvents,
									getEventsOnDays: this.viewModel.getEventsOnDaysToRender.bind(this.viewModel),
									daysInPeriod: 1,
									onEventClicked: (event, domEvent) => this.onEventSelected(event, domEvent, this.htmlSanitizer),
									onEventKeyDown: this.handleEventKeyDown(),
									onNewEvent: (date) => {
										this.createNewEventDialog(date)
									},
									selectedDate: this.viewModel.selectedDate(),
									onDateSelected: (date) => {
										this.setUrl(CalendarViewType.DAY, date)
									},
									groupColors,
									onChangeViewPeriod: (next) => this.viewPeriod(CalendarViewType.DAY, next),
									startOfTheWeek: downcast(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
									dragHandlerCallbacks: this.viewModel,
									isDaySelectorExpanded: this.viewModel.isDaySelectorExpanded(),
									weekIndicator: calendarWeek(this.viewModel.selectedDate(), this.viewModel.weekStart),
									selectedTime: this.viewModel.selectedTime,
									scrollPosition: this.viewModel.getScrollPosition(),
									onScrollPositionChange: (newPosition: number) => this.viewModel.setScrollPosition(newPosition),
									onViewChanged: (vnode) => this.viewModel.setViewParameters(vnode.dom as HTMLElement),
								}),
								floatingActionButton: this.renderFab.bind(this),
							})

						case CalendarViewType.WEEK:
							return m(BackgroundColumnLayout, {
								backgroundColor: theme.navigation_bg,
								desktopToolbar: () => this.renderDesktopToolbar(),
								mobileHeader: () => this.renderMobileHeader(attrs.header),
								columnLayout: m(MultiDayCalendarView, {
									temporaryEvents: this.viewModel.temporaryEvents,
									getEventsOnDays: this.viewModel.getEventsOnDaysToRender.bind(this.viewModel),
									daysInPeriod: 7,
									onEventClicked: (event, domEvent) => this.onEventSelected(event, domEvent, this.htmlSanitizer),
									onEventKeyDown: this.handleEventKeyDown(),
									onNewEvent: (date) => {
										this.createNewEventDialog(date)
									},
									selectedDate: this.viewModel.selectedDate(),
									onDateSelected: (date, viewType) => {
										this.viewModel.selectedDate(date)
										this.setUrl(viewType ?? CalendarViewType.WEEK, date)
									},
									startOfTheWeek: downcast(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
									groupColors,
									onChangeViewPeriod: (next) => this.viewPeriod(CalendarViewType.WEEK, next),
									dragHandlerCallbacks: this.viewModel,
									isDaySelectorExpanded: this.viewModel.isDaySelectorExpanded(),
									weekIndicator: calendarWeek(this.viewModel.selectedDate(), this.viewModel.weekStart),
									selectedTime: this.viewModel.selectedTime,
									scrollPosition: this.viewModel.getScrollPosition(),
									onScrollPositionChange: (newPosition: number) => this.viewModel.setScrollPosition(newPosition),
									onViewChanged: (vnode) => this.viewModel.setViewParameters(vnode.dom as HTMLElement),
								}),
								floatingActionButton: this.renderFab.bind(this),
							})

						case CalendarViewType.AGENDA:
							return m(BackgroundColumnLayout, {
								backgroundColor: theme.navigation_bg,
								desktopToolbar: () => this.renderDesktopToolbar(),
								mobileHeader: () => this.renderMobileHeader(attrs.header),
								columnLayout: m(CalendarAgendaView, {
									selectedDate: this.viewModel.selectedDate(),
									selectedTime: this.viewModel.selectedTime,
									eventsForDays: this.viewModel.eventsForDays,
									amPmFormat: shouldDefaultToAmPmTimeFormat(),
									onEventClicked: (event, domEvent) => {
										if (styles.isDesktopLayout()) {
											this.viewModel.updatePreviewedEvent(event)
										} else {
											this.onEventSelected(event, domEvent, this.htmlSanitizer)
										}
									},
									onEventKeyDown: (event, domEvent) => {
										if (isKeyPressed(domEvent.key, Keys.RETURN, Keys.SPACE) && !domEvent.repeat) {
											if (styles.isDesktopLayout()) {
												this.viewModel.updatePreviewedEvent(event)
											} else {
												this.showCalendarEventPopupAtEvent(event, domEvent.target as HTMLElement, this.htmlSanitizer)
											}
										}
										if (isKeyPressed(domEvent.key, Keys.DELETE) && !domEvent.repeat) {
											this.openDeletePopup(event, domEvent)
										}
									},
									groupColors,
									hiddenCalendars: this.viewModel.hiddenCalendars,
									startOfTheWeekOffset: getStartOfTheWeekOffsetForUser(locator.logins.getUserController().userSettingsGroupRoot),
									isDaySelectorExpanded: this.viewModel.isDaySelectorExpanded(),
									onDateSelected: (date) => this.setUrl(CalendarViewType.AGENDA, date),
									onShowDate: (date: Date) => this.setUrl(CalendarViewType.DAY, date),
									eventPreviewModel: this.viewModel.eventPreviewModel,
									scrollPosition: this.viewModel.getScrollPosition(),
									onScrollPositionChange: (newPosition: number) => this.viewModel.setScrollPosition(newPosition),
									onViewChanged: (vnode) => this.viewModel.setViewParameters(vnode.dom as HTMLElement),
									onNewEvent: (date) => this.createNewEventDialog(date),
								} satisfies CalendarAgendaViewAttrs),
								floatingActionButton: this.renderFab.bind(this),
							})

						default:
							throw new ProgrammingError(`invalid CalendarViewType: "${this.currentViewType}"`)
					}
				},
			},
			ColumnType.Background,
			{
				minWidth: size.calendar_first_col_min_width + size.third_col_min_width,
				maxWidth: size.third_col_max_width,
			},
		)
		this.viewSlider = new ViewSlider([this.sidebarColumn, this.contentColumn])

		const shortcuts = this.setupShortcuts()

		const streamListeners: Stream<void>[] = []

		this.oncreate = () => {
			keyManager.registerShortcuts(shortcuts)
			// do both a timeout and interval to ensure the time indicator is done on the minute rather than some delay afterwards
			if (!this.redrawIntervalId && !this.redrawTimeoutId) {
				const timeToNextMinute = (60 - new Date().getSeconds()) * 1000
				this.redrawTimeoutId = window.setTimeout(() => {
					this.redrawIntervalId = window.setInterval(m.redraw, 1000 * 60)
					this.redrawTimeoutId = null
					m.redraw()
				}, timeToNextMinute)
			}
			streamListeners.push(
				this.viewModel.calendarInvitations.map(() => {
					m.redraw()
				}),
			)
			streamListeners.push(this.viewModel.redraw.map(m.redraw))
		}

		this.onremove = () => {
			keyManager.unregisterShortcuts(shortcuts)
			if (this.redrawTimeoutId) {
				window.clearTimeout(this.redrawTimeoutId)
				this.redrawTimeoutId = null
			}
			if (this.redrawIntervalId) {
				window.clearInterval(this.redrawIntervalId)
				this.redrawIntervalId = null
			}
			for (let listener of streamListeners) {
				listener.end(true)
			}
		}

		deviceConfig.getLastSyncStream().map(redraw)
	}

	private renderFab(): Children {
		if (client.isCalendarApp()) {
			return m(FloatingActionButton, {
				icon: Icons.Add,
				title: "newEvent_action",
				colors: ButtonColor.Fab,
				action: () => this.createNewEventDialog(),
			})
		}

		return null
	}

	private renderDesktopToolbar(): Children {
		return m(CalendarDesktopToolbar, {
			navConfig: calendarNavConfiguration(this.currentViewType, this.viewModel.selectedDate(), this.viewModel.weekStart, "detailed", (viewType, next) =>
				this.viewPeriod(viewType, next),
			),
			viewType: this.currentViewType,
			onToday: () => {
				// in case it has been set, when onToday is called we definitely do not want the time to be ignored
				this.viewModel.ignoreNextValidTimeSelection = false
				this.setUrl(m.route.param("view"), new Date())
			},
			onViewTypeSelected: (viewType) => this.setUrl(viewType, this.viewModel.selectedDate(), false, true),
		})
	}

	private renderMobileHeader(header: AppHeaderAttrs) {
		return m(CalendarMobileHeader, {
			...header,
			viewType: this.currentViewType,
			viewSlider: this.viewSlider,
			showExpandIcon: !styles.isDesktopLayout() && this.currentViewType !== CalendarViewType.MONTH,
			isDaySelectorExpanded: this.viewModel.isDaySelectorExpanded(),
			navConfiguration: calendarNavConfiguration(
				this.currentViewType,
				this.viewModel.selectedDate(),
				this.viewModel.weekStart,
				"short",
				(viewType, next) => this.viewPeriod(viewType, next),
			),
			onCreateEvent: () => this.createNewEventDialog(),
			onToday: () => {
				// in case it has been set, when onToday is called we definitely do not want the time to be ignored
				this.viewModel.ignoreNextValidTimeSelection = false
				this.setUrl(m.route.param("view"), new Date())
			},
			onViewTypeSelected: (viewType) => this.setUrl(viewType, this.viewModel.selectedDate(), false, true),
			onTap: (_event, dom) => {
				if (this.currentViewType !== CalendarViewType.MONTH && styles.isSingleColumnLayout()) {
					this.viewModel.setDaySelectorExpanded(!this.viewModel.isDaySelectorExpanded())
					return
				}

				if (!styles.isDesktopLayout() && this.currentViewType !== CalendarViewType.MONTH) {
					if (this.viewModel.isDaySelectorExpanded()) {
						this.viewModel.setDaySelectorExpanded(false)
					}

					this.showCalendarPopup(dom)
				}
			},
		})
	}

	private setupShortcuts(): Shortcut[] {
		const getIfNotView = (viewType: CalendarViewType | CalendarViewType[]) => {
			return Array.isArray(viewType)
				? () => {
						for (const item of viewType) {
							if (item === this.currentViewType) return false
						}
						return true
				  }
				: () => {
						return this.currentViewType !== viewType
				  }
		}
		const generatePeriodShortcut = (key: Key, next: boolean): Shortcut => {
			return {
				key,
				enabled: getIfNotView(CalendarViewType.AGENDA),
				exec: () => this.viewPeriod(this.currentViewType, next),
				help: next ? "viewNextPeriod_action" : "viewPrevPeriod_action",
			}
		}
		return [
			{
				key: Keys.ONE,
				exec: () => this.setUrl(CalendarViewType.WEEK, this.viewModel.selectedDate()),
				help: "switchWeekView_action",
			},
			{
				key: Keys.TWO,
				exec: () => this.setUrl(CalendarViewType.MONTH, this.viewModel.selectedDate()),
				help: "switchMonthView_action",
			},
			{
				key: Keys.THREE,
				exec: () => this.setUrl(CalendarViewType.AGENDA, this.viewModel.selectedDate()),
				help: "switchAgendaView_action",
			},
			{
				key: Keys.T,
				exec: () => this.setUrl(m.route.param("view"), new Date()),
				help: "viewToday_action",
			},
			generatePeriodShortcut(Keys.J, true),
			generatePeriodShortcut(Keys.K, false),
			generatePeriodShortcut(Keys.RIGHT, true),
			generatePeriodShortcut(Keys.LEFT, false),
			{
				key: Keys.N,
				exec: () => {
					this.createNewEventDialog()
				},
				help: "newEvent_action",
			},
			{
				key: Keys.UP,
				enabled: getIfNotView([CalendarViewType.MONTH, CalendarViewType.AGENDA]),
				exec: () => {
					this.viewModel.scroll(-10)
				},
				help: "scrollUp_action",
			},
			{
				key: Keys.DOWN,
				enabled: getIfNotView([CalendarViewType.MONTH, CalendarViewType.AGENDA]),
				exec: () => {
					this.viewModel.scroll(10)
				},
				help: "scrollDown_action",
			},
			{
				key: Keys.PAGE_UP,
				enabled: getIfNotView(CalendarViewType.MONTH),
				exec: () => {
					const viewSize = this.viewModel.getViewSize()
					if (viewSize) this.viewModel.scroll(-viewSize)
				},
				help: "scrollToPreviousScreen_action",
			},
			{
				key: Keys.PAGE_DOWN,
				enabled: getIfNotView(CalendarViewType.MONTH),
				exec: () => {
					const viewSize = this.viewModel.getViewSize()
					if (viewSize) this.viewModel.scroll(viewSize)
				},
				help: "scrollToNextScreen_action",
			},
			{
				key: Keys.HOME,
				enabled: getIfNotView(CalendarViewType.MONTH),
				exec: () => {
					this.viewModel.setScrollPosition(0)
				},
				help: "scrollToTop_action",
			},
			{
				key: Keys.END,
				enabled: getIfNotView(CalendarViewType.MONTH),
				exec: () => {
					// Sorry for the dated meme (it's over nine-thousand!)
					this.viewModel.setScrollPosition(this.viewModel.getScrollMaximum() ?? 9001)
				},
				help: "scrollToBottom_action",
			},
		]
	}

	private async createNewEventDialog(date: Date | null = null): Promise<void> {
		const dateToUse = date ?? setNextHalfHour(new Date(this.viewModel.selectedDate()))

		// Disallow creation of events when there is no existing calendar
		let calendarInfos = this.viewModel.getCalendarInfosCreateIfNeeded()

		if (calendarInfos instanceof Promise) {
			await showProgressDialog("pleaseWait_msg", calendarInfos)
		}

		const mailboxDetails = await locator.mailboxModel.getUserMailboxDetails()
		const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		const model = await locator.calendarEventModel(CalendarOperation.Create, getEventWithDefaultTimes(dateToUse), mailboxDetails, mailboxProperties, null)
		if (model) {
			await showNewCalendarEventEditDialog(model)
		}
	}

	private viewPeriod(viewType: CalendarViewType, next: boolean) {
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
			case CalendarViewType.AGENDA:
				duration = styles.isDesktopLayout()
					? { day: 1 }
					: {
							week: this.viewModel.isDaySelectorExpanded() ? 0 : 1,
							month: this.viewModel.isDaySelectorExpanded() ? 1 : 0,
					  }
				unit = "day"
				break

			default:
				throw new ProgrammingError("Invalid CalendarViewType: " + viewType)
		}

		const dateTime = DateTime.fromJSDate(this.viewModel.selectedDate())
		const newDate = next ? dateTime.plus(duration).startOf(unit).toJSDate() : dateTime.minus(duration).startOf(unit).toJSDate()

		this.viewModel.selectedDate(newDate)
		// ignoreNextTimeSelection is set to true here, as viewPeriod is only called when changing the view by swiping (or using previous/next buttons)
		// and we don't want jarring time jumps when doing that
		this.viewModel.ignoreNextValidTimeSelection = true
		this.setUrl(viewType, newDate, false)

		m.redraw()
	}

	private onPressedAddCalendar(calendarType: CalendarType) {
		const userController = locator.logins.getUserController()
		if (userController.isFreeAccount()) {
			showNotAvailableForFreeDialog()
			return
		}
		if (calendarType === CalendarType.URL)
			userController.isNewPaidPlan().then((isNewPaidPlan) => {
				if (isNewPaidPlan) this.showCreateCalendarDialog(calendarType)
				else showPlanUpgradeRequiredDialog(NewPaidPlans)
			})
		else this.showCreateCalendarDialog(calendarType)
	}

	private showCreateCalendarDialog(calendarType: CalendarType) {
		const createNormalCalendar = async (dialog: Dialog, properties: CalendarProperties, calendarModel: CalendarModel) => {
			await calendarModel.createCalendar(properties.name, properties.color, properties.alarms, null)
			dialog.close()
		}
		const createExternalCalendar = async (dialog: Dialog, properties: CalendarProperties, calendarModel: CalendarModel) => {
			const iCalStr = await handleUrlSubscription(calendarModel, properties.sourceUrl!)
			if (iCalStr instanceof Error) throw iCalStr

			let events: ParsedEvent[] = []
			try {
				events = parseCalendarStringData(iCalStr, getTimeZone()).contents
			} catch (e) {
				await Dialog.message("invalidICal_error", e.message)
				return
			}

			const calendarGroup = await calendarModel.createCalendar(getExternalCalendarName(iCalStr), properties.color, [], properties.sourceUrl)
			const calendarGroupRoot = await locator.entityClient.load(CalendarGroupRootTypeRef, calendarGroup._id)
			deviceConfig.updateLastSync(calendarGroup._id)
			await handleCalendarImport(calendarGroupRoot, events, CalendarType.URL)
			dialog.close()
		}

		switch (calendarType) {
			case CalendarType.NORMAL:
				showCreateEditCalendarDialog({
					calendarType,
					titleTextId: "add_action",
					shared: false,
					okAction: createNormalCalendar,
					okTextId: "save_action",
					calendarModel: this.viewModel.getCalendarModel(),
				})
				break
			case CalendarType.URL:
				showCreateEditCalendarDialog({
					calendarType,
					titleTextId: "newCalendarSubscriptionsDialog_title",
					shared: false,
					okAction: createExternalCalendar,
					okTextId: "subscribe_action",
					warningMessage: () => m(".smaller.content-fg", lang.get("externalCalendarInfo_msg")),
					calendarModel: this.viewModel.getCalendarModel(),
				})
				break
		}
	}

	private renderCalendars(renderTypes: RenderType[]): Children {
		const setHidden = (viewModel: CalendarViewModel, groupRootId: string) => {
			const newHiddenCalendars = new Set(viewModel.hiddenCalendars)
			viewModel.hiddenCalendars.has(groupRootId) ? newHiddenCalendars.delete(groupRootId) : newHiddenCalendars.add(groupRootId)

			viewModel.setHiddenCalendars(newHiddenCalendars)
		}

		const calendarInfos = this.viewModel.calendarInfos
		const calendarInfosList = Array.from(calendarInfos.values())

		const filteredCalendarInfos = calendarInfosList.filter((calendarInfo) => {
			/**
			 * Dinamically filter calendarInfoList according to the renderTypes
			 */
			const conditions: Array<(calendarInfo: CalendarInfo) => boolean> = []
			for (const renderType of renderTypes) {
				switch (renderType) {
					case RenderType.Private:
						conditions.push((calendarInfo: CalendarInfo) => calendarInfo.userIsOwner && !calendarInfo.isExternal)
						break
					case RenderType.Shared:
						conditions.push((calendarInfo: CalendarInfo) => !calendarInfo.userIsOwner)
						break
					case RenderType.External:
						conditions.push((calendarInfo: CalendarInfo) => calendarInfo.userIsOwner && calendarInfo.isExternal)
						break
				}
			}
			return conditions.reduce((result, condition) => result || condition(calendarInfo), false)
		})

		return filteredCalendarInfos.map((calendarInfo) => {
			return this.renderCalendarItem(calendarInfo, calendarInfo.shared, setHidden)
		})
	}

	private renderCalendarItem(calendarInfo: CalendarInfo, shared: boolean, setHidden: (viewModel: CalendarViewModel, groupRootId: string) => void) {
		const { userSettingsGroupRoot } = locator.logins.getUserController()
		const existingGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group === calendarInfo.groupInfo.group) ?? null
		const colorValue = "#" + (existingGroupSettings ? existingGroupSettings.color : defaultCalendarColor)
		const groupRootId = calendarInfo.groupRoot._id
		const groupName = getSharedGroupName(calendarInfo.groupInfo, locator.logins.getUserController(), shared)
		const isHidden = this.viewModel.hiddenCalendars.has(groupRootId)
		const lastSyncEntry = deviceConfig.getLastExternalCalendarSync().get(calendarInfo.group._id)
		const lastSyncDate = lastSyncEntry?.lastSuccessfulSync ? new Date(lastSyncEntry.lastSuccessfulSync) : null

		const lastSyncStr = lastSyncDate
			? lang.get("lastSync_label", { "{date}": `${formatDate(lastSyncDate)} at ${formatTime(lastSyncDate)}` })
			: lang.get("iCalNotSync_msg")
		return m(".folder-row.flex-start.plr-button", [
			m(".flex.flex-grow.center-vertically.button-height", [
				m(".calendar-checkbox", {
					role: "checkbox",
					title: groupName,
					tabindex: TabIndex.Default,
					"aria-checked": (!isHidden).toString(),
					"aria-label": groupName,
					onclick: () => setHidden(this.viewModel, groupRootId),
					onkeydown: (e: KeyboardEvent) => {
						if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
							setHidden(this.viewModel, groupRootId)
							e.preventDefault()
						}
					},
					style: {
						"border-color": colorValue,
						background: isHidden ? "" : colorValue,
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
					groupName,
				),
			]),
			hasSourceUrl(existingGroupSettings) && lastSyncEntry?.lastSyncStatus === SyncStatus.Failed
				? m(Icon, {
						title: lastSyncStr,
						icon: Icons.SyncProblem,
						size: IconSize.Medium,
						class: "pr-s",
						style: {
							fill: theme.content_button,
						},
				  })
				: null,
			this.createCalendarActionDropdown(calendarInfo, colorValue, existingGroupSettings, userSettingsGroupRoot, shared),
		])
	}

	private createCalendarActionDropdown(
		calendarInfo: CalendarInfo,
		colorValue: string,
		existingGroupSettings: GroupSettings | null,
		userSettingsGroupRoot: UserSettingsGroupRoot,
		sharedCalendar: boolean,
	): Children {
		const { group, groupInfo, groupRoot, isExternal } = calendarInfo
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
						click: () => this.onPressedEditCalendar(groupInfo, colorValue, existingGroupSettings, userSettingsGroupRoot, sharedCalendar),
					},
					!isExternal
						? {
								label: "sharing_label",
								icon: Icons.ContactImport,
								click: () => {
									if (locator.logins.getUserController().isFreeAccount()) {
										showNotAvailableForFreeDialog()
									} else {
										showGroupSharingDialog(groupInfo, sharedCalendar)
									}
								},
						  }
						: null,
					this.allowCalendarImport(group, user, existingGroupSettings)
						? {
								label: "import_action",
								icon: Icons.Import,
								click: () => handleCalendarImport(groupRoot),
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
					(isApp() || isDesktop()) && isExternal
						? {
								label: () => "Sync",
								icon: Icons.Sync,
								size: ButtonSize.Compact,
								click: () => {
									this.viewModel.forceSyncExternal(existingGroupSettings, true)?.catch(async (e) => {
										await Dialog.message(() => e.message)
									})
								},
						  }
						: null,
					calendarInfo.userIsOwner
						? {
								label: isExternal ? "unsubscribe_action" : "delete_action",
								icon: Icons.Trash,
								click: () => this.confirmDeleteCalendar(calendarInfo),
						  }
						: null,
				],
			}),
		})
	}

	private allowCalendarImport(group: Group, user: User, groupSettings: GroupSettings | null) {
		return group.type === GroupType.Calendar && hasCapabilityOnGroup(user, group, ShareCapability.Write) && !hasSourceUrl(groupSettings)
	}

	private confirmDeleteCalendar(calendarInfo: CalendarInfo) {
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

	private onPressedEditCalendar(
		groupInfo: GroupInfo,
		colorValue: string,
		existingGroupSettings: GroupSettings | null,
		userSettingsGroupRoot: UserSettingsGroupRoot,
		shared: boolean,
	) {
		showCreateEditCalendarDialog({
			calendarType: hasSourceUrl(existingGroupSettings) ? CalendarType.URL : CalendarType.NORMAL,
			titleTextId: "edit_action",
			shared,
			okAction: (dialog, properties) => this.handleModifiedCalendar(dialog, properties, shared, groupInfo, existingGroupSettings, userSettingsGroupRoot),
			okTextId: "save_action",
			calendarProperties: {
				name: getSharedGroupName(groupInfo, locator.logins.getUserController(), shared),
				color: colorValue.substring(1),
				alarms: existingGroupSettings?.defaultAlarmsList.map((alarm) => parseAlarmInterval(alarm.trigger)) ?? [],
				sourceUrl: existingGroupSettings?.sourceUrl ?? null,
			},
			isNewCalendar: false,
			calendarModel: this.viewModel.getCalendarModel(),
		})
	}

	private handleModifiedCalendar(
		dialog: Dialog,
		properties: CalendarProperties,
		shared: boolean,
		groupInfo: GroupInfo,
		existingGroupSettings: GroupSettings | null,
		userSettingsGroupRoot: UserSettingsGroupRoot,
	) {
		if (!shared) {
			groupInfo.name = properties.name
			locator.entityClient.update(groupInfo)
		}

		const shouldSyncExternal = !!(existingGroupSettings && hasSourceUrl(existingGroupSettings) && existingGroupSettings.sourceUrl !== properties.sourceUrl)
		const alarms = properties.alarms.map((alarm) => createDefaultAlarmInfo({ trigger: serializeAlarmInterval(alarm) }))
		// color always set for existing calendar
		if (existingGroupSettings) {
			existingGroupSettings.color = properties.color
			existingGroupSettings.name = shared && properties.name !== groupInfo.name ? properties.name : null
			existingGroupSettings.defaultAlarmsList = alarms
			existingGroupSettings.sourceUrl = properties.sourceUrl
		} else {
			const newGroupSettings = createGroupSettings({
				group: groupInfo.group,
				color: properties.color,
				name: shared && properties.name !== groupInfo.name ? properties.name : null,
				defaultAlarmsList: alarms,
				sourceUrl: properties.sourceUrl,
			})
			userSettingsGroupRoot.groupSettings.push(newGroupSettings)
		}

		locator.entityClient.update(userSettingsGroupRoot).then(() => {
			if (shouldSyncExternal)
				this.viewModel.forceSyncExternal(existingGroupSettings)?.catch(async (e) => {
					showSnackBar({
						message: () => e.message,
						button: {
							label: "ok_action",
							click: noOp,
						},
						waitingTime: 500,
					})
				})
		})
		dialog.close()
	}

	view({ attrs }: Vnode<CalendarViewAttrs>): Children {
		return m(
			".main-view",
			m(this.viewSlider, {
				header: m(Header, {
					searchBar: attrs.lazySearchBar,
					...attrs.header,
				}),
				bottomNav: attrs.bottomNav?.(),
			}),
		)
	}

	onNewUrl(args: Record<string, any>) {
		if (!args.view) {
			this.setUrl(this.currentViewType, this.viewModel.selectedDate(), true)
		} else {
			this.currentViewType = CalendarViewTypeByValue[args.view as CalendarViewType] ? args.view : CalendarViewType.MONTH

			const urlDateParam = args.date

			if (urlDateParam) {
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

				const today = new Date()
				if (isSameDayOfDate(today, date) || (args.view === "week" && getWeekNumber(date) === getWeekNumber(today))) {
					const time = Time.fromDate(today)
					this.viewModel.setSelectedTime(time)
				} else {
					this.viewModel.setSelectedTime(undefined)
				}
			}

			deviceConfig.setDefaultCalendarView(locator.logins.getUserController().user._id, this.currentViewType)
		}
	}

	getViewSlider(): ViewSlider {
		return this.viewSlider
	}

	private setUrl(view: string, date: Date, replace: boolean = false, resetState: boolean = false) {
		const dateString = DateTime.fromJSDate(date).toISODate() ?? DateTime.now().toISODate()

		m.route.set(
			"/calendar/:view/:date",
			{
				view,
				date: dateString,
			},
			{
				replace,
				state: this.buildRouteState(view, resetState, dateString),
			},
		)
	}

	private buildRouteState(view: string, resetState: boolean, dateString: string) {
		const shouldBuild = isApp() && !resetState && view === CalendarViewType.AGENDA
		if (!shouldBuild) return undefined

		const returnDate = history.state?.dateString ?? dateString
		if (
			m.route.get().includes(CalendarViewType.MONTH) ||
			(m.route.get().includes(CalendarViewType.AGENDA) && history.state?.origin === CalendarViewType.MONTH)
		) {
			return { origin: CalendarViewType.MONTH, dateString: returnDate }
		}
	}

	private async onEventSelected(selectedEvent: CalendarEvent, domEvent: MouseOrPointerEvent, htmlSanitizerPromise: Promise<HtmlSanitizer>) {
		const domTarget = domEvent.currentTarget

		if (domTarget == null || !(domTarget instanceof HTMLElement)) {
			return
		}

		const x = domEvent.clientX
		const y = domEvent.clientY

		// We want the popup to show at the users mouse
		const rect = {
			bottom: y,
			height: 0,
			width: 0,
			top: y,
			left: x,
			right: x,
		}

		await this.showCalendarEventPopup(selectedEvent, rect, htmlSanitizerPromise)
	}

	private handleEventKeyDown(): CalendarEventBubbleKeyDownHandler {
		return (calendarEvent, domEvent) => {
			if (isKeyPressed(domEvent.key, Keys.RETURN, Keys.SPACE) && !domEvent.repeat) {
				this.showCalendarEventPopupAtEvent(calendarEvent, domEvent.target as HTMLElement, this.htmlSanitizer)
				domEvent.stopPropagation()
			}
			if (isKeyPressed(domEvent.key, Keys.DELETE) && !domEvent.repeat) {
				this.openDeletePopup(calendarEvent, domEvent)
				domEvent.stopPropagation()
			}
		}
	}

	private openDeletePopup(calendarEvent: CalendarEvent, domEvent: KeyboardEvent) {
		locator.calendarEventPreviewModel(calendarEvent, this.viewModel.calendarInfos).then((eventPreviewModel: CalendarEventPreviewViewModel) => {
			showDeletePopup(eventPreviewModel, new MouseEvent("click", {}), domEvent.target as HTMLElement)
		})
	}

	private async showCalendarEventPopup(selectedEvent: CalendarEvent, eventBubbleRect: PosRect, htmlSanitizerPromise: Promise<HtmlSanitizer>) {
		const calendars = await this.viewModel.getCalendarInfosCreateIfNeeded()
		const [popupModel, htmlSanitizer] = await Promise.all([locator.calendarEventPreviewModel(selectedEvent, calendars), htmlSanitizerPromise])

		new CalendarEventPopup(popupModel, eventBubbleRect, htmlSanitizer).show()
	}

	private async showCalendarEventPopupAtEvent(selectedEvent: CalendarEvent, target: HTMLElement, htmlSanitizerPromise: Promise<HtmlSanitizer>) {
		const targetRect = target.getBoundingClientRect()
		const rect = {
			bottom: targetRect.bottom,
			height: 0,
			width: 0,
			top: targetRect.top,
			left: targetRect.left,
			right: targetRect.right,
		}
		await this.showCalendarEventPopup(selectedEvent, rect, htmlSanitizerPromise)
	}

	private showCalendarPopup(dom: HTMLElement) {
		// When the user clicks the month name in the header, the target can be the month's name or the icon on the right
		// side of month's name, so we hardcoded the left spacing to be the same used by the month name, so doesn't matter
		// if the user clicks on month's name or on the icon
		// noinspection JSSuspiciousNameCombination
		const elementRect = { ...dom.getBoundingClientRect(), left: size.button_height }

		const selector = new DaySelectorPopup(elementRect, {
			selectedDate: getStartOfDay(this.viewModel.selectedDate()),
			onDateSelected: (date: Date) => {
				this.viewModel.selectedDate(date)
				this.setUrl(this.currentViewType, date)
				selector.close()
			},
			startOfTheWeekOffset: getStartOfTheWeekOffset(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek as WeekStart),
			highlightToday: true,
			highlightSelectedWeek: this.currentViewType === CalendarViewType.WEEK,
			hasEventsOn: (date) => this.hasEventsOn(date),
		})

		selector.show()
	}

	private hasEventsOn(date: Date): boolean {
		return daysHaveEvents(this.viewModel.getEventsOnDaysToRender([date]))
	}
}
