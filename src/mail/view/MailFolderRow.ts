import m, {Children, Component, Vnode, VnodeDOM} from "mithril"
import type {NavButtonAttrs} from "../../gui/base/NavButton.js"
import {isNavButtonSelected, NavButton} from "../../gui/base/NavButton.js"
import {animations, opacity} from "../../gui/animation/Animations"
import {CounterBadge} from "../../gui/base/CounterBadge"
import {getNavButtonIconBackground, theme} from "../../gui/theme"
import {px, size} from "../../gui/size"
import {IconButton, IconButtonAttrs} from "../../gui/base/IconButton.js"
import {Icon} from "../../gui/base/Icon.js"
import {BootIcons} from "../../gui/base/icons/BootIcons.js"
import {Icons} from "../../gui/base/icons/Icons.js"

export type MailFolderRowAttrs = {
	count: number
	button: NavButtonAttrs
	rightButton: IconButtonAttrs | null,
	expanded: boolean | null,
	indentationLevel: number,
	onExpanderClick: () => unknown,
}

export class MailFolderRow implements Component<MailFolderRowAttrs> {
	view(vnode: Vnode<MailFolderRowAttrs>): Children {
		const {count, button, rightButton, expanded, indentationLevel} = vnode.attrs
		const indentationMargin = indentationLevel * size.hpad
		return m(".folder-row.plr-l.flex.flex-row" + (isNavButtonSelected(button) ? ".row-selected" : ""), {}, [
			m(CounterBadge, {
				count,
				position: {
					top: px(0),
					left: px(5 + indentationMargin + size.hpad),
				},
				color: theme.navigation_button_icon,
				background: getNavButtonIconBackground(),
			}),
			m("", {
				style: {
					marginLeft: px(indentationMargin),
				}
			}),
			expanded == null ?
				null
				: m("button.icon-large", {
						style: {
							position: "absolute",
							left: px(indentationMargin),
						},
						onclick: vnode.attrs.onExpanderClick
					},
					m(Icon, {
						icon: expanded === true ? BootIcons.Expand : Icons.ArrowDropRight,
						large: true,
						style: {
							fill: theme.navigation_button,
						}
					})),
			m(".ml"),
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