import { TopLevelAttrs, TopLevelView } from "../../../../../ui/base/TopLevelView"
import { AppHeaderAttrs, Header } from "../../../../../ui/Header"
import { BaseTopLevelView } from "../../../../../ui/BaseTopLevelView"
import { ColumnType, ViewColumn } from "../../../../../ui/base/ViewColumn"
import { ViewSlider } from "../../../../../ui/nav/ViewSlider"
import { CalendarSearchViewModel } from "./CalendarSearchViewModel"
import m, { Children, Vnode } from "mithril"
import { SidebarSection } from "../../../../../ui/SidebarSection"
import { layout_size } from "../../../../../ui/size"
import { DrawerMenuAttrs } from "../../../../common/gui/nav/DrawerMenu"
import { showProgressDialog } from "../../../../../ui/dialogs/ProgressDialog"
import { EventEditorDialog } from "../../gui/eventeditor-view/CalendarEventEditDialog"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { FilterChip } from "../../../../../ui/base/FilterChip"
import { lang, TranslationKey } from "../../../../../ui/utils/LanguageViewModel"
import { formatDate } from "../../../../../ui/utils/Formatter"
import { isSameDayOfDate, lazy, lazyMemoized } from "@tutao/utils"
import { createDropdown } from "../../../../../ui/base/Dropdown"
import { SearchCategoryType } from "../../../../common/api/worker/search/SearchTypes"
import { showNotAvailableForFreeDialog } from "../../../../common/misc/SubscriptionDialogs"
import { ProgrammingError, UpgradePromptType } from "@tutao/app-env"
import { showDateRangeSelectionDialog } from "../../gui/pickers/DatePickerDialog"
import { BackgroundColumnLayout } from "../../../../../ui/BackgroundColumnLayout"
import { theme } from "../../../../../ui/theme"
import { DesktopListToolbar, DesktopViewerToolbar } from "../../../../../ui/DesktopToolbars"
import { BaseMobileHeader } from "../../../../../ui/BaseMobileHeader"
import { NavButton } from "../../../../../ui/base/NavButton"
import { CALENDAR_PREFIX } from "../../../../../ui/utils/RouteChange"
import { ProgressBar } from "../../../../../ui/base/ProgressBar"
import { IconButton } from "../../../../../ui/base/IconButton"
import { MobileActionAttrs, MobileActionBar } from "../../../../../ui/MobileActionBar"
import {
	EventDetailsView,
	EventDetailsViewAttrs,
	handleEventDeleteButtonClick,
	handleEventEditButtonClick,
	handleSendUpdatesClick,
} from "../../view/EventDetailsView"
import { Contact } from "@tutao/entities/tutanota"
import { CalendarEventPreviewViewModel } from "../../gui/eventpopup/CalendarEventPreviewViewModel"
import { MobileHeader } from "../../../../../ui/MobileHeader"
import ColumnEmptyMessageBox from "../../../../../ui/base/ColumnEmptyMessageBox"
import { ContactCardViewer } from "../../../../mail-app/contacts/view/ContactCardViewer"
import { writeMail } from "../../../../mail-app/contacts/view/ContactView"
import { windowFacade } from "../../../../common/misc/WindowFacade"
import { keyManager, Shortcut } from "../../../../../ui/utils/KeyManager"
import { renderHeaderButtons } from "../../../gui/HeaderButtons"
import { BottomNav } from "../../../../mail-app/gui/BottomNav"
import { FolderColumnView } from "../../../../common/gui/FolderColumnView"
import { ClickHandler } from "../../../../../ui/base/GuiUtils"
import { listSelectionKeyboardShortcuts } from "../../../../../ui/base/ListUtils"
import { MultiselectMode } from "../../../../../ui/base/List"
import { CalendarSearchListView, CalendarSearchListViewAttrs } from "./CalendarSearchListView"
import { AppPromo } from "../../../../common/gui/AppPromo"
import { SearchViewSearchBar } from "../../../../common/search/SearchViewSearchBar"
import { isSameSingleId } from "@tutao/meta"
import { isFreeSignupOnly } from "../../../../common/misc/LoginUtils"
import { Keys } from "../../../../../ui/utils/KeyboardKeys"
import { Styles } from "../../../../../ui/styles"
import { ClientDetector } from "../../../../../platform-kit/app-env/boot/ClientDetector"

export interface CalendarSearchViewAttrs extends TopLevelAttrs {
	header: AppHeaderAttrs
	makeViewModel: () => CalendarSearchViewModel
	drawerAttrs: DrawerMenuAttrs
	editContact: (contact: Contact) => unknown
}

/**
 * View for searching and displaying calendar events.
 *
 * For birthday events it shows contact info.
 */
export class CalendarSearchView extends BaseTopLevelView implements TopLevelView<CalendarSearchViewAttrs> {
	private readonly resultListColumn: ViewColumn
	private readonly resultDetailsColumn: ViewColumn
	private readonly folderColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	private readonly searchViewModel: CalendarSearchViewModel
	private readonly startOfTheWeekOffset: number

	constructor(vnode: Vnode<CalendarSearchViewAttrs>) {
		super()
		this.searchViewModel = vnode.attrs.makeViewModel()
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
				view: () => this.renderDetailsView(vnode.attrs.header, vnode.attrs.editContact),
			},
			ColumnType.Background,
			{
				minWidth: layout_size.third_col_min_width,
				maxWidth: layout_size.third_col_max_width,
			},
		)
		this.folderColumn = new ViewColumn(
			{
				view: () => {
					return m(FolderColumnView, {
						drawer: vnode.attrs.drawerAttrs,
						button: this.getMainButton(),
						content: [
							m(SidebarSection, {
								name: "searchFilters_label",
							}),
							m(".flex.wrap.plr-16.gap-8.flex-shrink-children", this.renderFilterChips()),
							m(".flex-grow"),
							m(AppPromo),
						],
						ariaLabel: "search_label",
					})
				},
			},
			ColumnType.Foreground,
			{
				minWidth: layout_size.first_col_min_width,
				maxWidth: layout_size.first_col_max_width,
				headerCenter: "search_label",
			},
		)

		this.viewSlider = new ViewSlider([this.folderColumn, this.resultListColumn, this.resultDetailsColumn], windowFacade)
	}

	private getMainButton(): {
		label: TranslationKey
		click: ClickHandler
	} | null {
		return {
			click: () => {
				this.createNewEventDialog()
			},
			label: "newEvent_action",
		}
	}
	private async createNewEventDialog(): Promise<void> {
		// Disallow creation of events when there is no existing calendar
		const calendarInfos = this.searchViewModel.getAvailableCalendars(false)
		if (!calendarInfos.length) {
			await showProgressDialog("pleaseWait_msg", this.searchViewModel.loadCalendarInfos())
		}

		const model = await this.searchViewModel.newEventModel()

		if (model) {
			const eventEditor = new EventEditorDialog()
			await eventEditor.showNewCalendarEventEditDialog(model)
		}
	}

	private renderFilterChips() {
		const availableCalendars = this.searchViewModel.getAvailableCalendars(true)
		const selectedCalendar = this.searchViewModel.selectedCalendar
		return [
			!ClientDetector.get().isCalendarApp() ? this.renderCategoryChip("calendar_label", Icons.CalendarFilled) : null,
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
				onClick: (_) => {
					if (isFreeSignupOnly() && !this.searchViewModel.canSelectTimePeriod()) {
						return
					}

					this.onCalendarDateRangeSelect()
				},
			}),
			m(FilterChip, {
				label: selectedCalendar
					? lang.makeTranslation(
							"calendar_label",
							availableCalendars.find((calendarInfo) => isSameSingleId(calendarInfo.id, selectedCalendar?.id))?.name ?? "",
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
	private renderCategoryChip(label: TranslationKey, icon: Icons): Children {
		return m(FilterChip, {
			label: lang.getTranslation(label),
			icon,
			selected: true,
			chevron: true,
			onClick: createDropdown({
				lazyButtons: () => [
					{
						label: "emails_label",
						click: () => {
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryType.mail)
							m.route.set(href)
						},
						icon: Icons.MailFilled,
					},
					{
						label: "contacts_label",
						click: () => {
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryType.contact)
							m.route.set(href)
						},
						icon: Icons.PeopleFilled,
					},
					{
						label: "calendar_label",
						click: () => {
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryType.calendar)
							m.route.set(href)
						},
						icon: Icons.CalendarFilled,
					},
					!ClientDetector.get().isMailApp() && this.searchViewModel.isDriveEnabled()
						? {
								label: "driveView_action",
								click: () => {
									const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryType.drive)
									m.route.set(href)
								},
								icon: Icons.DriveFilled,
							}
						: null,
				],
			}),
		})
	}
	private async onCalendarDateRangeSelect() {
		if (!this.searchViewModel.canSelectTimePeriod()) {
			showNotAvailableForFreeDialog(UpgradePromptType.CALENDAR_SEARCH)
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

	private renderMobileListHeader(header: AppHeaderAttrs): Children {
		return this.renderMobileListActionsHeader(header)
	}

	private renderMobileListActionsHeader(header: AppHeaderAttrs) {
		const rightActions = []

		if (Styles.get().isSingleColumnLayout()) {
			rightActions.push(this.renderHeaderRightView())
		}

		return m(BaseMobileHeader, {
			left: m(
				".icon-button",
				m(NavButton, {
					label: "back_action",
					hideLabel: true,
					icon: () => Icons.ChevronLeft,
					href: CALENDAR_PREFIX,
					centred: true,
					fillSpaceAround: false,
				}),
			),
			right: rightActions,
			center: m(".flex-grow.flex.justify-center.mr-12", this.renderSearchbar()),
			injections: m(ProgressBar, { progress: header.offlineIndicatorModel.getProgress() }),
		})
	}

	private renderHeaderRightView(): Children {
		if (Styles.get().isUsingBottomNavigation() && !ClientDetector.get().isCalendarApp()) {
			return m(IconButton, {
				click: () => this.createNewEventDialog(),
				title: "newEvent_action",
				icon: Icons.Plus,
			})
		} else if (ClientDetector.get().isCalendarApp()) {
			return m.fragment({}, [this.renderSearchResultActions()])
		}
	}

	private renderSearchResultActions() {
		if (this.viewSlider.focusedColumn !== this.resultDetailsColumn) return null

		const selectedEvent = this.searchViewModel.getSelectedEvents()[0]
		if (!selectedEvent) {
			this.viewSlider.focus(this.resultListColumn)
			return m(MobileActionBar, { actions: [] })
		}
		const previewModel = this.searchViewModel.eventPreviewData
		const actions: Array<MobileActionAttrs> = []
		if (previewModel) {
			if (previewModel.canSendUpdates) {
				actions.push({
					icon: Icons.MailFilled,
					title: "sendUpdates_label",
					action: () => handleSendUpdatesClick(previewModel),
				})
			}
			if (previewModel.canEdit) {
				actions.push({
					icon: Icons.PenFilled,
					title: "edit_action",
					action: (ev: MouseEvent, receiver: HTMLElement) => handleEventEditButtonClick(previewModel, ev, receiver),
				})
			}
			if (previewModel.canDelete) {
				actions.push({
					icon: Icons.TrashFilled,
					title: "delete_action",
					action: (ev: MouseEvent, receiver: HTMLElement) => handleEventDeleteButtonClick(previewModel, ev, receiver),
				})
			}
		}

		return actions.map((action) =>
			m(IconButton, {
				title: action.title,
				icon: action.icon,
				click: action.action,
			}),
		)
	}

	private getResultColumnLayout(): Children {
		return m(".flex.col.fill-absolute", [
			Styles.get().isDesktopLayout() ? null : this.renderFilterBar(),
			m(
				".rel.flex-grow",
				m(CalendarSearchListView, {
					listModel: this.searchViewModel.listModel,
					onSingleSelection: (item) => this.viewSlider.focus(this.resultDetailsColumn),
					cancelCallback: () => {
						this.searchViewModel.sendStopLoadingSignal()
					},
					highlightedStrings: this.searchViewModel.getHighlightedStrings(),
					availableCalendars: this.searchViewModel.getAvailableCalendars(true),
					currentStartDate: this.searchViewModel.startDate,
					extendSearchResult: (extendDate: Date) => {
						void this.searchViewModel.selectStartDate(extendDate)
					},
				} satisfies CalendarSearchListViewAttrs),
			),
		])
	}
	private renderFilterBar(): Children {
		return m(".flex.gap-8.pl-16.pr-16.pt-8.pb-8.scroll-x", this.renderFilterChips())
	}

	private renderDetailsView(header: AppHeaderAttrs, editContact: (contact: Contact) => unknown): Children {
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
					primaryAction: () => {
						return m(IconButton, {
							click: () => this.createNewEventDialog(),
							title: "newEvent_action",
							icon: Icons.Plus,
						})
					},
				}),
			columnLayout:
				selectedEvent == null
					? m(ColumnEmptyMessageBox, {
							message: "noEventSelect_msg",
							icon: Icons.CalendarFilled,
							color: theme.on_surface_variant,
							backgroundColor: theme.surface_container,
						})
					: this.renderEventPreview(editContact),
		})
	}
	private renderEventPreview(editContact: (contact: Contact) => unknown): Children {
		if (this.searchViewModel.birthdayContact) {
			return this.renderContactPreview(this.searchViewModel.birthdayContact, editContact)
		} else if (this.searchViewModel.eventPreviewData) {
			return this.renderEventDetails(this.searchViewModel.eventPreviewData)
		} else {
			return null
		}
	}
	private renderContactPreview(contact: Contact, editContact: (contact: Contact) => unknown): Children {
		return m(
			".fill-absolute.flex.col.overflow-y-scroll",
			m(ContactCardViewer, {
				contact: contact,
				editAction: (contact) => editContact(contact),
				onWriteMail: writeMail,
				extendedActions: true,
				highlightedStrings: this.searchViewModel.getHighlightedStrings(),
			}),
		)
	}
	private renderEventDetails(eventPreviewModel: CalendarEventPreviewViewModel): Children {
		return m(
			".height-100p.overflow-y-scroll.mb-32.fill-absolute.pb-32",
			m(
				".border-radius-12.flex.col.flex-grow.content-bg",
				{
					class: Styles.get().isDesktopLayout() ? "mlr-24" : "mlr-12",
				},
				m(EventDetailsView, {
					eventPreviewModel,
					highlightedStrings: this.searchViewModel.getHighlightedStrings(),
				} satisfies EventDetailsViewAttrs),
			),
		)
	}

	protected async onNewUrl(args: Record<string, any>, requestedPath: string): Promise<void> {
		await this.searchViewModel.init()
		this.searchViewModel.onNewUrl(args, requestedPath)
		m.redraw()
	}

	view({ attrs }: Vnode<CalendarSearchViewAttrs>): Children {
		return m(
			"#search.main-view",
			m(this.viewSlider, {
				header: m(Header, {
					firstColWidth: this.folderColumn.width,
					searchBar: () => this.renderSearchbar(),
					...attrs.header,
					buttons: renderHeaderButtons(),
				}),
				bottomNav: !ClientDetector.get().isCalendarApp() ? this.renderBottomNav() : null,
			}),
		)
	}

	private readonly shortcuts: lazy<readonly Shortcut[]> = lazyMemoized<ReadonlyArray<Shortcut>>((): Shortcut[] => [
		...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.searchViewModel.listModel),
		{
			key: Keys.N,
			exec: () => {
				this.createNewEventDialog()
			},
			help: "newEvent_action",
		},
	])

	oncreate() {
		this.searchViewModel.init()
		keyManager.registerShortcuts(this.shortcuts())
	}
	onremove() {
		this.searchViewModel.dispose()
		keyManager.unregisterShortcuts(this.shortcuts())
	}

	private renderSearchbar(): Children {
		return m(SearchViewSearchBar, {
			placeholder: lang.getTranslationText("searchCalendar_placeholder"),
			text: this.searchViewModel.getCurrentQuery(),
			busy: this.searchViewModel.busy,
			onInput: (text: string) => this.searchViewModel.onSearchQueryUpdated(text),
			onClear: () => this.searchViewModel.onSearchQueryUpdated(""),
		})
	}

	private renderBottomNav(): Children {
		if (!Styles.get().isSingleColumnLayout()) return m(BottomNav)
		const isInMultiselect = this.searchViewModel.listModel.state.inMultiselect ?? false
		if (!isInMultiselect && this.viewSlider.focusedColumn === this.resultDetailsColumn) {
			const selectedEvent = this.searchViewModel.getSelectedEvents()[0]
			if (!selectedEvent) {
				this.viewSlider.focus(this.resultListColumn)
				return m(MobileActionBar, { actions: [] })
			}
			const previewModel = this.searchViewModel.eventPreviewData
			const actions: Array<MobileActionAttrs> = []
			if (previewModel) {
				if (previewModel.canSendUpdates) {
					actions.push({
						icon: Icons.MailFilled,
						title: "sendUpdates_label",
						action: () => handleSendUpdatesClick(previewModel),
					})
				}
				if (previewModel.canEdit) {
					actions.push({
						icon: Icons.PenFilled,
						title: "edit_action",
						action: (ev: MouseEvent, receiver: HTMLElement) => handleEventEditButtonClick(previewModel, ev, receiver),
					})
				}
				if (previewModel.canDelete) {
					actions.push({
						icon: Icons.TrashFilled,
						title: "delete_action",
						action: (ev: MouseEvent, receiver: HTMLElement) => handleEventDeleteButtonClick(previewModel, ev, receiver),
					})
				}
			}
			return m(MobileActionBar, { actions })
		}
		return m(BottomNav)
	}
}
