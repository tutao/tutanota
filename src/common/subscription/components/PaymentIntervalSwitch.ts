import m, { ClassComponent, Vnode, VnodeDOM } from "mithril"
import { AriaRole } from "../../gui/AriaUtils.js"
import { Keys, TabIndex } from "../../api/common/TutanotaConstants.js"
import { isKeyPressed } from "../../misc/KeyManager.js"
import { locator } from "../../api/main/CommonLocator.js"
import { theme } from "../../gui/theme"

type SwitchState = "left" | "right"

type HTMLElementWithAttrs = Partial<Pick<m.Attributes, "class"> & Omit<HTMLElement, "style"> & PaymentIntervalSwitchAttrs>

interface PaymentIntervalSwitchAttrs {
	state: SwitchState
	onclick: (newState: SwitchState) => unknown
	ariaLabel: string
	classes?: Array<string>
}

export class PaymentIntervalSwitch implements ClassComponent<PaymentIntervalSwitchAttrs> {
	private checkboxDom?: HTMLInputElement

	view({ attrs: { state, ariaLabel, onclick, classes } }: Vnode<PaymentIntervalSwitchAttrs>) {
		return m(
			`label.tutaui-switch.flash.click.fit-content${classes ? classes?.join(".") : ""}`,
			{
				role: AriaRole.Switch,
				ariaLabel: ariaLabel,
				ariaChecked: String(state === "right"),
				ariaDisabled: undefined,
				tabIndex: Number(TabIndex.Default),
				onkeydown: (e: KeyboardEvent) => {
					if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
						e.preventDefault()
						this.checkboxDom?.click()
					}
				},
			} satisfies HTMLElementWithAttrs,
			this.renderTogglePillComponent(state === "right", onclick),
		)
	}

	private renderTogglePillComponent(checked: boolean = false, onclick: (state: SwitchState) => unknown) {
		return m(
			`span.tutaui-toggle-pill.payment-interval`,
			{
				class: this.checkboxDom?.checked ? "checked" : "unchecked",
			},
			m("input[type='checkbox']", {
				role: AriaRole.Switch,
				onclick: () => {
					onclick(this.checkboxDom?.checked ? "right" : "left")
				},
				oncreate: ({ dom }: VnodeDOM<HTMLInputElement>) => {
					this.checkboxDom = dom as HTMLInputElement
					this.checkboxDom.checked = checked
				},
				tabIndex: TabIndex.Programmatic,
				disabled: undefined,
			}),
		)
	}
}
