import m, {Children} from "mithril"
import {ViewSlider} from "../../gui/base/ViewSlider"
import {ColumnType, ViewColumn} from "../../gui/base/ViewColumn"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonColor, ButtonN, ButtonType} from "../../gui/base/ButtonN"
import type {NavButtonAttrs} from "../../gui/base/NavButtonN"
import {isNavButtonSelected, isSelectedPrefix, NavButtonColor} from "../../gui/base/NavButtonN"
import {createMailViewerViewModel, MailViewer} from "./MailViewer"
import {Dialog} from "../../gui/base/Dialog"
import {FeatureType, Keys, MailFolderType, OperationType} from "../../api/common/TutanotaConstants"
import {CurrentView} from "../../gui/base/Header"
import type {Mail} from "../../api/entities/tutanota/Mail"
import {MailTypeRef} from "../../api/entities/tutanota/Mail"
import type {lazy} from "@tutao/tutanota-utils"
import {defer, neverNull, noOp, ofClass, promiseMap} from "@tutao/tutanota-utils"
import {MailListView} from "./MailListView"
import {assertMainOrNode, isApp} from "../../api/common/Env"
import type {Shortcut} from "../../misc/KeyManager"
import {keyManager} from "../../misc/KeyManager"
import {MultiMailViewer} from "./MultiMailViewer"
import {logins} from "../../api/main/LoginController"
import {Icons} from "../../gui/base/icons/Icons"
import {ConnectionError, LockedError, NotFoundError, PreconditionFailedError} from "../../api/common/error/RestError"
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
} from "../model/MailUtils"
import type {MailboxDetail} from "../model/MailModel"
import {locator} from "../../api/main/MainLocator"
import {ActionBar} from "../../gui/base/ActionBar"
import {MultiSelectionBar} from "../../gui/base/MultiSelectionBar"
import type {EntityUpdateData} from "../../api/main/EventController"
import {isUpdateForTypeRef} from "../../api/main/EventController"
import {PermissionError} from "../../api/common/error/PermissionError"
import {MAIL_PREFIX, navButtonRoutes, throttleRoute} from "../../misc/RouteChange"
import {attachDropdown, DropdownN} from "../../gui/base/DropdownN"
import {MailFolderRow} from "./MailFolderRow"
import {styles} from "../../gui/styles"
import {size} from "../../gui/size"
import {FolderColumnView} from "../../gui/base/FolderColumnView"
import {modal} from "../../gui/base/Modal"
import {DomRectReadOnlyPolyfilled} from "../../gui/base/Dropdown"
import type {MailFolder} from "../../api/entities/tutanota/MailFolder"
import {UserError} from "../../api/main/UserError"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {archiveMails, moveMails, moveToInbox, promptAndDeleteMails} from "./MailGuiUtils"
import {getListId, isSameId} from "../../api/common/utils/EntityUtils"
import {isNewMailActionAvailable} from "../../gui/nav/NavFunctions"
import {SidebarSection} from "../../gui/SidebarSection"
import {CancelledError} from "../../api/common/error/CancelledError"
import Stream from "mithril/stream";
import {MailViewerViewModel} from "./MailViewerViewModel"

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

export class MailView implements CurrentView {
	listColumn: ViewColumn
	folderColumn: ViewColumn
	mailColumn: ViewColumn
	viewSlider: ViewSlider
	mailList!: MailListView
	view: CurrentView["view"]
	selectedFolder: MailFolder | null = null

	oncreate: CurrentView["oncreate"]
	onremove: CurrentView["onremove"]
	_mailboxSections: Map<Id, MailboxSection> // mailGroupId -> section

	private _folderToUrl: Record<Id, string>
	private _actionBarButtons: lazy<ButtonAttrs[]>
	private _throttledRouteSet: (arg0: string) => void
	private _countersStream!: Stream<any>

	private _multiMailViewer: MultiMailViewer
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
		this._mailboxSections = new Map()
		this._folderToUrl = {}
		this._throttledRouteSet = throttleRoute()
		this.folderColumn = new ViewColumn(
			{
				view: () =>
					m(FolderColumnView, {
						button:
							!styles.isUsingBottomNavigation() && isNewMailActionAvailable()
								? {
									label: "newMail_action",
									click: () => this._showNewMailDialog().catch(ofClass(PermissionError, noOp)),
								}
								: null,
						content: Array.from(this._mailboxSections.entries()).map(([mailGroupId, mailboxSection]) => {
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
		this._multiMailViewer = new MultiMailViewer(this)
		this._actionBarButtons = () => this._multiMailViewer.getActionBarButtons()

		const mailColumnTitle = () => {
			let selectedEntities = this.mailList ? this.mailList.list.getSelectedEntities() : []

			if (selectedEntities.length > 0) {
				const loadedEntities = this.mailList.list.getLoadedEntities()
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
						: m(this._multiMailViewer)
				),
			},
			ColumnType.Background,
			size.third_col_min_width,
			size.third_col_max_width,
			mailColumnTitle,
			() => lang.get("email_label") + " " + mailColumnTitle(),
		)
		this.viewSlider = new ViewSlider([this.folderColumn, this.listColumn, this.mailColumn], "MailView")

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
								this._getMailboxDetails(),
								locator.fileController.readLocalFiles(ev.dataTransfer.files),
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
				const section = this._mailboxSections.get(newMailboxDetail.mailGroup._id)

				if (section) {
					section.customFolderButtons = this.createFolderButtons(getSortedCustomFolders(newMailboxDetail.folders))
				} else {
					this._mailboxSections.set(newMailboxDetail.mailGroup._id, this.createMailboxSection(newMailboxDetail))
				}
			}

			for (let mailGroupId of this._mailboxSections.keys()) {
				if (mailboxDetails.find(mailboxDetail => mailboxDetail.mailGroup._id === mailGroupId) == null) {
					this._mailboxSections.delete(mailGroupId)
				}
			}

			if (this.selectedFolder) {
				// find the folder in the new folder list that was previously selected
				let currentlySelectedFolder = locator.mailModel.getMailFolder(this.selectedFolder.mails)

				if (currentlySelectedFolder) {
					this.selectedFolder = currentlySelectedFolder
				} else {
					let url = this._folderToUrl[getInboxFolder(mailboxDetails[0].folders)._id[1]]

					if (isSelectedPrefix(MAIL_PREFIX)) {
						this._setUrl(url)
					} else {
						navButtonRoutes.mailUrl = url
					}
				}
			}
		})

		const shortcuts = this._getShortcuts()

		this.oncreate = () => {
			this._countersStream = locator.mailModel.mailboxCounters.map(m.redraw)
			keyManager.registerShortcuts(shortcuts)
		}

		this.onremove = () => {
			this._countersStream.end(true)

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
			click: () => this._showNewMailDialog().catch(ofClass(PermissionError, noOp)),
			type: ButtonType.Action,
			icon: () => Icons.PencilSquare,
			colors: ButtonColor.Header,
		}
		return isNewMailActionAvailable() ? m(ButtonN, openMailButtonAttrs) : null
	}

	_getShortcuts(): Array<Shortcut> {
		return [
			{
				key: Keys.N,
				exec: () => {
					this._showNewMailDialog().catch(ofClass(PermissionError, noOp))
				},
				enabled: () => !!this.selectedFolder && isNewMailActionAvailable(),
				help: "newMail_action",
			},
			{
				key: Keys.DELETE,
				exec: () => {
					this.deleteMails(this.mailList.list.getSelectedEntities())
				},
				help: "deleteEmails_action",
			},
			{
				key: Keys.A,
				exec: () => {
					archiveMails(this.mailList.list.getSelectedEntities())
					return true
				},
				help: "archive_action",
				enabled: () => logins.isInternalUserLoggedIn(),
			},
			{
				key: Keys.I,
				exec: () => {
					moveToInbox(this.mailList.list.getSelectedEntities())
					return true
				},
				help: "moveToInbox_action",
			},
			{
				key: Keys.V,
				exec: () => {
					return this._moveMails()
				},
				help: "move_action",
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
						openPressReleaseEditor(await this._getMailboxDetails())
						resolve(null)
					})
					return true
				},
				help: "emptyString_msg",
				enabled: () => logins.isEnabled(FeatureType.Newsletter),
			},
		]
	}

	_moveMails(): boolean {
		const selectedMails = this.mailList.list.getSelectedEntities()

		if (selectedMails.length === 0) {
			return false
		}

		locator.mailModel.getMailboxFolders(selectedMails[0]).then(folders => {
			let dropdown = new DropdownN(() => {
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
			const bounds = this.mailList.list.getSelectionBounds()
			const origin = new DomRectReadOnlyPolyfilled(bounds.left, bounds.top, bounds.width, 0)
			dropdown.setOrigin(origin)
			modal.displayUnique(dropdown)
		})
		return false
	}

	switchToFolder(folderType: MailFolderType): Promise<void> {
		return this._getMailboxDetails().then(mailboxDetails => {
			m.route.set(this._folderToUrl[getFolder(mailboxDetails.folders, folderType)._id[1]])
		})
	}

	createMailboxSection(mailboxDetail: MailboxDetail): MailboxSection {
		const mailGroupId = mailboxDetail.mailGroup._id
		return {
			details: mailboxDetail,
			label: () => getMailboxName(logins, mailboxDetail),
			systemFolderButtons: this.createFolderButtons(getSortedSystemFolders(mailboxDetail.folders)),
			customFolderButtons: this.createFolderButtons(getSortedCustomFolders(mailboxDetail.folders)),
			folderAddButton: this.createFolderAddButton(mailGroupId),
			counter: null,
		} as MailboxSection
	}

	createMailboxFolderItems(
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
	updateUrl(args: Record<string, any>, requestedPath: String) {
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
			this._showList(args.listId, args.mailId)
		} else if (this.isInitialized() && args.listId && !this.mailList) {
			// the mailbox was loaded and we found the inbox list to show
			this._showList(args.listId, args.mailId)
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
					this._setUrl(this._folderToUrl[getInboxFolder(mailboxDetails[0].folders)._id[1]])
				} else {
					if (!this._showList(args.listId, args.mailId)) {
						this._setUrl(this._folderToUrl[getInboxFolder(mailboxDetails[0].folders)._id[1]])
					}
				}

				m.redraw()
			})
		}
	}

	isInitialized(): boolean {
		return this._mailboxSections.size > 0 && this.selectedFolder != null
	}

	_setUrl(url: string) {
		navButtonRoutes.mailUrl = url

		// do not change the url if the search view is active
		if (m.route.get().startsWith(MAIL_PREFIX)) {
			this._throttledRouteSet(url + location.hash)
		}
	}

	/**
	 * Shows the mail list with the given list id if the list exists.
	 * @param mailListId The list id
	 * @param mailElementId The element to scroll to and select.
	 * @returns True if the list could be shown, i.e. it exists, false otherwise
	 */
	_showList(mailListId: Id, mailElementId: Id | null): boolean {
		this.mailList = new MailListView(mailListId, this)
		let folder = locator.mailModel.getMailFolder(mailListId)

		if (folder) {
			this.selectedFolder = folder
			navButtonRoutes.mailUrl = this._folderToUrl[folder._id[1]]

			if (!mailElementId) {
				this.mailViewerViewModel = null
			}

			this.mailList.list.loadInitial(mailElementId ?? undefined)
			return true
		} else {
			return false
		}
	}

	createFolderButtons(folders: MailFolder[]): MailFolderRowData[] {
		return folders.map(folder => {
			this._folderToUrl[folder._id[1]] = `/mail/${folder.mails}`
			const button: NavButtonAttrs = {
				label: () => getFolderName(folder),
				icon: getFolderIcon(folder),
				href: () => this._folderToUrl[folder._id[1]],
				isSelectedPrefix: MAIL_PREFIX + "/" + folder.mails,
				colors: NavButtonColor.Nav,
				click: () => this.viewSlider.focus(this.listColumn),
				dropHandler: droppedMailId => {
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

	createFolderAddButton(mailGroupId: Id): ButtonAttrs {
		return {
			label: "add_action",
			click: () => {
				return Dialog.showTextInputDialog("folderNameCreate_label", "folderName_label", null, "", name =>
					this._checkFolderName(name, mailGroupId),
				).then(name =>
					locator.mailModel
						   .getMailboxDetailsForMailGroup(mailGroupId)
						   .then(mailboxDetails => locator.mailFacade.createMailFolder(name, getInboxFolder(mailboxDetails.folders)._id, mailGroupId)),
				)
			},
			icon: () => Icons.Add,
			colors: ButtonColor.Nav,
		}
	}

	createFolderMoreButton(mailGroupId: Id, folder: MailFolder): ButtonAttrs {
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
							return Dialog.showTextInputDialog("folderNameRename_label", "folderName_label", null, getFolderName(folder), name =>
								this._checkFolderName(name, mailGroupId),
							).then(newName => {
								const renamedFolder: MailFolder = Object.assign({}, folder, {
									name: newName,
								})
								return locator.entityClient.update(renamedFolder)
							})
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
									this._finallyDeleteCustomMailFolder(folder)
								}
							})
						},
					},
				]
			},
		)
	}

	_showNewMailDialog(): Promise<Dialog> {
		return Promise.all([this._getMailboxDetails(), import("../editor/MailEditor")])
					  .then(([mailboxDetails, {newMailEditor}]) => newMailEditor(mailboxDetails))
					  .then(dialog => dialog.show())
	}

	_getMailboxDetails(): Promise<MailboxDetail> {
		return this.selectedFolder ? locator.mailModel.getMailboxDetailsForMailListId(this.selectedFolder.mails) : locator.mailModel.getUserMailboxDetails()
	}

	_checkFolderName(name: string, mailGroupId: Id): Promise<TranslationKey | null> {
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

	_finallyDeleteCustomMailFolder(folder: MailFolder): Promise<void> {
		if (folder.folderType !== MailFolderType.CUSTOM) {
			throw new Error("Cannot delete non-custom folder: " + String(folder._id))
		}


		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.mailList.list.selectNone()
		return locator.mailModel.deleteFolder(folder)
					  .catch(ofClass(NotFoundError, e => console.log("mail folder already deleted")))
					  .catch(ofClass(PreconditionFailedError, e => Dialog.message("operationStillActive_msg")))
	}

	logout() {
		m.route.set("/")
	}

	elementSelected: (mails: Mail[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean) => void = (
		mails,
		elementClicked,
		selectionChanged,
		multiSelectOperation,
	) => {
		// Make the animation of switching between list and single email smooth by delaying sanitizing/heavy rendering until the animation is done.
		const animationOverDeferred = defer<void>()

		if (mails.length === 1 && !multiSelectOperation && (selectionChanged || !this.mailViewerViewModel)) {
			// set or update the visible mail
			this.mailViewerViewModel = createMailViewerViewModel({
				mail: mails[0],
				showFolder: false,
				delayBodyRenderingUntil: animationOverDeferred.promise,
			})
			let url = `/mail/${mails[0]._id.join("/")}`

			if (this.selectedFolder) {
				this._folderToUrl[this.selectedFolder._id[1]] = url
			}

			this._setUrl(url)

			m.redraw()
		} else if (selectionChanged && (mails.length === 0 || multiSelectOperation) && this.mailViewerViewModel) {
			// remove the visible mail
			this.mailViewerViewModel = null
			let url = `/mail/${this.mailList.listId}`

			if (this.selectedFolder) {
				this._folderToUrl[this.selectedFolder._id[1]] = url
			}

			this._setUrl(url)

			m.redraw()
		} else if (selectionChanged) {
			// update the multi mail viewer
			m.redraw()
		}

		if (this.mailViewerViewModel && !multiSelectOperation) {
			if (mails[0].unread && !mails[0]._errors) {
				mails[0].unread = false
				locator.entityClient
					   .update(mails[0])
					   .catch(ofClass(NotFoundError, e => console.log("could not set read flag as mail has been moved/deleted already", e)))
					   .catch(ofClass(LockedError, noOp))
					   .catch(ofClass(ConnectionError, noOp))
			}

			if (elementClicked) {
				this.mailList.list.loading.then(() => {
					this.viewSlider.focus(this.mailColumn).then(() => animationOverDeferred.resolve())
				})
			} else {
				animationOverDeferred.resolve()
			}
		} else {
			animationOverDeferred.resolve()
		}
	}

	deleteMails(mails: Mail[]): Promise<boolean> {
		return promptAndDeleteMails(locator.mailModel, mails, noOp)
	}

	finallyDeleteAllMailsInSelectedFolder(folder: MailFolder): Promise<void> {
		if (folder.folderType !== MailFolderType.TRASH && folder.folderType !== MailFolderType.SPAM) {
			throw new Error(`Cannot delete mails in folder ${String(folder._id)} with type ${folder.folderType}`)
		}

		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.mailList.list.selectNone()

		// The request will be handled async by server
		return showProgressDialog("progressDeleting_msg", locator.mailModel.clearFolder(folder))
			.catch(ofClass(PreconditionFailedError, e => Dialog.message("operationStillActive_msg")))
	}

	entityEventReceived<T>(update: EntityUpdateData): Promise<void> {
		if (isUpdateForTypeRef(MailTypeRef, update) && this.mailList) {
			const {instanceListId, instanceId, operation} = update
			let promise = Promise.resolve()

			if (instanceListId === this.mailList.listId) {
				promise = this.mailList.list.entityEventReceived(instanceId, operation)
			}

			return promise.then(() => {
				// run the displayed mail update after the update on the list is finished to avoid parallel email loading
				// update the displayed or edited mail if necessary
				if (operation === OperationType.UPDATE && this.mailViewerViewModel && isSameId(this.mailViewerViewModel.getMailId(), [neverNull(instanceListId), instanceId])) {
					return locator.entityClient
								  .load(MailTypeRef, this.mailViewerViewModel.getMailId())
								  .then(updatedMail => {
									  this.mailViewerViewModel = createMailViewerViewModel({
										  mail: updatedMail,
										  showFolder: false,
									  })
								  })
								  .catch(() => {
									  // ignore. might happen if a mail was just sent
								  })
				}
			})
		} else {
			return Promise.resolve()
		}
	}

	/**
	 * Used by Header to figure out when content needs to be injected there
	 * @returns {Children} Mithril children or null
	 */
	headerView(): Children {
		return this.viewSlider.getVisibleBackgroundColumns().length === 1 &&
		this.mailList &&
		this.mailList.list &&
		this.mailList.list.isMobileMultiSelectionActionActive()
			? m(MultiSelectionBar, {
				selectNoneHandler: () => this.mailList.list.selectNone(),
				selectedEntiesLength: this.mailList.list.getSelectedEntities().length,
				content: {
					view: () =>
						m(ActionBar, {
							buttons: this._actionBarButtons(),
						}),
				},
			})
			: null
	}
}