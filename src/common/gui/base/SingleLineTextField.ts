import m, { Children, ClassComponent, Component, Vnode, VnodeDOM } from "mithril"
import { TextFieldType } from "./TextField.js"
import { AllIcons, Icon, IconSize } from "./Icon.js"
import { px, size } from "../size.js"
import { filterInt } from "@tutao/tutanota-utils"

export enum InputMode {
	NONE = "none",
	NUMERIC = "numeric",
	TEXT = "text",
}

export interface SingleLineTextFieldAttrs<T extends TextFieldType> extends Pick<Component, "oncreate"> {
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
	oninput?: (newValue: string) => unknown
	placeholder?: string
	classes?: Array<string>
	style?: Partial<Pick<CSSStyleDeclaration, "padding" | "fontSize" | "textAlign">>
	onclick?: (...args: unknown[]) => unknown
	onfocus?: (...args: unknown[]) => unknown
	onblur?: (...args: unknown[]) => unknown
	onkeydown?: (...args: unknown[]) => unknown
	type: T
	leadingIcon?: {
		icon: AllIcons
		color: string
	}
	inputMode?: InputMode
	readonly?: boolean
}

export interface SingleLineNumberFieldAttrs<T extends TextFieldType> extends SingleLineTextFieldAttrs<T> {
	max?: number
	min?: number
}

export type InputAttrs<T extends TextFieldType> = T extends TextFieldType.Number ? SingleLineNumberFieldAttrs<T> : SingleLineTextFieldAttrs<T>

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
 *         "font-size": px(font_size.base * 1.25) // Overriding the component style
 *     }
 * }),
 */
export class SingleLineTextField<T extends TextFieldType> implements ClassComponent<InputAttrs<T>> {
	domInput!: HTMLInputElement

	view({ attrs }: Vnode<InputAttrs<T>, this>): Children | void | null {
		return attrs.leadingIcon ? this.renderInputWithIcon(attrs) : this.renderInput(attrs)
	}

	private renderInputWithIcon(attrs: InputAttrs<T>) {
		if (!attrs.leadingIcon) {
			return
		}

		const fontSizeString = attrs.style?.fontSize
		const fontSizeNumber = fontSizeString ? filterInt(fontSizeString.replace("px", "")) : NaN
		const fontSize = isNaN(fontSizeNumber) ? 16 : fontSizeNumber
		let iconSize
		let padding

		if (fontSize > 16 && fontSize < 32) {
			iconSize = IconSize.PX20
			padding = size.icon_24
		} else if (fontSize > 32) {
			iconSize = IconSize.PX32
			padding = size.icon_32
		} else {
			iconSize = IconSize.PX24
			padding = 20
		}

		return m(".rel.flex.flex-grow", [
			m(
				".abs.pl-8.flex.items-center",
				{ style: { top: 0, bottom: 0 } },
				m(Icon, {
					size: iconSize,
					icon: attrs.leadingIcon.icon,
					style: { fill: attrs.leadingIcon.color },
				}),
			),
			this.renderInput(attrs, px(padding + size.spacing_16)),
		])
	}

	private renderInput(attrs: InputAttrs<T>, inputPadding?: string) {
		return m("input.tutaui-text-field", {
			ariaLabel: attrs.ariaLabel,
			value: attrs.value,
			disabled: attrs.disabled ? true : undefined,
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
			oncreate: (vnode: VnodeDOM<InputAttrs<T>>) => {
				this.domInput = vnode.dom as HTMLInputElement
				if (attrs.oncreate) {
					attrs.oncreate(vnode)
				}
			},
			placeholder: attrs.placeholder,
			class: this.resolveClasses(attrs.classes, attrs.disabled),
			style: {
				...(inputPadding ? { paddingLeft: inputPadding } : {}),
				...attrs.style,
			},
			type: attrs.inputMode === InputMode.NONE ? undefined : attrs.type,
			inputMode: attrs.inputMode,
			readonly: attrs.readonly,
			...this.getInputProperties(attrs),
		})
	}

	private getInputProperties(attrs: InputAttrs<T>): Pick<SingleLineNumberFieldAttrs<TextFieldType.Number>, "min" | "max"> | undefined {
		if (attrs.type === TextFieldType.Number) {
			const numberAttrs = attrs as SingleLineNumberFieldAttrs<TextFieldType.Number>
			return { min: numberAttrs.min, max: numberAttrs.max }
		}

		return undefined
	}

	private resolveClasses(classes: Array<string> = [], disabled: boolean = false): string {
		const classList = [...classes]
		if (disabled) {
			classList.push("disabled")
		}

		return classList.join(" ")
	}
}
