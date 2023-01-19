import m, { Child, Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import { theme } from "./theme"
import type { lazy } from "@tutao/tutanota-utils"

export type SidebarSectionAttrs = {
	name: TranslationKey | lazy<string>
	button?: Child
}

export class SidebarSection implements Component<SidebarSectionAttrs> {
	view(vnode: Vnode<SidebarSectionAttrs>): Children {
		const { name, button } = vnode.attrs
		const content = vnode.children
		return m(
			".sidebar-section.mb",
			{
				style: {
					color: theme.navigation_button,
				},
			},
			[
				m(".folder-row.flex-space-between.plr-button.pt-s.button-height", [
					m("small.b.align-self-center.text-ellipsis.plr-button", lang.getMaybeLazy(name).toLocaleUpperCase()),
					button ?? null,
				]),
				content,
			],
		)
	}
}
