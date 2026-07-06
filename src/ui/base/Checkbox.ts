import m, { Children, Component, Vnode } from "mithril"
import type { MaybeTranslation } from "../utils/LanguageViewModel"
import { lang } from "../utils/LanguageViewModel"
import type { lazy } from "../../platform-kit/utils"
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
		const attrs = vnode.attrs
		const helpLabelText = lang.getTranslationText(attrs.helpLabel ? attrs.helpLabel : "emptyString_msg")
		const helpLabel = attrs.helpLabel
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
		const userClasses = attrs.class == null ? "" : " " + attrs.class
		return m(
			"",
			{
				"aria-disabled": attrs.disabled != null ? String(attrs.disabled) : undefined,
				class: getOperatingClasses(attrs.disabled, "click flash") + userClasses,
				onclick: (e: MouseEvent) => {
					if (e.target !== this._domInput) {
						this.toggle(e, attrs) // event is bubbling in IE besides we invoke e.stopPropagation()
					}
				},
			},
			m(
				`label.rel${Checkbox.getBreakClass(attrs.label())}`,
				{
					class: `${this.focused ? "content-accent-fg" : "content-fg"} ${getOperatingClasses(attrs.disabled, "click")}`,
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
							onchange: (e: Event) => this.toggle(e, attrs),
							checked: attrs.checked,
							onfocus: () => (this.focused = true),
							onblur: () => (this.focused = false),
							class: getOperatingClasses(attrs.disabled, "click"),
							disabled: attrs.disabled,
						}),
						attrs.label(),
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
