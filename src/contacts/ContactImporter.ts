import { Dialog, DialogType } from "../gui/base/Dialog.js"
import { assert, assertNotNull, getFirstOrThrow, NBSP, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { locator } from "../api/main/MainLocator.js"
import { vCardFileToVCards, vCardListToContacts } from "./VCardImporter.js"
import { ImportError } from "../api/common/error/ImportError.js"
import { lang, TranslationText } from "../misc/LanguageViewModel.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { ContactFacade } from "../api/worker/facades/lazy/ContactFacade.js"
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
} from "../api/entities/tutanota/TypeRefs.js"
import m, { Children } from "mithril"
import { List, ListAttrs, ListLoadingState, MultiselectMode, RenderConfig, ViewHolder } from "../gui/base/List.js"
import { px, size } from "../gui/size.js"
import { getContactListName } from "./model/ContactUtils.js"
import { UserError } from "../api/main/UserError.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar.js"
import { ButtonType } from "../gui/base/Button.js"
import { isApp } from "../api/common/Env.js"
import { ImportNativeContactBooksDialog } from "./view/ImportNativeContactBooksDialog.js"
import { StructuredContact } from "../native/common/generatedipc/StructuredContact.js"
import { isoDateToBirthday } from "../api/common/utils/BirthdayUtils.js"
import { ContactBook } from "../native/common/generatedipc/ContactBook.js"
import { PermissionType } from "../native/common/generatedipc/PermissionType.js"
import { SystemPermissionHandler } from "../native/main/SystemPermissionHandler.js"

export class ContactImporter {
	constructor(private readonly contactFacade: ContactFacade, private readonly systemPermissionHandler: SystemPermissionHandler) {}

	async importContactsFromFile(vCardData: string | string[], contactListId: string) {
		const vCardList = Array.isArray(vCardData) ? ContactImporter.combineVCardData(vCardData) : vCardFileToVCards(vCardData)

		if (vCardList == null) throw new UserError("importVCardError_msg")

		const contactMembership = getFirstOrThrow(locator.logins.getUserController().getContactGroupMemberships())
		const contacts = vCardListToContacts(vCardList, contactMembership.group)

		return showContactImportDialog(
			contacts,
			(dialog) => {
				dialog.close()
				this.importContacts(contacts, contactListId)
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
			(dialog) => {
				dialog.close()
				importer.importContacts(contactsToImport, assertNotNull(contactListId))
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
export function showContactImportDialog(contacts: Contact[], okAction: (dialog: Dialog) => unknown, title: TranslationText) {
	const renderConfig: RenderConfig<Contact, ImportContactRowHolder> = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom) => {
			const row: ImportContactRowHolder = new ImportContactRowHolder(dom)

			m.render(dom, row.render())

			return row
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
							okAction(dialog)
						},
					},
				],
			} satisfies DialogHeaderBarAttrs),
			/** variable-size child container that may be scrollable. */
			m(
				".dialog-max-height.plr-l.pb.text-break.nav-bg",
				m(
					".plr-l",
					m(
						".mt-s",
						m(
							".flex.col.rel",
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
									selectedItems: new Set(),
									inMultiselect: false,
									activeIndex: null,
								},
								onLoadMore() {},
								onRangeSelectionTowards(item: Contact) {},
								onRetryLoading() {},
								onSingleSelection(item: any) {},
								onSingleTogglingMultiselection(item: Contact) {},
								onStopLoading() {},
							} satisfies ListAttrs<Contact, ImportContactRowHolder>),
						),
					),
				),
			),
		],
	}).show()
}

class ImportContactRowHolder implements ViewHolder<Contact> {
	private domName!: HTMLElement
	private domAddress!: HTMLElement

	entity: Contact | null = null

	constructor(dom: HTMLElement) {
		m.render(dom, this.render())
	}

	update(item: Contact) {
		this.entity = item

		this.domName.textContent = getContactListName(item)
		this.domAddress.textContent = item.mailAddresses && item.mailAddresses.length > 0 ? item.mailAddresses[0].address : NBSP
	}

	render(): Children {
		return m(
			".flex.height-100p.pt-xs.items-center",
			{
				style: {
					"max-height": px(size.list_row_height),
					cursor: "auto",
				},
			},
			m(".height-100p.list-bg.justify-center.border-radius.pl.pr.flex.col.overflow-hidden.flex-grow", [
				m("p.b.m-0.text-ellipsis.badge-line-height.selectable", {
					oncreate: (vnode) => (this.domName = vnode.dom as HTMLElement),
				}),
				m(".text-ellipsis.smaller.selectable", {
					oncreate: (vnode) => (this.domAddress = vnode.dom as HTMLElement),
				}),
			]),
		)
	}
}
