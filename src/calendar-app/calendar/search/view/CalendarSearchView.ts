import { TopLevelAttrs, TopLevelView } from "../../../../TopLevelView.js"
import { AppHeaderAttrs, Header } from "../../../../common/gui/Header.js"
import { CalendarSearchViewModel, PaidFunctionResult } from "./CalendarSearchViewModel.js"
import { BaseTopLevelView } from "../../../../common/gui/BaseTopLevelView.js"
import { ColumnType, ViewColumn } from "../../../../common/gui/base/ViewColumn.js"
import { ViewSlider } from "../../../../common/gui/nav/ViewSlider.js"
import { CalendarEvent, Contact } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import { assertNotNull, isSameDayOfDate, last, LazyLoaded, lazyMemoized, memoized, stringToBase64 } from "@tutao/tutanota-utils"
import { CalendarEventPreviewViewModel } from "../../gui/eventpopup/CalendarEventPreviewViewModel.js"
import m, { Children, Vnode } from "mithril"
import { NavButton } from "../../../../common/gui/base/NavButton.js"
import { BootIcons } from "../../../../common/gui/base/icons/BootIcons.js"
import { layout_size, size } from "../../../../common/gui/size.js"
import { lang, type MaybeTranslation } from "../../../../common/misc/LanguageViewModel.js"
import { BackgroundColumnLayout } from "../../../../common/gui/BackgroundColumnLayout.js"
import { theme } from "../../../../common/gui/theme.js"
import { DesktopListToolbar, DesktopViewerToolbar } from "../../../../common/gui/DesktopToolbars.js"
import { CalendarSearchListView, CalendarSearchListViewAttrs } from "./CalendarSearchListView.js"
import { keyManager, Shortcut } from "../../../../common/misc/KeyManager.js"
import { styles } from "../../../../common/gui/styles.js"
import { BaseMobileHeader } from "../../../../common/gui/BaseMobileHeader.js"
import { MobileHeader } from "../../../../common/gui/MobileHeader.js"
import { searchBar } from "../CalendarSearchBar.js"
import { ProgressBar } from "../../../../common/gui/base/ProgressBar.js"
import ColumnEmptyMessageBox from "../../../../common/gui/base/ColumnEmptyMessageBox.js"
import {
	EventDetailsView,
	EventDetailsViewAttrs,
	handleEventDeleteButtonClick,
	handleEventEditButtonClick,
	handleSendUpdatesClick,
} from "../../view/EventDetailsView.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { FeatureType, Keys } from "../../../../common/api/common/TutanotaConstants.js"
import { IconButton } from "../../../../common/gui/base/IconButton.js"
import { showNotAvailableForFreeDialog } from "../../../../common/misc/SubscriptionDialogs.js"
import { listSelectionKeyboardShortcuts } from "../../../../common/gui/base/ListUtils.js"
import { MultiselectMode } from "../../../../common/gui/base/List.js"
import { showProgressDialog } from "../../../../common/gui/dialogs/ProgressDialog.js"
import { CalendarOperation } from "../../gui/eventeditor-model/CalendarEventModel.js"
import { getEventWithDefaultTimes, setNextHalfHour } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import { Checkbox, CheckboxAttrs } from "../../../../common/gui/base/Checkbox.js"
import { MobileActionAttrs, MobileActionBar } from "../../../../common/gui/MobileActionBar.js"
import { assertMainOrNode } from "../../../../common/api/common/Env.js"
import { calendarLocator } from "../../../calendarLocator.js"
import { client } from "../../../../common/misc/ClientDetector.js"
import { CALENDAR_PREFIX } from "../../../../common/misc/RouteChange.js"
import { Dialog } from "../../../../common/gui/base/Dialog.js"
import { extractContactIdFromEvent, isBirthdayEvent } from "../../../../common/calendar/date/CalendarUtils.js"
import { ContactCardViewer } from "../../../../mail-app/contacts/view/ContactCardViewer.js"
import { ContactModel } from "../../../../common/contactsFunctionality/ContactModel.js"
import { PartialRecipient } from "../../../../common/api/common/recipients/Recipient.js"
import { simulateMailToClick } from "../../gui/eventpopup/ContactPreviewView.js"
import { DatePicker, DatePickerAttrs } from "../../gui/pickers/DatePicker.js"
import { EventEditorDialog } from "../../gui/eventeditor-view/CalendarEventEditDialog.js"
import { FilterChip } from "../../../../common/gui/base/FilterChip"
import { formatDate } from "../../../../common/misc/Formatter"
import { createDropdown } from "../../../../common/gui/base/Dropdown"
import { ProgrammingError } from "../../../../common/api/common/error/ProgrammingError"
import { showDateRangeSelectionDialog } from "../../gui/pickers/DatePickerDialog"
import { isSameId } from "../../../../common/api/common/utils/EntityUtils"
import { CalendarInfo } from "../../model/CalendarModel"

assertMainOrNode()

export interface CalendarSearchViewAttrs extends TopLevelAttrs {
	header: AppHeaderAttrs
	makeViewModel: () => CalendarSearchViewModel
	contactModel: ContactModel
}

export class CalendarSearchView extends BaseTopLevelView implements TopLevelView<CalendarSearchViewAttrs> {
	private readonly resultListColumn: ViewColumn
	private readonly resultDetailsColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	private readonly searchViewModel: CalendarSearchViewModel
	private readonly contactModel: ContactModel
	private readonly startOfTheWeekOffset: number

	private getSanitizedPreviewData: (event: CalendarEvent) => LazyLoaded<CalendarEventPreviewViewModel> = memoized((event: CalendarEvent) =>
		new LazyLoaded(async () => {
			const calendars = await this.searchViewModel.getAvailableCalendars(false)
			const calendarInfosMap = new Map(calendars.map((calendarInfo) => [calendarInfo.id, calendarInfo as CalendarInfo]))
			const eventPreviewModel = await calendarLocator.calendarEventPreviewModel(event, calendarInfosMap, [])
			eventPreviewModel.sanitizeDescription().then(() => m.redraw())
			return eventPreviewModel
		}).load(),
	)

	private getContactPreviewData = memoized((id: string) =>
		new LazyLoaded(async () => {
			const idParts = id.split("/")
			const contact = await this.contactModel.loadContactFromId([idParts[0], idParts[1]])
			m.redraw()
			return contact
		}).load(),
	)

	constructor(vnode: Vnode<CalendarSearchViewAttrs>) {
		super()
		this.searchViewModel = vnode.attrs.makeViewModel()
		this.contactModel = vnode.attrs.contactModel
		this.startOfTheWeekOffset = this.searchViewModel.getStartOfTheWeekOffset()

		this.resultListColumn = new ViewColumn(
			{
				view: () => {
					return m(BackgroundColumnLayout, {
						backgroundColor: theme.surface_container,
						desktopToolbar: () => m(DesktopListToolbar, [m(".button-height")]),
						mobileHeader: () => this.renderMobileListHeader(vnode.attrs.header),
						columnLayout: this.getResultColumnLayout(),
					})
				},
			},
			ColumnType.Background,
			{
				minWidth: layout_size.second_col_min_width,
				maxWidth: layout_size.second_col_max_width,
				headerCenter: "searchResult_label",
			},
		)
		this.resultDetailsColumn = new ViewColumn(
			{
				view: () => this.renderDetailsView(vnode.attrs.header),
			},
			ColumnType.Background,
			{
				minWidth: layout_size.third_col_min_width,
				maxWidth: layout_size.third_col_max_width,
			},
		)
		this.viewSlider = new ViewSlider([this.resultListColumn, this.resultDetailsColumn], false)
	}

	private getResultColumnLayout() {
		return m(".flex.col.fill-absolute", [
			this.renderFilterBar(),
			m(
				".rel.flex-grow",
				m(CalendarSearchListView, {
					listModel: this.searchViewModel.listModel,
					onSingleSelection: (item) => {
						this.viewSlider.focus(this.resultDetailsColumn)
					},
					cancelCallback: () => {
						this.searchViewModel.sendStopLoadingSignal()
					},
					isFreeAccount: calendarLocator.logins.getUserController().isFreeAccount(),
					availableCalendars: this.searchViewModel.getAvailableCalendars(true),
				} satisfies CalendarSearchListViewAttrs),
			),
		])
	}

	oncreate(): void {
		this.searchViewModel.init()

		keyManager.registerShortcuts(this.shortcuts())
	}

	onremove(): void {
		this.searchViewModel.dispose()

		keyManager.unregisterShortcuts(this.shortcuts())
	}

	private renderMobileListHeader(header: AppHeaderAttrs) {
		return this.renderMobileListActionsHeader(header)
	}

	private renderMobileListActionsHeader(header: AppHeaderAttrs) {
		const rightActions = []

		if (styles.isSingleColumnLayout()) {
			rightActions.push(this.renderHeaderRightView())
		}

		return m(BaseMobileHeader, {
			left: m(
				".icon-button",
				m(NavButton, {
					label: "back_action",
					hideLabel: true,
					icon: () => BootIcons.Back,
					href: CALENDAR_PREFIX,
					centred: true,
					fillSpaceAround: false,
				}),
			),
			right: rightActions,
			center: m(
				".flex-grow.flex.justify-center.mr-12",
				m(searchBar, {
					placeholder: this.searchBarPlaceholder(),
					returnListener: () => this.resultListColumn.focus(),
				}),
			),
			injections: m(ProgressBar, { progress: header.offlineIndicatorModel.getProgress() }),
		})
	}

	/** depending on the search and selection state we want to render a
	 * (multi) mail viewer or a (multi) contact viewer or an event preview
	 */
	private renderDetailsView(header: AppHeaderAttrs): Children {
		if (this.searchViewModel.listModel.isSelectionEmpty() && this.viewSlider.focusedColumn === this.resultDetailsColumn) {
			this.viewSlider.focus(this.resultListColumn)
			return null
		}

		const selectedEvent = this.searchViewModel.getSelectedEvents()[0]
		return m(BackgroundColumnLayout, {
			backgroundColor: theme.surface_container,
			desktopToolbar: () => m(DesktopViewerToolbar, []),
			mobileHeader: () =>
				m(MobileHeader, {
					...header,
					backAction: () => this.viewSlider.focusPreviousColumn(),
					columnType: "other",
					title: "search_label",
					actions: null,
					multicolumnActions: () => [],
					primaryAction: () => this.renderHeaderRightView(),
				}),
			columnLayout:
				selectedEvent == null
					? m(ColumnEmptyMessageBox, {
							message: "noEventSelect_msg",
							icon: BootIcons.Calendar,
							color: theme.on_surface_variant,
							backgroundColor: theme.surface_container,
						})
					: !this.getSanitizedPreviewData(selectedEvent).isLoaded()
						? null
						: this.renderEventPreview(selectedEvent),
		})
	}

	private renderEventPreview(event: CalendarEvent) {
		if (isBirthdayEvent(event.uid)) {
			const idParts = event._id[1].split("#")

			const contactId = extractContactIdFromEvent(last(idParts))
			if (contactId != null && this.getContactPreviewData(contactId).isLoaded()) {
				return this.renderContactPreview(this.getContactPreviewData(contactId).getSync()!)
			}

			return null
		} else if (this.getSanitizedPreviewData(event).isLoaded()) {
			return this.renderEventDetails(event)
		}

		return null
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

	private renderEventDetails(selectedEvent: CalendarEvent) {
		return m(
			".height-100p.overflow-y-scroll.mb-32.fill-absolute.pb-32",
			m(
				".border-radius-12.flex.col.flex-grow.content-bg",
				{
					class: styles.isDesktopLayout() ? "mlr-24" : "mlr-12",
				},
				m(EventDetailsView, {
					eventPreviewModel: assertNotNull(this.getSanitizedPreviewData(selectedEvent).getSync()),
				} satisfies EventDetailsViewAttrs),
			),
		)
	}

	private renderSearchResultActions() {
		if (this.viewSlider.focusedColumn !== this.resultDetailsColumn) return null

		const selectedEvent = this.searchViewModel.getSelectedEvents()[0]
		if (!selectedEvent) {
			this.viewSlider.focus(this.resultListColumn)
			return m(MobileActionBar, { actions: [] })
		}
		const previewModel = this.getSanitizedPreviewData(selectedEvent).getSync()
		const actions: Array<MobileActionAttrs> = []
		if (previewModel) {
			if (previewModel.canSendUpdates) {
				actions.push({
					icon: BootIcons.Mail,
					title: "sendUpdates_label",
					action: () => handleSendUpdatesClick(previewModel),
				})
			}
			if (previewModel.canEdit) {
				actions.push({
					icon: Icons.Edit,
					title: "edit_action",
					action: (ev: MouseEvent, receiver: HTMLElement) => handleEventEditButtonClick(previewModel, ev, receiver),
				})
			}
			if (previewModel.canDelete) {
				actions.push({
					icon: Icons.Trash,
					title: "delete_action",
					action: (ev: MouseEvent, receiver: HTMLElement) => handleEventDeleteButtonClick(previewModel, ev, receiver),
				})
			}
		} else {
			this.getSanitizedPreviewData(selectedEvent).load()
		}

		return actions.map((action) =>
			m(IconButton, {
				title: action.title,
				icon: action.icon,
				click: action.action,
			}),
		)
	}

	private searchBarPlaceholder() {
		return lang.get("searchCalendar_placeholder")
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	private renderHeaderRightView(): Children {
		if (styles.isUsingBottomNavigation() && !client.isCalendarApp()) {
			return m(IconButton, {
				click: () => this.createNewEventDialog(),
				title: "newEvent_action",
				icon: Icons.Add,
			})
		} else if (client.isCalendarApp()) {
			return m.fragment({}, [this.renderSearchResultActions()])
		}
	}

	private renderDateRangeSelection(): Children {
		const renderedHelpText: MaybeTranslation | undefined =
			this.searchViewModel.warning === "startafterend"
				? "startAfterEnd_label"
				: this.searchViewModel.warning === "long"
					? "longSearchRange_msg"
					: this.searchViewModel.startDate == null
						? "unlimited_label"
						: undefined
		return m(
			".flex.col",
			m(
				".pl-4.flex-grow.flex-space-between.flex-column",
				m(DatePicker, {
					date: this.searchViewModel.startDate ?? undefined,
					onDateSelected: (date) => {
						if (this.searchViewModel.selectStartDate(date) !== PaidFunctionResult.Success) {
							showNotAvailableForFreeDialog()
						}
					},
					startOfTheWeekOffset: this.startOfTheWeekOffset,
					label: "dateFrom_label",
					nullSelectionText: renderedHelpText,
					rightAlignDropdown: true,
				} satisfies DatePickerAttrs),
			),
			m(
				".pl-4.flex-grow.flex-space-between.flex-column",
				m(DatePicker, {
					date: this.searchViewModel.endDate,
					onDateSelected: (date) => {
						if (this.searchViewModel.selectEndDate(date) !== PaidFunctionResult.Success) {
							showNotAvailableForFreeDialog()
						}
					},
					startOfTheWeekOffset: this.startOfTheWeekOffset,
					label: "dateTo_label",
					rightAlignDropdown: true,
				} satisfies DatePickerAttrs),
			),
		)
	}

	private readonly shortcuts = lazyMemoized<ReadonlyArray<Shortcut>>(() => [
		...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.searchViewModel.listModel),
		{
			key: Keys.N,
			exec: () => {
				this.createNewEventDialog()
			},
			enabled: () => calendarLocator.logins.isInternalUserLoggedIn() && !calendarLocator.logins.isEnabled(FeatureType.ReplyOnly),
			help: "newMail_action",
		},
	])

	async onNewUrl(args: Record<string, any>, requestedPath: string) {
		// calling init here too because this is called very early in the lifecycle and onNewUrl won't work properly if init is called
		// afterwords
		await this.searchViewModel.init()
		this.searchViewModel.onNewUrl(args, requestedPath)
		this.invalidateBirthdayPreview()
		// redraw because init() is async
		m.redraw()
	}

	private invalidateBirthdayPreview() {
		const selectedEvent = this.searchViewModel.getSelectedEvents()[0]
		if (!selectedEvent || !isBirthdayEvent(selectedEvent.uid)) {
			return
		}

		const idParts = selectedEvent._id[1].split("#")
		const contactId = extractContactIdFromEvent(last(idParts))
		if (!contactId) {
			return
		}

		this.getContactPreviewData(contactId).reload().then(m.redraw)
	}

	private async createNewEventDialog(): Promise<void> {
		const dateToUse = this.searchViewModel.startDate ? setNextHalfHour(new Date(this.searchViewModel.startDate)) : setNextHalfHour(new Date())

		// Disallow creation of events when there is no existing calendar
		const calendarInfos = this.searchViewModel.getAvailableCalendars(false)
		if (!calendarInfos.length) {
			await showProgressDialog("pleaseWait_msg", this.searchViewModel.loadCalendarInfos())
		}

		const mailboxDetails = await calendarLocator.mailboxModel.getUserMailboxDetails()
		const mailboxProperties = await calendarLocator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		const model = await calendarLocator.calendarEventModel(
			CalendarOperation.Create,
			getEventWithDefaultTimes(dateToUse),
			mailboxDetails,
			mailboxProperties,
			null,
		)

		if (model) {
			const eventEditor = new EventEditorDialog()
			await eventEditor.showNewCalendarEventEditDialog(model)
		}
	}

	private renderRepeatingFilter(): Children {
		return m(
			".mlr-8",
			m(Checkbox, {
				label: () => lang.get("includeRepeatingEvents_action"),
				checked: this.searchViewModel.includeRepeatingEvents,
				onChecked: (value: boolean) => {
					this.searchViewModel.selectIncludeRepeatingEvents(value)
				},
			} satisfies CheckboxAttrs),
		)
	}

	view({ attrs }: Vnode<CalendarSearchViewAttrs>): Children {
		return m(
			"#search.main-view",
			m(this.viewSlider, {
				header: m(Header, {
					searchBar: () =>
						m(searchBar, {
							placeholder: this.searchBarPlaceholder(),
							returnListener: () => this.resultListColumn.focus(),
						}),
					...attrs.header,
				}),
			}),
		)
	}

	private renderFilterBar(): Children {
		return m(".flex.gap-8.pl-16.pr-16.pt-8.pb-8.scroll-x", this.renderCalendarFilterChips())
	}

	private async onCalendarDateRangeSelect() {
		if (!this.searchViewModel.canSelectTimePeriod()) {
			showNotAvailableForFreeDialog()
		} else {
			const { start, end } = await showDateRangeSelectionDialog({
				start: this.searchViewModel.startDate,
				end: this.searchViewModel.endDate,
				startOfTheWeekOffset: this.startOfTheWeekOffset,
				optionalStartDate: false,
				dateValidator: (startDate, endDate) => {
					switch (this.searchViewModel.checkDates(startDate, endDate)) {
						case "long":
							return lang.getTranslationText("longSearchRange_msg")
						case "startafterend":
							return lang.getTranslationText("startAfterEnd_label")
						case null:
							return null
						default:
							throw new ProgrammingError()
					}
				},
			})
			this.searchViewModel.selectStartDate(start)
			this.searchViewModel.selectEndDate(end)
		}
	}

	private renderCalendarFilterChips() {
		const availableCalendars = this.searchViewModel.getAvailableCalendars(true)
		const selectedCalendar = this.searchViewModel.selectedCalendar
		return [
			m(FilterChip, {
				label: lang.makeTranslation(
					"btn:date",
					`${this.searchViewModel.startDate ? formatDate(this.searchViewModel.startDate) : lang.getTranslationText("unlimited_label")} - ${
						isSameDayOfDate(new Date(), this.searchViewModel.endDate)
							? lang.getTranslationText("today_label")
							: formatDate(this.searchViewModel.endDate)
					}`,
				),
				selected: true,
				chevron: false,
				onClick: (_) => this.onCalendarDateRangeSelect(),
			}),
			m(FilterChip, {
				label: selectedCalendar
					? lang.makeTranslation(
							"calendar_label",
							availableCalendars.find((calendarInfo) => isSameId(calendarInfo.id, selectedCalendar.id))?.name ?? "",
						)
					: lang.getTranslation("calendar_label"),
				selected: selectedCalendar != null,
				chevron: true,
				onClick: createDropdown({
					lazyButtons: () => [
						{
							label: lang.getTranslation("all_label"),
							click: () => this.searchViewModel.selectCalendar(null),
						},
						...availableCalendars.map((calendarInfo) => ({
							label: lang.makeTranslation(calendarInfo.name, calendarInfo.name),
							click: () => this.searchViewModel.selectCalendar(calendarInfo),
						})),
					],
				}),
			}),
			m(FilterChip, {
				label: lang.getTranslation("includeRepeatingEvents_action"),
				selected: this.searchViewModel.includeRepeatingEvents,
				chevron: false,
				onClick: () => this.searchViewModel.selectIncludeRepeatingEvents(!this.searchViewModel.includeRepeatingEvents),
			}),
		]
	}
}
