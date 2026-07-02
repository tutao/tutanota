import { RowButtonAttrs } from "./RowButton"
import m, { Component, Vnode } from "mithril"
import { AllIcons, Icon, IconSize } from "../Icon"
import { Icons } from "../icons/Icons"
import { theme } from "../../theme"
import { lang, MaybeTranslation } from "../../utils/LanguageViewModel.js"

export interface MultilineRowButtonAttrs extends RowButtonAttrs {
	text: MaybeTranslation
	secondaryText: MaybeTranslation
	icon: AllIcons
}

export class MultilineRowButton implements Component<MultilineRowButtonAttrs> {
	view(vnode: Vnode<MultilineRowButtonAttrs>) {
		const attrs = vnode.attrs
		const primaryText = lang.getTranslationText(attrs.text)
		const secondaryText = lang.getTranslationText(attrs.secondaryText)

		return m(".flex.items-center.gap-8.plr-12.pt-8.pb-8", [
			m(Icon, {
				icon: Icons.GlobeOutline,
				size: IconSize.PX24,
				style: {
					fill: theme.on_surface_variant,
				},
			}),
			m(".flex.col", [m("small.faded", `${secondaryText}`), m("span", primaryText)]),
		])
	}
}
