// @flow

import m from "mithril"
import type {NavButtonAttrs} from "../gui/base/NavButtonN"
import {isNavButtonSelected, NavButtonN} from "../gui/base/NavButtonN"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN} from "../gui/base/ButtonN"

export type SettingsFolderRowAttrs = {
	mainButtonAttrs: NavButtonAttrs,

	/**
	 * An extra button will be shown either only when the row is selected, or always in the case that the nav button is disabled
	 */
	extraButtonAttrs?: ?ButtonAttrs,
}

export class SettingsFolderRow implements MComponent<SettingsFolderRowAttrs> {

	view(vnode: Vnode<SettingsFolderRowAttrs>): Children {
		const {mainButtonAttrs, extraButtonAttrs} = vnode.attrs
		const isSelected = isNavButtonSelected(mainButtonAttrs)
		// undefined/null === enabled
		const selector = `.folder-row.flex-start.pl-l.pr-m${isSelected ? ".row-selected" : ""}`
		return m(selector, [
			[
				m(NavButtonN, mainButtonAttrs),
				extraButtonAttrs && (isSelected) ? m(ButtonN, extraButtonAttrs) : null,
			],
		])
	}
}

