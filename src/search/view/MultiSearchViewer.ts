import m, { Component } from "mithril"
import { assertMainOrNode, isApp } from "../../api/common/Env"
import { ActionBar } from "../../gui/base/ActionBar"
import { Icons } from "../../gui/base/icons/Icons"
import { lang } from "../../misc/LanguageViewModel"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import { SearchListView } from "./SearchListView"
import { NotFoundError } from "../../api/common/error/RestError"
import type { Contact, Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactTypeRef, MailTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { Dialog } from "../../gui/base/Dialog"
import { getFolderIcon, getIndentedFolderNameForDropdown, markMails } from "../../mail/model/MailUtils"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { mergeContacts } from "../../contacts/ContactMergeUtils"
import { logins } from "../../api/main/LoginController"
import { FeatureType } from "../../api/common/TutanotaConstants"
import { exportContacts } from "../../contacts/VCardExporter"
import { downcast, isNotNull, isSameTypeRef, lazyMemoized, noOp, ofClass } from "@tutao/tutanota-utils"
import { theme } from "../../gui/theme"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import { locator } from "../../api/main/MainLocator"
import { attachDropdown, DropdownButtonAttrs } from "../../gui/base/Dropdown.js"
import { moveMails } from "../../mail/view/MailGuiUtils"
import { exportMails } from "../../mail/export/Exporter"
import { MailboxDetail } from "../../mail/model/MailModel"
import { IconButtonAttrs } from "../../gui/base/IconButton.js"

assertMainOrNode()

export class MultiSearchViewer implements Component {
	view: Component["view"]
	private _searchListView: SearchListView
	private _isMailList!: boolean
	private _mobileMailActionBarButtons: () => IconButtonAttrs[]
	private _mobileContactActionBarButtons: () => IconButtonAttrs[]

	constructor(searchListView: SearchListView) {
		this._searchListView = searchListView
		const mailActionBarButtons = this.createMailActionBarButtons(true)
		const contactActionBarButtons = this.createContactActionBarButtons(true)
		this._mobileMailActionBarButtons = lazyMemoized(() => this.createMailActionBarButtons(false))
		this._mobileContactActionBarButtons = lazyMemoized(() => this.createContactActionBarButtons(false))

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
				m(
					".fill-absolute.mt-xs.plr-l",
					this._searchListView.list && this._searchListView.list.getSelectedEntities().length > 0
						? this._viewingMails()
							? [
									m(".flex-space-between.mr-negative-s", [
										m(".flex.items-center", this._getSearchSelectionMessage(this._searchListView)),
										m(ActionBar, {
											buttons: mailActionBarButtons,
										}),
									]),
							  ]
							: [
									m(".flex-space-between.mr-negative-s", [
										m(".flex.items-center", this._getSearchSelectionMessage(this._searchListView)),
										m(ActionBar, {
											buttons: contactActionBarButtons,
										}),
									]),
							  ]
						: m(ColumnEmptyMessageBox, {
								message: () => this._getSearchSelectionMessage(this._searchListView),
								color: theme.content_message_bg,
								icon: this._isMailList ? BootIcons.Mail : BootIcons.Contacts,
						  }),
				),
			]
		}
	}

	_getSearchSelectionMessage(searchListView: SearchListView): string {
		let nbrOfSelectedSearchEntities = searchListView.list ? searchListView.list.getSelectedEntities().length : 0

		if (this._isMailList) {
			if (nbrOfSelectedSearchEntities === 0) {
				return lang.get("noMail_msg")
			} else if (nbrOfSelectedSearchEntities === 1) {
				return lang.get("oneMailSelected_msg")
			} else {
				return lang.get("nbrOfMailsSelected_msg", {
					"{1}": nbrOfSelectedSearchEntities,
				})
			}
		} else {
			if (nbrOfSelectedSearchEntities === 0) {
				return lang.get("noContact_msg")
			} else if (nbrOfSelectedSearchEntities === 1) {
				return lang.get("oneContactSelected_msg")
			} else {
				return lang.get("nbrOfContactsSelected_msg", {
					"{1}": nbrOfSelectedSearchEntities,
				})
			}
		}
	}

	createContactActionBarButtons(prependCancel: boolean = false): IconButtonAttrs[] {
		const buttons: (IconButtonAttrs | null)[] = [
			prependCancel
				? {
						title: "cancel_action",
						click: () => this._searchListView.list && this._searchListView.list.selectNone(),
						icon: Icons.Cancel,
				  }
				: null,
			{
				title: "delete_action",
				click: () => this._searchListView.deleteSelected(),
				icon: Icons.Trash,
			},
			this._searchListView.getSelectedEntities().length === 2
				? {
						title: "merge_action",
						click: () => this.mergeSelected(),
						icon: Icons.People,
				  }
				: null,
			{
				title: "exportSelectedAsVCard_action",
				click: () => {
					let selected = this._searchListView.getSelectedEntities()

					let selectedContacts: Contact[] = []

					if (selected.length > 0) {
						if (isSameTypeRef(selected[0].entry._type, ContactTypeRef)) {
							selected.forEach((c) => {
								selectedContacts.push(downcast<Contact>(c.entry))
							})
						}
					}

					exportContacts(selectedContacts)
				},
				icon: Icons.Export,
			},
		]
		return buttons.filter(isNotNull)
	}

	createMailActionBarButtons(prependCancel: boolean = false): IconButtonAttrs[] {
		const buttons: (IconButtonAttrs | null)[] = [
			prependCancel
				? {
						title: "cancel_action",
						click: () => this._searchListView.list && this._searchListView.list.selectNone(),
						icon: Icons.Cancel,
				  }
				: null,
			attachDropdown({
				mainButtonAttrs: {
					title: "move_action",
					icon: Icons.Folder,
				},
				childAttrs: () => this.createMoveMailButtons(),
			}),
			{
				title: "delete_action",
				click: () => this._searchListView.deleteSelected(),
				icon: Icons.Trash,
			},
			attachDropdown({
				mainButtonAttrs: {
					title: "more_label",
					icon: Icons.More,
				},
				childAttrs: () => [
					{
						label: "markUnread_action",
						click: () => markMails(locator.entityClient, this.getSelectedMails(), true).then(() => this._searchListView.selectNone()),
						icon: Icons.NoEye,
					},
					{
						label: "markRead_action",
						click: () => markMails(locator.entityClient, this.getSelectedMails(), false).then(() => this._searchListView.selectNone()),
						icon: Icons.Eye,
					},
					!isApp() && !logins.isEnabled(FeatureType.DisableMailExport)
						? {
								label: "export_action",
								click: () =>
									showProgressDialog("pleaseWait_msg", exportMails(this.getSelectedMails(), locator.entityClient, locator.fileController)),
								icon: Icons.Export,
						  }
						: null,
				],
			}),
		]
		return buttons.filter(isNotNull)
	}

	async createMoveMailButtons(): Promise<DropdownButtonAttrs[]> {
		let selected = this._searchListView.getSelectedEntities()

		let selectedMails: Mail[] = []

		if (selected.length > 0 && isSameTypeRef(selected[0].entry._type, MailTypeRef)) {
			selected.forEach((m) => {
				selectedMails.push(downcast<Mail>(m.entry))
			})
		}

		let selectedMailbox: MailboxDetail | null = null

		for (const mail of selectedMails) {
			const mailbox = await locator.mailModel.getMailboxDetailsForMail(mail)

			// We can't move mails from different mailboxes
			if (selectedMailbox != null && selectedMailbox !== mailbox) {
				return []
			}

			selectedMailbox = mailbox
		}

		if (selectedMailbox === null) {
			return []
		} else {
			return selectedMailbox.folders.getIndentedList().map((f) => ({
				label: () => getIndentedFolderNameForDropdown(f),
				click: () => {
					//is needed for correct selection behavior on mobile
					this._searchListView.selectNone()

					// move all groups one by one because the mail list cannot be modified in parallel
					return moveMails({ mailModel: locator.mailModel, mails: selectedMails, targetMailFolder: f.folder })
				},
				icon: getFolderIcon(f.folder),
			}))
		}
	}

	mergeSelected(): Promise<void> {
		if (this._searchListView.getSelectedEntities().length === 2) {
			if (isSameTypeRef(this._searchListView.getSelectedEntities()[0].entry._type, ContactTypeRef)) {
				let keptContact = this._searchListView.getSelectedEntities()[0].entry as any as Contact
				let goodbyeContact = this._searchListView.getSelectedEntities()[1].entry as any as Contact

				if (!keptContact.presharedPassword || !goodbyeContact.presharedPassword || keptContact.presharedPassword === goodbyeContact.presharedPassword) {
					return Dialog.confirm("mergeAllSelectedContacts_msg").then((confirmed) => {
						if (confirmed) {
							mergeContacts(keptContact, goodbyeContact)
							return showProgressDialog(
								"pleaseWait_msg",
								locator.entityClient.update(keptContact).then(() => {
									return locator.entityClient
										.erase(goodbyeContact)
										.catch(ofClass(NotFoundError, noOp))
										.then(() => {
											//is needed for correct selection behavior on mobile
											this._searchListView.selectNone()
										})
								}),
							)
						}
					})
				} else {
					return Dialog.message("presharedPasswordsUnequal_msg")
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

		let selectedMails: Mail[] = []

		if (selected.length > 0) {
			if (isSameTypeRef(selected[0].entry._type, MailTypeRef)) {
				selected.forEach((m) => {
					selectedMails.push(m.entry as any as Mail)
				})
			}
		}

		return selectedMails
	}

	actionBarButtons(): IconButtonAttrs[] {
		return this._viewingMails() ? this._mobileMailActionBarButtons() : this._mobileContactActionBarButtons()
	}

	_viewingMails(): boolean {
		return this._searchListView._lastType.type === "Mail"
	}
}
