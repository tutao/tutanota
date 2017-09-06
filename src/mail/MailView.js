// @flow
import m from "mithril"
import {ViewSlider} from "../gui/base/ViewSlider"
import {ViewColumn, ColumnType} from "../gui/base/ViewColumn"
import {lang} from "../misc/LanguageViewModel"
import {Button, ButtonType, createDropDownButton, ButtonColors} from "../gui/base/Button"
import {NavButton} from "../gui/base/NavButton"
import {MailBoxController} from "./MailBoxController"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {update, serviceRequestVoid, loadAll, load} from "../api/main/Entity"
import {MailFolderViewModel} from "./MailFolderViewModel"
import {MailViewer} from "./MailViewer"
import {Dialog} from "../gui/base/Dialog"
import {worker} from "../api/main/WorkerClient"
import {OperationType, GroupType} from "../api/common/TutanotaConstants"
import {header} from "../gui/base/Header"
import {isSameId, TypeRef, isSameTypeRef, HttpMethod} from "../api/common/EntityFunctions"
import {createDeleteMailFolderData} from "../api/entities/tutanota/DeleteMailFolderData"
import {createDeleteMailData} from "../api/entities/tutanota/DeleteMailData"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {createMoveMailData} from "../api/entities/tutanota/MoveMailData"
import {MailFolderTypeRef} from "../api/entities/tutanota/MailFolder"
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
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {UserTypeRef} from "../api/entities/sys/User"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {Icons} from "../gui/base/icons/Icons"
import {theme} from "../gui/theme"
import {NotFoundError} from "../api/common/error/RestError"

assertMainOrNode()

export class MailView {
	listColumn: ViewColumn;
	folderColumn: ViewColumn;
	mailColumn: ViewColumn;
	viewSlider: ViewSlider;
	mailList: MailListView;
	view: Function;
	mailboxControllers: MailBoxController[];
	selectedFolder: MailFolderViewModel;
	selectedMailbox: ?MailBoxController;
	mailViewer: ?MailViewer;
	newAction: Button;
	mailHeaderDialog: Dialog;
	mailHeaderInfo: string;
	oncreate: Function;
	onbeforeremove: Function;

	constructor() {
		this.mailViewer = null
		this.mailHeaderInfo = ""
		this.mailboxControllers = []
		this.selectedMailbox = null


		this.folderColumn = new ViewColumn({
			view: () => m(".folder-column.scroll.overflow-x-hidden", this.mailboxControllers.map(mc => {
					return mc.mailboxExpander ? ([
							m(".mr-negative-s.flex-space-between.plr-l", m(mc.mailboxExpander)),
							m(neverNull(mc.mailboxExpander).panel)
						]:Vnode<any>[]) : null
				}
			))
		}, ColumnType.Foreground, 200, 300, () => lang.get("folderTitle_label"))


		this.listColumn = new ViewColumn({
			view: () => m("list-column", [
				this.mailList ? m(this.mailList) : null,
			])
		}, ColumnType.Background, 300, 500, () => {
			return this.selectedFolder ? this.selectedFolder.getDisplayName() : ""
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
		this.newAction = new Button('newMail_action', () => this._newMail(), () => BootIcons.Edit)
			.setType(ButtonType.Floating).setIsVisibleHandler(() => logins.isInternalUserLoggedIn())

		this.view = (): VirtualElement => {
			return m("#mail.main-view", [
				m(this.viewSlider),
				(logins.isInternalUserLoggedIn()) ? m(this.newAction) : null
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

		worker.getEntityEventController().addListener((typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum) => this.entityEventReceived(typeRef, listId, elementId, operation))
	}

	_setupShortcuts() {
		let shortcuts = [
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
				enabled: () => logins.isInternalUserLoggedIn(),
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
				exec: () => this.deleteSelected(),
				help: "deleteEmails_action"
			},
			{
				key: Keys.ONE,
				exec: () => this.selectedMailbox ? m.route.set(this.selectedMailbox.systemFolderButtons[0]._getUrl()) : null,
				help: "switchInbox_action"
			},
			{
				key: Keys.TWO,
				exec: () => this.selectedMailbox ? m.route.set(this.selectedMailbox.systemFolderButtons[1]._getUrl()) : null,
				help: "switchDrafts_action"
			},
			{
				key: Keys.THREE,
				exec: () => this.selectedMailbox ? m.route.set(this.selectedMailbox.systemFolderButtons[2]._getUrl()) : null,
				help: "switchSentFolder_action"
			},
			{
				key: Keys.FOUR,
				exec: () => this.selectedMailbox ? m.route.set(this.selectedMailbox.systemFolderButtons[3]._getUrl()) : null,
				help: "switchTrash_action"
			},
			{
				key: Keys.FIVE,
				exec: () => this.selectedMailbox ? m.route.set(this.selectedMailbox.systemFolderButtons[4]._getUrl()) : null,
				help: "switchArchive_action"
			},
			{
				key: Keys.SIX,
				exec: () => this.selectedMailbox ? m.route.set(this.selectedMailbox.systemFolderButtons[5]._getUrl()) : null,
				enabled: () => logins.isInternalUserLoggedIn(),
				help: "switchSpam_action"
			},
		]

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)
		this.onbeforeremove = () => keyManager.unregisterShortcuts(shortcuts)
	}


	createMailBoxExpander(mailBoxController: MailBoxController): ExpanderButton {
		let folderMoreButton = this.createFolderMoreButton(mailBoxController)
		let purgeAllButton = new Button('delete_action', () => {
			Dialog.confirm(() => lang.get("confirmDeleteFinallySystemFolder_msg", {"{1}": this.selectedFolder.getDisplayName()})).then(confirmed => {
				if (confirmed) {
					this.deleteAll()
				}
			})
		}, () => Icons.TrashEmpty).setColors(ButtonColors.Nav)

		let mailboxExpander = new ExpanderButton(() => mailBoxController.displayName, new ExpanderPanel({
			view: () => m(".folders", mailBoxController.systemFolderButtons.map(fb => m(".folder-row.flex-space-between.plr-l" + (fb.isSelected() ? ".row-selected" : ""), [
				m(fb),
				fb.isSelected() && this.selectedFolder && this.selectedFolder.isFinallyDeleteAllowed() ? m(purgeAllButton, {
						oncreate: vnode => animations.add(vnode.dom, opacity(0, 1, false)),
						onbeforeremove: vnode => animations.add(vnode.dom, opacity(1, 0, false))
					}) : null
			])).concat(
				logins.isInternalUserLoggedIn() ? [m(".folder-row.flex-space-between.plr-l", [m("small.b.pt-s.align-self-center.ml-negative-xs", {style: {color: theme.navigation_light_fg}}, lang.get("yourFolders_action").toLocaleUpperCase()), m(neverNull(mailBoxController.folderAddButton))])] : []
			).concat(mailBoxController.customFolderButtons.map(fb => m(".folder-row.flex-space-between.plr-l" + (fb.isSelected() ? ".row-selected" : ""), [
				m(fb),
				fb.isSelected() ? m(folderMoreButton, {
						oncreate: vnode => animations.add(vnode.dom, opacity(0, 1, false)),
						onbeforeremove: vnode => animations.add(vnode.dom, opacity(1, 0, false))
					}) : null
			]))), null)
		}), false, {}, theme.navigation_light_fg)
		mailboxExpander.toggle()
		return mailboxExpander
	}

	/**
	 * Notifies the current view about changes of the url within its scope.
	 *
	 * @param args Object containing the optional parts of the url which are listId and mailId for the mail view.
	 */
	updateUrl(args: Object) {
		if (this.isMailboxControllerAvailable() && args.listId && this.mailList && args.listId != this.mailList.listId) {
			// a mail list is visible and now a new one is selected
			this._showList(args.listId, args.mailId);
		} else if (this.isMailboxControllerAvailable() && args.listId && !this.mailList) {
			// the mailbox was loaded and we found the inbox list to show
			this._showList(args.listId, args.mailId);
		} else if (this.isMailboxControllerAvailable() && args.listId && this.mailList && args.listId == this.mailList.listId && args.mailId && !this.mailList.list.isEntitySelected(args.mailId)) {
			// the mail list is visible already, just the selected mail is changed
			this.mailList.list.scrollToIdAndSelect(args.mailId)
		} else if (!this.isMailboxControllerAvailable()) {
			let mailGroupMemberships = logins.getUserController().getMailGroupMemberships()
			Promise.each(mailGroupMemberships, membership => {
				return this._addMailBoxController(membership)
			}).then(() => {
				if (typeof args.listId === 'undefined') {
					this._setUrl(this.mailboxControllers[0].getInboxFolder().url)
				} else {
					if (!this._showList(args.listId, args.mailId)) {
						this._setUrl(this.mailboxControllers[0].getInboxFolder().url)
					}
				}
				m.redraw()
			})

		}
	}

	_addMailBoxController(membership: GroupMembership): Promise<void> {
		let mailboxController = new MailBoxController(membership)
		this.mailboxControllers.push(mailboxController)
		return mailboxController.loadMailBox().then(() => {
			mailboxController.systemFolderButtons = this.createFolderButtons(mailboxController.getSystemFolders())
			mailboxController.customFolderButtons = this.createFolderButtons(mailboxController.getCustomFolders())
			mailboxController.folderAddButton = this.createFolderAddButton(mailboxController)
			mailboxController.mailboxExpander = this.createMailBoxExpander(mailboxController)
		})
	}


	isMailboxControllerAvailable() {
		return this.mailboxControllers.length > 0
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
		//let folder = (this.mailboxControllers.getAllFolders().find(vm => vm.folder.mails === mailListId):any)
		return this.mailboxControllers.some(mailboxController => {
			let folder = mailboxController.getAllFolders().find(vm => vm.folder.mails === mailListId)
			if (folder) {
				this.selectedFolder = folder
				this.selectedMailbox = mailboxController
				header.mailsUrl = folder.url
				if (!mailElementId) {
					this.mailViewer = null
				}
				this.mailList.list.loadInitial(mailElementId)
				return true
			} else {
				return false
			}
		})
	}

	createFolderButtons(folders: MailFolderViewModel[]) {
		return folders.map(vm => {
			let button = new NavButton(() => vm.getDisplayName(), vm.getDisplayIcon(), () => vm.url, "/mail/" + vm.folder.mails)
				.setColors(ButtonColors.Nav)
			button.setClickHandler((event) => {
				this.viewSlider.focus(this.listColumn)
			})

			button.setDropHandler(droppedMailId => {
				// the dropped mail is among the selected mails, move all selected mails
				if (this.mailList.list.isEntitySelected(droppedMailId)) {
					this.moveMails(vm, this.mailList.list.getSelectedEntities())
				} else {
					let entity = this.mailList.list.getEntity(droppedMailId)
					if (entity) {
						this.moveMails(vm, [entity])
					}
				}
			})
			return button
		})
	}

	createFolderAddButton(mailBox: MailBoxController) {
		return new Button('add_action', () => {
			return Dialog.showTextInputDialog("folderNameCreate_label", "folderName_label", null, "", (name) => this._checkFolderName(name, mailBox)).then((name) => {
				return worker.createMailFolder(name, mailBox.getInboxFolder().folder._id, neverNull(mailBox).mailGroupMembership.group)
			})
		}, () => Icons.Add).setColors(ButtonColors.Nav)
	}

	createFolderMoreButton(mailbox: MailBoxController) {
		return createDropDownButton("more_label", () => Icons.More, () => [
			new Button('rename_action', () => {
				return Dialog.showTextInputDialog("folderNameRename_label", "folderName_label", null, this.selectedFolder.getDisplayName(), (name) => this._checkFolderName(name, mailbox)).then((newName) => {
					this.selectedFolder.folder.name = newName
					return update(this.selectedFolder.folder)
				})
			}, () => BootIcons.Edit).setType(ButtonType.Dropdown),
			new Button('delete_action', () => {
				let message = "confirmDeleteCustomFolder_msg"
				if (this.selectedFolder.isFinallyDeleteAllowed()) {
					message = "confirmDeleteFinallyCustomFolder_msg"
				}
				Dialog.confirm(() => lang.get(message, {"{1}": this.selectedFolder.getDisplayName()})).then(confirmed => {
					if (confirmed) {
						this.deleteMailFolder(mailbox)
					}
				})
			}, () => Icons.Trash).setType(ButtonType.Dropdown)
		]).setColors(ButtonColors.Nav)
	}

	_newMail() {
		return checkApprovalStatus(false).then(sendAllowed => {
			if (sendAllowed) {
				new MailEditor(neverNull(this.selectedMailbox)).show()
			}
		})
	}

	_checkFolderName(name: string, mailBox: MailBoxController): ?string {
		if (name.trim() == "") {
			return "folderNameNeutral_msg"
		} else if (mailBox.getAllFolders().find(f => f.folder.name === name)) {
			return "folderNameInvalidExisting_msg"
		} else {
			return null;
		}
	}

	deleteMailFolder(mailBox: MailBoxController) {
		if (this.selectedFolder.isFinallyDeleteAllowed()) {
			this.deleteAll()
		} else {
			this.moveAll(mailBox.getTrashFolder())
				.then(() => {
					let deleteMailFolderData = createDeleteMailFolderData()
					deleteMailFolderData.folders.push(this.selectedFolder.folder._id)
					return serviceRequestVoid(TutanotaService.MailFolderService, HttpMethod.DELETE, deleteMailFolderData, null, ("dummy":any)) //TODO make DeleteMailFolderData unencrypted in next model version
				})
		}
	}

	logout() {
		m.route.set("/")
	}

	elementSelected(mails: Mail[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (mails.length == 1 && !multiSelectOperation && (selectionChanged || !this.mailViewer)) {
			// set or update the visible mail
			this.mailViewer = new MailViewer(mails[0], (this:any))
			let url = `/mail/${mails[0]._id.join("/")}`
			this.selectedFolder.url = url
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
			this.selectedFolder.url = url
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

	deleteSelected(): void {
		let mails = this.mailList.list.getSelectedEntities();
		if (mails.length > 0) {
			if (this.selectedFolder.isFinallyDeleteAllowed()) {
				let deleteMailData = createDeleteMailData()
				deleteMailData.mails.push(...mails.map(m => m._id))
				serviceRequestVoid(TutanotaService.MailService, HttpMethod.DELETE, deleteMailData)
			} else {
				this.moveMails(neverNull(this.selectedMailbox).getTrashFolder(), this.mailList.list.getSelectedEntities())
			}
		}
	}

	deleteAll() {
		let deleteMailData = createDeleteMailData()
		deleteMailData.folder = this.selectedFolder.folder._id
		return Dialog.progress("progressDeleting_msg", serviceRequestVoid(TutanotaService.MailService, HttpMethod.DELETE, deleteMailData))
	}

	moveMails(target: MailFolderViewModel, mails: Mail[]) {
		if (mails.length > 0) {
			if (this.selectedFolder == target || !isSameId(neverNull(target.folder._ownerGroup), neverNull(mails[0]._ownerGroup))) { // prevent moving mails between mail boxes.
				return Promise.resolve()
			}
			let moveMailData = createMoveMailData()
			moveMailData.targetFolder = target.folder._id
			moveMailData.mails.push(...mails.map(m => m._id))
			serviceRequestVoid(TutanotaService.MoveMailService, HttpMethod.POST, moveMailData)
		}
	}

	moveAll(target: MailFolderViewModel) {
		return loadAll(MailTypeRef, this.selectedFolder.folder.mails).then(mails => {
			if (mails.length === 0) {
				return Promise.resolve()
			}
			let moveMailData = createMoveMailData()
			moveMailData.targetFolder = target.folder._id
			moveMailData.mails.push(...mails.map(m => m._id))
			return serviceRequestVoid(TutanotaService.MoveMailService, HttpMethod.POST, moveMailData)
		})
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
						this.mailViewer = new MailViewer(updatedMail, (this:any))
					}).catch(() => {
						// ignore. might happen if a mail was just sent
					})
				}
			})
		} else if (isSameTypeRef(typeRef, MailFolderTypeRef)) {
			if (operation == OperationType.CREATE) {
				this.mailboxControllers.forEach(mc => mc.addFolder([(listId:any), elementId]).then((success) => {
					if (success) {
						mc.customFolderButtons = this.createFolderButtons(mc.getCustomFolders())
						m.redraw();
					}
				}))
			} else if (operation == OperationType.UPDATE) {
				this.mailboxControllers.forEach(mc => mc.updateFolder([(listId:any), elementId]).then((success) => {
					if (success) {
						mc.customFolderButtons = this.createFolderButtons(mc.getCustomFolders())
						m.redraw();
					}
				}))
			} else if (operation == OperationType.DELETE) {
				if (isSameId(this.selectedFolder.folder._id, [(listId:any), elementId])) {
					this._setUrl(neverNull(this.selectedMailbox).getInboxFolder().url)
				}
				this.mailboxControllers.forEach(mc => mc.deleteFolder([(listId:any), elementId]).then((success) => {
					if (success) {
						mc.customFolderButtons = this.createFolderButtons(mc.getCustomFolders())
						m.redraw();
					}
				}))
			}
		} else if (isSameTypeRef(typeRef, GroupInfoTypeRef)) {
			if (operation == OperationType.UPDATE) {
				this.mailboxControllers.forEach(mc => mc.updateNameFromGroupInfo([(listId:any), elementId]).then((success) => {
					if (success) {
						m.redraw();
					}
				}))
			}
		} else if (isSameTypeRef(typeRef, UserTypeRef)) {
			if (operation == OperationType.UPDATE && isSameId(logins.getUserController().user._id, elementId)) {
				load(UserTypeRef, elementId).then(updatedUser => {
					let newMemberships = updatedUser.memberships.filter(membership => membership.groupType == GroupType.Mail)
					//console.log("updating users new memberships: ", newMemberships)
					this.mailboxControllers = this.mailboxControllers.filter(mc => newMemberships.find(newValue => isSameId(mc.mailGroupMembership._id, newValue._id)))
					let addedMemberships = newMemberships.filter(newValue => !this.mailboxControllers.find(mc => isSameId(mc.mailGroupMembership._id, newValue._id)))
					Promise.each(addedMemberships, addedMembership => this._addMailBoxController(addedMembership)).then(() => m.redraw())
				})
			}
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
