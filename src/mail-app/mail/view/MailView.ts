import m, { Children, Vnode } from "mithril"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider.js"
import { ColumnType, ViewColumn } from "../../../common/gui/base/ViewColumn"
import { lang } from "../../../common/misc/LanguageViewModel"
import { Dialog } from "../../../common/gui/base/Dialog"
import { FeatureType, getMailFolderType, Keys, MailSetKind, SystemFolderType } from "../../../common/api/common/TutanotaConstants"
import { AppHeaderAttrs, Header } from "../../../common/gui/Header.js"
import { Mail, MailBox, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { assertNotNull, first, getFirstOrThrow, isEmpty, isNotEmpty, noOp, ofClass } from "@tutao/tutanota-utils"
import { MailListView } from "./MailListView"
import { assertMainOrNode, isApp } from "../../../common/api/common/Env"
import type { Shortcut } from "../../../common/misc/KeyManager"
import { keyManager } from "../../../common/misc/KeyManager"
import { getMailSelectionMessage, MultiItemViewer } from "./MultiItemViewer.js"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import type { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import { locator } from "../../../common/api/main/CommonLocator"
import { PermissionError } from "../../../common/api/common/error/PermissionError"
import { styles } from "../../../common/gui/styles"
import { px, size } from "../../../common/gui/size"
import {
	getConversationTitle,
	getMoveMailBounds,
	LabelsPopupOpts,
	moveMails,
	moveMailsToSystemFolder,
	promptAndDeleteMails,
	showLabelsPopup,
	ShowMoveMailsDropdownOpts,
	showMoveMailsFromFolderDropdown,
	trashMails,
} from "./MailGuiUtils"
import { getElementId, isSameId } from "../../../common/api/common/utils/EntityUtils"
import { isNewMailActionAvailable } from "../../../common/gui/nav/NavFunctions"
import { CancelledError } from "../../../common/api/common/error/CancelledError"
import Stream from "mithril/stream"
import { readLocalFiles } from "../../../common/file/FileController.js"
import { MobileMailActionBar } from "./MobileMailActionBar.js"
import { deviceConfig } from "../../../common/misc/DeviceConfig.js"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu.js"
import { BaseTopLevelView } from "../../../common/gui/BaseTopLevelView.js"
import { showEditFolderDialog } from "./EditFolderDialog.js"
import { MailFoldersView } from "./MailFoldersView.js"
import { FolderColumnView } from "../../../common/gui/FolderColumnView.js"
import { SidebarSection } from "../../../common/gui/SidebarSection.js"
import { EditFoldersDialog } from "./EditFoldersDialog.js"
import { TopLevelAttrs, TopLevelView } from "../../../TopLevelView.js"
import { ConversationViewModel } from "./ConversationViewModel.js"
import { conversationCardMargin, ConversationViewer } from "./ConversationViewer.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { BackgroundColumnLayout } from "../../../common/gui/BackgroundColumnLayout.js"
import { MailViewerActions } from "./MailViewerToolbar.js"
import { theme } from "../../../common/gui/theme.js"
import { MobileMailMultiselectionActionBar } from "./MobileMailMultiselectionActionBar.js"
import { SelectAllCheckbox } from "../../../common/gui/SelectAllCheckbox.js"
import { DesktopListToolbar, DesktopViewerToolbar } from "../../../common/gui/DesktopToolbars.js"
import { MobileHeader } from "../../../common/gui/MobileHeader.js"
import { LazySearchBar } from "../../LazySearchBar.js"
import { MultiselectMobileHeader } from "../../../common/gui/MultiselectMobileHeader.js"
import { MailViewModel } from "./MailViewModel.js"
import { selectionAttrsForList } from "../../../common/misc/ListModel.js"
import { ListLoadingState, MultiselectMode } from "../../../common/gui/base/List.js"
import { EnterMultiselectIconButton } from "../../../common/gui/EnterMultiselectIconButton.js"
import { MailFilterButton } from "./MailFilterButton.js"
import { listSelectionKeyboardShortcuts } from "../../../common/gui/base/ListUtils.js"
import { getMailboxName } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { BottomNav } from "../../gui/BottomNav.js"
import { mailLocator } from "../../mailLocator.js"
import { showSnackBar } from "../../../common/gui/base/SnackBar.js"
import { getFolderName } from "../model/MailUtils.js"
import { canDoDragAndDropExport, editDraft, getMailViewerMoreActions, MailFilterType, showReportMailDialog, startExport } from "./MailViewerUtils.js"
import { isDraft, isSpamOrTrashFolder } from "../model/MailChecks.js"
import { showEditLabelDialog } from "./EditLabelDialog"
import { SidebarSectionRow } from "../../../common/gui/base/SidebarSectionRow"
import { attachDropdown, PosRect } from "../../../common/gui/base/Dropdown"
import { ButtonSize } from "../../../common/gui/base/ButtonSize"
import { RowButton } from "../../../common/gui/base/buttons/RowButton"
import { getLabelColor } from "../../../common/gui/base/Label.js"
import { MAIL_PREFIX } from "../../../common/misc/RouteChange"
import { DropType, FileDropData, MailDropData } from "../../../common/gui/base/GuiUtils"
import { fileListToArray } from "../../../common/api/common/utils/FileUtils.js"
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import { LockedError } from "../../../common/api/common/error/RestError"
import { MailViewerViewModel } from "./MailViewerViewModel"

assertMainOrNode()

/** State persisted between re-creations. */
export interface MailViewCache {
	/** The preference for if conversation view was used, so we can reset if it was changed */
	conversationViewPreference: boolean | null
}

export interface MailViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	cache: MailViewCache
	header: AppHeaderAttrs
	mailViewModel: MailViewModel
}

/**
 * Top-level view for displaying mailboxes.
 */
export class MailView extends BaseTopLevelView implements TopLevelView<MailViewAttrs> {
	private readonly listColumn: ViewColumn
	private readonly folderColumn: ViewColumn
	private readonly mailColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	cache: MailViewCache
	readonly oncreate: TopLevelView["oncreate"]
	readonly onremove: TopLevelView["onremove"]

	private countersStream: Stream<unknown> | null = null

	private readonly expandedState: Set<Id>
	private readonly mailViewModel: MailViewModel

	get conversationViewModel(): ConversationViewModel | null {
		return this.mailViewModel.getConversationViewModel()
	}

	constructor(vnode: Vnode<MailViewAttrs>) {
		super()
		this.expandedState = new Set(deviceConfig.getExpandedFolders(locator.logins.getUserController().userId))
		this.cache = vnode.attrs.cache
		this.folderColumn = this.createFolderColumn(null, vnode.attrs.drawerAttrs)
		this.mailViewModel = vnode.attrs.mailViewModel

		this.listColumn = new ViewColumn(
			{
				view: () => {
					const folder = this.mailViewModel.getFolder()
					return m(BackgroundColumnLayout, {
						backgroundColor: theme.navigation_bg,
						desktopToolbar: () => m(DesktopListToolbar, m(SelectAllCheckbox, selectionAttrsForList(this.mailViewModel)), this.renderFilterButton()),
						columnLayout: folder
							? m(
									"",
									{
										style: {
											marginBottom: px(conversationCardMargin),
										},
									},
									m(MailListView, {
										key: getElementId(folder),
										mailViewModel: this.mailViewModel,
										onSingleSelection: (mail) => {
											this.mailViewModel.onSingleSelection(mail)
											if (!this.mailViewModel.listModel?.isInMultiselect()) {
												this.viewSlider.focus(this.mailColumn)

												// Make sure that we mark mail as read if you select the mail again, even if it was selected before.
												// Do it in the next even loop to not rely on what is called first, listModel or us. ListModel changes are
												// sync so this should be enough.
												Promise.resolve().then(() => {
													const conversationViewModel = this.mailViewModel.getConversationViewModel()
													if (conversationViewModel && isSameId(mail._id, conversationViewModel.primaryMail._id)) {
														conversationViewModel?.primaryViewModel().setUnread(false)
													}
												})
											}
										},
										onSingleInclusiveSelection: (...args) => {
											this.mailViewModel?.onSingleInclusiveSelection(...args)
										},
										onRangeSelectionTowards: (...args) => {
											this.mailViewModel.onRangeSelectionTowards(...args)
										},
										onSingleExclusiveSelection: (...args) => {
											this.mailViewModel.onSingleExclusiveSelection(...args)
										},
										onClearFolder: async () => {
											const folder = this.mailViewModel.getFolder()
											if (folder == null) {
												console.warn("Cannot delete folder, no folder is selected")
												return
											}
											const confirmed = await Dialog.confirm(
												lang.getTranslation("confirmDeleteFinallySystemFolder_msg", { "{1}": getFolderName(folder) }),
											)
											if (confirmed) {
												showProgressDialog("progressDeleting_msg", this.mailViewModel.finallyDeleteAllMailsInSelectedFolder(folder))
											}
										},
									}),
							  )
							: null,
						mobileHeader: () =>
							this.mailViewModel.listModel?.isInMultiselect()
								? m(MultiselectMobileHeader, {
										...selectionAttrsForList(this.mailViewModel.listModel),
										message: getMailSelectionMessage(this.mailViewModel.listModel.getSelectedAsArray()),
								  })
								: m(MobileHeader, {
										...vnode.attrs.header,
										title: this.listColumn.getTitle(),
										columnType: "first",
										actions: [
											this.renderFilterButton(),
											m(EnterMultiselectIconButton, {
												clickAction: () => {
													this.mailViewModel.listModel?.enterMultiselect()
												},
											}),
										],
										primaryAction: () => this.renderHeaderRightView(),
										backAction: () => this.viewSlider.focusPreviousColumn(),
								  }),
					})
				},
			},
			ColumnType.Background,
			{
				minWidth: size.second_col_min_width,
				maxWidth: size.second_col_max_width,
				headerCenter: () => {
					const folder = this.mailViewModel.getFolder()
					return folder ? lang.makeTranslation("folder_name", getFolderName(folder)) : "emptyString_msg"
				},
			},
		)

		this.mailColumn = new ViewColumn(
			{
				view: () => {
					const viewModel = this.conversationViewModel
					if (viewModel) {
						return this.renderSingleMailViewer(vnode.attrs.header, viewModel)
					} else {
						return this.renderMultiMailViewer(vnode.attrs.header)
					}
				},
			},
			ColumnType.Background,
			{
				minWidth: size.third_col_min_width,
				maxWidth: size.third_col_max_width,
				ariaLabel: () => lang.get("email_label"),
				testId: "mail-area",
			},
		)
		this.viewSlider = new ViewSlider([this.folderColumn, this.listColumn, this.mailColumn])
		this.viewSlider.focusedColumn = this.listColumn

		const shortcuts = this.getShortcuts()
		vnode.attrs.mailViewModel.init()

		this.oncreate = (vnode) => {
			this.countersStream = mailLocator.mailModel.mailboxCounters.map(m.redraw)
			keyManager.registerShortcuts(shortcuts)
			this.cache.conversationViewPreference = deviceConfig.getConversationViewShowOnlySelectedMail()
		}

		this.onremove = () => {
			// cancel the loading if we are destroyed
			this.mailViewModel.listModel?.cancelLoadAll()

			this.countersStream?.end(true)
			this.countersStream = null

			keyManager.unregisterShortcuts(shortcuts)
		}
	}

	private renderFilterButton() {
		return m(MailFilterButton, {
			filter: this.mailViewModel.filterType,
			setFilter: (filter: MailFilterType | null) => this.mailViewModel.setFilter(filter == null ? new Set() : new Set([filter])),
		})
	}

	private mailViewerSingleActions(viewModel: ConversationViewModel) {
		return m(MailViewerActions, {
			selectedMails: [viewModel.primaryMail],
			moveMailsAction: this.getMoveMailsAction(),
			trashMailsAction: () => this.trashSelectedMails(),
			deleteMailAction: this.getDeleteMailsAction(),
			applyLabelsAction: this.getLabelsAction(),
			setUnreadStateAction: this.getSetUnreadStateAction(),
			isUnread: this.getUnreadState(),
			editDraftAction: this.getEditDraftAction(viewModel),
			exportAction: this.getExportAction(),
			replyAction: this.getReplyAction(viewModel, false),
			replyAllAction: this.getReplyAction(viewModel, true),
			forwardAction: this.getForwardAction(viewModel),
			mailViewerMoreActions: getMailViewerMoreActions({
				viewModel: viewModel.primaryViewModel(),
				report: this.getReportAction(viewModel.primaryViewModel()),
				print: this.getPrintAction(),
			}),
		})
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

	private getReportAction(viewModel: MailViewerViewModel): (() => unknown) | null {
		return viewModel.canReport()
			? () => {
					showReportMailDialog((type) => {
						this.mailViewModel.clearStickyMail()
						viewModel
							.reportMail(type)
							.catch(ofClass(LockedError, () => Dialog.message("operationStillActive_msg")))
							.finally(m.redraw)
					})
			  }
			: null
	}

	private renderSingleMailViewer(header: AppHeaderAttrs, viewModel: ConversationViewModel) {
		return m(BackgroundColumnLayout, {
			backgroundColor: theme.navigation_bg,
			desktopToolbar: () => m(DesktopViewerToolbar, this.mailViewerSingleActions(viewModel)),
			mobileHeader: () =>
				m(MobileHeader, {
					...header,
					backAction: () => {
						this.viewSlider.focusPreviousColumn()
					},
					columnType: "other",
					actions: null,
					multicolumnActions: () => this.mailViewerSingleActions(viewModel),
					primaryAction: () => this.renderHeaderRightView(),
					title: getConversationTitle(viewModel),
				}),
			columnLayout: m(ConversationViewer, {
				// Re-create the whole viewer and its vnode tree if email has changed
				key: getElementId(viewModel.primaryMail),
				viewModel: viewModel,
				actionableMailViewerViewModel: this.mailViewModel.groupMailsByConversation()
					? () => viewModel.getLatestMail()?.viewModel
					: () => viewModel.primaryViewModel(),
				// this assumes that the viewSlider focus animation is already started
				delayBodyRendering: this.viewSlider.waitForAnimation(),
				actions: (mailViewerModel: MailViewerViewModel) => {
					return {
						trash: () => {
							trashMails(mailLocator.mailModel, [mailViewerModel.mail._id])
							this.mailViewModel.clearStickyMail()
						},
						delete: mailViewerModel.isDeletableMail()
							? () => {
									promptAndDeleteMails(mailViewerModel.mailModel, [mailViewerModel.mail._id], null, noOp)
									this.mailViewModel.clearStickyMail()
							  }
							: null,
					}
				},
				moreActions: (mailViewerModel: MailViewerViewModel) => {
					return getMailViewerMoreActions({
						viewModel: mailViewerModel,
						report: this.getReportAction(mailViewerModel),
						print: this.getPrintAction(),
					})
				},
			}),
		})
	}

	private mailViewerMultiActions() {
		return m(MailViewerActions, {
			selectedMails: this.mailViewModel.listModel?.getSelectedAsArray() ?? [],
			selectNone: () => this.mailViewModel.listModel?.selectNone(),
			deleteMailAction: this.getDeleteMailsAction(),
			trashMailsAction: () => this.trashSelectedMails(),
			moveMailsAction: this.getMoveMailsAction(),
			applyLabelsAction: this.getLabelsAction(),
			setUnreadStateAction: this.getSetUnreadStateAction(),
			isUnread: null,
			editDraftAction: null,
			exportAction: this.getExportAction(),
			replyAction: null,
			replyAllAction: null,
			forwardAction: null,
			mailViewerMoreActions: null,
		})
	}

	private renderMultiMailViewer(header: AppHeaderAttrs) {
		return m(BackgroundColumnLayout, {
			backgroundColor: theme.navigation_bg,
			desktopToolbar: () => m(DesktopViewerToolbar, this.mailViewerMultiActions()),
			mobileHeader: () =>
				m(MobileHeader, {
					actions: this.mailViewerMultiActions(),
					primaryAction: () => this.renderHeaderRightView(),
					backAction: () => this.viewSlider.focusPreviousColumn(),
					...header,
					columnType: "other",
				}),
			columnLayout: m(MultiItemViewer, {
				selectedEntities: this.mailViewModel.listModel?.getSelectedAsArray() ?? [],
				selectNone: () => {
					this.mailViewModel.listModel?.selectNone()
				},
				loadAll: () => this.mailViewModel.listModel?.loadAll(),
				stopLoadAll: () => this.mailViewModel.listModel?.cancelLoadAll(),
				loadingAll: this.mailViewModel.listModel?.isLoadingAll()
					? "loading"
					: this.mailViewModel.listModel?.loadingStatus === ListLoadingState.Done
					? "loaded"
					: "can_load",
				getSelectionMessage: (selected: ReadonlyArray<Mail>) => getMailSelectionMessage(selected),
			}),
		})
	}

	view({ attrs }: Vnode<MailViewAttrs>): Children {
		return m(
			"#mail.main-view",
			{
				ondragover: (ev: DragEvent) => {
					// do not check the data transfer here because it is not always filled, e.g. in Safari
					ev.stopPropagation()
					ev.preventDefault()
				},
				ondrop: (ev: DragEvent) => {
					if (isNewMailActionAvailable() && ev.dataTransfer?.files && ev.dataTransfer.files.length > 0) {
						this.handleFileDrop({
							dropType: DropType.ExternalFile,
							files: fileListToArray(ev.dataTransfer.files),
						})
					}

					// prevent in any case because firefox tries to open
					// dataTransfer as a URL otherwise.
					ev.stopPropagation()
					ev.preventDefault()
				},
			},
			m(this.viewSlider, {
				header: m(Header, {
					firstColWidth: this.folderColumn.width,
					rightView: this.renderHeaderRightView(),
					searchBar: () =>
						// not showing search for external users
						locator.logins.isInternalUserLoggedIn()
							? m(LazySearchBar, {
									placeholder: lang.get("searchEmails_placeholder"),
							  })
							: null,
					...attrs.header,
				}),
				bottomNav:
					styles.isSingleColumnLayout() && this.viewSlider.focusedColumn === this.mailColumn && this.conversationViewModel
						? m(MobileMailActionBar, {
								deleteMailsAction: this.getDeleteMailsAction(),
								trashMailsAction: () => this.trashSelectedMails(),
								moveMailsAction: this.getMoveMailsAction(),
								applyLabelsAction: this.getLabelsAction(),
								setUnreadStateAction: this.getSetUnreadStateAction(),
								isUnread: this.getUnreadState(),
								editDraftAction: this.getEditDraftAction(this.conversationViewModel),
								exportAction: this.getExportAction(),
								replyAction: this.getReplyAction(this.conversationViewModel, false),
								replyAllAction: this.getReplyAction(this.conversationViewModel, true),
								forwardAction: this.getForwardAction(this.conversationViewModel),
								mailViewerMoreActions: getMailViewerMoreActions({
									viewModel: this.conversationViewModel.primaryViewModel(),
									report: this.getReportAction(this.conversationViewModel.primaryViewModel()),
									print: this.getPrintAction(),
								}),
						  })
						: styles.isSingleColumnLayout() && this.mailViewModel.listModel?.isInMultiselect()
						? m(MobileMailMultiselectionActionBar, {
								selectNone: () => this.mailViewModel.listModel?.selectNone(),
								deleteMailsAction: this.getDeleteMailsAction(),
								trashMailsAction: () => this.trashSelectedMails(),
								moveMailsAction: this.getMoveMailsAction(),
								applyLabelsAction: this.getLabelsAction(),
								setUnreadStateAction: this.getSetUnreadStateAction(),
						  })
						: m(BottomNav),
			}),
		)
	}

	private getDeleteMailsAction() {
		if (this.mailViewModel.currentFolderDeletesPermanently()) {
			return () => this.deleteSelectedMails()
		} else {
			return null
		}
	}

	private getForwardAction(conversationViewModel: ConversationViewModel): (() => void) | null {
		const viewModel = this.mailViewModel.groupMailsByConversation()
			? conversationViewModel.getLatestMail()?.viewModel
			: conversationViewModel.primaryViewModel()

		if (viewModel != null && viewModel.canForward()) {
			return () => viewModel.forward().catch(ofClass(UserError, showUserError))
		} else {
			return null
		}
	}

	private getReplyAction(conversationViewModel: ConversationViewModel, replyAll: boolean): (() => void) | null {
		const viewModel = this.mailViewModel.groupMailsByConversation()
			? conversationViewModel.getLatestMail()?.viewModel
			: conversationViewModel.primaryViewModel()
		if (viewModel == null) {
			return null
		}

		const canReply = replyAll ? viewModel.canReplyAll() : viewModel.canReply()
		if (canReply) {
			return () => viewModel.reply(replyAll)
		} else {
			return null
		}
	}

	private getMoveMailsAction(): (origin: PosRect, opts: ShowMoveMailsDropdownOpts) => void {
		return (origin, opts) => this.moveMailsFromFolder(origin, opts)
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	handleBackButton(): boolean {
		const listModel = this.mailViewModel.listModel
		if (listModel && listModel.isInMultiselect()) {
			listModel.selectNone()
			return true
		} else if (this.viewSlider.isFirstBackgroundColumnFocused()) {
			const folder = this.mailViewModel.getFolder()
			if (folder == null || getMailFolderType(folder) !== MailSetKind.INBOX) {
				this.mailViewModel.switchToFolder(MailSetKind.INBOX)
				return true
			} else {
				return false
			}
		} else {
			return false
		}
	}

	private getUnreadState(): boolean | null {
		const mails = this.mailViewModel.listModel?.getSelectedAsArray() ?? []
		if (mails.length !== 1) {
			return null
		}
		return getFirstOrThrow(mails).unread
	}

	private getSetUnreadStateAction(): ((unread: boolean) => void) | null {
		const actionableMails = this.mailViewModel.getActionableMails()
		if (isEmpty(actionableMails) || (actionableMails.length === 1 && isDraft(getFirstOrThrow(actionableMails)))) {
			return null
		}
		return async (unread: boolean) => {
			const resolvedMails = await this.mailViewModel.getResolvedMails(actionableMails)
			await mailLocator.mailModel.markMails(resolvedMails, unread)
		}
	}

	private getEditDraftAction(viewModel: ConversationViewModel): (() => void) | null {
		const mails = this.mailViewModel.listModel?.getSelectedAsArray() ?? []
		if (mails.length !== 1 || !isDraft(getFirstOrThrow(mails))) {
			return null
		}

		return () => editDraft(viewModel.primaryViewModel())
	}

	private renderHeaderRightView(): Children {
		return isNewMailActionAvailable()
			? [
					m(IconButton, {
						title: "newMail_action",
						click: () => this.showNewMailDialog().catch(ofClass(PermissionError, noOp)),
						icon: Icons.PencilSquare,
					}),
			  ]
			: null
	}

	private getShortcuts(): Array<Shortcut> {
		const deleteOrTrashAction = () => (this.mailViewModel.currentFolderDeletesPermanently() ? this.deleteSelectedMails() : this.trashSelectedMails())

		return [
			...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.mailViewModel),
			{
				key: Keys.N,
				exec: () => {
					this.showNewMailDialog().catch(ofClass(PermissionError, noOp))
				},
				enabled: () => !!this.mailViewModel.getFolder() && isNewMailActionAvailable(),
				help: "newMail_action",
			},
			{
				key: Keys.DELETE,
				exec: () => {
					deleteOrTrashAction()
				},
				help: "deleteEmails_action",
			},
			{
				key: Keys.BACKSPACE,
				exec: () => {
					deleteOrTrashAction()
				},
				help: "deleteEmails_action",
			},
			{
				key: Keys.A,
				exec: () => {
					this.moveMailsToSystemFolder(MailSetKind.ARCHIVE)
				},
				help: "archive_action",
				enabled: () => locator.logins.isInternalUserLoggedIn(),
			},
			{
				key: Keys.I,
				exec: () => {
					this.moveMailsToSystemFolder(MailSetKind.INBOX)
				},
				help: "moveToInbox_action",
			},
			{
				key: Keys.N,
				shift: true,
				ctrlOrCmd: true,
				exec: () => {
					// Since the user can have multiple mailboxes, get the current folder to find which mailbox the user selected
					const currentFolder = this.mailViewModel.getFolder()
					if (currentFolder != null) {
						this.showFolderAddEditDialog(assertNotNull(currentFolder._ownerGroup), null, null)
					}
					return true
				},
				help: "addFolder_action",
			},
			{
				key: Keys.V,
				exec: () => {
					this.moveMailsFromFolder(getMoveMailBounds())
					return true
				},
				help: "move_action",
			},
			{
				key: Keys.L,
				exec: () => {
					const labelsCall = this.getLabelsAction()
					labelsCall?.(null)
					return true
				},
				help: "labels_label",
			},
			{
				key: Keys.U,
				exec: () => {
					if (this.mailViewModel.listModel) this.toggleUnreadMails()
				},
				help: "toggleUnread_action",
			},
			{
				key: Keys.ONE,
				exec: () => {
					this.mailViewModel.switchToFolder(MailSetKind.INBOX)
					return true
				},
				help: "switchInbox_action",
			},
			{
				key: Keys.TWO,
				exec: () => {
					this.mailViewModel.switchToFolder(MailSetKind.DRAFT)
					return true
				},
				help: "switchDrafts_action",
			},
			{
				key: Keys.THREE,
				exec: () => {
					this.mailViewModel.switchToFolder(MailSetKind.SENT)
					return true
				},
				help: "switchSentFolder_action",
			},
			{
				key: Keys.FOUR,
				exec: () => {
					this.mailViewModel.switchToFolder(MailSetKind.TRASH)
					return true
				},
				help: "switchTrash_action",
			},
			{
				key: Keys.FIVE,
				exec: () => {
					this.mailViewModel.switchToFolder(MailSetKind.ARCHIVE)
					return true
				},
				enabled: () => locator.logins.isInternalUserLoggedIn(),
				help: "switchArchive_action",
			},
			{
				key: Keys.SIX,
				exec: () => {
					this.mailViewModel.switchToFolder(MailSetKind.SPAM)
					return true
				},
				enabled: () => locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.InternalCommunication),
				help: "switchSpam_action",
			},
			{
				key: Keys.CTRL,
				exec: () => false,
				enabled: canDoDragAndDropExport,
				help: "dragAndDrop_action",
			},
			{
				key: Keys.P,
				exec: () => {
					this.pressRelease()
					return true
				},
				help: "emptyString_msg",
				enabled: () => locator.logins.isEnabled(FeatureType.Newsletter),
			},
		]
	}

	private async pressRelease() {
		const { openPressReleaseEditor } = await import("../press/PressReleaseEditor")
		const mailboxDetails = await this.mailViewModel.getMailboxDetails()
		if (mailboxDetails) {
			openPressReleaseEditor(mailboxDetails)
		}
	}

	private async moveMailsToSystemFolder(targetFolderType: SystemFolderType) {
		const folder = this.mailViewModel.getFolder()
		if (folder == null) {
			return
		}
		const actionableMails = await this.mailViewModel.getResolvedActionableMails()

		moveMailsToSystemFolder({
			mailboxModel: locator.mailboxModel,
			mailModel: mailLocator.mailModel,
			currentFolder: folder,
			mailIds: actionableMails,
			targetFolderType,
			moveMode: this.mailViewModel.getMoveMode(folder),
		})
	}

	private moveMailsFromFolder(origin: PosRect, opts?: ShowMoveMailsDropdownOpts) {
		const currentFolder = this.mailViewModel.getFolder()
		if (currentFolder == null) {
			return
		}

		/** actionableMails must be captured before {@link showMoveMailsFromFolderDropdown}is called.
		 * This is done to ensure that selected mails are captured before {@link ShowMoveMailsDropdownOpts#onSelected} is called,
		 * which can be {@link MailListModel#selectNone} in some cases.
		 */
		const actionableMails = this.mailViewModel.getActionableMails()
		if (isEmpty(actionableMails)) {
			return
		}

		const resolvedMails = () => this.mailViewModel.getResolvedMails(actionableMails)
		const moveMode = this.mailViewModel.getMoveMode(currentFolder)
		const optsWithClear: ShowMoveMailsDropdownOpts = {
			...opts,
			onSelected: () => {
				opts?.onSelected?.()
				this.mailViewModel.clearStickyMail()
			},
		}
		showMoveMailsFromFolderDropdown(locator.mailboxModel, mailLocator.mailModel, origin, currentFolder, resolvedMails, moveMode, optsWithClear)
	}

	private getLabelsAction(): ((dom: HTMLElement | null, opts?: LabelsPopupOpts) => void) | null {
		const mailModel = mailLocator.mailModel

		return mailModel.canAssignLabels()
			? (dom, opts) => {
					const actionableMails = this.mailViewModel.getActionableMails()
					// when viewing a conversation we need to get the label state for all the mails in that conversation
					showLabelsPopup(mailModel, actionableMails, (mails: Mail[]) => this.mailViewModel.getResolvedMails(mails), dom, opts)
			  }
			: null
	}

	private createFolderColumn(editingFolderForMailGroup: Id | null = null, drawerAttrs: DrawerMenuAttrs) {
		return new ViewColumn(
			{
				view: () => {
					return m(FolderColumnView, {
						drawer: drawerAttrs,
						button: editingFolderForMailGroup
							? null
							: !styles.isUsingBottomNavigation() && isNewMailActionAvailable()
							? {
									label: "newMail_action",
									click: () => this.showNewMailDialog().catch(ofClass(PermissionError, noOp)),
							  }
							: null,
						content: this.renderFoldersAndLabels(editingFolderForMailGroup),
						ariaLabel: "folderTitle_label",
					})
				},
			},
			editingFolderForMailGroup ? ColumnType.Background : ColumnType.Foreground,
			{
				minWidth: size.first_col_min_width,
				maxWidth: size.first_col_max_width,
				headerCenter: "folderTitle_label",
			},
		)
	}

	private renderFoldersAndLabels(editingFolderForMailGroup: Id | null) {
		const details = locator.mailboxModel.mailboxDetails() ?? []
		return [
			...details.map((mailboxDetail) => {
				return this.renderFoldersAndLabelsForMailbox(mailboxDetail, editingFolderForMailGroup)
			}),
		]
	}

	private renderFoldersAndLabelsForMailbox(mailboxDetail: MailboxDetail, editingFolderForMailGroup: string | null) {
		const inEditMode = editingFolderForMailGroup === mailboxDetail.mailGroup._id
		// Only show folders for mailbox in which edit was selected
		if (editingFolderForMailGroup && !inEditMode) {
			return null
		} else {
			return m(
				SidebarSection,
				{
					name: lang.makeTranslation("mailbox_name", getMailboxName(locator.logins, mailboxDetail)),
				},
				[
					this.createMailboxFolderItems(mailboxDetail, inEditMode, () => {
						EditFoldersDialog.showEdit(() => this.renderFoldersAndLabels(mailboxDetail.mailGroup._id))
					}),
					mailLocator.mailModel.canManageLabels()
						? this.renderMailboxLabelItems(mailboxDetail, inEditMode, () => {
								EditFoldersDialog.showEdit(() => this.renderFoldersAndLabels(mailboxDetail.mailGroup._id))
						  })
						: null,
				],
			)
		}
	}

	private createMailboxFolderItems(mailboxDetail: MailboxDetail, inEditMode: boolean, onEditMailbox: () => void): Children {
		return m(MailFoldersView, {
			mailModel: mailLocator.mailModel,
			mailboxDetail,
			expandedFolders: this.expandedState,
			mailFolderElementIdToSelectedMailId: this.mailViewModel.getMailFolderToSelectedMail(),
			onFolderClick: () => {
				if (!inEditMode) {
					this.viewSlider.focus(this.listColumn)
				}
			},
			onFolderExpanded: (folder, state) => this.setExpandedState(folder, state),
			onShowFolderAddEditDialog: (...args) => this.showFolderAddEditDialog(...args),
			onDeleteCustomMailFolder: (folder) => this.deleteCustomMailFolder(mailboxDetail, folder),
			onFolderDrop: (dropData, folder) => {
				if (dropData.dropType == DropType.Mail) {
					this.handleFolderMailDrop(dropData, folder)
				} else if (dropData.dropType == DropType.ExternalFile) {
					this.handeFolderFileDrop(dropData, mailboxDetail, folder)
				}
			},
			inEditMode,
			onEditMailbox,
		})
	}

	private setExpandedState(folder: MailFolder, currentExpansionState: boolean) {
		if (currentExpansionState) {
			this.expandedState.delete(getElementId(folder))
		} else {
			this.expandedState.add(getElementId(folder))
		}
		deviceConfig.setExpandedFolders(locator.logins.getUserController().userId, [...this.expandedState])
	}

	protected onNewUrl(args: Record<string, any>, requestedPath: string) {
		if (requestedPath.startsWith("/mailto")) {
			if (location.hash.length > 5) {
				let url = location.hash.substring(5)
				let decodedUrl = decodeURIComponent(url)
				Promise.all([locator.mailboxModel.getUserMailboxDetails(), import("../editor/MailEditor")]).then(
					([mailboxDetails, { newMailtoUrlMailEditor }]) => {
						newMailtoUrlMailEditor(decodedUrl, false, mailboxDetails)
							.then((editor) => editor.show())
							.catch(ofClass(CancelledError, noOp))
						history.pushState("", document.title, window.location.pathname) // remove # from url
					},
				)
			}
		} else if (args.action === "supportMail" && locator.logins.isGlobalAdminUserLoggedIn()) {
			import("../../../common/support/SupportDialog.js").then(({ showSupportDialog }) => showSupportDialog(locator.logins))
		}

		if (isApp()) {
			let userGroupInfo = locator.logins.getUserController().userGroupInfo
			locator.pushService.closePushNotification(
				userGroupInfo.mailAddressAliases.map((alias) => alias.mailAddress).concat(userGroupInfo.mailAddress || []),
			)
		}

		if (typeof args.mail === "string") {
			const [mailListId, mailId] = args.mail.split(",")
			if (mailListId && mailId) {
				this.mailViewModel.showStickyMail([mailListId, mailId], () =>
					showSnackBar({
						message: "mailMoved_msg",
						button: {
							label: "ok_action",
							click: noOp,
						},
					}),
				)
				this.viewSlider.focus(this.mailColumn)
			} else {
				this.showMail(args)
			}
		} else {
			this.showMail(args)
		}
	}

	private showMail(args: Record<string, any>) {
		this.mailViewModel.showMailWithMailSetId(args.folderId, args.mailId)
		if (styles.isSingleColumnLayout() && !args.mailId && this.viewSlider.focusedColumn === this.mailColumn) {
			this.viewSlider.focus(this.listColumn)
		}
	}

	private async handleFileDrop(fileDrop: FileDropData) {
		try {
			const [mailbox, dataFiles, { appendEmailSignature }, { newMailEditorFromTemplate }] = await Promise.all([
				this.mailViewModel.getMailboxDetails(),
				readLocalFiles(fileDrop.files),
				import("../signature/Signature"),
				import("../editor/MailEditor"),
			])

			if (mailbox != null) {
				const dialog = await newMailEditorFromTemplate(mailbox, {}, "", appendEmailSignature("", locator.logins.getUserController().props), dataFiles)
				dialog.show()
			}
		} catch (e) {
			if (!(e instanceof PermissionError)) throw e
		}
	}

	private async handleFolderMailDrop(dropData: MailDropData, targetFolder: MailFolder) {
		const { mailId } = dropData
		const currentFolder = this.mailViewModel.getFolder()
		if (!this.mailViewModel.listModel || !currentFolder) {
			return
		}
		let mailsToMove: readonly Mail[] = []

		// the dropped mail is among the selected mails, move all selected mails
		if (this.mailViewModel.listModel.isItemSelected(mailId)) {
			mailsToMove = this.mailViewModel.listModel.getSelectedAsArray()
		} else {
			const entity = this.mailViewModel.listModel.getMail(mailId)

			if (entity) {
				mailsToMove = [entity]
			}
		}

		if (!isEmpty(mailsToMove)) {
			const actionableMails = await this.mailViewModel.getResolvedMails(mailsToMove)
			this.mailViewModel.clearStickyMail()
			moveMails({
				mailboxModel: locator.mailboxModel,
				mailModel: mailLocator.mailModel,
				targetFolder,
				mailIds: actionableMails,
				moveMode: this.mailViewModel.getMoveMode(currentFolder),
			})
		}
	}

	private async handeFolderFileDrop(dropData: FileDropData, mailboxDetail: MailboxDetail, mailFolder: MailFolder) {
		function droppedOnlyMailFiles(files: Array<File>): boolean {
			// there's similar logic on the AttachmentBubble, but for natively shared files.
			return files.every((f) => f.name.endsWith(".eml") || f.name.endsWith(".mbox"))
		}

		await this.handleFileDrop(dropData)

		// DnD mail importing is disabled for now as the MailImporter might not have
		// been initialized yet.
		//
		// // importing mails is currently only allowed on plan LEGEND and UNLIMITED
		// const currentPlanType = await locator.logins.getUserController().getPlanType()
		// const isHighestTierPlan = HighestTierPlans.includes(currentPlanType)
		//
		// let importAction: { text: TranslationText; value: boolean } = {
		// 	text: "import_action",
		// 	value: true,
		// }
		// let attachFilesAction: { text: TranslationText; value: boolean } = {
		// 	text: "attachFiles_action",
		// 	value: false,
		// }
		// const willImport =
		// 	isHighestTierPlan && droppedOnlyMailFiles(dropData.files) && (await Dialog.choice("emlOrMboxInSharingFiles_msg", [importAction, attachFilesAction]))
		//
		// if (!willImport) {
		// 	await this.handleFileDrop(dropData)
		// } else if (mailFolder._ownerGroup && this.mailImporter) {
		// 	await this.mailImporter.onStartBtnClick(
		// 		mailFolder,
		// 		dropData.files.map((file) => window.nativeApp.getPathForFile(file)),
		// 	)
		// }
	}

	private async showNewMailDialog(): Promise<void> {
		const mailboxDetails = await this.mailViewModel.getMailboxDetails()
		if (mailboxDetails == null) {
			return
		}
		const { newMailEditor } = await import("../editor/MailEditor")
		const dialog = await newMailEditor(mailboxDetails)
		dialog.show()
	}

	private async deleteCustomMailFolder(mailboxDetail: MailboxDetail, folder: MailFolder): Promise<void> {
		if (folder.folderType !== MailSetKind.CUSTOM) {
			throw new Error("Cannot delete non-custom folder: " + String(folder._id))
		}

		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.mailViewModel?.listModel?.selectNone()
		if (mailboxDetail.mailbox.folders == null) {
			return
		}
		const folders = await mailLocator.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id)

		if (isSpamOrTrashFolder(folders, folder)) {
			const confirmed = await Dialog.confirm(
				lang.getTranslation("confirmDeleteFinallyCustomFolder_msg", {
					"{1}": getFolderName(folder),
				}),
			)
			if (!confirmed) return
			await mailLocator.mailModel.finallyDeleteCustomMailFolder(folder)
		} else {
			const confirmed = await Dialog.confirm(
				lang.getTranslation("confirmDeleteCustomFolder_msg", {
					"{1}": getFolderName(folder),
				}),
			)
			if (!confirmed) return
			await mailLocator.mailModel.trashFolderAndSubfolders(folder)
		}
	}

	logout() {
		m.route.set("/")
	}

	private getExportAction(): (() => void) | null {
		const actionableMails = this.mailViewModel.getActionableMails()
		if (!this.mailViewModel.isExportingMailsAllowed() || isEmpty(actionableMails)) {
			return null
		}

		const resolvedMails = async () => await this.mailViewModel.getResolvedMails(actionableMails)
		return () => startExport(resolvedMails)
	}

	private async toggleUnreadMails(): Promise<void> {
		const actionableMails = this.mailViewModel.getActionableMails()
		if (isEmpty(actionableMails)) {
			return
		}
		const resolvedMails = await this.mailViewModel.getResolvedMails(actionableMails)
		// set all selected emails to the opposite of the first email's unread state
		await mailLocator.mailModel.markMails(resolvedMails, !actionableMails[0].unread)
	}

	private async trashSelectedMails() {
		const actionableMails = await this.mailViewModel.getResolvedActionableMails()
		trashMails(mailLocator.mailModel, actionableMails)
		this.mailViewModel.clearStickyMail()
	}

	private async deleteSelectedMails() {
		const actionableMails = await this.mailViewModel.getResolvedActionableMails()
		const currentFolder = assertNotNull(this.mailViewModel.getFolder())
		if (isNotEmpty(actionableMails)) {
			await promptAndDeleteMails(mailLocator.mailModel, actionableMails, currentFolder._id, noOp)
		}
	}

	private async showFolderAddEditDialog(mailGroupId: Id, folder: MailFolder | null, parentFolder: MailFolder | null) {
		const mailboxDetail = await locator.mailboxModel.getMailboxDetailsForMailGroup(mailGroupId)
		await showEditFolderDialog(mailboxDetail, folder, parentFolder)
	}

	private async showLabelAddDialog(mailbox: MailBox) {
		await showEditLabelDialog(mailbox, this.mailViewModel, null)
	}

	private async showLabelEditDialog(label: MailFolder) {
		await showEditLabelDialog(null, this.mailViewModel, label)
	}

	private async showLabelDeleteDialog(label: MailFolder) {
		const confirmed = await Dialog.confirm(
			lang.getTranslation("confirmDeleteLabel_msg", {
				"{1}": label.name,
			}),
		)
		if (!confirmed) return
		await this.mailViewModel.deleteLabel(label)
	}

	private renderMailboxLabelItems(mailboxDetail: MailboxDetail, inEditMode: boolean, onEditMailbox: () => void): Children {
		return [
			m(
				SidebarSection,
				{
					name: "labels_label",
					button: inEditMode ? this.renderAddLabelButton(mailboxDetail) : this.renderEditMailboxButton(onEditMailbox),
				},
				[
					m(".flex.col", [
						Array.from(mailLocator.mailModel.getLabelsByGroupId(mailboxDetail.mailGroup._id).values())
							.sort((labelA, labelB) => labelA.name.localeCompare(labelB.name))
							.map((label) => {
								const path = `${MAIL_PREFIX}/${getElementId(label)}`

								return m(SidebarSectionRow, {
									icon: Icons.Label,
									iconColor: getLabelColor(label.color),
									label: lang.makeTranslation(`folder:${label.name}`, label.name),
									path,
									isSelectedPrefix: inEditMode ? false : path,
									disabled: inEditMode,
									onClick: () => {
										if (!inEditMode) {
											this.viewSlider.focus(this.listColumn)
										}
									},
									alwaysShowMoreButton: inEditMode,
									moreButton: attachDropdown({
										mainButtonAttrs: {
											icon: Icons.More,
											title: "more_label",
										},
										childAttrs: () => [
											{
												label: "edit_action",
												icon: Icons.Edit,
												click: () => {
													this.showLabelEditDialog(label)
												},
											},
											{
												label: "delete_action",
												icon: Icons.Trash,
												click: () => {
													this.showLabelDeleteDialog(label)
												},
											},
										],
									}),
								})
							}),
					]),
				],
			),
			m(RowButton, {
				label: "addLabel_action",
				icon: Icons.Add,
				class: "folder-row mlr-button border-radius-small",
				style: {
					width: `calc(100% - ${px(size.hpad_button * 2)})`,
				},
				onclick: () => {
					this.showLabelAddDialog(mailboxDetail.mailbox)
				},
			}),
		]
	}

	private renderEditMailboxButton(onEditMailbox: () => unknown) {
		return m(IconButton, {
			icon: Icons.Edit,
			size: ButtonSize.Compact,
			title: "edit_action",
			click: onEditMailbox,
		})
	}

	private renderAddLabelButton(mailboxDetail: MailboxDetail) {
		return m(IconButton, {
			title: "addLabel_action",
			icon: Icons.Add,
			click: () => {
				this.showLabelAddDialog(mailboxDetail.mailbox)
			},
		})
	}
}
