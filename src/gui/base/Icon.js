// @flow
import m from "mithril"
import {BootIcons} from "./icons/BootIcons"
import {theme} from "../theme"
import {assertMainOrNodeBoot} from "../../api/Env"

assertMainOrNodeBoot()

class _Icon {
	view(vnode: Vnode<IconAttrs>): Children | null | void {
		return m("span.icon", {
			class: this.getClass(vnode.attrs),
			style: this.getStyle(vnode.attrs.style)
		}, m.trust(vnode.attrs.icon))
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
