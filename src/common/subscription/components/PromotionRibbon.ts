import m, { Component, Vnode } from "mithril"
import { theme } from "../../gui/theme"
import { styles } from "../../gui/styles"
import { px, size } from "../../gui/size"
import { Translation } from "../../misc/LanguageViewModel"
import { PlanBoxPosition } from "../utils/PlanSelectorUtils"

interface PromotionRibbonAttrs {
	translation: Translation
	planBoxPosition: Exclude<PlanBoxPosition, "bottom"> | "center"
	backgroundColor?: string
	color?: string
}

export class PromotionRibbon implements Component<PromotionRibbonAttrs> {
	view({ attrs: { translation, planBoxPosition, backgroundColor = theme.primary, color = theme.on_primary } }: Vnode<PromotionRibbonAttrs>) {
		const borderRadiusTopLeft = planBoxPosition === "left" || planBoxPosition === "center" ? px(size.border_radius_large) : "0"
		const borderRadiusTopRight = planBoxPosition === "right" || planBoxPosition === "center" ? px(size.border_radius_large) : "0"

		return m(
			".full-width.pt-xs.pb-xs.text-center.b.smaller",
			{
				style: {
					backgroundColor,
					color,
					...((!styles.isMobileLayout() || planBoxPosition === "center") && {
						"border-radius": `${borderRadiusTopLeft} ${borderRadiusTopRight} 0 0`,
					}),
				},
			},
			translation.text,
		)
	}
}
