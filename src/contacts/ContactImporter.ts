import { Dialog } from "../gui/base/Dialog.js"
import { assertNotNull, NBSP, ofClass } from "@tutao/tutanota-utils"
import { locator } from "../api/main/MainLocator.js"
import { GroupType } from "../api/common/TutanotaConstants.js"
import { vCardListToContacts } from "./VCardImporter.js"
import { ImportError } from "../api/common/error/ImportError.js"
import { lang } from "../misc/LanguageViewModel.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { ContactFacade } from "../api/worker/facades/lazy/ContactFacade.js"
import { Contact } from "../api/entities/tutanota/TypeRefs.js"
import m, { Children } from "mithril"
import { List, ListAttrs, ListLoadingState, MultiselectMode, ViewHolder } from "../gui/base/List.js"
import { px, size } from "../gui/size.js"
import { VirtualRow } from "../gui/base/ListUtils.js"
import { getContactListName } from "./model/ContactUtils.js"

export async function importContactsFromFile(vCardData: string[], contactListId: string) {
	const contactMembership = assertNotNull(locator.logins.getUserController().user.memberships.find((m) => m.groupType === GroupType.Contact))
	const contacts = vCardListToContacts(vCardData, contactMembership.group)

	return contactImportDialog(contacts, (dialog) => {
		dialog.close()
		importContacts(contacts, contactListId, locator.contactFacade)
	}).show()
}

async function importContacts(contacts: ReadonlyArray<Contact>, contactListId: string, contactFacade: ContactFacade) {
	const importPromise = contactFacade
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

/**
 * Show a dialog with a preview of a given list of contacts
 * @param contacts The contact list to be previewed
 * @param okAction The action to be executed when the user press the import button
 */
function contactImportDialog(contacts: Contact[], okAction: (dialog: Dialog) => unknown): Dialog {
	return Dialog.showActionDialog({
		title: () => lang.get("importVCard_action"),
		child: () =>
			m(
				".mt-s",
				m(
					".flex.col.rel",
					{
						style: {
							height: px(size.list_row_height * contacts.length),
						},
					},
					m(List, {
						renderConfig: {
							itemHeight: size.list_row_height,
							multiselectionAllowed: MultiselectMode.Disabled,
							swipe: null,
							createElement: (dom) => {
								const row: ImportContactRowHolder = new ImportContactRowHolder(dom)

								m.render(dom, row.render())

								return row
							},
						},
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
		okAction,
		allowCancel: true,
		okActionTextId: "import_action",
	})
}

class ImportContactVirtualRow implements VirtualRow<Contact> {
	top: number
	domElement: HTMLElement | null = null // set from List

	entity: Contact | null
	private domName!: HTMLElement
	private domAddress!: HTMLElement

	constructor() {
		this.top = 0
		this.entity = null
	}

	update(contact: Contact): void {
		this.entity = contact

		this.domName.textContent = getContactListName(contact)
		this.domAddress.textContent = contact.mailAddresses && contact.mailAddresses.length > 0 ? contact.mailAddresses[0].address : NBSP
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		return m(
			".flex.height-100p.pt-xs.items-center.click-disabled",
			{
				style: {
					"max-height": px(size.list_row_height),
				},
			},
			m(".height-100p.list-bg.justify-center.border-radius.pl.pr.flex.col.overflow-hidden.flex-grow", [
				m("p.b.m-0.text-ellipsis.badge-line-height", {
					oncreate: (vnode) => (this.domName = vnode.dom as HTMLElement),
				}),
				m(".text-ellipsis.smaller", {
					oncreate: (vnode) => (this.domAddress = vnode.dom as HTMLElement),
				}),
			]),
		)
	}
}

class ImportContactRowHolder implements ViewHolder<Contact> {
	readonly cr: ImportContactVirtualRow
	domElement: HTMLElement
	entity: Contact | null = null

	constructor(dom: HTMLElement) {
		this.cr = new ImportContactVirtualRow()
		this.domElement = dom
		m.render(dom, this.cr.render())
	}

	update(item: Contact) {
		this.entity = item
		this.cr.update(item)
	}

	render(): Children {
		return this.cr.render()
	}
}
