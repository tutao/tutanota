import m, { Children, Component, Vnode } from "mithril"
import type { MaybeTranslation } from "../utils/LanguageViewModel"
import { lang } from "../utils/LanguageViewModel"
import { theme } from "../theme"
import { rem, font_size, px } from "../size"

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
						fontSize: rem(font_size.small_em),
					},
				},
				lang.getTranslationText(vnode.attrs.label),
			),
			m(
				".text-pre.flex-grow",
				{
					style: {
						borderBottom: `1px solid ${theme.outline}`,
						lineHeight: rem(font_size.line_height_input_em),
						minHeight: px(font_size.line_height_input),
					},
					isReadOnly: true,
				},
				vnode.attrs.value,
			),
		])
	}
}
