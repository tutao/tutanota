import m, {Children, Component, Vnode} from "mithril"
import type {NavButtonAttrs} from "../gui/base/NavButton.js"
import {isNavButtonSelected, NavButton} from "../gui/base/NavButton.js"
import type {ButtonAttrs} from "../gui/base/Button.js"
import {Button} from "../gui/base/Button.js"

export type SettingsFolderRowAttrs = {
	mainButtonAttrs: NavButtonAttrs
	/**
	 * An extra button will be shown either only when the row is selected, or always in the case that the nav button is disabled
	 */
	extraButtonAttrs?: ButtonAttrs | null
}

export class SettingsFolderRow implements Component<SettingsFolderRowAttrs> {
	view(vnode: Vnode<SettingsFolderRowAttrs>): Children {
		const {mainButtonAttrs, extraButtonAttrs} = vnode.attrs
		const isSelected = isNavButtonSelected(mainButtonAttrs)
		const selector = `.folder-row.flex-start.pl-l.pr-m${isSelected ? ".row-selected" : ""}`
		return m(selector, [
			m(NavButton, mainButtonAttrs),
			extraButtonAttrs && isSelected ? m(Button, extraButtonAttrs) : null
		])
	}
}