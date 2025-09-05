import m, { Children, ClassComponent, Vnode, VnodeDOM } from "mithril"
import { isLightTheme, theme } from "../theme.js"

type TextAreaVariant = "normal" | "outlined"

export interface TextAreaAttrs {
	value: string
	ariaLabel: string
	maxLines?: number
	resizable?: boolean
	disabled?: boolean
	/**
	 * Callback fired whenever the textarea is interacted with.
	 * This property is mandatory if the textarea is interactive (disabled = false).
	 * @example
	 * // Saves the typed value to a model object
	 * const callback = (typedValue: string) => model.value = typedValue;
	 * m(TextArea, {oninput: callback.bind(this)})
	 * @param {string} newValue - String value typed on the textarea field
	 * @returns {unknown} Return type depends on the callback provided
	 */
	oninput?: (newValue: string) => unknown
	oncreate?: (node: VnodeDOM<TextAreaAttrs>) => unknown
	placeholder?: string
	classes?: Array<string>
	style?: Partial<Pick<CSSStyleDeclaration, "padding" | "fontSize" | "borderColor" | "transition" | "height">>
	variant?: TextAreaVariant
	maxLength?: number
}

type HTMLElementWithAttrs = Partial<
	Pick<m.Attributes, "class"> &
		Omit<HTMLTextAreaElement, "style"> &
		TextAreaAttrs & {
			style: { resize: string; transition?: string }
		}
>

/**
 * Simple single line input field component
 * @see Component attributes: {TextAreaAttrs}
 * @example
 * m(TextArea, {
 *     value: model.value,
 *     oninput: (newValue: string) => {
 *         model.value = newValue
 *     },
 *     placeholder: "placeholder",
 *     disabled: model.isReadonly,
 *     classes: ["custom-font-size"], // Adding new styles
 *     style: {
 *         "font-size": px(font_size.base * 1.25) // Overriding the component style
 *     }
 * }),
 */
export class TextArea implements ClassComponent<TextAreaAttrs> {
	domInput!: HTMLInputElement

	oncreate(vnode: VnodeDOM<TextAreaAttrs, this>): any {
		this.domInput = vnode.dom as HTMLInputElement
	}

	view({ attrs }: Vnode<TextAreaAttrs, this>): Children | void | null {
		return m("textarea.tutaui-text-field", {
			value: attrs.value,
			ariaLabel: attrs.ariaLabel,
			rows: attrs.maxLines ?? 3,
			disabled: attrs.disabled ?? false,
			maxLength: attrs.maxLength,
			oncreate: (node: VnodeDOM<TextAreaAttrs>) => {
				if (!attrs.oncreate) {
					return
				}
				attrs.oncreate?.(node)
			},
			oninput: () => {
				if (!attrs.oninput) {
					console.error("oninput fired without a handler function")
					return
				}
				attrs.oninput(this.domInput.value)
			},
			placeholder: attrs.placeholder,
			class: this.resolveClasses(attrs.classes, attrs.disabled),
			style: this.resolveStyles(attrs.style, attrs.resizable, attrs.variant),
		} satisfies HTMLElementWithAttrs)
	}

	private resolveClasses(classes: Array<string> = [], disabled: boolean = false): string {
		const classList = [...classes]
		if (disabled) {
			classList.push("disabled")
		}

		return classList.join(" ")
	}

	private resolveStyles(
		style?: Partial<Pick<CSSStyleDeclaration, "padding" | "fontSize" | "borderColor" | "transition">>,
		resizable?: boolean,
		variant?: TextAreaVariant,
	) {
		return {
			...style,
			resize: !resizable ? "none" : "vertical",
			border: variant === "outlined" ? `2px solid ${theme.outline}` : undefined,
		}
	}
}
