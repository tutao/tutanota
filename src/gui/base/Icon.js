// @flow
import m from "mithril"
import type {BootIconsEnum} from "./icons/BootIcons"
import {BootIcons, BootIconsSvg} from "./icons/BootIcons"
import {theme} from "../theme"
import type {IconsEnum} from "./icons/Icons"
import type {lazy} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()

export type IconAttrs = {
	icon: AllIconsEnum,
	class?: string,
	large?: boolean,
	style?: Object,
	container?: "span" | "div" // defaults to "span"
}

export type AllIconsEnum = BootIconsEnum | IconsEnum

export type lazyIcon = lazy<AllIconsEnum>;

let IconsSvg = {}
import("./icons/Icons.js")
	.then(IconsModule => {
		IconsSvg = IconsModule.IconsSvg
	})

export class Icon implements MComponent<IconAttrs> {
	view(vnode: Vnode<IconAttrs>): Children {
		const icon = BootIconsSvg[(vnode.attrs.icon: any)] ? BootIconsSvg[(vnode.attrs.icon: any)] : IconsSvg[(vnode.attrs.icon: any)]
		const container = vnode.attrs.container || "span"
		return m(container + ".icon", {
			"aria-hidden": "true",
			class: this.getClass(vnode.attrs),
			style: this.getStyle(vnode.attrs.style)
		}, m.trust(icon)) // icon is typed, so we may not embed untrusted data
	}

	getStyle(style: ?Object): {fill: string} {
		style = style ? style : {}
		if (!style.fill) {
			style.fill = theme.content_accent
		}
		return style
	}

	getClass(attrs: IconAttrs): string {
		if (attrs.large) {
			return "icon-large"
		} else if (attrs.class) {
			return attrs.class
		} else {
			return ""
		}
	}
}

export function progressIcon(): Vnode<IconAttrs> {
	return m(Icon, {
		icon: BootIcons.Progress,
		class: 'icon-large icon-progress'
	})
}
