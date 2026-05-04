import m, { Children, ClassComponent, Vnode } from "mithril"
import { component_size } from "../../../ui/size"
import { ListColumnWrapper } from "../../../ui/ListColumnWrapper"
import { assertMainOrNode } from "@tutao/app-env"
import { List, ListAttrs, MultiselectMode, RenderConfig, ViewHolder } from "../../../ui/base/List.js"
import { ContactRow } from "./ContactRow.js"
import { ContactViewModel } from "./ContactViewModel.js"
import ColumnEmptyMessageBox from "../../../ui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../../ui/theme.js"
import { styles } from "../../../ui/styles.js"
import { shouldAlwaysShowMultiselectCheckbox } from "../../../ui/SelectableRowContainer.js"
import { SearchToken } from "../../../ui/utils/QueryTokenUtils"
import { Icons } from "../../../ui/base/icons/Icons"
import { Contact } from "@tutao/entities/tutanota"

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
						color: theme.on_surface_variant,
						message: "noContacts_msg",
						icon: Icons.PeopleFilled,
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
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			return new KindaContactRow(dom, (item) => this.contactViewModel?.listModel.onSingleExclusiveSelection(item))
		},
	}
}

export class KindaContactRow implements ViewHolder<Contact> {
	readonly cr: ContactRow
	entity: Contact | null = null

	constructor(
		dom: HTMLElement,
		onToggleSelection: (item: Contact) => unknown,
		shouldShowCheckbox: () => boolean = () => shouldAlwaysShowMultiselectCheckbox(),
		private readonly getHighlightedStrings?: () => readonly SearchToken[],
	) {
		this.cr = new ContactRow(onToggleSelection, shouldShowCheckbox, getHighlightedStrings)
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
