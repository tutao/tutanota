import { Dialog, DialogType } from "../../common/gui/base/Dialog.js"
import { assert, assertNotNull, getFirstOrThrow, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { locator } from "../../common/api/main/MainLocator.js"
import { vCardFileToVCards, vCardListToContacts } from "./VCardImporter.js"
import { ImportError } from "../../common/api/common/error/ImportError.js"
import { lang, TranslationText } from "../../common/misc/LanguageViewModel.js"
import { showProgressDialog } from "../../common/gui/dialogs/ProgressDialog.js"
import { ContactFacade } from "../../common/api/worker/facades/lazy/ContactFacade.js"
import {
	Contact,
	createContact,
	createContactAddress,
	createContactCustomDate,
	createContactMailAddress,
	createContactMessengerHandle,
	createContactPhoneNumber,
	createContactRelationship,
	createContactWebsite,
} from "../../common/api/entities/tutanota/TypeRefs.js"
import m from "mithril"
import { List, ListAttrs, ListLoadingState, MultiselectMode, RenderConfig } from "../../common/gui/base/List.js"
import { size } from "../../common/gui/size.js"
import { UserError } from "../../common/api/main/UserError.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../../common/gui/base/DialogHeaderBar.js"
import { ButtonType } from "../../common/gui/base/Button.js"
import { isApp } from "../../common/api/common/Env.js"
import { ImportNativeContactBooksDialog } from "./view/ImportNativeContactBooksDialog.js"
import { StructuredContact } from "../../common/native/common/generatedipc/StructuredContact.js"
import { isoDateToBirthday } from "../../common/api/common/utils/BirthdayUtils.js"
import { ContactBook } from "../../common/native/common/generatedipc/ContactBook.js"
import { PermissionType } from "../../common/native/common/generatedipc/PermissionType.js"
import { SystemPermissionHandler } from "../../common/native/main/SystemPermissionHandler.js"
import { KindaContactRow } from "./view/ContactListView.js"
import { SelectAllCheckbox } from "../../common/gui/SelectAllCheckbox.js"

export class ContactImporter {
	constructor(private readonly contactFacade: ContactFacade, private readonly systemPermissionHandler: SystemPermissionHandler) {}

	async importContactsFromFile(vCardData: string | string[], contactListId: string) {
		const vCardList = Array.isArray(vCardData) ? ContactImporter.combineVCardData(vCardData) : vCardFileToVCards(vCardData)

		if (vCardList == null) throw new UserError("importVCardError_msg")

		const contactMembership = getFirstOrThrow(locator.logins.getUserController().getContactGroupMemberships())
		const contacts = vCardListToContacts(vCardList, contactMembership.group)

		return showContactImportDialog(
			contacts,
			(dialog, selectedContacts) => {
				dialog.close()
				this.importContacts(selectedContacts, contactListId)
			},
			"importVCard_action",
		)
	}

	private static combineVCardData(vCardData: string[]): string[] | null {
		const combinedVCardData = vCardData.flatMap((itemData) => vCardFileToVCards(itemData))
		return combinedVCardData.filter((vCard) => vCard != null) as string[]
	}

	async importContacts(contacts: ReadonlyArray<Contact>, contactListId: string) {
		const importPromise = this.contactFacade
			.importContactList(contacts, contactListId)
			.catch(
				ofClass(ImportError, (e) =>
					Dialog.message(() =>
						lang.get("importContactsError_msg", {
							"{amount}": e.numFailed + "",
							"{total}": contacts.length + "",
						}),
					),
				),
			)
			.catch(() => Dialog.message("unknownError_msg"))
		await showProgressDialog("pleaseWait_msg", importPromise)
		await Dialog.message(() =>
			lang.get("importVCardSuccess_msg", {
				"{1}": contacts.length,
			}),
		)
	}

	// will check for permission and ask for it if it is not granted
	async importContactsFromDeviceSafely() {
		// check for permission
		const isContactPermissionGranted = await this.systemPermissionHandler.requestPermission(PermissionType.Contacts, "grantContactPermissionAction")

		if (isContactPermissionGranted) {
			await this.importContactsFromDevice()
		}
	}

	private async importContactsFromDevice() {
		assert(isApp(), "isApp")
		const contactBooks = await showProgressDialog("pleaseWait_msg", locator.mobileContactsFacade.getContactBooks())
		let books: readonly ContactBook[]
		if (contactBooks.length === 0) {
			return
		} else if (contactBooks.length === 1) {
			books = contactBooks
		} else {
			const importDialog = new ImportNativeContactBooksDialog(contactBooks)
			const selectedBooks = await importDialog.show()
			if (selectedBooks == null || selectedBooks.length === 0) return
			books = selectedBooks
		}

		const contactListId = await locator.contactModel.getContactListId()
		const contactGroupId = await locator.contactModel.getContactGroupId()
		const contactsToImport: Contact[] = (
			await promiseMap(books, async (book) => {
				const structuredContacts = await locator.mobileContactsFacade.getContactsInContactBook(
					book.id,
					locator.logins.getUserController().loginUsername,
				)
				return structuredContacts.map((contact) => this.contactFromStructuredContact(contactGroupId, contact))
			})
		).flat()

		const importer = await locator.contactImporter()

		showContactImportDialog(
			contactsToImport,
			(dialog, selectedContacts) => {
				dialog.close()
				importer.importContacts(selectedContacts, assertNotNull(contactListId))
			},
			"importContacts_label",
		)
	}

	private contactFromStructuredContact(ownerGroupId: Id, contact: StructuredContact): Contact {
		const userId = locator.logins.getUserController().userId
		return createContact({
			_owner: userId,
			_ownerGroup: ownerGroupId,
			nickname: contact.nickname,
			firstName: contact.firstName,
			lastName: contact.lastName,
			company: contact.company,
			addresses: contact.addresses.map((address) =>
				createContactAddress({
					type: address.type,
					address: address.address,
					customTypeName: address.customTypeName,
				}),
			),
			mailAddresses: contact.mailAddresses.map((address) =>
				createContactMailAddress({
					type: address.type,
					address: address.address,
					customTypeName: address.customTypeName,
				}),
			),
			phoneNumbers: contact.phoneNumbers.map((number) =>
				createContactPhoneNumber({
					type: number.type,
					number: number.number,
					customTypeName: number.customTypeName,
				}),
			),
			oldBirthdayAggregate: null,
			oldBirthdayDate: null,
			photo: null,
			presharedPassword: null,
			socialIds: [],
			birthdayIso: this.validateBirthdayOfContact(contact),
			autoTransmitPassword: "",
			pronouns: [],
			customDate: contact.customDate.map((date) => createContactCustomDate(date)),
			department: contact.department,
			messengerHandles: contact.messengerHandles.map((handle) => createContactMessengerHandle(handle)),
			middleName: contact.middleName,
			nameSuffix: contact.nameSuffix,
			phoneticFirst: contact.phoneticFirst,
			phoneticLast: contact.phoneticLast,
			phoneticMiddle: contact.phoneticMiddle,
			relationships: contact.relationships.map((relation) => createContactRelationship(relation)),
			websites: contact.websites.map((website) => createContactWebsite(website)),
			comment: contact.notes,
			title: contact.title ?? "",
			role: contact.role,
		})
	}

	private validateBirthdayOfContact(contact: StructuredContact) {
		if (contact.birthday != null) {
			try {
				isoDateToBirthday(contact.birthday)
				return contact.birthday
			} catch (_) {
				return null
			}
		} else {
			return null
		}
	}
}

/**
 * Show a dialog with a preview of a given list of contacts
 * @param contacts The contact list to be previewed
 * @param okAction The action to be executed when the user press the import button
 */
export function showContactImportDialog(contacts: Contact[], okAction: (dialog: Dialog, selectedContacts: Contact[]) => unknown, title: TranslationText) {
	const viewModel: ContactImportDialogViewModel = new ContactImportDialogViewModel()
	viewModel.selectContacts(contacts)
	const renderConfig: RenderConfig<Contact, KindaContactRow> = {
		itemHeight: size.list_row_height,
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

	const dialog = new Dialog(DialogType.EditSmall, {
		view: () => [
			/** fixed-height header with a title, left and right buttons that's fixed to the top of the dialog's area */
			m(DialogHeaderBar, {
				left: [
					{
						type: ButtonType.Secondary,
						label: "cancel_action",
						click: () => {
							dialog.close()
						},
					},
				],
				middle: () => lang.getMaybeLazy(title),
				right: [
					{
						type: ButtonType.Primary,
						label: "import_action",
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
			m(".dialog-max-height.plr-s.pb.text-break.nav-bg", [
				m(
					".list-bg.border-radius.mt-s.ml-s.mr-s",
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
					".flex.col.rel.mt-s",
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

// Controls the selected contacts in `showContactImportDialog()`
class ContactImportDialogViewModel {
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
