// @flow
import m from 'mithril'
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {theme} from "../theme"
import {inputLineHeight, px, size} from "../size"

export type TextDisplayAreaAttrs = {
	value: string,
	label: TranslationKey | lazy<string>
}

/**
 * Simple text area to display some preformated non-editable text.
 */
export class TextDisplayArea implements MComponent<TextDisplayAreaAttrs> {
	view(vnode: Vnode<TextDisplayAreaAttrs>): Children {
		return m(".flex.flex-grow.flex-column.text.pt", [
			m("label.text-ellipsis.noselect.backface_fix.z1.i.pr-s", {
					style: {
						fontSize: px(size.font_size_small),
					}
				},
				lang.getMaybeLazy(vnode.attrs.label)
			),
			m(".white-space-pre.flex-grow", {
				style: {
					borderBottom: `1px solid ${theme.content_border}`,
					lineHeight: px(inputLineHeight),
					minHeight: px(inputLineHeight)
				},
				disabled: true,
			}, vnode.attrs.value),
		])
	}
}