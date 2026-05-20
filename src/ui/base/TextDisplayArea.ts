import m, { Children, Component, Vnode } from "mithril"
import type { MaybeTranslation } from "../utils/LanguageViewModel"
import { lang } from "../utils/LanguageViewModel"
import { theme } from "../theme"
import { font_size, px } from "../size"

export type TextDisplayAreaAttrs = {
	value: string
	label: MaybeTranslation
}

/**
 * Simple text area to display some preformated non-editable text.
 */
export class TextDisplayArea implements Component<TextDisplayAreaAttrs> {
	view(vnode: Vnode<TextDisplayAreaAttrs>): Children {
		return m(".flex.flex-grow.flex-column.text.pt-16", [
			m(
				"label.text-ellipsis.noselect.z1.i.pr-4",
				{
					style: {
						fontSize: px(font_size.small),
					},
				},
				lang.getTranslationText(vnode.attrs.label),
			),
			m(
				".text-pre.flex-grow",
				{
					style: {
						borderBottom: `1px solid ${theme.outline}`,
						lineHeight: px(font_size.line_height_input),
						minHeight: px(font_size.line_height_input),
					},
					isReadOnly: true,
				},
				vnode.attrs.value,
			),
		])
	}
}
