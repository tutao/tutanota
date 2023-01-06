import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import type { NavButtonAttrs } from "../../gui/base/NavButton.js"
import { isNavButtonSelected, NavButton } from "../../gui/base/NavButton.js"
import { animations, opacity } from "../../gui/animation/Animations"
import { CounterBadge } from "../../gui/base/CounterBadge"
import { getNavButtonIconBackground, theme } from "../../gui/theme"
import { px, size } from "../../gui/size"
import { IconButton, IconButtonAttrs } from "../../gui/base/IconButton.js"
import { AllIcons, Icon } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"

export type MailFolderRowAttrs = {
	count: number
	button: NavButtonAttrs
	rightButton?: IconButtonAttrs | null
	expanded: boolean | null
	indentationLevel: number
	onExpanderClick: () => unknown
	icon: AllIcons
	hasChildren: boolean
}

export class MailFolderRow implements Component<MailFolderRowAttrs> {
	view(vnode: Vnode<MailFolderRowAttrs>): Children {
		const { count, button, rightButton, expanded, indentationLevel, icon, hasChildren } = vnode.attrs
		const indentationMargin = indentationLevel * size.hpad
		return m(".folder-row.pr-l.flex.flex-row", [
			hasChildren && !expanded
				? m(Icon, {
						style: {
							position: "absolute",
							bottom: px(10),
							left: px(5 + indentationMargin + size.hpad + size.font_size_base),
							fill: isNavButtonSelected(button) ? theme.navigation_button_selected : theme.navigation_button,
						},
						icon: Icons.Add,
						class: "icon-small",
				  })
				: null,
			m("", {
				style: {
					marginLeft: px(indentationMargin),
				},
			}),
			m(
				"button.flex.items-center.justify-end",
				{
					style: {
						left: px(indentationMargin),
						width: px(size.icon_size_medium + size.hpad_large),
						height: px(size.button_height),
					},
					onclick: vnode.attrs.onExpanderClick,
				},
				m(Icon, {
					icon,
					style: {
						fill: isNavButtonSelected(button) ? theme.navigation_button_selected : theme.navigation_button,
					},
				}),
			),
			m(NavButton, button),
			rightButton
				? m(IconButton, {
						...rightButton,
				  })
				: m(CounterBadge, {
						count,
						color: theme.navigation_button_icon,
						background: getNavButtonIconBackground(),
				  }),
		])
	}
}
