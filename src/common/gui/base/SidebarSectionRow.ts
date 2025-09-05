import m, { Children, Component, Vnode } from "mithril"
import { AllIcons, Icon, IconSize } from "./Icon"
import { isNavButtonSelected, NavButton, NavButtonAttrs } from "./NavButton"
import { ClickHandler, DropData } from "./GuiUtils"
import type { MaybeTranslation } from "../../misc/LanguageViewModel"
import { assertNotNull } from "@tutao/tutanota-utils"
import { client } from "../../misc/ClientDetector"
import { IconButton, IconButtonAttrs } from "./IconButton"
import { theme } from "../theme"

export interface SidebarSectionRowAttrs {
	icon: AllIcons
	label: MaybeTranslation
	path: string
	onClick: ClickHandler
	moreButton: IconButtonAttrs
	iconColor?: string
	alwaysShowMoreButton?: boolean
	isSelectedPrefix?: string | boolean
	disabled?: boolean
	dropHandler?: (dropData: DropData) => unknown
}

/**
 * Selectable navigation row, typically used in the sidebar, like contact list or labels.
 */
export class SidebarSectionRow implements Component<SidebarSectionRowAttrs> {
	private hovered: boolean = false

	view({ attrs }: Vnode<SidebarSectionRowAttrs>): Children {
		const onHover = () => {
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

		const navButtonAttrs: NavButtonAttrs = {
			label: attrs.label,
			href: () => attrs.path,
			disableHoverBackground: true,
			disableSelectedBackground: true,
			click: attrs.onClick,
			onfocus: onHover,
			onkeydown: handleBackwardsTab,
			isSelectedPrefix: attrs.isSelectedPrefix,
			disabled: attrs.disabled,
			dropHandler: attrs.dropHandler ? (dropData) => assertNotNull(attrs.dropHandler)(dropData) : undefined,
		}

		return m(
			".folder-row.flex.flex-row.mlr-8.border-radius-4.state-bg",
			{
				style: { background: isNavButtonSelected(navButtonAttrs) ? theme.state_bg_hover : "" },
				onmouseenter: onHover,
				onmouseleave: () => {
					this.hovered = false
				},
			},
			[
				// we render icon on our own to be able to override the color and to control the padding
				m(
					".button-height.flex.items-center.plr-8",
					m(Icon, {
						icon: attrs.icon,
						size: IconSize.PX24,
						style: {
							fill: attrs.iconColor ?? (isNavButtonSelected(navButtonAttrs) ? theme.primary : theme.on_surface_variant),
						},
					}),
				),
				m(NavButton, navButtonAttrs),
				attrs.alwaysShowMoreButton || (!client.isMobileDevice() && this.hovered)
					? m(IconButton, {
							...attrs.moreButton,
							click: (event, dom) => {
								attrs.moreButton.click(event, dom)
							},
							onkeydown: handleForwardsTab,
						})
					: null,
			],
		)
	}
}
