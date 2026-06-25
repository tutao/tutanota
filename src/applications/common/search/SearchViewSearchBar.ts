import { BaseSearchBar, BaseSearchBarAttrs } from "../../../ui/base/BaseSearchBar"
import m, { Children, Component, Vnode } from "mithril"
import { layout_size, px } from "../../../ui/size"
import { isKeyPressed } from "../../../ui/utils/KeyManager"
import { Keys } from "../../../ui/utils/KeyboardKeys"
import { Styles } from "../../../ui/styles"

/** Common SearchBar wrapper used in search views */
export class SearchViewSearchBar implements Component<BaseSearchBarAttrs> {
	view({ attrs }: Vnode<BaseSearchBarAttrs>): Children {
		return m(
			// form wrapper to isolate the search input and prevent it from being autofilled when unrelated buttons are clicked on chrome
			// this is done because chrome doesn't appear to respect `autocomplete="off"` and will autofill the field anyway
			"form.full-width",
			{
				style: {
					maxWidth: Styles.get().isUsingBottomNavigation() ? "" : px(layout_size.second_col_max_width + 50),
				},
				onsubmit: (e: SubmitEvent) => {
					e.stopPropagation()
					e.preventDefault()
				},
			},
			m(BaseSearchBar, {
				...attrs,
				onKeyDown: (e) => {
					e.stopPropagation()
					if (isKeyPressed(e.key, Keys.RETURN)) {
						e.preventDefault()
					}
				},
			}),
		)
	}
}
