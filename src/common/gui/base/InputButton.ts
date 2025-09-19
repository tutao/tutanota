import m, { ClassComponent, Component, Vnode } from "mithril"
import { theme } from "../theme.js"
import { SingleLineTextField } from "./SingleLineTextField.js"
import { px, size } from "../size.js"
import { TextFieldType } from "./TextField.js"
import { TabIndex } from "../../api/common/TutanotaConstants.js"

export enum InputButtonVariant {
	OUTLINE = "outline",
}

export interface InputButtonAttributes extends Pick<Component, "oncreate"> {
	inputValue: string
	display: string
	ariaLabel: string
	disabled?: boolean
	classes?: Array<string>
	variant?: InputButtonVariant
	containerStyle?: Partial<CSSStyleDeclaration>
	displayStyle?: Partial<CSSStyleDeclaration>
	onclick?: (event: MouseEvent) => unknown
	oninput: (newValue: string) => unknown
	onblur?: (...args: unknown[]) => unknown
	onfocus?: (...args: unknown[]) => unknown
	onkeydown?: (...args: unknown[]) => unknown
	type?: TextFieldType
	tabIndex?: number
}

/**
 * A button with an input that can be activated when clicked or focused
 * @see Component attributes: {InputButtonAttributes}
 * @example
 * m(InputButton, {
 *   ariaLabel: lang.get("dateFrom_label")
 *   inputValue: this.value,
 * 	 oninput: (newValue) => (model.value = newValue),
 * 	 display: lang.get("placeholder"),
 * 	 variant: InputButtonVariant.OUTLINE,
 * 	 onclick: console.log,
 * 	 disabled: false,
 *   displayStyle: {
 *     color: "blue"
 *   }
 * }),
 */
export class InputButton implements ClassComponent<InputButtonAttributes> {
	private isFocused: boolean = false
	private inputDOM?: HTMLInputElement
	private buttonDOM?: HTMLButtonElement

	view({ attrs }: Vnode<InputButtonAttributes, this>) {
		return m(
			"button",
			{
				title: attrs.ariaLabel,
				"aria-live": "off", // Button contents and label will be handled by the input field
				class: this.resolveContainerClasses(attrs.variant, attrs.classes, attrs.disabled),
				tabIndex: attrs.tabIndex,
				style: {
					borderColor: theme.outline,
					padding: 0,
					...attrs.containerStyle,
				},
				oncreate: (vnode) => {
					this.buttonDOM = vnode.dom as HTMLButtonElement
				},
				onclick: (event: MouseEvent) => {
					this.isFocused = true
					if (this.inputDOM) {
						this.inputDOM.style.display = "block"
						this.inputDOM.click()
					}

					attrs.onclick?.(event)
				},
				onfocus: () => {
					this.isFocused = true
					if (this.inputDOM) {
						this.inputDOM.style.display = "block"
						if (this.buttonDOM) {
							this.buttonDOM.tabIndex = Number(TabIndex.Programmatic)
						}
						this.inputDOM.focus()
					}
				},
				disabled: attrs.disabled ? true : undefined,
			},
			[
				m.fragment({}, [
					m(SingleLineTextField, {
						ariaLabel: attrs.ariaLabel,
						onblur: () => {
							this.isFocused = false
							this.inputDOM!.style.display = "none"
							if (this.buttonDOM) {
								this.buttonDOM.tabIndex = Number(attrs.tabIndex ?? TabIndex.Default)
							}
							attrs.onblur?.()
						},
						oncreate: (vnode) => {
							this.inputDOM = vnode.dom as HTMLInputElement
							this.inputDOM.style.display = "none"

							attrs.oncreate?.(vnode)
						},
						disabled: attrs.disabled ? true : undefined,
						value: attrs.inputValue,
						oninput: attrs.oninput,
						onkeydown: attrs.onkeydown,
						onfocus: attrs.onfocus,
						classes: this.resolveInputClasses(attrs.variant),
						style: {
							padding: `${px(size.spacing_8)} 0`,
						},
						type: TextFieldType.Text,
					}),
				]),
				m(
					"span.tutaui-text-field",
					{
						style: {
							display: this.isFocused ? "none" : "block",
							padding: `${px(size.spacing_8)} 0`,
							...attrs.displayStyle,
						},
					},
					attrs.display,
				),
			],
		)
	}

	private resolveInputClasses(variant?: InputButtonVariant) {
		const resolvedClasses = ["text-center", "noselect"]
		if (variant === InputButtonVariant.OUTLINE && this.isFocused) {
			resolvedClasses.push("tutaui-button-outline", "border-content-message-bg")
		}

		return resolvedClasses
	}

	private resolveContainerClasses(variant: InputButtonVariant = InputButtonVariant.OUTLINE, classes: Array<string> = [], disabled: boolean = false) {
		const resolvedClasses = [...classes, "full-width"]

		if (disabled) resolvedClasses.push("disabled", "click-disabled")
		if (variant === InputButtonVariant.OUTLINE && !this.isFocused) {
			resolvedClasses.push("tutaui-button-outline")
		}

		return resolvedClasses.join(" ")
	}
}
