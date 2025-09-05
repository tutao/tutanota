import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { AllIcons, Icon } from "./Icon"
import { BootIcons } from "./icons/BootIcons"
import { theme } from "../theme"
import { ClickHandler } from "./GuiUtils"
import { assertNotNull } from "@tutao/tutanota-utils"
import { lang, Translation } from "../../misc/LanguageViewModel"
import { component_size, px, size } from "../size"

export interface FilterChipAttrs {
	label: Translation
	icon?: AllIcons
	selected: boolean
	chevron: boolean
	onClick: ClickHandler
}

export class FilterChip implements Component<FilterChipAttrs> {
	private localdom: HTMLElement | null = null

	view({ attrs: { label, icon, selected, chevron, onClick } }: Vnode<FilterChipAttrs>): Children {
		let selectors = "button.flex.items-center.border-radius-8.pt-8.pb-8.gap-4.font-weight-500.state-bg-2.border.smaller"
		if (icon) {
			selectors += ".pl-8"
		} else {
			selectors += ".pl-16"
		}
		if (chevron) {
			selectors += ".pr-8"
		} else {
			selectors += ".pr-16"
		}

		const contentColor = selected ? theme.on_secondary_container : theme.on_surface
		return m(
			selectors,
			{
				style: {
					minHeight: px(component_size.button_icon_bg_size),
					...(selected
						? {
								background: theme.secondary_container,
								color: contentColor,
								"--state-bg-color": contentColor,
								"border-color": "transparent",
							}
						: {
								"border-color": theme.outline_variant,
							}),
				},
				ariaPressed: selected,
				oncreate: (vnode: VnodeDOM): void => {
					this.localdom = vnode.dom as HTMLElement
				},
				onclick: (e: MouseEvent) => {
					onClick(e, assertNotNull(this.localdom))
				},
				"data-testid": `btn:${lang.getTestId(label)}`,
			},
			[
				icon
					? m(Icon, {
							icon: icon,
							style: {
								fill: contentColor,
							},
						})
					: null,
				m("span.text-ellipsis", lang.getTranslationText(label)),
				chevron
					? m(Icon, {
							icon: BootIcons.Expand,
							style: {
								fill: contentColor,
							},
						})
					: null,
			],
		)
	}
}
