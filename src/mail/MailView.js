// @flow
import m from "mithril"
import {ViewSlider} from "../gui/base/ViewSlider"
import {ColumnType, ViewColumn} from "../gui/base/ViewColumn"
import {lang} from "../misc/LanguageViewModel"
import {Button, ButtonColors, ButtonType, createDropDownButton} from "../gui/base/Button"
import {isSelectedPrefix, NavButton} from "../gui/base/NavButton"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {load, serviceRequestVoid, update} from "../api/main/Entity"
import {MailViewer} from "./MailViewer"
import {Dialog} from "../gui/base/Dialog"
import {worker} from "../api/main/WorkerClient"
import type {MailFolderTypeEnum} from "../api/common/TutanotaConstants"
import {FeatureType, MailFolderType, OperationType} from "../api/common/TutanotaConstants"
import {CurrentView, header} from "../gui/base/Header"
import {HttpMethod, isSameId} from "../api/common/EntityFunctions"
import {createDeleteMailFolderData} from "../api/entities/tutanota/DeleteMailFolderData"
import {createDeleteMailData} from "../api/entities/tutanota/DeleteMailData"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {lazyMemoized, neverNull, noOp} from "../api/common/utils/Utils"
import {MailListView} from "./MailListView"
import {MailEditor} from "./MailEditor"
import {assertMainOrNode, isApp} from "../api/Env"
import {checkApprovalStatus} from "../misc/ErrorHandlerImpl"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {MailHeadersTypeRef} from "../api/entities/tutanota/MailHeaders"
import {keyManager, Keys} from "../misc/KeyManager"
import {MultiMailViewer} from "./MultiMailViewer"
import {logins} from "../api/main/LoginController"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {animations, opacity} from "../gui/animation/Animations"
import {Icons} from "../gui/base/icons/Icons"
import {theme} from "../gui/theme"
import {NotFoundError, PreconditionFailedError} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {
	getEmailSignature,
	getFolder,
	getFolderIcon,
	getFolderName,
	getInboxFolder,
	getMailboxName,
	getSortedCustomFolders,
	getSortedSystemFolders,
	isFinalDelete,
	showDeleteConfirmationDialog
} from "./MailUtils"
import type {MailboxDetail} from "./MailModel"
import {mailModel} from "./MailModel"
import {locator} from "../api/main/MainLocator"
import {pushServiceApp} from "../native/PushServiceApp"
import {ActionBar} from "../gui/base/ActionBar";
import {MultiSelectionBar} from "../gui/base/MultiSelectionBar"
import type {EntityUpdateData} from "../api/main/EntityEventController"
import {isUpdateForTypeRef} from "../api/main/EntityEventController"
import {fileController} from "../file/FileController"
import {PermissionError} from "../api/common/error/PermissionError"

assertMainOrNode()

type MailboxExpander = {
	expanderButton: ExpanderButton,
	systemFolderButtons: NavButton[],
	customFolderButtons: NavButton[],
	folderAddButton: Button
}


export class MailView implements CurrentView {
	listColumn: ViewColumn;
	folderColumn: ViewColumn;
	mailColumn: ViewColumn;
	viewSlider: ViewSlider;
	mailList: MailListView;
	view: Function;
	selectedFolder: MailFolder;
	mailViewer: ?MailViewer;
	newAction: Button;
	mailHeaderDialog: Dialog;
	mailHeaderInfo: string;
	oncreate: Function;
	onbeforeremove: Function;
	_mailboxExpanders: {[mailGroupId: Id]: MailboxExpander}
	_folderToUrl: {[folderId: Id]: string};
	_multiMailViewer: MultiMailViewer;
	_actionBar: lazy<ActionBar>

	constructor() {
		this.mailViewer = null
		this.mailHeaderInfo = ""
		this._mailboxExpanders = {}
		this._folderToUrl = {}


		this.folderColumn = new ViewColumn({
			view: () => m(".folder-column.scroll.overflow-x-hidden",
				Object.keys(this._mailboxExpanders)
				      .map(mailGroupId => {
						      let expander = this._mailboxExpanders[mailGroupId]
						      return [
							      m(".mr-negative-s.flex-space-between.plr-l", m(expander.expanderButton)),
							      m(neverNull(expander.expanderButton).panel)
						      ]
					      }
				      ))
		}, ColumnType.Foreground, 200, 300, () => lang.get("folderTitle_label"))


		this.listColumn = new ViewColumn({
			view: () => m(".list-column", [
				this.mailList ? m(this.mailList) : null,
			])
		}, ColumnType.Background, 300, 500, () => {
			return this.selectedFolder ? getFolderName(this.selectedFolder) : ""
		})

		this._multiMailViewer = new MultiMailViewer(this)
		this._actionBar = lazyMemoized(() => this._multiMailViewer.createActionBar())
		this.mailColumn = new ViewColumn({
			view: () => m(".mail", this.mailViewer != null ? m(this.mailViewer) : m(this._multiMailViewer))
		}, ColumnType.Background, 600, 2400, () => {
			let selectedEntities = this.mailList.list.getSelectedEntities();
			if (selectedEntities.length > 0) {
				let selectedIndex = this.mailList.list._loadedEntities.indexOf(selectedEntities[0]) + 1
				return selectedIndex + "/" + this.mailList.list._loadedEntities.length
			} else {
				return ""
			}
		})

		this.viewSlider = new ViewSlider([this.folderColumn, this.listColumn, this.mailColumn], "MailView")
		this.newAction = new Button('newMail_action', () => this._newMail().catch(noOp), () => Icons.Edit)
			.setType(ButtonType.Floating)

		this.view = (): VirtualElement => {
			return m("#mail.main-view",
				{
					ondragover: (ev) => {
						// do not check the datatransfer here because it is not always filled, e.g. in Safari
						ev.stopPropagation()
						ev.preventDefault()
						ev.dataTransfer.dropEffect = 'copy'
					},
					ondrop: (ev) => {
						if (ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
							Promise.join(
								this._newMail(),
								fileController.readLocalFiles(ev.dataTransfer.files),
								(ed, dataFiles) => {
									ed.attachFiles((dataFiles: any))
									m.redraw()
								}).catch(noOp)
							ev.stopPropagation()
							ev.preventDefault()
						}
					}
				}
				, [
					m(this.viewSlider),
					(this.selectedFolder && logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.ReplyOnly))
						? m(this.newAction)
						: null
				])
		}

		let closeAction = () => this.mailHeaderDialog.close()
		let headerBar = new DialogHeaderBar()
			.addRight(new Button('ok_action', closeAction).setType(ButtonType.Secondary))
			.setMiddle(() => lang.get("mailHeaders_title"))
		this.mailHeaderDialog = Dialog.largeDialog(headerBar, {
			view: () => {
				return m(".white-space-pre.pt.pb.selectable", this.mailHeaderInfo)
			}
		}).addShortcut({
			key: Keys.ESC,
			exec: closeAction,
			help: "close_alt"
		}).setCloseHandler(closeAction)

		this._setupShortcuts()

		locator.entityEvent.addListener((updates) => {
			for (let update of updates) {
				this.entityEventReceived(update)
			}
		})
	}

	getViewSlider(): ?IViewSlider {
		return this.viewSlider
	}

	_setupShortcuts() {
		let shortcuts = [
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
				key: Keys.UP,
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
				key: Keys.DOWN,
				shift: true,
				exec: () => this.mailList.list.selectNext(true),
				help: "addNext_action"
			},
			{
				key: Keys.N,
				exec: () => (this._newMail(): any),
				enabled: () => this.selectedFolder && logins.isInternalUserLoggedIn()
					&& !logins.isEnabled(FeatureType.ReplyOnly),
				help: "newMail_action"
			},
			{
				key: Keys.R,
				exec: (key: KeyPress) => {
					if (this.mailViewer) this.mailViewer._reply(false)
				},
				help: "reply_action"
			},
			{
				key: Keys.R,
				shift: true,
				exec: (key: KeyPress) => {
					if (this.mailViewer) this.mailViewer._reply(true)
				},
				help: "replyAll_action"
			},
			{
				key: Keys.H,
				ctrl: true,
				exec: () => this._showHeaders(),
				help: "showHeaders_action"
			},
			{
				key: Keys.DELETE,
				exec: () => {
					this.deleteMails(this.mailList.list.getSelectedEntities())
				},
				help: "deleteEmails_action"
			},
			{
				key: Keys.ONE,
				exec: () => this.switchToFolder(MailFolderType.INBOX),
				help: "switchInbox_action"
			},
			{
				key: Keys.TWO,
				exec: () => this.switchToFolder(MailFolderType.DRAFT),
				help: "switchDrafts_action"
			},
			{
				key: Keys.THREE,
				exec: () => this.switchToFolder(MailFolderType.SENT),
				help: "switchSentFolder_action"
			},
			{
				key: Keys.FOUR,
				exec: () => this.switchToFolder(MailFolderType.TRASH),
				help: "switchTrash_action"
			},
			{
				key: Keys.FIVE,
				exec: () => this.switchToFolder(MailFolderType.ARCHIVE),
				enabled: () => logins.isInternalUserLoggedIn(),
				help: "switchArchive_action"
			},
			{
				key: Keys.SIX,
				exec: () => this.switchToFolder(MailFolderType.SPAM),
				enabled: () => logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.InternalCommunication),
				help: "switchSpam_action"
			},
		]

		// do not stop observing the mailboxDetails when this view is invisible because the view is cached and switching back to this view while the mailboxes have changed leads to errors
		let mailModelStream = mailModel.mailboxDetails.map(mailboxDetails => {
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
					if (isSelectedPrefix("/mail")) {
						this._setUrl(url)
					} else {
						header.mailsUrl = url
					}
				}
			}
		})
		this.oncreate = () => {
			keyManager.registerShortcuts(shortcuts)

		}
		this.onbeforeremove = () => {
			keyManager.unregisterShortcuts(shortcuts)
		}
	}

	switchToFolder(folderType: MailFolderTypeEnum) {
		m.route.set(this._folderToUrl[getFolder(mailModel.getMailboxDetailsForMailListId(this.selectedFolder.mails).folders, folderType)._id[1]])
	}

	createMailboxExpander(mailboxDetail: MailboxDetail) {
		this._mailboxExpanders[mailboxDetail.mailGroup._id] = {
			details: mailboxDetail,
			expanderButton: this.createMailBoxExpanderButton(mailboxDetail.mailGroup._id),
			systemFolderButtons: this.createFolderButtons(getSortedSystemFolders(mailboxDetail.folders)),
			customFolderButtons: this.createFolderButtons(getSortedCustomFolders(mailboxDetail.folders)),
			folderAddButton: this.createFolderAddButton(mailboxDetail.mailGroup._id),
		}
	}

	createMailBoxExpanderButton(mailGroupId: Id): ExpanderButton {
		let folderMoreButton = this.createFolderMoreButton(mailGroupId)
		let purgeAllButton = new Button('delete_action', () => {
			Dialog.confirm(() => lang.get("confirmDeleteFinallySystemFolder_msg", {"{1}": getFolderName(this.selectedFolder)}))
			      .then(confirmed => {
				      if (confirmed) {
					      this._finallyDeleteAllMailsInSelectedFolder()
				      }
			      })
		}, () => Icons.TrashEmpty).setColors(ButtonColors.Nav)

		let mailboxExpander = new ExpanderButton(() => getMailboxName(mailModel.getMailboxDetailsForMailGroup(mailGroupId)), new ExpanderPanel({
			view: () => m(".folders", this._mailboxExpanders[mailGroupId].systemFolderButtons.map(fb =>
				m(".folder-row.flex-space-between.plr-l" + (fb.isSelected() ? ".row-selected" : ""), [
					m(fb),
					fb.isSelected() && this.selectedFolder && isFinalDelete(this.selectedFolder) ? m(purgeAllButton, {
						oncreate: vnode => animations.add(vnode.dom, opacity(0, 1, false)),
						onbeforeremove: vnode => animations.add(vnode.dom, opacity(1, 0, false))
					}) : null
				]))
			                                                             .concat(
				                                                             logins.isInternalUserLoggedIn() ? [
					                                                             m(".folder-row.flex-space-between.plr-l", [
						                                                             m("small.b.pt-s.align-self-center.ml-negative-xs",
							                                                             {style: {color: theme.navigation_button}},
							                                                             lang.get("yourFolders_action")
							                                                                 .toLocaleUpperCase()),
						                                                             m(neverNull(this._mailboxExpanders[mailGroupId].folderAddButton))
					                                                             ])
				                                                             ] : []
			                                                             )
			                                                             .concat(
				                                                             this._mailboxExpanders[mailGroupId].customFolderButtons.map(fb =>
					                                                             m(".folder-row.flex-space-between.plr-l"
						                                                             + (fb.isSelected() ? ".row-selected" : ""), [
						                                                             m(fb),
						                                                             fb.isSelected() ? m(folderMoreButton, {
							                                                             oncreate: vnode => animations.add(vnode.dom, opacity(0, 1, false)),
							                                                             onbeforeremove: vnode => animations.add(vnode.dom, opacity(1, 0, false))
						                                                             }) : null
					                                                             ]))))
		}), false, {}, theme.navigation_button)
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
				mailModel.init().then(() => {
					let editor = new MailEditor(mailModel.getUserMailboxDetails())
					editor.initWithMailtoUrl(decodedUrl, false)
					editor.show()
					history.pushState("", document.title, window.location.pathname) // remove # from url
				})
			}
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
		} else if (!this.isInitialized()) {
			mailModel.init().then(() => {
				if (typeof args.listId === 'undefined') {
					this._setUrl(this._folderToUrl[getInboxFolder(mailModel.mailboxDetails()[0].folders)._id[1]])
				} else {
					if (!this._showList(args.listId, args.mailId)) {
						this._setUrl(this._folderToUrl[getInboxFolder(mailModel.mailboxDetails()[0].folders)._id[1]])
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
		header.mailsUrl = url
		// do not change the url if the search view is active
		if (m.route.get().startsWith("/mail")) {
			m.route.set(url + location.hash)
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
			header.mailsUrl = this._folderToUrl[folder._id[1]]
			if (!mailElementId) {
				this.mailViewer = null
			}
			this.mailList.list.loadInitial(mailElementId)
			return true
		} else {
			return false
		}
	}

	createFolderButtons(folders: MailFolder[]): NavButton[] {
		return folders.map(folder => {
			this._folderToUrl[folder._id[1]] = `/mail/${folder.mails}`
			let button = new NavButton(() => getFolderName(folder),
				getFolderIcon(folder),
				() => this._folderToUrl[folder._id[1]], "/mail/" + folder.mails)
				.setColors(ButtonColors.Nav)
			button.setClickHandler((event) => {
				this.viewSlider.focus(this.listColumn)
			})

			button.setDropHandler(droppedMailId => {
				// the dropped mail is among the selected mails, move all selected mails
				if (this.mailList.list.isEntitySelected(droppedMailId)) {
					mailModel.moveMails(this.mailList.list.getSelectedEntities(), folder)
				} else {
					let entity = this.mailList.list.getEntity(droppedMailId)
					if (entity) {
						mailModel.moveMails([entity], folder)
					}
				}
			})
			return button
		})
	}

	createFolderAddButton(mailGroupId: Id) {
		return new Button('add_action', () => {
			return Dialog.showTextInputDialog("folderNameCreate_label", "folderName_label", null, "",
				(name) => this._checkFolderName(name, mailGroupId))
			             .then((name) => {
				             return worker.createMailFolder(name,
					             getInboxFolder(mailModel.getMailboxDetailsForMailGroup(mailGroupId).folders)._id,
					             mailGroupId)
			             })
		}, () => Icons.Add).setColors(ButtonColors.Nav)
	}

	createFolderMoreButton(mailGroupId: Id) {
		return createDropDownButton("more_label", () => Icons.More, () => [
			new Button('rename_action', () => {
				return Dialog.showTextInputDialog("folderNameRename_label", "folderName_label", null,
					getFolderName(this.selectedFolder), (name) => this._checkFolderName(name, mailGroupId))
				             .then((newName) => {
					             let renamedFolder = Object.assign({}, this.selectedFolder, {name: newName})
					             return update(renamedFolder)
				             })
			}, () => Icons.Edit).setType(ButtonType.Dropdown),
			new Button('delete_action', () => {
				Dialog.confirm(() => lang.get("confirmDeleteFinallyCustomFolder_msg",
					{"{1}": getFolderName(this.selectedFolder)}))
				      .then(confirmed => {
					      if (confirmed) {
						      this._finallyDeleteCustomMailFolder()
					      }
				      })
			}, () => Icons.Trash).setType(ButtonType.Dropdown)
		]).setColors(ButtonColors.Nav)
	}

	/**
	 * open a MailEditor
	 * @returns {*}
	 * @private
	 * @throws PermissionError
	 */
	_newMail(): Promise<MailEditor> {
		return checkApprovalStatus(false).then(sendAllowed => {
			if (sendAllowed) {
				let editor = new MailEditor(mailModel.getMailboxDetailsForMailListId(this.selectedFolder.mails))
				editor.initWithTemplate(null, null, "", "<br/>" + getEmailSignature())
				editor.show()
				return editor
			}
			return Promise.reject(new PermissionError("not allowed to send mail"))
		})
	}

	_checkFolderName(name: string, mailGroupId: Id): ?string {
		if (name.trim() === "") {
			return "folderNameNeutral_msg"
		} else if (mailModel.getMailboxDetailsForMailGroup(mailGroupId).folders.find(f => f.name === name)) {
			return "folderNameInvalidExisting_msg"
		} else {
			return null;
		}
	}

	_finallyDeleteCustomMailFolder() {
		//TODO make DeleteMailFolderData unencrypted in next model version
		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.mailList.list.selectNone()
		let deleteMailFolderData = createDeleteMailFolderData()
		deleteMailFolderData.folders.push(this.selectedFolder._id)
		return serviceRequestVoid(TutanotaService.MailFolderService, HttpMethod.DELETE, deleteMailFolderData, null, ("dummy": any))
			.catch(NotFoundError, e => console.log("mail folder already deleted"))
			.catch(PreconditionFailedError, e => Dialog.error("operationStillActive_msg"))
	}

	logout() {
		m.route.set("/")
	}

	elementSelected(mails: Mail[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (mails.length === 1 && !multiSelectOperation && (selectionChanged || !this.mailViewer)) {
			// set or update the visible mail
			this.mailViewer = new MailViewer(mails[0], false)
			let url = `/mail/${mails[0]._id.join("/")}`
			this._folderToUrl[this.selectedFolder._id[1]] = url
			this._setUrl(url)
			m.redraw()
		} else if (selectionChanged && (mails.length === 0 || multiSelectOperation) && this.mailViewer) {
			// remove the visible mail
			this.mailViewer = null
			let url = `/mail/${this.mailList.listId}`;
			this._folderToUrl[this.selectedFolder._id[1]] = url
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
			if (confirmed == true) {
				mailModel.deleteMails(mails)
			} else {
				return Promise.resolve()
			}
		})
	}

	_finallyDeleteAllMailsInSelectedFolder() {
		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.mailList.list.selectNone()
		let deleteMailData = createDeleteMailData()
		deleteMailData.folder = this.selectedFolder._id
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

	_showHeaders() {
		if (this.mailViewer != null && !this.mailHeaderDialog.visible) {
			if (this.mailViewer.mail.headers) {
				load(MailHeadersTypeRef, this.mailViewer.mail.headers).then(mailHeaders => {
						this.mailHeaderInfo = mailHeaders.headers
						this.mailHeaderDialog.show()
					}
				).catch(NotFoundError, noOp)
			} else {
				this.mailHeaderInfo = lang.get("noMailHeadersInfo_msg")
				this.mailHeaderDialog.show()
			}
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
