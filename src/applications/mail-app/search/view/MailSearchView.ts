import { BaseTopLevelView } from "../../../../ui/BaseTopLevelView"
import m, { Children, Vnode } from "mithril"
import { TopLevelAttrs, TopLevelView } from "../../../../ui/base/TopLevelView"
import { ColumnType, ViewColumn } from "../../../../ui/base/ViewColumn"
import { ViewSlider } from "../../../../ui/nav/ViewSlider"
import { FolderColumnView } from "../../../common/gui/FolderColumnView"
import { SidebarSection } from "../../../../ui/SidebarSection"
import { layout_size, px } from "../../../../ui/size"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { styles } from "../../../../ui/styles"
import { isNewMailActionAvailable } from "../../../common/gui/nav/NavFunctions"
import { assertNotNull, first, isEmpty, isNotEmpty, isSameDayOfDate, noOp, ofClass, setDifference } from "@tutao/utils"
import { PermissionError } from "../../../common/api/common/error/PermissionError"
import { Dialog } from "../../../../ui/base/Dialog"
import { locator } from "../../../common/api/main/CommonLocator"
import { isApp, isBrowser, Keys, ProgrammingError, UpgradePromptType } from "@tutao/app-env"
import { InfoLink, lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { Card } from "../../../../ui/base/Card"
import { ClickHandler } from "../../../../ui/base/GuiUtils"
import { BackgroundColumnLayout } from "../../../../ui/BackgroundColumnLayout"
import { theme } from "../../../../ui/theme"
import { DesktopListToolbar, DesktopViewerToolbar } from "../../../../ui/DesktopToolbars"
import { selectionAttrsForList } from "../../../common/misc/ListModel"
import { deviceConfig } from "../../../common/misc/DeviceConfig"
import { AppHeaderAttrs, Header } from "../../../../ui/Header"
import { MailSearchViewModel } from "./MailSearchViewModel"
import { MultiselectMobileHeader } from "../../../../ui/MultiselectMobileHeader"
import { getMailSelectionMessage, MultiItemViewer } from "../../mail/view/MultiItemViewer"
import { EnterMultiselectIconButton } from "../../../../ui/EnterMultiselectIconButton"
import { BaseMobileHeader } from "../../../../ui/BaseMobileHeader"
import { IconButton } from "../../../../ui/base/IconButton"
import { Icons } from "../../../../ui/base/icons/Icons"
import { MAIL_PREFIX } from "../../../../ui/utils/RouteChange"
import { ProgressBar } from "../../../../ui/base/ProgressBar"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../../../ui/base/BaseSearchBar"
import { isKeyPressed } from "../../../../ui/utils/KeyManager"
import { SearchListView, SearchListViewAttrs } from "./SearchListView"
import { getElementId, getIds, isSameId, isSameTypeRef } from "@tutao/meta"
import { Mail, MailTypeRef } from "@tutao/entities/tutanota"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import { MailViewerActions } from "../../mail/view/MailViewerToolbar"
import { MobileHeader } from "../../../../ui/MobileHeader"
import { editDraft, getMailViewerMoreActions, MailFilterType, showReportPhishingMailDialog, startExport } from "../../mail/view/MailViewerUtils"
import {
	getConversationTitle,
	LabelsPopupOpts,
	promptAndDeleteMails,
	showLabelsPopup,
	showMoveMailsDropdown,
	ShowMoveMailsDropdownOpts,
	simpleMoveToSystemFolder,
	trashMails,
} from "../../mail/view/MailGuiUtils"
import { ConversationViewer } from "../../mail/view/ConversationViewer"
import { MailViewerViewModel } from "../../mail/view/MailViewerViewModel"
import { MoveMode } from "../../mail/model/MailModel"
import { mailLocator } from "../../mailLocator"
import { isDraft, isMailMovable } from "../../mail/model/MailChecks"
import { UndoModel } from "../../UndoModel"
import { PosRect } from "../../../../ui/utils/PosRect"
import { allInSameMailbox, getIndentedFolderNameForDropdown } from "../../mail/model/MailUtils"
import { ConversationViewModel } from "../../mail/view/ConversationViewModel"
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import { MailReportType, MailSetKind } from "../../../../entities/tutanota/Utils"
import { LockedError } from "@tutao/rest-client/error"
import { ContactModel } from "../../../common/contactsFunctionality/ContactModel"
import { windowFacade } from "../../../common/misc/WindowFacade"
import { SelectAllCheckbox } from "../../../../ui/SelectAllCheckbox"
import { renderHeaderButtons } from "../../../calendar-app/gui/HeaderButtons"
import { BottomNav } from "../../gui/BottomNav"
import { MobileMailActionBar } from "../../mail/view/MobileMailActionBar"
import { MobileMailMultiselectionActionBar } from "../../mail/view/MobileMailMultiselectionActionBar"
import { FilterChip } from "../../../../ui/base/FilterChip"
import { formatDate } from "../../../../ui/utils/Formatter"
import { createDropdown } from "../../../../ui/base/Dropdown"
import { SEARCH_MAIL_FIELDS } from "../model/SearchUtils"
import { SelectorItem } from "../../../../ui/base/DropDownSelector"
import { getGroupInfoDisplayName } from "../../../../platform-kit/network/GroupUtils"
import { AllIcons } from "../../../../ui/base/Icon"
import { showNotAvailableForFreeDialog } from "../../../common/misc/SubscriptionDialogs"
import { showDateRangeSelectionDialog } from "../../../calendar-app/calendar/gui/pickers/DatePickerDialog"

export interface MailSearchViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	undoModel: UndoModel
	contactModel: ContactModel
	makeViewModel: () => MailSearchViewModel
}
export class MailSearchView extends BaseTopLevelView implements TopLevelView<MailSearchViewAttrs> {
	private readonly resultListColumn: ViewColumn
	private readonly resultDetailsColumn: ViewColumn
	private readonly folderColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	private readonly searchViewModel: MailSearchViewModel
	private readonly contactModel: ContactModel
	private readonly undoModel: UndoModel
	private startOfTheWeekOffset: number

	constructor(vnode: Vnode<MailSearchViewAttrs>) {
		super()
		this.searchViewModel = vnode.attrs.makeViewModel()
		this.undoModel = vnode.attrs.undoModel
		this.contactModel = vnode.attrs.contactModel
		this.startOfTheWeekOffset = this.searchViewModel.getStartOfTheWeekOffset()
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
						desktopToolbar: () =>
							m(DesktopListToolbar, [
								this.searchViewModel.listModel
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
				minWidth: layout_size.second_col_min_width,
				maxWidth: deviceConfig.getMailListSize(this.searchViewModel.getUserId()) ?? layout_size.second_col_max_width,
				headerCenter: "searchResult_label",
				resizeCallback: (size) => {
					deviceConfig.setMailListSize(this.searchViewModel.getUserId(), size)
				},
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
		this.viewSlider = new ViewSlider([this.folderColumn, this.resultListColumn, this.resultDetailsColumn], windowFacade)
	}

	private getResultColumnLayout() {
		return m(".flex.col.fill-absolute", [
			styles.isDesktopLayout() ? null : this.renderFilterBar(),
			m(
				".rel.flex-grow",
				m(SearchListView, {
					listModel: this.searchViewModel.listModel,
					currentType: SearchCategoryType.mail,
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
					availableCalendars: [],
					indexStateStream: this.searchViewModel.getSearchIndexStateStream(),
					currentStartDate: this.searchViewModel.startDate,
					extendSearchResult: (extendDate: Date) => {
						void this.searchViewModel.selectStartDate(extendDate)
					},
				} satisfies SearchListViewAttrs),
			),
		])
	}

	private getMainButton(): {
		label: TranslationKey
		click: ClickHandler
	} | null {
		if (styles.isUsingBottomNavigation()) {
			return null
		} else {
			if (isNewMailActionAvailable()) {
				return {
					click: () => {
						newMailEditor()
							.then((editor) => editor?.show())
							.catch(ofClass(PermissionError, noOp))
					},
					label: "newMail_action",
				}
			} else return null
		}
	}
	private renderFilterBar(): Children {
		return m(".flex.gap-8.pl-16.pr-16.pt-8.pb-8.scroll-x", this.renderFilterChips())
	}
	private renderFilterChips(): Children {
		const availableMailFolders = this.getAvailableMailFolders()
		const selectedFolder = first(this.searchViewModel.selectedMailFolder)
		return [
			this.renderCategoryChip("emails_label", Icons.MailFilled),
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
				const mailboxLabel = mailboxIndex === 0 ? "" : ` (${getGroupInfoDisplayName(mailbox.mailGroupInfo)})`
				const folderId = getElementId(folderInfo.folder)
				availableMailFolders.push({
					name: getIndentedFolderNameForDropdown(folderInfo) + mailboxLabel,
					value: folderId,
				})
			}
		}
		return availableMailFolders
	}

	private renderMobileListHeader(header: AppHeaderAttrs): Children {
		return this.searchViewModel.listModel && this.searchViewModel.listModel.state.inMultiselect
			? this.renderMultiSelectMobileHeader()
			: this.renderMobileListActionsHeader(header)
	}

	private renderMultiSelectMobileHeader(): Children {
		return m(MultiselectMobileHeader, {
			...selectionAttrsForList(this.searchViewModel.listModel),
			message: getMailSelectionMessage(this.searchViewModel.getSelectedMails()),
		})
	}
	private renderMobileListActionsHeader(header: AppHeaderAttrs): Children {
		const rightActions: Children[] = []
		rightActions.push(
			m(EnterMultiselectIconButton, {
				clickAction: () => {
					this.searchViewModel.listModel.enterMultiselect()
				},
			}),
		)

		return m(BaseMobileHeader, {
			left: !styles.isMobileDesktopLayout()
				? m(
						".icon-button",
						m(IconButton, {
							title: "back_action",
							icon: Icons.ChevronLeft,
							click: () => {
								m.route.set(MAIL_PREFIX)
							},
						}),
					)
				: m(".ml-8"),
			right: rightActions,
			center: m(
				".flex-grow.flex.justify-center",
				{
					class: rightActions.length === 0 ? "mr-12" : "",
				},
				this.renderSearchbar(),
			),
			injections: m(ProgressBar, { progress: header.offlineIndicatorModel.getProgress() }),
		})
	}
	private renderSearchbar() {
		return m(
			// form wrapper to isolate the search input and prevent it from being autofilled when unrelated buttons are clicked on chrome
			// this is done because chrome doesn't appear to respect `autocomplete="off"` and will autofill the field anyway
			"form.full-width",
			{
				style: {
					maxWidth: styles.isUsingBottomNavigation() ? "" : px(layout_size.second_col_max_width + 50),
				},
				onsubmit: (e: SubmitEvent) => {
					e.stopPropagation()
					e.preventDefault()
				},
			},
			m(BaseSearchBar, {
				placeholder: lang.get("searchEmails_placeholder"),
				text: this.searchViewModel.getCurrenQuery(),
				busy: this.searchViewModel.busy,
				onInput: (text: string) => {
					this.searchViewModel.onSearchQueryUpdated(text)
				},
				onKeyDown: (e) => {
					e.stopPropagation()
					if (isKeyPressed(e.key, Keys.RETURN)) {
						e.preventDefault()
					}
				},
				onClear: () => this.searchViewModel.onSearchQueryUpdated(""),
			} satisfies BaseSearchBarAttrs),
		)
	}

	private renderAppPromo(): Children {
		const searchText = renderSearchInOurApps()
		if (searchText == null) {
			return null
		}
		return m("div.ml-8.mt-12.small.plr-8.content-fg.mb-16", m(Card, searchText))
	}
	protected async onNewUrl(args: Record<string, any>, requestedPath: string) {
		await this.searchViewModel.init()
		this.searchViewModel.onNewUrl(args, requestedPath)
		m.redraw()
	}
	view({ attrs }: Vnode<MailSearchViewAttrs>): Children {
		return m(
			"#search.main-view",
			m(this.viewSlider, {
				header: m(Header, {
					firstColWidth: this.folderColumn.width,
					searchBar: () => this.renderSearchbar(),
					...attrs.header,
					buttons: renderHeaderButtons(),
				}),
				bottomNav: this.renderBottomNav(),
			}),
		)
	}
	oncreate() {
		this.searchViewModel.init()
	}
	onremove() {
		this.searchViewModel.dispose()
	}
	private renderDetailsView(header: AppHeaderAttrs) {
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
				reportNotSpamAction: null,
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
							: this.searchViewModel.listModel.isLoadedCompletely() || this.searchViewModel.isIndexingMails()
								? "none"
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
					reapplyInboxRules: null,
					reportSpam: this.getSingleMailReportNotSpamAction(conversationViewModel.primaryViewModel()),
					reportNotSpam: this.getSingleMailReportNotSpamAction(conversationViewModel.primaryViewModel()),
					reportPhishing: this.getSingleMailPhishingAction(conversationViewModel.primaryViewModel()),
				}),
				reportSpamAction: this.getReportSelectedMailsSpamAction(),
				reportNotSpamAction: null,
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
							trash: mailViewerModel.isMovableMail()
								? () => {
										trashMails(mailViewerModel.mailboxModel, mailViewerModel.mailModel, this.undoModel, [mailViewerModel.mail])
									}
								: null,
							delete: mailViewerModel.isDeletingMailAllowed()
								? () => promptAndDeleteMails(mailViewerModel.mailModel, [mailViewerModel.mail._id], null, noOp)
								: null,
							move: mailViewerModel.isMovableMail()
								? (dom) => {
										showMoveMailsDropdown(
											mailViewerModel.mailboxModel,
											mailViewerModel.mailModel,
											this.undoModel,
											dom.getBoundingClientRect(),
											[mailViewerModel.mail],
											MoveMode.Mails,
											mailLocator.contactModel,
										)
									}
								: null,
						}
					},
					moreActions: (mailViewerModel) => {
						return getMailViewerMoreActions({
							viewModel: mailViewerModel,
							print: this.getPrintAction(),
							reapplyInboxRules: null,
							reportSpam: this.getSingleMailSpamAction(mailViewerModel),
							reportNotSpam: this.getSingleMailReportNotSpamAction(mailViewerModel),
							reportPhishing: this.getSingleMailPhishingAction(mailViewerModel),
						})
					},
				}),
			})
		}
	}

	private getDeleteAndTrashActions() {
		const selected = this.searchViewModel.getSelectedMails()
		const deletable = this.searchViewModel.isPermanentDeleteAllowed()

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
				trashAction: selected.some((mail) => isMailMovable(mail, mailLocator.mailModel))
					? () => {
							trashMails(mailLocator.mailboxModel, mailLocator.mailModel, this.undoModel, selected)
						}
					: null,
			}
		}
	}

	private getMoveMailsAction(): ((origin: PosRect, opts?: ShowMoveMailsDropdownOpts) => void) | null {
		const selection = this.searchViewModel.getSelectedMails()
		return selection.some((mail) => isMailMovable(mail, mailLocator.mailModel))
			? (origin, opts) =>
					showMoveMailsDropdown(
						mailLocator.mailboxModel,
						mailLocator.mailModel,
						this.undoModel,
						origin,
						selection,
						MoveMode.Mails,
						mailLocator.contactModel,
					)
			: null
	}

	private getSingleMailReportNotSpamAction(viewModel: MailViewerViewModel): (() => void) | null {
		return viewModel.canReportNotSpam() ? () => viewModel.reportNotSpamForMail() : null
	}

	private getSingleMailPhishingAction(viewModel: MailViewerViewModel): (() => void) | null {
		return viewModel.canReportPhishing()
			? () => {
					showReportPhishingMailDialog(async () => this.reportSingleMail(viewModel, MailReportType.PHISHING))
				}
			: null
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

	private getUnreadState(): boolean {
		const selection = this.searchViewModel.getSelectedMails()
		return first(selection)?.unread ?? false
	}

	private getEditDraftAction(): (() => void) | null {
		// conversationViewModel is not there if we are in multiselect or if nothing is selected
		const conversationViewModel = this.searchViewModel.conversationViewModel
		if (conversationViewModel != null && conversationViewModel.primaryViewModel().isEditableDraft()) {
			return () => editDraft(conversationViewModel.primaryViewModel())
		} else {
			return null
		}
	}

	private getUnscheduleAction(): (() => void) | null {
		// conversationViewModel is not there if we are in multiselect or if nothing is selected
		const conversationViewModel = this.searchViewModel.conversationViewModel
		if (conversationViewModel != null && conversationViewModel.primaryViewModel().isScheduled()) {
			return () => mailLocator.mailModel.unscheduleMail(conversationViewModel.primaryMail)
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

	private getReplyAction(conversationViewModel: ConversationViewModel, replyAll: boolean): (() => void) | null {
		const viewModel = conversationViewModel.primaryViewModel()

		const canReply = replyAll ? viewModel.canReplyAll() : viewModel.canReply()
		if (canReply) {
			return () => viewModel.reply(replyAll)
		} else {
			return null
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

	private getPrintAction(): (() => unknown) | null {
		if (isApp()) {
			return () => locator.systemFacade.print()
		} else if (typeof window.print === "function") {
			return () => window.print()
		} else {
			return null
		}
	}

	private getSingleMailSpamAction(viewModel: MailViewerViewModel): (() => void) | null {
		return viewModel.canReportSpam() ? () => this.reportSingleMail(viewModel, MailReportType.SPAM) : null
	}

	private reportSingleMail(viewModel: MailViewerViewModel, reportType: MailReportType): void {
		viewModel
			.reportSpamForMail(reportType)
			.catch(ofClass(LockedError, () => Dialog.message("operationStillActive_msg")))
			.finally(m.redraw)
	}
	private getReportSelectedMailsSpamAction(): (() => unknown) | null {
		const selectedMails = this.searchViewModel.getSelectedMails()
		return selectedMails.every(isDraft)
			? null
			: () => {
					simpleMoveToSystemFolder(
						mailLocator.mailboxModel,
						mailLocator.mailModel,
						this.undoModel,
						MailSetKind.SPAM,
						selectedMails,
						this.contactModel,
					)
				}
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
				unscheduleMailAction: this.getUnscheduleAction(),
				exportAction: this.getExportAction(),
				replyAction: this.getReplyAction(conversationViewModel, false),
				replyAllAction: this.getReplyAction(conversationViewModel, true),
				forwardAction: this.getForwardAction(conversationViewModel),
				mailViewerMoreActions: getMailViewerMoreActions({
					viewModel: conversationViewModel.primaryViewModel(),
					print: this.getPrintAction(),
					reapplyInboxRules: null,
					reportSpam: this.getSingleMailSpamAction(conversationViewModel.primaryViewModel()),
					reportNotSpam: this.getSingleMailSpamAction(conversationViewModel.primaryViewModel()),
					reportPhishing: this.getSingleMailPhishingAction(conversationViewModel.primaryViewModel()),
				}),
				reportNotSpamAction: null,
			})
		} else if (isInMultiselect) {
			const { deleteAction, trashAction } = this.getDeleteAndTrashActions()
			return m(MobileMailMultiselectionActionBar, {
				selectNone: () => this.searchViewModel.listModel.selectNone(),
				deleteMailsAction: deleteAction,
				trashMailsAction: trashAction,
				moveMailsAction: this.getMoveMailsAction(),
				applyLabelsAction: this.getLabelsAction(),
				setUnreadStateAction: (unread) => this.setUnreadState(unread),
			})
		} else return m(BottomNav)
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

	private async onMailDateRangeSelect() {
		if (!this.searchViewModel.canSelectTimePeriod()) {
			showNotAvailableForFreeDialog(UpgradePromptType.EXTEND_MAIL_SEARCH_RANGE)
		} else {
			const { start, end } = await showDateRangeSelectionDialog({
				start: this.searchViewModel.startDate,
				end: this.searchViewModel.endDate,
				startOfTheWeekOffset: this.startOfTheWeekOffset,
				optionalStartDate: true,
				dateValidator: (startDate, endDate) => {
					switch (this.searchViewModel.checkDates(startDate, endDate)) {
						case "extendIndex":
							return lang.getTranslationText("continueSearchMailbox_msg")
						case "startafterend":
							return lang.getTranslationText("startAfterEnd_label")
						case "long":
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
