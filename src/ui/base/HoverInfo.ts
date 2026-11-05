import m, { Children, Component, Vnode } from "mithril"
import { Icon, IconSize } from "./Icon"
import { IconButton, IconButtonAttrs } from "./IconButton"
import { lang, TranslationKey } from "../utils/LanguageViewModel"
import { Card } from "./Card"
import { px } from "../size"
import { theme } from "../theme"
import { Icons } from "./icons/Icons"
import { noOp } from "@tutao/utils"

export interface HoverInfoAttrs {
	message: TranslationKey
	icon?: Icons
	label?: TranslationKey
	shiftDistance?: number
	buttonAttrs?: Partial<Omit<IconButtonAttrs, "icon" | "label" | "click">>
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
				// Strip the native `title` that BaseButton sets, otherwise the browser renders its own tooltip on top of our panel.
				oncreate: (vnode) => this.suppressNativeTitle(vnode.dom as Element),
				onupdate: (vnode) => this.suppressNativeTitle(vnode.dom as Element),
			},
			[
				m(IconButton, {
					icon: attrs.icon ?? Icons.QuestionmarkFilled,
					label: attrs.label ?? attrs.message,
					click: noOp,
					...attrs.buttonAttrs,
				}),
				this.visible ? this.renderPanel(attrs) : null,
			],
		)
	}

	private suppressNativeTitle(host: Element) {
		const button = host.querySelector("button")
		if (!button) return
		const title = button.getAttribute("title")
		if (title) {
			if (!button.hasAttribute("aria-label")) {
				button.setAttribute("aria-label", title)
			}
			button.removeAttribute("title")
		}
	}

	private show(trigger: Element, attrs: HoverInfoAttrs) {
		this.suppressNativeTitle(trigger)

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
