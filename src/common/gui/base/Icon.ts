import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { theme } from "../theme"
import type { lazy } from "@tutao/tutanota-utils"
import { memoized } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../../api/common/Env"
import { BootIcons, BootIconsSvg } from "./icons/BootIcons"
import { Icons } from "./icons/Icons"
import { px, size } from "../size.js"

assertMainOrNode()

export type AllIcons = BootIcons | Icons

export enum IconSize {
	Normal,
	Medium,
	Large,
	XL,
}

export type IconAttrs = {
	icon: AllIcons
	svgParameters?: Record<string, string>
	class?: string
	size?: IconSize
	style?: Record<string, any>
	hoverText?: string | null
	container?: "span" | "div" // defaults to "span"
	title?: string // if you want to use native tooltip
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
		const icon = this.getIcon({ icon: vnode.attrs.icon, parameters: vnode.attrs.svgParameters })
		const containerClasses = this.getContainerClasses(vnode.attrs)

		return m(
			containerClasses,
			{
				title: vnode.attrs.title ?? "",
				"aria-hidden": "true",
				class: this.getClass(vnode.attrs),
				style: this.getStyle(vnode.attrs.style ?? null),
				// mithril lets us mute the normal redraw that occurs after
				// event callbacks, but TS doesn't know
				onmouseenter: (e: MouseEvent & { redraw: boolean }) => {
					if (this.root && this.tooltip) {
						this.moveElementIfOffscreen(this.root, this.tooltip)
					} else {
						e.redraw = false
					}
				},
			},
			icon ? m.trust(icon) : null,
			vnode.attrs.hoverText &&
				m(
					"span.tooltiptext.max-width-m.break-word",
					{
						style: { marginRight: "-100vmax" },
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
		const distanceOver = tooltipRect.x + tooltipRect.width + size.hpad_large - window.innerWidth
		if (distanceOver > 0) {
			const parentRect = root.getBoundingClientRect()
			// Chromium based browsers return a different value for tooltipRect
			// Compensate by shifting further to the right
			const chromeShift = 20
			tooltip.style.left = px(-distanceOver - parentRect.width - chromeShift)
		}
	}

	private getIcon = memoized((args: { icon: AllIcons; parameters?: Record<string, string> }) => {
		// @ts-ignore
		let rawIcon = BootIconsSvg[args.icon] ?? IconsSvg[args.icon]
		if (typeof rawIcon !== "string") return null
		for (const parameter in args.parameters) {
			rawIcon = rawIcon.replace(`{${parameter}}`, args.parameters[parameter])
		}
		return rawIcon as string
	})

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
		switch (attrs.size) {
			case IconSize.Medium:
				cls += "icon-large "
				break
			case IconSize.Large:
				cls += "icon-medium-large "
				break
			case IconSize.XL:
				cls += "icon-xl "
				break
			case IconSize.Normal:
			default:
				break
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
