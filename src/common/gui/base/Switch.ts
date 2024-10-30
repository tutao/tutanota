import m, { ClassComponent, Vnode } from "mithril"
import { Keys, TabIndex } from "../../api/common/TutanotaConstants.js"
import { isKeyPressed } from "../../misc/KeyManager.js"
import { AriaRole } from "../AriaUtils.js"

type SwitchVariant = "normal" | "expanded"
type TogglePillPosition = "left" | "right"
type HTMLElementWithAttrs = Partial<Pick<m.Attributes, "class"> & Omit<HTMLElement, "style"> & SwitchAttrs>

export interface SwitchAttrs {
	checked: boolean
	onclick: (checked: boolean) => unknown
	ariaLabel: string
	disabled?: boolean
	togglePillPosition?: TogglePillPosition
	classes?: Array<string>
	variant?: SwitchVariant
}

/**
 * Switch component with variants
 * @see Component attributes: {SwitchAttrs}
 * @example
 * m(Switch,
 *     {
 *         checked: this.checked,
 *         onclick: (checked: boolean) => {
 *             this.checked = checked
 *             console.log(this.checked)
 *         },
 *         togglePillPosition: "right",
 *         ariaLabel: "Test Switch",
 *         disabled: false,
 *         variant: "normal",
 *     },
 *     "My label",
 * ),
 */

export class Switch implements ClassComponent<SwitchAttrs> {
	private checkboxDom?: HTMLInputElement

	view({ attrs: { disabled, variant, ariaLabel, checked, onclick, togglePillPosition, classes }, children }: Vnode<SwitchAttrs>) {
		const childrenArr = [children, this.buildTogglePillComponent(onclick, disabled)]
		if (togglePillPosition === "left") {
			childrenArr.reverse()
		}

		return m(
			"label.tutaui-switch",
			{
				class: this.resolveClasses(classes, disabled, variant),
				role: AriaRole.Switch,
				ariaLabel: ariaLabel,
				ariaChecked: String(checked),
				ariaDisabled: disabled ? "true" : undefined,
				tabIndex: Number(disabled ? TabIndex.Programmatic : TabIndex.Default),
				onkeydown: (e: KeyboardEvent) => {
					if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
						e.preventDefault()
						this.checkboxDom?.click()
					}
				},
			} satisfies HTMLElementWithAttrs,
			childrenArr,
		)
	}

	private buildTogglePillComponent(onclick: (checked: boolean) => unknown, disabled: boolean | undefined) {
		return m(
			"span.tutaui-toggle-pill",
			{
				class: this.checkboxDom?.checked ? "checked" : "unchecked",
			},
			m("input[type='checkbox']", {
				role: AriaRole.Switch,
				onclick: () => {
					onclick(this.checkboxDom?.checked ?? false)
				},
				oncreate: ({ dom }) => {
					this.checkboxDom = dom as HTMLInputElement
				},
				tabIndex: TabIndex.Programmatic,
				disabled: disabled ? true : undefined,
			}),
		)
	}

	private resolveClasses(classes: Array<string> = [], disabled: boolean = false, variant: SwitchVariant = "normal") {
		const classList = [...classes]

		if (disabled) classList.push("disabled", "click-disabled")
		else classList.push("click")

		if (variant === "expanded") classList.push("justify-between", "full-width")
		else classList.push("fit-content")

		return classList.join(" ")
	}
}
