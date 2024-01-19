import m, { Children, Component, Vnode } from "mithril"
import { BootIcons, BootIconsSvg } from "./icons/BootIcons"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import type { lazy } from "@tutao/tutanota-utils"
import { theme } from "../theme.js"
import { encodeSVG, getOperatingClasses } from "./GuiUtils.js"

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
	private static readonly checkedIcon = encodeSVG(BootIconsSvg[BootIcons.CheckboxSelected])
	private static readonly uncheckedIcon = encodeSVG(BootIconsSvg[BootIcons.Checkbox])

	view(vnode: Vnode<CheckboxAttrs>): Children {
		const a = vnode.attrs
		const helpLabelText = a.helpLabel ? lang.getMaybeLazy(a.helpLabel) : ""
		const helpLabel = a.helpLabel ? m(`small.block.content-fg${Checkbox.getBreakClass(helpLabelText)}`, helpLabelText) : []
		return m(
			`.pt`,
			{
				role: "checkbox",
				"aria-checked": String(a.checked),
				"aria-disabled": String(a.disabled),
				class: getOperatingClasses(a.disabled, "click flash"),
				onclick: (e: MouseEvent) => {
					if (e.target !== this._domInput) {
						this.toggle(e, a) // event is bubbling in IE besides we invoke e.stopPropagation()
					}
				},
			},
			m(
				`label${Checkbox.getBreakClass(a.label())}`,
				{
					class: `${this.focused ? "content-accent-fg" : "content-fg"} ${getOperatingClasses(a.disabled, "click")}`,
					onclick: (e: MouseEvent) => {
						// if the label contains a link, then stop the event so that the checkbox doesn't get toggled upon clicking
						// we still allow it to be checked if they click on the non-link part of the label
						if (e.target instanceof HTMLElement && e.target.tagName.toUpperCase() === "A") {
							e.stopPropagation()
						}
					},
				},
				[
					m("input[type=checkbox].icon.checkbox-override", {
						oncreate: (vnode) => (this._domInput = vnode.dom as HTMLElement),
						onchange: (e: Event) => this.toggle(e, a),
						checked: a.checked,
						onfocus: () => (this.focused = true),
						onblur: () => (this.focused = false),
						class: getOperatingClasses(a.disabled, "click"),
						style: {
							cursor: a.disabled ? "default" : "pointer",
							"background-color": theme.content_accent,
							"mask-image": `url("${a.checked ? Checkbox.checkedIcon : Checkbox.uncheckedIcon}")`,
						},
						disabled: a.disabled,
					}),
					a.label(),
					helpLabel,
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
