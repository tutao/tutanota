import { TopLevelAttrs, TopLevelView } from "../../../../../ui/base/TopLevelView"
import { AppHeaderAttrs } from "../../../../../ui/Header"
import { BaseTopLevelView } from "../../../../../ui/BaseTopLevelView"
import { ColumnType, ViewColumn } from "../../../../../ui/base/ViewColumn"
import { ViewSlider } from "../../../../../ui/nav/ViewSlider"
import { NewCalendarSearchViewModel } from "./NewCalendarSearchViewModel"
import { ContactModel } from "../../../../common/contactsFunctionality/ContactModel"
import { UndoModel } from "../../../../mail-app/UndoModel"
import m, { Children, Vnode } from "mithril"
import { FolderColumnView } from "../../../../common/gui/FolderColumnView"
import { SidebarSection } from "../../../../../ui/SidebarSection"
import { layout_size } from "../../../../../ui/size"
import { DrawerMenuAttrs } from "../../../../common/gui/nav/DrawerMenu"
import { getEventWithDefaultTimes, setNextHalfHour } from "../../../../common/api/common/utils/CommonCalendarUtils"
import { showProgressDialog } from "../../../../../ui/dialogs/ProgressDialog"
import { locator } from "../../../../common/api/main/CommonLocator"
import { CalendarOperation } from "../../gui/eventeditor-model/CalendarEventModel"
import { EventEditorDialog } from "../../gui/eventeditor-view/CalendarEventEditDialog"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { FilterChip } from "../../../../../ui/base/FilterChip"
import { lang, TranslationKey } from "../../../../../ui/utils/LanguageViewModel"
import { formatDate } from "../../../../../ui/utils/Formatter"
import { isSameDayOfDate, LazyLoaded, memoized } from "@tutao/utils"
import { isSameId } from "@tutao/meta"
import { createDropdown } from "../../../../../ui/base/Dropdown"
import { AllIcons } from "../../../../../ui/base/Icon"
import { SearchCategoryType } from "../../../../common/api/worker/search/SearchTypes"
import { createRestriction, getSearchUrl } from "../../../../mail-app/search/model/SearchUtils"
import { showNotAvailableForFreeDialog } from "../../../../common/misc/SubscriptionDialogs"
import { ProgrammingError, UpgradePromptType } from "@tutao/app-env"
import { showDateRangeSelectionDialog } from "../../gui/pickers/DatePickerDialog"
import { Card } from "../../../../../ui/base/Card"
import { renderSearchInOurApps } from "../../../../mail-app/search/view/SearchView"
import { BackgroundColumnLayout } from "../../../../../ui/BackgroundColumnLayout"
import { theme } from "../../../../../ui/theme"
import { DesktopListToolbar } from "../../../../../ui/DesktopToolbars"
import { SelectAllCheckbox } from "../../../../../ui/SelectAllCheckbox"
import { selectionAttrsForList } from "../../../../common/misc/ListModel"
import { deviceConfig } from "../../../../common/misc/DeviceConfig"
import { MultiselectMobileHeader } from "../../../../../ui/MultiselectMobileHeader"
import { getMailSelectionMessage } from "../../../../mail-app/mail/view/MultiItemViewer"
import { getContactSelectionMessage } from "../../../../mail-app/contacts/view/MultiContactViewer"
import { styles } from "../../../../../ui/styles"
import { BaseMobileHeader } from "../../../../../ui/BaseMobileHeader"
import { NavButton } from "../../../../../ui/base/NavButton"
import { CALENDAR_PREFIX } from "../../../../../ui/utils/RouteChange"
import { searchBar } from "../CalendarSearchBar"
import { ProgressBar } from "../../../../../ui/base/ProgressBar"
import { client } from "../../../../../platform-kit/app-env/boot/ClientDetector"
import { IconButton } from "../../../../../ui/base/IconButton"
import { MobileActionAttrs, MobileActionBar } from "../../../../../ui/MobileActionBar"
import { handleEventDeleteButtonClick, handleEventEditButtonClick, handleSendUpdatesClick } from "../../view/EventDetailsView"
import { CalendarEvent } from "@tutao/entities/tutanota"
import { CalendarEventPreviewViewModel } from "../../gui/eventpopup/CalendarEventPreviewViewModel"
import { CalendarInfo } from "../../model/CalendarModel"
import { calendarLocator } from "../../../calendarLocator"
import { CalendarSearchListView, CalendarSearchListViewAttrs } from "./CalendarSearchListView"

export interface NewCalendarSearchViewAttrs extends TopLevelAttrs {
	header: AppHeaderAttrs
	makeViewModel: () => NewCalendarSearchViewModel
	contactModel: ContactModel
	undoModel: UndoModel
	drawerAttrs: DrawerMenuAttrs
}
export class NewCalendarSearchView extends BaseTopLevelView implements TopLevelView<NewCalendarSearchViewAttrs> {
	private readonly resultListColumn: ViewColumn
	private readonly resultDetailsColumn: ViewColumn
	private readonly folderColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	private readonly searchViewModel: NewCalendarSearchViewModel
	private readonly contactModel: ContactModel
	private readonly startOfTheWeekOffset: number
	private readonly undoModel: UndoModel

	constructor(vnode: Vnode<NewCalendarSearchViewAttrs>) {
		super()
		this.searchViewModel = vnode.attrs.makeViewModel()
		this.contactModel = vnode.attrs.contactModel
		this.undoModel = vnode.attrs.undoModel
		this.startOfTheWeekOffset = this.searchViewModel.getStartofTheWeekOffSet()

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
							this.renderAppPromo(),
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
				maxWidth: deviceConfig.getMailListSize(userId) ?? layout_size.second_col_max_width,
				headerCenter: "searchResult_label",
				resizeCallback: (size) => {
					deviceConfig.setMailListSize(userId, size)
				},
			},
		)
	}

	private getMainButton() {
		return {
			click: () => {
				this.createNewEventDialog()
			},
			label: "newEvent_action",
		}
	}
	private async createNewEventDialog(): Promise<void> {
		const dateToUse = this.searchViewModel.startDate ? setNextHalfHour(new Date(this.searchViewModel.startDate)) : setNextHalfHour(new Date())

		// Disallow creation of events when there is no existing calendar
		const calendarInfos = this.searchViewModel.getAvailableCalendars(false)
		if (!calendarInfos.length) {
			await showProgressDialog("pleaseWait_msg", this.searchViewModel.loadCalendarInfos())
		}

		const mailboxDetails = await locator.mailboxModel.getUserMailboxDetails()
		const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		const model = await locator.calendarEventModel(CalendarOperation.Create, getEventWithDefaultTimes(dateToUse), mailboxDetails, mailboxProperties, null)

		if (model) {
			const eventEditor = new EventEditorDialog()
			await eventEditor.showNewCalendarEventEditDialog(model)
		}
	}

	private renderFilterChips() {
		const availableCalendars = this.searchViewModel.getAvailableCalendars(true)
		const selectedCalendar = this.searchViewModel.selectedCalendar
		return [
			this.renderCategoryChip("calendar_label", Icons.CalendarFilled),
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
							availableCalendars.find((calendarInfo) => isSameId(calendarInfo.id, selectedCalendar?.id))?.name ?? "",
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
	private renderCategoryChip(label: TranslationKey, icon: AllIcons): Children {
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
						case "extendIndex":
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

	private renderAppPromo(): Children {
		const searchText = renderSearchInOurApps()
		if (searchText == null) {
			return null
		}
		return m("div.ml-8.mt-12.small.plr-8.content-fg.mb-16", m(Card, searchText))
	}

	private renderMobileListHeader(header: AppHeaderAttrs): Children {
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
					icon: () => Icons.ChevronLeft,
					href: CALENDAR_PREFIX,
					centred: true,
					fillSpaceAround: false,
				}),
			),
			right: rightActions,
			center: m(
				".flex-grow.flex.justify-center.mr-12",
				m(searchBar, {
					placeholder: lang.get("searchCalendar_placeholder"),
					returnListener: () => this.resultListColumn.focus(),
				}),
			),
			injections: m(ProgressBar, { progress: header.offlineIndicatorModel.getProgress() }),
		})
	}

	private renderHeaderRightView() {
		if (styles.isUsingBottomNavigation() && !client.isCalendarApp()) {
			return m(IconButton, {
				click: () => this.createNewEventDialog(),
				title: "newEvent_action",
				icon: Icons.Plus,
			})
		} else if (client.isCalendarApp()) {
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
		const previewModel = this.getSanitizedPreviewData(selectedEvent).getSync()
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

	private getSanitizedPreviewData: (event: CalendarEvent) => LazyLoaded<CalendarEventPreviewViewModel> = memoized((event: CalendarEvent) =>
		new LazyLoaded(async () => {
			const calendars = await this.searchViewModel.getAvailableCalendars(false)
			const calendarInfosMap = new Map(calendars.map((calendarInfo) => [calendarInfo.id, calendarInfo as CalendarInfo]))
			const eventPreviewModel = await calendarLocator.calendarEventPreviewModel(event, calendarInfosMap, [])
			eventPreviewModel.sanitizeDescription().then(() => m.redraw())
			return eventPreviewModel
		}).load(),
	)

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
}
