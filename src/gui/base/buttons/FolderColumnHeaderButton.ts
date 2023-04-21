import m, { Children, Component, Vnode } from "mithril"
import type { TranslationText } from "../../../misc/LanguageViewModel"
import { lang } from "../../../misc/LanguageViewModel"
import { addFlash, removeFlash } from "../Flash"
import { assertNotNull } from "@tutao/tutanota-utils"
import type { clickHandler } from "../GuiUtils"
import { theme } from "../../theme.js"
import { px, size } from "../../size.js"

export interface FolderColumnHeaderButtonAttrs {
	label: TranslationText
	click: clickHandler
}

export class FolderColumnHeaderButton implements Component<FolderColumnHeaderButtonAttrs> {
	private domButton: HTMLElement | null = null

	view({ attrs }: Vnode<FolderColumnHeaderButtonAttrs>): Children {
		return m(
			"button",
			{
				class: "bg-transparent full-width noselect limit-width border-radius-big",
				style: {
					border: `2px solid ${theme.content_accent}`,
					// matching toolbar
					height: px(size.button_height + size.vpad_xs * 2),
				},
				onclick: (event: MouseEvent) => attrs.click(event, assertNotNull(this.domButton)),
				title: lang.getMaybeLazy(attrs.label),
				oncreate: (vnode) => (this.domButton = vnode.dom as HTMLButtonElement),
			},
			m(
				"",
				{
					// additional wrapper for flex box styling as safari does not support flex box on buttons.
					class: "button-content flex items-center justify-center",
					style: {
						borderColor: theme.content_accent,
					},
					oncreate: (vnode) => addFlash(vnode.dom),
					onremove: (vnode) => removeFlash(vnode.dom),
				},
				this.renderLabel(attrs),
			),
		)
	}

	private renderLabel(attrs: FolderColumnHeaderButtonAttrs): Children {
		return m(
			"",
			{
				class: "text-ellipsis",
				style: {
					color: theme.content_accent,
					"font-weight": "bold",
				},
			},
			lang.getMaybeLazy(attrs.label),
		)
	}
}
