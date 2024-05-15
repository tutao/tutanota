import { pureComponent } from "./base/PureComponent.js"
import m from "mithril"
import { lang } from "../misc/LanguageViewModel.js"

export interface SelectAllCheckboxAttrs {
	style?: Record<string, any>
	selectAll: () => unknown
	selectNone: () => unknown
	selected: boolean
}

export const SelectAllCheckbox = pureComponent((attrs: SelectAllCheckboxAttrs) => {
	return m(
		".flex.items-center.pl-s.mlr.button-height",
		{ style: attrs.style },
		m("input.checkbox", {
			type: "checkbox",
			title: lang.get("selectAllLoaded_action"),
			// I'm not sure this is the best condition but it will do for now
			checked: attrs.selected,
			onchange: ({ target }: Event) => toggleSelectAll(attrs, (target as HTMLInputElement).checked),
		}),
	)
})

function toggleSelectAll(attrs: SelectAllCheckboxAttrs, selectAll: boolean): void {
	if (selectAll) {
		attrs.selectAll()
	} else {
		attrs.selectNone()
	}
}
