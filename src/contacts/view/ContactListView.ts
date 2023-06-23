import m, { Children, ClassComponent, Vnode } from "mithril"
import type { Contact } from "../../api/entities/tutanota/TypeRefs.js"
import { size } from "../../gui/size"
import { ListColumnWrapper } from "../../gui/ListColumnWrapper"
import { assertMainOrNode } from "../../api/common/Env"
import { MultiselectMode, NewList, NewListAttrs, RenderConfig, ViewHolder } from "../../gui/base/NewList.js"
import { ContactRow } from "./ContactRow.js"
import { ContactViewModel } from "./ContactViewModel.js"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../gui/theme.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"

assertMainOrNode()

export interface ContactListViewAttrs {
	onSingleSelection: () => unknown
	contactViewModel: ContactViewModel
}

export class ContactListView implements ClassComponent<ContactListViewAttrs> {
	private contactViewModel: ContactViewModel | null = null

	view({ attrs: { contactViewModel, onSingleSelection } }: Vnode<ContactListViewAttrs>): Children {
		this.contactViewModel = contactViewModel
		return m(
			ListColumnWrapper,
			{
				headerContent: null,
			},
			contactViewModel.listModel.isEmptyAndDone()
				? m(ColumnEmptyMessageBox, {
						color: theme.list_message_bg,
						message: "noContacts_msg",
						icon: BootIcons.Contacts,
				  })
				: m(NewList, {
						renderConfig: this.renderConfig,
						state: contactViewModel.listState(),
						// should not be called anyway
						onLoadMore: () => {},
						onRetryLoading: () => {
							contactViewModel.listModel.retryLoading()
						},
						onSingleSelection: (item: Contact) => {
							contactViewModel.listModel.onSingleSelection(item)
							onSingleSelection()
						},
						onSingleMultiselection: (item: Contact) => {
							contactViewModel.listModel.onSingleInclusiveSelection(item)
						},
						selectRangeTowards: (item: Contact) => {
							contactViewModel.listModel.selectRangeTowards(item)
						},
						onStopLoading() {
							contactViewModel.listModel.stopLoading()
						},
				  } satisfies NewListAttrs<Contact, KindaContactRow>),
		)
	}

	private readonly renderConfig: RenderConfig<Contact, KindaContactRow> = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			return new KindaContactRow(dom, (item) => this.contactViewModel?.listModel.onSingleExclusiveSelection(item))
		},
	}
}

export class KindaContactRow implements ViewHolder<Contact> {
	readonly cr: ContactRow
	domElement: HTMLElement
	entity: Contact | null = null

	constructor(dom: HTMLElement, onToggleSelection: (item: Contact) => unknown) {
		this.cr = new ContactRow(onToggleSelection)
		this.domElement = dom
		m.render(dom, this.cr.render())
	}

	update(item: Contact, selected: boolean, multiselect: boolean) {
		this.entity = item
		this.cr.update(item, selected, multiselect)
	}

	render(): Children {
		return this.cr.render()
	}
}
