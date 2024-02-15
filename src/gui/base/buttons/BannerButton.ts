import { lang, TranslationKey } from "../../../misc/LanguageViewModel.js"
import { lazy } from "@tutao/tutanota-utils"
import m, { Children, Component, Vnode } from "mithril"
import { px, size } from "../../size.js"
import { BaseButton } from "./BaseButton.js"

export type BannerButtonAttrs = {
	borderColor: string
	color: string
	click: () => unknown
	text: TranslationKey | lazy<string>
}

export class BannerButton implements Component<BannerButtonAttrs> {
	view({ attrs }: Vnode<BannerButtonAttrs>): Children {
		const text = lang.getMaybeLazy(attrs.text)
		return m(BaseButton, {
			label: text,
			text,
			class: "border-radius mr-s center",
			style: {
				border: `2px solid ${attrs.borderColor}`,
				color: attrs.color,
				width: "min-content",
				padding: px(size.hpad_button),
				minWidth: "60px",
			},
			onclick: attrs.click,
		})
	}
}
