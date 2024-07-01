import m, { Component, Vnode } from "mithril"
import { px, size } from "../size"
import { inputLineHeight } from "./TextField.js"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import type { lazy } from "@tutao/tutanota-utils"

export type LabelAttrs = {
	label: TranslationKey | lazy<string>
}

export class Label implements Component<LabelAttrs> {
	view(vnode: Vnode<LabelAttrs>) {
		return m(".rel.pt", [
			m("label.abs.text-ellipsis.noselect.z1.i.pr-s.small", lang.getMaybeLazy(vnode.attrs.label)),
			m(
				".flex.flex-column.flex-end",
				{
					style: {
						"min-height": px(size.button_height + 2),
					},
				},
				[
					m(
						".mt-form",
						{
							style: {
								lineHeight: px(inputLineHeight),
								"padding-bottom": "2px",
							},
						},
						vnode.children,
					),
				],
			),
		])
	}
}
