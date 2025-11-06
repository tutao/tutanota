import m, { Children, Vnode } from "mithril"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider.js"
import { ColumnType, ViewColumn } from "../../../common/gui/base/ViewColumn"
import { InfoLink, lang, TranslationKey } from "../../../common/misc/LanguageViewModel"
import { FeatureType, Keys, MailReportType, MailSetKind, SystemFolderType } from "../../../common/api/common/TutanotaConstants"
import { assertMainOrNode, isApp, isBrowser } from "../../../common/api/common/Env"
import { keyManager, Shortcut } from "../../../common/misc/KeyManager"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { SearchListView, SearchListViewAttrs } from "./SearchListView"
import { size } from "../../../common/gui/size"
import { SEARCH_MAIL_FIELDS, SearchCategoryTypes } from "../model/SearchUtils"
import { Dialog } from "../../../common/gui/base/Dialog"
import { locator } from "../../../common/api/main/CommonLocator"
import {
	assertNotNull,
	first,
	getFirstOrThrow,
	isEmpty,
	isNotEmpty,
	isSameDayOfDate,
	isSameTypeRef,
	last,
	LazyLoaded,
	lazyMemoized,
	memoized,
	noOp,
	ofClass,
	setDifference,
	TypeRef,
} from "@tutao/tutanota-utils"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { AppHeaderAttrs, Header } from "../../../common/gui/Header.js"
import { PermissionError } from "../../../common/api/common/error/PermissionError"
import { ContactEditor } from "../../contacts/ContactEditor"
import { styles } from "../../../common/gui/styles"
import { FolderColumnView } from "../../../common/gui/FolderColumnView.js"
import { getGroupInfoDisplayName } from "../../../common/api/common/utils/GroupUtils"
import { isNewMailActionAvailable } from "../../../common/gui/nav/NavFunctions"
import { SidebarSection } from "../../../common/gui/SidebarSection"
import type { ClickHandler } from "../../../common/gui/base/GuiUtils"
import { SelectorItem } from "../../../common/gui/base/DropDownSelector.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { MobileMailActionBar } from "../../mail/view/MobileMailActionBar.js"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu.js"
import { BaseTopLevelView } from "../../../common/gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../../TopLevelView.js"
import { getContactSelectionMessage, MultiContactViewer } from "../../contacts/view/MultiContactViewer.js"
import { ContactCardViewer } from "../../contacts/view/ContactCardViewer.js"
import { getMailSelectionMessage, MultiItemViewer } from "../../mail/view/MultiItemViewer.js"
import { ConversationViewer } from "../../mail/view/ConversationViewer.js"
import { ContactViewerActions } from "../../contacts/view/ContactViewerActions.js"
import { confirmMerge, deleteContacts, writeMail } from "../../contacts/view/ContactView.js"
import ColumnEmptyMessageBox from "../../../common/gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../../common/gui/theme.js"
import { searchBar } from "../SearchBar.js"
import { MobileMailMultiselectionActionBar } from "../../mail/view/MobileMailMultiselectionActionBar.js"
import { exportContacts } from "../../contacts/VCardExporter.js"
import { BackgroundColumnLayout } from "../../../common/gui/BackgroundColumnLayout.js"
import { DesktopListToolbar, DesktopViewerToolbar } from "../../../common/gui/DesktopToolbars.js"
import { MailViewerActions } from "../../mail/view/MailViewerToolbar.js"
import { BaseMobileHeader } from "../../../common/gui/BaseMobileHeader.js"
import { ProgressBar } from "../../../common/gui/base/ProgressBar.js"
import { EnterMultiselectIconButton } from "../../../common/gui/EnterMultiselectIconButton.js"
import { MobileHeader } from "../../../common/gui/MobileHeader.js"
import { MobileActionAttrs, MobileActionBar } from "../../../common/gui/MobileActionBar.js"
import { MobileBottomActionBar } from "../../../common/gui/MobileBottomActionBar.js"
import {
	getConversationTitle,
	getMoveMailBounds,
	LabelsPopupOpts,
	promptAndDeleteMails,
	showLabelsPopup,
	showMoveMailsDropdown,
	ShowMoveMailsDropdownOpts,
	simpleMoveToSystemFolder,
	trashMails,
} from "../../mail/view/MailGuiUtils.js"
import { SelectAllCheckbox } from "../../../common/gui/SelectAllCheckbox.js"
import { selectionAttrsForList } from "../../../common/misc/ListModel.js"
import { MultiselectMobileHeader } from "../../../common/gui/MultiselectMobileHeader.js"
import { MultiselectMode } from "../../../common/gui/base/List.js"
import { SearchViewModel } from "./SearchViewModel.js"
import { LockedError, NotFoundError } from "../../../common/api/common/error/RestError.js"
import { showNotAvailableForFreeDialog } from "../../../common/misc/SubscriptionDialogs.js"
import { listSelectionKeyboardShortcuts } from "../../../common/gui/base/ListUtils.js"
import { getElementId, getIds, isSameId } from "../../../common/api/common/utils/EntityUtils.js"
import { CalendarEventPreviewViewModel } from "../../../calendar-app/calendar/gui/eventpopup/CalendarEventPreviewViewModel.js"
import {
	EventDetailsView,
	EventDetailsViewAttrs,
	handleEventDeleteButtonClick,
	handleEventEditButtonClick,
	handleSendUpdatesClick,
} from "../../../calendar-app/calendar/view/EventDetailsView.js"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog.js"
import { CalendarOperation } from "../../../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"
import { getEventWithDefaultTimes, setNextHalfHour } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { EventEditorDialog } from "../../../calendar-app/calendar/gui/eventeditor-view/CalendarEventEditDialog.js"
import { BottomNav } from "../../gui/BottomNav.js"
import { mailLocator } from "../../mailLocator.js"
import { allInSameMailbox, getIndentedFolderNameForDropdown } from "../../mail/model/MailUtils.js"
import { ContactModel } from "../../../common/contactsFunctionality/ContactModel.js"
import { extractContactIdFromEvent, isBirthdayEvent } from "../../../common/calendar/date/CalendarUtils.js"
import { createDropdown, PosRect } from "../../../common/gui/base/Dropdown"
import { editDraft, getMailViewerMoreActions, MailFilterType, showReportPhishingMailDialog, startExport } from "../../mail/view/MailViewerUtils"
import { isEditableDraft, isMailScheduled } from "../../mail/model/MailChecks"
import { ConversationViewModel } from "../../mail/view/ConversationViewModel"
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import { MoveMode } from "../../mail/model/MailModel"
import { MailViewerViewModel } from "../../mail/view/MailViewerViewModel"
import { Card } from "../../../common/gui/base/Card"
import { CALENDAR_PREFIX, CONTACTS_PREFIX, MAIL_PREFIX } from "../../../common/misc/RouteChange"
import { FilterChip } from "../../../common/gui/base/FilterChip"
import { formatDate } from "../../../common/misc/Formatter"
import { AllIcons } from "../../../common/gui/base/Icon"
import { showDateRangeSelectionDialog } from "../../../calendar-app/calendar/gui/pickers/DatePickerDialog"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"
import { UndoModel } from "../../UndoModel"
import { deviceConfig } from "../../../common/misc/DeviceConfig"
import { CalendarInfo } from "../../../calendar-app/calendar/model/CalendarModel"

assertMainOrNode()

export interface SearchViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	makeViewModel: () => SearchViewModel
	contactModel: ContactModel
	undoModel: UndoModel
}

export class SearchView extends BaseTopLevelView implements TopLevelView<SearchViewAttrs> {
	private readonly resultListColumn: ViewColumn
	private readonly resultDetailsColumn: ViewColumn
	private readonly folderColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	private readonly searchViewModel: SearchViewModel
	private readonly contactModel: ContactModel
	private readonly startOfTheWeekOffset: number
	private readonly undoModel: UndoModel

	private getSanitizedPreviewData: (event: CalendarEvent) => LazyLoaded<CalendarEventPreviewViewModel> = memoized((event: CalendarEvent) =>
		new LazyLoaded(async () => {
			const calendars = await this.searchViewModel.getAvailableCalendars(false)
			const calendarInfosMap = new Map(calendars.map((calendarInfo) => [calendarInfo.id, calendarInfo as CalendarInfo]))
			const eventPreviewModel = await locator.calendarEventPreviewModel(event, calendarInfosMap, this.searchViewModel.getHighlightedStrings())
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

	constructor(vnode: Vnode<SearchViewAttrs>) {
		super()
		this.searchViewModel = vnode.attrs.makeViewModel()
		this.contactModel = vnode.attrs.contactModel
		this.startOfTheWeekOffset = this.searchViewModel.getStartOfTheWeekOffset()
		this.undoModel = vnode.attrs.undoModel
		const userId = locator.logins.getUserController().userId

		this.folderColumn = new ViewColumn(
			{
				view: () => {
					const restriction = this.searchViewModel.getRestriction()
					return m(FolderColumnView, {
						drawer: vnode.attrs.drawerAttrs,
						button: this.getMainButton(restriction.type),
						content: [
							m(SidebarSection, {
								name: "searchFilters_label",
							}),
							m(".flex.wrap.plr-button-double.gap-vpad-s.flex-shrink-children", this.renderFilterChips()),
							m(".flex-grow"),
							this.renderAppPromo(),
						],
						ariaLabel: "search_label",
					})
				},
			},
			ColumnType.Foreground,
			{
				minWidth: size.first_col_min_width,
				maxWidth: size.first_col_max_width,
				headerCenter: "search_label",
			},
		)

		this.resultListColumn = new ViewColumn(
			{
				view: () => {
					return m(BackgroundColumnLayout, {
						backgroundColor: theme.surface_container,
						desktopToolbar: () =>
							m(DesktopListToolbar, [
								this.searchViewModel.listModel && getCurrentSearchMode() !== SearchCategoryTypes.calendar
									? [m(SelectAllCheckbox, selectionAttrsForList(this.searchViewModel.listModel))]
									: m(".button-height"),
							]),
						mobileHeader: () => this.renderMobileListHeader(vnode.attrs.header),
						columnLayout: this.getResultColumnLayout(),
					})
				},
			},
			ColumnType.Background,
			{
				minWidth: size.second_col_min_width,
				maxWidth: deviceConfig.getMailListSize(userId) ?? size.second_col_max_width,
				headerCenter: "searchResult_label",
				resizeCallback: (size) => {
					deviceConfig.setMailListSize(userId, size)
				},
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
		this.viewSlider = new ViewSlider([this.folderColumn, this.resultListColumn, this.resultDetailsColumn])
	}

	private getResultColumnLayout() {
		return m(".flex.col.fill-absolute", [
			styles.isDesktopLayout() ? null : this.renderFilterBar(),
			m(
				".rel.flex-grow",
				m(SearchListView, {
					listModel: this.searchViewModel.listModel,
					currentType: this.searchViewModel.searchedType,
					onSingleSelection: (item) => {
						this.viewSlider.focus(this.resultDetailsColumn)
						if (isSameTypeRef(item.entry._type, MailTypeRef)) {
							// Make sure that we mark mail as read if you select the mail again, even if it was selected before.
							// Do it in the next even loop to not rely on what is called first, listModel or us. ListModel changes are
							// sync so this should be enough.
							Promise.resolve().then(() => {
								const conversationViewModel = this.searchViewModel.conversationViewModel
								if (conversationViewModel && isSameId(item._id, conversationViewModel.primaryMail._id)) {
									conversationViewModel?.primaryViewModel().setUnread(false)
								}
							})
						}
					},
					cancelCallback: () => {
						this.searchViewModel.sendStopLoadingSignal()
					},
					isFreeAccount: locator.logins.getUserController().isFreeAccount(),
					getLabelsForMail: (mail) => this.searchViewModel.getLabelsForMail(mail),
					highlightedStrings: this.searchViewModel.getHighlightedStrings(),
					availableCalendars: this.searchViewModel.getAvailableCalendars(true),
				} satisfies SearchListViewAttrs),
			),
		])
	}

	private renderFilterBar(): Children {
		return m(".flex.gap-vpad-s.pl-vpad-m.pr-vpad-m.pt-s.pb-s.scroll-x", this.renderFilterChips())
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
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryTypes.mail)
							m.route.set(href)
						},
						icon: BootIcons.Mail,
					},
					{
						label: "contacts_label",
						click: () => {
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryTypes.contact)
							m.route.set(href)
						},
						icon: BootIcons.Contacts,
					},
					{
						label: "calendar_label",
						click: () => {
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryTypes.calendar)
							m.route.set(href)
						},
						icon: BootIcons.Calendar,
					},
				],
			}),
		})
	}

	private renderFilterChips(): Children {
		switch (getCurrentSearchMode()) {
			case SearchCategoryTypes.mail:
				return this.renderMailFilterChips()
			case SearchCategoryTypes.contact:
				return this.renderContactsFilterChips()
			case SearchCategoryTypes.calendar:
				return this.renderCalendarFilterChips()
		}
	}

	private renderMailFilterChips(): Children {
		const availableMailFolders = this.getAvailableMailFolders()
		const selectedFolder = first(this.searchViewModel.selectedMailFolder)
		return [
			this.renderCategoryChip("emails_label", BootIcons.Mail),
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
				onClick: (_) => this.onMailDateRangeSelect(),
			}),
			m(FilterChip, {
				label: selectedFolder
					? lang.makeTranslation("btn:folder", availableMailFolders.find((f) => f.value === selectedFolder)?.name ?? "")
					: lang.getTranslation("mailFolder_label"),
				selected: selectedFolder != null,
				chevron: true,
				onClick: createDropdown({
					lazyButtons: () =>
						availableMailFolders.map((f) => ({
							label: lang.makeTranslation(f.name, f.name),
							click: () => this.searchViewModel.selectMailFolder(f.value ? [f.value] : []),
						})),
				}),
			}),
			m(FilterChip, {
				label: this.searchViewModel.selectedMailField
					? lang.makeTranslation(
							"field_label",
							lang.getTranslationText(assertNotNull(SEARCH_MAIL_FIELDS.find((f) => f.field === this.searchViewModel.selectedMailField)).textId),
						)
					: lang.getTranslation("field_label"),
				selected: this.searchViewModel.selectedMailField != null,
				chevron: true,
				onClick: createDropdown({
					lazyButtons: () =>
						SEARCH_MAIL_FIELDS.map((f) => ({
							label: lang.getTranslation(f.textId),
							click: () => this.searchViewModel.selectMailField(f.field),
						})),
				}),
			}),
			m(FilterChip, {
				label: this.searchViewModel.mailFilter.has(MailFilterType.Unread)
					? lang.getTranslation("filterUnread_label")
					: this.searchViewModel.mailFilter.has(MailFilterType.Read)
						? lang.getTranslation("filterRead_label")
						: lang.getTranslation("filterUnread_label"),
				selected: this.searchViewModel.mailFilter.has(MailFilterType.Unread) || this.searchViewModel.mailFilter.has(MailFilterType.Read),
				chevron: true,
				onClick: createDropdown({
					lazyButtons: () => [
						{
							label: lang.getTranslation("all_label"),
							click: () =>
								this.searchViewModel.setMailFilter(
									setDifference(this.searchViewModel.mailFilter, new Set([MailFilterType.Read, MailFilterType.Unread])),
								),
						},
						{
							label: lang.getTranslation("filterUnread_label"),
							click: () => {
								const newFilters = new Set(this.searchViewModel.mailFilter)
								newFilters.delete(MailFilterType.Read)
								newFilters.add(MailFilterType.Unread)
								this.searchViewModel.setMailFilter(newFilters)
							},
						},
						{
							label: lang.getTranslation("filterRead_label"),
							click: () => {
								const newFilters = new Set(this.searchViewModel.mailFilter)
								newFilters.delete(MailFilterType.Unread)
								newFilters.add(MailFilterType.Read)
								this.searchViewModel.setMailFilter(newFilters)
							},
						},
					],
				}),
			}),
			m(FilterChip, {
				label: lang.getTranslation("filterWithAttachments_label"),
				selected: this.searchViewModel.mailFilter.has(MailFilterType.WithAttachments),
				chevron: false,
				onClick: () => {
					const newFilters = new Set(this.searchViewModel.mailFilter)
					if (this.searchViewModel.mailFilter.has(MailFilterType.WithAttachments)) {
						newFilters.delete(MailFilterType.WithAttachments)
					} else {
						newFilters.add(MailFilterType.WithAttachments)
					}
					this.searchViewModel.setMailFilter(newFilters)
				},
			}),
		]
	}

	private async onMailDateRangeSelect() {
		if (!this.searchViewModel.canSelectTimePeriod()) {
			showNotAvailableForFreeDialog()
		} else {
			const { start, end } = await showDateRangeSelectionDialog({
				start: this.searchViewModel.startDate,
				end: this.searchViewModel.endDate,
				startOfTheWeekOffset: this.startOfTheWeekOffset,
				optionalStartDate: true,
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

	private renderAppPromo(): Children {
		const searchText = renderSearchInOurApps()
		if (searchText == null) {
			return null
		}
		return m("div.ml-button.mt-m.small.plr-button.content-fg.mb", m(Card, searchText))
	}

	oncreate(): void {
		this.searchViewModel.init(() => this.confirmMailSearch())

		keyManager.registerShortcuts(this.shortcuts())
	}

	onremove(): void {
		this.searchViewModel.dispose()

		keyManager.unregisterShortcuts(this.shortcuts())
	}

	private renderMobileListHeader(header: AppHeaderAttrs): Children {
		return this.searchViewModel.listModel && this.searchViewModel.listModel.state.inMultiselect
			? this.renderMultiSelectMobileHeader()
			: this.renderMobileListActionsHeader(header)
	}

	private renderMobileListActionsHeader(header: AppHeaderAttrs): Children {
		const rightActions: Children[] = []

		if (!isSameTypeRef(this.searchViewModel.searchedType, CalendarEventTypeRef)) {
			rightActions.push(
				m(EnterMultiselectIconButton, {
					clickAction: () => {
						this.searchViewModel.listModel.enterMultiselect()
					},
				}),
			)
		}

		return m(BaseMobileHeader, {
			left: !styles.isMobileDesktopLayout()
				? m(
						".icon-button",
						m(IconButton, {
							title: "back_action",
							icon: BootIcons.Back,
							click: () => {
								if (isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef)) {
									m.route.set(MAIL_PREFIX)
								} else if (isSameTypeRef(this.searchViewModel.searchedType, ContactTypeRef)) {
									m.route.set(CONTACTS_PREFIX)
								} else if (isSameTypeRef(this.searchViewModel.searchedType, CalendarEventTypeRef)) {
									m.route.set(CALENDAR_PREFIX)
								}
							},
						}),
					)
				: m(".ml-s"),
			right: rightActions,
			center: m(
				".flex-grow.flex.justify-center",
				{
					class: rightActions.length === 0 ? "mr" : "",
				},
				m(searchBar, {
					placeholder: this.searchBarPlaceholder(),
					returnListener: () => this.resultListColumn.focus(),
				}),
			),
			injections: m(ProgressBar, { progress: header.offlineIndicatorModel.getProgress() }),
		})
	}

	private renderMultiSelectMobileHeader(): Children {
		return m(MultiselectMobileHeader, {
			...selectionAttrsForList(this.searchViewModel.listModel),
			message:
				getCurrentSearchMode() === SearchCategoryTypes.mail
					? getMailSelectionMessage(this.searchViewModel.getSelectedMails())
					: getContactSelectionMessage(this.searchViewModel.getSelectedContacts().length),
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

		if (getCurrentSearchMode() === SearchCategoryTypes.contact) {
			const selectedContacts = this.searchViewModel.getSelectedContacts()

			const actions = m(ContactViewerActions, {
				contacts: selectedContacts,
				onEdit: (c: Contact) => new ContactEditor(locator.entityClient, c).show(),
				onDelete: deleteContacts,
				onMerge: confirmMerge,
				onExport: exportContacts,
			})
			const isMultiselect = this.searchViewModel.listModel.state.inMultiselect || selectedContacts.length === 0
			return m(BackgroundColumnLayout, {
				backgroundColor: theme.surface_container,
				desktopToolbar: () => m(DesktopViewerToolbar, actions),
				mobileHeader: () =>
					m(MobileHeader, {
						...header,
						backAction: () => this.viewSlider.focusPreviousColumn(),
						columnType: "other",
						title: "search_label",
						actions: null,
						multicolumnActions: () => actions,
						primaryAction: () => null,
					}),
				columnLayout:
					// see comment for .scrollbar-gutter-stable-or-fallback
					m(
						".fill-absolute.flex.col.overflow-y-scroll",
						isMultiselect
							? m(MultiContactViewer, {
									selectedEntities: selectedContacts,
									selectNone: () => this.searchViewModel.listModel.selectNone(),
								})
							: m(ContactCardViewer, {
									contact: selectedContacts[0],
									onWriteMail: writeMail,
									highlightedStrings: this.searchViewModel.getHighlightedStrings(),
								}),
					),
			})
		} else if (getCurrentSearchMode() === SearchCategoryTypes.mail) {
			const selectedMails = this.searchViewModel.getSelectedMails()

			const conversationViewModel = this.searchViewModel.conversationViewModel
			if (this.searchViewModel.listModel.state.inMultiselect || !conversationViewModel) {
				const { deleteAction, trashAction } = this.getDeleteAndTrashActions()
				const actions = m(MailViewerActions, {
					selectedMails: selectedMails,
					selectNone: () => this.searchViewModel.listModel.selectNone(),
					trashMailsAction: trashAction,
					deleteMailAction: deleteAction,
					moveMailsAction: this.getMoveMailsAction(),
					applyLabelsAction: this.getLabelsAction(),
					setUnreadStateAction: (unread) => this.setUnreadState(unread),
					isUnread: null,
					editDraftAction: this.getEditDraftAction(),
					unscheduleMailAction: this.getUnscheduleAction(),
					exportAction: this.getExportAction(),
					replyAction: null,
					replyAllAction: null,
					forwardAction: null,
					mailViewerMoreActions: null,
					reportSpamAction: this.getReportSelectedMailsSpamAction(),
				})
				return m(BackgroundColumnLayout, {
					backgroundColor: theme.surface_container,
					desktopToolbar: () => m(DesktopViewerToolbar, actions),
					mobileHeader: () =>
						m(MobileHeader, {
							...header,
							backAction: () => this.viewSlider.focusPreviousColumn(),
							columnType: "other",
							title: getMailSelectionMessage(selectedMails),
							actions: null,
							multicolumnActions: () => actions,
							primaryAction: () => null,
						}),
					columnLayout: m(MultiItemViewer, {
						selectedEntities: selectedMails,
						selectNone: () => this.searchViewModel.listModel.selectNone(),
						loadAll: () => this.searchViewModel.loadAll(),
						stopLoadAll: () => this.searchViewModel.stopLoadAll(),
						loadingAll:
							this.searchViewModel.loadingAllForSearchResult != null
								? "loading"
								: this.searchViewModel.listModel.isLoadedCompletely()
									? "loaded"
									: "can_load",
						getSelectionMessage: (selected: ReadonlyArray<Mail>) => getMailSelectionMessage(selected),
					}),
				})
			} else {
				const { deleteAction, trashAction } = this.getDeleteAndTrashActions()
				const actions = m(MailViewerActions, {
					selectedMails: [conversationViewModel.primaryMail],
					trashMailsAction: trashAction,
					deleteMailAction: deleteAction,
					moveMailsAction: this.getMoveMailsAction(),
					applyLabelsAction: this.getLabelsAction(),
					setUnreadStateAction: (unread) => this.setUnreadState(unread),
					isUnread: this.getUnreadState(),
					editDraftAction: this.getEditDraftAction(),
					unscheduleMailAction: this.getUnscheduleAction(),
					exportAction: this.getExportAction(),
					replyAction: this.getReplyAction(conversationViewModel, false),
					replyAllAction: this.getReplyAction(conversationViewModel, true),
					forwardAction: this.getForwardAction(conversationViewModel),
					mailViewerMoreActions: getMailViewerMoreActions({
						viewModel: conversationViewModel.primaryViewModel(),
						print: this.getPrintAction(),
						reportSpam: null,
						reportPhishing: this.getSingleMailPhishingAction(conversationViewModel.primaryViewModel()),
					}),
					reportSpamAction: this.getReportSelectedMailsSpamAction(),
				})
				return m(BackgroundColumnLayout, {
					backgroundColor: theme.surface_container,
					desktopToolbar: () => m(DesktopViewerToolbar, actions),
					mobileHeader: () =>
						m(MobileHeader, {
							...header,
							backAction: () => this.viewSlider.focusPreviousColumn(),
							columnType: "other",
							title: getConversationTitle(conversationViewModel),
							actions: null,
							multicolumnActions: () => actions,
							primaryAction: () => null,
						}),
					columnLayout: m(ConversationViewer, {
						// Re-create the whole viewer and its vnode tree if email has changed
						key: getElementId(conversationViewModel.primaryMail),
						viewModel: conversationViewModel,
						actionableMailViewerViewModel: () => conversationViewModel.primaryViewModel(),
						delayBodyRendering: Promise.resolve(),
						actions: (mailViewerModel: MailViewerViewModel) => {
							return {
								trash: () => {
									trashMails(mailViewerModel.mailboxModel, mailViewerModel.mailModel, this.undoModel, [mailViewerModel.mail])
								},
								delete: mailViewerModel.isDeletableMail()
									? () => promptAndDeleteMails(mailViewerModel.mailModel, [mailViewerModel.mail._id], null, noOp)
									: null,
								move: (dom) => {
									showMoveMailsDropdown(
										mailViewerModel.mailboxModel,
										mailViewerModel.mailModel,
										this.undoModel,
										dom.getBoundingClientRect(),
										[mailViewerModel.mail],
										MoveMode.Mails,
									)
								},
							}
						},
						moreActions: (mailViewerModel) => {
							return getMailViewerMoreActions({
								viewModel: mailViewerModel,
								print: this.getPrintAction(),
								reportSpam: this.getSingleMailSpamAction(mailViewerModel),
								reportPhishing: this.getSingleMailPhishingAction(mailViewerModel),
							})
						},
					}),
				})
			}
		} else if (getCurrentSearchMode() === SearchCategoryTypes.calendar) {
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
						primaryAction: () => null,
					}),
				columnLayout:
					selectedEvent == null
						? m(ColumnEmptyMessageBox, {
								message: "noEventSelect_msg",
								icon: BootIcons.Calendar,
								color: theme.on_surface_variant,
								backgroundColor: theme.surface_container,
							})
						: this.renderEventPreview(selectedEvent),
			})
		} else {
			return m(
				".flex.col.fill-absolute",
				// Using contactViewToolbar because it will display empty
				m(ContactViewerActions, { contacts: [], onExport: noOp, onMerge: noOp, onDelete: noOp, onEdit: noOp }),
				m(
					".flex-grow.rel.overflow-hidden",
					m(ColumnEmptyMessageBox, {
						message: "noSelection_msg",
						color: theme.on_surface_variant,
						backgroundColor: theme.surface_container,
					}),
				),
			)
		}
	}

	private reportSingleMail(viewModel: MailViewerViewModel, reportType: MailReportType): void {
		viewModel
			.reportMail(reportType)
			.catch(ofClass(LockedError, () => Dialog.message("operationStillActive_msg")))
			.finally(m.redraw)
	}

	private getSingleMailSpamAction(viewModel: MailViewerViewModel): () => void {
		return () => this.reportSingleMail(viewModel, MailReportType.SPAM)
	}

	private getSingleMailPhishingAction(viewModel: MailViewerViewModel): (() => void) | null {
		return viewModel.canReport()
			? () => {
					showReportPhishingMailDialog(async () => this.reportSingleMail(viewModel, MailReportType.PHISHING))
				}
			: null
	}

	private getReportSelectedMailsSpamAction(): (() => unknown) | null {
		return async () => {
			const selectedMails = this.searchViewModel.getSelectedMails()
			if (isEmpty(selectedMails)) {
				return
			}

			simpleMoveToSystemFolder(mailLocator.mailboxModel, mailLocator.mailModel, this.undoModel, MailSetKind.SPAM, selectedMails)
		}
	}

	private getForwardAction(conversationViewModel: ConversationViewModel): (() => void) | null {
		const viewModel = conversationViewModel.primaryViewModel()
		if (viewModel.canForward()) {
			return () => viewModel.forward().catch(ofClass(UserError, showUserError))
		} else {
			return null
		}
	}

	private getReplyAction(conversationViewModel: ConversationViewModel, replyAll: boolean): (() => void) | null {
		const viewModel = conversationViewModel.primaryViewModel()

		const canReply = replyAll ? viewModel.canReplyAll() : viewModel.canReply()
		if (canReply) {
			return () => viewModel.reply(replyAll)
		} else {
			return null
		}
	}

	private getExportAction(): (() => void) | null {
		const mails = this.searchViewModel.listModel.getSelectedAsArray() ?? []
		if (!this.searchViewModel.isExportingMailsAllowed() || isEmpty(mails)) {
			return null
		}

		return () => startExport(async () => mails.map(({ _id }) => _id))
	}

	private getEditDraftAction(): (() => void) | null {
		// conversationViewModel is not there if we are in multiselect or if nothing is selected
		const conversationViewModel = this.searchViewModel.conversationViewModel
		if (conversationViewModel != null && isEditableDraft(conversationViewModel.primaryMail)) {
			return () => editDraft(conversationViewModel.primaryViewModel())
		} else {
			return null
		}
	}

	private getUnscheduleAction(): (() => void) | null {
		// conversationViewModel is not there if we are in multiselect or if nothing is selected
		const conversationViewModel = this.searchViewModel.conversationViewModel
		if (conversationViewModel != null && isMailScheduled(conversationViewModel.primaryMail)) {
			return () => mailLocator.mailModel.unscheduleMail(conversationViewModel.primaryMail)
		} else {
			return null
		}
	}

	private getMoveMailsAction(): ((origin: PosRect, opts?: ShowMoveMailsDropdownOpts) => void) | null {
		return (origin) => this.moveMails(origin)
	}

	private getLabelsAction(): ((dom: HTMLElement | null, opts?: LabelsPopupOpts) => void) | null {
		const mailModel = mailLocator.mailModel
		const selectedMails = this.searchViewModel.getSelectedMails()

		return mailModel.canAssignLabels() && allInSameMailbox(selectedMails)
			? (dom, opts) => {
					showLabelsPopup(mailModel, selectedMails, async () => selectedMails.map((m) => m._id), dom, opts)
				}
			: null
	}

	private invalidateBirthdayPreview() {
		if (getCurrentSearchMode() !== SearchCategoryTypes.calendar) {
			return
		}

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

	private renderEventPreview(event: CalendarEvent): Children {
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

	private renderContactPreview(contact: Contact): Children {
		return m(
			".fill-absolute.flex.col.overflow-y-scroll",
			m(ContactCardViewer, {
				contact: contact,
				editAction: (contact) => {
					new ContactEditor(locator.entityClient, contact).show()
				},
				onWriteMail: writeMail,
				extendedActions: true,
			}),
		)
	}

	private renderEventDetails(selectedEvent: CalendarEvent): Children {
		return m(
			".height-100p.overflow-y-scroll.mb-l.fill-absolute.pb-l",
			m(
				".border-radius-big.flex.col.flex-grow.content-bg",
				{
					class: styles.isDesktopLayout() ? "mlr-l" : "mlr",
				},
				m(EventDetailsView, {
					eventPreviewModel: assertNotNull(this.getSanitizedPreviewData(selectedEvent).getSync()),
					highlightedStrings: this.searchViewModel.getHighlightedStrings(),
				} satisfies EventDetailsViewAttrs),
			),
		)
	}

	view({ attrs }: Vnode<SearchViewAttrs>): Children {
		return m(
			"#search.main-view",
			m(this.viewSlider, {
				header: m(Header, {
					firstColWidth: this.folderColumn.width,
					searchBar: () =>
						m(searchBar, {
							placeholder: this.searchBarPlaceholder(),
							returnListener: () => this.resultListColumn.focus(),
						}),
					...attrs.header,
				}),
				bottomNav: this.renderBottomNav(),
			}),
		)
	}

	private renderBottomNav(): Children {
		if (!styles.isSingleColumnLayout()) return m(BottomNav)

		const { conversationViewModel } = this.searchViewModel
		const isInMultiselect = this.searchViewModel.listModel.state.inMultiselect ?? false

		if (this.viewSlider.focusedColumn === this.resultDetailsColumn && conversationViewModel) {
			const { deleteAction, trashAction } = this.getDeleteAndTrashActions()
			return m(MobileMailActionBar, {
				deleteMailsAction: deleteAction,
				trashMailsAction: trashAction,
				moveMailsAction: this.getMoveMailsAction(),
				applyLabelsAction: this.getLabelsAction(),
				setUnreadStateAction: (unread) => this.setUnreadState(unread),
				isUnread: this.getUnreadState(),
				editDraftAction: this.getEditDraftAction(),
				unscheduleMailAction: this.getUnscheduleAction(),
				exportAction: this.getExportAction(),
				replyAction: this.getReplyAction(conversationViewModel, false),
				replyAllAction: this.getReplyAction(conversationViewModel, true),
				forwardAction: this.getForwardAction(conversationViewModel),
				mailViewerMoreActions: getMailViewerMoreActions({
					viewModel: conversationViewModel.primaryViewModel(),
					print: this.getPrintAction(),
					reportSpam: this.getSingleMailSpamAction(conversationViewModel.primaryViewModel()),
					reportPhishing: this.getSingleMailPhishingAction(conversationViewModel.primaryViewModel()),
				}),
			})
		} else if (!isInMultiselect && this.viewSlider.focusedColumn === this.resultDetailsColumn) {
			if (getCurrentSearchMode() === SearchCategoryTypes.contact) {
				return m(MobileActionBar, {
					actions: [
						{
							icon: Icons.Edit,
							title: "edit_action",
							action: () => new ContactEditor(locator.entityClient, this.searchViewModel.getSelectedContacts()[0]).show(),
						},
						{
							icon: Icons.Trash,
							title: "delete_action",
							action: () => deleteContacts(this.searchViewModel.getSelectedContacts()),
						},
					],
				})
			} else if (getCurrentSearchMode() === SearchCategoryTypes.calendar) {
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
				return m(MobileActionBar, { actions })
			}
		} else if (isInMultiselect) {
			if (getCurrentSearchMode() === SearchCategoryTypes.mail) {
				const { deleteAction, trashAction } = this.getDeleteAndTrashActions()
				return m(MobileMailMultiselectionActionBar, {
					selectNone: () => this.searchViewModel.listModel.selectNone(),
					deleteMailsAction: deleteAction,
					trashMailsAction: trashAction,
					moveMailsAction: this.getMoveMailsAction(),
					applyLabelsAction: this.getLabelsAction(),
					setUnreadStateAction: (unread) => this.setUnreadState(unread),
				})
			} else if (this.viewSlider.focusedColumn === this.resultListColumn) {
				return m(
					MobileBottomActionBar,
					m(ContactViewerActions, {
						contacts: this.searchViewModel.getSelectedContacts(),
						onEdit: () => new ContactEditor(locator.entityClient, getFirstOrThrow(this.searchViewModel.getSelectedContacts())).show(),
						onDelete: (contacts: Contact[]) => deleteContacts(contacts, () => this.searchViewModel.listModel.selectNone()),
						onMerge: confirmMerge,
						onExport: exportContacts,
					}),
				)
			}
		}

		return m(BottomNav)
	}

	private getUnreadState(): boolean {
		const selection = this.searchViewModel.getSelectedMails()
		return first(selection)?.unread ?? false
	}

	private setUnreadState(unread: boolean) {
		const selection = this.searchViewModel.getSelectedMails()
		if (!isEmpty(selection)) {
			selection.map((mail) => {
				mail.unread = unread
			})
			mailLocator.mailModel.markMails(
				selection.map(({ _id }) => _id),
				unread,
			)
		}
	}

	private async moveMails(origin: PosRect, opts?: ShowMoveMailsDropdownOpts) {
		const selection = this.searchViewModel.getSelectedMails()
		if (!isEmpty(selection)) {
			showMoveMailsDropdown(mailLocator.mailboxModel, mailLocator.mailModel, this.undoModel, origin, selection, MoveMode.Mails, opts)
		}
	}

	private searchBarPlaceholder(): string {
		const route = m.route.get()
		if (route.startsWith("/search/calendar")) {
			return lang.get("searchCalendar_placeholder")
		} else if (route.startsWith("/search/contact")) {
			return lang.get("searchContacts_placeholder")
		} else {
			return lang.get("searchEmails_placeholder")
		}
	}

	private getAvailableMailFolders(): SelectorItem<Id | null>[] {
		const mailboxes = this.searchViewModel.mailboxes

		const availableMailFolders: SelectorItem<Id | null>[] = [
			{
				name: lang.get("all_label"),
				value: null,
				indentationLevel: 0,
			},
		]

		for (const mailbox of mailboxes) {
			const mailboxIndex = mailboxes.indexOf(mailbox)
			const mailFolders = mailLocator.mailModel.getFolderSystemByGroupId(mailbox.mailGroup._id)?.getIndentedList() ?? []
			for (const folderInfo of mailFolders) {
				if (folderInfo.folder.folderType !== MailSetKind.SPAM) {
					const mailboxLabel = mailboxIndex === 0 ? "" : ` (${getGroupInfoDisplayName(mailbox.mailGroupInfo)})`
					const folderId = getElementId(folderInfo.folder)
					availableMailFolders.push({
						name: getIndentedFolderNameForDropdown(folderInfo) + mailboxLabel,
						value: folderId,
					})
				}
			}
		}
		return availableMailFolders
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	private confirmMailSearch(): Promise<boolean> {
		return Dialog.confirm("continueSearchMailbox_msg", "search_label")
	}

	private readonly shortcuts = lazyMemoized<ReadonlyArray<Shortcut>>(() => {
		const deleteOrTrashAction = () => {
			const deleteTrashActions = this.getDeleteAndTrashActions()
			const action = deleteTrashActions.deleteAction ?? deleteTrashActions.trashAction
			action?.()
		}

		return [
			...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.searchViewModel.listModel),
			{
				key: Keys.N,
				exec: () => {
					const type = this.searchViewModel.searchedType

					if (isSameTypeRef(type, MailTypeRef)) {
						newMailEditor()
							.then((editor) => editor?.show())
							.catch(ofClass(PermissionError, noOp))
					} else if (isSameTypeRef(type, ContactTypeRef)) {
						locator.contactModel.getContactListId().then((contactListId) => {
							new ContactEditor(locator.entityClient, null, assertNotNull(contactListId)).show()
						})
					}
				},
				enabled: () => locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.ReplyOnly),
				help: "newMail_action",
			},
			{
				key: Keys.DELETE,
				exec: () => {
					deleteOrTrashAction()
				},
				help: "delete_action",
			},
			{
				key: Keys.BACKSPACE,
				exec: () => {
					deleteOrTrashAction()
				},
				help: "delete_action",
			},
			{
				key: Keys.A,
				exec: () => this.moveSelectedToSystemFolder(MailSetKind.ARCHIVE),
				help: "archive_action",
				enabled: () => getCurrentSearchMode() === SearchCategoryTypes.mail,
			},
			{
				key: Keys.I,
				exec: () => this.moveSelectedToSystemFolder(MailSetKind.INBOX),
				help: "moveToInbox_action",
				enabled: () => getCurrentSearchMode() === SearchCategoryTypes.mail,
			},
			{
				key: Keys.V,
				exec: () => {
					this.move()
				},
				help: "move_action",
				enabled: () => getCurrentSearchMode() === SearchCategoryTypes.mail,
			},
			{
				key: Keys.Z,
				ctrlOrCmd: true,
				exec: () => {
					this.undoModel.performUndoAction()
				},
				help: "undo_action",
				enabled: () => getCurrentSearchMode() === SearchCategoryTypes.mail,
			},
			{
				key: Keys.U,
				exec: () => this.toggleUnreadStatus(),
				help: "toggleUnread_action",
				enabled: () => getCurrentSearchMode() === SearchCategoryTypes.mail,
			},
		]
	})

	async onNewUrl(args: Record<string, any>, requestedPath: string) {
		// calling init here too because this is called very early in the lifecycle and onNewUrl won't work properly if init is called
		// afterwords
		await this.searchViewModel.init(() => this.confirmMailSearch())
		this.searchViewModel.onNewUrl(args, requestedPath)
		if (
			isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef) &&
			styles.isSingleColumnLayout() &&
			!args.id &&
			this.viewSlider.focusedColumn === this.resultDetailsColumn
		) {
			this.viewSlider.focusPreviousColumn()
		}
		this.invalidateBirthdayPreview()

		// redraw because init() is async
		m.redraw()
	}

	private getMainButton(typeRef: TypeRef<unknown>): {
		label: TranslationKey
		click: ClickHandler
	} | null {
		if (styles.isUsingBottomNavigation()) {
			return null
		} else if (isSameTypeRef(typeRef, MailTypeRef) && isNewMailActionAvailable()) {
			return {
				click: () => {
					newMailEditor()
						.then((editor) => editor?.show())
						.catch(ofClass(PermissionError, noOp))
				},
				label: "newMail_action",
			}
		} else if (isSameTypeRef(typeRef, ContactTypeRef)) {
			return {
				click: () => {
					locator.contactModel.getContactListId().then((contactListId) => {
						new ContactEditor(locator.entityClient, null, assertNotNull(contactListId)).show()
					})
				},
				label: "newContact_action",
			}
		} else if (isSameTypeRef(typeRef, CalendarEventTypeRef)) {
			return {
				click: () => {
					this.createNewEventDialog()
				},
				label: "newEvent_action",
			}
		} else {
			return null
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

	private moveSelectedToSystemFolder(targetFolder: SystemFolderType): void {
		const selectedMails = this.searchViewModel.getSelectedMails()

		if (selectedMails.length > 0) {
			if (selectedMails.length > 1) {
				this.searchViewModel.listModel.selectNone()
			}

			simpleMoveToSystemFolder(mailLocator.mailboxModel, mailLocator.mailModel, this.undoModel, targetFolder, selectedMails)
		}
	}

	private async move() {
		const selectedMails = this.searchViewModel.getSelectedMails()

		if (selectedMails.length > 0) {
			showMoveMailsDropdown(mailLocator.mailboxModel, mailLocator.mailModel, this.undoModel, getMoveMailBounds(), selectedMails, MoveMode.Mails, {
				onSelected: () => {
					if (selectedMails.length > 1) {
						this.searchViewModel.listModel.selectNone()
					}
				},
			})
		}
	}

	private toggleUnreadStatus(): void {
		let selectedMails = this.searchViewModel.getSelectedMails()

		if (selectedMails.length > 0) {
			const unreadValue = !selectedMails[0].unread
			selectedMails.map((mail) => {
				mail.unread = unreadValue
			})
			mailLocator.mailModel.markMails(
				selectedMails.map((m) => m._id),
				unreadValue,
			)
		}
	}

	private getDeleteAndTrashActions(): { deleteAction: (() => unknown) | null; trashAction: (() => unknown) | null } {
		if (isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef)) {
			const selected = this.searchViewModel.getSelectedMails()
			const deletable = this.searchViewModel.areMailsDeletable()

			if (deletable && isNotEmpty(selected)) {
				return {
					deleteAction: () => {
						promptAndDeleteMails(mailLocator.mailModel, getIds(selected), null, () => this.searchViewModel.listModel.selectNone())
					},
					trashAction: null,
				}
			} else {
				return {
					deleteAction: null,
					trashAction: () => {
						trashMails(mailLocator.mailboxModel, mailLocator.mailModel, this.undoModel, selected)
					},
				}
			}
		} else if (isSameTypeRef(this.searchViewModel.searchedType, ContactTypeRef)) {
			const selectedContacts = this.searchViewModel.getSelectedContacts()
			if (isNotEmpty(selectedContacts)) {
				return { deleteAction: () => this.deleteContacts(selectedContacts), trashAction: null }
			} else {
				return { deleteAction: null, trashAction: null }
			}
		} else {
			// Calendar toolbar doesn't have any actions
			return { deleteAction: null, trashAction: null }
		}
	}

	private deleteContacts(selected: Contact[]): void {
		Dialog.confirm("deleteContacts_msg").then((confirmed) => {
			if (confirmed) {
				if (selected.length > 1) {
					// is needed for correct selection behavior on mobile
					this.searchViewModel.listModel.selectNone()
				}

				for (const contact of selected) {
					locator.entityClient.erase(contact).catch(
						ofClass(NotFoundError, (_) => {
							// ignore because the delete key shortcut may be executed again while the contact is already deleted
						}),
					)
				}
			}
		})
	}

	private renderContactsFilterChips(): Children {
		return [this.renderCategoryChip("contacts_label", BootIcons.Contacts)]
	}

	private renderCalendarFilterChips() {
		const availableCalendars = this.searchViewModel.getAvailableCalendars(true)
		const selectedCalendar = this.searchViewModel.selectedCalendar
		return [
			this.renderCategoryChip("calendar_label", BootIcons.Calendar),
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

	private getPrintAction(): (() => unknown) | null {
		if (isApp()) {
			return () => locator.systemFacade.print()
		} else if (typeof window.print === "function") {
			return () => window.print()
		} else {
			return null
		}
	}
}

function getCurrentSearchMode(): SearchCategoryTypes {
	const route = m.route.get()
	if (route.startsWith("/search/contact")) {
		return SearchCategoryTypes.contact
	} else if (route.startsWith("/search/calendar")) {
		return SearchCategoryTypes.calendar
	} else {
		return SearchCategoryTypes.mail
	}
}

async function newMailEditor(): Promise<Dialog | null> {
	const [mailboxDetails, { newMailEditor }] = await Promise.all([locator.mailboxModel.getUserMailboxDetails(), import("../../mail/editor/MailEditor")])
	return newMailEditor(mailboxDetails)
}

export function renderSearchInOurApps(): Children | null {
	if (!isBrowser()) {
		return null
	} else {
		return m.trust(
			lang.get("searchInOurApps_msg", {
				"{link}": `<a href="${InfoLink.Download}" target="_blank">${lang.get("searchInOurAppsLinkText_msg")}</a>`,
			}),
		)
	}
}
