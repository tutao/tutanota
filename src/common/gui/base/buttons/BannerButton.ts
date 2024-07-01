import { lang, TranslationKey } from "../../../misc/LanguageViewModel.js"
import { lazy } from "@tutao/tutanota-utils"
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
	text: TranslationKey | lazy<string>
}

export class BannerButton implements Component<BannerButtonAttrs> {
	view({ attrs }: Vnode<BannerButtonAttrs>): Children {
		const text = lang.getMaybeLazy(attrs.text)
		return m(BaseButton, {
			label: text,
			text,
			class: `border-radius mr-s center ${attrs.class} ${attrs.disabled ? "disabled" : ""}`,
			style: {
				border: `2px solid ${attrs.disabled ? theme.content_button : attrs.borderColor}`,
				color: attrs.disabled ? theme.content_button : attrs.color,
				padding: px(size.hpad_button),
				minWidth: "60px",
			},
			disabled: attrs.disabled,
			onclick: attrs.click,
		})
	}
}
