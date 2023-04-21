import { pureComponent } from "./base/PureComponent.js"
import { List, VirtualRow } from "./base/List.js"
import { ListElement } from "../api/common/utils/EntityUtils.js"
import m from "mithril"
import { lang } from "../misc/LanguageViewModel.js"

export type SomeList = List<ListElement, VirtualRow<ListElement>>

export const SelectAllCheckbox = pureComponent(({ list }: { list: SomeList }) => {
	return m(
		".flex.items-center.pl-s.mlr.button-height",
		list
			? m("input.checkbox", {
					type: "checkbox",
					title: lang.get("selectAllLoaded_action"),
					// I'm not sure this is the best condition but it will do for now
					checked: list.isAllSelected(),
					onchange: ({ target }: Event) => toggleSelectAll(list, (target as HTMLInputElement).checked),
			  })
			: null,
	)
})

function toggleSelectAll(list: SomeList, selectAll: boolean): void {
	if (selectAll) {
		list.selectAll()
	} else {
		list.selectNone()
	}
}
