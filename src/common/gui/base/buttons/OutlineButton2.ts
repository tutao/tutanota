import m, { Children, ClassComponent, Vnode } from "mithril"
import { lang, TranslationText } from "../../../misc/LanguageViewModel.js"
import { ClickHandler } from "../GuiUtils.js"
import { BaseButton } from "./BaseButton.js"
import { theme } from "../../theme.js"
import { px, size } from "../../size.js"

export interface OutlineButton2Attrs {
	label: TranslationText
	onclick: ClickHandler
}

export class OutlineButton2 implements ClassComponent<OutlineButton2Attrs> {
	view({ attrs }: Vnode<OutlineButton2Attrs>): Children {
		return m(BaseButton, {
			label: lang.getMaybeLazy(attrs.label),
			text: lang.getMaybeLazy(attrs.label),
			onclick: attrs.onclick,
			class: `border-radius-big plr-button center flash`,
			style: {
				border: `2px solid ${theme.content_accent}`,
				height: px(size.button_height_compact),
				color: theme.content_accent,
			},
		})
	}
}
