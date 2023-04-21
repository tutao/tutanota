import { showFileChooser } from "../../file/FileController.js"
import { assertNotNull, flat, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { vCardFileToVCards, vCardListToContacts } from "../VCardImporter.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { locator } from "../../api/main/MainLocator.js"
import { GroupType } from "../../api/common/TutanotaConstants.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { SetupMultipleError } from "../../api/common/error/SetupMultipleError.js"
import { ContactModel } from "../model/ContactModel.js"
import { ContactTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { exportContacts } from "../VCardExporter.js"

export function importAsVCard() {
	showFileChooser(true, ["vcf"]).then((contactFiles) => {
		let numberOfContacts: number

		try {
			if (contactFiles.length > 0) {
				let vCardsList = contactFiles.map((contactFile) => {
					let vCardFileData = utf8Uint8ArrayToString(contactFile.data)
					let vCards = vCardFileToVCards(vCardFileData)

					if (vCards == null) {
						throw new Error("no vcards found")
					} else {
						return vCards
					}
				})
				return showProgressDialog(
					"pleaseWait_msg",
					Promise.resolve().then(() => {
						const flatvCards = flat(vCardsList)
						const contactMembership = assertNotNull(
							locator.logins.getUserController().user.memberships.find((m) => m.groupType === GroupType.Contact),
						)
						const contactList = vCardListToContacts(flatvCards, contactMembership.group)
						numberOfContacts = contactList.length
						return locator.contactModel.contactListId().then((contactListId) =>
							locator.entityClient.setupMultipleEntities(contactListId, contactList).then(() => {
								// actually a success message
								Dialog.message(() =>
									lang.get("importVCardSuccess_msg", {
										"{1}": numberOfContacts,
									}),
								)
							}),
						)
					}),
				)
			}
		} catch (e) {
			console.log(e)

			if (e instanceof SetupMultipleError) {
				Dialog.message(() =>
					lang.get("importContactsError_msg", {
						"{amount}": e.failedInstances.length + "",
						"{total}": numberOfContacts + "",
					}),
				)
			} else {
				Dialog.message("importVCardError_msg")
			}
		}
	})
}

/**
 *Creates a vCard file with all contacts if at least one contact exists
 */
export function exportAsVCard(contactModel: ContactModel): Promise<void> {
	return showProgressDialog(
		"pleaseWait_msg",
		contactModel.contactListId().then((contactListId) => {
			if (!contactListId) return 0
			return locator.entityClient.loadAll(ContactTypeRef, contactListId).then((allContacts) => {
				if (allContacts.length === 0) {
					return 0
				} else {
					return exportContacts(allContacts).then(() => allContacts.length)
				}
			})
		}),
	).then((nbrOfContacts) => {
		if (nbrOfContacts === 0) {
			Dialog.message("noContacts_msg")
		}
	})
}
