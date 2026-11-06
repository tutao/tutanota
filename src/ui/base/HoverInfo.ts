import m, { Children, Component, Vnode } from "mithril"
import { Icon, IconSize } from "./Icon"
import { lang, TranslationKey } from "../utils/LanguageViewModel"
import { Card } from "./Card"
import { px } from "../size"
import { theme } from "../theme"
import { Icons } from "./icons/Icons"
import { ButtonColor, getColors } from "./Button"

export interface HoverInfoAttrs {
	message: TranslationKey
	icon?: Icons
	label?: TranslationKey
	shiftDistance?: number
}

const HIDE_DELAY_MS = 150
const DEFAULT_SHIFT_PX = 45

export class HoverInfo implements Component<HoverInfoAttrs> {
	private visible = false
	private position = { left: 0, top: 0 }
	private hideTimeout: number | null = null

	view({ attrs }: Vnode<HoverInfoAttrs>): Children {
		return m(
			"span",
			{
				style: { display: "inline-flex" },
				onmouseenter: (e: MouseEvent) => this.show(e.currentTarget as Element, attrs),
				onmouseleave: this.scheduleHide,
				onfocusin: (e: FocusEvent) => this.show(e.currentTarget as Element, attrs),
				onfocusout: this.scheduleHide,
			},
			[
				m(
					"button",
					{ class: "icon-button  state-bg " },
					m(Icon, {
						icon: attrs.icon ?? Icons.QuestionmarkFilled,
						container: "div",
						class: "center-h",
						size: IconSize.PX24,
						style: {
							fill: getColors(ButtonColor.Content).button,
						},
					}),
				),
				this.visible ? this.renderPanel(attrs) : null,
			],
		)
	}

	private show(trigger: Element, attrs: HoverInfoAttrs) {
		const rect = trigger.getBoundingClientRect()
		const shift = attrs.shiftDistance ?? DEFAULT_SHIFT_PX
		this.position = {
			left: rect.left + shift,
			top: rect.top - shift,
		}
		this.cancelHide()
		this.visible = true
		m.redraw()
	}

	private scheduleHide = () => {
		this.cancelHide()
		this.hideTimeout = window.setTimeout(() => {
			this.hideTimeout = null
			this.visible = false
			m.redraw()
		}, HIDE_DELAY_MS)
	}

	private cancelHide = () => {
		if (this.hideTimeout !== null) {
			clearTimeout(this.hideTimeout)
			this.hideTimeout = null
		}
	}

	private renderPanel(attrs: HoverInfoAttrs): Children {
		return m(
			".hover-panel.border.border-radius",
			{
				style: {
					position: "fixed",
					left: px(this.position.left),
					top: px(this.position.top),
					zIndex: 1000,
				},
				onmouseenter: this.cancelHide,
				onmouseleave: this.scheduleHide,
			},
			m(Card, {}, [
				m(
					".flex.items-center.justify-center",
					m(Icon, {
						icon: Icons.InfoFilled,
						size: IconSize.PX32,
						style: { fill: theme.on_surface_variant },
					}),
				),
				m("", lang.getTranslation(attrs.message).text),
			]),
		)
	}

	onremove() {
		this.cancelHide()
	}
}
