import m, {Children} from "mithril"
import {ViewSlider} from "../../gui/nav/ViewSlider.js"
import {ColumnType, ViewColumn} from "../../gui/base/ViewColumn"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import type {ButtonAttrs} from "../../gui/base/Button.js"
import {Button, ButtonColor, ButtonType} from "../../gui/base/Button.js"
import type {NavButtonAttrs} from "../../gui/base/NavButton.js"
import {isNavButtonSelected, isSelectedPrefix, NavButtonColor} from "../../gui/base/NavButton.js"
import {createMailViewerViewModel, MailViewer} from "./MailViewer"
import {Dialog} from "../../gui/base/Dialog"
import {FeatureType, Keys, MailFolderType, OperationType} from "../../api/common/TutanotaConstants"
import {CurrentView, header} from "../../gui/Header.js"
import type {Mail, MailFolder} from "../../api/entities/tutanota/TypeRefs.js"
import {MailTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import type {lazy} from "@tutao/tutanota-utils"
import {assertNotNull, defer, noOp, ofClass, promiseMap} from "@tutao/tutanota-utils"
import {MailListView} from "./MailListView"
import {assertMainOrNode, isApp} from "../../api/common/Env"
import type {Shortcut} from "../../misc/KeyManager"
import {keyManager} from "../../misc/KeyManager"
import {MultiMailViewer} from "./MultiMailViewer"
import {logins} from "../../api/main/LoginController"
import {Icons} from "../../gui/base/icons/Icons"
import {NotFoundError, PreconditionFailedError} from "../../api/common/error/RestError"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import {
	canDoDragAndDropExport,
	getFolder,
	getFolderIcon,
	getFolderName,
	getInboxFolder,
	getMailboxName,
	getSortedCustomFolders,
	getSortedSystemFolders,
	markMails,
} from "../model/MailUtils"
import type {MailboxDetail} from "../model/MailModel"
import {locator} from "../../api/main/MainLocator"
import {ActionBar} from "../../gui/base/ActionBar"
import {MultiSelectionBar} from "../../gui/base/MultiSelectionBar"
import type {EntityUpdateData} from "../../api/main/EventController"
import {isUpdateForTypeRef} from "../../api/main/EventController"
import {PermissionError} from "../../api/common/error/PermissionError"
import {MAIL_PREFIX, navButtonRoutes, throttleRoute} from "../../misc/RouteChange"
import {attachDropdown, DomRectReadOnlyPolyfilled, Dropdown} from "../../gui/base/Dropdown.js"
import {MailFolderRow} from "./MailFolderRow"
import {styles} from "../../gui/styles"
import {size} from "../../gui/size"
import {FolderColumnView} from "../../gui/FolderColumnView.js"
import {modal} from "../../gui/base/Modal"
import {UserError} from "../../api/main/UserError"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {archiveMails, moveMails, moveToInbox, promptAndDeleteMails} from "./MailGuiUtils"
import {getListId, isSameId} from "../../api/common/utils/EntityUtils"
import {isNewMailActionAvailable} from "../../gui/nav/NavFunctions"
import {SidebarSection} from "../../gui/SidebarSection"
import {CancelledError} from "../../api/common/error/CancelledError"
import Stream from "mithril/stream";
import {MailViewerViewModel} from "./MailViewerViewModel"
import {isOfflineError} from "../../api/common/utils/ErrorCheckUtils.js"
import {readLocalFiles} from "../../file/FileController.js"

assertMainOrNode()

type MailFolderRowData = {
	id: Id
	button: NavButtonAttrs
	folder: MailFolder
}

type MailboxSection = {
	label: lazy<string>
	systemFolderButtons: MailFolderRowData[]
	customFolderButtons: MailFolderRowData[]
	folderAddButton: ButtonAttrs
}

/**
 * Top-level view for displaying mailboxes.
 */
export class MailView implements CurrentView {
	private readonly listColumn: ViewColumn
	private readonly folderColumn: ViewColumn
	private readonly mailColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	// Not initialized until we get list id from updateUrl and/or getMailboxDetails()
	mailList: MailListView | null = null
	readonly view: CurrentView["view"]
	selectedFolder: MailFolder | null = null

	readonly oncreate: CurrentView["oncreate"]
	readonly onremove: CurrentView["onremove"]
	/**  mailGroupId -> section */
	private readonly mailboxSections: Map<Id, MailboxSection>

	/**
	 * We remember the last URL used for each folder so if we switch between folders we can keep the selected mail.
	 * There's a similar (but different) hacky mechanism where we store last URL but per each top-level view: navButtonRoutes. This one is per folder.
	 */
	private readonly folderToUrl: Record<Id, string>
	private readonly actionBarButtons: lazy<ButtonAttrs[]>
	private readonly throttledRouteSet: (newRoute: string) => void
	private countersStream: Stream<unknown> | null = null

	private multiMailViewer: MultiMailViewer
	private _mailViewerViewModel: MailViewerViewModel | null = null

	get mailViewerViewModel(): MailViewerViewModel | null {
		return this._mailViewerViewModel
	}

	set mailViewerViewModel(viewModel: MailViewerViewModel | null) {
		if (this._mailViewerViewModel != null) {
			this._mailViewerViewModel.dispose()
		}
		this._mailViewerViewModel = viewModel
	}

	constructor() {
		this.mailboxSections = new Map()
		this.folderToUrl = {}
		this.throttledRouteSet = throttleRoute()
		this.folderColumn = new ViewColumn(
			{
				view: () =>
					m(FolderColumnView, {
						button:
							!styles.isUsingBottomNavigation() && isNewMailActionAvailable()
								? {
									label: "newMail_action",
									click: () => this.showNewMailDialog().catch(ofClass(PermissionError, noOp)),
								}
								: null,
						content: Array.from(this.mailboxSections.entries()).map(([mailGroupId, mailboxSection]) => {
							return m(
								SidebarSection,
								{
									name: mailboxSection.label,
								},
								this.createMailboxFolderItems(
									mailGroupId,
									mailboxSection.systemFolderButtons,
									mailboxSection.customFolderButtons,
									mailboxSection.folderAddButton,
								),
							)
						}),
						ariaLabel: "folderTitle_label",
					}),
			},
			ColumnType.Foreground,
			size.first_col_min_width,
			size.first_col_max_width,
			() => lang.get("folderTitle_label"),
		)
		this.listColumn = new ViewColumn(
			{
				view: () => m(".list-column", [this.mailList ? m(this.mailList) : null]),
			},
			ColumnType.Background,
			size.second_col_min_width,
			size.second_col_max_width,
			() => {
				return this.selectedFolder ? getFolderName(this.selectedFolder) : ""
			},
		)
		this.multiMailViewer = new MultiMailViewer(this)
		this.actionBarButtons = () => this.multiMailViewer.getActionBarButtons()

		const mailColumnTitle = () => {
			const selectedEntities = this.mailList ? this.mailList.list.getSelectedEntities() : []

			if (selectedEntities.length > 0) {
				const loadedEntities = this.mailList?.list.getLoadedEntities() ?? []
				let selectedIndex = loadedEntities.indexOf(selectedEntities[0]) + 1
				return selectedIndex + "/" + loadedEntities.length
			} else {
				return ""
			}
		}

		this.mailColumn = new ViewColumn(
			{
				view: () => m(
					".mail",
					this.mailViewerViewModel != null
						? m(MailViewer, {
							viewModel: this.mailViewerViewModel
						})
						: m(this.multiMailViewer)
				),
			},
			ColumnType.Background,
			size.third_col_min_width,
			size.third_col_max_width,
			mailColumnTitle,
			() => lang.get("email_label") + " " + mailColumnTitle(),
		)
		this.viewSlider = new ViewSlider(header, [this.folderColumn, this.listColumn, this.mailColumn], "MailView")

		this.view = (): Children => {
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
								   .then(([mailbox, dataFiles, {appendEmailSignature}, {newMailEditorFromTemplate}]) => {
									   newMailEditorFromTemplate(
										   mailbox,
										   {},
										   "",
										   appendEmailSignature("", logins.getUserController().props),
										   dataFiles,
									   ).then(dialog => dialog.show())
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
				m(this.viewSlider),
			)
		}

		// do not stop observing the mailboxDetails when this view is invisible because the view is cached and switching back to this view while the mailboxes have changed leads to errors
		locator.mailModel.mailboxDetails.map(mailboxDetails => {
			for (let newMailboxDetail of mailboxDetails) {
				const section = this.mailboxSections.get(newMailboxDetail.mailGroup._id)

				if (section) {
					section.customFolderButtons = this.createFolderButtons(getSortedCustomFolders(newMailboxDetail.folders))
				} else {
					this.mailboxSections.set(newMailboxDetail.mailGroup._id, this.createMailboxSection(newMailboxDetail))
				}
			}

			for (let mailGroupId of this.mailboxSections.keys()) {
				if (mailboxDetails.find(mailboxDetail => mailboxDetail.mailGroup._id === mailGroupId) == null) {
					this.mailboxSections.delete(mailGroupId)
				}
			}

			if (this.selectedFolder) {
				// find the folder in the new folder list that was previously selected
				let currentlySelectedFolder = locator.mailModel.getMailFolder(this.selectedFolder.mails)

				if (currentlySelectedFolder) {
					this.selectedFolder = currentlySelectedFolder
				} else {
					let url = this.folderToUrl[getInboxFolder(mailboxDetails[0].folders)._id[1]]

					if (isSelectedPrefix(MAIL_PREFIX)) {
						this.setUrl(url)
					} else {
						navButtonRoutes.mailUrl = url
					}
				}
			}
		})

		const shortcuts = this._getShortcuts()

		this.oncreate = () => {
			this.countersStream = locator.mailModel.mailboxCounters.map(m.redraw)
			keyManager.registerShortcuts(shortcuts)
		}

		this.onremove = () => {
			this.countersStream?.end(true)
			this.countersStream = null

			keyManager.unregisterShortcuts(shortcuts)
		}

		locator.eventController.addEntityListener(updates => {
			return promiseMap(updates, update => {
				return this.entityEventReceived(update)
			}).then(noOp)
		})
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	headerRightView(): Children {
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
				enabled: () => !!this.selectedFolder && isNewMailActionAvailable(),
				help: "newMail_action",
			},
			{
				key: Keys.DELETE,
				exec: () => {
					this.mailList && this.deleteMails(this.mailList.list.getSelectedEntities())
				},
				help: "deleteEmails_action",
			},
			{
				key: Keys.A,
				exec: () => {
					this.mailList && archiveMails(this.mailList.list.getSelectedEntities())
					return true
				},
				help: "archive_action",
				enabled: () => logins.isInternalUserLoggedIn(),
			},
			{
				key: Keys.I,
				exec: () => {
					this.mailList && moveToInbox(this.mailList.list.getSelectedEntities())
					return true
				},
				help: "moveToInbox_action",
			},
			{
				key: Keys.V,
				exec: () => {
					return this.moveMails()
				},
				help: "move_action",
			},
			{
				key: Keys.U,
				exec: () => {
					this.mailList && this.toggleUnreadMails(this.mailList.list.getSelectedEntities())
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
					new Promise(async resolve => {
						const {openPressReleaseEditor} = await import("../press/PressReleaseEditor")
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

	private moveMails(): boolean {
		const mailList = this.mailList
		if (mailList == null) {
			return false
		}

		const selectedMails = mailList.list.getSelectedEntities()
		if (selectedMails.length === 0) {
			return false
		}

		locator.mailModel.getMailboxFolders(selectedMails[0]).then(folders => {
			let dropdown = new Dropdown(() => {
				const mailList = getListId(selectedMails[0])

				if (selectedMails.some(m => !isSameId(getListId(m), mailList))) {
					return []
				}

				const filteredFolders = folders.filter(f => f.mails !== mailList)
				const targetFolders = getSortedSystemFolders(filteredFolders).concat(getSortedCustomFolders(filteredFolders))
				return targetFolders.map(f => ({
					label: () => getFolderName(f),
					click: () => moveMails({mailModel: locator.mailModel, mails: selectedMails, targetMailFolder: f}),
					icon: getFolderIcon(f),
					type: ButtonType.Dropdown,
				}))
			}, 300)

			// Render the dropdown at the position of the selected mails in the MailList
			const bounds = mailList.list.getSelectionBounds()
			const origin = new DomRectReadOnlyPolyfilled(bounds.left, bounds.top, bounds.width, 0)
			dropdown.setOrigin(origin)
			modal.displayUnique(dropdown)
		})
		return false
	}

	private async switchToFolder(folderType: MailFolderType): Promise<void> {
		const mailboxDetails = await this.getMailboxDetails()
		m.route.set(this.folderToUrl[getFolder(mailboxDetails.folders, folderType)._id[1]])
	}

	private createMailboxSection(mailboxDetail: MailboxDetail): MailboxSection {
		const mailGroupId = mailboxDetail.mailGroup._id
		return {
			label: () => getMailboxName(logins, mailboxDetail),
			systemFolderButtons: this.createFolderButtons(getSortedSystemFolders(mailboxDetail.folders)),
			customFolderButtons: this.createFolderButtons(getSortedCustomFolders(mailboxDetail.folders)),
			folderAddButton: this.createFolderAddButton(mailGroupId),
		}
	}

	private createMailboxFolderItems(
		mailGroupId: Id,
		systemFolderButtons: MailFolderRowData[],
		customFolderButtons: MailFolderRowData[],
		folderAddButton: ButtonAttrs,
	): Children {
		const groupCounters = locator.mailModel.mailboxCounters()[mailGroupId] || {}
		// Important: this array is keyed so each item must have a key and `null` cannot be in the array
		// So instead we push or not push into array
		const children: Children = systemFolderButtons
			.map(({id, button}) => {
				const count = groupCounters[id]
				return m(MailFolderRow, {
					count: count,
					button,
					rightButton: null,
					key: id,
				})
			})
		if (logins.isInternalUserLoggedIn()) {
			children.push(m(SidebarSection, {
						name: "yourFolders_action",
						buttonAttrs: folderAddButton,
						key: "yourFolders", // we need to set a key because folder rows also have a key.
					},
					customFolderButtons.map(({id, button, folder}) => {
						const count = groupCounters[id]
						return m(MailFolderRow, {
							count,
							button,
							rightButton: isNavButtonSelected(button) ? this.createFolderMoreButton(mailGroupId, folder) : null,
							key: id,
						})
					}),
				)
			)
		}
		return children
	}

	/**
	 * Notifies the current view about changes of the url within its scope.
	 *
	 * @param args Object containing the optional parts of the url which are listId and mailId for the mail view.
	 */
	updateUrl(args: Record<string, any>, requestedPath: string) {
		if (requestedPath.startsWith("/mailto")) {
			if (location.hash.length > 5) {
				let url = location.hash.substring(5)
				let decodedUrl = decodeURIComponent(url)
				Promise.all([locator.mailModel.getUserMailboxDetails(), import("../editor/MailEditor")]).then(([mailboxDetails, {newMailtoUrlMailEditor}]) => {
					newMailtoUrlMailEditor(decodedUrl, false, mailboxDetails)
						.then(editor => editor.show())
						.catch(ofClass(CancelledError, noOp))
					history.pushState("", document.title, window.location.pathname) // remove # from url
				})
			}
		} else if (args.action === "supportMail" && logins.isGlobalAdminUserLoggedIn()) {
			import("../editor/MailEditor").then(({writeSupportMail}) => writeSupportMail())
		}

		if (isApp()) {
			let userGroupInfo = logins.getUserController().userGroupInfo
			locator.pushService.closePushNotification(userGroupInfo.mailAddressAliases.map(alias => alias.mailAddress).concat(userGroupInfo.mailAddress || []))
		}

		if (this.isInitialized() && args.listId && this.mailList && args.listId !== this.mailList.listId) {
			// a mail list is visible and now a new one is selected
			this.showList(args.listId, args.mailId)
		} else if (this.isInitialized() && args.listId && !this.mailList) {
			// the mailbox was loaded and we found the inbox list to show
			this.showList(args.listId, args.mailId)
		} else if (
			this.isInitialized() &&
			args.listId &&
			this.mailList &&
			args.listId === this.mailList.listId &&
			args.mailId &&
			!this.mailList.list.isEntitySelected(args.mailId)
		) {
			// the mail list is visible already, just the selected mail is changed
			this.mailList.list.scrollToIdAndSelect(args.mailId)
		} else if (this.isInitialized() && args.listId && this.mailList && args.listId === this.mailList.listId && !args.mailId) {
			// We have a list ID and it's a current list but we don't have a selected email, like when the last item in the list is
			// deleted.
			// If we are currently focused on the last column (viewer), we instead focus the second column (list).
			if (this.viewSlider.focusedColumn === this.viewSlider.columns[2]) {
				this.viewSlider.focus(this.viewSlider.columns[1])
			}
		} else if (!this.isInitialized()) {
			locator.mailModel.getMailboxDetails().then(mailboxDetails => {
				if (typeof args.listId === "undefined") {
					this.setUrl(this.folderToUrl[getInboxFolder(mailboxDetails[0].folders)._id[1]])
				} else {
					if (!this.showList(args.listId, args.mailId)) {
						this.setUrl(this.folderToUrl[getInboxFolder(mailboxDetails[0].folders)._id[1]])
					}
				}

				m.redraw()
			})
		}
	}

	private isInitialized(): boolean {
		return this.mailboxSections.size > 0 && this.selectedFolder != null
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
		this.mailList = new MailListView(mailListId, this)
		let folder = locator.mailModel.getMailFolder(mailListId)

		if (folder) {
			this.selectedFolder = folder
			navButtonRoutes.mailUrl = this.folderToUrl[folder._id[1]]

			if (!mailElementId) {
				this.mailViewerViewModel = null
			}

			this.mailList.list.loadInitial(mailElementId ?? undefined)
			return true
		} else {
			return false
		}
	}

	private createFolderButtons(folders: MailFolder[]): MailFolderRowData[] {
		return folders.map(folder => {
			this.folderToUrl[folder._id[1]] = `/mail/${folder.mails}`
			const button: NavButtonAttrs = {
				label: () => getFolderName(folder),
				icon: getFolderIcon(folder),
				href: () => this.folderToUrl[folder._id[1]],
				isSelectedPrefix: MAIL_PREFIX + "/" + folder.mails,
				colors: NavButtonColor.Nav,
				click: () => this.viewSlider.focus(this.listColumn),
				dropHandler: (droppedMailId) => {
					if (!this.mailList) {
						return
					}
					let mailsToMove: Mail[] = []

					// the dropped mail is among the selected mails, move all selected mails
					if (this.mailList.list.isEntitySelected(droppedMailId)) {
						mailsToMove = this.mailList.list.getSelectedEntities()
					} else {
						let entity = this.mailList.list.getEntity(droppedMailId)

						if (entity) {
							mailsToMove.push(entity)
						}
					}

					moveMails({mailModel: locator.mailModel, mails: mailsToMove, targetMailFolder: folder})
				},
			}
			return {
				id: folder.mails,
				button,
				folder,
			}
		})
	}

	private createFolderAddButton(mailGroupId: Id): ButtonAttrs {
		return {
			label: "add_action",
			click: () => {
				return Dialog.showProcessTextInputDialog("folderNameCreate_label", "folderName_label", null, "", (name) => {
						return locator.mailModel
									  .getMailboxDetailsForMailGroup(mailGroupId)
									  .then(mailboxDetails => locator.mailFacade.createMailFolder(name, getInboxFolder(mailboxDetails.folders)._id, mailGroupId))
					}, name =>
						this.checkFolderName(name, mailGroupId),
				)
			},
			icon: () => Icons.Add,
			colors: ButtonColor.Nav,
		}
	}

	private createFolderMoreButton(mailGroupId: Id, folder: MailFolder): ButtonAttrs {
		return attachDropdown(
			{
				mainButtonAttrs: {
					label: "more_label",
					icon: () => Icons.More,
					colors: ButtonColor.Nav,
				}, childAttrs: () => [
					{
						label: "rename_action",
						icon: () => Icons.Edit,
						type: ButtonType.Dropdown,
						click: () => {
							return Dialog.showProcessTextInputDialog("folderNameRename_label", "folderName_label", null, getFolderName(folder),
								(newName) => {
									const renamedFolder: MailFolder = Object.assign({}, folder, {
										name: newName,
									})
									return locator.entityClient.update(renamedFolder)
								},
								name =>
									this.checkFolderName(name, mailGroupId),
							)
						},
					},
					{
						label: "delete_action",
						icon: () => Icons.Trash,
						type: ButtonType.Dropdown,
						click: () => {
							Dialog.confirm(() =>
								lang.get("confirmDeleteFinallyCustomFolder_msg", {
									"{1}": getFolderName(folder),
								}),
							).then(confirmed => {
								if (confirmed) {
									this.finallyDeleteCustomMailFolder(folder)
								}
							})
						},
					},
				]
			},
		)
	}

	private showNewMailDialog(): Promise<Dialog> {
		return Promise.all([this.getMailboxDetails(), import("../editor/MailEditor")])
					  .then(([mailboxDetails, {newMailEditor}]) => newMailEditor(mailboxDetails))
					  .then(dialog => dialog.show())
	}

	private getMailboxDetails(): Promise<MailboxDetail> {
		return this.selectedFolder ? locator.mailModel.getMailboxDetailsForMailListId(this.selectedFolder.mails) : locator.mailModel.getUserMailboxDetails()
	}

	private checkFolderName(name: string, mailGroupId: Id): Promise<TranslationKey | null> {
		return locator.mailModel.getMailboxDetailsForMailGroup(mailGroupId).then(mailboxDetails => {
			if (name.trim() === "") {
				return "folderNameNeutral_msg"
			} else if (mailboxDetails.folders.find(f => f.name === name)) {
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
		this.mailList?.list.selectNone()
		return locator.mailModel.deleteFolder(folder)
					  .catch(ofClass(NotFoundError, () => console.log("mail folder already deleted")))
					  .catch(ofClass(PreconditionFailedError, () => Dialog.message("operationStillActive_msg")))
	}

	logout() {
		m.route.set("/")
	}

	async elementSelected(mails: Mail[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean) {
		// Make the animation of switching between list and single email smooth by delaying sanitizing/heavy rendering until the animation is done.
		const animationOverDeferred = defer<void>()
		const mailList = assertNotNull(this.mailList, "Element is selected but no mail list?")

		if (mails.length === 1 && !multiSelectOperation && (selectionChanged || !this.mailViewerViewModel)) {
			// set or update the visible mail

				const viewModelParams = {
				mail: mails[0],
				showFolder: false,
				delayBodyRenderingUntil: animationOverDeferred.promise,
				}

				if (this.mailViewerViewModel == null) {
					this.mailViewerViewModel = createMailViewerViewModel(viewModelParams)
				} else {
					this.mailViewerViewModel.updateMail(viewModelParams)
				}

			const url = `/mail/${mails[0]._id.join("/")}`

			if (this.selectedFolder) {
				this.folderToUrl[this.selectedFolder._id[1]] = url
			}

			this.setUrl(url)

			m.redraw()
		} else if (selectionChanged && (mails.length === 0 || multiSelectOperation) && this.mailViewerViewModel) {
			// remove the visible mail
			this.mailViewerViewModel = null
			const url = `/mail/${mailList.listId}`

			if (this.selectedFolder) {
				this.folderToUrl[this.selectedFolder._id[1]] = url
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
		this.mailList?.list.selectNone()

		// The request will be handled async by server
		return showProgressDialog("progressDeleting_msg", locator.mailModel.clearFolder(folder))
			.catch(ofClass(PreconditionFailedError, () => Dialog.message("operationStillActive_msg")))
	}

	private async entityEventReceived<T>(update: EntityUpdateData): Promise<void> {
		if (isUpdateForTypeRef(MailTypeRef, update) && this.mailList) {
			const {instanceListId, instanceId, operation} = update


			if (instanceListId === this.mailList.listId) {
				await this.mailList.list.entityEventReceived(instanceId, operation)
			}

			if (operation === OperationType.UPDATE &&
				this.mailViewerViewModel &&
				isSameId(this.mailViewerViewModel.getMailId(), [instanceListId, instanceId])
			) {
				try {
					const updatedMail = await locator.entityClient.load(MailTypeRef, this.mailViewerViewModel.getMailId())
					this.mailViewerViewModel.updateMail({mail: updatedMail})
				} catch (e) {
					if (e instanceof NotFoundError) {
						console.log(`Could not find updated mail ${JSON.stringify([instanceListId, instanceId])}`)
					} else {
						throw e
					}
				}
			}
		}
	}

	/**
	 * Used by Header to figure out when content needs to be injected there
	 * @returns {Children} Mithril children or null
	 */
	headerView(): Children {
		return this.viewSlider.getVisibleBackgroundColumns().length === 1 &&
		this.mailList?.list.isMobileMultiSelectionActionActive()
			? m(MultiSelectionBar, {
				selectNoneHandler: () => this.mailList?.list.selectNone(),
				selectedEntiesLength: this.mailList.list.getSelectedEntities().length,
			}, m(ActionBar, {buttons: this.actionBarButtons()}))
			: null
	}
}