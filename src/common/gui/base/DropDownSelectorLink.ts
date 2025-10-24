import m, { Children, Vnode, VnodeDOM } from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import { getOperatingClasses } from "./GuiUtils"
import { DropDownSelector, DropDownSelectorAttrs } from "./DropDownSelector"

export class DropDownSelectorLink<T> extends DropDownSelector<T> {
	private triggerEl: HTMLElement | null = null

	view(vnode: Vnode<DropDownSelectorAttrs<T>>): Children {
		const a = vnode.attrs
		const text = this.valueToText(a, a.selectedValue) || ""
		const labelText = lang.getTranslationText(a.label)

		const open = this.createDropdown(a)
		return m(
			"span",
			{
				class: (a.class ? a.class + " " : "") + getOperatingClasses(a.disabled),
				style: a.style,
			},
			[
				m("span", labelText + ": "),
				m(
					"button",
					{
						type: "button",
						class: "underline click",
						disabled: a.disabled,
						oncreate: (vn: VnodeDOM) => {
							this.triggerEl = vn.dom as HTMLButtonElement
						},
						onremove: () => {
							this.triggerEl = null
						},
						onclick: (e: MouseEvent) => {
							if (a.disabled || !this.triggerEl) return
							open(e, this.triggerEl)
						},
					},
					text,
				),
			],
		)
	}
}
