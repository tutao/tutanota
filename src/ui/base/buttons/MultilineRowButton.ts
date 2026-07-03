import m, { Component, Vnode } from "mithril"
import { Icon, IconSize } from "../Icon"
import { Icons } from "../icons/Icons"
import { theme } from "../../theme"
import { lang, MaybeTranslation } from "../../utils/LanguageViewModel.js"
import { ClickHandler } from "../GuiUtils"
import { AriaRole } from "../../AriaUtils"

export interface MultilineRowButtonAttrs {
	ariaLabel: MaybeTranslation
	role: AriaRole
	text: MaybeTranslation
	secondaryText: MaybeTranslation
	selected: boolean
	onclick: ClickHandler
	icon: Icons
	classes?: string
}

export class MultilineRowButton implements Component<MultilineRowButtonAttrs> {
	view(vnode: Vnode<MultilineRowButtonAttrs>) {
		const attrs = vnode.attrs
		const primaryText = lang.getTranslationText(attrs.text)
		const secondaryText = lang.getTranslationText(attrs.secondaryText)

		return m(
			"button.flex.items-center.gap-8.plr-12.pt-8.pb-8",
			{
				class: attrs.classes,
				title: lang.getTranslationText(attrs.ariaLabel),
				"aria-selected": attrs.selected,
				onclick: attrs.onclick,
				role: attrs.role,
			},
			[
				attrs.icon
					? m(Icon, {
							icon: Icons.GlobeOutline,
							size: IconSize.PX24,
							style: {
								fill: theme.on_surface_variant,
							},
						})
					: null,
				m(".flex.col.flex-shrink.overflow-hidden", [m("small.faded.text-ellipsis", `${secondaryText}`), m("span.text-ellipsis", primaryText)]),
			],
		)
	}
}
