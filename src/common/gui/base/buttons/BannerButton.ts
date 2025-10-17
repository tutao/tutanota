import { lang, MaybeTranslation } from "../../../misc/LanguageViewModel.js"
import m, { Children, Component, Vnode } from "mithril"
import { px, size } from "../../size.js"
import { BaseButton } from "./BaseButton.js"
import { theme } from "../../theme.js"
import { ClickHandler } from "../GuiUtils.js"

export type BannerButtonAttrs = {
	borderColor: string
	color: string
	class?: string
	disabled?: boolean
	click: ClickHandler
	text: MaybeTranslation
	icon?: Children
}

export class BannerButton implements Component<BannerButtonAttrs> {
	view({ attrs }: Vnode<BannerButtonAttrs>): Children {
		return m(BaseButton, {
			label: attrs.text,
			text: lang.getTranslationText(attrs.text),
			class: `border-radius center ${attrs.class} ${attrs.disabled ? "disabled" : ""}`,
			style: {
				border: `2px solid ${attrs.disabled ? theme.on_surface_variant : attrs.borderColor}`,
				color: attrs.disabled ? theme.on_surface : attrs.color,
				padding: px(size.vpad_small),
				minWidth: "60px",
			},
			disabled: attrs.disabled,
			onclick: attrs.click,
			icon: attrs.icon,
		})
	}
}
