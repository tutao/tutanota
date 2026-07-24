import m, { Children, ClassComponent, Component, Vnode, VnodeDOM } from "mithril"
import { LegacyTextFieldType } from "./LegacyTextField.js"
import { AllIcons, Icon, IconSize } from "./Icon.js"
import { px, size } from "../size.js"
import { filterInt } from "@tutao/utils"
import { lang, Translation } from "../utils/LanguageViewModel"

export enum InputMode {
	NONE = "none",
	NUMERIC = "numeric",
	TEXT = "text",
}

export interface SingleLineTextFieldAttrs<T extends LegacyTextFieldType> extends Pick<Component, "oncreate"> {
	value: string | number
	ariaLabel: Translation
	disabled?: boolean
	/**
	 * If false, use error colors to indicate that the input in invalid;
	 * also calls setCustomValidity, to set a custom error message on the DOM Input Element,
	 * and add the :invalid CSS pseudo-class.
	 */
	valid?: boolean
	/**
	 * When valid=false, this value is passed as the argument to setCustomValidity,
	 * to set a custom error message on the DOM Input Element.
	 *
	 * If no message is provided, a default translation of the message, "Invalid input." will be used.
	 *
	 * Some browsers display this message as a tooltip, so you should provide a message where possible,
	 * if `valid` may be false.
	 */
	invalidMessage?: Translation
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

export interface SingleLineNumberFieldAttrs<T extends LegacyTextFieldType> extends SingleLineTextFieldAttrs<T> {
	max?: number
	min?: number
}

export type InputAttrs<T extends LegacyTextFieldType> = T extends LegacyTextFieldType.Number ? SingleLineNumberFieldAttrs<T> : SingleLineTextFieldAttrs<T>

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
export class SingleLineTextField<T extends LegacyTextFieldType> implements ClassComponent<InputAttrs<T>> {
	static readonly DEFAULT_INVALID_MESSAGE = lang.getTranslation("invalidInput_msg")

	domInput!: HTMLInputElement

	view({ attrs }: Vnode<InputAttrs<T>, this>): Children | void | null {
		return attrs.leadingIcon ? this.renderInputWithIcon(attrs) : this.renderInput(attrs)
	}

	private renderInputWithIcon(attrs: InputAttrs<T>) {
		if (!attrs.leadingIcon) {
			return
		}

		const fontSizeString = attrs.style?.fontSize
		const fontSizeNumber = fontSizeString ? filterInt(fontSizeString.replace("px", "")) : 16

		const iconLeftPadding = 12

		let iconSize
		let iconSizeValue
		if (fontSizeNumber > 16 && fontSizeNumber < 32) {
			iconSize = IconSize.PX20
			iconSizeValue = size.icon_20
		} else if (fontSizeNumber > 32) {
			iconSize = IconSize.PX32
			iconSizeValue = size.icon_32
		} else {
			iconSize = IconSize.PX24
			iconSizeValue = size.icon_24
		}

		const iconLeftPaddingAndIconSize = iconLeftPadding + iconSizeValue
		const spacingBetweenIconAndText = size.spacing_16

		return m(".rel.flex.flex-grow", [
			m(
				".abs.flex.items-center",
				{ style: { top: 0, bottom: 0, paddingLeft: px(iconLeftPadding) } },
				m(Icon, {
					size: iconSize,
					icon: attrs.leadingIcon.icon,
					style: { fill: attrs.leadingIcon.color },
				}),
			),
			this.renderInput(attrs, px(iconLeftPaddingAndIconSize + spacingBetweenIconAndText)),
		])
	}

	private updateDomInputValidity(attrs: InputAttrs<T>) {
		let message: string
		if (attrs.valid === true) {
			message = "" // Passing an empty string to setCustomValidity sets the input to valid
		} else if (attrs.valid === false) {
			message = (attrs.invalidMessage ?? SingleLineTextField.DEFAULT_INVALID_MESSAGE).text
		} else {
			return // if `valid` attribute was not passed to component, use the default DOM Input Element's validation
		}

		if (attrs.valid === this.domInput.validity.valid && message === this.domInput.validationMessage) {
			return // The DOM Input Element already has the correct validity: exit early
		}

		this.domInput.setCustomValidity(message)
		this.domInput.reportValidity()
	}

	private renderInput(attrs: InputAttrs<T>, inputPadding?: string) {
		return m("input.tutaui-text-field", {
			ariaLabel: attrs.ariaLabel.text,
			value: attrs.value,
			disabled: attrs.disabled ? true : undefined,
			onblur: attrs.onblur,
			onfocus: attrs.onfocus,
			onkeydown: attrs.onkeydown,
			onclick: attrs.onclick,
			oninput: () => {
				if (attrs.oninput) {
					attrs.oninput(this.domInput.value)
				} else {
					console.error("oninput fired without a handler function")
				}
				this.updateDomInputValidity(attrs)
			},
			oncreate: (vnode: VnodeDOM<InputAttrs<T>>) => {
				this.domInput = vnode.dom as HTMLInputElement
				if (attrs.oncreate) {
					attrs.oncreate(vnode)
				}
				this.updateDomInputValidity(attrs)
			},
			onupdate: (vnode: VnodeDOM<InputAttrs<T>>) => {
				this.domInput = vnode.dom as HTMLInputElement
				this.updateDomInputValidity(attrs)
			},
			placeholder: attrs.placeholder,
			class: this.resolveClasses(attrs.classes, attrs.disabled),
			style: {
				...attrs.style,
				...(inputPadding ? { paddingLeft: inputPadding } : {}),
			},
			type: attrs.inputMode === InputMode.NONE ? undefined : attrs.type,
			inputMode: attrs.inputMode,
			readonly: attrs.readonly,
			"data-testid": `sltfi:${attrs.ariaLabel ? lang.getTestId(attrs.ariaLabel) : null}`,
			...this.getInputProperties(attrs),
		})
	}

	private getInputProperties(attrs: InputAttrs<T>): Pick<SingleLineNumberFieldAttrs<LegacyTextFieldType.Number>, "min" | "max"> | undefined {
		if (attrs.type === LegacyTextFieldType.Number) {
			const numberAttrs = attrs as SingleLineNumberFieldAttrs<LegacyTextFieldType.Number>
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
