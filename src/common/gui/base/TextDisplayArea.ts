import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { theme } from "../theme"
import { inputLineHeight, px, size } from "../size"
import type { lazy } from "@tutao/tutanota-utils"

export type TextDisplayAreaAttrs = {
	value: string
	label: TranslationKey | lazy<string>
}

/**
 * Simple text area to display some preformated non-editable text.
 */
export class TextDisplayArea implements Component<TextDisplayAreaAttrs> {
	view(vnode: Vnode<TextDisplayAreaAttrs>): Children {
		return m(".flex.flex-grow.flex-column.text.pt", [
			m(
				"label.text-ellipsis.noselect.z1.i.pr-s",
				{
					style: {
						fontSize: px(size.font_size_small),
					},
				},
				lang.getMaybeLazy(vnode.attrs.label),
			),
			m(
				".text-pre.flex-grow",
				{
					style: {
						borderBottom: `1px solid ${theme.content_border}`,
						lineHeight: px(inputLineHeight),
						minHeight: px(inputLineHeight),
					},
					isReadOnly: true,
				},
				vnode.attrs.value,
			),
		])
	}
}
