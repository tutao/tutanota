import { Dialog } from "../../common/gui/base/Dialog.js"
import { assertNotNull, getFirstOrThrow, ofClass, promiseMap } from "@tutao/utils"
import { locator } from "../../common/api/main/CommonLocator.js"
import { vCardFileToVCards, vCardListToContacts } from "./VCardImporter.js"
import { ImportError } from "../../common/api/common/error/ImportError.js"
import { lang } from "../../common/misc/LanguageViewModel.js"
import { showProgressDialog } from "../../common/gui/dialogs/ProgressDialog.js"
import { ContactFacade } from "../../common/api/worker/facades/lazy/ContactFacade.js"
import { UserError } from "../../common/api/main/UserError.js"
import { ImportNativeContactBooksDialog } from "./view/ImportNativeContactBooksDialog.js"
import { StructuredContact } from "../../common/native/common/generatedipc/StructuredContact.js"
import { isoDateToBirthday } from "../../common/api/common/utils/BirthdayUtils.js"
import { ContactBook } from "../../common/native/common/generatedipc/ContactBook.js"
import { PermissionType } from "../../common/native/common/generatedipc/PermissionType.js"
import { SystemPermissionHandler } from "../../common/native/main/SystemPermissionHandler.js"
import { mailLocator } from "../mailLocator.js"
import { FileReference } from "../../common/api/common/utils/FileUtils.js"
import { AttachmentType, getAttachmentType } from "../../common/gui/AttachmentBubble.js"
import { NativeFileApp } from "../../common/native/common/FileApp.js"
import { MobileContactsFacade } from "../../common/native/common/generatedipc/MobileContactsFacade.js"
import { NativeContactsSyncManager } from "./model/NativeContactsSyncManager"
import { _compareContactsForMerge } from "./ContactMergeUtils"
import { ContactSelectionDialogAttrs, ContactSelectionDialogSize, showContactSelectionDialog } from "./view/ContactSelectionDialog"
import { tutanotaTypeRefs } from "@tutao/typeRefs"
import { ContactComparisonResult, isIOSApp } from "@tutao/appEnv"

export class ContactImporter {
	constructor(
		private readonly contactFacade: ContactFacade,
		private readonly systemPermissionHandler: SystemPermissionHandler,
		private readonly mobileContactsFacade: MobileContactsFacade | null,
		private readonly nativeContactSyncManager: NativeContactsSyncManager | null,
	) {}

	async importContactsFromFile(vCardData: string | string[], contactListId: string) {
		const vCardList = Array.isArray(vCardData) ? ContactImporter.combineVCardData(vCardData) : vCardFileToVCards(vCardData)

		if (vCardList == null) throw new UserError("importVCardError_msg")

		const contactMembership = getFirstOrThrow(locator.logins.getUserController().getContactGroupMemberships())
		const contacts = vCardListToContacts(vCardList, contactMembership.group)

		const attrs: ContactSelectionDialogAttrs = {
			okActionText: "import_action",
			titleText: "importVCard_action",
			dialogSize: ContactSelectionDialogSize.Large,
		}

		return showContactSelectionDialog(attrs, contacts, (dialog, selectedContacts) => {
			dialog.close()
			// the contactSelectionDialog uses a listModel which expects _id's to be set
			// we remove them here again to not cause problems when importing
			selectedContacts = selectedContacts.map((contact) => {
				// @ts-ignore
				contact._id = null
				return contact
			})
			this.importContacts(selectedContacts, contactListId)
		})
	}

	private static combineVCardData(vCardData: string[]): string[] | null {
		const combinedVCardData = vCardData.flatMap((itemData) => vCardFileToVCards(itemData))
		return combinedVCardData.filter((vCard) => vCard != null) as string[]
	}

	async importContacts(selectedContacts: readonly tutanotaTypeRefs.Contact[], contactListId: string) {
		//loading all contacts to avoid duplicating contacts while importing
		const allContacts = await locator.entityClient.loadAll(tutanotaTypeRefs.ContactTypeRef, contactListId)

		const deDuplicatedContacts = this.getDeDuplicatedContacts(allContacts, selectedContacts)

		const importPromise = this.contactFacade
			.importContactList(deDuplicatedContacts, contactListId)
			.catch(
				ofClass(ImportError, (e) =>
					Dialog.message(
						lang.makeTranslation(
							"confirm_msg",
							lang.get("importContactsError_msg", {
								"{amount}": e.numFailed + "",
								"{total}": deDuplicatedContacts.length + "",
							}),
						),
					),
				),
			)
			.catch(() => Dialog.message("unknownError_msg"))
		await showProgressDialog("pleaseWait_msg", importPromise)
		await Dialog.message(
			lang.makeTranslation(
				"confirm_msg",
				selectedContacts.length === deDuplicatedContacts.length
					? lang.get("importVCardSuccess_msg", {
							"{1}": deDuplicatedContacts.length,
						})
					: lang.get("importContactDuplicates_msg", {
							"{duplicates}": selectedContacts.length - deDuplicatedContacts.length,
							"{newContacts}": deDuplicatedContacts.length,
						}),
			),
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
		// these will only ever be null if !isApp()
		const mobileContactsFacade = assertNotNull(this.mobileContactsFacade)

		const books = await this.selectContactBooks(mobileContactsFacade)
		if (books == null) {
			return
		}

		const contactListId = await locator.contactModel.getContactListId()
		const contactGroupId = await locator.contactModel.getContactGroupId()

		const allImportableStructuredContacts: StructuredContact[] = (
			await promiseMap(
				books,
				async (book) => await mobileContactsFacade.getContactsInContactBook(book.id, locator.logins.getUserController().loginUsername),
			)
		).flat()
		const allImportableContactsToStructuredContact = new Map(
			allImportableStructuredContacts.map((structuredContact, index) => [
				this.contactFromStructuredContact(contactGroupId, structuredContact, index),
				structuredContact,
			]),
		)

		const attrs: ContactSelectionDialogAttrs = {
			okActionText: "import_action",
			titleText: "importContacts_label",
			dialogSize: ContactSelectionDialogSize.Large,
		}

		const allImportableContacts = allImportableContactsToStructuredContact.keys()
		showContactSelectionDialog(attrs, [...allImportableContacts], async (dialog, selectedContacts) => {
			dialog.close()
			// the contactSelectionDialog uses a listModel which expects _id's to be set
			// we remove them here again to not cause problems when importing
			selectedContacts = selectedContacts.map((contact) => {
				// @ts-ignore
				contact._id = null
				return contact
			})
			await this.onContactImportConfirmed(contactListId, selectedContacts, allImportableContactsToStructuredContact)
		})
	}

	private async onContactImportConfirmed(
		contactListId: string | null,
		selectedContacts: tutanotaTypeRefs.Contact[],
		allImportableContacts: Map<tutanotaTypeRefs.Contact, StructuredContact>,
	) {
		const importer = await mailLocator.contactImporter()
		const mobileContactsFacade = assertNotNull(this.mobileContactsFacade)
		const nativeContactSyncManager = assertNotNull(this.nativeContactSyncManager)

		const selectedStructuredContacts: StructuredContact[] = selectedContacts.map((selectedContact) =>
			assertNotNull(allImportableContacts.get(selectedContact)),
		)

		await importer.importContacts(selectedContacts, assertNotNull(contactListId))
		const imported = nativeContactSyncManager.isEnabled() && (await nativeContactSyncManager.syncContacts())

		// On iOS, we want to give the option to remove the contacts locally, but we obviously only want to do
		// this if syncing is successful, assuming syncing is enabled.
		//
		// Do nothing further if not on iOS, or if syncing is disabled or failed.
		if (imported && isIOSApp()) {
			const contactsWeJustImported = selectedStructuredContacts.map((contact) => assertNotNull(contact.rawId))
			const remove = await Dialog.confirm("importContactRemoveImportedContactsConfirm_msg")
			if (remove) {
				await showProgressDialog("progressDeleting_msg", mobileContactsFacade.deleteLocalContacts(contactsWeJustImported))
			}
		}
	}

	getDeDuplicatedContacts(
		allContacts: readonly tutanotaTypeRefs.Contact[],
		selectedContacts: readonly tutanotaTypeRefs.Contact[],
	): tutanotaTypeRefs.Contact[] {
		return selectedContacts.filter(
			(selectedContact) =>
				!allContacts.some((serverContact) => _compareContactsForMerge(serverContact, selectedContact) === ContactComparisonResult.Equal),
		)
	}

	private async selectContactBooks(mobileContactsFacade: MobileContactsFacade): Promise<readonly ContactBook[] | null> {
		const contactBooks = await showProgressDialog("pleaseWait_msg", mobileContactsFacade.getContactBooks())
		if (contactBooks.length === 0) {
			return null
		} else if (contactBooks.length === 1) {
			return contactBooks
		} else {
			const importDialog = new ImportNativeContactBooksDialog(contactBooks)
			const selectedBooks = await importDialog.show()
			if (selectedBooks == null || selectedBooks.length === 0) return null
			return selectedBooks
		}
	}

	private contactFromStructuredContact(ownerGroupId: Id, contact: StructuredContact, index: number): tutanotaTypeRefs.Contact {
		return tutanotaTypeRefs.createContact({
			_id: ["dummyContactListId", "dummyContactElementId" + index],
			_ownerGroup: ownerGroupId,
			nickname: contact.nickname,
			firstName: contact.firstName,
			lastName: contact.lastName,
			company: contact.company,
			addresses: contact.addresses.map((address) =>
				tutanotaTypeRefs.createContactAddress({
					type: address.type,
					address: address.address,
					customTypeName: address.customTypeName,
				}),
			),
			mailAddresses: contact.mailAddresses.map((address) =>
				tutanotaTypeRefs.createContactMailAddress({
					type: address.type,
					address: address.address,
					customTypeName: address.customTypeName,
				}),
			),
			phoneNumbers: contact.phoneNumbers.map((number) =>
				tutanotaTypeRefs.createContactPhoneNumber({
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
			pronouns: [],
			customDate: contact.customDate.map((date) => tutanotaTypeRefs.createContactCustomDate(date)),
			department: contact.department,
			messengerHandles: contact.messengerHandles.map((handle) => tutanotaTypeRefs.createContactMessengerHandle(handle)),
			middleName: contact.middleName,
			nameSuffix: contact.nameSuffix,
			phoneticFirst: contact.phoneticFirst,
			phoneticLast: contact.phoneticLast,
			phoneticMiddle: contact.phoneticMiddle,
			relationships: contact.relationships.map((relation) => tutanotaTypeRefs.createContactRelationship(relation)),
			websites: contact.websites.map((website) => tutanotaTypeRefs.createContactWebsite(website)),
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

export async function parseContacts(fileList: FileReference[], fileApp: NativeFileApp) {
	const rawContacts: string[] = []
	for (const file of fileList) {
		if (getAttachmentType(file.mimeType) === AttachmentType.CONTACT) {
			const dataFile = await fileApp.readDataFile(file.location)
			if (dataFile == null) continue

			const decoder = new TextDecoder("utf-8")
			const vCardData = decoder.decode(dataFile.data)

			rawContacts.push(vCardData)
		}
	}

	return rawContacts
}
