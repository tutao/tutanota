import m, { Children, ClassComponent, Vnode, VnodeDOM } from "mithril"
import { ClickHandler } from "../GuiUtils.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { TabIndex } from "../../../api/common/TutanotaConstants.js"
import { AriaRole } from "../../AriaUtils.js"
import { lang, MaybeTranslation } from "../../../misc/LanguageViewModel.js"

// `staticRightText` to be passed as a child
export interface BaseButtonAttrs {
	/** accessibility & tooltip description */
	label: MaybeTranslation
	/** visible text inside button */
	text?: Children
	icon?: Children
	disabled?: boolean
	pressed?: boolean
	/** whether the button is visibly highlighted or not for screen readers */
	selected?: boolean
	onclick: ClickHandler
	onkeydown?: (event: KeyboardEvent) => unknown
	style?: Record<string, any>
	class?: string
	role?: AriaRole
	iconWrapperSelector?: string
}

export class BaseButton implements ClassComponent<BaseButtonAttrs> {
	private dom: HTMLElement | null = null

	view({ attrs, children }: Vnode<BaseButtonAttrs, this>): Children | void | null {
		const disabled = attrs.disabled ? true : null
		const pressed = booleanToAttributeValue(attrs.pressed)
		const selected = booleanToAttributeValue(attrs.selected)
		return m(
			"button",
			{
				title: lang.getTranslationText(attrs.label),
				disabled,
				"aria-disabled": disabled,
				pressed,
				"aria-pressed": pressed,
				"aria-selected": selected,
				onclick: (event: MouseEvent) => {
					let p: any = attrs.onclick(event, assertNotNull(this.dom))
					if (p instanceof Promise) {
						p.then(() => m.redraw())
					}
				},
				onkeydown: attrs.onkeydown,
				class: attrs.class,
				style: attrs.style,
				role: attrs.role,
				"data-testid": `btn:${lang.getTestId(attrs.label)}`,
			},
			[attrs.icon ? this.renderIcon(attrs.icon, attrs.iconWrapperSelector) : null, attrs.text ?? null, children],
		)
	}

	private renderIcon(icon: Children, selector?: string): Children {
		return m(selector ?? "span", { ariaHidden: true, tabindex: TabIndex.Programmatic }, icon)
	}

	oncreate(vnode: VnodeDOM<BaseButtonAttrs, this>): any {
		this.dom = vnode.dom as HTMLElement
	}
}

function booleanToAttributeValue(value: boolean | null | undefined): string | null {
	return value != null ? String(value) : null
}
