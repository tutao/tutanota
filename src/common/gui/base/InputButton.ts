import m, { ClassComponent, Component, Vnode, VnodeDOM } from "mithril"
import { theme } from "../theme.js"
import { SingleLineTextField, SingleLineTextFieldAttrs } from "./SingleLineTextField.js"

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
	displayStyle?: CSSStyleDeclaration
	onclick?: (event: MouseEvent) => unknown
	oninput: (newValue: string) => unknown
	onblur?: (...args: unknown[]) => unknown
	onfocus?: (...args: unknown[]) => unknown
	onkeydown?: (...args: unknown[]) => unknown
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
	private inputDOM: HTMLElement | null = null

	view({ attrs }: Vnode<InputButtonAttributes, this>) {
		return m(
			"button",
			{
				title: attrs.ariaLabel,
				"aria-live": "off", // Button contents and label will be handled by the input field
				class: this.resolveContainerClasses(attrs.variant, attrs.classes, attrs.disabled),
				style: {
					borderColor: theme.content_message_bg,
					padding: 0,
				},
				onclick: (event: MouseEvent) => {
					this.isFocused = true
					if (this.inputDOM) {
						this.inputDOM.style.display = "block"
						this.inputDOM.focus()
					}

					attrs.onclick?.(event)
				},
				onfocus: () => {
					this.isFocused = true
					if (this.inputDOM) {
						this.inputDOM.style.display = "block"
						this.inputDOM.focus()
					}
				},
				disabled: attrs.disabled,
			},
			[
				m.fragment({}, [
					m(SingleLineTextField, {
						ariaLabel: attrs.ariaLabel,
						onblur: () => {
							this.isFocused = false
							this.inputDOM!.style.display = "none"

							attrs.onblur?.()
						},
						oncreate: (vnode: VnodeDOM<SingleLineTextFieldAttrs>) => {
							this.inputDOM = vnode.dom as HTMLElement
							this.inputDOM.style.display = "none"

							attrs.oncreate?.(vnode)
						},
						disabled: attrs.disabled,
						value: attrs.inputValue,
						oninput: attrs.oninput,
						onkeydown: attrs.onkeydown,
						onfocus: attrs.onfocus,
					} satisfies SingleLineTextFieldAttrs & Omit<Component, "view">),
				]),
				m("span.tutaui-text-field", { style: { display: this.isFocused ? "none" : "block", ...attrs.displayStyle } }, attrs.display),
			],
		)
	}

	private resolveContainerClasses(variant: InputButtonVariant = InputButtonVariant.OUTLINE, classes: Array<string> = [], disabled: boolean = false) {
		const resolvedClasses = [...classes, "full-width"]

		if (disabled) resolvedClasses.push("disabled", "click-disabled")
		if (variant === InputButtonVariant.OUTLINE) {
			resolvedClasses.push("tutaui-button-outline")
		}

		return resolvedClasses.join(" ")
	}
}
