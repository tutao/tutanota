import m, { Children, Component, Vnode } from "mithril"
import type { NavButtonAttrs } from "../../../common/gui/base/NavButton.js"
import { isNavButtonSelected, NavButton } from "../../../common/gui/base/NavButton.js"
import { CounterBadge } from "../../../common/gui/base/CounterBadge"
import { theme } from "../../../common/gui/theme"
import { component_size, px, size } from "../../../common/gui/size"
import { IconButton, IconButtonAttrs } from "../../../common/gui/base/IconButton.js"
import { Icon, IconSize } from "../../../common/gui/base/Icon.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { client } from "../../../common/misc/ClientDetector.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { MailFolder } from "../../../common/api/entities/tutanota/TypeRefs"
import { getFolderIcon } from "./MailGuiUtils"

export type MailFolderRowAttrs = {
	count: number
	button: NavButtonAttrs
	rightButton?: IconButtonAttrs | null
	expanded: boolean | null
	indentationLevel: number
	onExpanderClick: (event: Event) => unknown
	folder: MailFolder
	hasChildren: boolean
	onSelectedPath: boolean
	numberOfPreviousRows: number
	isLastSibling: boolean
	editMode: boolean
	onHover: () => void
	fullFolderPath: string
}

export class MailFolderRow implements Component<MailFolderRowAttrs> {
	private hovered: boolean = false

	view(vnode: Vnode<MailFolderRowAttrs>): Children {
		const { count, button, rightButton, expanded, indentationLevel, folder, hasChildren, editMode } = vnode.attrs
		const icon = getFolderIcon(folder)
		const onHover = () => {
			vnode.attrs.onHover()
			this.hovered = true
		}

		// because onblur is fired upon changing folder due to the route change
		// these functions can be used to handle keyboard navigation
		const handleForwardsTab = (event: KeyboardEvent) => {
			if (event.key === "Tab" && !event.shiftKey) {
				this.hovered = false
			}
		}
		const handleBackwardsTab = (event: KeyboardEvent) => {
			if (event.key === "Tab" && event.shiftKey) this.hovered = false
		}

		const indentationMargin = indentationLevel * size.spacing_12
		const paddingNeeded = size.spacing_8
		const buttonWidth = size.icon_24 + paddingNeeded * 2

		return m(
			".folder-row.flex.flex-row.mlr-8.border-radius-4.state-bg",
			{
				style: {
					background: isNavButtonSelected(button) ? theme.state_bg_hover : "",
				},
				title: lang.getTranslationText(button.label),
				onmouseenter: onHover,
				onmouseleave: () => {
					this.hovered = false
				},
			},
			[
				hasChildren && !expanded
					? m(Icon, {
							style: {
								position: "absolute",
								bottom: px(9),
								left: px(5 + indentationMargin + buttonWidth / 2),
								fill: isNavButtonSelected(button) ? theme.primary : theme.on_surface_variant,
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
					"button.flex.items-center.justify-end" + (editMode ? ".no-hover" : ""),
					{
						style: {
							left: px(indentationMargin),
							width: px(buttonWidth),
							height: px(component_size.button_height),
							paddingLeft: px(paddingNeeded),
							paddingRight: px(paddingNeeded),
							// the zIndex is so the hierarchy lines never get drawn over the icon
							zIndex: 3,
						},
						"data-testid": `btn:icon:${vnode.attrs.fullFolderPath}`,
						"data-expanded": vnode.attrs.expanded ? "true" : "false",
						onclick: vnode.attrs.onExpanderClick,
						onkeydown: handleBackwardsTab,
					},
					m(Icon, {
						icon,
						size: IconSize.PX24,
						style: {
							fill: isNavButtonSelected(button) ? theme.primary : theme.on_surface_variant,
						},
					}),
				),
				m(NavButton, {
					...button,
					onfocus: onHover,
					onkeydown: handleBackwardsTab,
					disableSelectedBackground: true,
				}),
				// show the edit button in either edit mode or on hover (excluding hover on mobile)
				rightButton && (editMode || (!client.isMobileDevice() && this.hovered))
					? m(IconButton, {
							...rightButton,
							click: (event, dom) => {
								rightButton.click(event, dom)
							},
							onkeydown: handleForwardsTab,
						})
					: m("", { style: { marginRight: px(size.spacing_8) } }, [
							m(CounterBadge, {
								count,
								color: theme.surface_container,
								background: theme.on_surface_variant,
								showFullCount: true,
							}),
						]),
			],
		)
	}

	private renderHierarchyLine({ indentationLevel, numberOfPreviousRows, isLastSibling, onSelectedPath }: MailFolderRowAttrs, indentationMargin: number) {
		const lineSize = 1
		const border = `${lineSize}px solid ${theme.outline}`
		const verticalOffsetInsideRow = component_size.button_height / 2 + 1
		const verticalOffsetForParent = (component_size.button_height - size.icon_24) / 2
		const lengthOfHorizontalLine = size.spacing_12 - 2
		const leftOffset = indentationMargin

		return indentationLevel !== 0
			? [
					isLastSibling || onSelectedPath
						? // draw both vertical and horizontal lines
							m(".abs", {
								style: {
									width: px(lengthOfHorizontalLine),
									borderBottomLeftRadius: "3px",
									// there's some subtle difference between border we use here and the top for the other element and this +1 is to
									// accommodate it
									height: px(1 + verticalOffsetInsideRow + verticalOffsetForParent + numberOfPreviousRows * component_size.button_height),
									top: px(-verticalOffsetForParent - numberOfPreviousRows * component_size.button_height),
									left: px(leftOffset),
									borderLeft: border,
									borderBottom: border,
									// we need to draw selected lines over everything else, even things that are drawn later
									zIndex: onSelectedPath ? 2 : 1,
								},
							})
						: // draw only the horizontal line
							m(".abs", {
								style: {
									height: px(lineSize),
									top: px(verticalOffsetInsideRow),
									left: px(leftOffset),
									width: px(lengthOfHorizontalLine),
									backgroundColor: theme.outline,
								},
							}),
				]
			: null
	}
}
