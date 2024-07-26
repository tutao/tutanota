import m, { Child, Children, Component, Vnode } from "mithril"
import type { NavButtonAttrs } from "../gui/base/NavButton.js"
import { isNavButtonSelected, NavButton } from "../gui/base/NavButton.js"

export type SettingsFolderRowAttrs = {
	mainButtonAttrs: NavButtonAttrs
	/**
	 * An extra button will be shown either only when the row is selected, or always in the case that the nav button is disabled
	 */
	extraButton?: Child | null
}

export class SettingsFolderRow implements Component<SettingsFolderRowAttrs> {
	view(vnode: Vnode<SettingsFolderRowAttrs>): Children {
		const { mainButtonAttrs, extraButton } = vnode.attrs
		const isSelected = isNavButtonSelected(mainButtonAttrs)
		const selector = `.folder-row.flex-start.pl-button.pr-m${isSelected ? ".row-selected" : ""}`
		return m(selector, [m(NavButton, mainButtonAttrs), extraButton && isSelected ? extraButton : null])
	}
}
