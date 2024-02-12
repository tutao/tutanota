import m, { Child, Children } from "mithril"
import { assertMainOrNode, isApp } from "../api/common/Env"
import { lang } from "../misc/LanguageViewModel"

import type { DropDownSelectorAttrs } from "../gui/base/DropDownSelector.js"
import { DropDownSelector } from "../gui/base/DropDownSelector.js"
import type { UpdatableSettingsViewer } from "./SettingsView"
import { EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils.js"
import { locator } from "../api/main/MainLocator.js"
import { FeatureType, OperationType } from "../api/common/TutanotaConstants.js"
import {
	Contact,
	createContact,
	createContactAddress,
	createContactMailAddress,
	createContactPhoneNumber,
	TutanotaProperties,
	TutanotaPropertiesTypeRef,
} from "../api/entities/tutanota/TypeRefs.js"
import { deviceConfig } from "../misc/DeviceConfig.js"
import { Button, ButtonType } from "../gui/base/Button.js"
import { ImportNativeContactBooksDialog } from "./ImportNativeContactBooksDialog.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { Dialog } from "../gui/base/Dialog.js"
import { StructuredContact } from "../native/common/generatedipc/StructuredContact.js"
import { isoDateToBirthday } from "../api/common/utils/BirthdayUtils.js"
import { assert, assertNotNull, promiseMap } from "@tutao/tutanota-utils"
import { showContactImportDialog } from "../contacts/ContactImporter.js"

assertMainOrNode()

export class ContactsSettingsViewer implements UpdatableSettingsViewer {
	private enableContactSync: boolean = false
	private noAutomaticContacts: boolean = false

	constructor() {
		this.enableContactSync = deviceConfig.getUserSyncContactsWithPhonePreference(locator.logins.getUserController().userId) ?? false
		this.noAutomaticContacts = locator.logins.getUserController().props.noAutomaticContacts
	}

	view(): Children {
		return [
			m(
				".fill-absolute.scroll.plr-l.pb-xl",
				{
					role: "group",
				},
				[
					m(".h4.mt-l", lang.get("contactsManagement_label")),
					this.renderImportContactsButton(),
					locator.logins.isEnabled(FeatureType.DisableContacts) ? null : this.renderAutoCreateContactsPreference(),
					this.renderContactsSyncDropdown(),
				],
			),
		]
	}

	private renderAutoCreateContactsPreference(): Children {
		return m(DropDownSelector, {
			label: "createContacts_label",
			helpLabel: () => lang.get("createContactsForRecipients_action"),
			items: [
				{
					name: lang.get("activated_label"),
					value: false,
				},
				{
					name: lang.get("deactivated_label"),
					value: true,
				},
			],
			selectedValue: this.noAutomaticContacts,
			selectionChangedHandler: (v) => {
				locator.logins.getUserController().props.noAutomaticContacts = v
				locator.entityClient.update(locator.logins.getUserController().props)
			},
			dropdownWidth: 250,
		} satisfies DropDownSelectorAttrs<boolean>)
	}

	private renderImportContactsButton(): Children {
		if (!isApp()) {
			return null
		}
		return m(".flex.flex-space-between.items-center", [
			lang.get("importFromContactBook_label"),
			m(Button, {
				label: "import_action",
				click: () => this.importContacts(),
				type: ButtonType.Primary,
			}),
		])
	}

	private async importContacts() {
		assert(isApp(), "isApp")
		const contactBooks = await showProgressDialog("pleaseWait_msg", locator.mobileContactsFacade.getContactBooks())
		const importDialog = new ImportNativeContactBooksDialog(contactBooks)
		const books = await importDialog.show()
		if (books == null || books.length === 0) return

		const contactListId = await locator.contactModel.getContactListId()
		const contactGroupId = await locator.contactModel.getContactGroupId()
		const contactsToImport: Contact[] = (
			await promiseMap(books, async (book) => {
				const structuredContacts = await locator.mobileContactsFacade.getContactsInContactBook(book.id)
				return structuredContacts.map((contact) => this.contactFromStructuredContact(contactGroupId, contact))
			})
		).flat()

		const importer = await locator.contactImporter()

		showContactImportDialog(contactsToImport, (dialog) => {
			dialog.close()
			importer.importContacts(contactsToImport, assertNotNull(contactListId))
		})
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
			role: "",
			oldBirthdayAggregate: null,
			oldBirthdayDate: null,
			photo: null,
			presharedPassword: null,
			socialIds: [],
			birthdayIso: this.validateBirthdayOfContact(contact),
			autoTransmitPassword: "",
			title: null,
			comment: "",
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

	private renderContactsSyncDropdown(): Child {
		if (!isApp()) return null

		return m(DropDownSelector, {
			label: "contactsSynchronization_label",
			helpLabel: () => lang.get("contactsSynchronizationWarning_msg"),
			items: [
				{
					name: lang.get("activated_label"),
					value: true,
				},
				{
					name: lang.get("deactivated_label"),
					value: false,
				},
			],
			selectedValue: this.enableContactSync,
			selectionChangedHandler: (contactSyncEnabled: boolean) => {
				const userId = locator.logins.getUserController().userId

				this.enableContactSync = contactSyncEnabled
				deviceConfig.setUserSyncContactsWithPhonePreference(userId, contactSyncEnabled)

				if (isApp()) {
					if (!contactSyncEnabled) {
						locator.nativeContactsSyncManager()?.clearContacts()
					} else {
						// We just enable if the synchronization started successfully
						locator
							.nativeContactsSyncManager()
							?.syncContacts()
							.then((allowed) => {
								if (!allowed) {
									this.handleContactsSynchronizationFail(userId)
								}
							})
					}
				}
			},
			dropdownWidth: 250,
		})
	}

	updateTutaPropertiesSettings(props: TutanotaProperties) {
		this.noAutomaticContacts = props.noAutomaticContacts
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			const { operation } = update
			if (isUpdateForTypeRef(TutanotaPropertiesTypeRef, update) && operation === OperationType.UPDATE) {
				const props = await locator.entityClient.load(TutanotaPropertiesTypeRef, locator.logins.getUserController().props._id)
				this.updateTutaPropertiesSettings(props)
			}
		}
		m.redraw()
	}

	private handleContactsSynchronizationFail(userId: string) {
		this.showContactsPermissionDialog()
		deviceConfig.setUserSyncContactsWithPhonePreference(userId, false)
		this.enableContactSync = false
	}

	private async showContactsPermissionDialog() {
		await Dialog.message("allowContactReadWrite_msg")
		await locator.systemFacade.goToSettings()
	}
}
