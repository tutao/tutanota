import { ContactListGroupRoot } from "../api/entities/tutanota/TypeRefs.js"
import { locator } from "../api/main/MainLocator.js"
import { DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar.js"
import { ButtonType } from "../gui/base/Button.js"
import { Dialog } from "../gui/base/Dialog.js"
import m, { Children, Component, Vnode } from "mithril"
import { TextField } from "../gui/base/TextField.js"
import { px, size } from "../gui/size.js"
import { IconButton } from "../gui/base/IconButton.js"
import { Icons } from "../gui/base/icons/Icons.js"
import { MailRecipientsTextField } from "../gui/MailRecipientsTextField.js"
import { RecipientsSearchModel } from "../misc/RecipientsSearchModel.js"
import { noOp } from "@tutao/tutanota-utils"
import { lang } from "../misc/LanguageViewModel.js"
import { isSameId } from "../api/common/utils/EntityUtils.js"
import { Keys } from "../api/common/TutanotaConstants.js"

export async function showContactListEditor(
	contactListGroupRoot: ContactListGroupRoot | null,
	headerText: string,
	save: (name: string, addresses: Array<string>) => void,
	showName?: boolean,
): Promise<void> {
	const recipientsSearch = await locator.recipientsSearchModel()
	if (contactListGroupRoot) {
		recipientsSearch.setFilter((item) => {
			// Exclude the list that we are editing to not show up in suggestions.
			// It is valid to include other lists to copy them into the current one.
			return !(item.type === "contactlist" && isSameId(item.value.groupRoot._id, contactListGroupRoot._id))
		})
	}

	const editorModel = new ContactListEditorModel()

	const dialogCloseAction = () => {
		dialog.close()
	}

	let headerBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: "cancel_action",
				click: dialogCloseAction,
				type: ButtonType.Secondary,
			},
		],
		right: [
			{
				label: "save_action",
				click: () => {
					save(editorModel.name, editorModel.addresses)
					dialog.close()
				},
				type: ButtonType.Primary,
			},
		],
		middle: () => headerText,
	}

	const dialog = Dialog.editDialog(headerBarAttrs, ContactListEditor, {
		model: editorModel,
		contactSearch: recipientsSearch,
		showName: showName,
	}).addShortcut({
		key: Keys.ESC,
		exec: () => dialog.close(),
		help: "close_alt",
	})
	dialog.show()
}

export async function showContactListNameEditor(name: string, save: (name: string) => void): Promise<void> {
	let nameInput = name
	let form = () => [
		m(TextField, {
			label: "name_label",
			value: nameInput,
			oninput: (newInput) => {
				nameInput = newInput
			},
		}),
	]
	const okAction = async (dialog: Dialog) => {
		dialog.close()
		save(nameInput)
	}

	Dialog.showActionDialog({
		title: lang.get("editContactList_action"),
		child: form,
		allowOkWithReturn: true,
		okAction: okAction,
	})
}

export class ContactListEditorModel {
	name: string
	addresses: Array<string>

	constructor() {
		this.name = ""
		this.addresses = []
	}

	addRecipient(address: string) {
		if (!this.addresses.includes(address)) {
			this.addresses = [address, ...this.addresses]
		}
	}

	removeRecipient(address: string) {
		this.addresses = this.addresses.filter((a) => address !== a)
	}
}

type ContactListEditorAttrs = {
	model: ContactListEditorModel
	contactSearch: RecipientsSearchModel
	showName?: boolean
}

class ContactListEditor implements Component<ContactListEditorAttrs> {
	private model: ContactListEditorModel
	private search: RecipientsSearchModel
	private newRecipient: string = ""
	private showName: boolean = true

	constructor(vnode: Vnode<ContactListEditorAttrs>) {
		this.model = vnode.attrs.model
		this.search = vnode.attrs.contactSearch
		this.showName = vnode.attrs.showName ?? true
	}

	view(): Children {
		return m("", [
			this.showName
				? m(TextField, {
						label: "name_label",
						class: "big-input pt flex-grow",
						value: this.model.name,
						oninput: (name) => (this.model.name = name),
				  })
				: null,
			m(MailRecipientsTextField, {
				label: "addEntries_action",
				text: this.newRecipient,
				onTextChanged: (v) => (this.newRecipient = v),
				// we don't show bubbles, we just want the search dropdown
				recipients: [],
				disabled: false,
				onRecipientAdded: (address) => {
					this.model.addRecipient(address)
					m.redraw()
				},
				// do nothing because we don't have any bubbles here
				onRecipientRemoved: noOp,
				search: this.search,
			}),
			this.model.addresses.map((address) => this.renderAddress(address)),
		])
	}

	renderAddress(address: string) {
		return m(
			".flex",
			{
				style: {
					height: px(size.button_height),
					borderBottom: "1px transparent",
					marginTop: px(size.vpad),
				},
			},
			[
				m(".flex.col.flex-grow.overflow-hidden.flex-no-grow-shrink-auto", [address]),
				m(".flex-grow"),
				m(IconButton, {
					title: "remove_action",
					icon: Icons.Cancel,
					click: () => this.model.removeRecipient(address),
				}),
			],
		)
	}
}
