import m, { Children, Component, Vnode } from "mithril"
import type { NavButtonAttrs } from "../../gui/base/NavButton.js"
import { isNavButtonSelected, NavButton } from "../../gui/base/NavButton.js"
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
	onSelectedPath: boolean
	numberOfPreviousRows: number
	isLastSibling: boolean
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
			this.renderHierarchyLine(vnode.attrs, indentationMargin),
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

	private renderHierarchyLine(
		{ indentationLevel, numberOfPreviousRows, isLastSibling, onSelectedPath }: MailFolderRowAttrs,
		indentationMargin: number,
	) {
		const lineSize = 2
		const border = `${lineSize}px solid ${onSelectedPath ? theme.content_accent : theme.content_border}`
		const verticalOffsetInsideRow = size.button_height / 2 + 1
		const verticalOffsetForParent = size.button_height / 4
		const lengthOfHorizontalLine = size.hpad - 2
		return indentationLevel !== 0
			? [
					isLastSibling || onSelectedPath
						// draw both vertical and horizontal lines
						? m(".abs", {
								style: {
									width: px(lengthOfHorizontalLine),
									borderBottomLeftRadius: "3px",
									// there's some subtle difference between border we use here and the height for the other element and this +1 is to
									// accommodate it
									height: px(1 + verticalOffsetInsideRow + verticalOffsetForParent + numberOfPreviousRows * size.button_height),
									top: px(-verticalOffsetForParent - numberOfPreviousRows * size.button_height),
									left: px(indentationMargin + size.hpad),
									borderLeft: border,
									borderBottom: border,
									// we need to draw selected lines over everything else, even things that are drawn later
									zIndex: onSelectedPath ? 1 : "",
								},
						  })
						// draw only the horizontal line
						: m(".abs", {
								style: {
									height: px(lineSize),
									top: px(verticalOffsetInsideRow),
									left: px(indentationMargin + size.hpad),
									width: px(lengthOfHorizontalLine),
									backgroundColor: onSelectedPath ? theme.content_accent : theme.content_border,
								},
						  }),
			  ]
			: null
	}
}
