import m, { Children, ClassComponent, Vnode, VnodeDOM } from "mithril"
import { ClickHandler } from "../GuiUtils.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { TabIndex } from "../../../api/common/TutanotaConstants.js"
import { AriaRole } from "../../AriaUtils.js"
import { lang, TranslationKey } from "../../../misc/LanguageViewModel.js"
import { theme } from "../../theme.js"
import { px, size } from "../../size.js"

// `staticRightText` to be passed as a child
export interface BaseButtonAttrs {
	/** accessibility & tooltip description */
	label: string
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
				title: attrs.label,
				disabled,
				"aria-disabled": disabled,
				pressed,
				"aria-pressed": pressed,
				"aria-selected": selected,
				onclick: (event: MouseEvent) => attrs.onclick(event, assertNotNull(this.dom)),
				onkeydown: attrs.onkeydown,
				class: attrs.class,
				style: attrs.style,
				role: attrs.role,
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

export function renderNewEventButton(buttonAttrs: { label: TranslationKey; click: ClickHandler; style?: Record<string, any> }): Children {
	const label = lang.get(buttonAttrs.label)
	return m(BaseButton, {
		label,
		text: label,
		onclick: buttonAttrs.click,
		class: "full-width border-radius-big center b flash",
		style: {
			border: `2px solid ${theme.content_accent}`,
			// matching toolbar
			height: px(size.button_height + size.vpad_xs * 2),
			color: theme.content_accent,
			...buttonAttrs.style,
		},
	} satisfies BaseButtonAttrs)
}
