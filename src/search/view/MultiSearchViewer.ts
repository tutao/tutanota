import m, { Component } from "mithril"
import { assertMainOrNode } from "../../api/common/Env"
import { ActionBar } from "../../gui/base/ActionBar"
import { Icons } from "../../gui/base/icons/Icons"
import { lang } from "../../misc/LanguageViewModel"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import { SearchListView, SearchResultListEntry } from "./SearchListView"
import { NotFoundError } from "../../api/common/error/RestError"
import type { Contact, Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactTypeRef, MailTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { Dialog } from "../../gui/base/Dialog"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { mergeContacts } from "../../contacts/ContactMergeUtils"
import { exportContacts } from "../../contacts/VCardExporter"
import { isNotNull, isSameTypeRef, lazyMemoized, noOp, ofClass } from "@tutao/tutanota-utils"
import { theme } from "../../gui/theme"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import { locator } from "../../api/main/MainLocator"
import { IconButtonAttrs } from "../../gui/base/IconButton.js"
import { assertIsEntity2 } from "../../api/common/utils/EntityUtils.js"
import { getMultiMailViewerActionButtonAttrs } from "../../mail/view/MultiMailViewer.js"

assertMainOrNode()

export class MultiSearchViewer implements Component {
	view: Component["view"]
	private readonly searchListView: SearchListView
	private isMailList!: boolean
	private readonly mobileContactActionBarButtons: () => IconButtonAttrs[]

	constructor(searchListView: SearchListView) {
		console.log("constructed")
		this.searchListView = searchListView
		const contactActionBarButtons = this.createContactActionBarButtons(true)
		this.mobileContactActionBarButtons = lazyMemoized(() => this.createContactActionBarButtons(false))

		this.view = () => {
			if (this.searchListView._lastType) {
				this.isMailList = this.searchListView._lastType === MailTypeRef
			} else {
				console.log("ERROR LIST TYPE NOT FOUND")
			}

			const selectedEntities = (this.searchListView.list && this.searchListView.list.getSelectedEntities()) ?? []
			const selectNone = this.searchListView.list?.selectNone ?? noOp
			return [
				m(
					".fill-absolute.mt-xs.plr-l",
					selectedEntities.length > 0
						? this.viewingMails()
							? [
									m(".flex-space-between.mr-negative-s", [
										m(".flex.items-center", this.getSearchSelectionMessage(selectedEntities)),
										m(ActionBar, {
											buttons: getMultiMailViewerActionButtonAttrs(
												selectedEntities.map(({ entry }) => entry).filter(assertIsEntity2(MailTypeRef)),
												selectNone,
												true,
											),
										}),
									]),
							  ]
							: [
									m(".flex-space-between.mr-negative-s", [
										m(".flex.items-center", this.getSearchSelectionMessage(selectedEntities)),
										m(ActionBar, {
											buttons: contactActionBarButtons,
										}),
									]),
							  ]
						: m(ColumnEmptyMessageBox, {
								message: () => this.getSearchSelectionMessage(selectedEntities),
								color: theme.content_message_bg,
								icon: this.isMailList ? BootIcons.Mail : BootIcons.Contacts,
						  }),
				),
			]
		}
	}

	private getSearchSelectionMessage(selectedEntities: Array<SearchResultListEntry>): string {
		let nbrOfSelectedSearchEntities = selectedEntities.length

		if (this.isMailList) {
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

	private createContactActionBarButtons(prependCancel: boolean = false): IconButtonAttrs[] {
		const buttons: (IconButtonAttrs | null)[] = [
			prependCancel
				? {
						title: "cancel_action",
						click: () => this.searchListView.list && this.searchListView.list.selectNone(),
						icon: Icons.Cancel,
				  }
				: null,
			{
				title: "delete_action",
				click: () => this.searchListView.deleteSelected(),
				icon: Icons.Trash,
			},
			this.searchListView.getSelectedEntities().length === 2
				? {
						title: "merge_action",
						click: () => this.mergeSelected(),
						icon: Icons.People,
				  }
				: null,
			{
				title: "exportSelectedAsVCard_action",
				click: () => {
					let selected = this.searchListView.getSelectedEntities()

					let selectedContacts = selected.map((e) => e.entry).filter(assertIsEntity2(ContactTypeRef))

					exportContacts(selectedContacts)
				},
				icon: Icons.Export,
			},
		]
		return buttons.filter(isNotNull)
	}

	private mergeSelected(): Promise<void> {
		if (this.searchListView.getSelectedEntities().length === 2) {
			if (isSameTypeRef(this.searchListView.getSelectedEntities()[0].entry._type, ContactTypeRef)) {
				let keptContact = this.searchListView.getSelectedEntities()[0].entry as any as Contact
				let goodbyeContact = this.searchListView.getSelectedEntities()[1].entry as any as Contact

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
											this.searchListView.selectNone()
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

	actionBarButtons(): IconButtonAttrs[] {
		return this.viewingMails() ? this.mobileMailActionBarButtons() : this.mobileContactActionBarButtons()
	}

	mobileMailActionBarButtons(): Array<IconButtonAttrs> {
		const selectedEntities = this.searchListView.list?.getSelectedEntities() ?? []
		const selectNone = this.searchListView.list?.selectNone || (() => {})
		return getMultiMailViewerActionButtonAttrs(selectedEntities.map(({ entry }) => entry).filter(assertIsEntity2(MailTypeRef)), selectNone, false)
	}

	private viewingMails(): boolean {
		return this.searchListView._lastType.type === "Mail"
	}
}
