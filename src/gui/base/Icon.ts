import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { theme } from "../theme"
import type { lazy } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../../api/common/Env"
import { BootIcons, BootIconsSvg } from "./icons/BootIcons"
import { Icons } from "./icons/Icons"
import { px } from "../size.js"

assertMainOrNode()

export type AllIcons = BootIcons | Icons

export type IconAttrs = {
	icon: AllIcons
	class?: string
	large?: boolean
	style?: Record<string, any>
	hoverText?: string | null
	container?: "span" | "div" // defaults to "span"
}

export type lazyIcon = lazy<AllIcons>

let IconsSvg = {}

import("./icons/Icons.js").then((IconsModule) => {
	IconsSvg = IconsModule.IconsSvg
})

export class Icon implements Component<IconAttrs> {
	private root: HTMLElement | null = null
	private tooltip?: HTMLElement

	oncreate(vnode: VnodeDOM<IconAttrs>): any {
		this.root = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<IconAttrs>): Children {
		// @ts-ignore
		const icon = BootIconsSvg[vnode.attrs.icon] ?? IconsSvg[vnode.attrs.icon]
		const containerClasses = this.getContainerClasses(vnode.attrs)

		return m(
			containerClasses,
			{
				"aria-hidden": "true",
				class: this.getClass(vnode.attrs),
				style: this.getStyle(vnode.attrs.style ?? null),
				onmouseenter: () => {
					if (this.root && this.tooltip) this.moveElementIfOffscreen(this.root, this.tooltip)
				},
			},
			m.trust(icon),
			vnode.attrs.hoverText &&
				m(
					"span.tooltiptext.no-wrap",
					{
						oncreate: (vnode) => {
							this.tooltip = vnode.dom as HTMLElement
						},
					},
					vnode.attrs.hoverText,
				),
		) // icon is typed, so we may not embed untrusted data
	}

	private moveElementIfOffscreen(root: HTMLElement, tooltip: HTMLElement): void {
		tooltip.style.removeProperty("left")
		const tooltipRect = tooltip.getBoundingClientRect()
		// Get the width of the area in pixels that the tooltip penetrates the viewport
		const distanceOver = tooltipRect.x + tooltipRect.width - window.innerWidth
		if (distanceOver > 0) {
			const parentRect = root.getBoundingClientRect()
			// Chromium based browsers return a different value for tooltipRect
			// Compensate by shifting further to the right
			const chromeShift = 20
			tooltip.style.left = px(-distanceOver - parentRect.width - chromeShift)
		}
	}

	getStyle(style: Record<string, any> | null): {
		fill: string
	} {
		style = style ? style : {}

		if (!style.fill) {
			style.fill = theme.content_accent
		}

		return style as { fill: string }
	}

	getClass(attrs: IconAttrs): string {
		let cls = ""
		if (attrs.large) {
			cls += "icon-large "
		}
		if (attrs.class) {
			cls += attrs.class
		}
		return cls
	}

	getContainerClasses(attrs: IconAttrs): string {
		const container = attrs.container || "span"
		let classes = container + ".icon"
		if (attrs.hoverText) {
			classes += ".tooltip"
		}
		return classes
	}
}

export function progressIcon(): Vnode<IconAttrs> {
	return m(Icon, {
		icon: BootIcons.Progress,
		class: "icon-large icon-progress",
	})
}
