import m, { Children, ClassComponent, Vnode } from "mithril"
import type { Contact } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { size } from "../../../common/gui/size"
import { ListColumnWrapper } from "../../../common/gui/ListColumnWrapper"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { List, ListAttrs, MultiselectMode, RenderConfig, ViewHolder } from "../../../common/gui/base/List.js"
import { ContactRow } from "./ContactRow.js"
import { ContactViewModel } from "./ContactViewModel.js"
import ColumnEmptyMessageBox from "../../../common/gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../../common/gui/theme.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { styles } from "../../../common/gui/styles.js"
import { shouldAlwaysShowMultiselectCheckbox } from "../../../common/gui/SelectableRowContainer.js"

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
				: m(List, {
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
						onSingleTogglingMultiselection: (item: Contact) => {
							contactViewModel.listModel.onSingleInclusiveSelection(item, styles.isSingleColumnLayout())
						},
						onRangeSelectionTowards: (item: Contact) => {
							contactViewModel.listModel.selectRangeTowards(item)
						},
						onStopLoading() {
							contactViewModel.listModel.stopLoading()
						},
				  } satisfies ListAttrs<Contact, KindaContactRow>),
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

	constructor(
		dom: HTMLElement,
		onToggleSelection: (item: Contact) => unknown,
		shouldShowCheckbox: () => boolean = () => shouldAlwaysShowMultiselectCheckbox(),
	) {
		this.cr = new ContactRow(onToggleSelection, shouldShowCheckbox)
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
