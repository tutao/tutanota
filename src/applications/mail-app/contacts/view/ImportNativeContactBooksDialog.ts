import { Dialog, DialogType } from "../../../../ui/base/Dialog.js"
import { ContactBook } from "@tutao/native-bridge/generatedIpc/types"
import m, { Children } from "mithril"
import { Checkbox } from "../../../../ui/base/Checkbox.js"
import { defer } from "../../../../platform-kit/utils"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"

/**
 * Displays a list of contact books to import contacts from.
 */
export class ImportNativeContactBooksDialog {
	private readonly selectedContactBooks: Set<string>

	constructor(private readonly contactBooks: ReadonlyArray<ContactBook>) {
		this.selectedContactBooks = new Set(this.contactBooks.map((book) => book.id))
	}

	show(): Promise<ContactBook[] | null> {
		const deferred = defer<ContactBook[] | null>()
		const dialog = Dialog.showActionDialog({
			title: "importContacts_label",
			type: DialogType.EditMedium,
			allowCancel: true,
			child: () => {
				return m(
					".scroll",
					this.contactBooks.map((book) => this.renderRow(book)),
				)
			},
			okAction: () => {
				deferred.resolve(this.contactBooks.filter((book) => this.selectedContactBooks.has(book.id)))
				dialog.close()
			},
			cancelAction: () => deferred.resolve(null),
		})
		return deferred.promise
	}

	private renderRow(book: ContactBook): Children {
		const checked = this.selectedContactBooks.has(book.id)
		return m(
			".flex.items-center",
			m(
				".pt-16",
				m(Checkbox, {
					checked,
					label: () => book.name ?? lang.get("pushIdentifierCurrentDevice_label"),
					onChecked: () => {
						if (checked) {
							this.selectedContactBooks.delete(book.id)
						} else {
							this.selectedContactBooks.add(book.id)
						}
					},
				}),
			),
		)
	}
}
