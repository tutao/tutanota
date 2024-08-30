import m, { Child, Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import { theme } from "./theme"
import { isNotNull, lazy } from "@tutao/tutanota-utils"
import { ExpanderButton, ExpanderPanel } from "./base/Expander.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { px, size } from "./size.js"

export type SidebarSectionAttrs = {
	name: TranslationKey | lazy<string>
	button?: Child
	expandable?: true
	hideIfEmpty?: true
}

export class SidebarSection implements Component<SidebarSectionAttrs> {
	expanded: Stream<boolean> = stream(true)

	view(vnode: Vnode<SidebarSectionAttrs>): Children {
		const { name, button, expandable, hideIfEmpty } = vnode.attrs
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
					expandable
						? m(".flex", [
								m(ExpanderButton, {
									label: () => "",
									expanded: this.expanded(),
									onExpandedChange: this.expanded,
									isBig: true,
									style: {
										minWidth: "auto",
										paddingTop: 0,
										paddingLeft: px(size.hpad_small),
										paddingRight: px(size.hpad_small),
									},
								}),
								m("small.b.align-self-center.text-ellipsis.plr-button", lang.getMaybeLazy(name).toLocaleUpperCase()),
						  ])
						: m("small.b.align-self-center.text-ellipsis.plr-button", lang.getMaybeLazy(name).toLocaleUpperCase()),
					button ?? null,
				]),
				expandable
					? m(
							ExpanderPanel,
							{
								expanded: this.expanded(),
							},
							content,
					  )
					: content,
			],
		)
	}
}
