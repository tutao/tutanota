import m, { Children, Vnode } from "mithril"
import { ViewSlider } from "../../gui/nav/ViewSlider.js"
import { ColumnType, ViewColumn } from "../../gui/base/ViewColumn"
import { lang } from "../../misc/LanguageViewModel"
import { ButtonType } from "../../gui/base/Button.js"
import { Dialog } from "../../gui/base/Dialog"
import { FeatureType, Keys, MailFolderType } from "../../api/common/TutanotaConstants"
import { AppHeaderAttrs, Header } from "../../gui/Header.js"
import type { Mail, MailFolder } from "../../api/entities/tutanota/TypeRefs.js"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { MailListView } from "./MailListView"
import { assertMainOrNode, isApp } from "../../api/common/Env"
import type { Shortcut } from "../../misc/KeyManager"
import { keyManager } from "../../misc/KeyManager"
import { getMailSelectionMessage, MultiItemViewer } from "./MultiItemViewer.js"
import { Icons } from "../../gui/base/icons/Icons"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { canDoDragAndDropExport, getFolderName, getMailboxName } from "../model/MailUtils"
import type { MailboxDetail } from "../model/MailModel"
import { locator } from "../../api/main/MainLocator"
import { PermissionError } from "../../api/common/error/PermissionError"
import { styles } from "../../gui/styles"
import { px, size } from "../../gui/size"
import { UserError } from "../../api/main/UserError"
import { showUserError } from "../../misc/ErrorHandlerImpl"
import { archiveMails, getConversationTitle, getMoveMailBounds, moveMails, moveToInbox, promptAndDeleteMails, showMoveMailsDropdown } from "./MailGuiUtils"
import { getElementId } from "../../api/common/utils/EntityUtils"
import { isNewMailActionAvailable } from "../../gui/nav/NavFunctions"
import { CancelledError } from "../../api/common/error/CancelledError"
import Stream from "mithril/stream"
import { readLocalFiles } from "../../file/FileController.js"
import { BottomNav } from "../../gui/nav/BottomNav.js"
import { MobileMailActionBar } from "./MobileMailActionBar.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import { DrawerMenuAttrs } from "../../gui/nav/DrawerMenu.js"
import { BaseTopLevelView } from "../../gui/BaseTopLevelView.js"
import { showEditFolderDialog } from "./EditFolderDialog.js"
import { MailFoldersView } from "./MailFoldersView.js"
import { isSpamOrTrashFolder } from "../../api/common/mail/CommonMailUtils.js"
import { FolderColumnView } from "../../gui/FolderColumnView.js"
import { SidebarSection } from "../../gui/SidebarSection.js"
import { EditFoldersDialog } from "./EditFoldersDialog.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { ConversationViewModel } from "./ConversationViewModel.js"
import { conversationCardMargin, ConversationViewer } from "./ConversationViewer.js"
import type { DesktopSystemFacade } from "../../native/common/generatedipc/DesktopSystemFacade.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { BackgroundColumnLayout } from "../../gui/BackgroundColumnLayout.js"
import { MailViewerActions } from "./MailViewerToolbar.js"
import { theme } from "../../gui/theme.js"
import { MobileMailMultiselectionActionBar } from "./MobileMailMultiselectionActionBar.js"
import { SelectAllCheckbox } from "../../gui/SelectAllCheckbox.js"
import { DesktopListToolbar, DesktopViewerToolbar } from "../../gui/DesktopToolbars.js"
import { MobileHeader } from "../../gui/MobileHeader.js"
import { LazySearchBar } from "../../misc/LazySearchBar.js"
import { MultiselectMobileHeader } from "../../gui/MultiselectMobileHeader.js"
import { MailViewModel } from "./MailViewModel.js"
import { selectionAttrsForList } from "../../misc/ListModel.js"
import { ListLoadingState, MultiselectMode } from "../../gui/base/NewList.js"
import { EnterMultiselectIconButton } from "../../gui/EnterMultiselectIconButton.js"
import { MailFilterButton } from "./MailFilterButton.js"
import { listSelectionKeyboardShortcuts } from "../../gui/base/ListUtils.js"

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

	private expandedState: Set<Id>
	private mailboxSubscription: Stream<void> | null = null
	private mailViewModel: MailViewModel

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
					const listId = this.mailViewModel.getListId()
					return m(BackgroundColumnLayout, {
						backgroundColor: theme.navigation_bg,
						desktopToolbar: () =>
							m(DesktopListToolbar, m(SelectAllCheckbox, selectionAttrsForList(this.mailViewModel.listModel)), this.renderFilterButton()),
						columnLayout: listId
							? m(
									"",
									{
										style: {
											marginBottom: px(conversationCardMargin),
										},
									},
									m(MailListView, {
										key: listId,
										mailViewModel: this.mailViewModel,
										listId: listId,
										onSingleSelection: () => {
											if (!this.mailViewModel.listModel?.state.inMultiselect) {
												this.viewSlider.focus(this.mailColumn)
											}
										},
										onClearFolder: async () => {
											const folder = this.mailViewModel.getSelectedFolder()
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
			size.second_col_min_width,
			size.second_col_max_width,
			() => {
				const selectedFolder = this.mailViewModel.getSelectedFolder()
				return selectedFolder ? getFolderName(selectedFolder) : ""
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
			size.third_col_min_width,
			size.third_col_max_width,
			undefined,
			() => lang.get("email_label"),
		)
		this.viewSlider = new ViewSlider([this.folderColumn, this.listColumn, this.mailColumn], "MailView")
		this.viewSlider.focusedColumn = this.viewSlider.columns[0]

		const shortcuts = this.getShortcuts()

		vnode.attrs.mailViewModel.init()

		this.oncreate = (vnode) => {
			this.countersStream = locator.mailModel.mailboxCounters.map(m.redraw)
			keyManager.registerShortcuts(shortcuts)
			this.cache.conversationViewPreference = deviceConfig.getConversationViewShowOnlySelectedMail()
		}

		this.onremove = () => {
			// cancel the loading if we are destroyed
			this.mailViewModel.listModel?.cancelLoadAll()

			this.countersStream?.end(true)
			this.countersStream = null

			keyManager.unregisterShortcuts(shortcuts)
			// this is safe to pause because if we are recreated we will subscribe and get a new value right away
			this.mailboxSubscription?.end(true)
		}
	}

	private renderFilterButton() {
		return m(MailFilterButton, { filter: this.mailViewModel.filterType, setFilter: (filter) => this.mailViewModel.setFilter(filter) })
	}

	private mailViewerSingleActions(viewModel: ConversationViewModel) {
		return m(MailViewerActions, {
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
				delayBodyRendering: this.viewSlider.waitForAnimation().then(m.redraw),
			}),
		})
	}

	private mailViewerMultiActions() {
		return m(MailViewerActions, {
			mailModel: locator.mailModel,
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
					// do not check the datatransfer here because it is not always filled, e.g. in Safari
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
						m(LazySearchBar, {
							placeholder: lang.get("searchEmails_placeholder"),
						}),
					...attrs.header,
				}),
				bottomNav:
					styles.isSingleColumnLayout() && this.viewSlider.focusedColumn === this.mailColumn && this.conversationViewModel
						? m(MobileMailActionBar, { viewModel: this.conversationViewModel.primaryViewModel() })
						: styles.isSingleColumnLayout() && this.mailViewModel.listModel?.state.inMultiselect
						? m(MobileMailMultiselectionActionBar, {
								mails: this.mailViewModel.listModel.getSelectedAsArray(),
								selectNone: () => this.mailViewModel.listModel?.selectNone(),
								mailModel: locator.mailModel,
						  })
						: m(BottomNav),
			}),
		)
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
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
			...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.mailViewModel.listModel ?? null),
			{
				key: Keys.N,
				exec: () => {
					this.showNewMailDialog().catch(ofClass(PermissionError, noOp))
				},
				enabled: () => !!this.mailViewModel.getSelectedFolder() && isNewMailActionAvailable(),
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
					this.mailViewModel.switchToFolder(MailFolderType.INBOX)
					return true
				},
				help: "switchInbox_action",
			},
			{
				key: Keys.TWO,
				exec: () => {
					this.mailViewModel.switchToFolder(MailFolderType.DRAFT)
					return true
				},
				help: "switchDrafts_action",
			},
			{
				key: Keys.THREE,
				exec: () => {
					this.mailViewModel.switchToFolder(MailFolderType.SENT)
					return true
				},
				help: "switchSentFolder_action",
			},
			{
				key: Keys.FOUR,
				exec: () => {
					this.mailViewModel.switchToFolder(MailFolderType.TRASH)
					return true
				},
				help: "switchTrash_action",
			},
			{
				key: Keys.FIVE,
				exec: () => {
					this.mailViewModel.switchToFolder(MailFolderType.ARCHIVE)
					return true
				},
				enabled: () => locator.logins.isInternalUserLoggedIn(),
				help: "switchArchive_action",
			},
			{
				key: Keys.SIX,
				exec: () => {
					this.mailViewModel.switchToFolder(MailFolderType.SPAM)
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

		// Render the dropdown at the position of the selected mails in the MailList
		showMoveMailsDropdown(locator.mailModel, getMoveMailBounds(), selectedMails)
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
									type: ButtonType.FolderColumnHeader,
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
			size.first_col_min_width,
			size.first_col_max_width,
			() => lang.get("folderTitle_label"),
		)
	}

	private renderFolders(editingFolderForMailGroup: Id | null) {
		const details = locator.mailModel.mailboxDetails() ?? []
		return [
			...details.map((mailboxDetail) => {
				// Only show folders for mailbox in which edit was selected
				if (editingFolderForMailGroup && editingFolderForMailGroup != mailboxDetail.mailGroup._id) {
					return null
				} else {
					return m(
						SidebarSection,
						{
							name: () => getMailboxName(locator.logins, mailboxDetail),
						},
						this.createMailboxFolderItems(mailboxDetail, editingFolderForMailGroup),
					)
				}
			}),
		]
	}

	private createMailboxFolderItems(mailboxDetail: MailboxDetail, editingFolderForMailGroup: Id | null = null): Children {
		return m(MailFoldersView, {
			mailboxDetail,
			expandedFolders: this.expandedState,
			mailListToSelectedMail: this.mailViewModel.getMailListToSelectedMail(),
			onFolderClick: () => {
				if (!editingFolderForMailGroup) {
					this.viewSlider.focus(this.listColumn)
				}
			},
			onFolderExpanded: (folder, state) => this.setExpandedState(folder, state),
			onShowFolderAddEditDialog: (...args) => this.showFolderAddEditDialog(...args),
			onDeleteCustomMailFolder: (folder) => this.deleteCustomMailFolder(mailboxDetail, folder),
			onFolderDrop: (mailId, folder) => this.handleFolderDrop(mailId, folder),
			inEditMode: editingFolderForMailGroup === mailboxDetail.mailGroup._id,
			onEditMailbox: () => {
				EditFoldersDialog.showEdit(() => this.renderFolders(mailboxDetail.mailGroup._id))
			},
			onEditingDone: () => {
				editingFolderForMailGroup = null
			},
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
				Promise.all([locator.mailModel.getUserMailboxDetails(), import("../editor/MailEditor")]).then(
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

		this.mailViewModel.showMail(args.listId, args.mailId)
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

		moveMails({ mailModel: locator.mailModel, mails: mailsToMove, targetMailFolder: folder })
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
		if (folder.folderType !== MailFolderType.CUSTOM) {
			throw new Error("Cannot delete non-custom folder: " + String(folder._id))
		}

		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.mailViewModel?.listModel?.selectNone()

		if (isSpamOrTrashFolder(mailboxDetail.folders, folder)) {
			const confirmed = await Dialog.confirm(() =>
				lang.get("confirmDeleteFinallyCustomFolder_msg", {
					"{1}": getFolderName(folder),
				}),
			)
			if (!confirmed) return
			await locator.mailModel.finallyDeleteCustomMailFolder(folder)
		} else {
			const confirmed = await Dialog.confirm(() =>
				lang.get("confirmDeleteCustomFolder_msg", {
					"{1}": getFolderName(folder),
				}),
			)
			if (!confirmed) return
			await locator.mailModel.trashFolderAndSubfolders(folder)
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
		await locator.mailModel.markMails(mails, !mails[0].unread)
	}

	private deleteMails(mails: Mail[]): Promise<boolean> {
		return promptAndDeleteMails(locator.mailModel, mails, noOp)
	}

	private async showFolderAddEditDialog(mailGroupId: Id, folder: MailFolder | null, parentFolder: MailFolder | null) {
		const mailboxDetail = await locator.mailModel.getMailboxDetailsForMailGroup(mailGroupId)
		await showEditFolderDialog(mailboxDetail, folder, parentFolder)
	}
}
