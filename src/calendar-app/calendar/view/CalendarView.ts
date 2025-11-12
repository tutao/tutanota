import m, { Children, Component, redraw, Vnode } from "mithril"
import { AppHeaderAttrs, Header } from "../../../common/gui/Header.js"
import { ColumnType, ViewColumn } from "../../../common/gui/base/ViewColumn"
import { lang } from "../../../common/misc/LanguageViewModel"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider.js"
import { isKeyPressed, Key, keyboardEventToKeyPress, keyManager, Shortcut } from "../../../common/misc/KeyManager"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { base64ToBase64Url, base64UrlToBase64, decodeBase64, downcast, getStartOfDay, last, noOp, ofClass, stringToBase64 } from "@tutao/tutanota-utils"
import {
	CalendarEvent,
	CalendarGroupRoot,
	CalendarGroupRootTypeRef,
	Contact,
	ContactTypeRef,
	createDefaultAlarmInfo,
	GroupSettings,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import {
	DEFAULT_CALENDAR_COLOR,
	GroupType,
	Keys,
	NewPaidPlans,
	reverse,
	ShareCapability,
	TimeFormat,
	WeekStart,
} from "../../../common/api/common/TutanotaConstants"
import { locator } from "../../../common/api/main/CommonLocator"
import {
	CalendarType,
	extractContactIdFromEvent,
	findFirstPrivateCalendar,
	getTimeZone,
	hasSourceUrl,
	isBirthdayCalendar,
	isBirthdayEvent,
	parseAlarmInterval,
} from "../../../common/calendar/date/CalendarUtils"
import { ButtonColor } from "../../../common/gui/base/Button.js"
import { CalendarMonthView } from "./CalendarMonthView"
import { DateTime } from "luxon"
import { LockedError, NotFoundError } from "../../../common/api/common/error/RestError"
import { CalendarAgendaView, CalendarAgendaViewAttrs } from "./CalendarAgendaView"
import { type CalendarProperties, handleUrlSubscription, showCreateEditCalendarDialog, showEditBirthdayCalendarDialog } from "../gui/EditCalendarDialog.js"
import { styles } from "../../../common/gui/styles"
import { MultiDayCalendarView, MultiDayCalendarViewAttrs } from "./MultiDayCalendarView"
import { Dialog } from "../../../common/gui/base/Dialog"
import { isApp, isDesktop } from "../../../common/api/common/Env"
import { size } from "../../../common/gui/size"
import { FolderColumnView } from "../../../common/gui/FolderColumnView.js"
import { deviceConfig } from "../../../common/misc/DeviceConfig"
import { exportCalendar, handleCalendarImport } from "../../../common/calendar/gui/CalendarImporterDialog.js"
import { showNotAvailableForFreeDialog, showPlanUpgradeRequiredDialog } from "../../../common/misc/SubscriptionDialogs"
import { getSharedGroupName, hasCapabilityOnGroup, loadGroupMembers } from "../../../common/sharing/GroupUtils"
import { GroupInvitationFolderRow } from "../../../common/sharing/view/GroupInvitationFolderRow"
import { SidebarSection } from "../../../common/gui/SidebarSection"
import { HtmlSanitizer } from "../../../common/misc/HtmlSanitizer"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"
import { calendarNavConfiguration, daysHaveEvents, shouldDefaultToAmPmTimeFormat, showDeletePopup } from "../gui/CalendarGuiUtils.js"
import { CalendarEventBubbleKeyDownHandler, CalendarPreviewModels, CalendarViewModel, MouseOrPointerEvent, ScrollByListener } from "./CalendarViewModel"
import { CalendarEventPopup } from "../gui/eventpopup/CalendarEventPopup.js"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { CalendarInfo, CalendarInfoBase, CalendarModel } from "../model/CalendarModel"
import type Stream from "mithril/stream"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { createDropdown, DropdownChildAttrs, PosRect } from "../../../common/gui/base/Dropdown.js"
import { ButtonSize } from "../../../common/gui/base/ButtonSize.js"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu.js"
import { BaseTopLevelView } from "../../../common/gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../../TopLevelView.js"
import { CalendarViewType, getEventWithDefaultTimes, serializeAlarmInterval, setNextHalfHour } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { BackgroundColumnLayout } from "../../../common/gui/BackgroundColumnLayout.js"
import { theme } from "../../../common/gui/theme.js"
import { CalendarMobileHeader } from "./CalendarMobileHeader.js"
import { CalendarDesktopToolbar } from "./CalendarDesktopToolbar.js"
import { DaySelectorSidebar } from "../gui/day-selector/DaySelectorSidebar.js"
import { CalendarOperation } from "../gui/eventeditor-model/CalendarEventModel.js"
import { DaySelectorPopup } from "../gui/day-selector/DaySelectorPopup.js"
import { CalendarEventPreviewViewModel } from "../gui/eventpopup/CalendarEventPreviewViewModel.js"
import { client } from "../../../common/misc/ClientDetector.js"
import { FloatingActionButton } from "../../gui/FloatingActionButton.js"
import { progressIcon } from "../../../common/gui/base/Icon.js"
import { Group, GroupInfo, User } from "../../../common/api/entities/sys/TypeRefs.js"
import { getExternalCalendarName, parseCalendarStringData } from "../../../common/calendar/gui/ImportExportUtils.js"
import type { ParsedEvent } from "../../../common/calendar/gui/CalendarImporter.js"
import { showSnackBar } from "../../../common/gui/base/SnackBar.js"
import { elementIdPart } from "../../../common/api/common/utils/EntityUtils.js"
import { ContactEventPopup } from "../gui/eventpopup/CalendarContactPopup.js"
import { CalendarContactPreviewViewModel } from "../gui/eventpopup/CalendarContactPreviewViewModel.js"
import { ContactEditor } from "../../../mail-app/contacts/ContactEditor.js"
import { EventEditorDialog } from "../gui/eventeditor-view/CalendarEventEditDialog.js"
import { getStartOfTheWeekOffset, getStartOfTheWeekOffsetForUser } from "../../../common/misc/weekOffset"
import { MobileHeader } from "../../../common/gui/MobileHeader.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import {
	EventDetailsView,
	EventDetailsViewAttrs,
	handleEventDeleteButtonClick,
	handleEventEditButtonClick,
	handleSendUpdatesClick,
} from "./EventDetailsView.js"
import { ContactCardViewer } from "../../../mail-app/contacts/view/ContactCardViewer.js"
import { calendarLocator } from "../../calendarLocator.js"
import { PartialRecipient } from "../../../common/api/common/recipients/Recipient.js"
import { simulateMailToClick } from "../gui/eventpopup/ContactPreviewView.js"
import { CalendarSidebarRow, CalendarSidebarRowAttrs } from "../gui/CalendarSidebarRow"
import { showGroupSharingDialog } from "../../../common/sharing/view/GroupSharingDialog"
import { UserController } from "../../../common/api/main/UserController"

export type GroupColors = Map<Id, string>

export interface CalendarViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	calendarViewModel: CalendarViewModel
	bottomNav?: () => Children
	lazySearchBar: () => Children
}

const CalendarViewTypeByValue = reverse(CalendarViewType)

export class CalendarView extends BaseTopLevelView implements TopLevelView<CalendarViewAttrs> {
	private readonly sidebarColumn: ViewColumn
	private readonly contentColumn: ViewColumn
	private readonly eventDetails?: ViewColumn
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
		this.htmlSanitizer = import("../../../common/misc/HtmlSanitizer").then((m) => m.getHtmlSanitizer())
		this.sidebarColumn = new ViewColumn(
			{
				view: () =>
					m(FolderColumnView, {
						drawer: attrs.drawerAttrs,
						button:
							!isApp() && styles.isDesktopLayout()
								? {
										label: "newEvent_action",
										click: () => this.createNewEventDialog(),
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
																click: () => this.onPressedAddCalendar(CalendarType.Private),
																icon: Icons.Add,
																size: ButtonSize.Compact,
															},
															{
																label: "addCalendarFromURL_action",
																icon: Icons.Link,
																size: ButtonSize.Compact,
																click: () => this.onPressedAddCalendar(CalendarType.External),
															},
														],
													})
												: () => this.onPressedAddCalendar(CalendarType.Private),
										icon: Icons.Add,
										size: ButtonSize.Compact,
									}),
									hideIfEmpty: true,
								},
								this.renderCalendars(CalendarType.Private),
								this.renderBirthdayCalendar(),
							),
							m(
								SidebarSection,
								{
									name: "calendarShared_label",
									hideIfEmpty: true,
								},
								this.renderCalendars(CalendarType.Shared),
							),
							m(
								SidebarSection,
								{
									name: "calendarSubscriptions_label",
									hideIfEmpty: true,
								},
								this.renderCalendars(CalendarType.External),
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
				minWidth: size.first_col_min_width,
				maxWidth: size.first_col_max_width,
				headerCenter: this.currentViewType === CalendarViewType.WEEK ? "month_label" : "calendar_label",
			},
		)

		this.contentColumn = new ViewColumn(
			{
				view: () => {
					switch (this.currentViewType) {
						case CalendarViewType.MONTH:
							return m(BackgroundColumnLayout, {
								backgroundColor: theme.surface_container,
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
									groupColors: this.viewModel.calendarColors,
									hiddenCalendars: this.viewModel.hiddenCalendars,
									dragHandlerCallbacks: this.viewModel,
								}),
								floatingActionButton: this.renderFab.bind(this),
							})
						case CalendarViewType.DAY:
							return m(BackgroundColumnLayout, {
								backgroundColor: theme.surface_container,
								desktopToolbar: () => this.renderDesktopToolbar(),
								mobileHeader: () => this.renderMobileHeader(attrs.header),
								columnLayout: m(MultiDayCalendarView, {
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
									onChangeViewPeriod: (next) => this.viewPeriod(CalendarViewType.DAY, next),
									startOfTheWeek: downcast(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
									dragHandlerCallbacks: this.viewModel,
									isDaySelectorExpanded: this.viewModel.isDaySelectorExpanded(),
									onViewChanged: (vnode) => this.viewModel.setViewParameters(vnode.dom as HTMLElement),
									currentViewType: this.currentViewType,
									showWeekDaysSection: !styles.isDesktopLayout(),
									smoothScroll: this.viewModel.forceAnimateScroll,
									registerScrollByListener: (listener: ScrollByListener) => this.viewModel.setScrollByListener(listener),
									removeScrollByListener: this.viewModel.removeScrollByListener,
								} satisfies MultiDayCalendarViewAttrs),
								floatingActionButton: this.renderFab.bind(this),
								columnLayoutWrapperClass: "min-height-0",
							})

						case CalendarViewType.WEEK:
							return m(BackgroundColumnLayout, {
								backgroundColor: theme.surface_container,
								desktopToolbar: () => this.renderDesktopToolbar(),
								mobileHeader: () => this.renderMobileHeader(attrs.header),
								columnLayout: m(MultiDayCalendarView, {
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
									onChangeViewPeriod: (next) => this.viewPeriod(CalendarViewType.WEEK, next),
									dragHandlerCallbacks: this.viewModel,
									isDaySelectorExpanded: this.viewModel.isDaySelectorExpanded(),
									onViewChanged: (vnode) => this.viewModel.setViewParameters(vnode.dom as HTMLElement),
									currentViewType: this.currentViewType,
									showWeekDaysSection: true,
									smoothScroll: this.viewModel.forceAnimateScroll,
									registerScrollByListener: (listener: ScrollByListener) => this.viewModel.setScrollByListener(listener),
									removeScrollByListener: this.viewModel.removeScrollByListener,
								} satisfies MultiDayCalendarViewAttrs),
								floatingActionButton: this.renderFab.bind(this),
								columnLayoutWrapperClass: "min-height-0",
							})

						case CalendarViewType.THREE_DAY:
							return m(BackgroundColumnLayout, {
								backgroundColor: theme.surface_container,
								desktopToolbar: () => this.renderDesktopToolbar(),
								mobileHeader: () => this.renderMobileHeader(attrs.header),
								columnLayout: m(MultiDayCalendarView, {
									getEventsOnDays: this.viewModel.getEventsOnDaysToRender.bind(this.viewModel),
									daysInPeriod: 3,
									onEventClicked: (event, domEvent) => this.onEventSelected(event, domEvent, this.htmlSanitizer),
									onEventKeyDown: this.handleEventKeyDown(),
									onNewEvent: (date) => {
										this.createNewEventDialog(date)
									},
									selectedDate: this.viewModel.selectedDate(),
									onDateSelected: (date, viewType) => {
										this.viewModel.selectedDate(date)
										this.setUrl(viewType ?? CalendarViewType.THREE_DAY, date)
									},
									startOfTheWeek: downcast(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
									onChangeViewPeriod: (next) => this.viewPeriod(CalendarViewType.THREE_DAY, next),
									dragHandlerCallbacks: this.viewModel,
									isDaySelectorExpanded: this.viewModel.isDaySelectorExpanded(),
									onViewChanged: (vnode) => this.viewModel.setViewParameters(vnode.dom as HTMLElement),
									currentViewType: this.currentViewType,
									showWeekDaysSection: true,
									smoothScroll: this.viewModel.forceAnimateScroll,
									registerScrollByListener: (listener: ScrollByListener) => this.viewModel.setScrollByListener(listener),
									removeScrollByListener: this.viewModel.removeScrollByListener,
								} satisfies MultiDayCalendarViewAttrs),
								floatingActionButton: this.renderFab.bind(this),
								columnLayoutWrapperClass: "min-height-0",
							})

						case CalendarViewType.AGENDA:
							return m(BackgroundColumnLayout, {
								backgroundColor: theme.surface_container,
								desktopToolbar: () => this.renderDesktopToolbar(),
								mobileHeader: () => this.renderMobileHeader(attrs.header),
								columnLayout: m(CalendarAgendaView, {
									selectedDate: this.viewModel.selectedDate(),
									selectedTime: this.viewModel.agendaViewSelectedTime,
									eventsForDays: this.viewModel.eventsForDays,
									amPmFormat: shouldDefaultToAmPmTimeFormat(),
									onEventClicked: (event, domEvent) => {
										if (styles.isDesktopLayout()) {
											this.viewModel.updatePreviewedEvent(event)
										} else if (isApp()) {
											this.viewModel.updatePreviewedEvent(event).then(() => {
												const eventId = base64ToBase64Url(stringToBase64(event._id.join("/")))
												this.setUrl(this.currentViewType, this.viewModel.selectedDate(), false, false, eventId)
											})
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

										const keyboardKeys = keyboardEventToKeyPress(domEvent)
										if (keyboardKeys.ctrlOrCmd && isKeyPressed(keyboardKeys.key, Keys.D) && !domEvent.repeat) {
											this.duplicateEvent(event)
											domEvent.stopPropagation()
										}
									},
									groupColors: this.viewModel.calendarColors,
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
									onEditContact: (contact) => {
										new ContactEditor(locator.entityClient, contact).show()
									},
									onWriteMail: async (recipient) => {
										const { writeMail } = await import("../../../mail-app/contacts/view/ContactView.js")
										writeMail(recipient)
									},
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
				minWidth: size.second_col_min_width + size.third_col_min_width,
				maxWidth: size.second_col_max_width + size.third_col_max_width,
			},
		)

		const columns = [this.sidebarColumn, this.contentColumn]

		// Adds eventDetails column to show events at agenda view as full page instead of a popover
		if (isApp()) {
			this.eventDetails = new ViewColumn(
				{
					view: () => this.renderEventDetailsColumn(attrs),
				},
				ColumnType.Background,
				{
					// We add a really large minWidth and maxWidth to ensure that this is only rendered in
					// a single column layout. If we would not add the column in a single column layout in the
					// first place, this would break on screen orientation changes for large mobile devices,
					// (basically every tablet), because landscape orientation uses the mobileDesktopLayout and
					// the portrait orientation uses the singleColumnLayout.
					minWidth: size.only_show_in_single_column_min_max_width,
					maxWidth: size.only_show_in_single_column_min_max_width,
				},
			)

			columns.push(this.eventDetails)
		}

		this.viewSlider = new ViewSlider(columns)

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
			this.viewSlider.focus(this.contentColumn)
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

	private renderEventDetailsColumn(attrs: CalendarViewAttrs) {
		const isEventDetailsColumnVisible = this.viewSlider.focusedColumn === this.eventDetails
		if (!isEventDetailsColumnVisible) {
			return null
		}

		if (!isApp()) {
			this.viewSlider.focus(this.viewSlider.getMainColumn())
			return null
		}

		if (!this.viewModel.eventPreviewModel && calendarLocator.syncTracker.isSyncDone()) {
			this.exitEventDetails()
			return null
		}

		if (!this.viewModel.eventPreviewModel) {
			return m(".flex-center.items-center.full-height", progressIcon())
		}

		const children: Array<Children> = []
		if (this.viewModel.eventPreviewModel instanceof CalendarContactPreviewViewModel) {
			const id = this.viewModel.eventPreviewModel.calendarEvent._id
			const idParts = id[1].split("#")

			const contactId = extractContactIdFromEvent(last(idParts))
			if (contactId == null) {
				return null
			}

			children.push(this.renderContactPreview(this.viewModel.eventPreviewModel.contact))
		} else {
			children.push(this.renderEventPreview())
		}

		const header = m(MobileHeader, {
			...attrs.header,
			backAction: this.exitEventDetails.bind(this),
			columnType: "other",
			title: "agenda_label",
			actions: styles.isSingleColumnLayout() ? this.renderEventDetailsActions() : null,
			multicolumnActions: () => [],
			primaryAction: () => null,
			useBackButton: true,
		})

		return m(BackgroundColumnLayout, {
			backgroundColor: theme.surface_container,
			desktopToolbar: () => header,
			mobileHeader: () => header,
			columnLayout: children,
		})
	}

	private renderEventPreview(): Children {
		if (!(this.viewModel.eventPreviewModel instanceof CalendarEventPreviewViewModel)) {
			return null
		}

		return m(
			".height-100p.overflow-y-scroll.mb-l.fill-absolute.pb-l",
			m(
				".border-radius-big.flex.col.flex-grow.content-bg",
				{
					class: styles.isDesktopLayout() ? "mlr-l" : "mlr",
				},
				m(EventDetailsView, {
					eventPreviewModel: this.viewModel.eventPreviewModel,
					editCallback: () => {
						this.exitEventDetails()
					},
					deleteCallback: () => this.exitEventDetails(),
				} satisfies EventDetailsViewAttrs),
			),
		)
	}

	private renderContactPreview(contact: Contact) {
		return m(
			".fill-absolute.flex.col.overflow-y-scroll",
			m(ContactCardViewer, {
				contact: contact,
				editAction: async (contact) => {
					if (!(await Dialog.confirm("openMailApp_msg", "yes_label"))) return

					const query = `contactId=${stringToBase64(contact._id.join("/"))}`
					calendarLocator.systemFacade.openMailApp(stringToBase64(query))
				},
				onWriteMail: (to: PartialRecipient) => simulateMailToClick(to.address),
				extendedActions: true,
			}),
		)
	}

	private renderEventDetailsActions(): Array<Children> {
		const previewModel = this.viewModel.eventPreviewModel
		const actions: Array<Children> = []

		if (previewModel instanceof CalendarEventPreviewViewModel) {
			if (previewModel.canSendUpdates) {
				actions.push(
					m(IconButton, {
						icon: BootIcons.Mail,
						title: "sendUpdates_label",
						click: () => handleSendUpdatesClick(previewModel),
					}),
				)
			}
			if (previewModel.canEdit) {
				actions.push(
					m(IconButton, {
						icon: Icons.Edit,
						title: "edit_action",
						click: (ev: MouseEvent, receiver: HTMLElement) => {
							handleEventEditButtonClick(previewModel, ev, receiver, () => {
								this.exitEventDetails()
							})
						},
					}),
				)
			}
			if (previewModel.canDelete) {
				actions.push(
					m(IconButton, {
						icon: Icons.Trash,
						title: "delete_action",
						click: async (ev: MouseEvent, receiver: HTMLElement) => {
							await handleEventDeleteButtonClick(previewModel, ev, receiver, () => this.exitEventDetails())
						},
					}),
				)
			}
		}

		return actions
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
				this.setUrl(m.route.param("view"), new Date())
				this.viewModel.triggerForceAnimateScroll()
			},
			onViewTypeSelected: (viewType) => this.setUrl(viewType, this.viewModel.selectedDate(), false, true),
		})
	}

	private renderMobileHeader(header: AppHeaderAttrs) {
		const isExpandable = !styles.isDesktopLayout() && this.currentViewType !== CalendarViewType.MONTH && this.currentViewType !== CalendarViewType.THREE_DAY
		return m(CalendarMobileHeader, {
			...header,
			viewType: this.currentViewType,
			viewSlider: this.viewSlider,
			showExpandIcon: isExpandable,
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
				this.setUrl(m.route.param("view"), new Date())
				this.viewModel.triggerForceAnimateScroll()
			},
			onViewTypeSelected: (viewType) => this.setUrl(viewType, this.viewModel.selectedDate(), false, true),
			onTap: (_event, dom) => {
				if (this.currentViewType !== CalendarViewType.MONTH && this.currentViewType !== CalendarViewType.THREE_DAY && styles.isSingleColumnLayout()) {
					this.viewModel.setDaySelectorExpanded(!this.viewModel.isDaySelectorExpanded())
					return
				}

				if (isExpandable) {
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
				exec: () => this.setUrl(CalendarViewType.THREE_DAY, this.viewModel.selectedDate()),
				help: "switchAgendaView_action",
			},
			{
				key: Keys.FOUR,
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
					this.viewModel.scroll(-Number.MAX_SAFE_INTEGER)
				},
				help: "scrollToTop_action",
			},
			{
				key: Keys.END,
				enabled: getIfNotView(CalendarViewType.MONTH),
				exec: () => {
					this.viewModel.scroll(Number.MAX_SAFE_INTEGER)
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
			const eventEditor = new EventEditorDialog()
			await eventEditor.showNewCalendarEventEditDialog(model)
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
			case CalendarViewType.THREE_DAY:
				duration = {
					day: 3,
				}
				unit = "day"
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
		this.setUrl(viewType, newDate, false)

		m.redraw()
	}

	private onPressedAddCalendar(calendarType: CalendarType) {
		const userController = locator.logins.getUserController()
		if (userController.isFreeAccount()) {
			showNotAvailableForFreeDialog()
			return
		}
		if (calendarType === CalendarType.External)
			userController.isNewPaidPlan().then((isNewPaidPlan) => {
				if (isNewPaidPlan) this.showCreateCalendarDialog(calendarType)
				else showPlanUpgradeRequiredDialog(NewPaidPlans)
			})
		else this.showCreateCalendarDialog(calendarType)
	}

	private showCreateCalendarDialog(calendarType: CalendarType) {
		const createNormalCalendar = async (dialog: Dialog, properties: CalendarProperties, calendarModel: CalendarModel) => {
			await calendarModel.createCalendar(properties.nameData.name, properties.color, properties.alarms, null)
			dialog.close()
		}
		const createExternalCalendar = async (dialog: Dialog, properties: CalendarProperties, calendarModel: CalendarModel) => {
			if (this.viewModel.isCreatingExternalCalendar) {
				return
			}
			this.viewModel.isCreatingExternalCalendar = true

			const iCalStr = await handleUrlSubscription(calendarModel, properties.sourceUrl!)
			if (iCalStr instanceof Error) throw iCalStr

			let events: ParsedEvent[] = []
			try {
				events = parseCalendarStringData(iCalStr, getTimeZone()).contents
			} catch (e) {
				await Dialog.message("invalidICal_error", e.message)
				this.viewModel.isCreatingExternalCalendar = false
				return
			}

			const calendarGroup = await calendarModel.createCalendar(getExternalCalendarName(iCalStr), properties.color, [], properties.sourceUrl)
			const calendarGroupRoot = await locator.entityClient.load(CalendarGroupRootTypeRef, calendarGroup._id)
			deviceConfig.updateLastSync(calendarGroup._id)

			let calendarInfo = await this.viewModel.getCalendarModel().getCalendarInfo(calendarGroup._id)
			if (!calendarInfo) {
				console.warn(`CalendarInfo not available during external calendar subscription - CalendarId (${calendarGroup._id})`)
				calendarInfo = {
					id: calendarGroup._id,
					name: "",
					color: DEFAULT_CALENDAR_COLOR,
					type: CalendarType.External,
				}
			}
			await handleCalendarImport(calendarGroupRoot, calendarInfo, events, CalendarType.External)
			this.viewModel.isCreatingExternalCalendar = false
			dialog.close()
		}

		switch (calendarType) {
			case CalendarType.Private:
				showCreateEditCalendarDialog({
					calendarType,
					titleTextId: "add_action",
					okAction: createNormalCalendar,
					okTextId: "save_action",
					calendarModel: this.viewModel.getCalendarModel(),
				})
				break
			case CalendarType.External:
				showCreateEditCalendarDialog({
					calendarType,
					titleTextId: "newCalendarSubscriptionsDialog_title",
					okAction: createExternalCalendar,
					okTextId: "subscribe_action",
					warningMessage: () => m(".smaller.content-fg", lang.get("externalCalendarInfo_msg")),
					calendarModel: this.viewModel.getCalendarModel(),
				})
				break
			default:
				throw new Error(`Not allowed to create a calendar of type ${calendarType.toString()}`)
		}
	}

	private renderCalendars(calendarType: CalendarType): Children {
		const calendarInfos = this.viewModel
			.getCalendarModel()
			.getAvailableCalendars()
			.filter((calendarInfo) => {
				return calendarInfo.type === calendarType
			}) as Array<CalendarInfo>

		const userController = locator.logins.getUserController()

		return calendarInfos.map((calendarInfo) => {
			const rightIconData = this.viewModel.getIcon(calendarInfo.id, calendarInfo.type)
			const existingGroupSettings = userController.userSettingsGroupRoot.groupSettings.find((gc) => gc.group === calendarInfo.groupInfo.group)

			return m(CalendarSidebarRow, {
				id: calendarInfo.id,
				name: calendarInfo.name,
				color: calendarInfo.color,
				isHidden: this.viewModel.hiddenCalendars.has(calendarInfo.id),
				toggleHiddenCalendar: this.viewModel.toggleHiddenCalendar,
				rightIcon: rightIconData,
				actions: this.buildActions(calendarInfo, userController, existingGroupSettings),
			} satisfies CalendarSidebarRowAttrs)
		})
	}

	private renderBirthdayCalendar() {
		const calendarInfo = this.viewModel.getCalendarModel().getBirthdayCalendarInfo()

		return m(CalendarSidebarRow, {
			id: calendarInfo.id,
			name: lang.get("birthdayCalendar_label"),
			color: calendarInfo.color,
			isHidden: this.viewModel.hiddenCalendars.has(calendarInfo.id),
			toggleHiddenCalendar: this.viewModel.toggleHiddenCalendar,
			actions: [
				{
					label: "edit_action",
					icon: Icons.Edit,
					click: () => this.onPressedEditBirthdayCalendar(calendarInfo),
				},
			],
		} satisfies CalendarSidebarRowAttrs)
	}

	private handleDelete(calendarInfo: CalendarInfo) {
		const calendarName = getSharedGroupName(calendarInfo.groupInfo, locator.logins.getUserController().userSettingsGroupRoot, false)
		loadGroupMembers(calendarInfo.group, locator.entityClient).then((members) => {
			const ownerMail = locator.logins.getUserController().userGroupInfo.mailAddress
			const otherMembers = members.filter((member) => member.info.mailAddress !== ownerMail)
			Dialog.confirm(
				lang.makeTranslation(
					"confirm_msg",
					(otherMembers.length > 0
						? lang.get("deleteSharedCalendarConfirm_msg", {
								"{calendar}": calendarName,
							}) + " "
						: "") +
						lang.get("deleteCalendarConfirm_msg", {
							"{calendar}": calendarName,
						}),
				),
			).then((confirmed) => {
				if (confirmed) {
					this.viewModel.deleteCalendar(calendarInfo).catch(ofClass(NotFoundError, () => console.log("Calendar to be deleted was not found.")))
				}
			})
		})
	}

	private async handleEdit(calendarInfo: CalendarInfo, existingGroupSettings?: GroupSettings) {
		showCreateEditCalendarDialog({
			calendarType: calendarInfo.type,
			titleTextId: "edit_action",
			okAction: (dialog, properties) => this.handleModifiedCalendar(dialog, properties, calendarInfo, existingGroupSettings),
			okTextId: "save_action",
			calendarProperties: {
				nameData: await this.viewModel.getCalendarNameData(calendarInfo.groupInfo),
				color: calendarInfo.color,
				alarms: existingGroupSettings?.defaultAlarmsList.map((alarm) => parseAlarmInterval(alarm.trigger)) ?? [],
				sourceUrl: existingGroupSettings?.sourceUrl ?? null,
			},
			isNewCalendar: false,
			calendarModel: this.viewModel.getCalendarModel(),
		})
	}

	private async onPressedEditBirthdayCalendar(calendarInfo: CalendarInfoBase) {
		if (!this.viewModel.isNewPaidPlan) {
			showPlanUpgradeRequiredDialog(NewPaidPlans)
			return
		}
		const handleUpdateBirthdayCalendar = (dialog: Dialog, newColor: string) => {
			this.viewModel.handleBirthdayCalendarUpdate(newColor)
			if (client.isCalendarApp()) {
				calendarLocator.systemFacade.requestWidgetRefresh()
			}
			dialog.close()
		}
		showEditBirthdayCalendarDialog({
			okAction: handleUpdateBirthdayCalendar,
			color: calendarInfo.color,
		})
	}

	private handleModifiedCalendar(dialog: Dialog, properties: CalendarProperties, calendarInfo: CalendarInfo, existingGroupSettings?: GroupSettings) {
		const { groupInfo, hasMultipleMembers, userIsOwner } = calendarInfo
		if (userIsOwner) {
			// if it is a shared calendar and the shared name has been changed the entity needs to be updated
			// the name on the entity is what is shared with everyone
			this.viewModel.setCalendarGroupInfoName(groupInfo, properties.nameData.name)
		}

		const shouldSyncExternal = !!(existingGroupSettings && hasSourceUrl(existingGroupSettings) && existingGroupSettings.sourceUrl !== properties.sourceUrl)
		const alarms = properties.alarms.map((alarm) => createDefaultAlarmInfo({ trigger: serializeAlarmInterval(alarm) }))
		this.viewModel
			.setCalendarGroupSettings(groupInfo, {
				color: properties.color,
				name: properties.nameData.kind === "shared" ? properties.nameData.customName : null,
				defaultAlarmsList: alarms,
				sourceUrl: properties.sourceUrl,
			})
			.then(() => {
				if (shouldSyncExternal)
					this.viewModel.forceSyncExternal(existingGroupSettings)?.catch(async (e) => {
						showSnackBar({
							message: lang.makeTranslation("exception_msg", e.message),
							button: {
								label: "ok_action",
								click: noOp,
							},
							waitingTime: 500,
						})
					})
			})
			.catch(ofClass(LockedError, noOp))

		if (client.isCalendarApp()) {
			calendarLocator.systemFacade.requestWidgetRefresh()
		}

		dialog.close()
	}

	view({ attrs }: Vnode<CalendarViewAttrs>): Children {
		return m(
			".main-view",
			m(this.viewSlider, {
				header: m(Header, {
					firstColWidth: this.sidebarColumn.width,
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
			const eventIdParam = args.eventId
			const urlDateParam = args.date

			if (urlDateParam) {
				// Unlike JS, Luxon assumes local time zone when parsing and not UTC. That's what we want
				const luxonDate = DateTime.fromISO(urlDateParam)

				let date = new Date()

				if (luxonDate.isValid) {
					date = luxonDate.toJSDate()
				}

				if (this.viewModel.selectedDate().getTime() !== date.getTime()) {
					this.viewModel.selectedDate(date)
					m.redraw()
				}

				if (eventIdParam && (!isApp() || this.eventDetails)) {
					try {
						const decodedEventId = decodeBase64("utf-8", base64UrlToBase64(eventIdParam)).split("/")
						locator.logins.waitForPartialLogin().then(() => {
							this.viewModel.setPreviewedEventId([decodedEventId[0], decodedEventId[1]]).then(() => {
								if (isApp() && this.viewSlider.focusedColumn !== this.eventDetails && this.eventDetails) {
									this.viewSlider.focus(this.eventDetails)
								} else if (!isApp() && !styles.isDesktopLayout()) {
									const eventElement = document.getElementById(eventIdParam)
									if (eventElement && this.viewModel.previewedEventTuple()?.event) {
										this.showCalendarEventPopup(
											this.viewModel.previewedEventTuple()?.event!,
											eventElement.getBoundingClientRect(),
											this.htmlSanitizer,
										)
									}
								}
							})
						})
					} catch (e) {
						this.viewSlider.focus(this.viewSlider.getMainColumn())
						console.warn("Failed to open event", eventIdParam)
					}
				} else if (!eventIdParam && this.viewSlider.focusedColumn === this.eventDetails) {
					console.warn("Focusing event column without eventId")
					this.viewSlider.focus(this.viewSlider.getMainColumn())
				}
			}

			deviceConfig.setDefaultCalendarView(locator.logins.getUserController().user._id, this.currentViewType)
		}
	}

	getViewSlider(): ViewSlider {
		return this.viewSlider
	}

	private setUrl(view: string, date: Date, replace: boolean = false, resetState: boolean = false, eventId?: string) {
		const dateString = DateTime.fromJSDate(date).toISODate() ?? DateTime.now().toISODate()
		const route = eventId != null ? "/calendar/:view/:date/:eventId" : "/calendar/:view/:date"
		m.route.set(
			route,
			{
				view,
				date: dateString,
				...(eventId ? { eventId } : {}),
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
			const keyboardKeys = keyboardEventToKeyPress(domEvent)
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

	private duplicateEvent(calendarEvent: CalendarEvent) {
		locator.calendarEventPreviewModel(calendarEvent, this.viewModel.calendarInfos, []).then((eventPreviewModel: CalendarEventPreviewViewModel) => {
			eventPreviewModel?.duplicateEvent()
		})
	}

	private openDeletePopup(calendarEvent: CalendarEvent, domEvent: KeyboardEvent) {
		locator.calendarEventPreviewModel(calendarEvent, this.viewModel.calendarInfos, []).then((eventPreviewModel: CalendarEventPreviewViewModel) => {
			showDeletePopup(eventPreviewModel, new MouseEvent("click", {}), domEvent.target as HTMLElement)
		})
	}

	private async showCalendarEventPopup(selectedEvent: CalendarEvent, eventBubbleRect: PosRect, htmlSanitizerPromise: Promise<HtmlSanitizer>) {
		let getPreviewModel: Promise<CalendarPreviewModels>
		let popupComponent: CalendarEventPopup | ContactEventPopup

		if (isBirthdayEvent(selectedEvent.uid)) {
			const base64ContactId = last(elementIdPart(selectedEvent._id).split("#"))
			if (!base64ContactId) {
				throw new Error(`Trying to open a birthday ${selectedEvent._id} without a contact id`)
			}
			const contactId = decodeBase64("utf8", base64ContactId).split("/")
			const contact = await locator.entityClient.load(ContactTypeRef, [contactId[0], contactId[1]])
			if (!contact) {
				throw new NotFoundError(`Could not find contact for this birthday event ${selectedEvent._id}`)
			}
			const popupModel = await locator.calendarContactPreviewModel(selectedEvent, contact!, true)
			popupComponent = new ContactEventPopup(popupModel as CalendarContactPreviewViewModel, eventBubbleRect)
		} else {
			const calendars = await this.viewModel.getCalendarInfosCreateIfNeeded()
			getPreviewModel = locator.calendarEventPreviewModel(selectedEvent, calendars, [])
			const [popupModel, htmlSanitizer] = await Promise.all([getPreviewModel, htmlSanitizerPromise])
			popupComponent = new CalendarEventPopup(popupModel as CalendarEventPreviewViewModel, eventBubbleRect, htmlSanitizer)
		}

		popupComponent.show()
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

	private exitEventDetails() {
		this.viewModel.setPreviewedEventId(null) // Make sure there is no event to show
		this.setUrl(this.currentViewType, this.viewModel.selectedDate())
	}

	handleBackButton() {
		if (this.viewSlider.focusedColumn === this.eventDetails) {
			this.exitEventDetails()
			return true
		}

		// Handles back navigation when user entered Agenda view from Month view
		if (this.currentViewType === CalendarViewType.AGENDA && history.state?.origin === CalendarViewType.MONTH) {
			const date = history.state.dateString ?? DateTime.now().toISODate()
			this.setUrl(CalendarViewType.MONTH, date, true)
			return true
		}

		// We do not want to consume the event, just append one action to it
		return false
	}

	private buildActions(calendarInfo: CalendarInfo, userController: UserController, existingGroupSettings?: GroupSettings) {
		const { group, groupInfo, groupRoot, isExternal, userIsOwner, hasMultipleMembers } = calendarInfo
		const actions: Array<DropdownChildAttrs> = [
			{
				label: "edit_action",
				icon: Icons.Edit,
				click: () => this.handleEdit(calendarInfo, existingGroupSettings),
			},
		]

		if (this.canShare(isExternal)) {
			actions.push({
				label: "sharing_label",
				icon: Icons.ContactImport,
				click: () => this.handleShare(userController, groupInfo, hasMultipleMembers),
			})
		}

		if (this.canImport(group, userController.user, existingGroupSettings)) {
			actions.push({
				label: "import_action",
				icon: Icons.Import,
				click: () => handleCalendarImport(groupRoot, calendarInfo),
			})
		}

		if (this.canExport(group, userController.user)) {
			actions.push({
				label: "export_action",
				icon: Icons.Export,
				click: () => this.handleExport(groupInfo, groupRoot, hasMultipleMembers, userController),
			})
		}

		if (this.canSync(isExternal)) {
			actions.push({
				label: lang.makeTranslation("sync_action", "Sync"),
				icon: Icons.Sync,
				click: () =>
					this.viewModel.forceSyncExternal(existingGroupSettings ?? null, true)?.catch(async (e) => {
						await Dialog.message(lang.makeTranslation("confirm_msg", e.message))
					}),
			})
		}

		if (userIsOwner) {
			actions.push({
				label: isExternal ? "unsubscribe_action" : "delete_action",
				icon: Icons.Trash,
				click: () => this.handleDelete(calendarInfo),
			})
		}
		return actions
	}

	private canImport(group: Group, user: User, groupSettings?: GroupSettings) {
		return (
			group.type === GroupType.Calendar &&
			hasCapabilityOnGroup(user, group, ShareCapability.Write) &&
			!hasSourceUrl(groupSettings) &&
			!isBirthdayCalendar(group._id)
		)
	}

	private canShare(isExternal: boolean): boolean {
		return !isExternal
	}

	private canExport(group: Group, user: User): boolean {
		return !isApp() && group.type === GroupType.Calendar && hasCapabilityOnGroup(user, group, ShareCapability.Read)
	}

	private canSync(isExternal: boolean): boolean {
		return (isApp() || isDesktop()) && isExternal
	}

	private handleShare(userController: UserController, groupInfo: GroupInfo, shared: boolean) {
		if (userController.isFreeAccount()) {
			showNotAvailableForFreeDialog()
		} else {
			showGroupSharingDialog(groupInfo, shared)
		}
	}

	private handleExport(groupInfo: GroupInfo, groupRoot: CalendarGroupRoot, shared: boolean, userController: UserController) {
		const alarmInfoList = userController.user.alarmInfoList
		if (alarmInfoList) {
			exportCalendar(
				getSharedGroupName(groupInfo, userController.userSettingsGroupRoot, shared),
				groupRoot,
				alarmInfoList.alarms,
				new Date(),
				getTimeZone(),
			)
		}
	}
}
