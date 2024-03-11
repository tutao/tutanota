import { Dialog, DialogType } from "../gui/base/Dialog.js"
import { assertNotNull, getFirstOrThrow, NBSP, ofClass } from "@tutao/tutanota-utils"
import { vCardFileToVCards, vCardListToContacts } from "./VCardImporter.js"
import { locator } from "../api/main/MainLocator.js"
import { GroupType } from "../api/common/TutanotaConstants.js"
import { ImportError } from "../api/common/error/ImportError.js"
import { lang } from "../misc/LanguageViewModel.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { ContactFacade } from "../api/worker/facades/lazy/ContactFacade.js"
import { Contact } from "../api/entities/tutanota/TypeRefs.js"
import m, { Children } from "mithril"
import { List, ListAttrs, ListLoadingState, MultiselectMode, RenderConfig, ViewHolder } from "../gui/base/List.js"
import { px, size } from "../gui/size.js"
import { getContactListName } from "./model/ContactUtils.js"
import { UserError } from "../api/main/UserError.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar.js"
import { ButtonType } from "../gui/base/Button.js"

export class ContactImporter {
	constructor(private readonly contactFacade: ContactFacade) {}

	async importContactsFromFile(vCardData: string, contactListId: string) {
		const vCardList = vCardFileToVCards(vCardData)

		if (vCardList == null) throw new UserError("importVCardError_msg")

		const contactMembership = getFirstOrThrow(locator.logins.getUserController().getContactGroupMemberships())
		const contacts = vCardListToContacts(vCardList, contactMembership.group)

		return showContactImportDialog(contacts, (dialog) => {
			dialog.close()
			this.importContacts(contacts, contactListId)
		})
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
}

/**
 * Show a dialog with a preview of a given list of contacts
 * @param contacts The contact list to be previewed
 * @param okAction The action to be executed when the user press the import button
 */
export function showContactImportDialog(contacts: Contact[], okAction: (dialog: Dialog) => unknown) {
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
			m(
				".dialog-header.plr-l",
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
					middle: () => lang.get("importVCard_action"),
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
			),
			/** variable-size child container that may be scrollable. */
			m(
				".dialog-max-height.plr-l.pb.text-break.scroll.nav-bg",
				m(
					".plr-l",
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
