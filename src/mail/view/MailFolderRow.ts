import m, {Children, Component, Vnode, VnodeDOM} from "mithril"
import type {NavButtonAttrs} from "../../gui/base/NavButton.js"
import {isNavButtonSelected, NavButton} from "../../gui/base/NavButton.js"
import {animations, opacity} from "../../gui/animation/Animations"
import {CounterBadge} from "../../gui/base/CounterBadge"
import {getNavButtonIconBackground, theme} from "../../gui/theme"
import {px} from "../../gui/size"
import {IconButton, IconButtonAttrs} from "../../gui/base/IconButton.js"

export type MailFolderRowAttrs = {
	count: number
	button: NavButtonAttrs
	rightButton: IconButtonAttrs | null
}

export class MailFolderRow implements Component<MailFolderRowAttrs> {
	view(vnode: Vnode<MailFolderRowAttrs>): Children {
		const {count, button, rightButton} = vnode.attrs
		return m(".folder-row.plr-l.flex.flex-row" + (isNavButtonSelected(button) ? ".row-selected" : ""), {}, [
			m(CounterBadge, {
				count,
				position: {
					top: px(0),
					left: px(3),
				},
				color: theme.navigation_button_icon,
				background: getNavButtonIconBackground(),
			}),
			m(NavButton, button),
			rightButton
				? m(IconButton, {
					...rightButton,
					oncreate: (vnode: VnodeDOM<IconButtonAttrs>) => {
						const dom = vnode.dom as HTMLElement
						dom.style.opacity = "0"
						animations.add(dom, opacity(0, 1, true))
					},
					onbeforeremove: (vnode: VnodeDOM<IconButtonAttrs>) => {
						const dom = vnode.dom as HTMLElement
						dom.style.opacity = "1"
						return animations.add(dom, opacity(1, 0, true))
					},
				})
				: null,
		])
	}
}