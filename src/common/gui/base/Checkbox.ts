import m, { Children, Component, Vnode } from "mithril"
import type { MaybeTranslation } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import type { lazy } from "@tutao/tutanota-utils"
import { getOperatingClasses } from "./GuiUtils.js"
import { component_size, px } from "../size"

export type CheckboxAttrs = {
	label: lazy<string | Children>
	checked: boolean
	onChecked: (value: boolean) => unknown
	class?: string
	helpLabel?: MaybeTranslation
	disabled?: boolean
}

export class Checkbox implements Component<CheckboxAttrs> {
	private focused: boolean = false
	private _domInput: HTMLElement | null = null
	private labelLineHeight: number = 0

	view(vnode: Vnode<CheckboxAttrs>): Children {
		const a = vnode.attrs
		const helpLabelText = lang.getTranslationText(a.helpLabel ? a.helpLabel : "emptyString_msg")
		const helpLabel = a.helpLabel
			? m(
					`small.block.content-fg${Checkbox.getBreakClass(helpLabelText)}`,
					{
						style: {
							marginLeft: px(component_size.checkbox_helper_text_margin),
						},
					},
					helpLabelText,
				)
			: []
		const userClasses = a.class == null ? "" : " " + a.class
		return m(
			"",
			{
				"aria-disabled": a.disabled != null ? String(a.disabled) : undefined,
				class: getOperatingClasses(a.disabled, "click flash") + userClasses,
				onclick: (e: MouseEvent) => {
					if (e.target !== this._domInput) {
						this.toggle(e, a) // event is bubbling in IE besides we invoke e.stopPropagation()
					}
				},
			},
			m(
				`label.rel${Checkbox.getBreakClass(a.label())}`,
				{
					class: `${this.focused ? "content-accent-fg" : "content-fg"} ${getOperatingClasses(a.disabled, "click")}`,
				},
				[
					m(".flex.gap-8", [
						m("input.checkbox.list-checkbox", {
							style: {
								transform: "translateY(-50%)",
								top: px(this.labelLineHeight / 2),
							},
							type: "checkbox",
							oncreate: (vnode) => {
								this.labelLineHeight = parseInt(getComputedStyle(vnode.dom as HTMLElement).lineHeight)
								m.redraw()
							},
							onchange: (e: Event) => this.toggle(e, a),
							checked: a.checked,
							onfocus: () => (this.focused = true),
							onblur: () => (this.focused = false),
							class: getOperatingClasses(a.disabled, "click"),
							disabled: a.disabled,
						}),
						a.label(),
					]),
					m(
						"span",
						{
							oncreate: (vnode) => (this._domInput = vnode.dom as HTMLElement),
						},
						helpLabel,
					),
				],
			),
		)
	}

	private static getBreakClass(text: string | Children): string {
		if (typeof text !== "string" || text.includes(" ")) {
			return ".break-word"
		} else {
			return ".break-all"
		}
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
