import m, { Children, Vnode } from "mithril"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider.js"
import { ColumnType, ViewColumn } from "../../../common/gui/base/ViewColumn"
import type { TranslationKey } from "../../../common/misc/LanguageViewModel"
import { lang } from "../../../common/misc/LanguageViewModel"
import { FeatureType, Keys, MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { keyManager, Shortcut } from "../../../common/misc/KeyManager"
import { NavButton, NavButtonColor } from "../../../common/gui/base/NavButton.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { SearchListView, SearchListViewAttrs } from "./SearchListView"
import { px, size } from "../../../common/gui/size"
import { getFreeSearchStartDate, SEARCH_MAIL_FIELDS, SearchCategoryTypes } from "../model/SearchUtils"
import { Dialog } from "../../../common/gui/base/Dialog"
import { locator } from "../../../common/api/main/CommonLocator"
import {
	assertNotNull,
	getFirstOrThrow,
	incrementMonth,
	isSameDay,
	isSameTypeRef,
	LazyLoaded,
	lazyMemoized,
	memoized,
	noOp,
	ofClass,
	TypeRef,
} from "@tutao/tutanota-utils"
import { formatDate, formatDateWithMonth, formatDateWithTimeIfNotEven } from "../../../common/misc/Formatter"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { AppHeaderAttrs, Header } from "../../../common/gui/Header.js"
import { PermissionError } from "../../../common/api/common/error/PermissionError"
import { ContactEditor } from "../../contacts/ContactEditor"
import { styles } from "../../../common/gui/styles"
import { FolderColumnView } from "../../../common/gui/FolderColumnView.js"
import { getGroupInfoDisplayName } from "../../../common/api/common/utils/GroupUtils"
import { isNewMailActionAvailable } from "../../../common/gui/nav/NavFunctions"
import { TextField } from "../../../common/gui/base/TextField.js"
import { SidebarSection } from "../../../common/gui/SidebarSection"
import type { ClickHandler } from "../../../common/gui/base/GuiUtils"
import { DropDownSelector, DropDownSelectorAttrs, SelectorItem } from "../../../common/gui/base/DropDownSelector.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { ButtonSize } from "../../../common/gui/base/ButtonSize.js"
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
import { MobileHeader, MobileHeaderMenuButton } from "../../../common/gui/MobileHeader.js"
import { MobileActionAttrs, MobileActionBar } from "../../../common/gui/MobileActionBar.js"
import { MobileBottomActionBar } from "../../../common/gui/MobileBottomActionBar.js"
import {
	archiveMails,
	getConversationTitle,
	getMoveMailBounds,
	moveToInbox,
	showDeleteConfirmationDialog,
	showMoveMailsDropdown,
} from "../../mail/view/MailGuiUtils.js"
import { SelectAllCheckbox } from "../../../common/gui/SelectAllCheckbox.js"
import { selectionAttrsForList } from "../../../common/misc/ListModel.js"
import { MultiselectMobileHeader } from "../../../common/gui/MultiselectMobileHeader.js"
import { MultiselectMode } from "../../../common/gui/base/List.js"
import { PaidFunctionResult, SearchViewModel } from "./SearchViewModel.js"
import { NotFoundError } from "../../../common/api/common/error/RestError.js"
import { showNotAvailableForFreeDialog } from "../../../common/misc/SubscriptionDialogs.js"
import { showDateRangeSelectionDialog } from "../../../calendar-app/calendar/gui/pickers/DatePickerDialog.js"
import { MailFilterButton } from "../../mail/view/MailFilterButton.js"
import { listSelectionKeyboardShortcuts } from "../../../common/gui/base/ListUtils.js"
import { getElementId, isSameId } from "../../../common/api/common/utils/EntityUtils.js"
import { CalendarInfo } from "../../../calendar-app/calendar/model/CalendarModel.js"
import { Checkbox, CheckboxAttrs } from "../../../common/gui/base/Checkbox.js"
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
import { showNewCalendarEventEditDialog } from "../../../calendar-app/calendar/gui/eventeditor-view/CalendarEventEditDialog.js"
import { getSharedGroupName } from "../../../common/sharing/GroupUtils.js"
import { YEAR_IN_MILLIS } from "@tutao/tutanota-utils/dist/DateUtils.js"
import { BottomNav } from "../../gui/BottomNav.js"
import { mailLocator } from "../../mailLocator.js"
import { getIndentedFolderNameForDropdown } from "../../mail/model/MailUtils.js"

assertMainOrNode()

export interface SearchViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	makeViewModel: () => SearchViewModel
}

export class SearchView extends BaseTopLevelView implements TopLevelView<SearchViewAttrs> {
	private readonly resultListColumn: ViewColumn
	private readonly resultDetailsColumn: ViewColumn
	private readonly folderColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	private readonly searchViewModel: SearchViewModel

	private getSanitizedPreviewData: (event: CalendarEvent) => LazyLoaded<CalendarEventPreviewViewModel> = memoized((event: CalendarEvent) =>
		new LazyLoaded(async () => {
			const calendars = await this.searchViewModel.getLazyCalendarInfos().getAsync()
			const eventPreviewModel = await locator.calendarEventPreviewModel(event, calendars)
			eventPreviewModel.sanitizeDescription().then(() => m.redraw())
			return eventPreviewModel
		}).load(),
	)

	constructor(vnode: Vnode<SearchViewAttrs>) {
		super()
		this.searchViewModel = vnode.attrs.makeViewModel()

		this.folderColumn = new ViewColumn(
			{
				view: () => {
					const restriction = this.searchViewModel.getRestriction()
					return m(FolderColumnView, {
						drawer: vnode.attrs.drawerAttrs,
						button: this.getMainButton(restriction.type),
						content: [
							m(
								SidebarSection,
								{
									name: "search_label",
								},
								[
									m(
										".folder-row.flex-start.mlr-button",
										m(NavButton, {
											label: "emails_label",
											icon: () => BootIcons.Mail,
											// Generate the current url instead of using '#' to avoid Electron reloading the page on click
											href: this.searchViewModel.getUrlFromSearchCategory(SearchCategoryTypes.mail),
											click: () => {
												this.viewSlider.focus(this.resultListColumn)
											},
											isSelectedPrefix: "/search/mail",
											colors: NavButtonColor.Nav,
											persistentBackground: true,
										}),
									),
									m(
										".folder-row.flex-start.mlr-button",
										m(NavButton, {
											label: "contacts_label",
											icon: () => BootIcons.Contacts,
											href: this.searchViewModel.getUrlFromSearchCategory(SearchCategoryTypes.contact),
											click: () => {
												this.viewSlider.focus(this.resultListColumn)
											},
											isSelectedPrefix: "/search/contact",
											colors: NavButtonColor.Nav,
											persistentBackground: true,
										}),
									),
									m(
										".folder-row.flex-start.mlr-button",
										m(NavButton, {
											label: "calendar_label",
											icon: () => BootIcons.Calendar,
											href: this.searchViewModel.getUrlFromSearchCategory(SearchCategoryTypes.calendar),
											click: () => {
												this.viewSlider.focus(this.resultListColumn)
											},
											isSelectedPrefix: "/search/calendar",
											colors: NavButtonColor.Nav,
											persistentBackground: true,
										}),
									),
								],
							),
							this.renderFilterSection(),
						],
						ariaLabel: "search_label",
					})
				},
			},
			ColumnType.Foreground,
			{
				minWidth: size.first_col_min_width,
				maxWidth: size.first_col_max_width,
				headerCenter: () => lang.get("search_label"),
			},
		)

		this.resultListColumn = new ViewColumn(
			{
				view: () => {
					return m(BackgroundColumnLayout, {
						backgroundColor: theme.navigation_bg,
						desktopToolbar: () =>
							m(DesktopListToolbar, [
								this.searchViewModel.listModel && getCurrentSearchMode() !== SearchCategoryTypes.calendar
									? [
											m(SelectAllCheckbox, selectionAttrsForList(this.searchViewModel.listModel)),
											isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef) ? this.renderFilterButton() : null,
									  ]
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
		this.viewSlider = new ViewSlider([this.folderColumn, this.resultListColumn, this.resultDetailsColumn])
	}

	private getResultColumnLayout() {
		return m(SearchListView, {
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
		} satisfies SearchListViewAttrs)
	}

	private renderFilterSection(): Children {
		if (isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef)) {
			return m(
				SidebarSection,
				{
					name: "filter_label",
				},
				this.renderMailFilterSection(),
			)
		} else if (isSameTypeRef(this.searchViewModel.searchedType, CalendarEventTypeRef)) {
			return m(SidebarSection, { name: "filter_label" }, this.renderCalendarFilterSection())
		} else {
			// contacts don't have filters
			return null
		}
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
		return this.searchViewModel.listModel && this.searchViewModel.listModel?.state.inMultiselect
			? this.renderMultiSelectMobileHeader()
			: this.renderMobileListActionsHeader(header)
	}

	private renderMobileListActionsHeader(header: AppHeaderAttrs) {
		const rightActions = []

		if (isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef)) {
			rightActions.push(this.renderFilterButton())
		}

		if (!isSameTypeRef(this.searchViewModel.searchedType, CalendarEventTypeRef)) {
			rightActions.push(
				m(EnterMultiselectIconButton, {
					clickAction: () => {
						this.searchViewModel.listModel?.enterMultiselect()
					},
				}),
			)
		}
		if (styles.isSingleColumnLayout()) {
			rightActions.push(this.renderHeaderRightView())
		}

		return m(BaseMobileHeader, {
			left: m(MobileHeaderMenuButton, { ...header, backAction: () => this.viewSlider.focusPreviousColumn() }),
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

	private renderMultiSelectMobileHeader() {
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
			const isMultiselect = this.searchViewModel.listModel?.state.inMultiselect || selectedContacts.length === 0
			return m(BackgroundColumnLayout, {
				backgroundColor: theme.navigation_bg,
				desktopToolbar: () => m(DesktopViewerToolbar, actions),
				mobileHeader: () =>
					m(MobileHeader, {
						...header,
						backAction: () => this.viewSlider.focusPreviousColumn(),
						columnType: "other",
						title: lang.get("search_label"),
						actions: null,
						multicolumnActions: () => actions,
						primaryAction: () => this.renderHeaderRightView(),
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
							: m(ContactCardViewer, { contact: selectedContacts[0], onWriteMail: writeMail }),
					),
			})
		} else if (getCurrentSearchMode() === SearchCategoryTypes.mail) {
			const selectedMails = this.searchViewModel.getSelectedMails()

			const conversationViewModel = this.searchViewModel.conversationViewModel
			if (this.searchViewModel.listModel?.state.inMultiselect || !conversationViewModel) {
				const actions = m(MailViewerActions, {
					mailboxModel: locator.mailboxModel,
					mailModel: mailLocator.mailModel,
					mails: selectedMails,
					selectNone: () => this.searchViewModel.listModel.selectNone(),
				})
				return m(BackgroundColumnLayout, {
					backgroundColor: theme.navigation_bg,
					desktopToolbar: () => m(DesktopViewerToolbar, actions),
					mobileHeader: () =>
						m(MobileHeader, {
							...header,
							backAction: () => this.viewSlider.focusPreviousColumn(),
							columnType: "other",
							title: getMailSelectionMessage(selectedMails),
							actions: null,
							multicolumnActions: () => actions,
							primaryAction: () => this.renderHeaderRightView(),
						}),
					columnLayout: m(MultiItemViewer, {
						selectedEntities: selectedMails,
						selectNone: () => this.searchViewModel.listModel.selectNone(),
						loadAll: () => this.searchViewModel.loadAll(),
						stopLoadAll: () => this.searchViewModel.stopLoadAll(),
						loadingAll:
							this.searchViewModel.loadingAllForSearchResult != null
								? "loading"
								: this.searchViewModel.listModel?.isLoadedCompletely()
								? "loaded"
								: "can_load",
						getSelectionMessage: (selected: ReadonlyArray<Mail>) => getMailSelectionMessage(selected),
					}),
				})
			} else {
				const actions = m(MailViewerActions, {
					mailboxModel: conversationViewModel.primaryViewModel().mailboxModel,
					mailModel: conversationViewModel.primaryViewModel().mailModel,
					mailViewerViewModel: conversationViewModel.primaryViewModel(),
					mails: [conversationViewModel.primaryMail],
				})
				return m(BackgroundColumnLayout, {
					backgroundColor: theme.navigation_bg,
					desktopToolbar: () => m(DesktopViewerToolbar, actions),
					mobileHeader: () =>
						m(MobileHeader, {
							...header,
							backAction: () => this.viewSlider.focusPreviousColumn(),
							columnType: "other",
							title: getConversationTitle(conversationViewModel),
							actions: null,
							multicolumnActions: () => actions,
							primaryAction: () => this.renderHeaderRightView(),
						}),
					columnLayout: m(ConversationViewer, {
						// Re-create the whole viewer and its vnode tree if email has changed
						key: getElementId(conversationViewModel.primaryMail),
						viewModel: conversationViewModel,
						delayBodyRendering: Promise.resolve(),
					}),
				})
			}
		} else if (getCurrentSearchMode() === SearchCategoryTypes.calendar) {
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
		} else {
			return m(
				".flex.col.fill-absolute",
				// Using contactViewToolbar because it will display empty
				m(ContactViewerActions, { contacts: [], onExport: noOp, onMerge: noOp, onDelete: noOp, onEdit: noOp }),
				m(
					".flex-grow.rel.overflow-hidden",
					m(ColumnEmptyMessageBox, {
						message: () => lang.get("noSelection_msg"),
						color: theme.content_message_bg,
						backgroundColor: theme.navigation_bg,
					}),
				),
			)
		}
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

	view({ attrs }: Vnode<SearchViewAttrs>): Children {
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
				bottomNav: this.renderBottomNav(),
			}),
		)
	}

	private renderBottomNav() {
		if (!styles.isSingleColumnLayout()) return m(BottomNav)

		const isInMultiselect = this.searchViewModel.listModel?.state.inMultiselect ?? false

		if (this.viewSlider.focusedColumn === this.resultDetailsColumn && this.searchViewModel.conversationViewModel) {
			return m(MobileMailActionBar, { viewModel: this.searchViewModel.conversationViewModel?.primaryViewModel() })
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
				return m(MobileMailMultiselectionActionBar, {
					mails: this.searchViewModel.getSelectedMails(),
					selectNone: () => this.searchViewModel.listModel.selectNone(),
					mailModel: mailLocator.mailModel,
					mailboxModel: locator.mailboxModel,
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

	private searchBarPlaceholder() {
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
			const folderStructures = mailLocator.mailModel.folders()
			const mailboxIndex = mailboxes.indexOf(mailbox)
			const mailFolders = folderStructures[assertNotNull(mailbox.mailbox.folders)._id].getIndentedList()
			for (const folderInfo of mailFolders) {
				if (folderInfo.folder.folderType !== MailSetKind.SPAM) {
					const mailboxLabel = mailboxIndex === 0 ? "" : ` (${getGroupInfoDisplayName(mailbox.mailGroupInfo)})`
					const folderId = folderInfo.folder.isMailSet ? getElementId(folderInfo.folder) : folderInfo.folder.mails
					availableMailFolders.push({
						name: getIndentedFolderNameForDropdown(folderInfo) + mailboxLabel,
						value: folderId,
					})
				}
			}
		}
		return availableMailFolders
	}

	private renderMailFilterSection(): Children {
		const availableMailFolders = this.getAvailableMailFolders()
		const availableMailFields = SEARCH_MAIL_FIELDS.map((f) => ({ name: lang.get(f.textId), value: f.field }))
		return [
			this.renderMailTimeRangeField(),
			m("div.mlr-button", [
				m(DropDownSelector, {
					label: "field_label",
					items: availableMailFields,
					selectedValue: this.searchViewModel.selectedMailField,
					selectionChangedHandler: async (newValue: string | null) => {
						const result = await this.searchViewModel.setSelectedField(newValue)
						if (result === PaidFunctionResult.PaidSubscriptionNeeded) {
							showNotAvailableForFreeDialog()
						} else {
							this.searchAgain()
						}
					},
					dropdownWidth: 250,
				}),
				availableMailFolders.length > 0
					? m(DropDownSelector, {
							label: "mailFolder_label",
							items: availableMailFolders,
							selectedValue: this.searchViewModel.selectedMailFolder[0] ?? null,
							selectionChangedHandler: (newValue: string | null) => {
								const result = this.searchViewModel.selectMailFolder(newValue ? [newValue] : [])
								if (result === PaidFunctionResult.PaidSubscriptionNeeded) {
									showNotAvailableForFreeDialog()
								} else {
									this.searchAgain()
								}
							},
							dropdownWidth: 250,
					  })
					: null,
			]),
		].map((row) => m(".folder-row.plr-button.content-fg", row))
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
		const restriction = this.searchViewModel.getRestriction()

		if (styles.isUsingBottomNavigation()) {
			if (isSameTypeRef(restriction.type, MailTypeRef) && isNewMailActionAvailable()) {
				return m(IconButton, {
					click: () => {
						newMailEditor()
							.then((editor) => editor.show())
							.catch(ofClass(PermissionError, noOp))
					},
					title: "newMail_action",
					icon: Icons.PencilSquare,
				})
			} else if (isSameTypeRef(restriction.type, ContactTypeRef)) {
				return m(IconButton, {
					click: () => {
						locator.contactModel.getContactListId().then((contactListId) => {
							new ContactEditor(locator.entityClient, null, assertNotNull(contactListId)).show()
						})
					},
					title: "newContact_action",
					icon: Icons.Add,
				})
			} else if (isSameTypeRef(restriction.type, CalendarEventTypeRef)) {
				return m(IconButton, {
					click: () => this.createNewEventDialog(),
					title: "newEvent_action",
					icon: Icons.Add,
				})
			}
		}
	}

	private renderMailTimeRangeField(): Children {
		let end: string
		let start: string

		if (locator.logins.getUserController().isFreeAccount()) {
			end = lang.get("today_label")
			start = formatDateWithMonth(getFreeSearchStartDate())
		} else {
			if (this.searchViewModel.endDate) {
				end = formatDateWithTimeIfNotEven(this.searchViewModel.endDate)
			} else {
				end = lang.get("today_label")
			}

			if (this.searchViewModel.startDate) {
				start = formatDateWithTimeIfNotEven(this.searchViewModel.startDate)
			} else {
				let currentIndexDate = this.searchViewModel.getCurrentMailIndexDate()

				if (currentIndexDate) {
					if (isSameDay(currentIndexDate, new Date())) {
						start = lang.get("today_label")
					} else {
						start = formatDateWithTimeIfNotEven(currentIndexDate)
					}
				} else {
					start = lang.get("unlimited_label")
				}
			}
		}

		const timeDisplayValue = start + " - " + end
		return m(TextField, {
			label: "periodOfTime_label",
			value: timeDisplayValue,
			isReadOnly: true,
			class: "plr-button",
			injectionsRight: () =>
				m(IconButton, {
					title: "selectPeriodOfTime_label",
					click: () => this.handleTimeSelectionClick(),
					icon: Icons.Edit,
					size: ButtonSize.Compact,
				}),
		})
	}

	private async handleTimeSelectionClick(): Promise<void> {
		if (this.searchViewModel.canSelectTimePeriod()) {
			const period = await showDateRangeSelectionDialog(
				this.searchViewModel.getStartOfTheWeekOffset(),
				this.searchViewModel.startDate ?? this.searchViewModel.getCurrentMailIndexDate() ?? new Date(),
				this.searchViewModel.endDate ?? new Date(),
				(startDate, endDate) => {
					if (endDate != null && endDate.getTime() > Date.now()) {
						return lang.get("includesFuture_msg")
					} else if ((startDate?.getTime() ?? -Infinity) > (endDate?.getTime() ?? Infinity)) {
						return lang.get("startAfterEnd_label")
					}
					return null
				},
			)
			const result = await this.searchViewModel.selectTimePeriod(period)
			if (result === PaidFunctionResult.PaidSubscriptionNeeded) {
				await showNotAvailableForFreeDialog()
			} else {
				this.searchAgain()
			}
		} else {
			await showNotAvailableForFreeDialog()
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

							this.searchViewModel.searchAgain(async () => true)
						} else {
							await showNotAvailableForFreeDialog()
						}
					},
					icon: Icons.Edit,
					size: ButtonSize.Compact,
				}),
		})
	}

	private searchAgain() {
		this.searchViewModel.searchAgain(() => this.confirmSearch())
	}

	private confirmSearch() {
		return Dialog.confirm("continueSearchMailbox_msg", "search_label")
	}

	private readonly shortcuts = lazyMemoized<ReadonlyArray<Shortcut>>(() => [
		...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.searchViewModel.listModel),
		{
			key: Keys.N,
			exec: () => {
				const type = this.searchViewModel.searchedType

				if (isSameTypeRef(type, MailTypeRef)) {
					newMailEditor()
						.then((editor) => editor.show())
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
			exec: () => this.deleteSelected(),
			help: "delete_action",
		},
		{
			key: Keys.BACKSPACE,
			exec: () => this.deleteSelected(),
			help: "delete_action",
		},
		{
			key: Keys.A,
			exec: () => this.archiveSelected(),
			help: "archive_action",
			enabled: () => getCurrentSearchMode() === SearchCategoryTypes.mail,
		},
		{
			key: Keys.I,
			exec: () => this.moveSelectedToInbox(),
			help: "moveToInbox_action",
			enabled: () => getCurrentSearchMode() === SearchCategoryTypes.mail,
		},
		{
			key: Keys.V,
			exec: () => this.move(),
			help: "move_action",
			enabled: () => getCurrentSearchMode() === SearchCategoryTypes.mail,
		},
		{
			key: Keys.U,
			exec: () => this.toggleUnreadStatus(),
			help: "toggleUnread_action",
			enabled: () => getCurrentSearchMode() === SearchCategoryTypes.mail,
		},
	])

	async onNewUrl(args: Record<string, any>, requestedPath: string) {
		// calling init here too because this is called very early in the lifecycle and onNewUrl won't work properly if init is called
		// afterwords
		await this.searchViewModel.init()
		this.searchViewModel.onNewUrl(args, requestedPath)
		if (
			isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef) &&
			styles.isSingleColumnLayout() &&
			!args.id &&
			this.viewSlider.focusedColumn === this.resultDetailsColumn
		) {
			this.viewSlider.focusPreviousColumn()
		}
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
						.then((editor) => editor.show())
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
		const lazyCalendarInfo = this.searchViewModel.getLazyCalendarInfos()
		const calendarInfos = lazyCalendarInfo.isLoaded() ? lazyCalendarInfo.getSync() : lazyCalendarInfo.getAsync()

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

	private archiveSelected(): void {
		const selectedMails = this.searchViewModel.getSelectedMails()

		if (selectedMails.length > 0) {
			if (selectedMails.length > 1) {
				this.searchViewModel.listModel.selectNone()
			}

			archiveMails(selectedMails)
		}
	}

	private moveSelectedToInbox(): void {
		const selectedMails = this.searchViewModel.getSelectedMails()

		if (selectedMails.length > 0) {
			if (selectedMails.length > 1) {
				this.searchViewModel.listModel.selectNone()
			}

			moveToInbox(selectedMails)
		}
	}

	private move() {
		const selectedMails = this.searchViewModel.getSelectedMails()

		if (selectedMails.length > 0) {
			showMoveMailsDropdown(locator.mailboxModel, mailLocator.mailModel, getMoveMailBounds(), selectedMails, {
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
			mailLocator.mailModel.markMails(selectedMails, !selectedMails[0].unread)
		}
	}

	private deleteSelected(): void {
		if (this.searchViewModel.listModel.state.selectedItems.size > 0) {
			if (isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef)) {
				const selected = this.searchViewModel.getSelectedMails()
				showDeleteConfirmationDialog(selected).then((confirmed) => {
					if (confirmed) {
						if (selected.length > 1) {
							// is needed for correct selection behavior on mobile
							this.searchViewModel.listModel.selectNone()
						}

						mailLocator.mailModel.deleteMails(selected)
					}
				})
			} else if (isSameTypeRef(this.searchViewModel.searchedType, ContactTypeRef)) {
				Dialog.confirm("deleteContacts_msg").then((confirmed) => {
					const selected = this.searchViewModel.getSelectedContacts()
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
		}
	}

	private renderFilterButton(): Children {
		return m(MailFilterButton, { filter: this.searchViewModel.mailFilter, setFilter: (filter) => this.searchViewModel.setMailFilter(filter) })
	}

	private renderCalendarFilter(): Children {
		if (this.searchViewModel.getLazyCalendarInfos().isLoaded()) {
			const calendarInfos = this.searchViewModel.getLazyCalendarInfos().getSync() ?? []

			// Load user's calendar list
			const items = Array.from(calendarInfos.values()).map((ci) => ({
				name: getSharedGroupName(ci.groupInfo, locator.logins.getUserController(), true),
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
						this.searchViewModel.searchAgain(async () => true)
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
					this.searchViewModel.searchAgain(async () => true)
				},
			} satisfies CheckboxAttrs),
		)
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

async function newMailEditor(): Promise<Dialog> {
	const [mailboxDetails, { newMailEditor }] = await Promise.all([locator.mailboxModel.getUserMailboxDetails(), import("../../mail/editor/MailEditor")])
	return newMailEditor(mailboxDetails)
}
