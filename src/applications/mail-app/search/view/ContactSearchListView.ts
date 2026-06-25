import m, { Children, Component, Vnode } from "mithril"
import { ListModel } from "../../../common/misc/ListModel"
import { Icons } from "../../../../ui/base/icons/Icons"
import { MultiselectMode, RenderConfig } from "../../../../ui/base/List"
import { component_size } from "../../../../ui/size"
import { KindaContactRow } from "../../contacts/view/ContactListView"
import { shouldAlwaysShowMultiselectCheckbox } from "../../../../ui/SelectableRowContainer"
import { Contact } from "@tutao/entities/tutanota"
import { CommonSearchListViewAttrs, renderListColumnWrapper } from "../../../common/search/SearchUtils"

export class ContactSearchListView implements Component<CommonSearchListViewAttrs<Contact>> {
	private attrs: CommonSearchListViewAttrs<Contact>

	private get listModel(): ListModel<Contact, Id> {
		return this.attrs.listModel
	}

	constructor({ attrs }: Vnode<CommonSearchListViewAttrs<Contact>>) {
		this.attrs = attrs
	}

	view({ attrs }: Vnode<CommonSearchListViewAttrs<Contact>>): Children {
		this.attrs = attrs
		return renderListColumnWrapper(attrs.listModel, Icons.PeopleFilled, attrs.onSingleSelection, this.contactRenderConfig)
	}

	private readonly contactRenderConfig: RenderConfig<Contact, KindaContactRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			const row = new KindaContactRow(
				dom,
				(item) => this.listModel.onSingleExclusiveSelection(item),
				() => shouldAlwaysShowMultiselectCheckbox(),
				() => this.attrs.highlightedStrings,
			)
			m.render(dom, row.render())
			return row
		},
	}
}
