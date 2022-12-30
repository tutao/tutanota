import m, { Children, Vnode } from "mithril"
import { ViewSlider } from "../../gui/nav/ViewSlider.js"
import { ColumnType, ViewColumn } from "../../gui/base/ViewColumn"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import type { ButtonAttrs } from "../../gui/base/Button.js"
import { Button, ButtonColor, ButtonType } from "../../gui/base/Button.js"
import type { NavButtonAttrs } from "../../gui/base/NavButton.js"
import { isSelectedPrefix, NavButtonColor } from "../../gui/base/NavButton.js"
import { MailViewer } from "./MailViewer"
import { Dialog } from "../../gui/base/Dialog"
import { FeatureType, Keys, MailFolderType } from "../../api/common/TutanotaConstants"
import { BaseHeaderAttrs, header } from "../../gui/Header.js"
import type { Mail, MailFolder } from "../../api/entities/tutanota/TypeRefs.js"
import type { lazy } from "@tutao/tutanota-utils"
import { assertNotNull, defer, getFirstOrThrow, noOp, ofClass } from "@tutao/tutanota-utils"
import { MailListView } from "./MailListView"
import { assertMainOrNode, isApp } from "../../api/common/Env"
import type { Shortcut } from "../../misc/KeyManager"
import { keyManager } from "../../misc/KeyManager"
import { MultiMailViewer } from "./MultiMailViewer"
import { logins } from "../../api/main/LoginController"
import { Icons } from "../../gui/base/icons/Icons"
import { NotFoundError, PreconditionFailedError } from "../../api/common/error/RestError"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import {
	allMailsAllowedInsideFolder,
	canDoDragAndDropExport,
	getFolderIcon,
	getFolderName,
	getMailboxName,
	getPathToFolderString,
	markMails,
	MAX_FOLDER_INDENT_LEVEL,
} from "../model/MailUtils"
import type { MailboxDetail } from "../model/MailModel"
import { locator } from "../../api/main/MainLocator"
import { ActionBar } from "../../gui/base/ActionBar"
import { MultiSelectionBar } from "../../gui/base/MultiSelectionBar"
import { PermissionError } from "../../api/common/error/PermissionError"
import { MAIL_PREFIX, navButtonRoutes, throttleRoute } from "../../misc/RouteChange"
import { attachDropdown } from "../../gui/base/Dropdown.js"
import { MailFolderRow } from "./MailFolderRow"
import { styles } from "../../gui/styles"
import { size } from "../../gui/size"
import { FolderColumnView } from "../../gui/FolderColumnView.js"
import { UserError } from "../../api/main/UserError"
import { showUserError } from "../../misc/ErrorHandlerImpl"
import { archiveMails, moveMails, moveToInbox, promptAndDeleteMails, showMoveMailsDropdown } from "./MailGuiUtils"
import { elementIdPart, getElementId, isSameId } from "../../api/common/utils/EntityUtils"
import { isNewMailActionAvailable } from "../../gui/nav/NavFunctions"
import { SidebarSection } from "../../gui/SidebarSection"
import { CancelledError } from "../../api/common/error/CancelledError"
import Stream from "mithril/stream"
import { MailViewerViewModel } from "./MailViewerViewModel"
import { readLocalFiles } from "../../file/FileController.js"
import { IconButton, IconButtonAttrs } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { BottomNav } from "../../gui/nav/BottomNav.js"
import { MobileMailActionBar } from "./MobileMailActionBar.js"
import { FolderSubtree, FolderSystem } from "../model/FolderSystem.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import { DrawerMenuAttrs } from "../../gui/nav/DrawerMenu.js"
import { BaseTopLevelView } from "../../gui/BaseTopLevelView.js"
import { CurrentView, TopLevelAttrs } from "../../TopLevelView.js"

assertMainOrNode()

type Counters = Record<string, number>

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
	mailViewerViewModel: MailViewerViewModel | null
}

export interface MailViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	cache: MailViewCache
	header: BaseHeaderAttrs
}

/**
 * Top-level view for displaying mailboxes.
 */
export class MailView extends BaseTopLevelView implements CurrentView<MailViewAttrs> {
	private readonly listColumn: ViewColumn
	private readonly folderColumn: ViewColumn
	private readonly mailColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	cache: MailViewCache

	readonly onremove: CurrentView["onremove"]

	/**
	 * We remember the last URL used for each folder so if we switch between folders we can keep the selected mail.
	 * There's a similar (but different) hacky mechanism where we store last URL but per each top-level view: navButtonRoutes. This one is per folder.
	 */
	private readonly folderToUrl: Record<Id, string>
	private readonly actionBarButtons: lazy<IconButtonAttrs[]>
	private readonly throttledRouteSet: (newRoute: string) => void
	private countersStream: Stream<unknown> | null = null

	private multiMailViewer: MultiMailViewer
	private expandedState: Set<Id>

	get mailViewerViewModel(): MailViewerViewModel | null {
		return this.cache.mailViewerViewModel
	}

	set mailViewerViewModel(viewModel: MailViewerViewModel | null) {
		this.cache.mailViewerViewModel?.dispose()
		this.cache.mailViewerViewModel = viewModel
	}

	constructor(vnode: Vnode<MailViewAttrs>) {
		super()
		this.folderToUrl = {}
		this.throttledRouteSet = throttleRoute()
		this.expandedState = new Set(deviceConfig.getExpandedFolders(logins.getUserController().userId))
		this.cache = vnode.attrs.cache

		this.folderColumn = new ViewColumn(
			{
				view: () => {
					const details = locator.mailModel.mailboxDetails() ?? []
					return m(FolderColumnView, {
						drawer: vnode.attrs.drawerAttrs,
						button:
							!styles.isUsingBottomNavigation() && isNewMailActionAvailable()
								? {
										label: "newMail_action",
										click: () => this.showNewMailDialog().catch(ofClass(PermissionError, noOp)),
								  }
								: null,
						content: details.map((mailboxDetail) => {
							return m(
								SidebarSection,
								{
									name: () => getMailboxName(logins, mailboxDetail),
								},
								this.createMailboxFolderItems(mailboxDetail),
							)
						}),
						ariaLabel: "folderTitle_label",
					})
				},
			},
			ColumnType.Foreground,
			size.first_col_min_width,
			size.first_col_max_width,
			() => lang.get("folderTitle_label"),
		)
		this.listColumn = new ViewColumn(
			{
				view: () => m(".list-column", [this.cache.mailList ? m(this.cache.mailList) : null]),
			},
			ColumnType.Background,
			size.second_col_min_width,
			size.second_col_max_width,
			() => {
				return this.cache.selectedFolder ? getFolderName(this.cache.selectedFolder) : ""
			},
		)
		this.multiMailViewer = new MultiMailViewer(this)
		this.actionBarButtons = () => this.multiMailViewer.getActionBarButtons()

		const mailColumnTitle = () => {
			const selectedEntities = this.cache.mailList ? this.cache.mailList.list.getSelectedEntities() : []

			if (selectedEntities.length > 0) {
				const loadedEntities = this.cache.mailList?.list.getLoadedEntities() ?? []
				let selectedIndex = loadedEntities.indexOf(selectedEntities[0]) + 1
				return selectedIndex + "/" + loadedEntities.length
			} else {
				return ""
			}
		}

		this.mailColumn = new ViewColumn(
			{
				view: () =>
					m(
						".mail",
						this.mailViewerViewModel != null
							? m(MailViewer, {
									viewModel: this.mailViewerViewModel,
							  })
							: m(this.multiMailViewer),
					),
			},
			ColumnType.Background,
			size.third_col_min_width,
			size.third_col_max_width,
			mailColumnTitle,
			() => lang.get("email_label") + " " + mailColumnTitle(),
		)
		this.viewSlider = new ViewSlider([this.folderColumn, this.listColumn, this.mailColumn], "MailView")

		const mailboxDetailsStream = locator.mailModel.mailboxDetails.map((mailboxDetails) => this.onUpdateMailboxDetails(mailboxDetails))

		const shortcuts = this._getShortcuts()

		this.oncreate = (vnode) => {
			super.oncreate(vnode)
			this.countersStream = locator.mailModel.mailboxCounters.map(m.redraw)
			keyManager.registerShortcuts(shortcuts)
		}

		this.onremove = () => {
			this.countersStream?.end(true)
			this.countersStream = null

			keyManager.unregisterShortcuts(shortcuts)
			// this is safe to pause because if we are recreated we will subscribe and get a new value right away
			mailboxDetailsStream.end(true)
		}
	}

	view({attrs}: Vnode<MailViewAttrs>): Children {
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
								newMailEditorFromTemplate(mailbox, {}, "", appendEmailSignature("", logins.getUserController().props), dataFiles).then(
									(dialog) => dialog.show(),
								)
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
				header: m(header, {
					headerView: this.renderHeaderView(),
					rightView: this.renderHeaderRightView(),
					viewSlider: this.viewSlider,
					...attrs.header,
				}),
				bottomNav:
					styles.isSingleColumnLayout() && this.viewSlider.focusedColumn === this.mailColumn && this.mailViewerViewModel
						? m(MobileMailActionBar, { viewModel: this.mailViewerViewModel })
						: m(BottomNav),
			}),
		)
	}

	private onUpdateMailboxDetails(mailboxDetails: MailboxDetail[]) {
		for (const detail of mailboxDetails) {
			for (const { folder } of detail.folders.getIndentedList()) {
				const folderElementId = getElementId(folder)
				this.folderToUrl[folderElementId] = this.folderToUrl[folderElementId] ?? `/mail/${folder.mails}`
			}
		}
		if (this.cache.selectedFolder) {
			// find the folder in the new folder list that was previously selected
			let currentlySelectedFolder = locator.mailModel.getMailFolder(this.cache.selectedFolder.mails)

			if (currentlySelectedFolder) {
				this.cache.selectedFolder = currentlySelectedFolder
			} else {
				const inboxFolder = mailboxDetails[0].folders.getSystemFolderByType(MailFolderType.INBOX)
				const url = this.folderToUrl[getElementId(inboxFolder)]

				if (isSelectedPrefix(MAIL_PREFIX)) {
					this.setUrl(url)
				} else {
					navButtonRoutes.mailUrl = url
				}
			}
		}
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
				enabled: () => logins.isInternalUserLoggedIn(),
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
				enabled: () => logins.isInternalUserLoggedIn(),
				help: "switchArchive_action",
			},
			{
				key: Keys.SIX,
				exec: () => {
					this.switchToFolder(MailFolderType.SPAM)
					return true
				},
				enabled: () => logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.InternalCommunication),
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
						openPressReleaseEditor(await this.getMailboxDetails())
						resolve(null)
					})
					return true
				},
				help: "emptyString_msg",
				enabled: () => logins.isEnabled(FeatureType.Newsletter),
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
		const mailboxDetail = await this.getMailboxDetails()
		m.route.set(this.folderToUrl[getElementId(mailboxDetail.folders.getSystemFolderByType(folderType))])
	}

	private createMailboxFolderItems(mailboxDetail: MailboxDetail): Children {
		const groupCounters = locator.mailModel.mailboxCounters()[mailboxDetail.mailGroup._id] || {}
		// Important: this array is keyed so each item must have a key and `null` cannot be in the array
		// So instead we push or not push into array
		const customSystems = mailboxDetail.folders.customSubtrees
		const systemSystems = mailboxDetail.folders.systemSubtrees
		const children: Children = []
		children.push(
			...systemSystems.map((s) => {
				const id = getElementId(s.folder)
				const count = groupCounters[s.folder.mails]
				const button: NavButtonAttrs = {
					label: () => getFolderName(s.folder),
					icon: getFolderIcon(s.folder),
					href: () => this.folderToUrl[s.folder._id[1]],
					isSelectedPrefix: MAIL_PREFIX + "/" + s.folder.mails,
					colors: NavButtonColor.Nav,
					click: () => this.viewSlider.focus(this.listColumn),
					dropHandler: (droppedMailId) => this.handleFolderDrop(droppedMailId, s.folder),
				}
				return m(MailFolderRow, {
					count: count,
					button,
					rightButton: null,
					key: id,
					expanded: null,
					indentationLevel: 0,
					onExpanderClick: noOp,
				})
			}),
		)
		if (logins.isInternalUserLoggedIn()) {
			children.push(
				m(
					SidebarSection,
					{
						name: "yourFolders_action",
						button: m(IconButton, this.createFolderAddButton(mailboxDetail.mailGroup._id, null, mailboxDetail.folders)),
						key: "yourFolders", // we need to set a key because folder rows also have a key.
					},
					this.renderCustomFolderTree(customSystems, groupCounters, mailboxDetail),
				),
			)
		}
		return children
	}

	private renderCustomFolderTree(
		subSystems: readonly FolderSubtree[],
		groupCounters: Counters,
		mailboxDetail: MailboxDetail,
		indentationLevel: number = 0,
	): Children[] | null {
		return subSystems.map((system) => {
			const id = getElementId(system.folder)
			const button: NavButtonAttrs = {
				label: () => getFolderName(system.folder),
				icon: getFolderIcon(system.folder),
				href: () => this.folderToUrl[system.folder._id[1]],
				isSelectedPrefix: MAIL_PREFIX + "/" + system.folder.mails,
				colors: NavButtonColor.Nav,
				click: () => this.viewSlider.focus(this.listColumn),
				dropHandler: (droppedMailId) => this.handleFolderDrop(droppedMailId, system.folder),
			}
			const currentExpansionState = this.expandedState.has(getElementId(system.folder)) ?? false //default is false
			const hasChildren = system.children.length > 0
			const summedCount = !currentExpansionState && hasChildren ? this.getTotalFolderCounter(groupCounters, system) : groupCounters[system.folder.mails]
			return m.fragment(
				{
					key: id,
				},
				[
					m(MailFolderRow, {
						count: summedCount,
						button,
						rightButton: this.createFolderMoreButton(mailboxDetail.mailGroup._id, system.folder, mailboxDetail.folders),
						expanded: hasChildren ? currentExpansionState : null,
						indentationLevel: Math.min(indentationLevel, MAX_FOLDER_INDENT_LEVEL),
						onExpanderClick: hasChildren ? () => this.setExpandedState(system, currentExpansionState) : noOp,
					}),
					hasChildren && currentExpansionState
						? this.renderCustomFolderTree(system.children, groupCounters, mailboxDetail, indentationLevel + 1)
						: null,
				],
			)
		})
	}

	private setExpandedState(system: FolderSubtree, currentExpansionState: boolean) {
		currentExpansionState ? this.expandedState.delete(getElementId(system.folder)) : this.expandedState.add(getElementId(system.folder))
		deviceConfig.setExpandedFolders(logins.getUserController().userId, [...this.expandedState])
	}

	private getTotalFolderCounter(counters: Counters, system: FolderSubtree): number {
		return (counters[system.folder.mails] ?? 0) + system.children.reduce((acc, child) => acc + this.getTotalFolderCounter(counters, child), 0)
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
		} else if (args.action === "supportMail" && logins.isGlobalAdminUserLoggedIn()) {
			import("../editor/MailEditor").then(({ writeSupportMail }) => writeSupportMail())
		}

		if (isApp()) {
			let userGroupInfo = logins.getUserController().userGroupInfo
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
					const inboxFolder = mailboxDetail.folders.getSystemFolderByType(MailFolderType.INBOX)
					const inboxFolderId = getElementId(inboxFolder)
					this.setUrl(this.folderToUrl[inboxFolderId])
				} else {
					if (!this.showList(args.listId, args.mailId)) {
						const inboxFolder = mailboxDetail.folders.getSystemFolderByType(MailFolderType.INBOX)
						const inboxFolderId = getElementId(inboxFolder)
						this.setUrl(this.folderToUrl[inboxFolderId])
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
		this.cache.mailList = new MailListView(mailListId, this)
		let folder = locator.mailModel.getMailFolder(mailListId)

		if (folder) {
			this.cache.selectedFolder = folder
			navButtonRoutes.mailUrl = this.folderToUrl[folder._id[1]]

			if (!mailElementId) {
				this.mailViewerViewModel = null
			}

			this.cache.mailList.list.loadInitial(mailElementId ?? undefined)
			return true
		} else {
			return false
		}
	}

	private handleFolderDrop(droppedMailId: string, folder: MailFolder) {
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

		// do not allow moving folders to unallowed locations
		if (!allMailsAllowedInsideFolder(mailsToMove, folder)) {
			return
		}

		moveMails({ mailModel: locator.mailModel, mails: mailsToMove, targetMailFolder: folder })
	}

	private createFolderAddButton(mailGroupId: Id, parentFolder: MailFolder | null, folderSystem: FolderSystem): IconButtonAttrs {
		return {
			title: "addFolder_action",
			click: () => {
				return this.showCreateFolderDialog(mailGroupId, parentFolder, folderSystem)
			},
			icon: Icons.Add,
			size: ButtonSize.Compact,
		}
	}

	private showCreateFolderDialog(mailGroupId: string, parentFolder: MailFolder | null, folderSystem: FolderSystem) {
		const infoMsg = parentFolder ? () => getPathToFolderString(folderSystem, parentFolder) : null
		const parentFolderId: IdTuple | null = parentFolder ? parentFolder._id : null
		Dialog.showProcessTextInputDialog(
			"folderNameCreate_label",
			"folderName_label",
			infoMsg,
			"",
			async (name) => {
				if (parentFolderId) {
					this.expandedState.add(elementIdPart(parentFolderId))
				}
				locator.mailFacade.createMailFolder(name, parentFolderId, mailGroupId)
			},
			(name) => this.checkFolderName(name, mailGroupId, parentFolderId),
		)
	}

	private createFolderMoreButton(mailGroupId: Id, folder: MailFolder, folderSystem: FolderSystem): IconButtonAttrs {
		return attachDropdown({
			mainButtonAttrs: {
				title: "more_label",
				icon: Icons.More,
				colors: ButtonColor.Nav,
				size: ButtonSize.Compact,
			},
			childAttrs: () => [
				{
					label: "rename_action",
					icon: Icons.Edit,
					click: () => {
						return Dialog.showProcessTextInputDialog(
							"folderNameRename_label",
							"folderName_label",
							null,
							getFolderName(folder),
							(newName) => {
								const renamedFolder: MailFolder = Object.assign({}, folder, {
									name: newName,
								})
								return locator.entityClient.update(renamedFolder)
							},
							(name) => this.checkFolderName(name, mailGroupId, folder.parentFolder),
						)
					},
				},
				{
					label: "addFolder_action",
					icon: Icons.Add,
					click: () => {
						this.showCreateFolderDialog(mailGroupId, folder, folderSystem)
					},
				},
				{
					label: "delete_action",
					icon: Icons.Trash,
					click: () => {
						// so far it is not possible to delete folders that contain subfolders
						if (folderSystem.getCustomFoldersOfParent(folder._id).length > 0) {
							Dialog.message("cannotDeleteFoldersWithSubfolders_msg")
							return
						}
						Dialog.confirm(() =>
							lang.get("confirmDeleteFinallyCustomFolder_msg", {
								"{1}": getFolderName(folder),
							}),
						).then((confirmed) => {
							if (confirmed) {
								this.finallyDeleteCustomMailFolder(folder)
							}
						})
					},
				},
			],
		})
	}

	private showNewMailDialog(): Promise<Dialog> {
		return Promise.all([this.getMailboxDetails(), import("../editor/MailEditor")])
			.then(([mailboxDetails, { newMailEditor }]) => newMailEditor(mailboxDetails))
			.then((dialog) => dialog.show())
	}

	private getMailboxDetails(): Promise<MailboxDetail> {
		return this.cache.selectedFolder
			? locator.mailModel.getMailboxDetailsForMailListId(this.cache.selectedFolder.mails)
			: locator.mailModel.getUserMailboxDetails()
	}

	private checkFolderName(name: string, mailGroupId: Id, parentFolderId: IdTuple | null): Promise<TranslationKey | null> {
		return locator.mailModel.getMailboxDetailsForMailGroup(mailGroupId).then((mailboxDetails) => {
			if (name.trim() === "") {
				return "folderNameNeutral_msg"
			} else if (mailboxDetails.folders.getCustomFoldersOfParent(parentFolderId).some((f) => f.name === name)) {
				return "folderNameInvalidExisting_msg"
			} else {
				return null
			}
		})
	}

	private finallyDeleteCustomMailFolder(folder: MailFolder): Promise<void> {
		if (folder.folderType !== MailFolderType.CUSTOM) {
			throw new Error("Cannot delete non-custom folder: " + String(folder._id))
		}

		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.cache.mailList?.list.selectNone()
		return locator.mailModel
			.deleteFolder(folder)
			.catch(ofClass(NotFoundError, () => console.log("mail folder already deleted")))
			.catch(ofClass(PreconditionFailedError, () => Dialog.message("operationStillActive_msg")))
	}

	logout() {
		m.route.set("/")
	}

	async elementSelected(mails: Mail[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean) {
		// Make the animation of switching between list and single email smooth by delaying sanitizing/heavy rendering until the animation is done.
		const animationOverDeferred = defer<void>()
		const mailList = assertNotNull(this.cache.mailList, "Element is selected but no mail list?")

		if (mails.length === 1 && !multiSelectOperation && (selectionChanged || !this.mailViewerViewModel)) {
			// set or update the visible mail

			const viewModelParams = {
				mail: mails[0],
				showFolder: false,
				delayBodyRenderingUntil: animationOverDeferred.promise,
			}

			if (this.mailViewerViewModel && isSameId(viewModelParams.mail._id, this.mailViewerViewModel.mail._id)) {
				// FIXME: why?? it is the same email and if it was updated we update it elsewhere
				// this.mailViewerViewModel.updateMail(viewModelParams)
			} else {
				const mailboxDetails = await locator.mailModel.getMailboxDetailsForMail(viewModelParams.mail)
				const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
				this.mailViewerViewModel = await locator.mailViewerViewModel(viewModelParams, mailboxDetails, mailboxProperties)
			}

			const url = `/mail/${mails[0]._id.join("/")}`

			if (this.cache.selectedFolder) {
				this.folderToUrl[this.cache.selectedFolder._id[1]] = url
			}

			this.setUrl(url)

			m.redraw()
		} else if (selectionChanged && (mails.length === 0 || multiSelectOperation) && this.mailViewerViewModel) {
			// remove the visible mail
			this.mailViewerViewModel = null
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

		if (this.mailViewerViewModel && !multiSelectOperation) {
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

	finallyDeleteAllMailsInSelectedFolder(folder: MailFolder): Promise<void> {
		if (folder.folderType !== MailFolderType.TRASH && folder.folderType !== MailFolderType.SPAM) {
			throw new Error(`Cannot delete mails in folder ${String(folder._id)} with type ${folder.folderType}`)
		}

		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.cache.mailList?.list.selectNone()

		// The request will be handled async by server
		return showProgressDialog("progressDeleting_msg", locator.mailModel.clearFolder(folder)).catch(
			ofClass(PreconditionFailedError, () => Dialog.message("operationStillActive_msg")),
		)
	}

	/**
	 * Used by Header to figure out when content needs to be injected there
	 * @returns {Children} Mithril children or null
	 */
	private renderHeaderView(): Children {
		return this.viewSlider.getVisibleBackgroundColumns().length === 1 && this.cache.mailList?.list.isMobileMultiSelectionActionActive()
			? m(
					MultiSelectionBar,
					{
						selectNoneHandler: () => this.cache.mailList?.list.selectNone(),
						text: String(this.cache.mailList.list.getSelectedEntities().length),
					},
					m(ActionBar, { buttons: this.actionBarButtons() }),
			  )
			: null
	}
}
