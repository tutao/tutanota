import m, { Children, Vnode } from "mithril"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider.js"
import { ColumnType, ViewColumn } from "../../../common/gui/base/ViewColumn"
import { lang } from "../../../common/misc/LanguageViewModel"
import { Dialog } from "../../../common/gui/base/Dialog"
import { FeatureType, Keys, MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { AppHeaderAttrs, Header } from "../../../common/gui/Header.js"
import type { Mail, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { noOp, ofClass } from "@tutao/tutanota-utils"
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
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import { archiveMails, getConversationTitle, getMoveMailBounds, moveMails, moveToInbox, promptAndDeleteMails, showMoveMailsDropdown } from "./MailGuiUtils"
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
import type { DesktopSystemFacade } from "../../../common/native/common/generatedipc/DesktopSystemFacade.js"
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
import { canDoDragAndDropExport } from "./MailViewerUtils.js"
import { isSpamOrTrashFolder } from "../model/MailChecks.js"

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
	desktopSystemFacade: DesktopSystemFacade | null
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
	private readonly desktopSystemFacade: DesktopSystemFacade | null
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
		this.desktopSystemFacade = vnode.attrs.desktopSystemFacade
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
											if (!this.mailViewModel.listModel?.state.inMultiselect) {
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
											const confirmed = await Dialog.confirm(() =>
												lang.get("confirmDeleteFinallySystemFolder_msg", { "{1}": getFolderName(folder) }),
											)
											if (confirmed) {
												showProgressDialog("progressDeleting_msg", this.mailViewModel.finallyDeleteAllMailsInSelectedFolder(folder))
											}
										},
									}),
							  )
							: null,
						mobileHeader: () =>
							this.mailViewModel.listModel?.state.inMultiselect
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
					const selectedFolder = this.mailViewModel.getFolder()
					return selectedFolder ? getFolderName(selectedFolder) : ""
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
			},
		)
		this.viewSlider = new ViewSlider([this.folderColumn, this.listColumn, this.mailColumn])
		this.viewSlider.focusedColumn = this.listColumn

		const shortcuts = this.getShortcuts()

		vnode.attrs.mailViewModel.init()

		this.oncreate = () => {
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
		return m(MailFilterButton, { filter: this.mailViewModel.filterType, setFilter: (filter) => this.mailViewModel.setFilter(filter) })
	}

	private mailViewerSingleActions(viewModel: ConversationViewModel) {
		return m(MailViewerActions, {
			mailboxModel: viewModel.primaryViewModel().mailboxModel,
			mailModel: viewModel.primaryViewModel().mailModel,
			mailViewerViewModel: viewModel.primaryViewModel(),
			mails: [viewModel.primaryMail],
		})
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
				// this assumes that the viewSlider focus animation is already started
				delayBodyRendering: this.viewSlider.waitForAnimation(),
			}),
		})
	}

	private mailViewerMultiActions() {
		return m(MailViewerActions, {
			mailboxModel: locator.mailboxModel,
			mailModel: mailLocator.mailModel,
			mails: this.mailViewModel.listModel?.getSelectedAsArray() ?? [],
			selectNone: () => this.mailViewModel.listModel?.selectNone(),
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
				loadingAll: this.mailViewModel.listModel?.state.loadingAll
					? "loading"
					: this.mailViewModel.listModel?.state.loadingStatus === ListLoadingState.Done
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
						Promise.all([
							this.mailViewModel.getMailboxDetails(),
							readLocalFiles(ev.dataTransfer.files),
							import("../signature/Signature"),
							import("../editor/MailEditor"),
						])
							.then(([mailbox, dataFiles, { appendEmailSignature }, { newMailEditorFromTemplate }]) => {
								mailbox &&
									newMailEditorFromTemplate(
										mailbox,
										{},
										"",
										appendEmailSignature("", locator.logins.getUserController().props),
										dataFiles,
									).then((dialog) => dialog.show())
							})
							.catch(ofClass(PermissionError, noOp))
							.catch(ofClass(UserError, showUserError))
					}

					// prevent in any case because firefox tries to open
					// dataTransfer as a URL otherwise.
					ev.stopPropagation()
					ev.preventDefault()
				},
			},
			m(this.viewSlider, {
				header: m(Header, {
					rightView: this.renderHeaderRightView(),
					searchBar: () =>
						// not showing search for external users
						locator.logins.isInternalUserLoggedIn()
							? m(LazySearchBar, {
									placeholder: lang.get("searchEmails_placeholder"),
									disabled: !locator.logins.isFullyLoggedIn(),
							  })
							: null,
					...attrs.header,
				}),
				bottomNav:
					styles.isSingleColumnLayout() && this.viewSlider.focusedColumn === this.mailColumn && this.conversationViewModel
						? m(MobileMailActionBar, { viewModel: this.conversationViewModel.primaryViewModel() })
						: styles.isSingleColumnLayout() && this.mailViewModel.listModel?.state.inMultiselect
						? m(MobileMailMultiselectionActionBar, {
								mails: this.mailViewModel.listModel.getSelectedAsArray(),
								selectNone: () => this.mailViewModel.listModel?.selectNone(),
								mailModel: mailLocator.mailModel,
								mailboxModel: locator.mailboxModel,
						  })
						: m(BottomNav),
			}),
		)
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	handleBackButton(): boolean {
		const listModel = this.mailViewModel.listModel
		if (listModel && listModel.state.inMultiselect) {
			listModel.selectNone()
			return true
		}
		return false
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
					this.mailViewModel.listModel && this.deleteMails(this.mailViewModel.listModel.getSelectedAsArray())
				},
				help: "deleteEmails_action",
			},
			{
				key: Keys.BACKSPACE,
				exec: () => {
					this.mailViewModel.listModel && this.deleteMails(this.mailViewModel.listModel.getSelectedAsArray())
				},
				help: "deleteEmails_action",
			},
			{
				key: Keys.A,
				exec: () => {
					this.mailViewModel.listModel && archiveMails(this.mailViewModel.listModel.getSelectedAsArray())
					return true
				},
				help: "archive_action",
				enabled: () => locator.logins.isInternalUserLoggedIn(),
			},
			{
				key: Keys.I,
				exec: () => {
					this.mailViewModel.listModel && moveToInbox(this.mailViewModel.listModel.getSelectedAsArray())
					return true
				},
				help: "moveToInbox_action",
			},
			{
				key: Keys.V,
				exec: () => {
					this.moveMails()
					return true
				},
				help: "move_action",
			},
			{
				key: Keys.U,
				exec: () => {
					this.mailViewModel.listModel && this.toggleUnreadMails(this.mailViewModel.listModel.getSelectedAsArray())
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
					new Promise(async (resolve) => {
						const { openPressReleaseEditor } = await import("../press/PressReleaseEditor")
						const mailboxDetails = await this.mailViewModel.getMailboxDetails()
						mailboxDetails && openPressReleaseEditor(mailboxDetails)
						resolve(null)
					})
					return true
				},
				help: "emptyString_msg",
				enabled: () => locator.logins.isEnabled(FeatureType.Newsletter),
			},
		]
	}

	private moveMails() {
		const mailList = this.mailViewModel.listModel
		if (mailList == null) {
			return
		}

		const selectedMails = mailList.getSelectedAsArray()

		showMoveMailsDropdown(locator.mailboxModel, mailLocator.mailModel, getMoveMailBounds(), selectedMails)
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
						content: this.renderFolders(editingFolderForMailGroup),
						ariaLabel: "folderTitle_label",
					})
				},
			},
			editingFolderForMailGroup ? ColumnType.Background : ColumnType.Foreground,
			{
				minWidth: size.first_col_min_width,
				maxWidth: size.first_col_max_width,
				headerCenter: () => lang.get("folderTitle_label"),
			},
		)
	}

	private renderFolders(editingFolderForMailGroup: Id | null) {
		const details = locator.mailboxModel.mailboxDetails() ?? []
		return [
			...details.map((mailboxDetail) => {
				const inEditMode = editingFolderForMailGroup === mailboxDetail.mailGroup._id
				// Only show folders for mailbox in which edit was selected
				if (editingFolderForMailGroup && !inEditMode) {
					return null
				} else {
					return m(
						SidebarSection,
						{
							name: () => getMailboxName(locator.logins, mailboxDetail),
						},
						this.createMailboxFolderItems(mailboxDetail, inEditMode, () => {
							EditFoldersDialog.showEdit(() => this.renderFolders(mailboxDetail.mailGroup._id))
						}),
					)
				}
			}),
		]
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
			onFolderDrop: (mailId, folder) => this.handleFolderDrop(mailId, folder),
			inEditMode,
			onEditMailbox,
		})
	}

	private setExpandedState(folder: MailFolder, currentExpansionState: boolean) {
		currentExpansionState ? this.expandedState.delete(getElementId(folder)) : this.expandedState.add(getElementId(folder))
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
			import("../editor/MailEditor").then(({ writeSupportMail }) => writeSupportMail())
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
		this.mailViewModel.showMailWithFolderId(args.folderId, args.mailId)
		if (styles.isSingleColumnLayout() && !args.mailId && this.viewSlider.focusedColumn === this.mailColumn) {
			this.viewSlider.focus(this.listColumn)
		}
	}

	private async handleFolderDrop(droppedMailId: string, folder: MailFolder) {
		if (!this.mailViewModel.listModel) {
			return
		}
		let mailsToMove: Mail[] = []

		// the dropped mail is among the selected mails, move all selected mails
		if (this.mailViewModel.listModel.isItemSelected(droppedMailId)) {
			mailsToMove = this.mailViewModel.listModel.getSelectedAsArray()
		} else {
			const entity = this.mailViewModel.listModel.state.items.find((item) => getElementId(item) === droppedMailId)

			if (entity) {
				mailsToMove.push(entity)
			}
		}

		moveMails({ mailboxModel: locator.mailboxModel, mailModel: mailLocator.mailModel, mails: mailsToMove, targetMailFolder: folder })
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
		const folders = mailLocator.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id)

		if (isSpamOrTrashFolder(folders, folder)) {
			const confirmed = await Dialog.confirm(() =>
				lang.get("confirmDeleteFinallyCustomFolder_msg", {
					"{1}": getFolderName(folder),
				}),
			)
			if (!confirmed) return
			await mailLocator.mailModel.finallyDeleteCustomMailFolder(folder)
		} else {
			const confirmed = await Dialog.confirm(() =>
				lang.get("confirmDeleteCustomFolder_msg", {
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

	private async toggleUnreadMails(mails: Mail[]): Promise<void> {
		if (mails.length == 0) {
			return
		}
		// set all selected emails to the opposite of the first email's unread state
		await mailLocator.mailModel.markMails(mails, !mails[0].unread)
	}

	private deleteMails(mails: Mail[]): Promise<boolean> {
		return promptAndDeleteMails(mailLocator.mailModel, mails, noOp)
	}

	private async showFolderAddEditDialog(mailGroupId: Id, folder: MailFolder | null, parentFolder: MailFolder | null) {
		const mailboxDetail = await locator.mailboxModel.getMailboxDetailsForMailGroup(mailGroupId)
		await showEditFolderDialog(mailboxDetail, folder, parentFolder)
	}
}
