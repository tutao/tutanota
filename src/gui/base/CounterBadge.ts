import m, { Children, Component, Vnode } from "mithril"
import type { PositionRect } from "./Overlay"

/**
 * Small badge symbol to display numeric values to indicate that content is available, e.g. unread mail counter.
 * It will only appear if the counter value is greater than zero.
 */
export type CounterBadgeAttrs = {
	count: number
	position?: PositionRect
	color: string
	background: string
	showFullCount?: boolean
}

export class CounterBadge implements Component<CounterBadgeAttrs> {
	_hovered: boolean = false

	constructor(vnode: Vnode<CounterBadgeAttrs>) {
		this._hovered = false
	}

	view(vnode: Vnode<CounterBadgeAttrs>): Children {
		const { count, position, background, color, showFullCount } = vnode.attrs
		return count > 0
			? m(
					".counter-badge.z2",
					{
						class: position ? "abs" : "",
						onmouseenter: () => {
							this._hovered = true
						},
						onmouseleave: () => {
							this._hovered = false
						},
						style: {
							width: position?.width,
							top: position?.top,
							bottom: position?.bottom,
							right: position?.right,
							left: position?.left,
							height: position?.height,
							"z-index": position?.zIndex,
							background,
							color,
						},
					},
					count < 99 || this._hovered || showFullCount ? count : "99+",
			  )
			: null
	}
}
