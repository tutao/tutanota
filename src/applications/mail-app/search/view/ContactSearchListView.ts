import m, { Children, Component, Vnode } from "mithril"
import { CommonSearchListViewAttrs, SearchResultListEntry, SearchResultListRow } from "./SearchListView"
import { ListModel } from "../../../common/misc/ListModel"
import { Icons } from "../../../../ui/base/icons/Icons"
import { MultiselectMode, RenderConfig } from "../../../../ui/base/List"
import { component_size } from "../../../../ui/size"
import { KindaContactRow } from "../../contacts/view/ContactListView"
import { shouldAlwaysShowMultiselectCheckbox } from "../../../../ui/SelectableRowContainer"
import { renderListColumnWrapper } from "./MailSearchListView"

export class ContactSearchListView implements Component<CommonSearchListViewAttrs> {
	private attrs: CommonSearchListViewAttrs

	private get listModel(): ListModel<SearchResultListEntry, Id> {
		return this.attrs.listModel
	}

	constructor({ attrs }: Vnode<CommonSearchListViewAttrs>) {
		this.attrs = attrs
	}

	view({ attrs }: Vnode<CommonSearchListViewAttrs>): Children {
		this.attrs = attrs
		return renderListColumnWrapper(attrs.listModel, Icons.PeopleFilled, attrs.onSingleSelection, this.contactRenderConfig)
	}

	private readonly contactRenderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			const row: SearchResultListRow = new SearchResultListRow(
				new KindaContactRow(
					dom,
					() => row.entity && this.listModel.onSingleExclusiveSelection(row.entity),
					() => shouldAlwaysShowMultiselectCheckbox(),
					() => this.attrs.highlightedStrings,
				),
			)
			m.render(dom, row.render())
			return row
		},
	}
}
