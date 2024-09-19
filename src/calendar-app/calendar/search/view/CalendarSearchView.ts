import { TopLevelAttrs, TopLevelView } from "../../../../TopLevelView.js"
import { DrawerMenuAttrs } from "../../../../common/gui/nav/DrawerMenu.js"
import { AppHeaderAttrs, Header } from "../../../../common/gui/Header.js"
import { CalendarSearchViewModel } from "./CalendarSearchViewModel.js"
import { BaseTopLevelView } from "../../../../common/gui/BaseTopLevelView.js"
import { ColumnType, ViewColumn } from "../../../../common/gui/base/ViewColumn.js"
import { ViewSlider } from "../../../../common/gui/nav/ViewSlider.js"
import { CalendarEvent } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import { assertNotNull, incrementMonth, LazyLoaded, lazyMemoized, memoized, TypeRef } from "@tutao/tutanota-utils"
import { CalendarEventPreviewViewModel } from "../../gui/eventpopup/CalendarEventPreviewViewModel.js"
import m, { Children, Vnode } from "mithril"
import { SidebarSection } from "../../../../common/gui/SidebarSection.js"
import { NavButton } from "../../../../common/gui/base/NavButton.js"
import { BootIcons } from "../../../../common/gui/base/icons/BootIcons.js"
import { px, size } from "../../../../common/gui/size.js"
import { lang, TranslationKey } from "../../../../common/misc/LanguageViewModel.js"
import { BackgroundColumnLayout } from "../../../../common/gui/BackgroundColumnLayout.js"
import { theme } from "../../../../common/gui/theme.js"
import { DesktopListToolbar, DesktopViewerToolbar } from "../../../../common/gui/DesktopToolbars.js"
import { CalendarSearchListView, CalendarSearchListViewAttrs } from "./CalendarSearchListView.js"
import { isSameId } from "../../../../common/api/common/utils/EntityUtils.js"
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
import { DropDownSelector, DropDownSelectorAttrs } from "../../../../common/gui/base/DropDownSelector.js"
import { FeatureType, Keys } from "../../../../common/api/common/TutanotaConstants.js"
import { IconButton } from "../../../../common/gui/base/IconButton.js"
import { formatDate } from "../../../../common/misc/Formatter.js"
import { TextField } from "../../../../common/gui/base/TextField.js"
import { ButtonSize } from "../../../../common/gui/base/ButtonSize.js"
import { showDateRangeSelectionDialog } from "../../gui/pickers/DatePickerDialog.js"
import { showNotAvailableForFreeDialog } from "../../../../common/misc/SubscriptionDialogs.js"
import { YEAR_IN_MILLIS } from "@tutao/tutanota-utils/dist/DateUtils.js"
import { listSelectionKeyboardShortcuts } from "../../../../common/gui/base/ListUtils.js"
import { MultiselectMode } from "../../../../common/gui/base/List.js"
import { ClickHandler } from "../../../../common/gui/base/GuiUtils.js"
import { showProgressDialog } from "../../../../common/gui/dialogs/ProgressDialog.js"
import { CalendarOperation } from "../../gui/eventeditor-model/CalendarEventModel.js"
import { getEventWithDefaultTimes, setNextHalfHour } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import { showNewCalendarEventEditDialog } from "../../gui/eventeditor-view/CalendarEventEditDialog.js"
import { getSharedGroupName } from "../../../../common/sharing/GroupUtils.js"
import { CalendarInfo } from "../../model/CalendarModel.js"
import { Checkbox, CheckboxAttrs } from "../../../../common/gui/base/Checkbox.js"
import { MobileActionAttrs, MobileActionBar } from "../../../../common/gui/MobileActionBar.js"
import { assertMainOrNode } from "../../../../common/api/common/Env.js"
import { calendarLocator } from "../../../calendarLocator.js"
import { client } from "../../../../common/misc/ClientDetector.js"
import { CALENDAR_PREFIX } from "../../../../common/misc/RouteChange.js"
import { Dialog } from "../../../../common/gui/base/Dialog.js"
import { ButtonType } from "../../../../common/gui/base/Button.js"

assertMainOrNode()

export interface CalendarSearchViewAttrs extends TopLevelAttrs {
	header: AppHeaderAttrs
	makeViewModel: () => CalendarSearchViewModel
}

export class CalendarSearchView extends BaseTopLevelView implements TopLevelView<CalendarSearchViewAttrs> {
	private readonly resultListColumn: ViewColumn
	private readonly resultDetailsColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	private readonly searchViewModel: CalendarSearchViewModel

	private getSanitizedPreviewData: (event: CalendarEvent) => LazyLoaded<CalendarEventPreviewViewModel> = memoized((event: CalendarEvent) =>
		new LazyLoaded(async () => {
			const calendars = await this.searchViewModel.getLazyCalendarInfos().getAsync()
			const eventPreviewModel = await calendarLocator.calendarEventPreviewModel(event, calendars)
			eventPreviewModel.sanitizeDescription().then(() => m.redraw())
			return eventPreviewModel
		}).load(),
	)

	constructor(vnode: Vnode<CalendarSearchViewAttrs>) {
		super()
		this.searchViewModel = vnode.attrs.makeViewModel()

		this.resultListColumn = new ViewColumn(
			{
				view: () => {
					return m(BackgroundColumnLayout, {
						backgroundColor: theme.navigation_bg,
						desktopToolbar: () => m(DesktopListToolbar, [m(".button-height")]),
						mobileHeader: () => this.renderMobileListHeader(vnode.attrs.header),
						columnLayout: this.getResultColumnLayout(),
					})
				},
			},
			ColumnType.Background,
			{
				minWidth: size.second_col_min_width,
				maxWidth: size.second_col_max_width,
				headerCenter: () => lang.get("searchResult_label"),
			},
		)
		this.resultDetailsColumn = new ViewColumn(
			{
				view: () => this.renderDetailsView(vnode.attrs.header),
			},
			ColumnType.Background,
			{
				minWidth: size.third_col_min_width,
				maxWidth: size.third_col_max_width,
			},
		)
		this.viewSlider = new ViewSlider([this.resultListColumn, this.resultDetailsColumn], false)
	}

	private getResultColumnLayout() {
		return m(CalendarSearchListView, {
			listModel: this.searchViewModel.listModel,
			onSingleSelection: (item) => {
				this.viewSlider.focus(this.resultDetailsColumn)
			},
			cancelCallback: () => {
				this.searchViewModel.sendStopLoadingSignal()
			},
			isFreeAccount: calendarLocator.logins.getUserController().isFreeAccount(),
		} satisfies CalendarSearchListViewAttrs)
	}

	private renderFilterSection(): Children {
		return m(SidebarSection, { name: "filter_label" }, this.renderCalendarFilterSection())
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
				".flex-grow.flex.justify-center",
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
			backgroundColor: theme.navigation_bg,
			desktopToolbar: () => m(DesktopViewerToolbar, []),
			mobileHeader: () =>
				m(MobileHeader, {
					...header,
					backAction: () => this.viewSlider.focusPreviousColumn(),
					columnType: "other",
					title: lang.get("search_label"),
					actions: null,
					multicolumnActions: () => [],
					primaryAction: () => this.renderHeaderRightView(),
				}),
			columnLayout:
				selectedEvent == null
					? m(ColumnEmptyMessageBox, {
							message: "noEventSelect_msg",
							icon: BootIcons.Calendar,
							color: theme.content_message_bg,
							backgroundColor: theme.navigation_bg,
					  })
					: !this.getSanitizedPreviewData(selectedEvent).isLoaded()
					? null
					: this.renderEventDetails(selectedEvent),
		})
	}

	private renderEventDetails(selectedEvent: CalendarEvent) {
		return m(
			".height-100p.overflow-y-scroll.mb-l.fill-absolute.pb-l",
			m(
				".border-radius-big.flex.col.flex-grow.content-bg",
				{
					class: styles.isDesktopLayout() ? "mlr-l" : "mlr",
					style: {
						"min-width": styles.isDesktopLayout() ? px(size.third_col_min_width) : null,
						"max-width": styles.isDesktopLayout() ? px(size.third_col_max_width) : null,
					},
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

	private renderCalendarFilterSection(): Children {
		return [this.renderCalendarTimeRangeField(), this.renderCalendarFilter(), this.renderRepeatingFilter()].map((row) =>
			m(".folder-row.plr-button.content-fg", row),
		)
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
			return m.fragment({}, [
				this.renderSearchResultActions(),
				m(IconButton, {
					icon: Icons.Filter,
					title: "filter_label",
					click: () => {
						const dialog = Dialog.editSmallDialog(
							{
								middle: () => lang.get("filter_label"),
								right: [
									{
										label: "ok_action",
										click: () => {
											dialog.close()
										},
										type: ButtonType.Primary,
									},
								],
							},
							() => m(".pt-m.pb-ml", this.renderCalendarFilterSection()),
						)
						dialog.show()
					},
				}),
			])
		}
	}

	private renderCalendarTimeRangeField(): Children {
		const startDate = new Date()
		const start = this.searchViewModel.startDate == null ? lang.get("today_label") : formatDate(this.searchViewModel.startDate)
		const endDate = incrementMonth(startDate, 2)
		const end = this.searchViewModel.endDate == null ? formatDate(endDate) : formatDate(this.searchViewModel.endDate)
		const timeDisplayValue = start + " - " + end
		return m(TextField, {
			label: "periodOfTime_label",
			value: timeDisplayValue,
			isReadOnly: true,
			class: "plr-button",
			injectionsRight: () =>
				m(IconButton, {
					title: "selectPeriodOfTime_label",
					click: async () => {
						if (this.searchViewModel.canSelectTimePeriod()) {
							const period = await showDateRangeSelectionDialog(
								this.searchViewModel.getStartOfTheWeekOffset(),
								this.searchViewModel.startDate ?? startDate,
								this.searchViewModel.endDate ?? endDate,
								(startDate, endDate) => {
									if (startDate == null || endDate == null) return null
									if (endDate.getTime() - startDate.getTime() > YEAR_IN_MILLIS) {
										return lang.get("longSearchRange_msg")
									} else if (startDate.getTime() > endDate.getTime()) {
										return lang.get("startAfterEnd_label")
									}
									return null
								},
							)
							this.searchViewModel.startDate = period.start
							this.searchViewModel.endDate = period.end

							this.searchViewModel.searchAgain()
						} else {
							await showNotAvailableForFreeDialog()
						}
					},
					icon: Icons.Edit,
					size: ButtonSize.Compact,
				}),
		})
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

		// redraw because init() is async
		m.redraw()
	}

	private getMainButton(typeRef: TypeRef<unknown>): {
		label: TranslationKey
		click: ClickHandler
	} | null {
		if (styles.isUsingBottomNavigation()) {
			return null
		}

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
		const lazyCalendarInfo = this.searchViewModel.getLazyCalendarInfos()
		const calendarInfos = lazyCalendarInfo.isLoaded() ? lazyCalendarInfo.getSync() : lazyCalendarInfo.getAsync()

		if (calendarInfos instanceof Promise) {
			await showProgressDialog("pleaseWait_msg", calendarInfos)
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
			await showNewCalendarEventEditDialog(model)
		}
	}

	private renderCalendarFilter(): Children {
		if (this.searchViewModel.getLazyCalendarInfos().isLoaded()) {
			const calendarInfos = this.searchViewModel.getLazyCalendarInfos().getSync() ?? []

			// Load user's calendar list
			const items = Array.from(calendarInfos.values()).map((ci) => ({
				name: getSharedGroupName(ci.groupInfo, calendarLocator.logins.getUserController(), true),
				value: ci,
			}))

			// Find the selected value after loading the available calendars
			const selectedValue =
				items.find((calendar) =>
					isSameId([calendar.value.groupRoot.longEvents, calendar.value.groupRoot.shortEvents], this.searchViewModel.selectedCalendar),
				)?.value ?? null

			return m(
				".mlr-button",
				m(DropDownSelector, {
					label: "calendar_label",
					items: [{ name: lang.get("all_label"), value: null }, ...items],
					selectedValue,
					selectionChangedHandler: (value: CalendarInfo | null) => {
						// re-search with new list ids
						// value can be null if default option has been selected
						this.searchViewModel.selectedCalendar = value ? [value.groupRoot.longEvents, value.groupRoot.shortEvents] : null
						this.searchViewModel.searchAgain()
					},
				} satisfies DropDownSelectorAttrs<CalendarInfo | null>),
			)
		} else {
			return null
		}
	}

	private renderRepeatingFilter(): Children {
		return m(
			".mlr-button",
			m(Checkbox, {
				label: () => lang.get("includeRepeatingEvents_action"),
				checked: this.searchViewModel.includeRepeatingEvents,
				onChecked: (value: boolean) => {
					this.searchViewModel.includeRepeatingEvents = value
					this.searchViewModel.searchAgain()
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
}
