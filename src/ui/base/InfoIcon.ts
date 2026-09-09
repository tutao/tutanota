import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { px } from "../size.js"
import { isKeyPressed } from "../utils/KeyManager.js"
import { TabIndex } from "../../platform-kit/app-env"
import { Keys } from "../utils/KeyboardKeys"
import { displayOverlay, PositionRect } from "./Overlay"
import { Thunk } from "@tutao/utils"
import { theme } from "../theme"

const TOOLTIP_WIDTH = 120
const VIEWPORT_MARGIN = 8

export interface InfoIconAttrs {
	text: Children
}

export class InfoIcon implements Component<InfoIconAttrs> {
	private hovered = false
	private expanded: boolean = false
	private closeOverlayFunction: Thunk | null = null
	private tooltipComponent: Component | null = null
	private dom: HTMLElement | null = null

	oncreate({ attrs, dom }: VnodeDOM<InfoIconAttrs>) {
		this.dom = dom as HTMLElement
		this.tooltipComponent = makeTooltipComponent(attrs.text)
	}

	onremove() {
		this.collapse()
	}

	view({ attrs }: Vnode<InfoIconAttrs>) {
		return m(
			"div.flex.justify-center.no-grow-no-shrink.overflow-visible",
			{
				"aria-pressed": String(this.expanded),
				tabindex: TabIndex.Default,
				role: "button",
				style: {
					"margin-top": px(1),
				},
				// we can't really do the state with pure CSS on mobile
				onclick: () => {
					if (this.expanded) {
						this.onDismiss()
					} else {
						this.expand()
					}
				},
				onkeydown: (e: KeyboardEvent) => {
					if (isKeyPressed(e.key, Keys.ESC)) {
						this.onDismiss()
					}
				},
				onfocusin: (e: FocusEvent) => {
					// only open on keyboard focus not on taps
					if ((e.target as HTMLElement).matches(":focus-visible")) {
						this.expand()
					}
				},
				onfocusout: () => {
					this.onDismiss()
				},

				//Only expand when hovered by a mouse; prevents text flickering on mobile
				onpointerenter: (e: PointerEvent) => {
					if (e.pointerType === "mouse") {
						this.expand()
					}
				},
				onpointerleave: (e: PointerEvent) => {
					if (e.pointerType === "mouse") {
						this.onDismiss()
					}
				},
			},
			m(
				".info-badge.tooltip",
				{
					expanded: String(this.expanded),
				},
				"i",
			),
		)
	}

	private expand(): void {
		this.expanded = true
		document.addEventListener("click", this.onClick, { capture: true })
		window.addEventListener("scroll", this.onScroll, { capture: true, passive: true })
		this.showOverlay()
	}

	private readonly onDismiss = () => {
		this.collapse()
		m.redraw()
	}

	private showOverlay() {
		if (this.closeOverlayFunction == null) {
			this.closeOverlayFunction = displayOverlay(
				() => this.makeOverlayRect(),
				this.tooltipComponent!,
				undefined,
				undefined,
				"dropdown-shadow border-radius",
			)
		} else {
			m.redraw()
		}
	}

	private closeOverlay() {
		if (this.closeOverlayFunction) {
			this.closeOverlayFunction()
			this.closeOverlayFunction = null
		}
	}

	private makeOverlayRect(): PositionRect {
		const rect = this.dom!.getBoundingClientRect()
		return {
			width: "120px",
			//Avoid negative numbers
			left: px(Math.max(8, rect.left - 120)),
			top: px(rect.top + 20),
		}
	}

	private readonly onScroll = () => {
		this.collapse()
		m.redraw()
	}

	private collapse(): void {
		this.expanded = false
		document.removeEventListener("click", this.onClick, { capture: true })
		window.removeEventListener("scroll", this.onScroll, { capture: true })
		this.closeOverlay()
	}

	private readonly onClick = (e: MouseEvent) => {
		const insideIcon = e.target instanceof Node && this.dom?.contains(e.target)
		this.collapse()
		m.redraw()
		if (insideIcon) {
			e.stopPropagation()
		}
	}
}

const makeTooltipComponent: (text: Children) => Component = (text: Children) => ({
	view(): Children {
		return m(
			"div.break-word.p-4.small.b.text-center.border-radius-4",
			{
				role: "tooltip",
				style: {
					"background-color": theme.on_surface_variant,
					color: theme.surface,
				},
			},
			text,
		)
	},
})
