// @flow
import m from "mithril"
import type {BootIconsEnum} from "./icons/BootIcons"
import {BootIcons, BootIconsSvg} from "./icons/BootIcons"
import {theme} from "../theme"
import {assertMainOrNodeBoot} from "../../api/Env"
import type {IconsEnum} from "./icons/Icons"
import {asyncImport} from "../../api/common/utils/Utils"

assertMainOrNodeBoot()

export type IconAttrs = {
	icon: AllIconsEnum,
	class?: string,
	large?: boolean,
	style?: Object,
}

export type AllIconsEnum = BootIconsEnum | IconsEnum

export type lazyIcon = lazy<AllIconsEnum>;

let IconsSvg = {}
asyncImport(typeof module !== "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}src/gui/base/icons/Icons.js`)
	.then(IconsModule => {
		IconsSvg = IconsModule.IconsSvg
	})


class _Icon {
	view(vnode: Vnode<IconAttrs>): Children | null | void {
		let icon = BootIconsSvg[(vnode.attrs.icon: any)] ? BootIconsSvg[(vnode.attrs.icon: any)] : IconsSvg[(vnode.attrs.icon: any)]
		return m("span.icon", {
			"aria-hidden": "true",
			class: this.getClass(vnode.attrs),
			style: this.getStyle(vnode.attrs.style)
		}, m.trust(icon)) // icon is typed, so we may not embed untrusted data
	}

	getStyle(style: ?Object) {
		style = style ? style : {}
		if (!style.fill) {
			style.fill = theme.content_accent
		}
		return style
	}

	getClass(attrs: IconAttrs) {
		if (attrs.large) {
			return "icon-large"
		} else if (attrs.class) {
			return attrs.class
		} else {
			return ""
		}
	}
}

export const Icon: Class<MComponent<IconAttrs>> = _Icon

export function progressIcon(): Vnode<IconAttrs> {
	return m(Icon, {
		icon: BootIcons.Progress,
		class: 'icon-large icon-progress'
	})
}
