// @flow
import m from "mithril"
import {assertMainOrNode, Mode} from "../../api/common/Env"
import {ActionBar} from "../../gui/base/ActionBar"
import {Icons} from "../../gui/base/icons/Icons"
import {lang} from "../../misc/LanguageViewModel"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import {SearchListView} from "./SearchListView"
import {erase, update} from "../../api/main/Entity"
import {NotFoundError} from "../../api/common/error/RestError"
import type {Contact} from "../../api/entities/tutanota/Contact"
import {ContactTypeRef} from "../../api/entities/tutanota/Contact"
import {Dialog} from "../../gui/base/Dialog"
import type {Mail} from "../../api/entities/tutanota/Mail"
import {MailTypeRef} from "../../api/entities/tutanota/Mail"
import {getFolderIcon, getFolderName, getSortedCustomFolders, getSortedSystemFolders, markMails} from "../../mail/model/MailUtils"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import {mergeContacts} from "../../contacts/ContactMergeUtils"
import {logins} from "../../api/main/LoginController"
import {FeatureType} from "../../api/common/TutanotaConstants"
import {exportContacts} from "../../contacts/VCardExporter"
import {isSameTypeRef, lazyMemoized, noOp} from "@tutao/tutanota-utils"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonType} from "../../gui/base/ButtonN"
import {theme} from "../../gui/theme"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {locator} from "../../api/main/MainLocator"
import {NBSP} from "@tutao/tutanota-utils"
import {attachDropdown} from "../../gui/base/DropdownN"
import {moveMails} from "../../mail/view/MailGuiUtils"
import {exportMails} from "../../mail/export/Exporter"
import {ofClass} from "@tutao/tutanota-utils"

assertMainOrNode()

export class MultiSearchViewer {
	view: Function;
	_searchListView: SearchListView;
	_isMailList: boolean;
	_mobileMailActionBarButtons: () => ButtonAttrs[]
	_mobileContactActionBarButtons: () => ButtonAttrs[]

	constructor(searchListView: SearchListView) {
		const mailActionBarButtons = this.createMailActionBarButtons(true)
		const contactActionBarButtons = this.createContactActionBarButtons(true)

		this._mobileMailActionBarButtons = lazyMemoized(() => this.createMailActionBarButtons(false))
		this._mobileContactActionBarButtons = lazyMemoized(() => this.createContactActionBarButtons(false))

		this._searchListView = searchListView


		this.view = () => {
			if (this._searchListView._lastType) {
				if (this._searchListView._lastType === MailTypeRef) {
					this._isMailList = true
				} else {
					this._isMailList = false
				}
			} else {
				console.log("ERROR LIST TYPE NOT FOUND")
			}

			return [
				m(".fill-absolute.mt-xs.plr-l",
					(this._searchListView.list && this._searchListView.list._selectedEntities.length > 0)
						? (
							(this._viewingMails()) ? [
								// Add spacing so the buttons are where the mail view are
								m(".flex-space-between.button-min-height",
									m(".flex.flex-column-reverse", [
										m(".small.flex.text-break.selectable.badge-line-height.flex-wrap pt-s", NBSP),
										m("small.b.flex.pt", NBSP)
									])
								),
								m(".flex-space-between.mr-negative-s", [
									m(".flex.items-center", this._getSearchSelectionMessage(this._searchListView)),
									m(ActionBar, {buttons: mailActionBarButtons})
								])
							] : [
								// Add spacing so buttons for contacts also align with the regular client view's buttons
								m(".header.pt-ml.flex-space-between",
									m(".left.flex-grow", [
										m(".contact-actions.flex-wrap.flex-grow-shrink", [
											m(".h2", NBSP),
											m(".flex-space-between", m(".flex-wrap.items-center", this._getSearchSelectionMessage(this._searchListView)))
										]),
									]),
									m(".action-bar.align-self-end", m(ActionBar, {buttons: contactActionBarButtons}))
								)
							]
						)
						: m(ColumnEmptyMessageBox, {
							message: () => this._getSearchSelectionMessage(this._searchListView),
							color: theme.content_message_bg,
							icon: this._isMailList ? BootIcons.Mail : BootIcons.Contacts,
						})
				)
			]
		}
	}

	_getSearchSelectionMessage(searchListView: SearchListView): string {
		let nbrOfSelectedSearchEntities = (searchListView.list) ? searchListView.list._selectedEntities.length : 0
		if (this._isMailList) {
			if (nbrOfSelectedSearchEntities === 0) {
				return lang.get("noMail_msg")
			} else if (nbrOfSelectedSearchEntities === 1) {
				return lang.get("oneMailSelected_msg")
			} else {
				return lang.get("nbrOfMailsSelected_msg", {"{1}": nbrOfSelectedSearchEntities})
			}
		} else {
			if (nbrOfSelectedSearchEntities === 0) {
				return lang.get("noContact_msg")
			} else if (nbrOfSelectedSearchEntities === 1) {
				return lang.get("oneContactSelected_msg")
			} else {
				return lang.get("nbrOfContactsSelected_msg", {"{1}": nbrOfSelectedSearchEntities})
			}
		}
	}


	createContactActionBarButtons(prependCancel: boolean = false): ButtonAttrs[] {
		return [
			{
				label: "cancel_action",
				click: () => this._searchListView.list && this._searchListView.list.selectNone(),
				icon: () => Icons.Cancel,
				isVisible: () => prependCancel
			},
			{
				label: 'delete_action',
				click: () => this._searchListView.deleteSelected(),
				icon: () => Icons.Trash
			},
			{
				label: "merge_action",
				click: () => this.mergeSelected(),
				icon: () => Icons.People,
				isVisible: () => this._searchListView.getSelectedEntities().length === 2
			},
			{
				label: "exportSelectedAsVCard_action",
				click: () => {
					let selected = this._searchListView.getSelectedEntities()
					let selectedContacts = []
					if (selected.length > 0) {
						if (isSameTypeRef(selected[0].entry._type, ContactTypeRef)) {
							selected.forEach(c => {
								selectedContacts.push(((c.entry: any): Contact))
							})
						}
					}
					exportContacts(selectedContacts)
				},
				icon: () => Icons.Export
			}
		]
	}

	createMailActionBarButtons(prependCancel: boolean = false): ButtonAttrs[] {
		return [
			{
				label: "cancel_action",
				click: () => this._searchListView.list && this._searchListView.list.selectNone(),
				icon: () => Icons.Cancel,
				isVisible: () => prependCancel
			},
			attachDropdown({
					label: 'move_action',
					icon: () => Icons.Folder
				},
				() => this.createMoveMailButtons()),
			{

				label: 'delete_action',
				click: () => this._searchListView.deleteSelected(),
				icon: () => Icons.Trash
			},
			attachDropdown({
				label: "more_label",
				icon: () => Icons.More
			}, () => [
				{
					label: "markUnread_action",
					click: () => markMails(locator.entityClient, this.getSelectedMails(), true).then(this._searchListView.selectNone()),
					icon: () => Icons.NoEye,
					type: ButtonType.Dropdown
				},
				{
					label: "markRead_action",
					click: () => markMails(locator.entityClient, this.getSelectedMails(), false).then(this._searchListView.selectNone()),
					icon: () => Icons.Eye,
					type: ButtonType.Dropdown
				},
				{
					label: "export_action",
					click: () =>
						showProgressDialog(
							"pleaseWait_msg",
							exportMails(this.getSelectedMails(), locator.entityClient, locator.fileFacade)
						),
					icon: () => Icons.Export,
					type: ButtonType.Dropdown,
					isVisible: () => env.mode !== Mode.App && !logins.isEnabled(FeatureType.DisableMailExport)
				}
			])
		]
	}

	async createMoveMailButtons(): Promise<ButtonAttrs[]> {
		let selected = this._searchListView.getSelectedEntities()
		let selectedMails = []
		if (selected.length > 0 && isSameTypeRef(selected[0].entry._type, MailTypeRef)) {
			selected.forEach(m => {
				selectedMails.push(((m.entry: any): Mail))
			})
		}

		let selectedMailbox
		for (const mail of selectedMails) {
			const mailbox = await locator.mailModel.getMailboxDetailsForMail(mail)
			// We can't move mails from different mailboxes
			if (selectedMailbox != null && selectedMailbox !== mailbox) {
				return []
			}
			selectedMailbox = mailbox
		}
		if (selectedMailbox == null) return []

		return (getSortedSystemFolders(selectedMailbox.folders)
			.concat(getSortedCustomFolders(selectedMailbox.folders)))
			.map(f => ({
				label: () => getFolderName(f),
				click: () => {
					//is needed for correct selection behavior on mobile
					this._searchListView.selectNone()
					// move all groups one by one because the mail list cannot be modified in parallel
					return moveMails(locator.mailModel, selectedMails, f)

				},
				icon: getFolderIcon(f),
				type: ButtonType.Dropdown
			}))
	}

	mergeSelected(): Promise<void> {
		if (this._searchListView.getSelectedEntities().length === 2) {
			if (isSameTypeRef(this._searchListView.getSelectedEntities()[0].entry._type, ContactTypeRef)) {
				let keptContact = ((this._searchListView.getSelectedEntities()[0].entry: any): Contact)
				let goodbyeContact = ((this._searchListView.getSelectedEntities()[1].entry: any): Contact)

				if (!keptContact.presharedPassword || !goodbyeContact.presharedPassword
					|| (keptContact.presharedPassword === goodbyeContact.presharedPassword)) {
					return Dialog.confirm("mergeAllSelectedContacts_msg").then(confirmed => {
						if (confirmed) {
							mergeContacts(keptContact, goodbyeContact)
							return showProgressDialog("pleaseWait_msg", update(keptContact).then(() => {
								return erase(goodbyeContact)
									.catch(ofClass(NotFoundError, noOp))
									.then(() => {
										//is needed for correct selection behavior on mobile
										this._searchListView.selectNone()
									})
							}))
						}
					})
				} else {
					return Dialog.error("presharedPasswordsUnequal_msg")
				}
			} else {
				return Promise.resolve()
			}
		} else {
			return Promise.resolve()
		}

	}

	getSelectedMails(): Mail[] {
		let selected = this._searchListView.getSelectedEntities()
		let selectedMails = []
		if (selected.length > 0) {
			if (isSameTypeRef(selected[0].entry._type, MailTypeRef)) {
				selected.forEach(m => {
					selectedMails.push(((m.entry: any): Mail))
				})
			}
		}
		return selectedMails
	}

	actionBarButtons(): ButtonAttrs[] {
		return this._viewingMails() ? this._mobileMailActionBarButtons() : this._mobileContactActionBarButtons()
	}

	_viewingMails(): boolean {
		return this._searchListView._lastType.type === "Mail"
	}
}
