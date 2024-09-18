import m, { Child, Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import { theme } from "./theme"
import { lazy } from "@tutao/tutanota-utils"
import Stream from "mithril/stream"
import stream from "mithril/stream"

export type SidebarSectionAttrs = {
	name: TranslationKey | lazy<string>
	button?: Child
	hideIfEmpty?: true
}

export class SidebarSection implements Component<SidebarSectionAttrs> {
	expanded: Stream<boolean> = stream(true)

	view(vnode: Vnode<SidebarSectionAttrs>): Children {
		const { name, button, hideIfEmpty } = vnode.attrs
		const content = vnode.children
		if (hideIfEmpty && content == false) return null // Using loose equality to check if children has any contents
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
