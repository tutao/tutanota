import m, { Children, ClassComponent, Vnode, VnodeDOM } from "mithril"
import { theme } from "../theme.js"
import { TextArea, TextAreaAttrs } from "./TextArea.js"
import { Icon, IconSize } from "./Icon.js"
import { BootIcons } from "./icons/BootIcons.js"
import { px, size } from "../size.js"
import { DefaultAnimationTime } from "../animation/Animations.js"

type TextAreaVariant = "normal" | "outlined"

export interface ExpandableTextAreaAttrs {
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
	oncreate?: (node: VnodeDOM<ExpandableTextAreaAttrs>) => unknown
	placeholder?: string
	classes?: Array<string>
	style?: Partial<Pick<CSSStyleDeclaration, "padding" | "fontSize" | "borderColor">>
	variant?: TextAreaVariant
	maxLength?: number
}

type TextAreaAttributes = Pick<TextAreaAttrs, "style" | "variant" | "placeholder" | "oninput" | "disabled" | "resizable" | "maxLines" | "ariaLabel" | "value">
type HTMLElementWithAttrs = Partial<
	Pick<m.Attributes, "class"> &
		Omit<HTMLTextAreaElement, "style"> &
		ExpandableTextAreaAttrs & {
			style: { resize: string }
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
export class ExpandableTextArea implements ClassComponent<ExpandableTextAreaAttrs> {
	domDiv!: HTMLDivElement
	domInput?: HTMLTextAreaElement
	private isExpanded = false
	private inputVerticalPadding = 0
	private inputLineHeight = 0
	private initialHeight: number = 0

	oncreate(vnode: VnodeDOM<ExpandableTextAreaAttrs, this>): any {
		this.domDiv = vnode.dom as HTMLDivElement
	}

	view({ attrs }: Vnode<ExpandableTextAreaAttrs, this>): Children | void | null {
		const textAreaAttrs = this.pick(
			attrs,
			"style",
			"variant",
			"placeholder",
			"oninput",
			"disabled",
			"resizable",
			"maxLines",
			"ariaLabel",
			"value",
			"maxLength",
		) as TextAreaAttributes
		return m(
			".rel.mt-8",
			{
				onclick: () => this.domInput?.focus(),
			},
			[
				m(TextArea, {
					...textAreaAttrs,
					oncreate: (vnode) => {
						this.setupInputListeners(vnode, attrs)
						attrs.oncreate?.(vnode)
						requestAnimationFrame(() => {
							if (this.initialHeight === 0) {
								this.initialHeight = parseFloat(window.getComputedStyle(vnode.dom).height.replaceAll("px", ""))
								m.redraw()
							}
						})
					},
					maxLines: this.isExpanded ? (attrs.maxLines ?? 2) : 1,
					style: {
						...textAreaAttrs.style,
						height: this.calculateHeight(attrs.maxLines ?? 3),
						transition: `height ${DefaultAnimationTime}ms linear`,
					},
				} satisfies TextAreaAttrs),
				!this.isExpanded
					? m(Icon, {
							icon: BootIcons.Expand,
							class: "flex-center items-center abs",
							size: IconSize.PX24,
							style: {
								top: this.initialHeight === 0 ? 0 : px(this.initialHeight / 2 - size.icon_24 / 2),
								bottom: this.initialHeight === 0 ? 0 : undefined,
								margin: this.initialHeight === 0 ? "auto 0" : undefined,
								right: "8px",
								fill: theme.on_surface_variant,
								transform: `rotateZ(${this.isExpanded ? 180 : 0}deg)`,
								transition: `transform ${DefaultAnimationTime}ms`,
							},
						})
					: null,
			],
		)
	}

	private calculateHeight(maxLines: number) {
		return this.isExpanded
			? px(maxLines * (this.inputLineHeight + this.inputVerticalPadding))
			: this.initialHeight !== 0
				? px(this.initialHeight)
				: "initial"
	}

	private setupInputListeners(vnode: VnodeDOM<TextAreaAttrs>, attrs: ExpandableTextAreaAttrs) {
		this.domInput = vnode.dom as HTMLTextAreaElement
		const computedStyle = window.getComputedStyle(vnode.dom)
		this.inputVerticalPadding = Number.parseFloat(computedStyle.paddingBottom.replaceAll("px", "")) * 2
		this.inputLineHeight = Number.parseFloat(computedStyle.lineHeight.replaceAll("px", ""))

		this.domInput.addEventListener("focus", () => {
			this.isExpanded = true
			m.redraw()
		})

		this.domInput.addEventListener("blur", () => {
			if ((vnode.dom as HTMLTextAreaElement).value.trim() === "") {
				this.isExpanded = false
			}
			m.redraw()
		})

		m.redraw()
	}

	private pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
		const copy = {} as Pick<T, K>

		for (const key of keys) {
			copy[key] = obj[key]
		}

		return copy
	}
}
