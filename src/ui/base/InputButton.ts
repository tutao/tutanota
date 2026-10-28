import m, { ClassComponent, Component, Vnode } from "mithril"
import { theme } from "../theme.js"
import { SingleLineTextField } from "./SingleLineTextField.js"
import { font_size, px, size } from "../size.js"
import { LegacyTextFieldType } from "./LegacyTextField.js"
import { TabIndex } from "@tutao/app-env"
import { Translation } from "../utils/LanguageViewModel"

// TODO(gg): "Attributes" vs "Attrs" and drop `extends Pick<...>` it causes `VnodeDOM<{}, _NoLifecycle<Component, {}>>`
export interface InputButtonAttributes extends Pick<Component, "oncreate"> {
	inputValue: string
	display: string
	ariaLabel: Translation
	disabled?: boolean
	classes?: Array<string>
	containerStyle?: Partial<CSSStyleDeclaration>
	displayStyle?: Partial<CSSStyleDeclaration>
	onclick?: (event: MouseEvent) => unknown
	// TODO: Misleading. Looks like Mithril's oninput but does not call with arguments fn(ev.target, ev)
	oninput: (newValue: string) => unknown
	onblur?: (...args: unknown[]) => unknown
	onfocus?: (...args: unknown[]) => unknown
	onkeydown?: (...args: unknown[]) => unknown
	type?: LegacyTextFieldType
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
				title: attrs.ariaLabel.text,
				"aria-live": "off", // Button contents and label will be handled by the input field
				class: this.resolveContainerClasses(attrs.classes, attrs.disabled).join(" "),
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
					classes: this.resolveInputClasses(),
					style: {
						padding: `${px(size.spacing_8)} 0`,
					},
					type: LegacyTextFieldType.Text,
				}),
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

	private resolveInputClasses() {
		return ["text-center", "noselect", this.isFocused && "tutaui-button-outline", this.isFocused && "border-content-message-bg"].filter(
			<T>(x: T | false): x is T => !!x,
		)
	}

	private resolveContainerClasses(classes: string[] = [], disabled = false) {
		return [...classes, "full-width", disabled && "disabled", disabled && "click-disabled", !this.isFocused && "tutaui-button-outline"].filter(
			<T>(x: T | false): x is T => !!x,
		)
	}
}

// TODO(gg): Sorry for leaving this here, unsure why https://stackoverflow.com/q/47632622#comment93284037_47636222 isn't
// working, else then I'd make it an official util
// .filter(<T>(x?: T): x is T => !!x) No
// .filter(<T>(x: T | false): x is T => !!x) Yes
// .filter((x => !!x) as ExcludesFalse) Yes, but needs typedef:
// type ExcludesFalse = <T>(x: T | false) => x is T
