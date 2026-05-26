import { locator } from "../../common/api/main/CommonLocator.js"
import { DialogHeaderBarAttrs } from "../../../ui/base/DialogHeaderBar.js"
import { ButtonType } from "../../../ui/base/Button.js"
import { Dialog } from "../../../ui/base/Dialog.js"
import m, { Children, Component, Vnode } from "mithril"
import { LegacyTextField } from "../../../ui/base/LegacyTextField.js"
import { component_size, px, size } from "../../../ui/size.js"
import { IconButton } from "../../../ui/base/IconButton.js"
import { Icons } from "../../../ui/base/icons/Icons.js"
import { MailRecipientsTextField } from "../../common/gui/MailRecipientsTextField.js"
import { RecipientsSearchModel } from "../../common/misc/RecipientsSearchModel.js"
import { cleanMailAddress, lazy, noOp } from "../../../platform-kits/utils"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel.js"
import { Keys } from "../../../platform-kits/app-env"
import { isMailAddress } from "../../../platform-kits/utils/FormatUtils.js"
import { GroupNameData } from "../../common/sharing/model/GroupSettingsModel"
import { ContactListEditorModel } from "./ContactListEditorModel"
import { ContactListGroupRoot } from "@tutao/entities/tutanota"
import { clone, isSameId } from "../../../platform-kits/meta"

export async function showContactListEditor(
	contactListGroupRoot: ContactListGroupRoot | null,
	headerText: TranslationKey,
	save: (name: string, addresses: Array<string>) => void,
	addressesOnList?: Array<string>,
): Promise<void> {
	let showNameInput = true
	const recipientsSearch = await locator.recipientsSearchModel()

	if (contactListGroupRoot) {
		showNameInput = false
		recipientsSearch.setFilter((item) => {
			// Exclude the list that we are editing to not show up in suggestions.
			// It is valid to include other lists to copy them into the current one.
			return !(item.type === "contactlist" && isSameId(item.value.groupRoot._id, contactListGroupRoot._id))
		})
	}

	const editorModel = new ContactListEditorModel(addressesOnList ?? [])

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
					save(editorModel.name, editorModel.newAddresses)
					dialog.close()
				},
				type: ButtonType.Primary,
			},
		],
		middle: headerText,
	}

	const dialog = Dialog.editDialog(headerBarAttrs, ContactListEditor, {
		model: editorModel,
		contactSearch: recipientsSearch,
		showNameInput,
	}).addShortcut({
		key: Keys.ESC,
		exec: () => dialog.close(),
		help: "close_alt",
	})
	dialog.show()
}

export async function showContactListNameEditor(contactListNameData: Readonly<GroupNameData>, save: (data: GroupNameData) => void): Promise<void> {
	const { GroupSettingNameInputFields } = await import("../../common/sharing/view/GroupSettingNameInputFields")

	const newData = clone<GroupNameData>(contactListNameData)
	const form: () => Children = () => m(GroupSettingNameInputFields, { groupNameData: newData })

	const okAction = async (dialog: Dialog) => {
		dialog.close()
		save(newData)
	}

	Dialog.showActionDialog({
		title: "editContactList_action",
		child: form,
		allowOkWithReturn: true,
		okAction: okAction,
	})
}

type ContactListEditorAttrs = {
	model: ContactListEditorModel
	contactSearch: RecipientsSearchModel
	showNameInput?: boolean
}

class ContactListEditor implements Component<ContactListEditorAttrs> {
	private model: ContactListEditorModel
	private search: RecipientsSearchModel
	private newAddress: string = ""
	private showNameInput: boolean = true

	constructor(vnode: Vnode<ContactListEditorAttrs>) {
		this.model = vnode.attrs.model
		this.search = vnode.attrs.contactSearch
		this.showNameInput = vnode.attrs.showNameInput ?? true
	}

	view(): Children {
		let helpLabel: lazy<string> | null = null

		if (this.newAddress.trim().length > 0 && !isMailAddress(this.newAddress.trim(), false)) {
			helpLabel = () => lang.get("invalidInputFormat_msg")
		} else if (
			this.model.currentAddresses.includes(cleanMailAddress(this.newAddress)) ||
			this.model.newAddresses.includes(cleanMailAddress(this.newAddress))
		) {
			helpLabel = () => lang.get("addressAlreadyExistsOnList_msg")
		}

		return m("", [
			this.showNameInput
				? m(LegacyTextField, {
						label: "name_label",
						class: "big-input pt-16 flex-grow",
						value: this.model.name,
						oninput: (name) => (this.model.name = name),
					})
				: null,
			m(MailRecipientsTextField, {
				label: "addEntries_action",
				text: this.newAddress,
				onTextChanged: (v) => (this.newAddress = v),
				// we don't show bubbles, we just want the search dropdown
				recipients: [],
				disabled: false,
				onRecipientAdded: (address) => {
					if (!this.model.newAddresses.includes(address) && !this.model.currentAddresses.includes(address)) {
						this.model.addRecipient(address)
					}
					m.redraw()
				},
				// do nothing because we don't have any bubbles here
				onRecipientRemoved: noOp,
				search: this.search,
				helpLabel,
			}),
			this.model.newAddresses.map((address) => this.renderAddress(address)),
		])
	}

	renderAddress(address: string) {
		return m(
			".flex",
			{
				style: {
					height: px(component_size.button_height),
					borderBottom: "1px transparent",
					marginTop: px(size.spacing_16),
				},
			},
			[
				m(".flex.col.flex-grow.overflow-hidden.flex-no-grow-shrink-auto", [address]),
				m(".flex-grow"),
				m(IconButton, {
					title: "remove_action",
					icon: Icons.X,
					click: () => this.model.removeRecipient(address),
				}),
			],
		)
	}
}
