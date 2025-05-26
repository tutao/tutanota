import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { AllIcons, Icon } from "./Icon"
import { BootIcons } from "./icons/BootIcons"
import { theme } from "../theme"
import { on_secondary_fixed, secondary_fixed } from "../builtinThemes"
import { ClickHandler } from "./GuiUtils"
import { assertNotNull } from "@tutao/tutanota-utils"
import { lang, Translation } from "../../misc/LanguageViewModel"
import { px, size } from "../size"

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
		let selectors = "button.flex.items-center.border-radius-m.pt-hpad-button.pb-hpad-button.gap-vpad-xs.font-weight-500.state-bg-2.border.smaller"
		if (icon) {
			selectors += ".pl-vpad-s"
		} else {
			selectors += ".pl-vpad-m"
		}
		if (chevron) {
			selectors += ".pr-vpad-s"
		} else {
			selectors += ".pr-vpad-m"
		}

		const contentColor = selected ? on_secondary_fixed : theme.content_fg
		return m(
			selectors,
			{
				style: {
					minHeight: px(size.button_icon_bg_size),
					...(selected
						? {
								background: secondary_fixed,
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
