import m, { Children, Vnode } from "mithril"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider.js"
import { ColumnType, ViewColumn } from "../../../common/gui/base/ViewColumn"
import type { MaybeTranslation, TranslationKey } from "../../../common/misc/LanguageViewModel"
import { lang } from "../../../common/misc/LanguageViewModel"
import { FeatureType, Keys, MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { keyManager, Shortcut } from "../../../common/misc/KeyManager"
import { NavButton, NavButtonColor } from "../../../common/gui/base/NavButton.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { SearchListView, SearchListViewAttrs } from "./SearchListView"
import { px, size } from "../../../common/gui/size"
import { SEARCH_MAIL_FIELDS, SearchCategoryTypes } from "../model/SearchUtils"
import { Dialog } from "../../../common/gui/base/Dialog"
import { locator } from "../../../common/api/main/CommonLocator"
import {
	assertNotNull,
	first,
	getFirstOrThrow,
	isEmpty,
	isSameTypeRef,
	last,
	LazyLoaded,
	lazyMemoized,
	memoized,
	noOp,
	ofClass,
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
import { DropDownSelector, DropDownSelectorAttrs, SelectorItem } from "../../../common/gui/base/DropDownSelector.js"
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
import { MobileHeader, MobileHeaderMenuButton } from "../../../common/gui/MobileHeader.js"
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
	simpleMoveToArchive,
	simpleMoveToInbox,
	trashMails,
} from "../../mail/view/MailGuiUtils.js"
import { SelectAllCheckbox } from "../../../common/gui/SelectAllCheckbox.js"
import { selectionAttrsForList } from "../../../common/misc/ListModel.js"
import { MultiselectMobileHeader } from "../../../common/gui/MultiselectMobileHeader.js"
import { MultiselectMode } from "../../../common/gui/base/List.js"
import { PaidFunctionResult, SearchViewModel } from "./SearchViewModel.js"
import { NotFoundError } from "../../../common/api/common/error/RestError.js"
import { showNotAvailableForFreeDialog } from "../../../common/misc/SubscriptionDialogs.js"
import { MailFilterButton } from "../../mail/view/MailFilterButton.js"
import { listSelectionKeyboardShortcuts } from "../../../common/gui/base/ListUtils.js"
import { getElementId, getIds, isSameId } from "../../../common/api/common/utils/EntityUtils.js"
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
import { EventEditorDialog } from "../../../calendar-app/calendar/gui/eventeditor-view/CalendarEventEditDialog.js"
import { getSharedGroupName } from "../../../common/sharing/GroupUtils.js"
import { BottomNav } from "../../gui/BottomNav.js"
import { mailLocator } from "../../mailLocator.js"
import { allInSameMailbox, getIndentedFolderNameForDropdown } from "../../mail/model/MailUtils.js"
import { ContactModel } from "../../../common/contactsFunctionality/ContactModel.js"
import { extractContactIdFromEvent, isBirthdayEvent } from "../../../common/calendar/date/CalendarUtils.js"
import { DatePicker, DatePickerAttrs } from "../../../calendar-app/calendar/gui/pickers/DatePicker.js"
import { PosRect } from "../../../common/gui/base/Dropdown"
import { editDraft, getMailViewerMoreActions, startExport } from "../../mail/view/MailViewerUtils"
import { isDraft } from "../../mail/model/MailChecks"
import { ConversationViewModel } from "../../mail/view/ConversationViewModel"
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import { MoveMode } from "../../mail/model/MailModel"

assertMainOrNode()

export interface SearchViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	makeViewModel: () => SearchViewModel
	contactModel: ContactModel
}

export class SearchView extends BaseTopLevelView implements TopLevelView<SearchViewAttrs> {
	private readonly resultListColumn: ViewColumn
	private readonly resultDetailsColumn: ViewColumn
	private readonly folderColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	private readonly searchViewModel: SearchViewModel
	private readonly contactModel: ContactModel
	private readonly startOfTheWeekOffset: number

	private getSanitizedPreviewData: (event: CalendarEvent) => LazyLoaded<CalendarEventPreviewViewModel> = memoized((event: CalendarEvent) =>
		new LazyLoaded(async () => {
			const calendars = await this.searchViewModel.getLazyCalendarInfos().getAsync()
			const eventPreviewModel = await locator.calendarEventPreviewModel(event, calendars)
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
				headerCenter: "search_label",
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
				headerCenter: "searchResult_label",
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
			getLabelsForMail: (mail) => this.searchViewModel.getLabelsForMail(mail),
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
		this.searchViewModel.init(() => this.confirmMailSearch())

		keyManager.registerShortcuts(this.shortcuts())
	}

	onremove(): void {
		this.searchViewModel.dispose()

		keyManager.unregisterShortcuts(this.shortcuts())
	}

	private renderMobileListHeader(header: AppHeaderAttrs) {
		return this.searchViewModel.listModel && this.searchViewModel.listModel.state.inMultiselect
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
						this.searchViewModel.listModel.enterMultiselect()
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
			const isMultiselect = this.searchViewModel.listModel.state.inMultiselect || selectedContacts.length === 0
			return m(BackgroundColumnLayout, {
				backgroundColor: theme.navigation_bg,
				desktopToolbar: () => m(DesktopViewerToolbar, actions),
				mobileHeader: () =>
					m(MobileHeader, {
						...header,
						backAction: () => this.viewSlider.focusPreviousColumn(),
						columnType: "other",
						title: "search_label",
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
					exportAction: this.getExportAction(),
					replyAction: null,
					replyAllAction: null,
					forwardAction: null,
					mailViewerMoreActions: null,
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
					exportAction: this.getExportAction(),
					replyAction: this.getReplyAction(conversationViewModel, false),
					replyAllAction: this.getReplyAction(conversationViewModel, true),
					forwardAction: this.getForwardAction(conversationViewModel),
					mailViewerMoreActions: getMailViewerMoreActions(conversationViewModel.primaryViewModel()),
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
						actionableMailViewerViewModel: () => conversationViewModel.primaryViewModel(),
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
								color: theme.content_message_bg,
								backgroundColor: theme.navigation_bg,
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
						color: theme.content_message_bg,
						backgroundColor: theme.navigation_bg,
					}),
				),
			)
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
		const mails = this.searchViewModel.getSelectedMails()
		if (mails.length !== 1) {
			return null
		}

		const conversationViewModel = assertNotNull(this.searchViewModel.conversationViewModel)
		if (!isDraft(conversationViewModel.primaryMail)) {
			return null
		}

		return () => editDraft(conversationViewModel.primaryViewModel())
	}

	private getMoveMailsAction(): ((origin: PosRect, opts?: ShowMoveMailsDropdownOpts) => void) | null {
		const mailModel = mailLocator.mailModel
		return mailModel.isMovingMailsAllowed() ? (origin) => this.moveMails(origin) : null
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
				editAction: (contact) => {
					new ContactEditor(locator.entityClient, contact).show()
				},
				onWriteMail: writeMail,
				extendedActions: true,
			}),
		)
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
				exportAction: this.getExportAction(),
				replyAction: this.getReplyAction(conversationViewModel, false),
				replyAllAction: this.getReplyAction(conversationViewModel, true),
				forwardAction: this.getForwardAction(conversationViewModel),
				mailViewerMoreActions: getMailViewerMoreActions(conversationViewModel.primaryViewModel()),
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
			mailLocator.mailModel.markMails(
				selection.map(({ _id }) => _id),
				unread,
			)
		}
	}

	private moveMails(origin: PosRect, opts?: ShowMoveMailsDropdownOpts) {
		const selection = this.searchViewModel.getSelectedMails()
		if (!isEmpty(selection)) {
			showMoveMailsDropdown(mailLocator.mailboxModel, mailLocator.mailModel, origin, selection, MoveMode.Mails, opts)
		}
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

	private renderMailFilterSection(): Children {
		const availableMailFolders = this.getAvailableMailFolders()
		const availableMailFields = SEARCH_MAIL_FIELDS.map((f) => ({ name: lang.get(f.textId), value: f.field }))
		return [
			this.renderDateRangeSelection(),
			m("div.ml-button", [
				m(DropDownSelector, {
					label: "field_label",
					items: availableMailFields,
					selectedValue: this.searchViewModel.selectedMailField,
					selectionChangedHandler: (newValue: string | null) => {
						const result = this.searchViewModel.selectMailField(newValue)
						if (result === PaidFunctionResult.PaidSubscriptionNeeded) {
							showNotAvailableForFreeDialog()
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
								}
							},
							dropdownWidth: 250,
					  })
					: null,
			]),
		].map((row) => m(".folder-row.plr-button.content-fg", row))
	}

	private renderCalendarFilterSection(): Children {
		return [this.renderDateRangeSelection(), this.renderCalendarFilter(), this.renderRepeatingFilter()].map((row) =>
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
				".pl-s.flex-grow.flex-space-between.flex-column",
				m(DatePicker, {
					date: this.searchViewModel.startDate ?? undefined,
					onDateSelected: (date) => this.onStartDateSelected(date),
					startOfTheWeekOffset: this.startOfTheWeekOffset,
					label: "dateFrom_label",
					nullSelectionText: renderedHelpText,
					rightAlignDropdown: true,
				} satisfies DatePickerAttrs),
			),
			m(
				".pl-s.flex-grow.flex-space-between.flex-column",
				m(DatePicker, {
					date: this.searchViewModel.endDate,
					onDateSelected: (date) => {
						if (this.searchViewModel.selectEndDate(date) != PaidFunctionResult.Success) {
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

	private async onStartDateSelected(date: Date) {
		if ((await this.searchViewModel.selectStartDate(date)) != PaidFunctionResult.Success) {
			showNotAvailableForFreeDialog()
		}
	}

	private confirmMailSearch() {
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
			const eventEditor = new EventEditorDialog()
			await eventEditor.showNewCalendarEventEditDialog(model)
		}
	}

	private archiveSelected(): void {
		const selectedMails = this.searchViewModel.getSelectedMails()

		if (selectedMails.length > 0) {
			if (selectedMails.length > 1) {
				this.searchViewModel.listModel.selectNone()
			}

			simpleMoveToArchive(getIds(selectedMails))
		}
	}

	private moveSelectedToInbox(): void {
		const selectedMails = this.searchViewModel.getSelectedMails()

		if (selectedMails.length > 0) {
			if (selectedMails.length > 1) {
				this.searchViewModel.listModel.selectNone()
			}

			simpleMoveToInbox(getIds(selectedMails))
		}
	}

	private move() {
		const selectedMails = this.searchViewModel.getSelectedMails()

		if (selectedMails.length > 0) {
			showMoveMailsDropdown(locator.mailboxModel, mailLocator.mailModel, getMoveMailBounds(), selectedMails, MoveMode.Mails, {
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
			mailLocator.mailModel.markMails(
				selectedMails.map((m) => m._id),
				!selectedMails[0].unread,
			)
		}
	}

	private getDeleteAndTrashActions(): { deleteAction: (() => unknown) | null; trashAction: (() => unknown) | null } {
		if (isSameTypeRef(this.searchViewModel.searchedType, MailTypeRef)) {
			const selected = this.searchViewModel.getSelectedMails()
			const deletable = this.searchViewModel.areMailsDeletable()

			if (deletable) {
				return {
					deleteAction: () => {
						promptAndDeleteMails(mailLocator.mailModel, getIds(selected), () => this.searchViewModel.listModel.selectNone())
					},
					trashAction: null,
				}
			} else {
				return {
					deleteAction: null,
					trashAction: () => {
						trashMails(mailLocator.mailModel, getIds(selected))
					},
				}
			}
		} else if (isSameTypeRef(this.searchViewModel.searchedType, ContactTypeRef)) {
			return { deleteAction: () => this.deleteContacts(), trashAction: null }
		} else {
			// Calendar toolbar doesn't have any actions
			return { deleteAction: null, trashAction: null }
		}
	}

	private deleteContacts(): void {
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

	private renderFilterButton(): Children {
		return m(MailFilterButton, {
			filter: this.searchViewModel.mailFilter,
			setFilter: (filter) => this.searchViewModel.setMailFilter(filter),
		})
	}

	private renderCalendarFilter(): Children {
		if (this.searchViewModel.getLazyCalendarInfos().isLoaded() && this.searchViewModel.getUserHasNewPaidPlan().isLoaded()) {
			const calendarInfos = this.searchViewModel.getLazyCalendarInfos().getSync() ?? []

			// Load user's calendar list
			const items: {
				name: string
				value: CalendarInfo | string
			}[] = Array.from(calendarInfos.values()).map((ci) => ({
				name: getSharedGroupName(ci.groupInfo, locator.logins.getUserController(), true),
				value: ci,
			}))

			if (this.searchViewModel.getUserHasNewPaidPlan().getSync()) {
				const localCalendars = this.searchViewModel.getLocalCalendars().map((cal) => ({
					name: cal.name,
					value: cal.id,
				}))

				items.push(...localCalendars)
			}

			// Find the selected value after loading the available calendars
			const selectedValue =
				items.find((calendar) => {
					if (!calendar.value) {
						return
					}

					if (typeof calendar.value === "string") {
						return calendar.value === this.searchViewModel.selectedCalendar
					}

					// It isn't a string, so it can be only a Calendar Info
					const calendarValue = calendar.value
					return isSameId([calendarValue.groupRoot.longEvents, calendarValue.groupRoot.shortEvents], this.searchViewModel.selectedCalendar)
				})?.value ?? null

			return m(
				".ml-button",
				m(DropDownSelector, {
					label: "calendar_label",
					items: [{ name: lang.get("all_label"), value: null }, ...items],
					selectedValue,
					selectionChangedHandler: (value: CalendarInfo | null) => {
						// value can be null if default option has been selected
						this.searchViewModel.selectCalendar(value)
					},
				} satisfies DropDownSelectorAttrs<CalendarInfo | string | null>),
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
					this.searchViewModel.selectIncludeRepeatingEvents(value)
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
