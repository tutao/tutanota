import { showFileChooser } from "../../file/FileController.js"
import { utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { locator } from "../../api/main/MainLocator.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { ContactModel } from "../model/ContactModel.js"
import { ContactTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { exportContacts } from "../VCardExporter.js"

export function importAsVCard() {
	showFileChooser(true, ["vcf"]).then(async (contactFiles) => {
		if (contactFiles.length <= 0) return
		return showProgressDialog(
			"pleaseWait_msg",
			(async () => {
				const contactImporter = await locator.contactImporter()
				const contactListId = await locator.contactModel.getContactListId()
				// If multiple vCard files where selected, combine the data within them
				const vCardList = contactFiles.flatMap((contactFile) => {
					return utf8Uint8ArrayToString(contactFile.data)
				})
				await contactImporter.importContactsFromFile(vCardList, contactListId!)
			})(),
		)
	})
}

/**
 *Creates a vCard file with all contacts if at least one contact exists
 */
export function exportAsVCard(contactModel: ContactModel): Promise<void> {
	return showProgressDialog(
		"pleaseWait_msg",
		contactModel.getContactListId().then((contactListId) => {
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
