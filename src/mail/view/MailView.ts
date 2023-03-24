import m, { Children, Vnode } from "mithril"
import { ViewSlider } from "../../gui/nav/ViewSlider.js"
import { ColumnType, ViewColumn } from "../../gui/base/ViewColumn"
import { lang } from "../../misc/LanguageViewModel"
import type { ButtonAttrs } from "../../gui/base/Button.js"
import { Button, ButtonColor, ButtonType } from "../../gui/base/Button.js"
import { isSelectedPrefix } from "../../gui/base/NavButton.js"
import { Dialog } from "../../gui/base/Dialog"
import { FeatureType, Keys, MailFolderType } from "../../api/common/TutanotaConstants"
import { BaseHeaderAttrs, Header } from "../../gui/Header.js"
import type { Mail, MailFolder } from "../../api/entities/tutanota/TypeRefs.js"
import { assertNotNull, defer, getFirstOrThrow, noOp, ofClass } from "@tutao/tutanota-utils"
import { MailListView } from "./MailListView"
import { assertMainOrNode, isApp, isDesktop } from "../../api/common/Env"
import type { Shortcut } from "../../misc/KeyManager"
import { keyManager } from "../../misc/KeyManager"
import { getMultiMailViewerActionButtonAttrs, MultiMailViewer } from "./MultiMailViewer"
import { Icons } from "../../gui/base/icons/Icons"
import { PreconditionFailedError } from "../../api/common/error/RestError"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { canDoDragAndDropExport, getFolderName, getMailboxName, markMails } from "../model/MailUtils"
import type { MailboxDetail } from "../model/MailModel"
import { locator } from "../../api/main/MainLocator"
import { ActionBar } from "../../gui/base/ActionBar"
import { MultiSelectionBar } from "../../gui/base/MultiSelectionBar"
import { PermissionError } from "../../api/common/error/PermissionError"
import { MAIL_PREFIX, navButtonRoutes, throttleRoute } from "../../misc/RouteChange"
import { styles } from "../../gui/styles"
import { size } from "../../gui/size"
import { UserError } from "../../api/main/UserError"
import { showUserError } from "../../misc/ErrorHandlerImpl"
import { archiveMails, moveMails, moveToInbox, promptAndDeleteMails, showMoveMailsDropdown } from "./MailGuiUtils"
import { getElementId, isSameId } from "../../api/common/utils/EntityUtils"
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
import { assertSystemFolderOfType, isSpamOrTrashFolder, isSubfolderOfType } from "../../api/common/mail/CommonMailUtils.js"
import { FolderColumnView } from "../../gui/FolderColumnView.js"
import { SidebarSection } from "../../gui/SidebarSection.js"
import { EditFoldersDialog } from "./EditFoldersDialog.js"
import { searchBar } from "../../search/SearchBar.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { ConversationViewModel } from "./ConversationViewModel.js"
import { ConversationViewer } from "./ConversationViewer.js"
import type { DesktopSystemFacade } from "../../native/common/generatedipc/DesktopSystemFacade.js"
import { CreateMailViewerOptions } from "./MailViewer.js"

assertMainOrNode()

/** State persisted between re-creations. */
export interface MailViewCache {
	/**
	 * Not initialized until we get list id from updateUrl and/or getMailboxDetails().
	 * Ideally would be a data source holding emails but because of how List is implemented it's easier to keep the whole view around for now.
	 */
	mailList: MailListView | null
	/** Current folder. Need to keep it around to know where to return to and remember that we are initialized. */
	selectedFolder: MailFolder | null
	/** Viewer for currently opened email. Need to keep it around so it receives updates and keeps any state it needs to. */
	conversationViewModel: ConversationViewModel | null
	/** The preference for if conversation view was used, so we can reset if it was changed */
	conversationViewPreference: boolean | null
}

export interface MailViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	cache: MailViewCache
	header: BaseHeaderAttrs
	desktopSystemFacade: DesktopSystemFacade | null
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

	/**
	 * We remember the last URL used for each folder so if we switch between folders we can keep the selected mail.
	 * There's a similar (but different) hacky mechanism where we store last URL but per each top-level view: navButtonRoutes. This one is per folder.
	 */
	private readonly folderToUrl: Record<Id, string>
	private readonly throttledRouteSet: (newRoute: string) => void
	private countersStream: Stream<unknown> | null = null

	private expandedState: Set<Id>
	private mailboxSubscription: Stream<void> | null = null
	private loadingAllForMailList: Id | null = null

	get conversationViewModel(): ConversationViewModel | null {
		return this.cache.conversationViewModel
	}

	set conversationViewModel(viewModel: ConversationViewModel | null) {
		this.cache.conversationViewModel?.dispose()
		this.cache.conversationViewModel = viewModel
		viewModel?.init()
		if (viewModel && isDesktop()) {
			// Notify the admin client about the mail being selected
			this.desktopSystemFacade?.sendSocketMessage(viewModel.primaryMail.sender.address)
		}
	}

	constructor(vnode: Vnode<MailViewAttrs>) {
		super()
		this.desktopSystemFacade = vnode.attrs.desktopSystemFacade
		this.folderToUrl = {}
		this.throttledRouteSet = throttleRoute()
		this.expandedState = new Set(deviceConfig.getExpandedFolders(locator.logins.getUserController().userId))
		this.cache = vnode.attrs.cache
		this.folderColumn = this.createFolderColumn(null, vnode.attrs.drawerAttrs)
		this.listColumn = new ViewColumn(
			{
				view: () => m(".list-column", [this.cache.mailList ? m(this.cache.mailList, { mailView: this }) : null]),
			},
			ColumnType.Background,
			size.second_col_min_width,
			size.second_col_max_width,
			() => {
				return this.cache.selectedFolder ? getFolderName(this.cache.selectedFolder) : ""
			},
		)

		const mailColumnTitle = () => {
			const selectedEntities = this.cache.mailList ? this.cache.mailList.list.getSelectedEntities() : []

			if (selectedEntities.length > 0) {
				return selectedEntities[0].subject
			} else {
				return ""
			}
		}

		this.mailColumn = new ViewColumn(
			{
				view: () => {
					return m(
						".mail",
						this.conversationViewModel != null
							? m(ConversationViewer, {
									// Re-create the whole viewer and its vnode tree if email has changed
									key: getElementId(this.conversationViewModel.primaryMail),
									viewModel: this.conversationViewModel,
							  })
							: m(MultiMailViewer, {
									selectedEntities: this.cache.mailList?.list.getSelectedEntities() ?? [],
									selectNone: () => {
										this.cache.mailList?.list.selectNone()
									},
									loadAll: () => this.loadAll(),
									stopLoadAll: () => (this.loadingAllForMailList = null),
									loadingAll:
										this.loadingAllForMailList != null && this.loadingAllForMailList === this.cache.mailList?.listId
											? "loading"
											: this.cache.mailList?.list.isLoadedCompletely()
											? "loaded"
											: "can_load",
							  }),
					)
				},
			},
			ColumnType.Background,
			size.third_col_min_width,
			size.third_col_max_width,
			mailColumnTitle,
			() => lang.get("email_label") + " " + mailColumnTitle(),
		)
		this.viewSlider = new ViewSlider([this.folderColumn, this.listColumn, this.mailColumn], "MailView")
		this.viewSlider.focusedColumn = this.viewSlider.columns[0]

		const shortcuts = this._getShortcuts()

		this.oncreate = (vnode) => {
			this.countersStream = locator.mailModel.mailboxCounters.map(m.redraw)
			keyManager.registerShortcuts(shortcuts)
			this.mailboxSubscription = locator.mailModel.mailboxDetails.map((mailboxDetails) => this.onUpdateMailboxDetails(mailboxDetails))

			// If conversationView selection was changed, recreate the view model with the new preference
			if (
				this.conversationViewModel &&
				this.cache.conversationViewPreference != null &&
				this.cache.conversationViewPreference != deviceConfig.getConversationViewShowOnlySelectedMail()
			) {
				const viewModelParams = {
					mail: this.conversationViewModel.primaryMail,
					showFolder: false,
					delayBodyRenderingUntil: Promise.resolve(),
				}
				this.createConversationViewModel(viewModelParams).then(m.redraw)
			}
			this.cache.conversationViewPreference = deviceConfig.getConversationViewShowOnlySelectedMail()
		}

		this.onremove = () => {
			// cancel the loading if we are destroyed
			this.loadingAllForMailList = null

			this.countersStream?.end(true)
			this.countersStream = null

			keyManager.unregisterShortcuts(shortcuts)
			// this is safe to pause because if we are recreated we will subscribe and get a new value right away
			this.mailboxSubscription?.end(true)
		}
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
							this.getMailboxDetails(),
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
					headerView: this.renderHeaderView(),
					rightView: this.renderHeaderRightView(),
					viewSlider: this.viewSlider,
					searchBar: () =>
						m(searchBar, {
							placeholder: lang.get("searchEmails_placeholder"),
						}),
					...attrs.header,
				}),
				bottomNav:
					styles.isSingleColumnLayout() && this.viewSlider.focusedColumn === this.mailColumn && this.conversationViewModel
						? m(MobileMailActionBar, { viewModel: this.conversationViewModel.primaryViewModel() })
						: m(BottomNav),
			}),
		)
	}

	async loadAll() {
		if (this.loadingAllForMailList != null) return
		this.loadingAllForMailList = this.cache.mailList?.listId ?? null
		this.cache.mailList?.list.selectAll()
		try {
			// use cache reference always to not capture the list when the cache is already changed
			while (
				this.cache.mailList &&
				this.loadingAllForMailList &&
				this.cache.mailList?.listId === this.loadingAllForMailList &&
				!this.cache.mailList.list.isLoadedCompletely()
			) {
				const mailList = this.cache.mailList
				// even if the list will change it will be another list so it's safe to call selectAll() still
				await mailList.list.loadMoreItems()
				mailList.list.selectAll()
			}
		} finally {
			this.loadingAllForMailList = null
			m.redraw()
		}
	}

	private onUpdateMailboxDetails(mailboxDetails: MailboxDetail[]) {
		for (const detail of mailboxDetails) {
			for (const { folder } of detail.folders.getIndentedList()) {
				const folderElementId = getElementId(folder)
				this.folderToUrl[folderElementId] = this.folderToUrl[folderElementId] ?? this.defaultUrlForFolder(folder)
			}
		}
		if (this.cache.selectedFolder) {
			// find the folder in the new folder list that was previously selected
			let currentlySelectedFolder = locator.mailModel.getMailFolder(this.cache.selectedFolder.mails)

			if (currentlySelectedFolder) {
				this.cache.selectedFolder = currentlySelectedFolder
			} else {
				const inboxFolder = assertSystemFolderOfType(mailboxDetails[0].folders, MailFolderType.INBOX)
				const url = this.folderToUrl[getElementId(inboxFolder)]

				if (isSelectedPrefix(MAIL_PREFIX)) {
					this.setUrl(url)
				} else {
					assertNotNull(url, "undefined mail url!")
					navButtonRoutes.mailUrl = url
				}
			}
		}
	}

	private defaultUrlForFolder(folder: MailFolder) {
		return `/mail/${folder.mails}`
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	private renderHeaderRightView(): Children {
		const openMailButtonAttrs: ButtonAttrs = {
			label: "newMail_action",
			click: () => this.showNewMailDialog().catch(ofClass(PermissionError, noOp)),
			type: ButtonType.Action,
			icon: () => Icons.PencilSquare,
			colors: ButtonColor.Header,
		}
		return isNewMailActionAvailable() ? m(Button, openMailButtonAttrs) : null
	}

	_getShortcuts(): Array<Shortcut> {
		return [
			{
				key: Keys.N,
				exec: () => {
					this.showNewMailDialog().catch(ofClass(PermissionError, noOp))
				},
				enabled: () => !!this.cache.selectedFolder && isNewMailActionAvailable(),
				help: "newMail_action",
			},
			{
				key: Keys.DELETE,
				exec: () => {
					this.cache.mailList && this.deleteMails(this.cache.mailList.list.getSelectedEntities())
				},
				help: "deleteEmails_action",
			},
			{
				key: Keys.A,
				exec: () => {
					this.cache.mailList && archiveMails(this.cache.mailList.list.getSelectedEntities())
					return true
				},
				help: "archive_action",
				enabled: () => locator.logins.isInternalUserLoggedIn(),
			},
			{
				key: Keys.I,
				exec: () => {
					this.cache.mailList && moveToInbox(this.cache.mailList.list.getSelectedEntities())
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
					this.cache.mailList && this.toggleUnreadMails(this.cache.mailList.list.getSelectedEntities())
				},
				help: "toggleUnread_action",
			},
			{
				key: Keys.ONE,
				exec: () => {
					this.switchToFolder(MailFolderType.INBOX)
					return true
				},
				help: "switchInbox_action",
			},
			{
				key: Keys.TWO,
				exec: () => {
					this.switchToFolder(MailFolderType.DRAFT)
					return true
				},
				help: "switchDrafts_action",
			},
			{
				key: Keys.THREE,
				exec: () => {
					this.switchToFolder(MailFolderType.SENT)
					return true
				},
				help: "switchSentFolder_action",
			},
			{
				key: Keys.FOUR,
				exec: () => {
					this.switchToFolder(MailFolderType.TRASH)
					return true
				},
				help: "switchTrash_action",
			},
			{
				key: Keys.FIVE,
				exec: () => {
					this.switchToFolder(MailFolderType.ARCHIVE)
					return true
				},
				enabled: () => locator.logins.isInternalUserLoggedIn(),
				help: "switchArchive_action",
			},
			{
				key: Keys.SIX,
				exec: () => {
					this.switchToFolder(MailFolderType.SPAM)
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
						const mailboxDetails = await this.getMailboxDetails()
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
		const mailList = this.cache.mailList
		if (mailList == null) {
			return
		}

		const selectedMails = mailList.list.getSelectedEntities()

		// Render the dropdown at the position of the selected mails in the MailList
		showMoveMailsDropdown(locator.mailModel, mailList.list.getSelectionBounds(), selectedMails)
	}

	private async switchToFolder(folderType: Omit<MailFolderType, MailFolderType.CUSTOM>): Promise<void> {
		const mailboxDetail = assertNotNull(await this.getMailboxDetails())
		m.route.set(this.folderToUrl[getElementId(assertSystemFolderOfType(mailboxDetail.folders, folderType))])
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
			folderToUrl: this.folderToUrl,
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

		if (this.isInitialized() && args.listId && this.cache.mailList && args.listId !== this.cache.mailList.listId) {
			// a mail list is visible and now a new one is selected
			this.showList(args.listId, args.mailId)
		} else if (this.isInitialized() && args.listId && !this.cache.mailList) {
			// the mailbox was loaded and we found the inbox list to show
			this.showList(args.listId, args.mailId)
		} else if (
			this.isInitialized() &&
			args.listId &&
			this.cache.mailList &&
			args.listId === this.cache.mailList.listId &&
			args.mailId &&
			!this.cache.mailList.list.isEntitySelected(args.mailId)
		) {
			// the mail list is visible already, just the selected mail is changed
			this.cache.mailList.list.scrollToIdAndSelect(args.mailId)
		} else if (this.isInitialized() && args.listId && this.cache.mailList && args.listId === this.cache.mailList.listId && !args.mailId) {
			// We have a list ID and it's a current list but we don't have a selected email, like when the last item in the list is
			// deleted.
			// If we are currently focused on the last column (viewer), we instead focus the second column (list).
			if (this.viewSlider.focusedColumn === this.viewSlider.columns[2]) {
				this.viewSlider.focus(this.viewSlider.columns[1])
			}
		} else if (!this.isInitialized()) {
			locator.mailModel.getMailboxDetails().then((mailboxDetails) => {
				const mailboxDetail = getFirstOrThrow(mailboxDetails)
				if (typeof args.listId === "undefined") {
					const inboxFolder = assertSystemFolderOfType(mailboxDetail.folders, MailFolderType.INBOX)
					const inboxFolderId = getElementId(inboxFolder)
					// fall back to the default url if folderToUrl is not populated yet
					this.setUrl(this.folderToUrl[inboxFolderId] ?? this.defaultUrlForFolder(inboxFolder))
				} else {
					if (!this.showList(args.listId, args.mailId)) {
						const inboxFolder = assertSystemFolderOfType(mailboxDetail.folders, MailFolderType.INBOX)
						const inboxFolderId = getElementId(inboxFolder)
						// fall back to the default url if folderToUrl is not populated yet
						this.setUrl(this.folderToUrl[inboxFolderId] ?? this.defaultUrlForFolder(inboxFolder))
					}
				}

				m.redraw()
			})
		}
	}

	private isInitialized(): boolean {
		return locator.mailModel.mailboxDetails() && this.cache.selectedFolder != null
	}

	private setUrl(url: string) {
		assertNotNull(url, "undefined mail url!")
		navButtonRoutes.mailUrl = url

		// do not change the url if the search view is active
		if (m.route.get().startsWith(MAIL_PREFIX)) {
			this.throttledRouteSet(url + location.hash)
		}
	}

	/**
	 * Shows the mail list with the given list id if the list exists.
	 * @param mailListId The list id
	 * @param mailElementId The element to scroll to and select.
	 * @returns True if the list could be shown, i.e. it exists, false otherwise
	 */
	private showList(mailListId: Id, mailElementId: Id | null): boolean {
		this.cache.mailList?.dispose()
		this.cache.mailList = new MailListView(mailListId)
		let folder = locator.mailModel.getMailFolder(mailListId)

		if (folder) {
			this.cache.selectedFolder = folder
			navButtonRoutes.mailUrl = this.folderToUrl[folder._id[1]]

			if (!mailElementId) {
				this.conversationViewModel = null
			}

			this.cache.mailList.list.loadInitial(mailElementId ?? undefined)
			return true
		} else {
			return false
		}
	}

	private async handleFolderDrop(droppedMailId: string, folder: MailFolder) {
		if (!this.cache.mailList) {
			return
		}
		let mailsToMove: Mail[] = []

		// the dropped mail is among the selected mails, move all selected mails
		if (this.cache.mailList.list.isEntitySelected(droppedMailId)) {
			mailsToMove = this.cache.mailList.list.getSelectedEntities()
		} else {
			let entity = this.cache.mailList.list.getEntity(droppedMailId)

			if (entity) {
				mailsToMove.push(entity)
			}
		}

		moveMails({ mailModel: locator.mailModel, mails: mailsToMove, targetMailFolder: folder })
	}

	private async showNewMailDialog(): Promise<void> {
		const mailboxDetails = await this.getMailboxDetails()
		if (mailboxDetails == null) {
			return
		}
		const { newMailEditor } = await import("../editor/MailEditor")
		const dialog = await newMailEditor(mailboxDetails)
		dialog.show()
	}

	private getMailboxDetails(): Promise<MailboxDetail | null> {
		return this.cache.selectedFolder
			? locator.mailModel.getMailboxDetailsForMailListId(this.cache.selectedFolder.mails)
			: locator.mailModel.getUserMailboxDetails()
	}

	private async deleteCustomMailFolder(mailboxDetail: MailboxDetail, folder: MailFolder): Promise<void> {
		if (folder.folderType !== MailFolderType.CUSTOM) {
			throw new Error("Cannot delete non-custom folder: " + String(folder._id))
		}

		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.cache.mailList?.list.selectNone()

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

	async elementSelected(mails: Mail[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean) {
		// Make the animation of switching between list and single email smooth by delaying sanitizing/heavy rendering until the animation is done.
		const animationOverDeferred = defer<void>()
		const mailList = assertNotNull(this.cache.mailList, "Element is selected but no mail list?")

		if (mails.length === 1 && !multiSelectOperation && (selectionChanged || !this.conversationViewModel)) {
			// set or update the visible mail
			const viewModelParams = {
				mail: mails[0],
				showFolder: false,
				delayBodyRenderingUntil: animationOverDeferred.promise,
			}

			// if there's no viewer or the email selection was changed
			if (!this.conversationViewModel || !isSameId(viewModelParams.mail._id, this.conversationViewModel.primaryMail._id)) {
				const mailboxDetails = await locator.mailModel.getMailboxDetailsForMail(viewModelParams.mail)
				if (mailboxDetails == null) {
					this.conversationViewModel = null
				} else {
					await this.createConversationViewModel(viewModelParams)
				}
			}

			const url = `/mail/${mails[0]._id.join("/")}`

			if (this.cache.selectedFolder) {
				this.folderToUrl[this.cache.selectedFolder._id[1]] = url
			}

			this.setUrl(url)

			m.redraw()
		} else if (selectionChanged && (mails.length === 0 || multiSelectOperation) && this.conversationViewModel) {
			// remove the visible mail
			this.conversationViewModel = null
			const url = `/mail/${mailList.listId}`

			if (this.cache.selectedFolder) {
				this.folderToUrl[this.cache.selectedFolder._id[1]] = url
			}

			this.setUrl(url)

			m.redraw()
		} else if (selectionChanged) {
			// update the multi mail viewer
			m.redraw()
		}

		if (this.conversationViewModel && !multiSelectOperation) {
			if (mails[0].unread) {
				// we don't want to wait on this so we can show the viewer
				// even if we're offline and unable to update.
				this.toggleUnreadMails(mails)
			}

			if (elementClicked) {
				await this.viewSlider.focus(this.mailColumn)
			}
		}
		animationOverDeferred.resolve()
	}

	private async createConversationViewModel(viewModelParams: CreateMailViewerOptions) {
		const mailboxDetails = await locator.mailModel.getMailboxDetailsForMail(viewModelParams.mail)
		if (mailboxDetails == null) {
			this.conversationViewModel = null
		} else {
			const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
			this.conversationViewModel = await locator.conversationViewModel(viewModelParams, mailboxDetails, mailboxProperties)
		}
	}

	private async toggleUnreadMails(mails: Mail[]): Promise<void> {
		if (mails.length == 0) {
			return
		}
		// set all selected emails to the opposite of the first email's unread state
		return markMails(locator.entityClient, mails, !mails[0].unread)
	}

	private deleteMails(mails: Mail[]): Promise<boolean> {
		return promptAndDeleteMails(locator.mailModel, mails, noOp)
	}

	async finallyDeleteAllMailsInSelectedFolder(folder: MailFolder): Promise<void> {
		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.cache.mailList?.list.selectNone()

		const mailboxDetail = await this.getMailboxDetails()
		if (mailboxDetail == null) {
			return
		}

		// the request is handled a little differently if it is the system folder vs a subfolder
		if (folder.folderType === MailFolderType.TRASH || folder.folderType === MailFolderType.SPAM) {
			// The request will be handled async by server
			return showProgressDialog("progressDeleting_msg", locator.mailModel.clearFolder(folder)).catch(
				ofClass(PreconditionFailedError, () => Dialog.message("operationStillActive_msg")),
			)
		} else if (
			isSubfolderOfType(mailboxDetail.folders, folder, MailFolderType.TRASH) ||
			isSubfolderOfType(mailboxDetail.folders, folder, MailFolderType.SPAM)
		) {
			// The request will be handled async by server
			return showProgressDialog("progressDeleting_msg", locator.mailModel.finallyDeleteCustomMailFolder(folder)).catch(
				ofClass(PreconditionFailedError, () => Dialog.message("operationStillActive_msg")),
			)
		} else {
			throw new Error(`Cannot delete mails in folder ${String(folder._id)} with type ${folder.folderType}`)
		}
	}

	/**
	 * Used by Header to figure out when content needs to be injected there
	 * @returns {Children} Mithril children or null
	 */
	private renderHeaderView(): Children {
		const selectedEntities = this.cache.mailList?.list.getSelectedEntities() ?? []
		return this.viewSlider.getVisibleBackgroundColumns().length === 1 && this.cache.mailList?.list.isMobileMultiSelectionActionActive()
			? m(
					MultiSelectionBar,
					{
						selectNoneHandler: () => this.cache.mailList?.list.selectNone(),
						text: String(selectedEntities.length),
					},
					m(ActionBar, { buttons: getMultiMailViewerActionButtonAttrs(selectedEntities, () => this.cache.mailList?.list.selectNone(), false) }),
			  )
			: null
	}

	private async showFolderAddEditDialog(mailGroupId: Id, folder: MailFolder | null, parentFolder: MailFolder | null) {
		const mailboxDetail = await locator.mailModel.getMailboxDetailsForMailGroup(mailGroupId)
		await showEditFolderDialog(mailboxDetail, folder, parentFolder)
	}
}
