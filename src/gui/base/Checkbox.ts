import m, { Children, Component, Vnode } from "mithril"
import { BootIcons, BootIconsSvg } from "./icons/BootIcons"
import { addFlash, removeFlash } from "./Flash"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import type { lazy } from "@tutao/tutanota-utils"
import { theme } from "../theme.js"
import { px } from "../size.js"
import { encodeSVG } from "./GuiUtils.js"

export type CheckboxAttrs = {
	label: lazy<string | Children>
	checked: boolean
	onChecked: (value: boolean) => unknown
	helpLabel?: TranslationKey | lazy<string>
	disabled?: boolean
}

export class Checkbox implements Component<CheckboxAttrs> {
	private focused: boolean = false
	private _domInput: HTMLElement | null = null

	view(vnode: Vnode<CheckboxAttrs>): Children {
		const a = vnode.attrs
		const helpLabel = a.helpLabel ? m("small.block.content-fg.break-word", lang.getMaybeLazy(a.helpLabel)) : []
		return m(
			`${a.disabled ? ".disabled.click-disabled" : ".click"}.pt`,
			{
				role: "checkbox",
				"aria-checked": String(a.checked),
				"aria-disabled": String(a.disabled),
				oncreate: (vnode) => {
					if (!a.disabled) addFlash(vnode.dom)
				},
				onremove: (vnode) => {
					if (!a.disabled) removeFlash(vnode.dom)
				},
				onclick: (e: MouseEvent) => {
					if (e.target !== this._domInput) {
						this.toggle(e, a) // event is bubbling in IE besides we invoke e.stopPropagation()
					}
				},
			},
			m(
				"label.break-all",
				{
					class: this.focused ? "content-accent-fg" : "content-fg",
					onclick: (e: MouseEvent) => {
						// if the label contains a link, then stop the event so that the checkbox doesn't get toggled upon clicking
						// we still allow it to be checked if they click on the non-link part of the label
						if (e.target instanceof HTMLElement && e.target.tagName.toUpperCase() === "A") {
							e.stopPropagation()
						}
					},
				},
				[
					m("input[type=checkbox].icon", {
						oncreate: (vnode) => (this._domInput = vnode.dom as HTMLElement),
						onchange: (e: Event) => this.toggle(e, a),
						checked: a.checked,
						onfocus: () => (this.focused = true),
						onblur: () => (this.focused = false),
						style: {
							appearance: "none",
							cursor: a.disabled ? "default" : "pointer",
							font: "inherit",
							"background-color": theme.content_accent,
							"mask-image": `url("${Checkbox.getIcon(a.checked)}")`,
							margin: px(0),
							"margin-right": px(5),
							position: "relative",
							bottom: px(-2),
						},
						disabled: a.disabled,
					}),
					a.label(),
					helpLabel,
				],
			),
		)
	}

	private static getIcon(checked: boolean): string {
		const rawIcon: BootIcons = checked ? BootIcons.CheckboxSelected : BootIcons.Checkbox
		return encodeSVG(BootIconsSvg[rawIcon])
	}

	toggle(event: Event, attrs: CheckboxAttrs) {
		if (!attrs.disabled) {
			attrs.onChecked(!attrs.checked)
		}

		event.stopPropagation()

		if (this._domInput) {
			this._domInput.focus()
		}
	}
}
