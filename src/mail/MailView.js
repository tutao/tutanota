// @flow
import m from "mithril"
import {ViewSlider} from "../gui/base/ViewSlider"
import {ColumnType, ViewColumn} from "../gui/base/ViewColumn"
import {lang} from "../misc/LanguageViewModel"
import {Button} from "../gui/base/Button"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonColors, ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {NavButtonAttrs} from "../gui/base/NavButtonN"
import {isNavButtonSelected, isSelectedPrefix} from "../gui/base/NavButtonN"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {load, serviceRequestVoid, update} from "../api/main/Entity"
import {MailViewer} from "./MailViewer"
import {Dialog} from "../gui/base/Dialog"
import {worker} from "../api/main/WorkerClient"
import type {MailFolderTypeEnum} from "../api/common/TutanotaConstants"
import {FeatureType, Keys, MailFolderType, OperationType} from "../api/common/TutanotaConstants"
import {CurrentView} from "../gui/base/Header"
import {getListId, HttpMethod, isSameId} from "../api/common/EntityFunctions"
import {createDeleteMailFolderData} from "../api/entities/tutanota/DeleteMailFolderData"
import {createDeleteMailData} from "../api/entities/tutanota/DeleteMailData"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {lazyMemoized, neverNull, noOp} from "../api/common/utils/Utils"
import {MailListView} from "./MailListView"
import {MailEditor, newMail} from "./MailEditor"
import {assertMainOrNode, isApp} from "../api/Env"
import {keyManager} from "../misc/KeyManager"
import {MultiMailViewer} from "./MultiMailViewer"
import {logins} from "../api/main/LoginController"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {Icons} from "../gui/base/icons/Icons"
import {theme} from "../gui/theme"
import {NotFoundError, PreconditionFailedError} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {
	archiveMails,
	getFolder,
	getFolderIcon,
	getFolderName,
	getInboxFolder,
	getMailboxName,
	getSortedCustomFolders,
	getSortedSystemFolders,
	moveToInbox,
	showDeleteConfirmationDialog
} from "./MailUtils"
import type {MailboxDetail} from "./MailModel"
import {mailModel} from "./MailModel"
import {locator} from "../api/main/MainLocator"
import {pushServiceApp} from "../native/PushServiceApp"
import {ActionBar} from "../gui/base/ActionBar";
import {MultiSelectionBar} from "../gui/base/MultiSelectionBar"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {fileController} from "../file/FileController"
import {PermissionError} from "../api/common/error/PermissionError"
import {MAIL_PREFIX, navButtonRoutes, throttleRoute} from "../misc/RouteChange"
import {attachDropdown, DropdownN} from "../gui/base/DropdownN"
import {MailFolderView} from "./MailFolderView"
import {styles} from "../gui/styles"
import {size} from "../gui/size"
import {FolderColumnView} from "../gui/base/FolderColumnView"
import {modal} from "../gui/base/Modal"
import {DomRectReadOnlyPolyfilled} from "../gui/base/Dropdown"

assertMainOrNode()

type MailFolderRowData = {id: Id, button: NavButtonAttrs, folder: MailFolder}

type MailboxExpander = {
	expanderButton: ExpanderButton,
	systemFolderButtons: MailFolderRowData[],
	customFolderButtons: MailFolderRowData[],
	folderAddButton: Button
}


export class MailView implements CurrentView {
	listColumn: ViewColumn;
	folderColumn: ViewColumn;
	mailColumn: ViewColumn;
	viewSlider: ViewSlider;
	mailList: MailListView;
	view: Function;
	selectedFolder: ?MailFolder;
	mailViewer: ?MailViewer;
	oncreate: Function;
	onbeforeremove: Function;
	_mailboxExpanders: {[mailGroupId: Id]: MailboxExpander}
	_folderToUrl: {[folderId: Id]: string};
	_multiMailViewer: MultiMailViewer;
	_actionBar: lazy<ActionBar>;
	_throttledRouteSet: (string) => void;
	_countersStream: Stream<*>;

	constructor() {
		this.mailViewer = null
		this._mailboxExpanders = {}
		this._folderToUrl = {}
		this._throttledRouteSet = throttleRoute()
		this.folderColumn = new ViewColumn({
			view: () => m(FolderColumnView, {
				button: (!styles.isUsingBottomNavigation() && isNewMailActionAvailable())
					? {
						label: 'newMail_action',
						click: () => this._newMail().catch(PermissionError, noOp),
					}
					: null,
				content: Object.keys(this._mailboxExpanders)
				               .map(mailGroupId => {
						               let expander = this._mailboxExpanders[mailGroupId]
						               return [
							               m(".mr-negative-s.flex-space-between.plr-l.flex-no-grow-no-shrink-auto", m(expander.expanderButton)),
							               m(neverNull(expander.expanderButton).panel)
						               ]
					               }
				               ),
				ariaLabel: "folderTitle_label"
			})
		}, ColumnType.Foreground, size.first_col_min_width, size.first_col_max_width, () => lang.get("folderTitle_label"))

		this.listColumn = new ViewColumn({
			view: () => m(".list-column", [
				this.mailList ? m(this.mailList) : null,
			])
		}, ColumnType.Background, size.second_col_min_width, size.second_col_max_width, () => {
			return this.selectedFolder ? getFolderName(this.selectedFolder) : ""
		})

		this._multiMailViewer = new MultiMailViewer(this)
		this._actionBar = lazyMemoized(() => this._multiMailViewer.createActionBar())
		this.mailColumn = new ViewColumn({
			view: () => m(".mail", this.mailViewer != null ? m(this.mailViewer) : m(this._multiMailViewer))
		}, ColumnType.Background, size.third_col_min_width, size.third_col_max_width, () => {

			let selectedEntities = this.mailList ? this.mailList.list.getSelectedEntities() : [];
			if (selectedEntities.length > 0) {
				let selectedIndex = this.mailList.list._loadedEntities.indexOf(selectedEntities[0]) + 1
				return selectedIndex + "/" + this.mailList.list._loadedEntities.length
			} else {
				return ""
			}
		})

		this.viewSlider = new ViewSlider([this.folderColumn, this.listColumn, this.mailColumn], "MailView")


		this.view = (): VirtualElement => {
			return m("#mail.main-view", {
					ondragover: (ev) => {
						// do not check the datatransfer here because it is not always filled, e.g. in Safari
						ev.stopPropagation()
						ev.preventDefault()
					},
					ondrop: (ev) => {
						if (isNewMailActionAvailable() && ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
							Promise.join(
								this._newMail(),
								fileController.readLocalFiles(ev.dataTransfer.files),
								(ed, dataFiles) => {
									ed.attachFiles((dataFiles: any))
									m.redraw()
								}).catch(PermissionError, noOp)
						}
						// prevent in any case because firefox tries to open
						// dataTransfer as a URL otherwise.
						ev.stopPropagation()
						ev.preventDefault()
					}
				},
				m(this.viewSlider)
			)
		}

		this._setupShortcuts()

		locator.eventController.addEntityListener((updates) => {
			for (let update of updates) {
				this.entityEventReceived(update)
			}
		})
	}

	getViewSlider(): ?IViewSlider {
		return this.viewSlider
	}

	headerRightView(): Children {
		return isNewMailActionAvailable()
			? m(ButtonN, {
				label: "newMail_action",
				click: () => this._newMail().catch(PermissionError, noOp),
				type: ButtonType.Action,
				icon: () => Icons.PencilSquare,
				colors: ButtonColors.Header,
			})
			: null
	}

	_setupShortcuts() {
		const shortcuts: Array<Shortcut> = [
			{
				key: Keys.PAGE_UP,
				exec: () => {
					if (this.mailViewer) this.mailViewer.scrollUp()
				},
				help: "scrollUp_action"
			},
			{
				key: Keys.PAGE_DOWN,
				exec: () => {
					if (this.mailViewer) this.mailViewer.scrollDown()
				},
				help: "scrollDown_action"
			},
			{
				key: Keys.HOME,
				exec: () => {
					if (this.mailViewer) this.mailViewer.scrollToTop()
				},
				help: "scrollToTop_action"
			},
			{
				key: Keys.END,
				exec: () => {
					if (this.mailViewer) this.mailViewer.scrollToBottom()
				},
				help: "scrollToBottom_action"
			},
			{
				key: Keys.UP,
				exec: () => this.mailList.list.selectPrevious(false),
				help: "selectPrevious_action"
			},
			{
				key: Keys.K,
				exec: () => this.mailList.list.selectPrevious(false),
				help: "selectPrevious_action"
			},
			{
				key: Keys.UP,
				shift: true,
				exec: () => this.mailList.list.selectPrevious(true),
				help: "addPrevious_action"
			},
			{
				key: Keys.K,
				shift: true,
				exec: () => this.mailList.list.selectPrevious(true),
				help: "addPrevious_action"
			},
			{
				key: Keys.DOWN,
				exec: () => this.mailList.list.selectNext(false),
				help: "selectNext_action"
			},
			{
				key: Keys.J,
				exec: () => this.mailList.list.selectNext(false),
				help: "selectNext_action"
			},
			{
				key: Keys.DOWN,
				shift: true,
				exec: () => this.mailList.list.selectNext(true),
				help: "addNext_action"
			},
			{
				key: Keys.J,
				shift: true,
				exec: () => this.mailList.list.selectNext(true),
				help: "addNext_action"
			},
			{
				key: Keys.N,
				exec: () => (this._newMail().catch(PermissionError, noOp): any),
				enabled: () => !!this.selectedFolder && isNewMailActionAvailable(),
				help: "newMail_action"
			},
			{
				key: Keys.DELETE,
				exec: () => {
					this.deleteMails(this.mailList.list.getSelectedEntities())
				},
				help: "deleteEmails_action"
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
				help: "moveToInbox_action"
			},
			{
				key: Keys.V,
				exec: () => {
					return this._moveMails()
				},
				help: "move_action"
			},
			{
				key: Keys.ONE,
				exec: () => {
					this.switchToFolder(MailFolderType.INBOX)
					return true
				},
				help: "switchInbox_action"
			},
			{
				key: Keys.TWO,
				exec: () => {
					this.switchToFolder(MailFolderType.DRAFT)
					return true
				},
				help: "switchDrafts_action"
			},
			{
				key: Keys.THREE,
				exec: () => {
					this.switchToFolder(MailFolderType.SENT)
					return true
				},
				help: "switchSentFolder_action"
			},
			{
				key: Keys.FOUR,
				exec: () => {
					this.switchToFolder(MailFolderType.TRASH)
					return true
				},
				help: "switchTrash_action"
			},
			{
				key: Keys.FIVE,
				exec: () => {
					this.switchToFolder(MailFolderType.ARCHIVE)
					return true
				},
				enabled: () => logins.isInternalUserLoggedIn(),
				help: "switchArchive_action"
			},
			{
				key: Keys.SIX,
				exec: () => {
					this.switchToFolder(MailFolderType.SPAM)
					return true
				},
				enabled: () => logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.InternalCommunication),
				help: "switchSpam_action"
			},
		]

		// do not stop observing the mailboxDetails when this view is invisible because the view is cached and switching back to this view while the mailboxes have changed leads to errors
		mailModel.mailboxDetails.map(mailboxDetails => {
			mailboxDetails.forEach(newMailboxDetail => {
				if (!this._mailboxExpanders[newMailboxDetail.mailGroup._id]) {
					this.createMailboxExpander(newMailboxDetail)
				} else {
					this._mailboxExpanders[newMailboxDetail.mailGroup._id].customFolderButtons = this.createFolderButtons(getSortedCustomFolders(newMailboxDetail.folders))
				}
			})
			Object.keys(this._mailboxExpanders).forEach(mailGroupId => {
				if (mailboxDetails.find(mailboxDetail => mailboxDetail.mailGroup._id === mailGroupId) == null) {
					delete this._mailboxExpanders[mailGroupId]
				}
			})

			if (this.selectedFolder) {
				// find the folder in the new folder list that was previously selected
				let currentlySelectedFolder = mailModel.getMailFolder(this.selectedFolder.mails)
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

		this.oncreate = () => {
			keyManager.registerShortcuts(shortcuts)
			this._countersStream = mailModel.mailboxCounters.map(m.redraw)
		}
		this.onbeforeremove = () => {
			keyManager.unregisterShortcuts(shortcuts)
			this._countersStream.end(true)
		}
	}

	_moveMails() {
		const selectedMails = this.mailList.list.getSelectedEntities()
		if (selectedMails.length === 0) {
			return false
		}
		mailModel.getMailboxFolders(selectedMails[0]).then((folders) => {
			let dropdown = new DropdownN(() => {
				const mailList = getListId(selectedMails[0])
				if (selectedMails.some(m => !isSameId(getListId(m), mailList))) {
					return []
				}

				const filteredFolders = folders.filter(f => f.mails !== mailList)
				const targetFolders = (getSortedSystemFolders(filteredFolders).concat(getSortedCustomFolders(filteredFolders)))
				return targetFolders.map(f => ({
					label: () => getFolderName(f),
					click: () => mailModel.moveMails(selectedMails, f),
					icon: getFolderIcon(f),
					type: ButtonType.Dropdown,
				}))

			}, 300)
			const viewer = this.mailViewer || this._multiMailViewer
			const mailViewerOrigin = viewer && viewer.getBounds()
			if (mailViewerOrigin) {
				const origin = new DomRectReadOnlyPolyfilled(mailViewerOrigin.left, mailViewerOrigin.top, mailViewerOrigin.width, 0)
				dropdown.setOrigin(origin)
				modal.displayUnique(dropdown)
			}
		})
		return false
	}

	switchToFolder(folderType: MailFolderTypeEnum) {
		return this._getMailboxDetails()
		           .then((mailboxDetails) => {
			           m.route.set(this._folderToUrl[getFolder(mailboxDetails.folders, folderType)._id[1]])
		           })
	}

	createMailboxExpander(mailboxDetail: MailboxDetail) {
		this._mailboxExpanders[mailboxDetail.mailGroup._id] = {
			details: mailboxDetail,
			expanderButton: this.createMailBoxExpanderButton(mailboxDetail),
			systemFolderButtons: this.createFolderButtons(getSortedSystemFolders(mailboxDetail.folders)),
			customFolderButtons: this.createFolderButtons(getSortedCustomFolders(mailboxDetail.folders)),
			folderAddButton: this.createFolderAddButton(mailboxDetail.mailGroup._id),
			counter: null
		}
	}

	createMailBoxExpanderButton(mailboxDetails: MailboxDetail): ExpanderButton {
		const mailGroupId = mailboxDetails.mailGroup._id
		const mailboxExpander = new ExpanderButton(() => getMailboxName(mailboxDetails), new ExpanderPanel({
			view: () => {
				const groupCounters = mailModel.mailboxCounters()[mailGroupId] || {}
				return m(".folders",
					this._mailboxExpanders[mailGroupId].systemFolderButtons
					                                   .map(({id, button}) => {
						                                   const count = groupCounters[id]
						                                   return m(MailFolderView, {
							                                   count: count,
							                                   button,
							                                   rightButton: null,
							                                   key: id,
						                                   })
					                                   })
					                                   .concat(logins.isInternalUserLoggedIn()
						                                   ? [
							                                   m(".folder-row.flex-space-between.plr-l", {key: "yourFolders"}, [
								                                   m("small.b.align-self-center.ml-negative-xs",
									                                   {style: {color: theme.navigation_button}},
									                                   lang.get("yourFolders_action").toLocaleUpperCase()),
								                                   m(neverNull(this._mailboxExpanders[mailGroupId].folderAddButton))
							                                   ])
						                                   ]
						                                   : []
					                                   )
					                                   .concat(this._mailboxExpanders[mailGroupId].customFolderButtons.map(({id, button, folder}) => {
						                                   const count = groupCounters[id]
						                                   return m(MailFolderView, {
							                                   count,
							                                   button,
							                                   rightButton: isNavButtonSelected(button)
								                                   ? this.createFolderMoreButton(mailGroupId, folder)
								                                   : null,
							                                   key: id
						                                   })
					                                   })))
			}
		}), false, {}, () => theme.navigation_button)
		mailboxExpander.toggle()
		return mailboxExpander
	}

	/**
	 * Notifies the current view about changes of the url within its scope.
	 *
	 * @param args Object containing the optional parts of the url which are listId and mailId for the mail view.
	 */
	updateUrl(args: Object) {
		if (m.route.get().indexOf("/mailto") === 0) {
			if (location.hash.length > 5) {
				let url = location.hash.substring(5)
				let decodedUrl = decodeURIComponent(url)
				mailModel.getUserMailboxDetails().then((mailboxDetails) => {
					let editor = new MailEditor(mailboxDetails)
					editor.initWithMailtoUrl(decodedUrl, false)
					editor.show()
					history.pushState("", document.title, window.location.pathname) // remove # from url
				})
			}
		} else if (args.action === 'supportMail' && logins.isGlobalAdminUserLoggedIn()) {
			MailEditor.writeSupportMail()
		}

		if (isApp()) {
			let userGroupInfo = logins.getUserController().userGroupInfo
			pushServiceApp.closePushNotification(
				userGroupInfo.mailAddressAliases.map(alias => alias.mailAddress)
				             .concat(userGroupInfo.mailAddress || []))
		}

		if (this.isInitialized() && args.listId && this.mailList && args.listId !== this.mailList.listId) {
			// a mail list is visible and now a new one is selected
			this._showList(args.listId, args.mailId);
		} else if (this.isInitialized() && args.listId && !this.mailList) {
			// the mailbox was loaded and we found the inbox list to show
			this._showList(args.listId, args.mailId);
		} else if (this.isInitialized() && args.listId && this.mailList && args.listId === this.mailList.listId
			&& args.mailId && !this.mailList.list.isEntitySelected(args.mailId)) {
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
			mailModel.getMailboxDetails().then((mailboxDetails) => {
				if (typeof args.listId === 'undefined') {
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
		return Object.keys(this._mailboxExpanders).length > 0 && this.selectedFolder != null
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
	_showList(mailListId: Id, mailElementId: ? Id): boolean {
		this.mailList = new MailListView(mailListId, (this: any))
		let folder = mailModel.getMailFolder(mailListId)
		if (folder) {
			this.selectedFolder = folder
			navButtonRoutes.mailUrl = this._folderToUrl[folder._id[1]]
			if (!mailElementId) {
				this.mailViewer = null
			}
			this.mailList.list.loadInitial(mailElementId)
			return true
		} else {
			return false
		}
	}

	createFolderButtons(folders: MailFolder[]): MailFolderRowData[] {
		return folders.map(folder => {
			this._folderToUrl[folder._id[1]] = `/mail/${folder.mails}`
			const button = {
				label: () => getFolderName(folder),
				icon: getFolderIcon(folder),
				href: () => this._folderToUrl[folder._id[1]],
				isSelectedPrefix: MAIL_PREFIX + "/" + folder.mails,
				colors: ButtonColors.Nav,
				click: () => this.viewSlider.focus(this.listColumn),
				dropHandler: (droppedMailId) => {
					// the dropped mail is among the selected mails, move all selected mails
					if (this.mailList.list.isEntitySelected(droppedMailId)) {
						mailModel.moveMails(this.mailList.list.getSelectedEntities(), folder)
					} else {
						let entity = this.mailList.list.getEntity(droppedMailId)
						if (entity) {
							mailModel.moveMails([entity], folder)
						}
					}
				}
			}

			return {id: folder.mails, button, folder}
		})
	}

	createFolderAddButton(mailGroupId: Id) {
		return new Button('add_action', () => {
			return Dialog.showTextInputDialog("folderNameCreate_label", "folderName_label", null, "",
				(name) => this._checkFolderName(name, mailGroupId))
			             .then((name) =>
				             mailModel.getMailboxDetailsForMailGroup(mailGroupId)
				                      .then((mailboxDetails) =>
					                      worker.createMailFolder(name,
						                      getInboxFolder(mailboxDetails.folders)._id,
						                      mailGroupId)))
		}, () => Icons.Add).setColors(ButtonColors.Nav)
	}

	createFolderMoreButton(mailGroupId: Id, folder: MailFolder): ButtonAttrs {
		return attachDropdown({
			label: "more_label",
			icon: () => Icons.More,
			colors: ButtonColors.Nav
		}, () => [
			{
				label: "rename_action",
				icon: () => Icons.Edit,
				type: ButtonType.Dropdown,
				click: () => {
					return Dialog.showTextInputDialog("folderNameRename_label", "folderName_label", null,
						getFolderName(folder), (name) => this._checkFolderName(name, mailGroupId))
					             .then((newName) => {
						             let renamedFolder = Object.assign({}, folder, {name: newName})
						             return update(renamedFolder)
					             })
				}
			},
			{
				label: "delete_action",
				icon: () => Icons.Trash,
				type: ButtonType.Dropdown,
				click: () => {
					Dialog.confirm(() => lang.get("confirmDeleteFinallyCustomFolder_msg",
						{"{1}": getFolderName(folder)}))
					      .then(confirmed => {
						      if (confirmed) {
							      this._finallyDeleteCustomMailFolder(folder)
						      }
					      })
				}
			}
		])
	}

	_newMail(): Promise<MailEditor> {
		return this._getMailboxDetails().then(newMail)
	}

	_getMailboxDetails(): Promise<MailboxDetail> {
		return this.selectedFolder
			? mailModel.getMailboxDetailsForMailListId(this.selectedFolder.mails)
			: mailModel.getUserMailboxDetails()
	}

	_checkFolderName(name: string, mailGroupId: Id): Promise<?string> {
		return mailModel.getMailboxDetailsForMailGroup(mailGroupId)
		                .then((mailboxDetails) => {
			                if (name.trim() === "") {
				                return "folderNameNeutral_msg"
			                } else if (mailboxDetails.folders.find(f => f.name === name)) {
				                return "folderNameInvalidExisting_msg"
			                } else {
				                return null
			                }
		                })
	}

	_finallyDeleteCustomMailFolder(folder: MailFolder) {
		if (folder.folderType !== MailFolderType.CUSTOM) {
			throw new Error("Cannot delete non-custom folder: " + String(folder._id))
		}
		//TODO make DeleteMailFolderData unencrypted in next model version
		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.mailList.list.selectNone()
		let deleteMailFolderData = createDeleteMailFolderData()
		deleteMailFolderData.folders.push(folder._id)
		return serviceRequestVoid(TutanotaService.MailFolderService, HttpMethod.DELETE, deleteMailFolderData, null, ("dummy": any))
			.catch(NotFoundError, e => console.log("mail folder already deleted"))
			.catch(PreconditionFailedError, e => Dialog.error("operationStillActive_msg"))
	}

	logout() {
		m.route.set("/")
	}

	elementSelected = (mails: Mail[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean) => {
		if (mails.length === 1 && !multiSelectOperation && (selectionChanged || !this.mailViewer)) {
			// set or update the visible mail
			this.mailViewer = new MailViewer(mails[0], false)
			let url = `/mail/${mails[0]._id.join("/")}`
			if (this.selectedFolder) {
				this._folderToUrl[this.selectedFolder._id[1]] = url
			}
			this._setUrl(url)
			m.redraw()
		} else if (selectionChanged && (mails.length === 0 || multiSelectOperation) && this.mailViewer) {
			// remove the visible mail
			this.mailViewer = null
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
		if (this.mailViewer && !multiSelectOperation) {
			if (mails[0].unread && !mails[0]._errors) {
				mails[0].unread = false
				update(mails[0])
					.catch(NotFoundError,
						e => console.log("could not set read flag as mail has been moved/deleted already", e))
			}
			if (elementClicked) {
				this.mailList.list._loading.then(() => {
					this.viewSlider.focus(this.mailColumn)
				})
			}
		}
	}

	deleteMails(mails: Mail[]): Promise<void> {
		return showDeleteConfirmationDialog(mails).then((confirmed) => {
			if (confirmed) {
				mailModel.deleteMails(mails)
			} else {
				return Promise.resolve()
			}
		})
	}

	_finallyDeleteAllMailsInSelectedFolder(folder: MailFolder) {
		if (folder.folderType !== MailFolderType.TRASH && folder.folderType !== MailFolderType.SPAM) {
			throw new Error(`Cannot delete mails in folder ${String(folder._id)} with type ${folder.folderType}`)
		}
		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.mailList.list.selectNone()
		let deleteMailData = createDeleteMailData()
		deleteMailData.folder = folder._id
		return showProgressDialog("progressDeleting_msg", serviceRequestVoid(TutanotaService.MailService, HttpMethod.DELETE, deleteMailData))
			.catch(PreconditionFailedError, e => Dialog.error("operationStillActive_msg"))
	}


	entityEventReceived<T>(update: EntityUpdateData): void {
		if (isUpdateForTypeRef(MailTypeRef, update) && this.mailList) {
			const {instanceListId, instanceId, operation} = update
			let promise = Promise.resolve()
			if (instanceListId === this.mailList.listId) {
				promise = this.mailList.list.entityEventReceived(instanceId, operation)
			}
			promise.then(() => {
				// run the displayed mail update after the update on the list is finished to avoid parallel email loading
				// update the displayed or edited mail if necessary
				if (operation === OperationType.UPDATE && this.mailViewer
					&& isSameId(this.mailViewer.mail._id, [neverNull(instanceListId), instanceId])) {
					load(MailTypeRef, this.mailViewer.mail._id).then(updatedMail => {
						this.mailViewer = new MailViewer(updatedMail, false)
					}).catch(() => {
						// ignore. might happen if a mail was just sent
					})
				}
			})
		}
	}

	/**
	 * Used by Header to figure out when content needs to be injected there
	 * @returns {Children} Mithril children or null
	 */
	headerView(): Children {
		return this.viewSlider.getVisibleBackgroundColumns().length === 1 && this.mailList && this.mailList.list
		&& this.mailList.list.isMobileMultiSelectionActionActive() ? m(MultiSelectionBar, {
			selectNoneHandler: () => this.mailList.list.selectNone(),
			selectedEntiesLength: this.mailList.list.getSelectedEntities().length,
			content: this._actionBar()
		}) : null
	}
}

export function isNewMailActionAvailable() {
	return logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.ReplyOnly)
}