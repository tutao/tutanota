// @flow
import m from "mithril"
import {ViewSlider} from "../gui/base/ViewSlider"
import {ViewColumn, ColumnType} from "../gui/base/ViewColumn"
import {lang} from "../misc/LanguageViewModel"
import {Button, ButtonType, createDropDownButton, ButtonColors} from "../gui/base/Button"
import {NavButton} from "../gui/base/NavButton"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {update, serviceRequestVoid, load} from "../api/main/Entity"
import {MailViewer} from "./MailViewer"
import {Dialog} from "../gui/base/Dialog"
import {worker} from "../api/main/WorkerClient"
import type {OperationTypeEnum, MailFolderTypeEnum} from "../api/common/TutanotaConstants"
import {OperationType, FeatureType, MailFolderType} from "../api/common/TutanotaConstants"
import {header} from "../gui/base/Header"
import {isSameId, TypeRef, isSameTypeRef, HttpMethod} from "../api/common/EntityFunctions"
import {createDeleteMailFolderData} from "../api/entities/tutanota/DeleteMailFolderData"
import {createDeleteMailData} from "../api/entities/tutanota/DeleteMailData"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {neverNull} from "../api/common/utils/Utils"
import {MailListView} from "./MailListView"
import {MailEditor} from "./MailEditor"
import {assertMainOrNode} from "../api/Env"
import {checkApprovalStatus} from "../misc/ErrorHandlerImpl"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {MailHeadersTypeRef} from "../api/entities/tutanota/MailHeaders"
import {keyManager, Keys} from "../misc/KeyManager"
import {MultiMailViewer} from "./MultiMailViewer"
import {logins} from "../api/main/LoginController"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {opacity, animations} from "../gui/animation/Animations"
import {Icons} from "../gui/base/icons/Icons"
import {theme} from "../gui/theme"
import {NotFoundError, PreconditionFailedError} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {
	getFolderName,
	getFolderIcon,
	isFinallyDeleteAllowed,
	getMailboxName,
	getInboxFolder,
	getSystemFolders,
	getCustomFolders,
	getFolder
} from "./MailUtils"
import type {MailboxDetail} from "./MailModel"
import {mailModel} from "./MailModel"
import {locator} from "../api/main/MainLocator"

assertMainOrNode()

type MailboxExpander = {
	expanderButton:ExpanderButton,
	systemFolderButtons: NavButton[],
	customFolderButtons:NavButton[],
	folderAddButton: Button
}


export class MailView {
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
	_mailboxExpanders: {[mailGroupId:Id]:MailboxExpander}
	_folderToUrl: {[folderId:Id]:string};

	constructor() {
		this.mailViewer = null
		this.mailHeaderInfo = ""
		this._mailboxExpanders = {}
		this._folderToUrl = {}


		this.folderColumn = new ViewColumn({
			view: () => m(".folder-column.scroll.overflow-x-hidden", Object.keys(this._mailboxExpanders).map(mailGroupId => {
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

		let multiMailViewer = new MultiMailViewer(this)
		this.mailColumn = new ViewColumn({
			view: () => m(".mail", this.mailViewer != null ? m(this.mailViewer) : m(multiMailViewer))
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
		this.newAction = new Button('newMail_action', () => this._newMail(), () => Icons.Edit)
			.setType(ButtonType.Floating)

		this.view = (): VirtualElement => {
			return m("#mail.main-view", [
				m(this.viewSlider),
				(this.selectedFolder && logins.isInternalUserLoggedIn()) ? m(this.newAction) : null
			])
		}

		let headerBar = new DialogHeaderBar()
			.addRight(new Button('ok_action', () => this.mailHeaderDialog.close()).setType(ButtonType.Secondary))
			.setMiddle(() => lang.get("mailHeaders_title"))
		this.mailHeaderDialog = Dialog.largeDialog(headerBar, {
			view: () => {
				return m(".white-space-pre.pt.pb", this.mailHeaderInfo)
			}
		}).addShortcut({
			key: Keys.ESC,
			exec: () => this.mailHeaderDialog.close(),
			help: "close_alt"
		})

		this._setupShortcuts()

		locator.entityEvent.addListener((typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum) => this.entityEventReceived(typeRef, listId, elementId, operation))
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
				exec: () => (this._newMail():any),
				enabled: () => this.selectedFolder && logins.isInternalUserLoggedIn(),
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
					this.deleteSelectedMails()
					return
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
				help: "switchArchive_action"
			},
			{
				key: Keys.SIX,
				exec: () => this.switchToFolder(MailFolderType.SPAM),
				enabled: () => logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.InternalCommunication),
				help: "switchSpam_action"
			},
		]

		let mailModelStream = null
		this.oncreate = () => {
			keyManager.registerShortcuts(shortcuts)
			mailModelStream = mailModel.mailboxDetails.map(mailboxDetails => {
				mailboxDetails.forEach(newMailboxDetail => {
					if (!this._mailboxExpanders[newMailboxDetail.mailGroup._id]) {
						this.createMailboxExpander(newMailboxDetail)
					} else {
						this._mailboxExpanders[newMailboxDetail.mailGroup._id].customFolderButtons = this.createFolderButtons(getCustomFolders(newMailboxDetail.folders))
					}
				})
				Object.keys(this._mailboxExpanders).forEach(mailGroupId => {
					if (mailboxDetails.find(mailboxDetail => mailboxDetail.mailGroup._id == mailGroupId) == null) {
						delete this._mailboxExpanders[mailGroupId]
					}
				})

				if (this.selectedFolder) {
					this.selectedFolder = neverNull(mailModel.getMailFolder(this.selectedFolder.mails))
				}
			})
		}
		this.onbeforeremove = () => {
			keyManager.unregisterShortcuts(shortcuts)
			if (mailModelStream) {
				mailModelStream.end(true)
			}
		}
	}

	switchToFolder(folderType: MailFolderTypeEnum) {
		m.route.set(this._folderToUrl[getFolder(mailModel.getMailboxDetailsForMailListId(this.selectedFolder.mails).folders, folderType)._id[1]])
	}

	createMailboxExpander(mailboxDetail: MailboxDetail) {
		this._mailboxExpanders[mailboxDetail.mailGroup._id] = {
			details: mailboxDetail,
			expanderButton: this.createMailBoxExpanderButton(mailboxDetail.mailGroup._id),
			systemFolderButtons: this.createFolderButtons(getSystemFolders(mailboxDetail.folders)),
			customFolderButtons: this.createFolderButtons(getCustomFolders(mailboxDetail.folders)),
			folderAddButton: this.createFolderAddButton(mailboxDetail.mailGroup._id),
		}
	}

	createMailBoxExpanderButton(mailGroupId: Id): ExpanderButton {
		let folderMoreButton = this.createFolderMoreButton(mailGroupId)
		let purgeAllButton = new Button('delete_action', () => {
			Dialog.confirm(() => lang.get("confirmDeleteFinallySystemFolder_msg", {"{1}": getFolderName(this.selectedFolder)})).then(confirmed => {
				if (confirmed) {
					this._finallyDeleteAllMailsInSelectedFolder()
				}
			})
		}, () => Icons.TrashEmpty).setColors(ButtonColors.Nav)

		let mailboxExpander = new ExpanderButton(() => getMailboxName(mailModel.getMailboxDetailsForMailGroup(mailGroupId)), new ExpanderPanel({
			view: () => m(".folders", this._mailboxExpanders[mailGroupId].systemFolderButtons.map(fb => m(".folder-row.flex-space-between.plr-l" + (fb.isSelected() ? ".row-selected" : ""), [
				m(fb),
				fb.isSelected() && this.selectedFolder && isFinallyDeleteAllowed(this.selectedFolder) ? m(purgeAllButton, {
						oncreate: vnode => animations.add(vnode.dom, opacity(0, 1, false)),
						onbeforeremove: vnode => animations.add(vnode.dom, opacity(1, 0, false))
					}) : null
			])).concat(
				logins.isInternalUserLoggedIn() ? [m(".folder-row.flex-space-between.plr-l", [m("small.b.pt-s.align-self-center.ml-negative-xs", {style: {color: theme.navigation_button}}, lang.get("yourFolders_action").toLocaleUpperCase()), m(neverNull(this._mailboxExpanders[mailGroupId].folderAddButton))])] : []
			).concat(this._mailboxExpanders[mailGroupId].customFolderButtons.map(fb => m(".folder-row.flex-space-between.plr-l" + (fb.isSelected() ? ".row-selected" : ""), [
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
		if (this.isInitialized() && args.listId && this.mailList && args.listId != this.mailList.listId) {
			// a mail list is visible and now a new one is selected
			this._showList(args.listId, args.mailId);
		} else if (this.isInitialized() && args.listId && !this.mailList) {
			// the mailbox was loaded and we found the inbox list to show
			this._showList(args.listId, args.mailId);
		} else if (this.isInitialized() && args.listId && this.mailList && args.listId == this.mailList.listId && args.mailId && !this.mailList.list.isEntitySelected(args.mailId)) {
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
		return Object.keys(this._mailboxExpanders).length > 0
	}

	_setUrl(url: string) {
		header.mailsUrl = url
		m.route.set(url + location.hash)
	}


	/**
	 * Shows the mail list with the given list id if the list exists.
	 * @param mailListId The list id
	 * @param mailElementId The element to scroll to and select.
	 * @returns True if the list could be shown, i.e. it exists, false otherwise
	 */
	_showList(mailListId: Id, mailElementId: ? Id): boolean {
		this.mailList = new MailListView(mailListId, (this:any))
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

	createFolderButtons(folders: MailFolder[]) {
		return folders.map(folder => {
			this._folderToUrl[folder._id[1]] = `/mail/${folder.mails}`
			let button = new NavButton(() => getFolderName(folder), getFolderIcon(folder), () => this._folderToUrl[folder._id[1]], "/mail/" + folder.mails)
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
			return Dialog.showTextInputDialog("folderNameCreate_label", "folderName_label", null, "", (name) => this._checkFolderName(name, mailGroupId)).then((name) => {
				return worker.createMailFolder(name, getInboxFolder(mailModel.getMailboxDetailsForMailGroup(mailGroupId).folders)._id, mailGroupId)
			})
		}, () => Icons.Add).setColors(ButtonColors.Nav)
	}

	createFolderMoreButton(mailGroupId: Id) {
		return createDropDownButton("more_label", () => Icons.More, () => [
			new Button('rename_action', () => {
				return Dialog.showTextInputDialog("folderNameRename_label", "folderName_label", null, getFolderName(this.selectedFolder), (name) => this._checkFolderName(name, mailGroupId)).then((newName) => {
					let renamedFolder = Object.assign({}, this.selectedFolder, {name: newName})
					return update(renamedFolder)
				})
			}, () => Icons.Edit).setType(ButtonType.Dropdown),
			new Button('delete_action', () => {
				Dialog.confirm(() => lang.get("confirmDeleteFinallyCustomFolder_msg", {"{1}": getFolderName(this.selectedFolder)})).then(confirmed => {
					if (confirmed) {
						this._finallyDeleteCustomMailFolder()
					}
				})
			}, () => Icons.Trash).setType(ButtonType.Dropdown)
		]).setColors(ButtonColors.Nav)
	}

	_newMail() {
		return checkApprovalStatus(false).then(sendAllowed => {
			if (sendAllowed) {
				new MailEditor(mailModel.getMailboxDetailsForMailListId(this.selectedFolder.mails)).show()
			}
		})
	}

	_checkFolderName(name: string, mailGroupId: Id): ?string {
		if (name.trim() == "") {
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
		return serviceRequestVoid(TutanotaService.MailFolderService, HttpMethod.DELETE, deleteMailFolderData, null, ("dummy":any))
			.catch(NotFoundError, e => console.log("mail folder already deleted"))
			.catch(PreconditionFailedError, e => Dialog.error("operationStillActive_msg"))
	}

	logout() {
		m.route.set("/")
	}

	elementSelected(mails: Mail[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (mails.length == 1 && !multiSelectOperation && (selectionChanged || !this.mailViewer)) {
			// set or update the visible mail
			this.mailViewer = new MailViewer(mails[0], false)
			let url = `/mail/${mails[0]._id.join("/")}`
			this._folderToUrl[this.selectedFolder._id[1]] = url
			this._setUrl(url)
			if (mails[0].unread && !mails[0]._errors) {
				mails[0].unread = false
				update(mails[0]).catch(NotFoundError, e => console.log("could not set read flag as mail has been moved/deleted already", e))
			}
			m.redraw()
		} else if (selectionChanged && (mails.length == 0 || multiSelectOperation) && this.mailViewer) {
			// remove the visible mail
			this.mailViewer = null
			let url = `/mail/${this.mailList.listId}`
			this._folderToUrl[this.selectedFolder._id[1]] = url
			this._setUrl(url)
			m.redraw()
		} else if (selectionChanged) {
			// update the multi mail viewer
			m.redraw()
		}
		if (this.mailViewer && elementClicked) {
			this.mailList.list._loading.then(() => {
				this.viewSlider.focus(this.mailColumn)
			})
		}
	}

	deleteSelectedMails(): Promise<void> {
		return mailModel.deleteMails(this.mailList.list.getSelectedEntities())
	}

	_finallyDeleteAllMailsInSelectedFolder() {
		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.mailList.list.selectNone()
		let deleteMailData = createDeleteMailData()
		deleteMailData.folder = this.selectedFolder._id
		return showProgressDialog("progressDeleting_msg", serviceRequestVoid(TutanotaService.MailService, HttpMethod.DELETE, deleteMailData))
			.catch(PreconditionFailedError, e => Dialog.error("operationStillActive_msg"))
	}


	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, MailTypeRef) && this.mailList) {
			let promise = Promise.resolve()
			if (listId == this.mailList.listId) {
				promise = this.mailList.list.entityEventReceived(elementId, operation)
			}
			promise.then(() => {
				// run the displayed mail update after the update on the list is finished to avoid parallel email loading
				// update the displayed or edited mail if necessary
				if (operation == OperationType.UPDATE && this.mailViewer && isSameId(this.mailViewer.mail._id, [neverNull(listId), elementId])) {
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
				)
			} else {
				this.mailHeaderInfo = lang.get("noMailHeadersInfo_msg")
				this.mailHeaderDialog.show()
			}
		}
	}
}
