import m, {Children, Component, CVnode, Vnode} from "mithril"
import type {TranslationText} from "../../../misc/LanguageViewModel"
import {lang} from "../../../misc/LanguageViewModel"
import {addFlash, removeFlash} from "../Flash"
import {assertNotNull} from "@tutao/tutanota-utils"
import type {clickHandler} from "../GuiUtils"
import {theme} from "../../theme.js"

export interface FolderColumnHeaderButtonAttrs {
	label: TranslationText
	click: clickHandler
}

export class FolderColumnHeaderButton implements Component<FolderColumnHeaderButtonAttrs> {
	private domButton: HTMLElement | null = null
	private attrs: FolderColumnHeaderButtonAttrs

	constructor(vnode: CVnode<FolderColumnHeaderButtonAttrs>) {
		this.attrs = vnode.attrs
	}

	view(vnode: Vnode<FolderColumnHeaderButtonAttrs>): Children {
		this.attrs = vnode.attrs

		return m("button",
			{
				class: "bg-transparent button-height full-width noselect limit-width",
				style: {
					border: `2px solid ${theme.content_accent}`,
					"border-radius": "3px",
				},
				onclick: (event: MouseEvent) => this.attrs.click(event, assertNotNull(this.domButton)),
				title: lang.getMaybeLazy(this.attrs.label),
				oncreate: vnode => this.domButton = vnode.dom as HTMLButtonElement,
			},
			m(
				"",
				{
					// additional wrapper for flex box styling as safari does not support flex box on buttons.
					class: "button-content flex items-center justify-center",
					style: {
						borderColor: theme.content_accent,
					},
					oncreate: vnode => addFlash(vnode.dom),
					onremove: vnode => removeFlash(vnode.dom),
				}, this.renderLabel()
			),
		)
	}

	private renderLabel(): Children {
		return m(
			"",
			{
				class: "text-ellipsis",
				style: {
					color: theme.content_accent,
					"font-weight": "bold",
				},
			},
			lang.getMaybeLazy(this.attrs.label),
		)
	}
}