import m, { Child, Children, Component, Vnode } from "mithril"
import type { MaybeTranslation } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import { theme } from "./theme"
import Stream from "mithril/stream"
import stream from "mithril/stream"

export type SidebarSectionAttrs = {
	name: MaybeTranslation
	button?: Child
	hideIfEmpty?: true
}

export class SidebarSection implements Component<SidebarSectionAttrs> {
	expanded: Stream<boolean> = stream(true)

	view(vnode: Vnode<SidebarSectionAttrs>): Children {
		const { name, button, hideIfEmpty } = vnode.attrs
		const content = vnode.children

		// eslint-disable-next-line eqeqeq -- Using loose equality to check if children has any contents
		if (hideIfEmpty && content == false) return null
		return m(
			".sidebar-section",
			{
				"data-testid": `section:${lang.getTestId(name)}`,
				style: {
					color: theme.on_surface,
				},
			},
			[
				m(".folder-row.flex-space-between.plr-button.pt-s.button-height", [
					m("small.b.align-self-center.text-ellipsis.plr-button", lang.getTranslationText(name).toLocaleUpperCase()),
					button ?? null,
				]),
				content,
			],
		)
	}
}
