import m, { Component, Vnode } from "mithril"
import { Theme, theme } from "../../gui/theme"
import { styles } from "../../gui/styles"
import { px, size } from "../../gui/size"
import { Translation } from "../../misc/LanguageViewModel"
import { PlanBoxPosition } from "../utils/PlanSelectorUtils"

interface PromotionRibbonAttrs {
	translation: Translation
	planBoxPosition: Exclude<PlanBoxPosition, "bottom"> | "center"
	localTheme?: Theme
}

export class PromotionRibbon implements Component<PromotionRibbonAttrs> {
	view({ attrs: { translation, planBoxPosition, localTheme = theme } }: Vnode<PromotionRibbonAttrs>) {
		const borderRadiusTopLeft = planBoxPosition === "left" || planBoxPosition === "center" ? px(size.border_radius_large) : "0"
		const borderRadiusTopRight = planBoxPosition === "right" || planBoxPosition === "center" ? px(size.border_radius_large) : "0"

		return m(
			".full-width.pt-xs.pb-xs.text-center.b.smaller.abs",
			{
				style: {
					backgroundColor: localTheme?.tertiary,
					color: localTheme?.on_tertiary,
					transform: "translateY(-100%)",
					"border-radius": `${px(size.border_radius_large)} ${px(size.border_radius_large)} 0 0`,
				},
			},
			translation.text,
		)
	}
}
