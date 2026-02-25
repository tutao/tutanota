import { Dialog, DialogType } from "../../common/gui/base/Dialog.js"
import { MaybeTranslation } from "../../common/misc/LanguageViewModel.js"
import { Contact } from "../../common/api/entities/tutanota/TypeRefs.js"
import m from "mithril"
import { List, ListAttrs, ListLoadingState, MultiselectMode, RenderConfig } from "../../common/gui/base/List.js"
import { component_size } from "../../common/gui/size.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../../common/gui/base/DialogHeaderBar.js"
import { ButtonType } from "../../common/gui/base/Button.js"
import { KindaContactRow } from "./view/ContactListView.js"
import { SelectAllCheckbox } from "../../common/gui/SelectAllCheckbox.js"

/**
 * Show a dialog with a preview of a given list of contacts
 * @param contacts The contact list to be previewed
 * @param okAction The action to be executed when the user press the confirm button with at least one contact selected
 */
export function showContactSelectionDialog(contacts: Contact[], okAction: (dialog: Dialog, selectedContacts: Contact[]) => unknown, title: MaybeTranslation) {
	const viewModel: ContactSelectionDialogViewModel = new ContactSelectionDialogViewModel()
	viewModel.selectContacts(contacts)
	const renderConfig: RenderConfig<Contact, KindaContactRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			return new KindaContactRow(
				dom,
				(selectedContact: Contact) => viewModel.selectSingleContact(selectedContact),
				() => true,
			)
		},
	}

	const dialog = new Dialog(DialogType.EditMedium, {
		view: () => [
			/** fixed-height header with a title, left and right buttons that's fixed to the top of the dialog's area */
			m(DialogHeaderBar, {
				left: [
					{
						type: ButtonType.Secondary,
						label: "close_alt",
						click: () => {
							dialog.close()
						},
					},
				],
				middle: title,
				right: [
					{
						type: ButtonType.Primary,
						label: "delete_action",
						click: () => {
							const selectedContacts = [...viewModel.getSelectedContacts()]
							if (selectedContacts.length <= 0) {
								Dialog.message("noContact_msg")
							} else {
								okAction(dialog, selectedContacts)
							}
						},
					},
				],
			} satisfies DialogHeaderBarAttrs),
			/** variable-size child container that may be scrollable. */
			m(".dialog-max-height.plr-4.pb-16.text-break.nav-bg", [
				m(
					"#dialog-message.dialog-max-height.text-break.text-prewrap.selectable.scroll.pt-16",
					m(
						".dialog-contentButtonsBottom.text-break.selectable",
						"You have moved an e-mail from a contact to the spam folder.\nMails sent by contacts are never classified as spam.\nWould you like to delete the contact?",
					),
				),
				m(
					".list-bg.border-radius.mt-8.ml-8.mr-8",
					m(SelectAllCheckbox, {
						style: {
							"padding-left": "0",
						},
						selected: viewModel.isAllContactsSelected(contacts),
						selectNone: () => viewModel.clearSelection(),
						selectAll: () => viewModel.selectContacts(contacts),
					}),
				),
				m(
					".flex.col.rel.mt-8",
					{
						style: {
							height: "80vh",
						},
					},
					m(List, {
						renderConfig,
						state: {
							items: contacts,
							loadingStatus: ListLoadingState.Done,
							loadingAll: false,
							selectedItems: viewModel.getSelectedContacts(),
							inMultiselect: true,
							activeIndex: null,
						},
						onLoadMore() {},
						onRangeSelectionTowards(item: Contact) {},
						onRetryLoading() {},
						onSingleSelection(item: Contact) {
							viewModel.selectSingleContact(item)
						},
						onSingleTogglingMultiselection(item: Contact) {},
						onStopLoading() {},
					} satisfies ListAttrs<Contact, KindaContactRow>),
				),
			]),
		],
	}).show()
}

// Controls the selected contacts
class ContactSelectionDialogViewModel {
	private readonly selectedContacts: Set<Contact> = new Set()

	getSelectedContacts(): Set<Contact> {
		return new Set(this.selectedContacts)
	}

	// Compares the selected contacts against a list of contacts and returns whether they contain the same contacts
	isAllContactsSelected(contacts: Contact[]): boolean {
		const unselectedContacts = contacts.filter((contact) => !this.selectedContacts.has(contact))
		return unselectedContacts.length <= 0
	}

	// Deselects all the selected contacts
	clearSelection(): void {
		this.selectedContacts.clear()
	}

	// Toggles the presence of a contact within the selected contacts
	selectSingleContact(selectedContact: Contact): void {
		if (this.selectedContacts.has(selectedContact)) {
			this.selectedContacts.delete(selectedContact)
		} else {
			this.selectedContacts.add(selectedContact)
		}
	}

	// Replaces the selected contacts with the provided contacts
	selectContacts(contacts: Contact[]): void {
		this.selectedContacts.clear()
		for (const contact of contacts) {
			this.selectedContacts.add(contact)
		}
	}
}
