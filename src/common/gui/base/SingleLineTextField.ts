import m, { Children, ClassComponent, Component, Vnode, VnodeDOM } from "mithril"
import type { TextFieldType } from "./TextField.js"
import { AllIcons, Icon, IconSize } from "./Icon.js"
import { px, size } from "../size.js"

export interface SingleLineTextFieldAttrs extends Pick<Component, "oncreate"> {
	value: string | number
	ariaLabel: string
	disabled?: boolean
	/**
	 * Callback fired whenever the input is interacted with.
	 * This property is mandatory if the input is interactive (disabled = false).
	 * @example
	 * // Save the typed value to a model object
	 * const callback = (typedValue: string) => model.value = typedValue;
	 * m(SingleLineTextField, {oninput: callback})
	 * @param {string} newValue - String value typed on the input field
	 * @returns {unknown} Return type depends on the callback provided
	 */
	oninput?: (newValue: string | number) => unknown
	placeholder?: string
	classes?: Array<string>
	style?: Partial<Pick<CSSStyleDeclaration, "padding" | "fontSize" | "textAlign">>
	onclick?: (...args: unknown[]) => unknown
	onfocus?: (...args: unknown[]) => unknown
	onblur?: (...args: unknown[]) => unknown
	onkeydown?: (...args: unknown[]) => unknown
	type?: TextFieldType
	leadingIcon?: {
		icon: AllIcons
		color: string
	}
}

type HTMLElementWithAttrs = Partial<Pick<m.Attributes, "class"> & Omit<HTMLElement, "style"> & SingleLineTextFieldAttrs>

/**
 * Simple single line input field component
 * @see Component attributes: {SingleLineTextFieldAttrs}
 * @example
 * m(SingleLineTextField, {
 *     value: model.value,
 *     ariaLabel: lange.get("placeholder"),
 *     oninput: (newValue: string) => {
 *         model.value = newValue
 *     },
 *     placeholder: lang.get("placeholder"),
 *     disabled: model.isReadonly,
 *     classes: ["custom-text-color"], // Adding new styles
 *     style: {
 *         "font-size": px(size.font_size_base * 1.25) // Overriding the component style
 *     }
 * }),
 */
export class SingleLineTextField implements ClassComponent<SingleLineTextFieldAttrs> {
	domInput!: HTMLInputElement

	oncreate(vnode: VnodeDOM<SingleLineTextFieldAttrs>): any {
		this.domInput = vnode.dom as HTMLInputElement

		if (vnode.attrs.oncreate) {
			vnode.attrs.oncreate(vnode)
		}
	}

	view({ attrs }: Vnode<SingleLineTextFieldAttrs, this>): Children | void | null {
		return attrs.leadingIcon ? this.renderInputWithIcon(attrs) : this.renderInput(attrs)
	}

	private renderInputWithIcon(attrs: SingleLineTextFieldAttrs) {
		if (!attrs.leadingIcon) {
			return
		}

		const fontSize = Number(attrs.style?.fontSize?.replace("px", "")) ?? 16
		let iconSize
		let padding

		if (fontSize > 16 && fontSize < 32) {
			iconSize = IconSize.Large
			padding = size.icon_size_large
		} else if (fontSize > 32) {
			iconSize = IconSize.XL
			padding = size.icon_size_xl
		} else {
			iconSize = IconSize.Medium
			padding = size.icon_size_medium_large
		}

		return m(".rel.flex.flex-grow", [
			m(
				".abs.pl-vpad-s.flex.items-center",
				{ style: { top: 0, bottom: 0 } },
				m(Icon, {
					size: iconSize,
					icon: attrs.leadingIcon.icon,
					style: { fill: attrs.leadingIcon.color },
				}),
			),
			this.renderInput(attrs, px(padding + size.vpad)),
		])
	}

	private renderInput(attrs: SingleLineTextFieldAttrs, inputPadding?: string) {
		return m("input.tutaui-text-field", {
			type: attrs.type,
			ariaLabel: attrs.ariaLabel,
			value: attrs.value,
			disabled: attrs.disabled ?? false,
			onblur: attrs.onblur,
			onfocus: attrs.onfocus,
			onkeydown: attrs.onkeydown,
			onclick: attrs.onclick,
			oninput: () => {
				if (!attrs.oninput) {
					console.error("oninput fired without a handler function")
					return
				}
				attrs.oninput(this.domInput.value)
			},
			placeholder: attrs.placeholder,
			class: this.resolveClasses(attrs.classes, attrs.disabled),
			style: {
				...(inputPadding ? { paddingLeft: inputPadding } : {}),
				...attrs.style,
			},
		} satisfies HTMLElementWithAttrs)
	}

	private resolveClasses(classes: Array<string> = [], disabled: boolean = false): string {
		const classList = [...classes]
		if (disabled) {
			classList.push("disabled")
		}

		return classList.join(" ")
	}
}
