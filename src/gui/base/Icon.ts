import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../theme"
import type { lazy } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../../api/common/Env"
import { BootIcons, BootIconsSvg } from "./icons/BootIcons"
import { Icons } from "./icons/Icons"

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
			},
			m.trust(icon),
			vnode.attrs.hoverText ? m("span.tooltiptext.no-wrap", vnode.attrs.hoverText) : null,
		) // icon is typed, so we may not embed untrusted data
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
