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
	progress?: number
}

export class FilterChip implements Component<FilterChipAttrs> {
	private localdom: HTMLElement | null = null

	view({ attrs: { label, icon, selected, chevron, onClick, progress } }: Vnode<FilterChipAttrs>): Children {
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
					marginRight: px(16),
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
			m("div", {
				style: {
					position: "absolute",
					bottom: "0",
					left: "0",
					width: "100%",
					background: secondary_fixed,
					transition: "height 0.3s ease",
					zIndex: "1",
					height: progress == 1 ? 0 : px((progress ?? 1) * size.button_icon_bg_size),
				},
			}),
			[
				icon && progress != 1
					? m(Icon, {
							icon: icon,
							style: {
								fill: contentColor,
								zIndex: "2",
							},
					  })
					: null,
				m("span.text-ellipsis", { style: { zIndex: "2" } }, lang.getTranslationText(label)),
				chevron
					? m(Icon, {
							icon: BootIcons.Expand,
							style: {
								fill: contentColor,
								zIndex: "2",
							},
					  })
					: null,
			],
		)
	}
}
