import m, {Children, Component, Vnode} from "mithril"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {theme} from "./theme"
import type {ButtonAttrs} from "./base/Button.js"
import {Button} from "./base/Button.js"
import type {lazy} from "@tutao/tutanota-utils"

export type SidebarSectionAttrs = {
	name: TranslationKey | lazy<string>
	buttonAttrs?: ButtonAttrs | null
}

export class SidebarSection implements Component<SidebarSectionAttrs> {
	view(vnode: Vnode<SidebarSectionAttrs>): Children {
		const {name, buttonAttrs} = vnode.attrs
		const content = vnode.children
		return m(
			".sidebar-section.mb",
			{
				style: {
					color: theme.navigation_button,
				},
			},
			[
				m(".folder-row.flex-space-between.plr-l.pt-s.button-height", [
					m("small.b.align-self-center.text-ellipsis", lang.getMaybeLazy(name).toLocaleUpperCase()),
					buttonAttrs ? m(Button, buttonAttrs) : null,
				]),
				content,
			],
		)
	}
}