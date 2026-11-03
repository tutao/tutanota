import m, { ClassComponent, Component, Vnode } from "mithril"
import { theme } from "../theme.js"
import { SingleLineTextField, SingleLineTextFieldAttrs } from "./SingleLineTextField.js"
import { rem, font_size, px, size } from "../size.js"
import { LegacyTextFieldType } from "./LegacyTextField.js"
import { Translation } from "../utils/LanguageViewModel"

export interface InputButtonAttrs {
	inputValue: string
	display: string
	ariaLabel: Translation
	disabled?: boolean
	classes?: Array<string>
	containerStyle?: Partial<CSSStyleDeclaration>
	displayStyle?: Partial<CSSStyleDeclaration>

	// onActivate
	// activate
	// onDeactivate
	// deactivate
	// inputEvents: { onblur, onfocus, onkeydown } ? Unnecessary if events bubble then we can listen to button?
	// Only called once ALL elements are valid and correct? TODO: What about Mithril reconciliation? Update ref?
	// UGH. DUDE. querySelector(`[ref=${name}]`) is easier? Fresh search every time. Easy.
	// innerDOM?: (elements: { buttonEl: HTMLButtonElement, inputEl: HTMLInputElement, spanEl: HTMLSpanElement }) => void,

	oncreateButton?: (vnode: { dom: HTMLButtonElement }) => void
	oncreateInput?: (vnode: { dom: HTMLInputElement }) => void

	onclick?: (e: MouseEvent) => void
	oninput: (e: InputEvent) => void
	onblur?: (e: FocusEvent) => void
	onfocus?: (e: FocusEvent) => void
	onkeydown?: (e: KeyboardEvent) => void
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
export class InputButton implements ClassComponent<InputButtonAttrs> {
	private isFocused: boolean = false
	private inputDOM?: HTMLInputElement
	private buttonDOM?: HTMLButtonElement

	view({ attrs }: Vnode<InputButtonAttrs, this>) {
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
					attrs.oncreateButton?.(vnode as typeof vnode & { dom: HTMLButtonElement })
				},
				onclick: (e: MouseEvent) => {
					this.isFocused = true
					if (this.inputDOM) {
						this.inputDOM.style.display = "block"
						this.inputDOM.click()
					}
					attrs.onclick?.(e)
				},
				onfocus: (e: FocusEvent) => {
					this.isFocused = true
					if (this.inputDOM) {
						this.inputDOM.style.display = "block"
						if (this.buttonDOM) {
							this.buttonDOM.tabIndex = -1
						}
						this.inputDOM.focus()
					}
				},
				disabled: attrs.disabled ? true : undefined,
			},
			[
				// @ts-ignore We use `onxyz: (...args: unknown[]) => unknown` thru our app which TS doesn't like
				m(SingleLineTextField, {
					ariaLabel: attrs.ariaLabel,
					onblur: (e: FocusEvent) => {
						this.isFocused = false
						this.inputDOM!.style.display = "none"
						if (this.buttonDOM) {
							this.buttonDOM.tabIndex = Number(attrs.tabIndex ?? 0)
						}
						attrs.onblur?.(e)
					},
					oncreate: (vnode) => {
						this.inputDOM = vnode.dom as HTMLInputElement
						this.inputDOM.style.display = "none"

						// TODO(gg): I don't like this but I need to focus on the button (parent) to trigger their
						// onfocus call, and I don't want to do previousElementSibling hacks...? What's a girl to do.
						attrs.oncreateInput?.(vnode as typeof vnode & { dom: HTMLInputElement })
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
		// prettier-ignore Disrespectful.
		return ["text-center", "noselect", this.isFocused && "tutaui-button-outline", this.isFocused && "border-content-message-bg"].filter(
			<T>(x: T | false): x is T => !!x,
		)
	}

	private resolveContainerClasses(classes: string[] = [], disabled = false) {
		// prettier-ignore Disrespectful.
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