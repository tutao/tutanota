import { lang, TranslationKey } from "../../../misc/LanguageViewModel.js"
import { lazy } from "@tutao/tutanota-utils"
import m, { Children, Component, Vnode } from "mithril"
import { px, size } from "../../size.js"

export type BannerButtonAttrs = {
	borderColor: string
	color: string
	click: () => unknown
	text: TranslationKey | lazy<string>
}

export class BannerButton implements Component<BannerButtonAttrs> {
	view({ attrs }: Vnode<BannerButtonAttrs>): Children {
		return m(
			"button.border-radius.mr-s.center",
			{
				style: {
					border: `2px solid ${attrs.borderColor}`,
					background: "transparent",
					color: attrs.color,
					width: "min-content",
					padding: px(size.hpad_button),
					minWidth: "60px",
				},
				onclick: attrs.click,
			},
			lang.getMaybeLazy(attrs.text),
		)
	}
}
